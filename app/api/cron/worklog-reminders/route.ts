import { NextResponse } from 'next/server'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { tgEsc, tgSend } from '@/lib/telegram'
import {
  dueReminders, durationText, endTime, formatDuration, formatMoney, googleDirectionsUrl,
  lessonStartLocal, lessonWho, wallClockIn, type WorkClient, type WorkLesson, type WorkSettings,
} from '@/lib/worklog'
import { REMINDERS_LAST_RUN_KEY, loadAllWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The per-lesson alarm («قبل ساعة»), sent to the owner's Telegram so it
// reaches a locked phone. Browser notifications only fire while a dashboard
// tab is open, and a subscribed calendar refreshes on the phone's schedule,
// not ours — neither is a reminder you can rely on.
//
// Called every 5 minutes by .github/workflows/worklog-reminders.yml (Vercel's
// cron on this plan runs daily at most). A lesson is due from its reminder
// moment until it starts, so a late or skipped run still sends it, as long as
// the lesson has not begun.
//
// The "sent" mark is keyed by the lesson's date, start and reminder, so moving
// a lesson re-arms it; and it is written only after Telegram accepted the
// message, so a failed send is retried on the next run.

function sentKey(l: WorkLesson): string {
  return `worklog:tg-reminded:${l.id}:${l.date}T${l.start}:${l.reminderMin}`
}

function message(l: WorkLesson, c: WorkClient | undefined, settings: WorkSettings, minutesLeft: number): string {
  const lines = [
    `⏰ <b>بعد ${tgEsc(durationText(minutesLeft))}: حصة ${tgEsc(lessonWho(l, c))}</b>`,
    `🕒 ${l.start}–${endTime(l.start, l.durationMin)} · ${tgEsc(formatDuration(l.durationMin))} · ${tgEsc(formatMoney(l.price, settings.currency))}`,
  ]
  if (c?.address) lines.push(`📍 ${tgEsc(c.address)}`)
  if (c?.location) lines.push(`🧭 <a href="${googleDirectionsUrl(c.location)}">الطريق في الخرائط</a>`)
  if (c?.phone) lines.push(`📞 ${tgEsc(c.phone)}`)
  if (l.note) lines.push(`📝 ${tgEsc(l.note)}`)
  return lines.join('\n')
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (!safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return NextResponse.json({ error: 'telegram not configured' }, { status: 503 })
  }

  const { clients, lessons, settings } = await loadAllWork()
  const now = wallClockIn(settings.timezone)
  const byId = new Map(clients.map(c => [c.id, c]))

  // Only the lessons whose reminder window is open right now; then the ones not yet sent.
  const due = dueReminders(lessons, now, new Set())
  let sent = 0, skipped = 0, failed = 0
  for (const l of due) {
    const key = sentKey(l)
    if (await redis.get(key)) { skipped++; continue }
    const minutesLeft = Math.max(1, Math.round((lessonStartLocal(l).getTime() - now.getTime()) / 60_000))
    if (await tgSend(message(l, byId.get(l.clientId), settings, minutesLeft))) {
      // Long enough to outlive the lesson; short enough not to pile up.
      await redis.set(key, '1', { ex: 3 * 24 * 3600 })
      sent++
    } else {
      failed++
    }
  }

  // Lets the settings page say whether reminders actually go out — that the
  // schedule runs AND that Telegram accepted the last ones, not one without the other.
  await redis.set(REMINDERS_LAST_RUN_KEY, { at: new Date().toISOString(), sent, failed })
  // A failed send turns the GitHub run red, so a broken bot is seen rather than silent.
  return NextResponse.json({ ok: failed === 0, due: due.length, sent, skipped, failed }, { status: failed ? 502 : 200 })
}
