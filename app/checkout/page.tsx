'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Check, ChevronRight, CreditCard, Building2, Smartphone, MessageCircle,
  User, Mail, Phone, CheckCircle2, Copy, ExternalLink, Clock, Calendar, Zap,
} from 'lucide-react'

type Plan = 'session' | 'weekly' | 'monthly'
type Currency = 'QAR' | 'TND'
type PaymentMethod = 'fawran' | 'bank_transfer_qa' | 'bank_transfer_tn' | 'whatsapp'

interface PlanInfo {
  id: Plan
  name: string
  prices: { QAR: number; TND: number }
  period: string
  badge?: string
  badgeColor: string
  icon: typeof Clock
  features: string[]
}

const PLANS: Record<Plan, PlanInfo> = {
  session: {
    id: 'session',
    name: 'الحصة المفردة',
    prices: { QAR: 49, TND: 15 },
    period: 'حصة',
    badge: undefined,
    badgeColor: '',
    icon: Clock,
    features: [
      'جلسة تفاعلية مباشرة بالفيديو مع الأستاذ أمين',
      'برنامج تمارين مخصص لهذه الحصة',
      'مكتبة 60+ تمرين علمي',
      'لا اشتراك — ادفع فقط عند الحجز',
    ],
  },
  weekly: {
    id: 'weekly',
    name: 'الباقة الأسبوعية',
    prices: { QAR: 169, TND: 49 },
    period: 'أسبوع',
    badge: '⭐ الأكثر طلباً',
    badgeColor: 'bg-brand-600',
    icon: Calendar,
    features: [
      'جلسات تفاعلية مباشرة أسبوعياً مع الأستاذ',
      'برنامج تمارين يتكيّف مع تطور الطفل',
      'مكتبة 60+ تمرين علمي (APA + ABA + CBT)',
      'تقارير تقدم مفصّلة لولي الأمر',
      'يُجدَّد أسبوعياً • إلغاء في أي وقت',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'الباقة الشهرية',
    prices: { QAR: 549, TND: 149 },
    period: 'شهر',
    badge: '💎 الأفضل قيمة',
    badgeColor: 'bg-amber-500',
    icon: Zap,
    features: [
      'جلسات تفاعلية مباشرة شهرياً مع الأستاذ',
      'برنامج تمارين يتكيّف مع تطور الطفل',
      'مكتبة 60+ تمرين علمي (APA + ABA + CBT)',
      'تقارير تقدم مفصّلة لولي الأمر بعد كل حصة',
      'واتساب مباشر مع الأستاذ للمتابعة اليومية',
      'يُجدَّد تلقائياً • إلغاء في أي وقت',
    ],
  },
}

const CURRENCY_SYMBOL: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }

interface PublicSettings {
  prices: Record<Plan, Record<Currency, number>>
  discountPct: number
  discountLabel: string
  sessionsPerWeek: number
  sessionsPerMonth: number
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const rawPlan = searchParams.get('plan') ?? 'weekly'
  // Accept both old (basic/standard/premium) and new (session/weekly/monthly) keys
  const planParam: Plan = rawPlan === 'basic' ? 'session'
    : rawPlan === 'standard' ? 'weekly'
    : rawPlan === 'premium'  ? 'monthly'
    : (['session','weekly','monthly'].includes(rawPlan) ? rawPlan as Plan : 'weekly')
  const currencyParam = (searchParams.get('currency') ?? 'QAR') as Currency

