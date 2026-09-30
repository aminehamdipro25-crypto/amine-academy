import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { createBooking, getAllBookings } from '@/lib/language-bookings'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { getStaff } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function learnerId(): Promise<string | null> {
  const store = await cookies()
  return (await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value))?.id ?? null
}

// GET: the learner's own bookings.
export async function GET() {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const all = await getAllBookings()
  return NextResponse.json({ bookings: all.filter(b => b.learnerId === id) })
}

// POST {at, note}: request a lesson slot with the assigned teacher.
export async function POST(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const rl = await isRateLimited(`lang_book:${getClientIp(req)}`, 20, 3600)
  if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة — حاول لاحقاً' }, { status: 429 })

  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!learner.teacherId) return NextResponse.json({ error: 'لم يُعيّن لك أستاذ بعد' }, { status: 400 })

  const { at, note } = (await req.json().catch(() => ({}))) as { at?: string; note?: string }
  const when = String(at || '').trim()
  if (!when) return NextResponse.json({ error: 'اختر موعداً' }, { status: 400 })

  const booking = await createBooking({
    learnerId: id, learnerName: learner.name,
    teacherId: learner.teacherId, teacherName: learner.teacherName || '',
    language: learner.language,
    at: when.slice(0, 60), durationHours: 1, price: 0, currency: 'QAR',
    note: String(note || '').trim().slice(0, 200),
  })

  // Notify the teacher (email) + owner (Telegram) — best-effort.
  const summary = `📅 حجز حصّة جديد\nالتلميذ: ${learner.name}\nالموعد المقترح: ${when}\n${note ? `ملاحظة: ${note}` : ''}`
  tg(`<b>📅 حجز حصّة جديد</b>\nالتلميذ: ${tgEsc(learner.name)}\nالموعد: ${tgEsc(when)}`).catch(() => {})
  const teacher = await getStaff(learner.teacherId)
  if (teacher?.email) {
    sendEmail({
      to: teacher.email, subject: '📅 حجز حصّة جديد من تلميذك',
      text: summary,
      html: `<div style="font-family:system-ui,Arial;direction:rtl;text-align:right"><h2 style="color:#6B46F0">📅 حجز حصّة جديد</h2><p><b>التلميذ:</b> ${learner.name}</p><p><b>الموعد المقترح:</b> ${when}</p>${note ? `<p><b>ملاحظة:</b> ${note}</p>` : ''}<p style="color:#888">أكّد الحجز من لوحتك: حجوزات الحصص.</p></div>`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, booking })
}
