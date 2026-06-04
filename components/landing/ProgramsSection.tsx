import Link from 'next/link'

const PROGRAMS = [
  {
    age: '5 — 11 سنة',
    emoji: '🧸',
    gradient: 'from-orange-500 to-amber-500',
    light: 'bg-orange-50',
    accent: 'text-orange-600',
    border: 'border-orange-200',
    tagBg: 'bg-orange-100 text-orange-700',
    goal: 'بناء الأسس الحركية والتنظيم الحسي',
    what: 'في هذه المرحلة الجهاز العصبي في طور البناء — كل تمرين يغذّي المسارات العصبية الصحيحة.',
    apa: ['مشية الحيوانات الحركية', 'المشي على خط التوازن', 'تمارين الحركة الثنائية', 'ألعاب الكرة الحسية'],
    aba: ['نظام النجوم اليومي', 'قصة اجتماعية مخصصة', 'مناطق التنظيم الأربع', 'تعزيز إيجابي فوري'],
    cbt: ['تنفس الفقاعات 4-4-4', 'تمرين الضفدع الهادئ', 'ترموميتر المشاعر', 'الاسترخاء العضلي للأطفال'],
    outcomes: ['تحسن التنسيق الحركي', 'تقليل نوبات الغضب', 'بداية الضبط الذاتي'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '12 — 17 سنة',
    emoji: '🎯',
    gradient: 'from-brand-600 to-brand-800',
    light: 'bg-brand-50',
    accent: 'text-brand-600',
    border: 'border-brand-200',
    tagBg: 'bg-brand-100 text-brand-700',
    goal: 'الوظيفة التنفيذية والضبط الذاتي',
    what: 'المراهق يحتاج أدوات، لا أوامر. نبنيها داخله عبر تدريب الدماغ بالحركة.',
    apa: ['تمارين الإيقاع والتنسيق', 'الاسترخاء العضلي التدريجي', 'الرياضة الجماعية المعدلة', 'مزامنة الميترونوم'],
    aba: ['بروتوكول PEERS للمهارات الاجتماعية', 'نظام النقاط المتقدم', 'ترموميتر الغضب + أدوات CBT', 'القصص الاجتماعية للمراهقين'],
    cbt: ['تدريب الذاكرة العاملة (Cogmed)', 'برج المهام التنفيذية', 'تحدي التسلسل المعكوس', 'اليقظة الذهنية الحركية'],
    outcomes: ['تحسن الأداء الأكاديمي', 'مهارات اجتماعية حقيقية', 'إدارة الغضب والإحباط'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '18 — 22 سنة',
    emoji: '💪',
    gradient: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50',
    accent: 'text-teal-700',
    border: 'border-teal-200',
    tagBg: 'bg-teal-100 text-teal-700',
    goal: 'الاستقلالية والتكيف في الحياة',
    what: 'الشاب يحتاج مهارات حياتية حقيقية: التنظيم، العمل، العلاقات الاجتماعية.',
    apa: ['دائرة القوة اليقظة', 'اليوغا المعدلة للـ ADHD', 'تمارين التنفس المتقدمة', 'لعبة الحركة الاجتماعية'],
    aba: ['PEERS للمهارات المهنية والعلاقات', 'أدوات الضبط الذاتي اليومي', 'خطة تعديل عادات النوم', 'استراتيجيات بيئة العمل'],
    cbt: ['تخطيط الأهداف طويل المدى', 'تحليل وحل المشكلات', 'تقنيات Pomodoro للـ ADHD', 'إدارة الإجهاد والقلق'],
    outcomes: ['استقلالية يومية فعلية', 'الاندماج الاجتماعي والمهني', 'تقدير الذات والثقة'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
]

export default function ProgramsSection() {
  return (
    <section className="py-24 bg-gray-50" id="programs">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            البرامج التخصصية
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            برنامج مخصص لكل مرحلة عمرية
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            كل فئة عمرية تحتاج نهجاً مختلفاً. نحن لا نُعطي نفس البرنامج للجميع.
          </p>
        </div>

        {/* Programs */}
        <div className="space-y-6">
          {PROGRAMS.map((prog, i) => (
            <div key={prog.age}
              className={`bg-white rounded-3xl border overflow-hidden ${prog.border} hover:shadow-xl transition-shadow`}>
              {/* Top banner */}
              <div className={`bg-gradient-to-l ${prog.gradient} p-6 flex items-center gap-5`}>
                <div className="text-5xl">{prog.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-black text-2xl ltr-num">{prog.age}</h3>
                  </div>
                  <p className="text-white/90 font-bold text-base">{prog.goal}</p>
                  <p className="text-white/70 text-sm mt-1">{prog.what}</p>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 text-right">
                  <span className="text-white/60 text-xs">{prog.diagnosis}</span>
                </div>
              </div>

              {/* 3-column content */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-100">

                {/* APA */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">APA</span>
                    <span className="text-gray-700 font-bold text-sm">الرياضة المعدّلة</span>
                  </div>
                  <ul className="space-y-2">
                    {prog.apa.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ABA */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full">ABA</span>
                    <span className="text-gray-700 font-bold text-sm">تعديل السلوك</span>
                  </div>
                  <ul className="space-y-2">
                    {prog.aba.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CBT */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-purple-600 text-white text-xs font-black px-2.5 py-1 rounded-full">CBT</span>
                    <span className="text-gray-700 font-bold text-sm">التدريب المعرفي</span>
                  </div>
                  <ul className="space-y-2">
                    {prog.cbt.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Outcomes footer */}
              <div className={`px-6 py-4 ${prog.light} border-t ${prog.border} flex items-center justify-between flex-wrap gap-3`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500">النتائج المتوقعة:</span>
                  {prog.outcomes.map(o => (
                    <span key={o} className={`text-xs font-bold px-2.5 py-1 rounded-full ${prog.tagBg}`}>{o}</span>
                  ))}
                </div>
                <Link href="/register"
                  className={`text-xs font-black ${prog.accent} hover:underline whitespace-nowrap`}>
                  ابدأ هذا البرنامج ←
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          كل برنامج يبدأ بتقييم أولي مجاني لتحديد نقطة البداية الدقيقة لطفلك.
        </p>

      </div>
    </section>
  )
}