  const [plan, setPlan] = useState<Plan>(planParam)
  const [currency, setCurrency] = useState<Currency>(currencyParam)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [name, setName] = useState(searchParams.get('name') ?? '')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ referenceCode: string; paymentId: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [settings, setSettings] = useState<PublicSettings | null>(null)

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {})
  }, [])

  const planInfo = PLANS[plan]
  const basePrice = settings?.prices?.[plan]?.[currency] ?? planInfo.prices[currency]
  const discountPct = settings?.discountPct ?? 0
  const finalPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice
  const symbol = CURRENCY_SYMBOL[currency]

  const sessionsPerWeek  = settings?.sessionsPerWeek  ?? 4
  const sessionsPerMonth = settings?.sessionsPerMonth ?? 16

  function sessionCountLabel(p: Plan): string | null {
    if (p === 'weekly')  return `${sessionsPerWeek} حصص / أسبوع`
    if (p === 'monthly') return `${sessionsPerMonth} حصة / شهر`
    return null
  }

  function perSessionPrice(p: Plan, ccy: Currency): string {
    const price = settings?.prices?.[p]?.[ccy] ?? PLANS[p].prices[ccy]
    const disc  = discountPct > 0 ? Math.round(price * (1 - discountPct / 100)) : price
    const sym   = CURRENCY_SYMBOL[ccy]
    if (p === 'weekly')  { const pps = Math.round(disc / sessionsPerWeek);  return `≈ ${pps} ${sym} / حصة` }
    if (p === 'monthly') { const pps = Math.round(disc / sessionsPerMonth); return `≈ ${pps} ${sym} / حصة` }
    return `${disc} ${sym} / حصة`
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+97430653759'

  function copyRef(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!method) { setError('يرجى اختيار طريقة الدفع'); return }
    if (!name.trim() || !email.trim() || !phone.trim()) { setError('يرجى ملء جميع الحقول'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, currency, guestName: name, guestEmail: email, guestPhone: phone, method }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'حدث خطأ'); return }
      setSuccess({ referenceCode: data.referenceCode, paymentId: data.paymentId })
    } catch {
      setError('تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً')
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ──────────────────────────────────────────
  if (success) {
    const waText = encodeURIComponent(
      `مرحباً، أود تأكيد اشتراكي في أكاديمية أمين.\nالخطة: ${planInfo.name}\nرمز المرجع: ${success.referenceCode}\nالمبلغ: ${finalPrice} ${symbol}`
    )
    const waLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${waText}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">تم استلام طلبك! 🎉</h1>
          <p className="text-gray-500 mb-6">سيتم مراجعة دفعتك وتفعيل اشتراكك خلال 24 ساعة</p>

          <div className="bg-brand-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-brand-600 font-bold mb-2">رمز المرجع الخاص بك</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black text-brand-700 tracking-widest" dir="ltr">
                {success.referenceCode}
              </span>
              <button
                onClick={() => copyRef(success.referenceCode)}
                className="p-2 rounded-lg bg-brand-100 hover:bg-brand-200 transition-colors"
                title="نسخ"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-brand-600" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">احتفظ بهذا الرمز لمتابعة طلبك</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-right">
            <p className="text-sm font-bold text-amber-800 mb-1">الخطوة التالية:</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              أرسل إثبات الدفع عبر واتساب مع ذكر رمز المرجع <strong>{success.referenceCode}</strong> لتسريع تفعيل اشتراكك.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              أرسل إثبات الدفع عبر واتساب
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/activate"
              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              <Check className="w-5 h-5" />
              فعّل حسابك برمز البريد الإلكتروني
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Payment method instructions ─────────────────────────────
  function MethodInstructions({ m, refCode }: { m: PaymentMethod; refCode?: string }) {
    if (m === 'fawran') return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
        <p className="font-bold mb-1">ادفع عبر فوران (فوراً)</p>
        <p>أرسل المبلغ <strong>{finalPrice} {symbol}</strong> إلى رقم فوران: <strong dir="ltr">30653759</strong></p>
        <p className="mt-1">ثم أرسل لقطة الشاشة عبر واتساب مع رمز المرجع <strong>{refCode ?? '...'}</strong></p>
      </div>
    )
    if (m === 'bank_transfer_qa') return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 leading-relaxed">
        <p className="font-bold mb-1">تحويل بنكي — قطر (Commercial Bank)</p>
        <p>الاسم: <strong>AMINE HAMDI</strong></p>
        <p className="mt-1">IBAN: <span dir="ltr" className="font-mono font-bold text-xs">QA49CBQA0000004620515300190001</span></p>
        <p className="mt-1">المرجع: <strong>{refCode ?? '...'}</strong></p>
        <p className="mt-1 text-xs text-green-600">* يرجى ذكر رمز المرجع في خانة الملاحظات عند التحويل</p>
      </div>
    )
    if (m === 'bank_transfer_tn') return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 leading-relaxed">
        <p className="font-bold mb-1">تحويل بريدي — تونس (La Poste / CCP)</p>
        <p>الاسم: <strong>HAMDI AMINE B JALOUL</strong></p>
        <p className="mt-1">IBAN: <span dir="ltr" className="font-mono font-bold text-xs">TN59 1780 1000 0002 1931 0870</span></p>
        <p className="mt-0.5">رمز SWIFT: <span dir="ltr" className="font-mono font-bold">LPTNTNTT</span></p>
        <p className="mt-1">المرجع: <strong>{refCode ?? '...'}</strong></p>
        <p className="mt-1 text-xs text-green-600">* يرجى ذكر رمز المرجع في خانة الملاحظات عند التحويل</p>
      </div>
    )
    if (m === 'whatsapp') return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 leading-relaxed">
        <p className="font-bold mb-1">الدفع عبر واتساب</p>
        <p>أرسل رسالة واتساب مع إثبات الدفع إلى: <strong dir="ltr">{whatsappNumber}</strong></p>
        <p className="mt-1">اذكر رمز المرجع <strong>{refCode ?? '...'}</strong> في رسالتك</p>
      </div>
    )
    return null
  }

  // ── Main Checkout Form ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
            <ChevronRight className="w-4 h-4" />
            العودة
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm">إتمام الاشتراك</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-brand-600 text-white scale-110' :
                step > s  ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Plan selection */}
            <div className={`bg-white rounded-2xl border-2 p-6 transition-all ${step === 1 ? 'border-brand-300 shadow-md' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <span className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">١</span>
                  اختر خيارك
                </h2>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs text-brand-600 font-bold hover:underline">تعديل</button>
                )}
              </div>

              {step === 1 && (
                <>
                  {/* Currency toggle */}
                  <div className="flex gap-2 mb-4">
                    {(['QAR', 'TND'] as Currency[]).map(c => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          currency === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {c === 'QAR' ? '🇶🇦 قطر (ر.ق)' : '🇹🇳 تونس (د.ت)'}
                      </button>
                    ))}
                  </div>

                  {/* Plan cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.values(PLANS) as PlanInfo[]).map(p => {
                      const price = settings?.prices?.[p.id]?.[currency] ?? p.prices[currency]
                      const disc = discountPct > 0 ? Math.round(price * (1 - discountPct / 100)) : null
                      const displayPrice = disc ?? price
                      const sessLabel = sessionCountLabel(p.id)
                      const PlanIcon = p.icon
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPlan(p.id)}
                          className={`relative text-right p-4 rounded-xl border-2 transition-all ${
                            plan === p.id ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {p.badge && (
                            <span className={`absolute -top-2 right-3 text-xs text-white px-2 py-0.5 rounded-full font-bold ${p.badgeColor}`}>
                              {p.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <PlanIcon className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            <p className="font-black text-gray-900 text-sm">{p.name}</p>
                          </div>
                          {/* Session count badge */}
                          {sessLabel && (
                            <div className="mb-2">
                              <span className="text-[11px] font-black bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                                {sessLabel}
                              </span>
                            </div>
                          )}
                          <div>
                            {disc !== null ? (
                              <div>
                                <span className="text-lg font-black text-brand-700">{disc}</span>
                                <span className="text-xs text-gray-400 line-through mr-1">{price}</span>
                                <span className="text-xs text-gray-500"> {symbol}/{p.period}</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-lg font-black text-gray-800">{price}</span>
                                <span className="text-xs text-gray-500"> {symbol}/{p.period}</span>
                              </div>
                            )}
                          </div>
                          {/* Per-session equivalent */}
                          {p.id !== 'session' && (
                            <p className="text-[10px] text-gray-400 mt-1">{perSessionPrice(p.id, currency)}</p>
                          )}
                          {plan === p.id && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="mt-4 w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 rounded-xl transition-colors"
                  >
                    التالي — إدخال بياناتك ←
                  </button>
                </>
              )}

              {step > 1 && (
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="font-bold text-gray-700">{planInfo.name}</span>
                  {sessionCountLabel(plan) && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs font-black bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{sessionCountLabel(plan)}</span>
                    </>
                  )}
                  <span className="text-gray-400">·</span>
                  <span className="font-black text-brand-600">{finalPrice} {symbol}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{currency === 'QAR' ? '🇶🇦 قطر' : '🇹🇳 تونس'}</span>
                </div>
              )}
            </div>

            {/* Step 2: Personal info */}
            {step >= 2 && (
              <div className={`bg-white rounded-2xl border-2 p-6 transition-all ${step === 2 ? 'border-brand-300 shadow-md' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                    <span className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">٢</span>
                    بياناتك الشخصية
                  </h2>
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-xs text-brand-600 font-bold hover:underline">تعديل</button>
                  )}
                </div>

                {step === 2 && (
                  <form onSubmit={(e) => { e.preventDefault(); if (name && email && phone) setStep(3) }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          <User className="w-4 h-4 inline ml-1" />
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          placeholder="مثال: أحمد محمد الراشد"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          <Mail className="w-4 h-4 inline ml-1" />
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="example@email.com"
                          dir="ltr"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition-colors text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          <Phone className="w-4 h-4 inline ml-1" />
                          رقم الهاتف / واتساب
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          required
                          placeholder={currency === 'QAR' ? '+974 xxxx xxxx' : '+216 xx xxx xxx'}
                          dir="ltr"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 transition-colors text-right"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-5 w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 rounded-xl transition-colors"
                    >
                      التالي — اختر طريقة الدفع ←
                    </button>
                  </form>
                )}

                {step > 2 && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>{name}</strong></p>
                    <p dir="ltr" className="text-right">{email}</p>
                    <p dir="ltr" className="text-right">{phone}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment method */}
            {step >= 3 && (
              <div className="bg-white rounded-2xl border-2 border-brand-300 shadow-md p-6">
                <h2 className="font-black text-gray-900 text-lg flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">٣</span>
                  طريقة الدفع
                </h2>

                <div className="space-y-3 mb-5">
                  {currency === 'QAR' && (
                    <button
                      type="button"
                      onClick={() => setMethod('fawran')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        method === 'fawran' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'fawran' ? 'bg-brand-600' : 'bg-gray-100'}`}>
                        <Smartphone className={`w-5 h-5 ${method === 'fawran' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">فوران (FAWRAN)</p>
                        <p className="text-xs text-gray-400">الدفع الفوري — قطر</p>
                      </div>
                      {method === 'fawran' && <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />}
                    </button>
                  )}

                  {currency === 'QAR' && (
                    <button
                      type="button"
                      onClick={() => setMethod('bank_transfer_qa')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        method === 'bank_transfer_qa' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'bank_transfer_qa' ? 'bg-brand-600' : 'bg-gray-100'}`}>
                        <Building2 className={`w-5 h-5 ${method === 'bank_transfer_qa' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">تحويل بنكي — قطر</p>
                        <p className="text-xs text-gray-400">Commercial Bank of Qatar</p>
                      </div>
                      {method === 'bank_transfer_qa' && <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />}
                    </button>
                  )}

                  {currency === 'TND' && (
                    <button
                      type="button"
                      onClick={() => setMethod('bank_transfer_tn')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        method === 'bank_transfer_tn' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'bank_transfer_tn' ? 'bg-brand-600' : 'bg-gray-100'}`}>
                        <Building2 className={`w-5 h-5 ${method === 'bank_transfer_tn' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">تحويل بنكي — تونس</p>
                        <p className="text-xs text-gray-400">La Poste / CCP</p>
                      </div>
                      {method === 'bank_transfer_tn' && <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMethod('whatsapp')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                      method === 'whatsapp' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'whatsapp' ? 'bg-brand-600' : 'bg-gray-100'}`}>
                      <MessageCircle className={`w-5 h-5 ${method === 'whatsapp' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">واتساب</p>
                      <p className="text-xs text-gray-400">أرسل إثبات الدفع مباشرة</p>
                    </div>
                    {method === 'whatsapp' && <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />}
                  </button>
                </div>

                {method && <MethodInstructions m={method} />}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={loading || !method}
                    className={`mt-5 w-full font-black py-4 rounded-xl transition-all text-white text-base ${
                      loading || !method
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        جارٍ إرسال الطلب...
                      </span>
                    ) : (
                      `تأكيد الطلب — ${finalPrice} ${symbol} ✓`
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 sticky top-24">
              <h3 className="font-black text-gray-900 mb-4">ملخص الطلب</h3>

              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">الخيار</span>
                  <span className="font-bold text-gray-900">{planInfo.name}</span>
                </div>
                {sessionCountLabel(plan) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">عدد الحصص</span>
                    <span className="font-black text-brand-600">{sessionCountLabel(plan)}</span>
                  </div>
                )}
                {plan !== 'session' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">سعر الحصة</span>
                    <span className="font-bold text-gray-500">{perSessionPrice(plan, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">العملة</span>
                  <span className="font-bold text-gray-900">{currency === 'QAR' ? '🇶🇦 ريال قطري' : '🇹🇳 دينار تونسي'}</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">السعر الأصلي</span>
                    <span className="text-gray-400 line-through">{basePrice} {symbol}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="font-black text-gray-900">المجموع</span>
                <span className="font-black text-brand-700 text-xl">{finalPrice} {symbol}</span>
              </div>

              {/* Features */}
              <div className="mt-4 space-y-2">
                {planInfo.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>لا يتطلب بطاقة ائتمانية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
