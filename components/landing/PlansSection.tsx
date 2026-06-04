import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'الأساسي',
    price: 'XX',
    period: 'شهرياً',
    color: 'border-gray-200',
    headerColor: 'bg-gray-50',
    badge: null,
    features: [
      'برنامج تمارين أسبوعي',
      'تتبع التطور الأساسي',
      'الوصول لمكتبة التمارين',
      'تقرير شهري واحد',
      'دعم عبر البريد الإلكتروني',
    ],
    cta: 'ابدأ الأساسي',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
  },
  {
    id: 'standard',
    name: 'المتقدم',
    price: 'XX',
    period: 'شهرياً',
    color: 'border-brand-300',
    headerColor: 'bg-brand-600',
    badge: 'الأكثر طلباً',
    features: [
      'كل مزايا الأساسي',
      'برنامج مخصص بالكامل',
      'جلسة متابعة شهرية',
      'تقارير أسبوعية',
      'واتساب مباشر للاستفسارات',
      'تعديل البرنامج حسب التطور',
    ],
    cta: 'ابدأ المتقدم',
    ctaStyle: 'bg-brand-600 text-white hover:bg-brand-700',
  },
  {
    id: 'premium',
    name: 'المتميز',
    price: 'XX',
    period: 'شهرياً',
    color: 'border-gold-400',
    headerColor: 'bg-gradient-to-l from-gold-500 to-amber-600',
    badge: 'VIP',
    features: [
      'كل مزايا المتقدم',
      'جلستا متابعة شهرياً',
      'تقارير يومية للأولياء',
      'مراسلة غير محدودة',
      'برنامج غذاء مكمّل',
      'أولوية حجز المواعيد',
      'تقرير شامل فصلي بالـ AI',
    ],
    cta: 'ابدأ المتميز',
    ctaStyle: 'bg-gradient-to-l from-gold-500 to-amber-500 text-white hover:opacity-90',
  },
]

export default function PlansSection() {
  return (
    <section className="py-20 bg-gray-50" id="plans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            خطط الاشتراك
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            اختر الخطة المناسبة لطفلك
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            جميع الأسعار بالدينار التونسي (د.ت). يمكن الإلغاء في أي وقت.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id}
              className={`card-hover rounded-2xl border-2 overflow-hidden bg-white relative ${plan.color}`}>
              {plan.badge && (
                <div className="absolute top-4 left-4 bg-brand-600 text-white text-xs font-black px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              {/* Header */}
              <div className={`${plan.headerColor} p-6 ${plan.id === 'standard' ? 'text-white' : ''}`}>
                <h3 className={`font-black text-xl mb-2 ${plan.id === 'standard' ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black ltr-num ${plan.id === 'standard' ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.id === 'standard' ? 'text-white/70' : 'text-gray-500'}`}>
                    د.ت / {plan.period}
                  </span>
                </div>
              </div>
              {/* Features */}
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block w-full text-center font-bold py-3 rounded-xl transition-colors ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          * الأسعار ستُحدَّد قريباً — سجّل الآن بسعر التعريف المبكر
        </p>
      </div>
    </section>
  )
}
