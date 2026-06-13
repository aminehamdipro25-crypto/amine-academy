'use client'
import Link from 'next/link'
import { Video, CheckCircle, Clock, Users, Star } from 'lucide-react'
import { useLang } from '@/lib/i18n'

const STEPS = [
  {
    num: '01',
    color: 'bg-brand-600',
    title: 'الاتصال بالفيديو',
    titleEn: 'Video Call',
    desc: 'الأستاذ أمين والطفل وجهاً لوجه عبر الشاشة. الوالد موجود يراقب ويتعلم.',
    descEn: 'Prof. Amine and the child face-to-face via screen. The parent is present, observing and learning.',
    icon: Video,
  },
  {
    num: '02',
    color: 'bg-emerald-600',
    title: 'التمارين الحية',
    titleEn: 'Live Exercises',
    desc: 'الطفل يؤدي التمارين أمام الكاميرا — الأستاذ يصحح الحركة في الوقت الفعلي ويحفّزه.',
    descEn: 'The child performs exercises in front of the camera — the therapist corrects movement in real time and provides encouragement.',
    icon: CheckCircle,
  },
  {
    num: '03',
    color: 'bg-purple-600',
    title: 'تعديل السلوك',
    titleEn: 'Behavior Modification',
    desc: 'خلال الجلسة نطبق بروتوكول ABA أو Zone of Regulation مباشرة مع الطفل.',
    descEn: 'During the session we apply the ABA protocol or Zone of Regulation directly with the child.',
    icon: Star,
  },
  {
    num: '04',
    color: 'bg-amber-500',
    title: 'توجيه الوالد',
    titleEn: 'Parent Coaching',
    desc: '10 دقائق لتعليم الوالد كيف يكرر التمارين يومياً في البيت. الوالد شريك، لا مُتفرّج.',
    descEn: '10 minutes to teach the parent how to repeat the exercises daily at home. The parent is a partner, not a spectator.',
    icon: Users,
  },
]

const BENEFITS_AR = [
  'الطفل لا يتنقل — راحة الأسرة', 'تقييم حركي دقيق بالكاميرا',
  'تسجيل الجلسة للمراجعة', 'جلسات مرنة بالتوقيت',
  'تواصل مستمر بين الجلسات', 'برنامج يتكيف أسبوعياً',
]

const BENEFITS_EN = [
  'No travel needed — family convenience', 'Precise motor assessment via camera',
  'Session recording for review', 'Flexible session scheduling',
  'Continuous communication between sessions', 'Program adapts weekly',
]

const SESSION_TIMELINE_AR = [
  { time: '0–5 دق',   label: 'فحص المنطقة العاطفية', note: 'Zone of Regulation check-in', color: 'bg-brand-600' },
  { time: '5–20 دق',  label: 'تمارين APA الحركية',   note: 'موجّهة مباشرة بالكاميرا',   color: 'bg-blue-600' },
  { time: '20–30 دق', label: 'تدريب CBT / ABA',       note: 'بروتوكول مخصص للطفل',        color: 'bg-purple-600' },
  { time: '30–40 دق', label: 'نقاط وإنجازات',          note: 'تفعيل دوبامين المكافأة',     color: 'bg-amber-500' },
  { time: '40–45 دق', label: 'توجيه الوالد',           note: 'خطة أسبوعية واضحة',         color: 'bg-emerald-600' },
]

const SESSION_TIMELINE_EN = [
  { time: '0–5 min',   label: 'Emotional zone check', note: 'Zone of Regulation check-in', color: 'bg-brand-600' },
  { time: '5–20 min',  label: 'APA motor exercises',  note: 'Live camera-guided',           color: 'bg-blue-600' },
  { time: '20–30 min', label: 'CBT / ABA training',   note: 'Child-specific protocol',      color: 'bg-purple-600' },
  { time: '30–40 min', label: 'Points & achievements', note: 'Reward dopamine activation',  color: 'bg-amber-500' },
  { time: '40–45 min', label: 'Parent coaching',       note: 'Clear weekly action plan',    color: 'bg-emerald-600' },
]

export default function InteractiveSessionSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const benefits = isAr ? BENEFITS_AR : BENEFITS_EN
  const timeline = isAr ? SESSION_TIMELINE_AR : SESSION_TIMELINE_EN

  return (
    <section className="py-24 bg-[#FFF8F0]" id="how-it-works" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            {isAr ? 'الجلسة التفاعلية' : 'The Interactive Session'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            {isAr ? 'ليست مجرد مكالمة فيديو' : 'More Than Just a Video Call'}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            {isAr
              ? 'كل جلسة هي تجربة تعليمية متكاملة — الطفل يتحرك، يتعلم، ويكسب نقاطاً. الوالد يخرج بخطة يومية واضحة.'
              : 'Every session is a complete learning experience — the child moves, learns, and earns points. The parent leaves with a clear daily plan.'}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-6 hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-9 h-9 ${step.color} rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {step.num}
                  </span>
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-gray-900 font-black text-base mb-2">{isAr ? step.title : step.titleEn}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{isAr ? step.desc : step.descEn}</p>
              </div>
            )
          })}
        </div>

        {/* Session preview card */}
        <div className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-8 md:p-10 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: What a session looks like */}
            <div>
              <h3 className="text-gray-900 font-black text-2xl mb-6">
                {isAr ? 'ماذا يحدث في 45 دقيقة؟' : 'What Happens in 45 Minutes?'}
              </h3>
              <div className="space-y-4">
                {timeline.map(({ time, label, note, color }) => (
                  <div key={time} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-20 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-gray-400 text-xs ltr-num">{time}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-800 font-bold text-sm">{label}</span>
                      <span className="text-gray-400 text-xs mr-2 ml-2">{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Benefits */}
            <div>
              <h3 className="text-gray-900 font-black text-2xl mb-6">
                {isAr ? 'لماذا عن بُعد يعمل أفضل؟' : 'Why Does Remote Work Better?'}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {benefits.map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <div className="bg-brand-50 rounded-2xl p-5 flex items-center gap-4 border border-brand-100">
                <Clock className="w-8 h-8 text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-black text-sm">
                    {isAr ? 'جلسة تقييمية مجانية للتعارف' : 'Free Assessment Session'}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isAr
                      ? '30 دقيقة مع الأستاذ أمين — بدون أي التزام'
                      : '30 minutes with Prof. Amine — no commitment required'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/register"
            className="inline-flex items-center gap-3 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-black text-lg px-10 py-4 rounded-2xl hover:-translate-y-1 transition-all shadow-brand">
            <Video className="w-5 h-5" />
            {isAr ? 'احجز الجلسة التقييمية المجانية' : 'Book Your Free Assessment Session'}
          </Link>
          <p className="text-gray-400 text-sm mt-4">
            {isAr ? 'بدون بطاقة ائتمانية • متاح لجميع الدول' : 'No credit card required • Available worldwide'}
          </p>
        </div>

      </div>
    </section>
  )
}
