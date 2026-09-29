import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser, getDashboardActorId } from '@/lib/auth'
import { getStaff } from '@/lib/db'
import { createTeachingSession, getAllTeachingSessions } from '@/lib/teaching-sessions'
import type { TeachingSession } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    return NextResponse.json(await getAllTeachingSessions())
  } catch (e) {
    console.error('[teaching-sessions GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const teacherId    = String(body.teacherId || '').trim()
    const learnerName  = String(body.learnerName || '').trim().slice(0, 120)
    const language     = String(body.language || 'french').trim()
    const dateISO      = String(body.dateISO || '').slice(0, 10)
    const durationHours = Number(body.durationHours)
    const price        = Number(body.price)
    const currency     = body.currency === 'TND' ? 'TND' : 'QAR'
    const status: TeachingSession['status'] =
      ['scheduled', 'completed', 'paid'].includes(body.status) ? body.status : 'completed'
    const note = String(body.note || '').trim().slice(0, 400)

    if (!teacherId || !learnerName) {
      return NextResponse.json({ error: 'الأستاذ واسم المتعلّم مطلوبان' }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      return NextResponse.json({ error: 'التاريخ غير صالح' }, { status: 400 })
    }
    if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
      return NextResponse.json({ error: 'مدّة الحصّة غير صالحة' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'السعر غير صالح' }, { status: 400 })
    }

    const teacher = await getStaff(teacherId)
    if (!teacher) return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 })

    // Snapshot the teacher's share at log time; allow an explicit per-session
    // override, otherwise use the teacher's configured share (default 0).
    const sharePct = body.teacherSharePct !== undefined && body.teacherSharePct !== '' && body.teacherSharePct !== null
      ? Math.min(100, Math.max(0, Number(body.teacherSharePct) || 0))
      : (teacher.teacherSharePct ?? 0)

    const session = await createTeachingSession({
      teacherId,
      teacherName: teacher.name,
      learnerName,
      language,
      dateISO,
      durationHours,
      price,
      currency,
      teacherSharePct: sharePct,
      status,
      note,
      createdBy: (await getDashboardActorId()) || 'owner',
    })
    return NextResponse.json(session, { status: 201 })
  } catch (e) {
    console.error('[teaching-sessions POST]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
