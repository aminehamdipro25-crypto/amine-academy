const steps = [
  {
    num: '01',
    title: 'التسجيل وتقييم الحالة',
    desc: 'يسجّل ولي الأمر ويملأ استبيان مفصل عن طفله (العمر، التشخيص، الحساسيات الحسية، الأهداف).',
    icon: '📋',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    num: '02',
    title: 'تصميم البرنامج المخصص',
    desc: 'الأستاذ أمين يراجع الملف ويصمم برنامجاً فردياً يتضمن جدولاً أسبوعياً من التمارين والتدخلات النفسية.',
    icon: '🎨',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    num: '03',
    title: 'التطبيق اليومي التفاعلي',
    desc: 'الطفل يستخدم واجهة مرحة وسهلة لأداء تمارين اليوم، يربح نقاط وأوسمة مع كل إنجاز.',
    icon: '🎮',
    color: 'bg-green-100 text-green-600',
  },
  {
    num: '04',
    title: 'متابعة الأولياء والتقارير',
    desc: 'ولي الأمر يتابع لوحة تحكم متكاملة تعرض التقدم، التقارير الدورية، وملاحظات الأستاذ.',
    icon: '📊',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    num: '05',
    title: 'جلسات متابعة دورية',
    desc: 'مواعيد فردية دورية مع الأستاذ أمين لمراجعة التقدم وتعديل البرنامج حسب استجابة الطفل.',
    icon: '🤝',
    color: 'bg-teal-100 text-teal-600',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            آلية العمل
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            كيف تعمل أكاديمية أمين؟
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            خمس خطوات بسيطة تحول حياة طفلك.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 right-16 left-16 h-0.5 bg-gradient-to-l from-teal-300 to-brand-300" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* Circle */}
                <div className={`relative z-10 w-20 h-20 rounded-2xl flex flex-col items-center justify-center mb-4 ${step.color} shadow-sm`}>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div className="font-black text-gray-300 text-xs mb-1 ltr-num">{step.num}</div>
                <h3 className="font-black text-gray-900 text-sm mb-2">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
