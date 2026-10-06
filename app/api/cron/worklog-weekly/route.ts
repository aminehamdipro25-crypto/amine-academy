import { NextResponse } from 'next/server'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { sendEmail } from '@/lib/mailer'
import { tgEsc, tgSend } from '@/lib/telegram'
import { baseUrl } from '@/lib/base-url'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'
import { todayIn } from '@/lib/worklog'
import { weeklyDigest, weeklyDigestLines } from '@/lib/worklog-planning'
import { loadAllWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sunday-morning summary of the work log (vercel.json: "15 4 * * 0" — 07:15
// in Qatar, the first day of the week there). Same channels and the same
// "sent only after a channel accepted it" rule as the morning digest.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (!safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { clients, lessons, payments, expenses, settings } = await loadAllWork()
  if (settings.weeklyDigest === false) return NextResponse.json({ ok: true, skipped: 'disabled' })
  if (!clients.length) return NextResponse.json({ ok: true, skipped: 'empty-ledger' })

  const today = todayIn(settings.timezone)
  const dedupKey = `worklog-weekly:${today}`
  if (await redis.get(dedupKey)) return NextResponse.json({ ok: true, skipped: 'already-sent', date: today })

  const byId = new Map(clients.map(c => [c.id, c]))
  const name = (id: string) => { const c = byId.get(id); return c ? (c.childName ? `${c.childName} (${c.name})` : c.name) : 'عائلة' }
  const day = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
  const d = weeklyDigest(clients, lessons, payments, expenses, today)
  const [title, ...rest] = weeklyDigestLines(d, name, settings.currency, day)
  const link = `${baseUrl()}/dashboard/work-log`

  const tgText = [`<b>${tgEsc(title)}</b>`, ...rest.map(tgEsc), '', `<a href="${link}">فتح الدفتر</a>`].join('\n')
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.8">
<h2 style="margin:0 0 12px">${esc(title)}</h2>
${rest.map(l => (l ? `<div>${esc(l)}</div>` : '<div style="height:8px"></div>')).join('\n')}
<p style="margin-top:16px"><a href="${link}">فتح دفتر الحصص</a></p></div>`

  const channels: string[] = []
  if (await tgSend(tgText)) channels.push('telegram')
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (to) {
    try {
      await sendEmail({ to, subject: title, html })
      channels.push('email')
    } catch (e) {
      console.error('[worklog-weekly] email failed', (e as Error).message)
    }
  }
  if (!channels.length) {
    return NextResponse.json({ ok: false, error: 'no channel accepted the summary (Telegram/email not configured or failing)', date: today }, { status: 502 })
  }
  await redis.set(dedupKey, '1', { ex: 8 * 24 * 3600 })
  return NextResponse.json({ ok: true, date: today, channels })
}
