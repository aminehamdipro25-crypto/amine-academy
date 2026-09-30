import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getStaff } from '@/lib/db'
import { getBooking, updateBooking } from '@/lib/language-bookings'
import { createTeachingSession } from '@/lib/teaching-sessions'
import { updateLearner, getLearner } from '@/lib/language-learners'
import type { LessonBooking } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PATCH { action, price?, durationHours?, link? }
//   confirm  → set price/duration/link, status=confirmed, push nextLesson to learner
//   complete → status=completed, auto-create a TeachingSession (earnings + portal)
//   cancel   → status=cancelled
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { id } = await params
  const booking = await getBooking(id)
  if (!booking) return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })

  const staffId = actor.startsWith('staff:') ? actor.slice(6) : null
  if (actor !== 'owner' && booking.teacherId !== staffId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')

  if (action === 'cancel') {
    await updateBooking(id, { status: 'cancelled' })
    return NextResponse.json({ ok: true })
  }

  if (action === 'confirm') {
    const updates: Partial<LessonBooking> = { status: 'confirmed' }
    if (Number.isFinite(Number(body.price))) updates.price = Math.max(0, Math.round(Number(body.price)))
    if (Number.isFinite(Number(body.durationHours)) && Number(body.durationHours) > 0) updates.durationHours = Number(body.durationHours)
    if (body.currency === 'TND' || body.currency === 'QAR') updates.currency = body.currency
    if (typeof body.link === 'string' && /^https?:\/\//i.test(body.link.trim())) updates.link = body.link.trim().slice(0, 500)
    await updateBooking(id, updates)
    // Surface it as the learner's "next lesson" (join button in their portal).
    if (updates.link) {
      await updateLearner(booking.learnerId, { nextLesson: { at: booking.at, link: updates.link, note: booking.note } }).catch(() => {})
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'complete') {
    if (booking.status === 'completed') return NextResponse.json({ ok: true, already: true })
    const teacher = await getStaff(booking.teacherId)
    const sharePct = teacher?.teacherSharePct ?? 0
    const price = booking.price || Number(body.price) || 0
    const session = await createTeachingSession({
      teacherId: booking.teacherId, teacherName: booking.teacherName,
      learnerName: booking.learnerName, learnerId: booking.learnerId,
      language: booking.language, dateISO: new Date().toISOString().slice(0, 10),
      durationHours: booking.durationHours || 1, price: Math.max(0, Math.round(price)),
      currency: booking.currency, teacherSharePct: sharePct, status: 'completed',
      note: 'من حجز', createdBy: actor,
    })
    await updateBooking(id, { status: 'completed', sessionId: session.id })
    // Clear the learner's "next lesson" once it's done.
    const learner = await getLearner(booking.learnerId)
    if (learner?.nextLesson?.link && learner.nextLesson.link === booking.link) {
      await updateLearner(booking.learnerId, { nextLesson: null }).catch(() => {})
    }
    return NextResponse.json({ ok: true, sessionId: session.id })
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
}
