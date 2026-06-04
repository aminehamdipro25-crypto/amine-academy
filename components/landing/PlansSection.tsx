import Link from 'next/link'
import { Check, Video, MessageCircle, FileText, Brain, Zap, Star } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'الأساسي',
    price: '49',
    currency: 'د.ت',
    period: 'شهرياً',
    color: 'border-gray-200',
    headerBg: 'bg-white',
    headerText: 'text-gray-900',
    badge: null,
    badgeColor: '',
    subtitle: 'للبدء والتقييم',
    icon: Zap,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    features: [
      { text: 'برنامج تمارين أسبوعي مخصص', included: true },
      { text: 'مكتبة 25+ تمرين علمي (APA+CBT)', included: true },
      { text: 'تقرير شهري بالتقدم', included: true },
      { text: 'دعم عبر البريد الإلكتروني', included: true },
      { text: 'جلسة متابعة بالفيديو', included: false },
      { text: 'نظام تعديل السلوك (ABA)', included: false },
      { text: 'تقييم ذكاء اصطناعي', included: false },
    ],
    cta: 'ابدأ الأساسي',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
  },
  {
    id: 'standard',
    name: 'المتقدم',
    price: '99',
    currency: 'د.ت',
    period: 'شهرياً',
    color: 'border-brand-400 ring-4 ring-brand-100',
    headerBg: 'bg-brand-600',
    headerText: 'text-white',
    badge: '⭐ الأكثر طلباً',
    badgeColor: 'bg-white text-brand-600',
    subtitle: 'الخيار الأمثل للأسر',
    icon: Video,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا الأساسي', included: true },
      { text: '1 جلسة تفاعلية شهرية بالفيديو', included: true },
      { text: 'نظام مناطق التنظيم (Zone of Regulation)', included: true },
      { text: 'تقارير أسبوعية للأولياء', included: true },
      { text: 'واتساب مباشر مع الأستاذ', included: true },
      { text: 'تعديل البرنامج حسب التطور', included: true },
      { text: 'تقييم ذكاء اصطناعي ربعي', included: false },
    ],
    cta: 'ابدأ المتقدم',
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50 font-black',
  },
  {
    id: 'premium',
    name: 'المتميز',
    price: '179',
    currency: 'د.ت',
    period: 'شهرياً',
    color: 'border-amber-300',
    headerBg: 'bg-gradient-to-bl from-amber-500 to-orange-500',
    headerText: 'text-white',
    badge: '👑 VIP',
    badgeColor: 'bg-white text-amber-600',
    subtitle: 'رعاية متكاملة لا تُضاهى',
    icon: Star,
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      { text: 'كل مزايا المتقدم', included: true },
      { text: '2 جلستا تفاعليتان بالفيديو شهرياً', included: true },
      { text: 'بروتوكول ABA + PEERS كامل', included: true },
      { text: 'تقارير يومية للأولياء', included: true },
      { text: 'مراسلة غير محدودة 24/7', included: true },
      { text: 'خطة تغذية مكملة للتركيز', included: true },
      { text: 'تقرير شامل بالذكاء الاصطناعي فصلياً', included: true },
    ],
    cta: 'ابدأ المتميز',
    ctaStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:opacity-90 font-black',
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
            استثمار في مستقبل طفلك
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            برامج علمية معتمدة تجمع الرياضة المعدّلة (APA) مع تعديل السلوك (ABA) وتدريب التركيز (CBT)
            — كل شيء في جلسة تفاعلية واحدة مع الأستاذ أمين.
          </p>
        </div>

        {/* Session highlight banner */}
        <div className="max-w-2xl mx-auto mb-10 bg-brand-900 rounded-2xl p-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-sm">كيف تعمل الجلسة التفاعلية؟</p>
            <p className="text-white/70 text-xs mt-0.5">
              اتصال فيديو مباشر مع الأستاذ أمين • تمارين حية يؤديها الطفل أمام الشاشة • تغذية راجعة فورية •
              توجيه الوالد على كيفية المتابعة اليومية في البيت
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const PlanIcon = plan.icon
            return (
              <div key={plan.id}
                className={`rounded-2xl border-2 overflow-hidden bg-white relative ${plan.color} transition-shadow hover:shadow-xl`}>
                {plan.badge && (
                  <div className={`absolute top-4 left-4 text-xs font-black px-3 py-1 rounded-full ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                {/* Header */}
                <div className={`${plan.headerBg} p-6 ${plan.headerText}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.iconBg}`}>
                    <PlanIcon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className={`font-black text-xl ${plan.headerText}`}>{plan.name}</h3>
                  <p className={`text-sm opacity-70 mt-0.5 ${plan.headerText}`}>{plan.subtitle}</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className={`text-3xl font-black ltr-num ${plan.headerText}`}>{plan.price}</span>
                    <span className={`text-sm opacity-70 ${plan.headerText}`}>{plan.currency} / {plan.period}</span>
                  </div>
                </div>
                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.included ? 'text-green-500' : 'text-gray-200'}`} />
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
            { icon: Brain, text: 'نتائج مضمونة علمياً', sub: 'مبني على أبحاث دولية' },
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
