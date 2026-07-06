'use client'
import { useState, useEffect } from 'react'
import { Check, Clock, Calendar, Brain, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

type PlanId = 'session' | 'weekly' | 'monthly'
type Currency = 'QAR' | 'TND'

interface PlanDef {
  id: PlanId
  name: string
  nameEn: string
  subtitle: string
  subtitleEn: string
  prices: Record<Currency, number>
  period: string
  periodEn: string
  sessionsLabel: string
  sessionsLabelEn: string
  badge: string | null
  badgeEn: string | null
  icon: typeof Clock
  popular: boolean
  features: string[]
  featuresEn: string[]
}

const PLANS: PlanDef[] = [
  {
    id: 'session',
    name: 'الحصة المفردة',
    nameEn: 'Single Session',
    subtitle: 'مرونة كاملة — جرّب دون التزام',
    subtitleEn: 'Full flexibility — no commitment',
    prices: { QAR: 49, TND: 15 },
    period: 'حصة',
    periodEn: 'session',
    sessionsLabel: 'حصة واحدة عند الطلب',
    sessionsLabelEn: 'One session on demand',
    badge: null,
    badgeEn: null,
    icon: Clock,
    popular: false,
    features: ['جلسة تفاعلية مباشرة', 'مكتبة 60+ تمرين', 'تقرير بعد الحصة', 'لا اشتراك شهري'],
    featuresEn: ['Live interactive session', '60+ exercise library', 'Post-session report', 'No monthly subscription'],
  },
  {
    id: 'weekly',
    name: 'الباقة الأسبوعية',
    nameEn: 'Weekly Package',
    subtitle: 'متابعة منتظمة بمرونة أسبوعية',
    subtitleEn: 'Regular follow-up with weekly flexibility',
    prices: { QAR: 169, TND: 49 },
    period: 'أسبوع',
    periodEn: 'week',
    sessionsLabel: '4 حصص / أسبوع',
    sessionsLabelEn: '4 sessions / week',
    badge: '⭐ الأكثر طلباً',
    badgeEn: '⭐ Most Popular',
    icon: Calendar,
    popular: true,
    features: ['4 حصص تفاعلية / أسبوع', 'برنامج يتكيف مع الطفل', 'تقارير مفصّلة أسبوعية', 'واتساب مباشر', 'إلغاء في أي وقت'],
    featuresEn: ['4 interactive sessions / week', 'Adaptive program', 'Detailed weekly reports', 'Direct WhatsApp', 'Cancel anytime'],
  },
  {
    id: 'monthly',
    name: 'الباقة الشهرية',
    nameEn: 'Monthly Package',
    subtitle: 'أفضل قيمة للتطور المستدام',
    subtitleEn: 'Best value for sustainable progress',
    prices: { QAR: 549, TND: 149 },
    period: 'شهر',
    periodEn: 'month',
    sessionsLabel: '16 حصة / شهر',
    sessionsLabelEn: '16 sessions / month',
    badge: '💎 الأفضل قيمة',
    badgeEn: '💎 Best Value',
    icon: Brain,
    popular: false,
    features: ['16 حصة تفاعلية / شهر', 'برنامج يتكيف أسبوعياً', 'تقارير يومية مفصّلة', 'أولوية في الحجز', 'توجيه الوالدين يومياً'],
    featuresEn: ['16 interactive sessions / month', 'Weekly-adaptive program', 'Detailed daily reports', 'Priority booking', 'Daily parent coaching'],
  },
]

interface PublicSettings {
  prices?: Record<string, Record<string, number>>
}

export default function UpgradePlanPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [currency, setCurrency] = useState<Currency>('QAR')
  const [apiPrices, setApiPrices] = useState<Record<string, Record<string, number>> | null>(null)
  const [currentPlan] = useState<PlanId | null>(null) // future: load from parent profile

  useEffect(() => {
    // Detect currency from geo
    fetch('/api/geo')
      .then(r => r.json())
      .then((d: { currency?: Currency }) => { if (d.currency) setCurrency(d.currency) })
      .catch(() => {})
    // Load real prices
    fetch('/api/public/settings')
      .then(r => r.json())
      .then((d: PublicSettings) => { if (d.prices) setApiPrices(d.prices) })
      .catch(() => {})
  }, [])

  const symbol = currency === 'QAR' ? 'ر.ق' : 'د.ت'

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">
          {isAr ? 'تغيير أو ترقية الباقة' : 'Change or Upgrade Plan'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? 'اختر الباقة التي تناسب احتياجاتك — يمكنك التغيير في أي وقت'
            : 'Choose the plan that suits your needs — you can change at any time'}
        </p>
      </div>

      {/* Currency Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-gray-500">{isAr ? 'العملة:' : 'Currency:'}</span>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-bold">
          {(['QAR', 'TND'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className="px-4 py-2 transition-colors"
              style={currency === c ? { background: '#6B46F0', color: '#fff' } : { background: '#fff', color: '#6B7280' }}
            >
              {c === 'QAR' ? '🇶🇦 ر.ق' : '🇹🇳 د.ت'}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const PlanIcon = p.icon
          const price = apiPrices?.[p.id]?.[currency] ?? p.prices[currency]
          const isCurrent = currentPlan === p.id
          const name = isAr ? p.name : p.nameEn
          const subtitle = isAr ? p.subtitle : p.subtitleEn
          const badge = isAr ? p.badge : p.badgeEn
          const sessionsLabel = isAr ? p.sessionsLabel : p.sessionsLabelEn
          const features = isAr ? p.features : p.featuresEn
          const period = isAr ? p.period : p.periodEn

          // Compute savings vs single session price
          const singlePrice = apiPrices?.session?.[currency] ?? PLANS[0].prices[currency]
          const sessionsInPeriod = p.id === 'weekly' ? 4 : p.id === 'monthly' ? 16 : 1
          const perSession = p.id !== 'session' ? Math.round(price / sessionsInPeriod) : null
          const savingsPct = perSession && perSession < singlePrice
            ? Math.round((1 - perSession / singlePrice) * 100)
            : 0

          return (
            <div
              key={p.id}
              className="rounded-3xl overflow-hidden relative flex flex-col"
              style={{
                border: p.popular ? '2px solid #6B46F0' : isCurrent ? '2px solid #22C55E' : '1px solid #E5E7EB',
                background: p.popular
                  ? 'linear-gradient(160deg, rgba(107,70,240,0.05) 0%, #fff 100%)'
                  : '#FFFFFF',
                boxShadow: p.popular ? '0 8px 32px rgba(107,70,240,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              {/* Badge */}
              {badge && (
                <div
                  className="absolute top-3 left-3 text-[10px] font-black px-3 py-1 rounded-full text-white"
                  style={{ background: p.popular ? '#6B46F0' : 'linear-gradient(135deg,#F59E0B,#F97316)' }}
                >
                  {badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3 text-[10px] font-black px-3 py-1 rounded-full text-white"
                  style={{ background: '#22C55E' }}>
                  {isAr ? '✓ باقتك الحالية' : '✓ Current plan'}
                </div>
              )}

              {/* Header */}
              <div className="p-5 pt-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(107,70,240,0.08)' }}>
                  <PlanIcon className="w-5 h-5" style={{ color: '#6B46F0' }} />
                </div>
                <h3 className="font-black text-lg text-gray-900">{name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                <span className="inline-block mt-2 text-xs font-black px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(107,70,240,0.07)', color: '#6B46F0' }}>
                  📅 {sessionsLabel}
                </span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black ltr-num text-gray-900">{price}</span>
                  <span className="text-sm text-gray-400">{symbol} / {period}</span>
                </div>
                {perSession && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">
                      ≈ {perSession} {symbol} / {isAr ? 'حصة' : 'session'}
                    </span>
                    {savingsPct > 0 && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ background: p.popular ? 'rgba(107,70,240,0.1)' : 'rgba(245,158,11,0.1)', color: p.popular ? '#6B46F0' : '#D97706' }}>
                        {isAr ? `وفّر ${savingsPct}%` : `Save ${savingsPct}%`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="px-5 pb-4 flex-1">
                <ul className="space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-5 pt-0">
                <a
                  href={`/checkout?plan=${p.id}&currency=${currency}`}
                  className="flex items-center justify-center gap-2 w-full font-black py-3 rounded-xl text-sm transition-all hover:opacity-90"
                  style={
                    isCurrent
                      ? { background: '#F3F4F6', color: '#6B7280', cursor: 'default', pointerEvents: 'none' }
                      : p.popular
                      ? { background: '#6B46F0', color: '#fff' }
                      : { background: 'rgba(107,70,240,0.08)', color: '#6B46F0', border: '1px solid rgba(107,70,240,0.18)' }
                  }
                >
                  {isCurrent
                    ? (isAr ? '✓ باقتك الحالية' : '✓ Your current plan')
                    : (isAr ? `اختر ${name}` : `Choose ${name}`)
                  }
                  {!isCurrent && <ArrowRight className="w-4 h-4" />}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* WhatsApp contact for custom plan */}
      <div
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'rgba(107,70,240,0.04)', border: '1px solid rgba(107,70,240,0.12)' }}
      >
        <MessageCircle className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: '#6B46F0' }} />
        <div className="flex-1">
          <p className="font-black text-sm text-gray-900 mb-1">
            {isAr ? 'هل تريد خطة مخصصة؟' : 'Want a custom plan?'}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isAr
              ? 'تواصل مع الأستاذ أمين مباشرة على واتساب لمناقشة احتياجات طفلك وإعداد خطة مخصصة.'
              : 'Contact Prof. Amine directly on WhatsApp to discuss your child\'s needs and set up a custom plan.'}
          </p>
        </div>
        <a
          href="https://wa.me/21612345678"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl text-white flex-shrink-0"
          style={{ background: '#25D366' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {isAr ? 'واتساب' : 'WhatsApp'}
        </a>
      </div>

    </div>
  )
}
