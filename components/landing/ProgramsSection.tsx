'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'

const PROGRAMS = [
  {
    age: '5 — 11 سنة',
    ageEn: '5 — 11 Years',
    ageFr: '5 — 11 ans',
    emoji: '🧸',
    gradient: 'from-orange-500 to-amber-500',
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
  const [active, setActive] = useState(0)
  const prog = PROGRAMS[active]

  const gradients = [
    'linear-gradient(135deg, #F59E0B, #F97316)',
    'linear-gradient(135deg, #6B46F0, #9A7BFD)',
    'linear-gradient(135deg, #10B981, #34D399)',
  ]
  const glows = [
    'rgba(245,158,11,0.15)',
    'rgba(107,70,240,0.12)',
    'rgba(16,185,129,0.12)',
  ]

  return (
    <section id="programs" dir={isRtl ? 'rtl' : 'ltr'} style={{ background: `radial-gradient(ellipse 55% 45% at 50% 0%, rgba(107,70,240,0.04) 0%, transparent 60%), #FFF8F0`, padding: '96px 0' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0' }}>
            {pickLang(lang, 'البرامج التخصصية', 'Specialized Programs', 'Programmes spécialisés')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-5" style={{ color: '#1E293B' }}>
            {pickLang(lang, 'برنامج مخصص لكل مرحلة عمرية', 'A Tailored Program for Every Age Group', "Un programme adapté à chaque tranche d'âge")}
          </h2>
          <p className="max-w-xl mx-auto text-lg" style={{ color: '#64748B' }}>
            {pickLang(lang, 'كل فئة عمرية تحتاج نهجاً مختلفاً. نحن لا نُعطي نفس البرنامج للجميع.', 'Every age group needs a different approach. We never give the same program to everyone.', "Chaque tranche d'âge nécessite une approche différente. Nous ne proposons jamais le même programme à tous.")}
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {PROGRAMS.map((p, i) => {
            const isActive = i === active
            return (
              <button
                key={p.age}
                onClick={() => setActive(i)}
                className="transition-all duration-300 rounded-2xl font-black text-sm px-6 py-3.5 flex items-center gap-2.5"
                style={{
                  background: isActive ? gradients[i] : 'rgba(255,255,255,0.9)',
                  color: isActive ? 'white' : '#64748B',
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.08)',
                  boxShadow: isActive ? `0 8px 28px ${glows[i]}` : '0 2px 8px rgba(0,0,0,0.05)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <span className="ltr-num">{pickLang(lang, p.age, p.ageEn, p.ageFr)}</span>
              </button>
            )
          })}
        </div>

        {/* Content card */}
        <div
          key={active}
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.97)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: `0 20px 60px ${glows[active]}, 0 4px 20px rgba(0,0,0,0.06)`,
            animation: 'pgAppear 0.35s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Banner */}
          <div style={{ background: gradients[active], padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 52 }}>{prog.emoji}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, lineHeight: 1, letterSpacing: -0.5 }} className="ltr-num">
                {pickLang(lang, prog.age, prog.ageEn, prog.ageFr)}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: 16, margin: '6px 0 4px' }}>
                {pickLang(lang, prog.goal, prog.goalEn, prog.goalFr)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: 0 }}>
                {pickLang(lang, prog.what, prog.whatEn, prog.whatFr)}
              </p>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, textAlign: isRtl ? 'right' : 'left', flexShrink: 0 }}>
              {prog.diagnosis.split(' • ').map(d => (
                <div key={d} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '3px 8px', marginBottom: 4, color: 'white', fontWeight: 700, fontSize: 10 }}>{d}</div>
              ))}
            </div>
          </div>

          {/* 3-column content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {/* APA */}
            <div style={{ padding: '28px 24px', borderLeft: isRtl ? 'none' : '1px solid rgba(0,0,0,0.06)', borderRight: isRtl ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ background: '#2563EB', color: 'white', fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 20 }}>APA</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#64748B' }}>{pickLang(lang, 'الرياضة المعدّلة', 'Adapted Physical Activity', 'Activité physique adaptée')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pickLang(lang, prog.apa, prog.apaEn, prog.apaFr).map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    <span style={{ width: 6, height: 6, background: '#3B82F6', borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ABA */}
            <div style={{ padding: '28px 24px', borderLeft: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ background: '#059669', color: 'white', fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 20 }}>ABA</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#64748B' }}>{pickLang(lang, 'تعديل السلوك', 'Applied Behavior Analysis', 'Analyse appliquée du comportement')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pickLang(lang, prog.aba, prog.abaEn, prog.abaFr).map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CBT */}
            <div style={{ padding: '28px 24px', borderRight: isRtl ? 'none' : '1px solid rgba(0,0,0,0.06)', borderLeft: isRtl ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ background: '#7C3AED', color: 'white', fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 20 }}>CBT</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#64748B' }}>{pickLang(lang, 'التدريب المعرفي', 'Cognitive Behavioral Training', 'Entraînement cognitivo-comportemental')}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pickLang(lang, prog.cbt, prog.cbtEn, prog.cbtFr).map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    <span style={{ width: 6, height: 6, background: '#8B5CF6', borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Outcomes footer */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(249,247,255,0.7)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                {pickLang(lang, 'النتائج المتوقعة:', 'Expected Outcomes:', 'Résultats attendus :')}
              </span>
              {pickLang(lang, prog.outcomes, prog.outcomesEn, prog.outcomesFr).map(o => (
                <span key={o} style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.12)', color: '#6B46F0', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                  {o}
                </span>
              ))}
            </div>
            <Link href="/register" style={{ fontSize: 12, fontWeight: 900, color: '#6B46F0', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {pickLang(lang, 'ابدأ هذا البرنامج ←', 'Start This Program →', 'Démarrer ce programme →')}
            </Link>
          </div>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: '#94A3B8' }}>
          {pickLang(lang, 'كل برنامج يبدأ بتقييم أولي مجاني لتحديد نقطة البداية الدقيقة لطفلك.', "Every program begins with a free initial assessment to determine the precise starting point for your child.", "Chaque programme débute par une évaluation initiale gratuite afin de déterminer précisément le point de départ de votre enfant.")}
        </p>

      </div>

      <style>{`@keyframes pgAppear { from { opacity: 0; transform: translateY(12px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </section>
  )
}
