'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Brain, Dumbbell, Heart, Target, Sparkles, Users, BarChart3, Video } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

const PILLARS = [
  {
    id: 'apa',
    tag: 'APA',
    icon: Dumbbell,
    gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
    glow: 'rgba(37,99,235,0.12)',
    chipColor: '#1D4ED8',
    chipBg: 'rgba(37,99,235,0.08)',
    title: 'الرياضة المعدّلة',
    titleEn: 'Adapted Physical Activity',
    titleFr: 'Activité physique adaptée',
    subtitle: 'Adapted Physical Activity',
    desc: 'حركة هادفة تُعيد بناء الجهاز العصبي. كل تمرين مصمم بدقة لتشخيص طفلك، فئته العمرية، وملفه الحسي — لا تمارين جاهزة.',
    descEn: "Purposeful movement that rebuilds the nervous system. Every exercise is precisely designed for your child's diagnosis, age group, and sensory profile — no generic routines.",
    descFr: "Un mouvement intentionnel qui reconstruit le système nerveux. Chaque exercice est conçu avec précision selon le diagnostic de votre enfant.",
    bullets: ['تنسيق حركي ودهليزي', 'تفريغ الطاقة بطريقة منظمة', 'تكامل حسي (Ayres)', 'إيقاع وتوقيت عصبي'],
    bulletsEn: ['Motor & vestibular coordination', 'Structured energy release', 'Sensory integration (Ayres)', 'Neural rhythm & timing'],
    bulletsFr: ['Coordination motrice et vestibulaire', "Libération d'énergie structurée", 'Intégration sensorielle (Ayres)', 'Rythme et timing neuronal'],
    stat: '+87%',
    statLabel: 'تحسن في التنسيق الحركي',
    statLabelEn: 'Improvement in motor coordination',
    statLabelFr: 'Amélioration de la coordination motrice',
  },
  {
    id: 'aba',
    tag: 'ABA',
    icon: Target,
    gradient: 'linear-gradient(135deg, #059669, #34D399)',
    glow: 'rgba(5,150,105,0.12)',
    chipColor: '#065F46',
    chipBg: 'rgba(5,150,105,0.08)',
    title: 'تعديل السلوك',
    titleEn: 'Applied Behavior Analysis',
    titleFr: 'Analyse appliquée du comportement',
    subtitle: 'Applied Behavior Analysis',
    desc: 'نظام علمي معتمد دولياً يحوّل السلوكيات الصعبة إلى سلوكيات إيجابية — مع نظام نقاط يشغّل دوبامين المكافأة في دماغ الطفل.',
    descEn: "An internationally accredited system that transforms challenging behaviors into positive ones — with a points system that activates the child's reward dopamine circuit.",
    descFr: "Un système reconnu à l'international qui transforme les comportements difficiles en comportements positifs grâce à un renforcement structuré.",
    bullets: ['Token Economy', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS للمهارات الاجتماعية'],
    bulletsEn: ['Token Economy system', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS social skills protocol'],
    bulletsFr: ['Système Token Economy', 'Zone of Regulation', 'Histoires sociales (Carol Gray)', 'Protocole PEERS'],
    stat: '76%',
    statLabel: 'انخفاض السلوكيات الصعبة',
    statLabelEn: 'Reduction in challenging behaviors',
    statLabelFr: 'Réduction des comportements difficiles',
  },
  {
    id: 'cbt',
    tag: 'CBT',
    icon: Brain,
    gradient: 'linear-gradient(135deg, #7C3AED, #C084FC)',
    glow: 'rgba(124,58,237,0.12)',
    chipColor: '#5B21B6',
    chipBg: 'rgba(124,58,237,0.08)',
    title: 'التدريب المعرفي',
    titleEn: 'Cognitive Behavioral Training',
    titleFr: 'Entraînement cognitivo-comportemental',
    subtitle: 'Cognitive Behavioral Training',
    desc: 'تمارين الوظيفة التنفيذية تبني الذاكرة العاملة، تكبح الاندفاعية، وتطوّر التخطيط — بروتوكولات Cogmed معتمدة بدراسات دولية.',
    descEn: 'Executive function exercises build working memory, inhibit impulsivity, and develop planning skills — Cogmed protocols validated by international research.',
    descFr: "Les exercices de fonction exécutive développent la mémoire de travail, freinent l'impulsivité — protocoles Cogmed validés par la recherche internationale.",
    bullets: ['تدريب الذاكرة العاملة', 'ترموميتر الغضب', 'اليقظة الذهنية للـ ADHD', 'تحليل المهام (برج المهام)'],
    bulletsEn: ['Working memory training', 'Anger thermometer', 'Mindfulness for ADHD', 'Task analysis (Tower of Tasks)'],
    bulletsFr: ['Mémoire de travail', 'Thermomètre de la colère', 'Pleine conscience TDAH', 'Analyse des tâches'],
    stat: '35%',
    statLabel: 'تقليل أعراض ADHD (Cogmed 2014)',
    statLabelEn: 'Reduction in ADHD symptoms (Cogmed 2014)',
    statLabelFr: 'Réduction des symptômes TDAH (Cogmed 2014)',
  },
]

const EXTRA = [
  { icon: Video,     gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)', title: 'جلسات تفاعلية بالفيديو', titleEn: 'Live Video Sessions', titleFr: 'Séances vidéo en direct', desc: 'الأستاذ يشاهد الطفل مباشرة ويصحح الحركة في الوقت الفعلي', descEn: 'The instructor watches the child live and corrects movement in real time', descFr: "L'instructeur observe l'enfant en direct et corrige le mouvement en temps réel" },
  { icon: Heart,     gradient: 'linear-gradient(135deg,#F43F5E,#FB7185)', title: 'توجيه الوالدين', titleEn: 'Parent Coaching', titleFr: 'Accompagnement des parents', desc: 'كل جلسة تنتهي بـ 10 دقائق توجيه للوالد على المتابعة اليومية في البيت', descEn: 'Every session ends with 10 minutes of parent guidance on daily home follow-up', descFr: "Chaque séance se termine par 10 minutes de conseils au parent pour le suivi quotidien" },
  { icon: BarChart3, gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)', title: 'تقارير ذكية', titleEn: 'Smart Reports', titleFr: 'Rapports intelligents', desc: 'تقارير دورية تقيس 5 محاور سلوكية مع تفسير علمي وخطة تعديل', descEn: 'Periodic reports measuring 5 behavioral dimensions with scientific interpretation', descFr: "Des rapports périodiques mesurant 5 dimensions comportementales" },
  { icon: Sparkles,  gradient: 'linear-gradient(135deg,#6366F1,#60A5FA)', title: 'تلعيب وتحفيز', titleEn: 'Gamification & Motivation', titleFr: 'Ludification et motivation', desc: 'نقاط وإنجازات وتحديات تجعل الطفل يطلب التمرين بنفسه', descEn: 'Points, achievements, and challenges that make children ask to exercise on their own', descFr: "Points, succès et défis qui donnent envie à l'enfant de s'exercer de lui-même" },
  { icon: Users,     gradient: 'linear-gradient(135deg,#14B8A6,#2DD4BF)', title: 'مجتمع الأسر', titleEn: 'Family Community', titleFr: 'Communauté des familles', desc: 'مجموعة واتساب حصرية للأسر لتبادل التجارب والدعم المتبادل', descEn: 'Exclusive WhatsApp group for families to share experiences and support each other', descFr: "Groupe WhatsApp exclusif pour les familles, pour échanger leurs expériences" },
  { icon: Brain,     gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', title: 'صعوبات التعلم', titleEn: 'Learning Difficulties', titleFr: "Troubles de l'apprentissage", desc: 'تشخيص وتدخل متخصص لعسر القراءة والكتابة والحساب — برامج مخصصة لكل طفل', descEn: 'Specialized diagnosis & intervention for dyslexia, dysgraphia & dyscalculia', descFr: "Diagnostic et intervention spécialisés pour la dyslexie, dysgraphie et dyscalculie" },
]

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export default function FeaturesSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="features"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at 80% 20%, rgba(107,70,240,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 20% 80%, rgba(42,191,163,0.04) 0%, transparent 60%),
          #FFF8F0
        `,
        padding: '96px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0' }}
          >
            {pickLang(lang, 'المنهجية العلمية', 'Scientific Methodology', 'Méthodologie scientifique')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-5" style={{ color: '#1E293B' }}>
            {pickLang(lang, 'ثلاث ركائز علمية في برنامج واحد', 'Three Scientific Pillars in One Program', 'Trois piliers scientifiques dans un seul programme')}
          </h2>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed" style={{ color: '#64748B' }}>
            {pickLang(
              lang,
              'لا يوجد في المنطقة برنامج يجمع الثلاثة معاً. كل ركيزة معتمدة بدراسات دولية — الثلاثة معاً تُعطي نتائج لا تقدر بثمن.',
              'No program in the region combines all three. Each pillar is validated by international studies — together they produce invaluable results.',
              "Aucun programme de la région ne réunit ces trois approches. Ensemble, ils produisent des résultats inestimables."
            )}
          </p>
        </motion.div>

        {/* 3 equal pillar cards */}
        <div className="fs-grid mb-16">
          {PILLARS.map((p, i) => {
            const Icon = p.icon
            const bullets = pickLang(lang, p.bullets, p.bulletsEn, p.bulletsFr)
            return (
              <motion.div
                key={p.id}
                className="fs-card"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: EASE }}
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: `0 10px 40px ${p.glow}, 0 2px 8px rgba(0,0,0,0.04)`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Gradient hero header */}
                <div
                  style={{
                    background: p.gradient,
                    padding: '28px 24px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: -30, insetInlineEnd: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -20, insetInlineStart: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                  {/* Badge + icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                    <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 20, letterSpacing: 1.5 }}>
                      {p.tag}
                    </span>
                    <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 22, height: 22, color: 'white' }} />
                    </div>
                  </div>

                  {/* Big stat */}
                  <div
                    className="ltr-num"
                    style={{ fontSize: 56, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 4, position: 'relative', letterSpacing: -2 }}
                  >
                    {p.stat}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, margin: '0 0 18px', position: 'relative' }}>
                    {pickLang(lang, p.statLabel, p.statLabelEn, p.statLabelFr)}
                  </p>

                  {/* Title */}
                  <div style={{ position: 'relative' }}>
                    <h3 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: '0 0 2px' }}>
                      {pickLang(lang, p.title, p.titleEn, p.titleFr)}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0, fontWeight: 500 }}>{p.subtitle}</p>
                  </div>
                </div>

                {/* White body */}
                <div style={{ padding: '22px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, margin: 0 }}>
                    {pickLang(lang, p.desc, p.descEn, p.descFr)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bullets.map(b => (
                      <span
                        key={b}
                        style={{
                          background: p.chipBg,
                          color: p.chipColor,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 11px',
                          borderRadius: 10,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <span className="text-sm font-bold whitespace-nowrap px-2" style={{ color: '#94A3B8' }}>
            {pickLang(lang, 'بالإضافة إلى', 'Plus', 'En plus')}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </motion.div>

        {/* Extra features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXTRA.map(({ icon: Icon, gradient, title, titleEn, titleFr, desc, descEn, descFr }, index) => (
            <motion.div
              key={title}
              className="flex items-start gap-4 p-5 rounded-2xl fs-extra"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.07, ease: EASE }}
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                style={{ background: gradient, width: 46, height: 46, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
              >
                <Icon className="text-white" style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h4 className="font-black text-sm mb-1" style={{ color: '#1E293B' }}>
                  {pickLang(lang, title, titleEn, titleFr)}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                  {pickLang(lang, desc, descEn, descFr)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      <style>{`
        .fs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        .fs-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .fs-card:hover {
          transform: translateY(-5px);
        }
        .fs-extra {
          transition: transform 0.2s ease;
        }
        .fs-extra:hover {
          transform: translateY(-2px);
        }
        @media (max-width: 1024px) {
          .fs-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
        }
        @media (min-width: 640px) and (max-width: 1024px) {
          .fs-grid { grid-template-columns: repeat(2, 1fr); max-width: 100%; }
        }
      `}</style>
    </section>
  )
}
