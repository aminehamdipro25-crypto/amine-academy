'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Video, MessageCircle, FileText, Brain, Zap, Star } from 'lucide-react'
import { useLang } from '@/lib/i18n'

type Currency = 'QAR' | 'TND'

interface PublicSettings {
  prices: {
    basic:    { QAR: number; TND: number }
    standard: { QAR: number; TND: number }
    premium:  { QAR: number; TND: number }
  }
  discountPct: number
  discountLabel: string
  offerDurationDays: number
}

const PLANS = [
  {
    id: 'basic',
    name: 'الأساسي',
    nameEn: 'Basic',
    prices: { QAR: 179, TND: 49 },
    period: 'شهرياً',
    periodEn: 'monthly',
    color: 'border-gray-200',
    headerBg: 'bg-white',
    headerText: 'text-gray-900',
    priceText: 'text-gray-900',
    badge: null,
    badgeColor: '',
    subtitle: 'للبدء والتقييم',
    subtitleEn: 'To get started & assess',
    icon: Zap,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    features: [
      { text: 'برنامج تمارين أسبوعي مخصص', textEn: 'Personalized weekly exercise program', ok: true },
      { text: 'مكتبة 25+ تمرين علمي (APA + CBT)', textEn: '25+ scientific exercises library (APA + CBT)', ok: true },
      { text: 'تقرير شهري بالتقدم', textEn: 'Monthly progress report', ok: true },
      { text: 'دعم عبر البريد الإلكتروني', textEn: 'Email support', ok: true },
      { text: 'جلسة تفاعلية بالفيديو', textEn: 'Live video session', ok: false },
      { text: 'بروتوكول تعديل السلوك (ABA)', textEn: 'Behavior modification protocol (ABA)', ok: false },
      { text: 'تقرير الذكاء الاصطناعي', textEn: 'AI progress report', ok: false },
    ],
    cta: 'ابدأ الأساسي',
    ctaEn: 'Start Basic',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
  },
  {
    id: 'standard',
    name: 'المتقدم',
    nameEn: 'Advanced',
    prices: { QAR: 369, TND: 99 },
    period: 'شهرياً',
    periodEn: 'monthly',
    color: 'border-brand-400 ring-4 ring-brand-100',
    headerBg: 'bg-brand-600',
    headerText: 'text-white',
    priceText: 'text-white',
    badge: '⭐ الأكثر طلباً',
    badgeEn: '⭐ Most Popular',
    badgeColor: 'bg-white text-brand-700',
    subtitle: 'الخيار الأمثل للأسر',
    subtitleEn: 'The optimal choice for families',
    icon: Video,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا الأساسي', textEn: 'All Basic plan features', ok: true },
      { text: 'جلسة تفاعلية شهرية بالفيديو مع الأستاذ', textEn: 'Monthly live video session with the therapist', ok: true },
      { text: 'نظام مناطق التنظيم (Zone of Regulation)', textEn: 'Zone of Regulation system', ok: true },
      { text: 'تقارير أسبوعية لولي الأمر', textEn: 'Weekly reports for parents', ok: true },
      { text: 'واتساب مباشر مع الأستاذ', textEn: 'Direct WhatsApp with the therapist', ok: true },
      { text: 'تعديل البرنامج حسب التطور', textEn: 'Program adjusted per child\'s progress', ok: true },
      { text: 'تقرير الذكاء الاصطناعي ربعياً', textEn: 'Quarterly AI report', ok: false },
    ],
    cta: 'ابدأ المتقدم',
    ctaEn: 'Start Advanced',
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50 font-black',
  },
  {
    id: 'premium',
    name: 'المتميز',
    nameEn: 'Premium',
    prices: { QAR: 659, TND: 179 },
    period: 'شهرياً',
    periodEn: 'monthly',
    color: 'border-amber-300',
    headerBg: 'bg-gradient-to-bl from-amber-500 to-orange-500',
    headerText: 'text-white',
    priceText: 'text-white',
    badge: '👑 VIP',
    badgeEn: '👑 VIP',
    badgeColor: 'bg-white text-amber-700',
    subtitle: 'رعاية متكاملة لا تُضاهى',
    subtitleEn: 'Unmatched comprehensive care',
    icon: Star,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا المتقدم', textEn: 'All Advanced plan features', ok: true },
      { text: '2 جلسات تفاعلية بالفيديو شهرياً', textEn: '2 live video sessions per month', ok: true },
      { text: 'بروتوكول ABA + PEERS كامل', textEn: 'Full ABA + PEERS protocol', ok: true },
      { text: 'تقارير يومية لولي الأمر', textEn: 'Daily parent reports', ok: true },
      { text: 'مراسلة غير محدودة 24/7', textEn: 'Unlimited messaging 24/7', ok: true },
      { text: 'خطة تغذية مكملة للتركيز', textEn: 'Supplementary nutrition plan for focus', ok: true },
      { text: 'تقرير شامل بالذكاء الاصطناعي فصلياً', textEn: 'Comprehensive quarterly AI report', ok: true },
    ],
    cta: 'ابدأ المتميز',
    ctaEn: 'Start Premium',
    ctaStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:opacity-90 font-black',
  },
]

