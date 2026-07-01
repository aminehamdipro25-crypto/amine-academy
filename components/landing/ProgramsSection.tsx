'use client'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'

const PROGRAMS = [
  {
    age: '5 — 11 سنة',
    ageEn: '5 — 11 Years',
    ageFr: '5 — 11 ans',
    emoji: '🧸',
    gradient: 'from-orange-500 to-amber-500',
    light: 'bg-orange-50',
    accent: 'text-orange-600',
    border: 'border-orange-200',
    tagBg: 'bg-orange-100 text-orange-700',
    goal: 'بناء الأسس الحركية والتنظيم الحسي',
    goalEn: 'Building Motor Foundations & Sensory Regulation',
    goalFr: 'Construire les bases motrices et la régulation sensorielle',
    what: 'في هذه المرحلة الجهاز العصبي في طور البناء — كل تمرين يغذّي المسارات العصبية الصحيحة.',
    whatEn: 'At this stage the nervous system is still developing — every exercise nourishes the right neural pathways.',
    whatFr: "À ce stade, le système nerveux est encore en construction — chaque exercice nourrit les bonnes voies neuronales.",
    apa: ['مشية الحيوانات الحركية', 'المشي على خط التوازن', 'تمارين الحركة الثنائية', 'ألعاب الكرة الحسية'],
    apaEn: ['Animal locomotion movements', 'Balance beam walking', 'Bilateral movement exercises', 'Sensory ball games'],
    apaFr: ['Déplacements imitant les animaux', "Marche sur une ligne d'équilibre", 'Exercices de mouvement bilatéral', 'Jeux de ballon sensoriels'],
    aba: ['نظام النجوم اليومي', 'قصة اجتماعية مخصصة', 'مناطق التنظيم الأربع', 'تعزيز إيجابي فوري'],
    abaEn: ['Daily star reward system', 'Personalized social story', 'Four Zones of Regulation', 'Immediate positive reinforcement'],
    abaFr: ['Système d\'étoiles quotidien', 'Histoire sociale personnalisée', 'Les quatre zones de régulation', 'Renforcement positif immédiat'],
    cbt: ['تنفس الفقاعات 4-4-4', 'تمرين الضفدع الهادئ', 'ترموميتر المشاعر', 'الاسترخاء العضلي للأطفال'],
    cbtEn: ['Bubble breathing 4-4-4', 'The calm frog exercise', 'Emotion thermometer', 'Progressive muscle relaxation for kids'],
    cbtFr: ['Respiration en bulles 4-4-4', 'L\'exercice de la grenouille calme', 'Thermomètre des émotions', 'Relaxation musculaire progressive pour enfants'],
    outcomes: ['تحسن التنسيق الحركي', 'تقليل نوبات الغضب', 'بداية الضبط الذاتي'],
    outcomesEn: ['Improved motor coordination', 'Reduced anger episodes', 'Beginning of self-regulation'],
    outcomesFr: ['Coordination motrice améliorée', 'Moins de crises de colère', "Début de l'autorégulation"],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '12 — 17 سنة',
    ageEn: '12 — 17 Years',
    ageFr: '12 — 17 ans',
    emoji: '🎯',
    gradient: 'from-brand-600 to-brand-800',
    light: 'bg-brand-50',
    accent: 'text-brand-600',
    border: 'border-brand-200',
    tagBg: 'bg-brand-100 text-brand-700',
    goal: 'الوظيفة التنفيذية والضبط الذاتي',
    goalEn: 'Executive Function & Self-Control',
    goalFr: 'Fonctions exécutives et maîtrise de soi',
    what: 'المراهق يحتاج أدوات، لا أوامر. نبنيها داخله عبر تدريب الدماغ بالحركة.',
    whatEn: 'The teenager needs tools, not commands. We build them from within through brain training with movement.',
    whatFr: "L'adolescent a besoin d'outils, pas d'ordres. Nous les construisons de l'intérieur grâce à l'entraînement cérébral par le mouvement.",
    apa: ['تمارين الإيقاع والتنسيق', 'الاسترخاء العضلي التدريجي', 'الرياضة الجماعية المعدلة', 'مزامنة الميترونوم'],
    apaEn: ['Rhythm and coordination exercises', 'Progressive muscle relaxation', 'Modified group sports', 'Metronome synchronization'],
    apaFr: ['Exercices de rythme et de coordination', 'Relaxation musculaire progressive', 'Sports collectifs adaptés', 'Synchronisation au métronome'],
    aba: ['بروتوكول PEERS للمهارات الاجتماعية', 'نظام النقاط المتقدم', 'ترموميتر الغضب + أدوات CBT', 'القصص الاجتماعية للمراهقين'],
    abaEn: ['PEERS social skills protocol', 'Advanced points system', 'Anger thermometer + CBT tools', 'Social stories for teens'],
    abaFr: ['Protocole PEERS pour les compétences sociales', 'Système de points avancé', 'Thermomètre de la colère + outils TCC', 'Histoires sociales pour adolescents'],
    cbt: ['تدريب الذاكرة العاملة (Cogmed)', 'برج المهام التنفيذية', 'تحدي التسلسل المعكوس', 'اليقظة الذهنية الحركية'],
    cbtEn: ['Working memory training (Cogmed)', 'Executive Task Tower', 'Reverse sequence challenge', 'Movement-based mindfulness'],
    cbtFr: ['Entraînement de la mémoire de travail (Cogmed)', 'Tour des tâches exécutives', 'Défi de séquence inversée', 'Pleine conscience par le mouvement'],
    outcomes: ['تحسن الأداء الأكاديمي', 'مهارات اجتماعية حقيقية', 'إدارة الغضب والإحباط'],
    outcomesEn: ['Improved academic performance', 'Real social skills', 'Anger and frustration management'],
    outcomesFr: ['Performance scolaire améliorée', 'Compétences sociales concrètes', 'Gestion de la colère et de la frustration'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
  {
    age: '18 — 22 سنة',
    ageEn: '18 — 22 Years',
    ageFr: '18 — 22 ans',
    emoji: '💪',
    gradient: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50',
    accent: 'text-teal-700',
    border: 'border-teal-200',
    tagBg: 'bg-teal-100 text-teal-700',
    goal: 'الاستقلالية والتكيف في الحياة',
    goalEn: 'Independence & Life Adaptation',
    goalFr: "Autonomie et adaptation à la vie",
    what: 'الشاب يحتاج مهارات حياتية حقيقية: التنظيم، العمل، العلاقات الاجتماعية.',
    whatEn: 'The young adult needs real life skills: organization, work, and social relationships.',
    whatFr: "Le jeune adulte a besoin de compétences de vie concrètes : organisation, travail, relations sociales.",
    apa: ['دائرة القوة اليقظة', 'اليوغا المعدلة للـ ADHD', 'تمارين التنفس المتقدمة', 'لعبة الحركة الاجتماعية'],
    apaEn: ['Mindful strength circuit', 'Modified yoga for ADHD', 'Advanced breathing exercises', 'Social movement game'],
    apaFr: ['Circuit de renforcement en pleine conscience', 'Yoga adapté au TDAH', 'Exercices de respiration avancés', 'Jeu de mouvement social'],
    aba: ['PEERS للمهارات المهنية والعلاقات', 'أدوات الضبط الذاتي اليومي', 'خطة تعديل عادات النوم', 'استراتيجيات بيئة العمل'],
    abaEn: ['PEERS for professional skills & relationships', 'Daily self-regulation tools', 'Sleep habit modification plan', 'Workplace environment strategies'],
    abaFr: ['PEERS pour les compétences professionnelles et relationnelles', 'Outils d\'autorégulation quotidiens', 'Plan de modification des habitudes de sommeil', "Stratégies pour l'environnement de travail"],
    cbt: ['تخطيط الأهداف طويل المدى', 'تحليل وحل المشكلات', 'تقنيات Pomodoro للـ ADHD', 'إدارة الإجهاد والقلق'],
    cbtEn: ['Long-term goal planning', 'Problem analysis and solving', 'Pomodoro techniques for ADHD', 'Stress and anxiety management'],
    cbtFr: ['Planification d\'objectifs à long terme', 'Analyse et résolution de problèmes', 'Techniques Pomodoro pour le TDAH', 'Gestion du stress et de l\'anxiété'],
    outcomes: ['استقلالية يومية فعلية', 'الاندماج الاجتماعي والمهني', 'تقدير الذات والثقة'],
    outcomesEn: ['Genuine daily independence', 'Social and professional integration', 'Self-esteem and confidence'],
    outcomesFr: ['Autonomie quotidienne réelle', 'Intégration sociale et professionnelle', 'Estime de soi et confiance'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
  },
]

export default function ProgramsSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      id="programs"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #07111F 100%)', padding: '96px 0' }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#C4B5FD' }}
          >
            {pickLang(lang, 'البرامج التخصصية', 'Specialized Programs', 'Programmes spécialisés')}
          </span>
          <h2
            className="text-3xl md:text-5xl font-black mb-5"
            style={{
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {pickLang(lang, 'برنامج مخصص لكل مرحلة عمرية', 'A Tailored Program for Every Age Group', "Un programme adapté à chaque tranche d'âge")}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg">
            {pickLang(
              lang,
              'كل فئة عمرية تحتاج نهجاً مختلفاً. نحن لا نُعطي نفس البرنامج للجميع.',
              'Every age group needs a different approach. We never give the same program to everyone.',
              "Chaque tranche d'âge nécessite une approche différente. Nous ne proposons jamais le même programme à tous."
            )}
          </p>
        </div>

        {/* Programs */}
        <div className="space-y-5">
          {PROGRAMS.map((prog) => (
            <div
              key={prog.age}
              className="rounded-3xl overflow-hidden transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              }}
            >
              {/* Top banner */}
              <div className={`bg-gradient-to-l ${prog.gradient} p-6 flex items-center gap-5`}>
                <div className="text-5xl">{prog.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-black text-2xl ltr-num">{pickLang(lang, prog.age, prog.ageEn, prog.ageFr)}</h3>
                  </div>
                  <p className="text-white/90 font-bold text-base">{pickLang(lang, prog.goal, prog.goalEn, prog.goalFr)}</p>
                  <p className="text-white/70 text-sm mt-1">{pickLang(lang, prog.what, prog.whatEn, prog.whatFr)}</p>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 text-right">
                  <span className="text-white/60 text-xs">{prog.diagnosis}</span>
                </div>
              </div>

              {/* 3-column content */}
              <div
                className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >

                {/* APA */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">APA</span>
                    <span className="text-white/60 font-bold text-sm">{pickLang(lang, 'الرياضة المعدّلة', 'Adapted Physical Activity', 'Activité physique adaptée')}</span>
                  </div>
                  <ul className="space-y-2">
                    {pickLang(lang, prog.apa, prog.apaEn, prog.apaFr).map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/55">
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
                    <span className="text-white/60 font-bold text-sm">{pickLang(lang, 'تعديل السلوك', 'Applied Behavior Analysis', 'Analyse appliquée du comportement')}</span>
                  </div>
                  <ul className="space-y-2">
                    {pickLang(lang, prog.aba, prog.abaEn, prog.abaFr).map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/55">
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
                    <span className="text-white/60 font-bold text-sm">{pickLang(lang, 'التدريب المعرفي', 'Cognitive Behavioral Training', 'Entraînement cognitivo-comportemental')}</span>
                  </div>
                  <ul className="space-y-2">
                    {pickLang(lang, prog.cbt, prog.cbtEn, prog.cbtFr).map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/55">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Outcomes footer */}
              <div
                className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white/35">
                    {pickLang(lang, 'النتائج المتوقعة:', 'Expected Outcomes:', 'Résultats attendus :')}
                  </span>
                  {pickLang(lang, prog.outcomes, prog.outcomesEn, prog.outcomesFr).map(o => (
                    <span
                      key={o}
                      className="text-xs font-bold px-2.5 py-1 rounded-full text-white/70"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {o}
                    </span>
                  ))}
                </div>
                <Link href="/register"
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                  {pickLang(lang, 'ابدأ هذا البرنامج ←', 'Start This Program →', 'Démarrer ce programme →')}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-white/35 text-sm mt-8">
          {pickLang(
            lang,
            'كل برنامج يبدأ بتقييم أولي مجاني لتحديد نقطة البداية الدقيقة لطفلك.',
            "Every program begins with a free initial assessment to determine the precise starting point for your child.",
            "Chaque programme débute par une évaluation initiale gratuite afin de déterminer précisément le point de départ de votre enfant."
          )}
        </p>

      </div>
    </section>
  )
}
