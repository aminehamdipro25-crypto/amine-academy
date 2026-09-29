export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'
import { sendEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

// Amine Languages — capture a language-learning enquiry (from the /languages
// landing or after a placement test). Stored in Redis and pushed to the owner
// via email + Telegram so Amine can follow up and assign a teacher.

const LANGUAGES = ['french', 'english', 'arabic', 'spanish', 'german', 'italian']
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']

function clean(v: unknown, max = 200): string {
  return String(v ?? '').trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  try {
    const rl = await isRateLimited(`lang_lead:${getClientIp(req)}`, 8, 3600)
    if (rl.limited) {
      return NextResponse.json(
        { error: rl.unavailable ? 'الخدمة غير متوفرة مؤقتاً' : 'حاول مجدداً بعد قليل' },
        { status: rl.unavailable ? 503 : 429 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const name  = clean(body.name, 120)
    const email = clean(body.email, 254).toLowerCase()
    const phone = clean(body.phone, 40)
    const goal  = clean(body.goal, 600)
    const note  = clean(body.note, 600)
    const language = LANGUAGES.includes(body.language) ? body.language : 'french'
    const level    = CEFR.includes(body.level) ? body.level : 'unknown'
    const source   = clean(body.source, 40) || 'landing'

    if (!name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 })
    }
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 })
    }

    const id = randomUUID()
    const lead = {
      id, name, email, phone, language, level, goal, note, source,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    }

    // Dedupe by phone within the last year so the same person can't spam.
    const phoneKey = `language_lead_phone:${phone.replace(/[^\d+]/g, '')}`
    const existing = await redis.get<string>(phoneKey)
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true, message: 'طلبك مسجّل مسبقاً — سنتواصل معك قريباً.' })
    }

    await redis.set(`language_lead:${id}`, lead)
    await redis.lpush('language_leads:index', id)
    await redis.set(phoneKey, id, { ex: 60 * 60 * 24 * 365 })

    // ── Notify the owner (best-effort; never block the response) ──
    const langLabel: Record<string, string> = {
      french: 'الفرنسية 🇫🇷', english: 'الإنجليزية 🇬🇧', arabic: 'العربية', spanish: 'الإسبانية 🇪🇸',
      german: 'الألمانية 🇩🇪', italian: 'الإيطالية 🇮🇹',
    }
    const summary =
      `🗣️ طلب جديد — أمين للّغات\n` +
      `الاسم: ${name}\n` +
      `اللغة: ${langLabel[language] || language}\n` +
      `المستوى: ${level === 'unknown' ? 'غير محدّد' : level}\n` +
      `الهاتف: ${phone}\n` +
      (email ? `البريد: ${email}\n` : '') +
      (goal ? `الهدف: ${goal}\n` : '') +
      `المصدر: ${source === 'placement' ? 'اختبار تحديد المستوى' : 'صفحة اللغات'}`

    tg(
      `<b>🗣️ طلب جديد — أمين للّغات</b>\n` +
      `الاسم: ${tgEsc(name)}\n` +
      `اللغة: ${tgEsc(langLabel[language] || language)}\n` +
      `المستوى: ${tgEsc(level)}\n` +
      `الهاتف: ${tgEsc(phone)}\n` +
      (email ? `البريد: ${tgEsc(email)}\n` : '') +
      (goal ? `الهدف: ${tgEsc(goal)}\n` : ''),
    ).catch(() => {})

    const notifyTo = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER
    if (notifyTo) {
      sendEmail({
        to: notifyTo,
        subject: `🗣️ طلب لغة جديد — ${name} (${language})`,
        text: summary,
        html: `<div style="font-family:system-ui,Arial;direction:rtl;text-align:right">
          <h2 style="color:#6B46F0">🗣️ طلب جديد — أمين للّغات</h2>
          <p><b>الاسم:</b> ${name}</p>
          <p><b>اللغة:</b> ${langLabel[language] || language}</p>
          <p><b>المستوى:</b> ${level === 'unknown' ? 'غير محدّد' : level}</p>
          <p><b>الهاتف:</b> ${phone}</p>
          ${email ? `<p><b>البريد:</b> ${email}</p>` : ''}
          ${goal ? `<p><b>الهدف:</b> ${goal}</p>` : ''}
          <p style="color:#888"><b>المصدر:</b> ${source}</p>
        </div>`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: 'تعذّر إرسال الطلب — حاول مجدداً' }, { status: 500 })
  }
}
