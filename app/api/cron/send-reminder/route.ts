import { NextResponse } from 'next/server'
import { getAllAppointments, getParent } from '@/lib/db'
import { sendEmail, appointmentReminderEmail } from '@/lib/mailer'
import { redis } from '@/lib/redis'
import { tg, tgEsc } from '@/lib/telegram'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Runs daily at 09:00 UTC (vercel.json: "0 9 * * *")
// Sends:
//   - "today" reminder for appointments scheduled today
//   - "tomorrow" reminder for appointments scheduled tomorrow
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStr     = now.toISOString().slice(0, 10)
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10)

  const appointments = await getAllAppointments()
  const scheduled = appointments.filter(a => a.status === 'scheduled' && a.meetingUrl)

  let sent = 0; let skipped = 0; let errors = 0

  for (const appt of scheduled) {
    const isToday    = appt.date === todayStr
    const isTomorrow = appt.date === tomorrowStr
    if (!isToday && !isTomorrow) continue

    const when: 'today' | 'tomorrow' = isToday ? 'today' : 'tomorrow'
    const dedupKey = `reminder:${when}:${appt.id}`

    // Skip if already sent this reminder
    const alreadySent = await redis.get(dedupKey)
    if (alreadySent) { skipped++; continue }

    try {
      const parent = await getParent(appt.parentId)
      if (!parent?.email || !appt.meetingUrl) { skipped++; continue }

      await sendEmail({
        to:      parent.email,
        subject: when === 'today'
          ? `🔔 جلستك اليوم في ${appt.timeSlot} — أكاديمية أمين`
          : `📅 تذكير: جلستك غداً في ${appt.timeSlot} — أكاديمية أمين`,
        html: appointmentReminderEmail(
          `${parent.firstName} ${parent.lastName}`,
          when,
          appt.date,
          appt.timeSlot,
          appt.type,
          appt.meetingUrl,
        ),
      })

      // Mark as sent — expires after 48h to allow re-sending if ever needed
      await redis.set(dedupKey, '1', { ex: 48 * 3600 })

      // Notify admin via Telegram
      tg(
        `${when === 'today' ? '🔔' : '📅'} تذكير أُرسل إلى ${tgEsc(parent.firstName)} ${tgEsc(parent.lastName)}\n` +
        `📧 ${tgEsc(parent.email)}\n` +
        `⏰ ${tgEsc(appt.date)} • ${tgEsc(appt.timeSlot)} (${when === 'today' ? 'اليوم' : 'غداً'})`
      ).catch(() => {})

      sent++
    } catch (e) {
      console.error('[send-reminder] failed for', appt.id, e)
      errors++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, checkedDate: todayStr })
}
