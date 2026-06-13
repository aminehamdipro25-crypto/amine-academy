'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

const PROGRAMS = [
  {
    age: '5 — 11 سنة',
    ageEn: '5 — 11 Years',
    emoji: '🧸',
    gradient: 'from-orange-500 to-amber-500',
    light: 'bg-orange-50',
    accent: 'text-orange-600',
    border: 'border-orange-200',
    tagBg: 'bg-orange-100 text-orange-700',
    goal: 'بناء الأسس الحركية والتنظيم الحسي',
    goalEn: 'Building Motor Foundations & Sensory Regulation',
    what: 'في هذه المرحلة الجهاز العصبي في طور البناء — كل تمرين يغذّي المسارات العصبية الصحيحة.',
    whatEn: 'At this stage the nervous system is still developing — every exercise nourishes the right neural pathways.',
    apa: ['مشية الحيوانات الحركية', 'المشي على خط التوازن', 'تمارين الحركة الثنائية', 'ألعاب الكرة الحسية'],
    apaEn: ['Animal locomotion movements', 'Balance beam walking', 'Bilateral movement exercises', 'Sensory ball games'],
    aba: ['نظام النجوم اليومي', 'قصة اجتماعية مخصصة', 'مناطق التنظيم الأربع', 'تعزيز إيجابي فوري'],
    abaEn: ['Daily star reward system', 'Personalized social story', 'Four Zones of Regulation', 'Immediate positive reinforcement'],
    cbt: ['تنفس الفقاعات 4-4-4', 'تمرين الضفدع الهادئ', 'ترموميتر المشاعر', 'الاسترخاء العضلي للأطفال'],
    cbtEn: ['Bubble breathing 4-4-4', 'The calm frog exercise', 'Emotion thermometer', 'Progressive muscle relaxation for kids'],
    outcomes: ['تحسن التنسيق الحركي', 'تقليل نوبات الغضب', 'بداية الضبط الذاتي'],
    outcomesEn: ['Improved motor coordination', 'Reduced anger episodes', 'Beginning of self-regulation'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '12 — 17 سنة',
    ageEn: '12 — 17 Years',
    emoji: '🎯',
    gradient: 'from-brand-600 to-brand-800',
    light: 'bg-brand-50',
    accent: 'text-brand-600',
    border: 'border-brand-200',
    tagBg: 'bg-brand-100 text-brand-700',
    goal: 'الوظيفة التنفيذية والضبط الذاتي',
    goalEn: 'Executive Function & Self-Control',
    what: 'المراهق يحتاج أدوات، لا أوامر. نبنيها داخله عبر تدريب الدماغ بالحركة.',
    whatEn: 'The teenager needs tools, not commands. We build them from within through brain training with movement.',
    apa: ['تمارين الإيقاع والتنسيق', 'الاسترخاء العضلي التدريجي', 'الرياضة الجماعية المعدلة', 'مزامنة الميترونوم'],
    apaEn: ['Rhythm and coordination exercises', 'Progressive muscle relaxation', 'Modified group sports', 'Metronome synchronization'],
    aba: ['بروتوكول PEERS للمهارات الاجتماعية', 'نظام النقاط المتقدم', 'ترموميتر الغضب + أدوات CBT', 'القصص الاجتماعية للمراهقين'],
    abaEn: ['PEERS social skills protocol', 'Advanced points system', 'Anger thermometer + CBT tools', 'Social stories for teens'],
    cbt: ['تدريب الذاكرة العاملة (Cogmed)', 'برج المهام التنفيذية', 'تحدي التسلسل المعكوس', 'اليقظة الذهنية الحركية'],
    cbtEn: ['Working memory training (Cogmed)', 'Executive Task Tower', 'Reverse sequence challenge', 'Movement-based mindfulness'],
    outcomes: ['تحسن الأداء الأكاديمي', 'مهارات اجتماعية حقيقية', 'إدارة الغضب والإحباط'],
    outcomesEn: ['Improved academic performance', 'Real social skills', 'Anger and frustration management'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '18 — 22 سنة',
    ageEn: '18 — 22 Years',
    emoji: '💪',
    gradient: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50',
    accent: 'text-teal-700',
    border: 'border-teal-200',
    tagBg: 'bg-teal-100 text-teal-700',
    goal: 'الاستقلالية والتكيف في الحياة',
    goalEn: 'Independence & Life Adaptation',
    what: 'الشاب يحتاج مهارات حياتية حقيقية: التنظيم، العمل، العلاقات الاجتماعية.',
    whatEn: 'The young adult needs real life skills: organization, work, and social relationships.',
    apa: ['دائرة القوة اليقظة', 'اليوغا المعدلة للـ ADHD', 'تمارين التنفس المتقدمة', 'لعبة الحركة الاجتماعية'],
    apaEn: ['Mindful strength circuit', 'Modified yoga for ADHD', 'Advanced breathing exercises', 'Social movement game'],
    aba: ['PEERS للمهارات المهنية والعلاقات', 'أدوات الضبط الذاتي اليومي', 'خطة تعديل عادات النوم', 'استراتيجيات بيئة العمل'],
    abaEn: ['PEERS for professional skills & relationships', 'Daily self-regulation tools', 'Sleep habit modification plan', 'Workplace environment strategies'],
    cbt: ['تخطيط الأهداف طويل المدى', 'تحليل وحل المشكلات', 'تقنيات Pomodoro للـ ADHD', 'إدارة الإجهاد والقلق'],
    cbtEn: ['Long-term goal planning', 'Problem analysis and solving', 'Pomodoro techniques for ADHD', 'Stress and anxiety management'],
    outcomes: ['استقلالية يومية فعلية', 'الاندماج الاجتماعي والمهني', 'تقدير الذات والثقة'],
    outcomesEn: ['Genuine daily independence', 'Social and professional integration', 'Self-esteem and confidence'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
]

export default function ProgramsSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <section className="py-24 bg-white" id="programs" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            {isAr ? 'البرامج التخصصية' : 'Specialized Programs'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            {isAr ? 'برنامج مخصص لكل مرحلة عمرية' : 'A Tailored Program for Every Age Group'}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            {isAr
              ? 'كل فئة عمرية تحتاج نهجاً مختلفاً. نحن لا نُعطي نفس البرنامج للجميع.'
              : 'Every age group needs a different approach. We never give the same program to everyone.'}
          </p>
        </div>

        {/* Programs */}
        <div className="space-y-6">
          {PROGRAMS.map((prog) => (
            <div key={prog.age}
              className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card overflow-hidden hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all">
              {/* Top banner */}
              <div className={`bg-gradient-to-l ${prog.gradient} p-6 flex items-center gap-5`}>
                <div className="text-5xl">{prog.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-black text-2xl ltr-num">{isAr ? prog.age : prog.ageEn}</h3>
                  </div>
                  <p className="text-white/90 font-bold text-base">{isAr ? prog.goal : prog.goalEn}</p>
                  <p className="text-white/70 text-sm mt-1">{isAr ? prog.what : prog.whatEn}</p>
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
                    <span className="text-gray-700 font-bold text-sm">{isAr ? 'الرياضة المعدّلة' : 'Adapted Physical Activity'}</span>
                  </div>
                  <ul className="space-y-2">
                    {(isAr ? prog.apa : prog.apaEn).map(item => (
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
                    <span className="text-gray-700 font-bold text-sm">{isAr ? 'تعديل السلوك' : 'Applied Behavior Analysis'}</span>
                  </div>
                  <ul className="space-y-2">
                    {(isAr ? prog.aba : prog.abaEn).map(item => (
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
                    <span className="text-gray-700 font-bold text-sm">{isAr ? 'التدريب المعرفي' : 'Cognitive Behavioral Training'}</span>
                  </div>
                  <ul className="space-y-2">
                    {(isAr ? prog.cbt : prog.cbtEn).map(item => (
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
                  <span className="text-xs font-bold text-gray-500">
                    {isAr ? 'النتائج المتوقعة:' : 'Expected Outcomes:'}
                  </span>
                  {(isAr ? prog.outcomes : prog.outcomesEn).map(o => (
                    <span key={o} className={`text-xs font-bold px-2.5 py-1 rounded-full ${prog.tagBg}`}>{o}</span>
                  ))}
                </div>
                <Link href="/register"
                  className={`text-xs font-black ${prog.accent} hover:underline whitespace-nowrap`}>
                  {isAr ? 'ابدأ هذا البرنامج ←' : 'Start This Program →'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          {isAr
            ? 'كل برنامج يبدأ بتقييم أولي مجاني لتحديد نقطة البداية الدقيقة لطفلك.'
            : "Every program begins with a free initial assessment to determine the precise starting point for your child."}
        </p>

      </div>
    </section>
  )
}
