import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { LANGUAGE_PACKAGES, getPackage, createLangPayment, getAllLangPayments } from '@/lib/lang-payments'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { tg, tgEsc } from '@/lib/telegram'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function learnerId(): Promise<string | null> {
  const store = await cookies()
  return (await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value))?.id ?? null
}

// GET: packages, the learner's remaining credits, and their payment requests.
export async function GET() {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const requests = (await getAllLangPayments()).filter(p => p.learnerId === id)
  return NextResponse.json({ packages: LANGUAGE_PACKAGES, credits: learner.sessionCredits || 0, requests })
}

// POST {packageId, method, currency}: record a package purchase request (manual pay).
export async function POST(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const rl = await isRateLimited(`lang_purchase:${getClientIp(req)}`, 15, 3600)
  if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة — حاول لاحقاً' }, { status: 429 })

  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const { packageId, method, currency } = (await req.json().catch(() => ({}))) as { packageId?: string; method?: string; currency?: string }
  const pkg = getPackage(String(packageId || ''))
  if (!pkg) return NextResponse.json({ error: 'باقة غير صالحة' }, { status: 400 })
  const cur = currency === 'TND' ? 'TND' : 'QAR'
  const m = ['fawran', 'bank', 'whatsapp'].includes(method || '') ? method as 'fawran' | 'bank' | 'whatsapp' : 'whatsapp'

  const pay = await createLangPayment({
    learnerId: id, learnerName: learner.name, packageId: pkg.id,
    packageName: pkg.ar, sessions: pkg.sessions,
    amount: cur === 'TND' ? pkg.tnd : pkg.qar, currency: cur, method: m,
  })

  const label = `💳 طلب باقة لغة\n${learner.name} — ${pkg.ar}\nالمبلغ: ${pay.amount} ${cur === 'TND' ? 'د.ت' : 'ر.ق'}\nالطريقة: ${m}`
  tg(`<b>💳 طلب باقة لغة</b>\n${tgEsc(learner.name)} — ${tgEsc(pkg.ar)}\n${pay.amount} ${cur === 'TND' ? 'د.ت' : 'ر.ق'}`).catch(() => {})
  const notifyTo = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER
  if (notifyTo) sendEmail({ to: notifyTo, subject: `💳 طلب باقة لغة — ${learner.name}`, text: label, html: `<div style="font-family:system-ui;direction:rtl;text-align:right"><h3 style="color:#6B46F0">💳 طلب باقة لغة</h3><p>${learner.name} — ${pkg.ar}</p><p>${pay.amount} ${cur === 'TND' ? 'د.ت' : 'ر.ق'} · ${m}</p><p style="color:#888">أكّدها من «مدفوعات اللغات».</p></div>` }).catch(() => {})

  return NextResponse.json({ ok: true, payment: pay })
}
