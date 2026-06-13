'use client'
import { useLang } from '@/lib/i18n'

const steps = [
  {
    num: '01',
    title: 'التسجيل وتقييم الحالة',
    titleEn: 'Registration & Case Assessment',
    desc: 'يسجّل ولي الأمر ويملأ استبيان مفصل عن طفله (العمر، التشخيص، الحساسيات الحسية، الأهداف).',
    descEn: 'The parent registers and fills out a detailed questionnaire about their child (age, diagnosis, sensory sensitivities, and goals).',
    icon: '📋',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    num: '02',
    title: 'تصميم البرنامج المخصص',
    titleEn: 'Personalized Program Design',
    desc: 'الأستاذ أمين يراجع الملف ويصمم برنامجاً فردياً يتضمن جدولاً أسبوعياً من التمارين والتدخلات النفسية.',
    descEn: 'Prof. Amine reviews the file and designs an individualized program with a weekly schedule of exercises and psychological interventions.',
    icon: '🎨',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    num: '03',
    title: 'التطبيق اليومي التفاعلي',
    titleEn: 'Daily Interactive Practice',
    desc: 'الطفل يستخدم واجهة مرحة وسهلة لأداء تمارين اليوم، يربح نقاط وأوسمة مع كل إنجاز.',
    descEn: "The child uses a fun, easy-to-use interface to complete daily exercises and earns points and badges with every achievement.",
    icon: '🎮',
    color: 'bg-green-100 text-green-600',
  },
  {
    num: '04',
    title: 'متابعة الأولياء والتقارير',
    titleEn: 'Parent Monitoring & Reports',
    desc: 'ولي الأمر يتابع لوحة تحكم متكاملة تعرض التقدم، التقارير الدورية، وملاحظات الأستاذ.',
    descEn: "The parent follows a comprehensive dashboard showing progress, periodic reports, and the therapist's notes.",
    icon: '📊',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    num: '05',
    title: 'جلسات متابعة دورية',
    titleEn: 'Regular Follow-Up Sessions',
    desc: 'مواعيد فردية دورية مع الأستاذ أمين لمراجعة التقدم وتعديل البرنامج حسب استجابة الطفل.',
    descEn: "Periodic individual appointments with Prof. Amine to review progress and adjust the program according to the child's response.",
    icon: '🤝',
    color: 'bg-teal-100 text-teal-600',
  },
]

export default function HowItWorks() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <section className="py-20 bg-[#FFF8F0]" id="how-it-works" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            {isAr ? 'آلية العمل' : 'How It Works'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            {isAr ? 'كيف تعمل أكاديمية أمين؟' : 'How Does Amine Academy Work?'}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            {isAr ? 'خمس خطوات بسيطة تحول حياة طفلك.' : "Five simple steps that transform your child's life."}
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* Numbered circle */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-brand-500 text-white font-black text-xl flex items-center justify-center mb-3 shadow-brand-sm">
                  {index + 1}
                </div>
                {/* Connector line for mobile */}
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-12 bg-gradient-to-b from-brand-300 to-brand-100 mx-auto md:hidden" />
                )}
                {/* Step card */}
                <div className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-6 w-full mt-2">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="font-black text-brand-400 text-xs mb-1 ltr-num">{step.num}</div>
                  <h3 className="font-black text-gray-900 text-sm mb-2">{isAr ? step.title : step.titleEn}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{isAr ? step.desc : step.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
