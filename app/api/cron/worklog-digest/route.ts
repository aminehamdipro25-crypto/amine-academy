import { NextResponse } from 'next/server'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { sendEmail } from '@/lib/mailer'
import { tgEsc, tgSend } from '@/lib/telegram'
import { baseUrl } from '@/lib/base-url'
import {
  clientBalances, endTime, formatDuration, formatMoney, googleDirectionsUrl, googleRouteUrl,
  sortLessons, todayIn, type GeoPoint,
} from '@/lib/worklog'
import { loadAllWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Morning summary of the day's home lessons (vercel.json: "0 4 * * *" — 07:00
// in Qatar, 05:00 in Tunisia). The per-lesson alarm is the phone calendar's job
// (the subscribed feed); this is the one message that arrives even when no
// tab is open and no calendar was subscribed: today's route, in order.
//
// The "sent" mark is written only AFTER a channel accepted the message, so a
// failed morning is retried by a manual run instead of being marked done.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (!safeCompare(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { clients, lessons, payments, settings } = await loadAllWork()
  if (!settings.dailyDigest) return NextResponse.json({ ok: true, skipped: 'disabled' })

  const today = todayIn(settings.timezone)
  const dedupKey = `worklog-digest:${today}`
  if (await redis.get(dedupKey)) return NextResponse.json({ ok: true, skipped: 'already-sent', date: today })

  const byId = new Map(clients.map(c => [c.id, c]))
  const todays = sortLessons(lessons.filter(l => l.date === today && l.status === 'scheduled'))
  const unconfirmed = lessons.filter(l => l.status === 'scheduled' && l.date < today).length
  const owed = clientBalances(clients, lessons, payments, today).filter(b => b.balance > 0)
  const owedTotal = owed.reduce((s, b) => s + b.balance, 0)

  // Nothing to say on a free day with nothing pending: no message at all.
  if (!todays.length && !unconfirmed) return NextResponse.json({ ok: true, skipped: 'nothing-today', date: today })

  const minutes = todays.reduce((s, l) => s + l.durationMin, 0)
  const value = todays.reduce((s, l) => s + l.price, 0)
  const stops = todays.map(l => byId.get(l.clientId)?.location).filter(Boolean) as GeoPoint[]
  const route = googleRouteUrl(stops)
  const link = `${baseUrl()}/dashboard/work-log`

  const rows = todays.map(l => {
    const c = byId.get(l.clientId)
    const who = c ? (c.childName ? `${c.childName} — ${c.name}` : c.name) : 'حصة'
    return { l, c, who }
  })

  const tgText = [
    `☀️ <b>حصص اليوم (${todays.length}) · ${formatDuration(minutes)} · ${tgEsc(formatMoney(value, settings.currency))}</b>`,
    ...rows.map(({ l, c, who }) =>
      `\n🕐 <b>${l.start}–${endTime(l.start, l.durationMin)}</b> ${tgEsc(who)}` +
      (c?.address ? `\n📍 ${tgEsc(c.address)}` : '') +
      (c?.location ? `\n🧭 <a href="${googleDirectionsUrl(c.location)}">الطريق</a>` : '')),
    route && stops.length > 1 ? `\n🗺️ <a href="${route}">مسار اليوم كاملاً</a>` : '',
    unconfirmed ? `\n⚠️ ${unconfirmed} حصة سابقة لم تُحدَّد حالتها (تمّت أم أُلغيت)` : '',
    owed.length ? `\n💰 مستحقات لدى ${owed.length} عائلة: ${tgEsc(formatMoney(owedTotal, settings.currency))}` : '',
    `\n<a href="${link}">فتح الدفتر</a>`,
  ].filter(Boolean).join('\n')

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
<h2 style="margin:0 0 4px">حصص اليوم (${todays.length})</h2>
<p style="margin:0 0 16px;color:#6b7280">${formatDuration(minutes)} · ${esc(formatMoney(value, settings.currency))}</p>
${rows.map(({ l, c, who }) => `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-bottom:8px">
<b>${l.start}–${endTime(l.start, l.durationMin)}</b> · ${esc(who)}
${c?.address ? `<div style="color:#6b7280;font-size:13px">${esc(c.address)}</div>` : ''}
${c?.location ? `<a href="${googleDirectionsUrl(c.location)}" style="font-size:13px">فتح الطريق في الخرائط</a>` : ''}
</div>`).join('')}
${route && stops.length > 1 ? `<p><a href="${route}">مسار اليوم كاملاً</a></p>` : ''}
${unconfirmed ? `<p style="color:#b45309">${unconfirmed} حصة سابقة لم تُحدَّد حالتها بعد.</p>` : ''}
${owed.length ? `<p>مستحقات لدى ${owed.length} عائلة: <b>${esc(formatMoney(owedTotal, settings.currency))}</b></p>` : ''}
<p><a href="${link}">فتح دفتر الحصص</a></p></div>`

  const channels: string[] = []
  if (await tgSend(tgText)) channels.push('telegram')
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (to) {
    try {
      await sendEmail({ to, subject: `☀️ حصص اليوم: ${todays.length} · ${formatDuration(minutes)}`, html })
      channels.push('email')
    } catch (e) {
      console.error('[worklog-digest] email failed', (e as Error).message)
    }
  }

  if (!channels.length) {
    return NextResponse.json({ ok: false, error: 'no channel accepted the digest (Telegram/email not configured or failing)', date: today }, { status: 502 })
  }
  await redis.set(dedupKey, '1', { ex: 3 * 24 * 3600 })
  return NextResponse.json({ ok: true, date: today, lessons: todays.length, channels })
}
