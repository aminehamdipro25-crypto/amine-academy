'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Video, MessageCircle, FileText, Brain, Zap, Star } from 'lucide-react'

type Currency = 'QAR' | 'TND'

const PLANS = [
  {
    id: 'basic',
    name: 'الأساسي',
    prices: { QAR: 179, TND: 49 },
    period: 'شهرياً',
    color: 'border-gray-200',
    headerBg: 'bg-white',
    headerText: 'text-gray-900',
    priceText: 'text-gray-900',
    badge: null,
    badgeColor: '',
    subtitle: 'للبدء والتقييم',
    icon: Zap,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    features: [
      { text: 'برنامج تمارين أسبوعي مخصص', ok: true },
      { text: 'مكتبة 25+ تمرين علمي (APA + CBT)', ok: true },
      { text: 'تقرير شهري بالتقدم', ok: true },
      { text: 'دعم عبر البريد الإلكتروني', ok: true },
      { text: 'جلسة تفاعلية بالفيديو', ok: false },
      { text: 'بروتوكول تعديل السلوك (ABA)', ok: false },
      { text: 'تقرير الذكاء الاصطناعي', ok: false },
    ],
    cta: 'ابدأ الأساسي',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
  },
  {
    id: 'standard',
    name: 'المتقدم',
    prices: { QAR: 369, TND: 99 },
    period: 'شهرياً',
    color: 'border-brand-400 ring-4 ring-brand-100',
    headerBg: 'bg-brand-600',
    headerText: 'text-white',
    priceText: 'text-white',
    badge: '⭐ الأكثر طلباً',
    badgeColor: 'bg-white text-brand-700',
    subtitle: 'الخيار الأمثل للأسر',
    icon: Video,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا الأساسي', ok: true },
      { text: 'جلسة تفاعلية شهرية بالفيديو مع الأستاذ', ok: true },
      { text: 'نظام مناطق التنظيم (Zone of Regulation)', ok: true },
      { text: 'تقارير أسبوعية لولي الأمر', ok: true },
      { text: 'واتساب مباشر مع الأستاذ', ok: true },
      { text: 'تعديل البرنامج حسب التطور', ok: true },
      { text: 'تقرير الذكاء الاصطناعي ربعياً', ok: false },
    ],
    cta: 'ابدأ المتقدم',
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50 font-black',
  },
  {
    id: 'premium',
    name: 'المتميز',
    prices: { QAR: 659, TND: 179 },
    period: 'شهرياً',
    color: 'border-amber-300',
    headerBg: 'bg-gradient-to-bl from-amber-500 to-orange-500',
    headerText: 'text-white',
    priceText: 'text-white',
    badge: '👑 VIP',
    badgeColor: 'bg-white text-amber-700',
    subtitle: 'رعاية متكاملة لا تُضاهى',
    icon: Star,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا المتقدم', ok: true },
      { text: '2 جلسات تفاعلية بالفيديو شهرياً', ok: true },
      { text: 'بروتوكول ABA + PEERS كامل', ok: true },
      { text: 'تقارير يومية لولي الأمر', ok: true },
      { text: 'مراسلة غير محدودة 24/7', ok: true },
      { text: 'خطة تغذية مكملة للتركيز', ok: true },
      { text: 'تقرير شامل بالذكاء الاصطناعي فصلياً', ok: true },
    ],
    cta: 'ابدأ المتميز',
    ctaStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:opacity-90 font-black',
  },
]

const CURRENCY_SYMBOLS: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }
const CURRENCY_LABELS: Record<Currency, string> = { QAR: '🇶🇦 قطر (ر.ق)', TND: '🇹🇳 تونس (د.ت)' }

export default function PlansSection() {
  const [currency, setCurrency] = useState<Currency>('QAR')

  return (
    <section className="py-20 bg-gray-50" id="plans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            خطط الاشتراك
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            استثمار في مستقبل طفلك
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            برامج علمية تجمع الرياضة المعدّلة (APA) مع تعديل السلوك (ABA) وتدريب التركيز (CBT)
            — في جلسات تفاعلية مباشرة مع الأستاذ أمين.
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-1.5 flex gap-1 shadow-sm">
            {(['QAR', 'TND'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
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
            <p className="font-black text-sm mb-1">كيف تعمل الجلسة التفاعلية؟</p>
            <p className="text-white/70 text-xs leading-relaxed">
              اتصال فيديو مباشر مع الأستاذ أمين • الطفل يؤدي التمارين أمام الشاشة •
              تغذية راجعة فورية • توجيه الوالد لكيفية المتابعة اليومية في البيت
            </p>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon
            const price = plan.prices[currency]
            const symbol = CURRENCY_SYMBOLS[currency]
            return (
              <div key={plan.id}
                className={`rounded-2xl border-2 overflow-hidden bg-white relative transition-shadow hover:shadow-xl ${plan.color}`}>
                {plan.badge && (
                  <div className={`absolute top-4 left-4 text-xs font-black px-3 py-1 rounded-full ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                <div className={`${plan.headerBg} p-6`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.iconBg}`}>
                    <PlanIcon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className={`font-black text-xl ${plan.headerText}`}>{plan.name}</h3>
                  <p className={`text-sm mt-0.5 ${plan.headerText} opacity-70`}>{plan.subtitle}</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className={`text-3xl font-black ltr-num ${plan.priceText}`}>{price}</span>
                    <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {plan.period}</span>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text}
                        className={`flex items-start gap-2 text-sm ${f.ok ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.ok ? 'text-green-500' : 'text-gray-200'}`} />
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={`block w-full text-center font-bold py-3.5 rounded-xl transition-all ${plan.ctaStyle}`}>
                    {plan.cta} ←
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          {[
            { icon: MessageCircle, text: 'تواصل مباشر على واتساب', sub: 'لأي استفسار' },
            { icon: FileText, text: 'لا عقود طويلة الأمد', sub: 'إلغاء في أي وقت' },
            { icon: Brain, text: 'نتائج مضمونة علمياً', sub: 'مبنية على أبحاث دولية' },
          ].map(({ icon: Icon, text, sub }) => (
            <div key={text} className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5 text-brand-500" />
              <p className="font-bold text-gray-700 text-sm">{text}</p>
              <p className="text-gray-400 text-xs">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
