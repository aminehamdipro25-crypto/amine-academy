import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createHomeAssignment, getHomeAssignments, getStudent, getParent } from '@/lib/db'
import { HOME_EXERCISE_IDS } from '@/lib/home-exercises'
import { sendEmail } from '@/lib/mailer'
import type { HomeAssignmentItem } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// GET ?studentId= — the child's home-plan history (newest first).
export async function GET(req: NextRequest) {
  if (!(await isDashboardUser())) return NextResponse.json({ assignments: [] }, { status: 401 })
  const studentId = str(new URL(req.url).searchParams.get('studentId'), 100)
  if (!studentId) return NextResponse.json({ assignments: [] })
  const assignments = await getHomeAssignments(studentId)
  return NextResponse.json({ assignments })
}

// POST — assign a new home plan and optionally email the parent.
export async function POST(req: NextRequest) {
  if (!(await isDashboardUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => null)
    const studentId = str(body?.studentId, 100)
    if (!studentId) return NextResponse.json({ error: 'اختر الطفل أولاً' }, { status: 400 })

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطفل غير موجود' }, { status: 404 })

    const rawItems = Array.isArray(body?.items) ? body.items : []
    const items: HomeAssignmentItem[] = rawItems.slice(0, 30).map((it: Record<string, unknown>) => {
      const kind = it?.kind === 'story' ? 'story' : 'exercise'
      return { kind, id: str(it?.id, 80), labelAr: str(it?.labelAr, 120), icon: str(it?.icon, 8) || undefined }
    }).filter((it: HomeAssignmentItem) =>
      it.id && it.labelAr && (it.kind === 'story' || HOME_EXERCISE_IDS.has(it.id)),
    )

    if (items.length === 0) return NextResponse.json({ error: 'اختر تمريناً أو قصّة واحدة على الأقل' }, { status: 400 })

    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.dueDate)) ? String(body.dueDate) : undefined

    const assignment = await createHomeAssignment({
      studentId,
      parentId: student.parentId,
      items,
      note: str(body?.note, 600) || undefined,
      dueDate,
      specialist: str(body?.specialist, 120) || undefined,
    })

    let emailed = false
    if (body?.notifyParent) {
      try {
        const parent = await getParent(student.parentId)
        if (parent?.email) {
          const childName = `${student.firstName} ${student.lastName}`.trim()
          const list = items.map(i => `<li style="margin:3px 0">${i.icon ? i.icon + ' ' : ''}${i.labelAr}</li>`).join('')
          const base = process.env.NEXT_PUBLIC_BASE_URL || ''
          const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#1f2937;line-height:1.8">
            <h2 style="color:#4C1D95;margin:0 0 6px">خطة ${childName} المنزلية هذا الأسبوع</h2>
            ${dueDate ? `<p style="color:#6b7280;margin:0 0 10px">يُستحسن إنجازها قبل: ${dueDate}</p>` : ''}
            <ul style="margin:8px 0;padding-inline-start:18px">${list}</ul>
            ${body?.note ? `<p style="margin:10px 0">${str(body.note, 600).replace(/</g, '&lt;')}</p>` : ''}
            ${base ? `<p style="margin:16px 0"><a href="${base}/parent/practice" style="background:#4C1D95;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">ابدأ التمارين المنزلية</a></p>` : ''}
            <p style="color:#9ca3af;font-size:12px;margin-top:16px">أكاديمية أمين</p>
          </div>`
          await sendEmail({ to: parent.email, subject: `خطة ${childName} المنزلية — أكاديمية أمين`, html, text: items.map(i => i.labelAr).join('، ') })
          emailed = true
        }
      } catch (e) {
        console.error('[home-assignment email]', e)
      }
    }

    return NextResponse.json({ ok: true, assignment, emailed })
  } catch (e) {
    console.error('[home-assignment POST]', e)
    return NextResponse.json({ error: 'تعذّر حفظ الخطة' }, { status: 500 })
  }
}