const CURRENCY_SYMBOLS: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }
const CURRENCY_LABELS: Record<Currency, string> = { QAR: '🇶🇦 قطر (ر.ق)', TND: '🇹🇳 تونس (د.ت)' }

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
        if (!userChoseCurrency) {
          setCurrency(data.currency)
        }
      })
      .catch(() => {})
  }, [userChoseCurrency])

  return (
    <section className="py-20 bg-gray-50" id="plans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            {isAr ? 'خطط الاشتراك' : 'Subscription Plans'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            {isAr ? 'استثمار في مستقبل طفلك' : "An Investment in Your Child's Future"}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {isAr
              ? 'برامج علمية تجمع الرياضة المعدّلة (APA) مع تعديل السلوك (ABA) وتدريب التركيز (CBT) — في جلسات تفاعلية مباشرة مع الأستاذ أمين.'
              : 'Scientific programs combining Adapted Physical Activity (APA), Behavior Modification (ABA), and Focus Training (CBT) — in live interactive sessions with Prof. Amine.'}
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

        {/* Interactive session banner */}
        <div className="max-w-2xl mx-auto mb-10 bg-brand-900 rounded-2xl p-5 flex items-start gap-4 text-white">
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
                : 'Live video call with Prof. Amine • Child performs exercises in front of the camera • Immediate feedback • Parent guidance on daily home follow-up'}
            </p>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon
            const planId = plan.id as 'basic' | 'standard' | 'premium'
            const basePrice = settings?.prices[planId]?.[currency] ?? plan.prices[currency]
            const discountPct = settings?.discountPct ?? 0
            const discountedPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : null
            const symbol = CURRENCY_SYMBOLS[currency]
            return (
              <div key={plan.id}
                className={`rounded-2xl border-2 overflow-hidden bg-white relative transition-shadow hover:shadow-xl ${plan.color}`}>
                {plan.badge && (
                  <div className={`absolute top-4 left-4 text-xs font-black px-3 py-1 rounded-full ${plan.badgeColor}`}>
                    {isAr ? plan.badge : (('badgeEn' in plan && plan.badgeEn) ? plan.badgeEn : plan.badge)}
                  </div>
                )}
                <div className={`${plan.headerBg} p-6`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.iconBg}`}>
                    <PlanIcon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className={`font-black text-xl ${plan.headerText}`}>{isAr ? plan.name : plan.nameEn}</h3>
                  <p className={`text-sm mt-0.5 ${plan.headerText} opacity-70`}>{isAr ? plan.subtitle : plan.subtitleEn}</p>
                  {settingsLoading ? (
                    <div className="mt-3 h-9 w-24 bg-white/20 rounded-xl animate-pulse" />
                  ) : (
                    <div className="mt-3">
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-3xl font-black ltr-num ${plan.priceText}`}>{discountedPrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-50 line-through ltr-num`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {isAr ? plan.period : plan.periodEn}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black ltr-num ${plan.priceText}`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {isAr ? plan.period : plan.periodEn}</span>
                        </div>
                      )}
                      {discountedPrice !== null && settings?.discountLabel && (
                        <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 ${plan.priceText}`}>
                          {settings.discountLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text}
                        className={`flex items-start gap-2 text-sm ${f.ok ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.ok ? 'text-green-500' : 'text-gray-200'}`} />
                        {isAr ? f.text : f.textEn}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={`block w-full text-center font-bold py-3.5 rounded-xl transition-all ${plan.ctaStyle}`}>
                    {isAr ? `${plan.cta} ←` : `${plan.ctaEn} →`}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          {[
            {
              icon: MessageCircle,
              text: 'تواصل مباشر على واتساب',
              textEn: 'Direct WhatsApp Contact',
              sub: 'لأي استفسار',
              subEn: 'For any inquiry',
            },
            {
              icon: FileText,
              text: 'لا عقود طويلة الأمد',
              textEn: 'No Long-Term Contracts',
              sub: 'إلغاء في أي وقت',
              subEn: 'Cancel anytime',
            },
            {
              icon: Brain,
              text: 'نتائج مضمونة علمياً',
              textEn: 'Scientifically Guaranteed Results',
              sub: 'مبنية على أبحاث دولية',
              subEn: 'Based on international research',
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
