'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Video, MessageCircle, FileText, Brain, Zap, Calendar, Clock } from 'lucide-react'
import { useLang } from '@/lib/i18n'

type Currency = 'QAR' | 'TND'
type BillingCycle = 'session' | 'weekly' | 'monthly'

interface PublicSettings {
  prices: {
    session:  { QAR: number; TND: number }
    weekly:   { QAR: number; TND: number }
    monthly:  { QAR: number; TND: number }
  }
  discountPct: number
  discountLabel: string
  offerDurationDays: number
}

// Unified feature list — same across all billing cycles
const FEATURES = [
  { text: 'جلسة تفاعلية مباشرة بالفيديو مع الأستاذ أمين',        textEn: 'Live 1-on-1 video session with Prof. Amine' },
  { text: 'برنامج تمارين مخصص يتكيّف أسبوعياً مع تطور الطفل',   textEn: 'Personalized exercise program, adapted weekly' },
  { text: 'مكتبة 60+ تمرين علمي (APA + ABA + CBT)',              textEn: '60+ scientific exercises (APA + ABA + CBT)' },
  { text: 'تقارير تقدم مفصّلة لولي الأمر بعد كل حصة',           textEn: 'Detailed progress reports for parents after each session' },
  { text: 'واتساب مباشر مع الأستاذ للمتابعة اليومية',            textEn: 'Direct WhatsApp with Prof. Amine for daily follow-up' },
  { text: 'تعديل البرنامج المستمر حسب استجابة الطفل',            textEn: 'Continuous program adjustments based on child\'s response' },
  { text: 'تقييم دوري بالذكاء الاصطناعي لرصد التطور',           textEn: 'Periodic AI-powered assessment to track progress' },
  { text: 'إرشادات يومية للوالدين لتطبيق البرنامج في المنزل',    textEn: 'Daily parent guidance for home program implementation' },
]

interface Plan {
  id: BillingCycle
  name: string
  nameEn: string
  subtitle: string
  subtitleEn: string
  prices: { QAR: number; TND: number }
  period: string
  periodEn: string
  perSession: { QAR: string; TND: string }
  savingsPct: number | null
  badge: string | null
  badgeEn: string | null
  badgeStyle: string
  cardStyle: string
  headerBg: string
  headerText: string
  priceText: string
  ctaText: string
  ctaTextEn: string
  ctaStyle: string
  icon: typeof Clock
}

const PLANS: Plan[] = [
  {
    id: 'session',
    name: 'الحصة المفردة',
    nameEn: 'Single Session',
    subtitle: 'مرونة كاملة — جرّب دون التزام',
    subtitleEn: 'Full flexibility — try with no commitment',
    prices: { QAR: 49, TND: 15 },
    period: 'حصة',
    periodEn: 'session',
    perSession: { QAR: '49 ر.ق / حصة', TND: '15 د.ت / حصة' },
    savingsPct: null,
    badge: null,
    badgeEn: null,
    badgeStyle: '',
    cardStyle: 'border border-gray-200 bg-white hover:shadow-lg',
    headerBg: 'bg-gray-50',
    headerText: 'text-gray-900',
    priceText: 'text-gray-900',
    ctaText: 'احجز حصة',
    ctaTextEn: 'Book a Session',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
    icon: Clock,
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
    perSession: { QAR: '~42 ر.ق / حصة', TND: '~12 د.ت / حصة' },
    savingsPct: 14,
    badge: '⭐ الأكثر طلباً',
    badgeEn: '⭐ Most Popular',
    badgeStyle: 'bg-brand-500 text-white',
    cardStyle: 'border-2 border-brand-500 ring-4 ring-brand-100 bg-gradient-to-b from-white to-brand-50 shadow-brand',
    headerBg: 'bg-brand-600',
    headerText: 'text-white',
    priceText: 'text-white',
    ctaText: 'اشترك أسبوعياً',
    ctaTextEn: 'Subscribe Weekly',
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50 font-black',
    icon: Calendar,
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
    perSession: { QAR: '~34 ر.ق / حصة', TND: '~9 د.ت / حصة' },
    savingsPct: 31,
    badge: '💎 الأفضل قيمة',
    badgeEn: '💎 Best Value',
    badgeStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white',
    cardStyle: 'border border-amber-300 bg-gradient-to-b from-white to-amber-50/40 hover:shadow-lg',
    headerBg: 'bg-gradient-to-bl from-amber-500 to-orange-500',
    headerText: 'text-white',
    priceText: 'text-white',
    ctaText: 'اشترك شهرياً',
    ctaTextEn: 'Subscribe Monthly',
    ctaStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:opacity-90 font-black',
    icon: Brain,
  },
]

