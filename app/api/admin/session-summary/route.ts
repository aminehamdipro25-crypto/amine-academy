import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createSessionSummary, getSessionSummaries, getStudent, getParent } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const ENGAGEMENT = ['high', 'medium', 'low'] as const

// GET ?studentId= — list a child's in-person session summaries (newest first).
export async function GET(req: NextRequest) {
  if (!(await isDashboardUser())) return NextResponse.json({ summaries: [] }, { status: 401 })
  const studentId = str(new URL(req.url).searchParams.get('studentId'), 100)
  if (!studentId) return NextResponse.json({ summaries: [] })
  const summaries = await getSessionSummaries(studentId)
  return NextResponse.json({ summaries })
}

// POST — file a one-tap in-person session summary and optionally email the parent.
export async function POST(req: NextRequest) {
  if (!(await isDashboardUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => null)
    const studentId = str(body?.studentId, 100)
    if (!studentId) return NextResponse.json({ error: 'اختر الطفل أولاً' }, { status: 400 })

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطفل غير موجود' }, { status: 404 })

    const note = str(body?.note, 1200)
    if (!note) return NextResponse.json({ error: 'اكتب ملاحظة قصيرة لولي الأمر' }, { status: 400 })

    const engagement = ENGAGEMENT.includes(body?.engagement) ? body.engagement : 'medium'
    const activities = Array.isArray(body?.activities)
      ? body.activities.slice(0, 20).map((a: unknown) => str(a, 80)).filter(Boolean)
      : []
    const durationMin = Math.max(0, Math.min(600, Math.round(Number(body?.durationMin) || 0)))
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.date)) ? String(body.date) : new Date().toISOString().slice(0, 10)

    const summary = await createSessionSummary({
      studentId,
      parentId: student.parentId,
      date,
      durationMin,
      engagement,
      activities,
      note,
      nextFocus: str(body?.nextFocus, 400) || undefined,
      specialist: str(body?.specialist, 120) || undefined,
    })

    // Optional parent email — best-effort, never blocks the save.
    let emailed = false
    if (body?.notifyParent) {
      try {
        const parent = await getParent(student.parentId)
        if (parent?.email) {
          const childName = `${student.firstName} ${student.lastName}`.trim()
          const engAr = engagement === 'high' ? 'تفاعل مرتفع' : engagement === 'low' ? 'تفاعل منخفض' : 'تفاعل متوسط'
          const acts = activities.length ? `<p style="margin:8px 0"><b>ما عملنا عليه:</b> ${activities.join('، ')}</p>` : ''
          const nf = summary.nextFocus ? `<p style="margin:8px 0"><b>تركيز المرحلة القادمة:</b> ${summary.nextFocus}</p>` : ''
          const base = process.env.NEXT_PUBLIC_BASE_URL || ''
          const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#1f2937;line-height:1.8">
            <h2 style="color:#4C1D95;margin:0 0 6px">ملخّص حصة ${childName}</h2>
            <p style="color:#6b7280;margin:0 0 12px">${date}${durationMin ? ` · ${durationMin} دقيقة` : ''} · ${engAr}</p>
            <p style="margin:8px 0">${note.replace(/</g, '&lt;')}</p>
            ${acts}${nf}
            ${base ? `<p style="margin:16px 0"><a href="${base}/parent/dashboard" style="background:#4C1D95;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">افتح بوابة الأولياء</a></p>` : ''}
            <p style="color:#9ca3af;font-size:12px;margin-top:16px">أكاديمية أمين — متابعة تطوّر طفلكم</p>
          </div>`
          await sendEmail({ to: parent.email, subject: `ملخّص حصة ${childName} — أكاديمية أمين`, html, text: note })
          emailed = true
        }
      } catch (e) {
        console.error('[session-summary email]', e)
      }
    }

    return NextResponse.json({ ok: true, summary, emailed })
  } catch (e) {
    console.error('[session-summary POST]', e)
    return NextResponse.json({ error: 'تعذّر حفظ الملخّص' }, { status: 500 })
  }
}
