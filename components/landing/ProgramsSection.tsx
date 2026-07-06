'use client'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'

const PROGRAMS = [
  {
    age: '5 — 11 سنة',
    ageEn: '5 — 11 Years',
    ageFr: '5 — 11 ans',
    emoji: '🧸',
    goal: 'بناء الأسس الحركية والتنظيم الحسي',
    goalEn: 'Building Motor Foundations & Sensory Regulation',
    goalFr: 'Construire les bases motrices et la régulation sensorielle',
    what: 'الجهاز العصبي في طور البناء — كل تمرين يغذّي المسارات الصحيحة.',
    whatEn: 'The nervous system is still developing — every exercise nourishes the right neural pathways.',
    whatFr: 'Le système nerveux est en construction — chaque exercice nourrit les bonnes voies neuronales.',
    apa: ['مشية الحيوانات الحركية', 'المشي على خط التوازن', 'تمارين الحركة الثنائية', 'ألعاب الكرة الحسية'],
    apaEn: ['Animal locomotion movements', 'Balance beam walking', 'Bilateral movement exercises', 'Sensory ball games'],
    apaFr: ['Déplacements imitant les animaux', "Marche sur ligne d'équilibre", 'Exercices bilatéraux', 'Jeux de ballon sensoriels'],
    aba: ['نظام النجوم اليومي', 'قصة اجتماعية مخصصة', 'مناطق التنظيم الأربع', 'تعزيز إيجابي فوري'],
    abaEn: ['Daily star reward system', 'Personalized social story', 'Four Zones of Regulation', 'Immediate positive reinforcement'],
    abaFr: ['Système d\'étoiles quotidien', 'Histoire sociale personnalisée', 'Quatre zones de régulation', 'Renforcement positif immédiat'],
    cbt: ['تنفس الفقاعات 4-4-4', 'تمرين الضفدع الهادئ', 'ترموميتر المشاعر', 'الاسترخاء العضلي للأطفال'],
    cbtEn: ['Bubble breathing 4-4-4', 'The calm frog exercise', 'Emotion thermometer', 'Progressive muscle relaxation'],
    cbtFr: ['Respiration en bulles 4-4-4', 'L\'exercice de la grenouille calme', 'Thermomètre des émotions', 'Relaxation musculaire progressive'],
    outcomes: ['تحسن التنسيق الحركي', 'تقليل نوبات الغضب', 'بداية الضبط الذاتي'],
    outcomesEn: ['Improved motor coordination', 'Reduced anger episodes', 'Beginning of self-regulation'],
    outcomesFr: ['Coordination motrice améliorée', 'Moins de crises de colère', 'Début de l\'autorégulation'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
    gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
    glow: 'rgba(245,158,11,0.18)',
    accent: '#F59E0B',
    accentDark: '#92400E',
    chipBg: 'rgba(245,158,11,0.08)',
  },
  {
    age: '12 — 17 سنة',
    ageEn: '12 — 17 Years',
    ageFr: '12 — 17 ans',
    emoji: '🎯',
    goal: 'الوظيفة التنفيذية والضبط الذاتي',
    goalEn: 'Executive Function & Self-Control',
    goalFr: 'Fonctions exécutives et maîtrise de soi',
    what: 'المراهق يحتاج أدوات، لا أوامر. نبنيها داخله عبر تدريب الدماغ بالحركة.',
    whatEn: 'The teenager needs tools, not commands. We build them from within through brain training with movement.',
    whatFr: 'L\'adolescent a besoin d\'outils. Nous les construisons via l\'entraînement cérébral par le mouvement.',
    apa: ['تمارين الإيقاع والتنسيق', 'الاسترخاء العضلي التدريجي', 'الرياضة الجماعية المعدلة', 'مزامنة الميترونوم'],
    apaEn: ['Rhythm and coordination exercises', 'Progressive muscle relaxation', 'Modified group sports', 'Metronome synchronization'],
    apaFr: ['Exercices de rythme et coordination', 'Relaxation musculaire progressive', 'Sports collectifs adaptés', 'Synchronisation au métronome'],
    aba: ['بروتوكول PEERS للمهارات الاجتماعية', 'نظام النقاط المتقدم', 'ترموميتر الغضب + CBT', 'القصص الاجتماعية للمراهقين'],
    abaEn: ['PEERS social skills protocol', 'Advanced points system', 'Anger thermometer + CBT', 'Social stories for teens'],
    abaFr: ['Protocole PEERS', 'Système de points avancé', 'Thermomètre colère + TCC', 'Histoires sociales pour ados'],
    cbt: ['تدريب الذاكرة العاملة (Cogmed)', 'برج المهام التنفيذية', 'تحدي التسلسل المعكوس', 'اليقظة الذهنية الحركية'],
    cbtEn: ['Working memory training (Cogmed)', 'Executive Task Tower', 'Reverse sequence challenge', 'Movement-based mindfulness'],
    cbtFr: ['Mémoire de travail (Cogmed)', 'Tour des tâches exécutives', 'Défi de séquence inversée', 'Pleine conscience par le mouvement'],
    outcomes: ['تحسن الأداء الأكاديمي', 'مهارات اجتماعية حقيقية', 'إدارة الغضب والإحباط'],
    outcomesEn: ['Improved academic performance', 'Real social skills', 'Anger and frustration management'],
    outcomesFr: ['Performance scolaire améliorée', 'Compétences sociales concrètes', 'Gestion de la colère'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
    gradient: 'linear-gradient(135deg, #6B46F0, #9A7BFD)',
    glow: 'rgba(107,70,240,0.15)',
    accent: '#6B46F0',
    accentDark: '#4C1D95',
    chipBg: 'rgba(107,70,240,0.07)',
  },
  {
    age: '18 — 22 سنة',
    ageEn: '18 — 22 Years',
    ageFr: '18 — 22 ans',
    emoji: '💪',
    goal: 'الاستقلالية والتكيف في الحياة',
    goalEn: 'Independence & Life Adaptation',
    goalFr: 'Autonomie et adaptation à la vie',
    what: 'الشاب يحتاج مهارات حياتية حقيقية: التنظيم، العمل، العلاقات الاجتماعية.',
    whatEn: 'The young adult needs real life skills: organization, work, and social relationships.',
    whatFr: 'Le jeune adulte a besoin de compétences de vie : organisation, travail, relations sociales.',
    apa: ['دائرة القوة اليقظة', 'اليوغا المعدلة للـ ADHD', 'تمارين التنفس المتقدمة', 'لعبة الحركة الاجتماعية'],
    apaEn: ['Mindful strength circuit', 'Modified yoga for ADHD', 'Advanced breathing exercises', 'Social movement game'],
    apaFr: ['Circuit de renforcement', 'Yoga adapté au TDAH', 'Exercices de respiration avancés', 'Jeu de mouvement social'],
    aba: ['PEERS للمهارات المهنية والعلاقات', 'أدوات الضبط الذاتي اليومي', 'خطة تعديل عادات النوم', 'استراتيجيات بيئة العمل'],
    abaEn: ['PEERS for professional skills', 'Daily self-regulation tools', 'Sleep habit modification plan', 'Workplace strategies'],
    abaFr: ['PEERS compétences professionnelles', 'Outils d\'autorégulation', 'Plan habitudes de sommeil', 'Stratégies en milieu de travail'],
    cbt: ['تخطيط الأهداف طويل المدى', 'تحليل وحل المشكلات', 'تقنيات Pomodoro للـ ADHD', 'إدارة الإجهاد والقلق'],
    cbtEn: ['Long-term goal planning', 'Problem analysis and solving', 'Pomodoro techniques for ADHD', 'Stress and anxiety management'],
    cbtFr: ['Planification d\'objectifs', 'Résolution de problèmes', 'Techniques Pomodoro TDAH', 'Gestion du stress et anxiété'],
    outcomes: ['استقلالية يومية فعلية', 'الاندماج الاجتماعي والمهني', 'تقدير الذات والثقة'],
    outcomesEn: ['Genuine daily independence', 'Social and professional integration', 'Self-esteem and confidence'],
    outcomesFr: ['Autonomie quotidienne réelle', 'Intégration sociale et professionnelle', 'Estime de soi et confiance'],
    diagnosis: 'ADHD • Autism • ADHD+Autism',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    glow: 'rgba(16,185,129,0.15)',
    accent: '#10B981',
    accentDark: '#064E3B',
    chipBg: 'rgba(16,185,129,0.07)',
  },
]

const METHODS = [
  { key: 'apa' as const, label: 'الرياضة المعدّلة', labelEn: 'Adapted Physical', labelFr: 'Physique adapté', badge: 'APA', color: '#2563EB', bg: 'rgba(37,99,235,0.07)', dot: '#3B82F6' },
  { key: 'aba' as const, label: 'تعديل السلوك', labelEn: 'Behavior Analysis', labelFr: 'Analyse comportementale', badge: 'ABA', color: '#059669', bg: 'rgba(5,150,105,0.07)', dot: '#10B981' },
  { key: 'cbt' as const, label: 'التدريب المعرفي', labelEn: 'Cognitive Training', labelFr: 'Entraînement cognitif', badge: 'CBT', color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', dot: '#8B5CF6' },
]

export default function ProgramsSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      id="programs"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 55% 45% at 50% 0%, rgba(107,70,240,0.04) 0%, transparent 60%),
          #FFF8F0
        `,
        padding: '96px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0' }}
          >
            {pickLang(lang, 'البرامج التخصصية', 'Specialized Programs', 'Programmes spécialisés')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-5" style={{ color: '#1E293B' }}>
            {pickLang(lang, 'برنامج مخصص لكل مرحلة عمرية', 'A Tailored Program for Every Age Group', "Un programme adapté à chaque tranche d'âge")}
          </h2>
          <p className="max-w-xl mx-auto text-lg" style={{ color: '#64748B' }}>
            {pickLang(lang,
              'كل فئة عمرية تحتاج نهجاً مختلفاً. نحن لا نُعطي نفس البرنامج للجميع.',
              'Every age group needs a different approach. We never give the same program to everyone.',
              "Chaque tranche d'âge nécessite une approche différente.",
            )}
          </p>
        </div>

        {/* 3 cards — all visible */}
        <div className="pg-grid">
          {PROGRAMS.map((prog) => {
            const apaItems  = pickLang(lang, prog.apa,  prog.apaEn,  prog.apaFr)
            const abaItems  = pickLang(lang, prog.aba,  prog.abaEn,  prog.abaFr)
            const cbtItems  = pickLang(lang, prog.cbt,  prog.cbtEn,  prog.cbtFr)
            const outItems  = pickLang(lang, prog.outcomes, prog.outcomesEn, prog.outcomesFr)
            const methodItems = [apaItems, abaItems, cbtItems]

            return (
              <div
                key={prog.age}
                className="pg-card"
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: `0 8px 36px ${prog.glow}, 0 2px 8px rgba(0,0,0,0.04)`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Gradient banner */}
                <div style={{ background: prog.gradient, padding: '26px 22px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{ fontSize: 46, lineHeight: 1 }}>{prog.emoji}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isRtl ? 'flex-start' : 'flex-end' }}>
                      {prog.diagnosis.split(' • ').map(d => (
                        <span
                          key={d}
                          style={{
                            background: 'rgba(255,255,255,0.22)',
                            color: 'white',
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: 0.3,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3
                    style={{
                      color: 'white', fontWeight: 900, fontSize: 24, margin: '0 0 4px', letterSpacing: -0.5,
                      direction: 'ltr', textAlign: isRtl ? 'right' : 'left',
                    }}
                  >
                    {pickLang(lang, prog.age, prog.ageEn, prog.ageFr)}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.96)', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>
                    {pickLang(lang, prog.goal, prog.goalEn, prog.goalFr)}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    {pickLang(lang, prog.what, prog.whatEn, prog.whatFr)}
                  </p>
                </div>

                {/* Methods */}
                <div style={{ padding: '20px 20px 4px', flex: 1 }}>
                  {METHODS.map((method, mi) => (
                    <div key={method.key} style={{ marginBottom: 16 }}>
                      {/* Method label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <span
                          style={{
                            background: method.color,
                            color: 'white',
                            fontSize: 9,
                            fontWeight: 900,
                            padding: '3px 9px',
                            borderRadius: 20,
                            letterSpacing: 0.5,
                          }}
                        >
                          {method.badge}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 11, color: '#94A3B8' }}>
                          {pickLang(lang, method.label, method.labelEn, method.labelFr)}
                        </span>
                      </div>
                      {/* Items as chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {methodItems[mi].map(item => (
                          <span
                            key={item}
                            style={{
                              background: method.bg,
                              color: method.color,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 10,
                              lineHeight: 1.4,
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Outcomes + CTA footer */}
                <div
                  style={{
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    background: 'rgba(249,247,255,0.6)',
                    padding: '16px 20px',
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {pickLang(lang, 'النتائج المتوقعة', 'Expected Outcomes', 'Résultats attendus')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {outItems.map(o => (
                      <span
                        key={o}
                        style={{
                          background: prog.chipBg,
                          border: `1px solid ${prog.accent}22`,
                          color: prog.accentDark,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                        }}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 900,
                      color: prog.accent,
                      textDecoration: 'none',
                      padding: '7px 14px',
                      background: prog.chipBg,
                      borderRadius: 12,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {pickLang(lang, 'ابدأ هذا البرنامج', 'Start This Program', 'Démarrer ce programme')}
                    <span style={{ fontSize: 14 }}>{isRtl ? '←' : '→'}</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm mt-10" style={{ color: '#94A3B8' }}>
          {pickLang(
            lang,
            'كل برنامج يبدأ بتقييم أولي مجاني لتحديد نقطة البداية الدقيقة لطفلك.',
            'Every program begins with a free initial assessment to determine the precise starting point for your child.',
            "Chaque programme débute par une évaluation initiale gratuite pour déterminer précisément le point de départ de votre enfant.",
          )}
        </p>

      </div>

      <style>{`
        .pg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        .pg-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .pg-card:hover {
          transform: translateY(-4px);
        }
        @media (max-width: 1024px) {
          .pg-grid {
            grid-template-columns: 1fr;
            max-width: 540px;
            margin: 0 auto;
          }
        }
        @media (min-width: 640px) and (max-width: 1024px) {
          .pg-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 100%;
          }
        }
      `}</style>
    </section>
  )
}