const CURRENCY_SYMBOLS: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }
const CURRENCY_LABELS:  Record<Currency, string>  = { QAR: '🇶🇦 قطر (ر.ق)', TND: '🇹🇳 تونس (د.ت)' }

export default function PlansSection() {
  const [currency, setCurrency] = useState<Currency>('QAR')
  const [userChoseCurrency, setUserChoseCurrency] = useState(false)
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then((data: PublicSettings) => setSettings(data))
      .catch(() => {})
      .finally(() => setSettingsLoading(false))
  }, [])

  useEffect(() => {
    if (userChoseCurrency) return
    fetch('/api/geo')
      .then(r => r.json())
      .then((data: { country: string; currency: Currency }) => {
        if (!userChoseCurrency) setCurrency(data.currency)
      })
      .catch(() => {})
  }, [userChoseCurrency])

  return (
    <section className="py-20 bg-white" id="plans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            {isAr ? 'خيارات الاشتراك' : 'Subscription Options'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">
            {isAr ? 'نفس الجودة — تختار طريقة الدفع' : 'Same Quality — You Choose How to Pay'}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            {isAr
              ? 'كل الخيارات تمنحك الجلسة التفاعلية الكاملة مع الأستاذ أمين وجميع مزايا المنصة — الفرق الوحيد هو طريقة الاشتراك.'
              : 'Every option gives you the full interactive session with Prof. Amine and all platform features — the only difference is how you subscribe.'}
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-1.5 flex gap-1 shadow-sm">
            {(['QAR', 'TND'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => { setUserChoseCurrency(true); setCurrency(c) }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  currency === c
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {CURRENCY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* What's always included — unified features */}
        <div className="max-w-3xl mx-auto mb-12 bg-gray-50 border border-gray-100 rounded-3xl p-6">
          <p className="text-center text-sm font-black text-gray-500 uppercase tracking-wider mb-5">
            {isAr ? '✦ ما يشمله كل خيار بدون استثناء' : '✦ Included in every option, no exceptions'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{isAr ? f.text : f.textEn}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon
            const cycleKey = plan.id as keyof PublicSettings['prices']
            const basePrice = settings?.prices?.[cycleKey]?.[currency] ?? plan.prices[currency]
            const discountPct = settings?.discountPct ?? 0
            const discountedPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : null
            const symbol = CURRENCY_SYMBOLS[currency]
            const isPopular = plan.id === 'weekly'

            return (
              <div key={plan.id} className={`rounded-3xl overflow-hidden relative transition-all duration-200 ${plan.cardStyle}`}>

                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} text-xs font-black px-4 py-1.5 rounded-full ${plan.badgeStyle}`}>
                    {isAr ? plan.badge : (plan.badgeEn ?? plan.badge)}
                  </div>
                )}

                {/* Header */}
                <div className={`${plan.headerBg} p-6 pt-10`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isPopular ? 'bg-white/20' : plan.id === 'monthly' ? 'bg-white/20' : 'bg-brand-100'
                  }`}>
                    <PlanIcon className={`w-5 h-5 ${isPopular || plan.id === 'monthly' ? 'text-white' : 'text-brand-600'}`} />
                  </div>
                  <h3 className={`font-black text-xl ${plan.headerText}`}>{isAr ? plan.name : plan.nameEn}</h3>
                  <p className={`text-xs mt-1 ${plan.headerText} opacity-70`}>{isAr ? plan.subtitle : plan.subtitleEn}</p>

                  {/* Price */}
                  {settingsLoading ? (
                    <div className="mt-4 h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
                  ) : (
                    <div className="mt-4">
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-4xl font-black ltr-num ${plan.priceText}`}>{discountedPrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-45 line-through ltr-num`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {isAr ? plan.period : plan.periodEn}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-4xl font-black ltr-num ${plan.priceText}`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {isAr ? plan.period : plan.periodEn}</span>
                        </div>
                      )}
                      {/* Per-session equivalent */}
                      <div className={`mt-2 flex items-center gap-2 flex-wrap`}>
                        <span className={`text-xs ${plan.priceText} opacity-60`}>
                          {isAr ? plan.perSession[currency] : plan.perSession[currency]}
                        </span>
                        {plan.savingsPct && (
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isPopular ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isAr ? `وفّر ${plan.savingsPct}%` : `Save ${plan.savingsPct}%`}
                          </span>
                        )}
                      </div>
                      {discountedPrice !== null && settings?.discountLabel && (
                        <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 ${plan.priceText}`}>
                          {settings.discountLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="p-6">
                  <Link
                    href={`/checkout?plan=${plan.id}&currency=${currency}`}
                    className={`block w-full text-center font-bold py-3.5 rounded-xl transition-all ${
                      isPopular
                        ? 'bg-gradient-to-l from-brand-600 to-brand-500 text-white hover:opacity-90 font-black'
                        : plan.ctaStyle
                    }`}
                  >
                    {isAr ? `${plan.ctaText} ←` : `${plan.ctaTextEn} →`}
                  </Link>

                  {plan.id === 'monthly' && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                      {isAr ? 'يُجدَّد تلقائياً • إلغاء في أي وقت' : 'Auto-renews • Cancel anytime'}
                    </p>
                  )}
                  {plan.id === 'weekly' && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                      {isAr ? 'يُجدَّد أسبوعياً • إلغاء في أي وقت' : 'Auto-renews weekly • Cancel anytime'}
                    </p>
                  )}
                  {plan.id === 'session' && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                      {isAr ? 'لا اشتراك — ادفع فقط عند الحجز' : 'No subscription — pay only when you book'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Interactive session explainer */}
        <div className="max-w-2xl mx-auto mt-10 mb-2 bg-brand-900 rounded-2xl p-5 flex items-start gap-4 text-white">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-sm mb-1">
              {isAr ? 'كيف تعمل الجلسة التفاعلية؟' : 'How does the interactive session work?'}
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              {isAr
                ? 'اتصال فيديو مباشر مع الأستاذ أمين • الطفل يؤدي التمارين أمام الشاشة • تغذية راجعة فورية • توجيه الوالد لكيفية المتابعة اليومية في البيت'
                : 'Live video call with Prof. Amine • Child performs exercises on camera • Immediate feedback • Parent guidance for daily home follow-up'}
            </p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          {[
            {
              icon: MessageCircle,
              text: 'تواصل مباشر على واتساب',
              textEn: 'Direct WhatsApp Contact',
              sub: 'لأي استفسار قبل الحجز',
              subEn: 'For any inquiry before booking',
            },
            {
              icon: FileText,
              text: 'لا عقود — لا التزامات',
              textEn: 'No Contracts — No Lock-ins',
              sub: 'إلغاء الاشتراك في أي وقت',
              subEn: 'Cancel your subscription anytime',
            },
            {
              icon: Brain,
              text: 'نتائج مضمونة علمياً',
              textEn: 'Scientifically Backed Results',
              sub: 'مبنية على أبحاث APA وABA',
              subEn: 'Based on APA & ABA research',
            },
          ].map(({ icon: Icon, text, textEn, sub, subEn }) => (
            <div key={text} className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5 text-brand-500" />
              <p className="font-bold text-gray-700 text-sm">{isAr ? text : textEn}</p>
              <p className="text-gray-400 text-xs">{isAr ? sub : subEn}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
