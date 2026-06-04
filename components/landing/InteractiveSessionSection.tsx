import Link from 'next/link'
import { Video, CheckCircle, Clock, Users, Star } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    color: 'bg-brand-600',
    title: 'الاتصال بالفيديو',
    desc: 'الأستاذ أمين والطفل وجهاً لوجه عبر الشاشة. الوالد موجود يراقب ويتعلم.',
    icon: Video,
  },
  {
    num: '02',
    color: 'bg-emerald-600',
    title: 'التمارين الحية',
    desc: 'الطفل يؤدي التمارين أمام الكاميرا — الأستاذ يصحح الحركة في الوقت الفعلي ويحفّزه.',
    icon: CheckCircle,
  },
  {
    num: '03',
    color: 'bg-purple-600',
    title: 'تعديل السلوك',
    desc: 'خلال الجلسة نطبق بروتوكول ABA أو Zone of Regulation مباشرة مع الطفل.',
    icon: Star,
  },
  {
    num: '04',
    color: 'bg-amber-500',
    title: 'توجيه الوالد',
    desc: '10 دقائق لتعليم الوالد كيف يكرر التمارين يومياً في البيت. الوالد شريك، لا مُتفرّج.',
    icon: Users,
  },
]

const BENEFITS = [
  'الطفل لا يتنقل — راحة الأسرة', 'تقييم حركي دقيق بالكاميرا',
  'تسجيل الجلسة للمراجعة', 'جلسات مرنة بالتوقيت',
  'تواصل مستمر بين الجلسات', 'برنامج يتكيف أسبوعياً',
]

export default function InteractiveSessionSection() {
  return (
    <section className="py-24 bg-brand-950" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-brand-300 font-bold text-sm bg-brand-800 px-4 py-1.5 rounded-full mb-4">
            الجلسة التفاعلية
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
            ليست مجرد مكالمة فيديو
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
            كل جلسة هي تجربة تعليمية متكاملة — الطفل يتحرك، يتعلم، ويكسب نقاطاً.
            الوالد يخرج بخطة يومية واضحة.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-9 h-9 ${step.color} rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {step.num}
                  </span>
                  <Icon className="w-5 h-5 text-white/40" />
                </div>
                <h3 className="text-white font-black text-base mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Session preview card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: What a session looks like */}
            <div>
              <h3 className="text-white font-black text-2xl mb-6">ماذا يحدث في 45 دقيقة؟</h3>
              <div className="space-y-4">
                {[
                  { time: '0–5 دق',   label: 'فحص المنطقة العاطفية', note: 'Zone of Regulation check-in', color: 'bg-brand-600' },
                  { time: '5–20 دق',  label: 'تمارين APA الحركية',   note: 'موجّهة مباشرة بالكاميرا',   color: 'bg-blue-600' },
                  { time: '20–30 دق', label: 'تدريب CBT / ABA',       note: 'بروتوكول مخصص للطفل',        color: 'bg-purple-600' },
                  { time: '30–40 دق', label: 'نقاط وإنجازات',          note: 'تفعيل دوبامين المكافأة',     color: 'bg-amber-500' },
                  { time: '40–45 دق', label: 'توجيه الوالد',           note: 'خطة أسبوعية واضحة',         color: 'bg-emerald-600' },
                ].map(({ time, label, note, color }) => (
                  <div key={time} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-20 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-white/50 text-xs ltr-num">{time}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-bold text-sm">{label}</span>
                      <span className="text-white/40 text-xs mr-2">{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Benefits */}
            <div>
              <h3 className="text-white font-black text-2xl mb-6">لماذا عن بُعد يعمل أفضل؟</h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/10 rounded-2xl p-5 flex items-center gap-4">
                <Clock className="w-8 h-8 text-brand-300 flex-shrink-0" />
                <div>
                  <p className="text-white font-black text-sm">جلسة تقييمية مجانية للتعارف</p>
                  <p className="text-white/60 text-xs mt-0.5">30 دقيقة مع الأستاذ أمين — بدون أي التزام</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/register"
            className="inline-flex items-center gap-3 bg-white text-brand-900 font-black text-lg px-10 py-4 rounded-2xl hover:bg-brand-50 transition-all hover:scale-105 shadow-2xl shadow-black/30">
            <Video className="w-5 h-5" />
            احجز الجلسة التقييمية المجانية
          </Link>
          <p className="text-white/40 text-sm mt-4">بدون بطاقة ائتمانية • متاح لجميع الدول</p>
        </div>

      </div>
    </section>
  )
}
