import { NextResponse } from 'next/server'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { sendEmail } from '@/lib/mailer'
import { tgSend } from '@/lib/telegram'
import { baseUrl } from '@/lib/base-url'
import { round2, wallClockIn, todayIn } from '@/lib/worklog'
import { budgetStatus, eveningDue, eveningMessage, unmarkedLessons } from '@/lib/worklog-evening'
import { EVENING_LAST_RUN_KEY, loadAllWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The evening check: lessons that are over but were never marked «تمّت» or
// «ألغيت». They count for nothing — not in income, not in what a family owes —
// so one message a day lists them, with the day's spending and what is left of
// the monthly budget.
//
// Called every 5 minutes by .github/workflows/worklog-reminders.yml (so the
// owner's chosen hour is kept) and once a day by vercel.json as a safety net.
// It sends from the chosen hour until midnight, at most once a day, and only
// when something is left unmarked; the "sent" mark is written only after a
// channel accepted the message.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (!safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { clients, lessons, expenses, settings } = await loadAllWork()
  const now = wallClockIn(settings.timezone)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const today = todayIn(settings.timezone)
  if (!eveningDue(settings.eveningCheckAt, nowMin)) {
    return NextResponse.json({ ok: true, skipped: settings.eveningCheckAt === null ? 'disabled' : 'not-yet' })
  }
  const dedupKey = `worklog-evening:${today}`
  if (await redis.get(dedupKey)) return NextResponse.json({ ok: true, skipped: 'already-sent', date: today })

  const unmarked = unmarkedLessons(lessons, today, nowMin)
  const spentToday = round2(expenses.filter(e => e.date === today && !e.recurringId).reduce((s, e) => s + e.amount, 0))
  const msg = eveningMessage({
    unmarked, clients, currency: settings.currency, link: `${baseUrl()}/dashboard/work-log`, spentToday,
    budget: settings.expenseBudget ? budgetStatus(expenses, settings.expenseBudget, today, today) : null,
  })
  if (!msg) return NextResponse.json({ ok: true, skipped: 'all-marked', date: today })

  const channels: string[] = []
  if (await tgSend(msg.telegram)) channels.push('telegram')
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (to) {
    try {
      await sendEmail({ to, subject: msg.subject, html: msg.html })
      channels.push('email')
    } catch (e) {
      console.error('[worklog-evening] email failed', (e as Error).message)
    }
  }
  await redis.set(EVENING_LAST_RUN_KEY, { at: new Date().toISOString(), date: today, channels, unmarked: unmarked.today.length + unmarked.earlier.length })
  if (!channels.length) {
    return NextResponse.json({ ok: false, error: 'no channel accepted the evening check (Telegram/email not configured or failing)', date: today }, { status: 502 })
  }
  await redis.set(dedupKey, '1', { ex: 3 * 24 * 3600 })
  return NextResponse.json({ ok: true, date: today, unmarked: unmarked.today.length + unmarked.earlier.length, channels })
}
