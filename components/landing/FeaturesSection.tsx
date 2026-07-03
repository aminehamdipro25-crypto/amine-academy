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
    gradientBorder: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    gradientStat: 'linear-gradient(135deg, #60A5FA, #38BDF8)',
    glowColor: 'rgba(59,130,246,0.08)',
    dotColor: '#3B82F6',
    title: 'الرياضة المعدّلة',
    titleEn: 'Adapted Physical Activity',
    titleFr: 'Activité physique adaptée',
    subtitle: 'Adapted Physical Activity',
    desc: 'حركة هادفة تُعيد بناء الجهاز العصبي. كل تمرين مصمم بدقة لتشخيص طفلك، فئته العمرية، وملفه الحسي — لا تمارين جاهزة.',
    descEn: "Purposeful movement that rebuilds the nervous system. Every exercise is precisely designed for your child's diagnosis, age group, and sensory profile — no generic routines.",
    descFr: "Un mouvement intentionnel qui reconstruit le système nerveux. Chaque exercice est conçu avec précision selon le diagnostic, la tranche d'âge et le profil sensoriel de votre enfant.",
    bullets: ['تنسيق حركي ودهليزي', 'تفريغ الطاقة بطريقة منظمة', 'تكامل حسي (Ayres)', 'إيقاع وتوقيت عصبي'],
    bulletsEn: ['Motor & vestibular coordination', 'Structured energy release', 'Sensory integration (Ayres)', 'Neural rhythm & timing'],
    bulletsFr: ['Coordination motrice et vestibulaire', "Libération d'énergie structurée", 'Intégration sensorielle (Ayres)', 'Rythme et timing neuronal'],
    stat: '+87%', statLabel: 'تحسن في التنسيق الحركي', statLabelEn: 'Improvement in motor coordination', statLabelFr: 'Amélioration de la coordination motrice',
  },
  {
    id: 'aba',
    tag: 'ABA',
    icon: Target,
    gradientBorder: 'linear-gradient(135deg, #10B981, #34D399)',
    gradientStat: 'linear-gradient(135deg, #34D399, #6EE7B7)',
    glowColor: 'rgba(16,185,129,0.08)',
    dotColor: '#10B981',
    title: 'تعديل السلوك',
    titleEn: 'Applied Behavior Analysis',
    titleFr: 'Analyse appliquée du comportement',
    subtitle: 'Applied Behavior Analysis',
    desc: 'نظام علمي معتمد دولياً يحوّل السلوكيات الصعبة إلى سلوكيات إيجابية عبر التعزيز المنظم — مع نظام نقاط يشغّل دوبامين الطفل.',
    descEn: "An internationally accredited scientific system that transforms challenging behaviors into positive ones through structured reinforcement — with a points system that activates the child's dopamine reward circuit.",
    descFr: "Un système scientifique reconnu à l'international qui transforme les comportements difficiles en comportements positifs grâce à un renforcement structuré.",
    bullets: ['نظام Token Economy', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS للمهارات الاجتماعية'],
    bulletsEn: ['Token Economy system', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS social skills protocol'],
    bulletsFr: ['Système Token Economy', 'Zone of Regulation', 'Histoires sociales (Carol Gray)', 'Protocole PEERS pour les compétences sociales'],
    stat: '76%', statLabel: 'انخفاض السلوكيات الصعبة', statLabelEn: 'Reduction in challenging behaviors', statLabelFr: 'Réduction des comportements difficiles',
  },
  {
    id: 'cbt',
    tag: 'CBT',
    icon: Brain,
    gradientBorder: 'linear-gradient(135deg, #8B5CF6, #C084FC)',
    gradientStat: 'linear-gradient(135deg, #A78BFA, #C084FC)',
    glowColor: 'rgba(139,92,246,0.08)',
    dotColor: '#8B5CF6',
    title: 'التدريب المعرفي',
    titleEn: 'Cognitive Behavioral Training',
    titleFr: 'Entraînement cognitivo-comportemental',
    subtitle: 'Cognitive Behavioral Training',
    desc: 'تمارين الوظيفة التنفيذية تبني الذاكرة العاملة، تكبح الاندفاعية، وتطوّر التخطيط — بروتوكولات مستوحاة من Cogmed ومعتمدة بدراسات دولية.',
    descEn: 'Executive function exercises build working memory, inhibit impulsivity, and develop planning skills — protocols inspired by Cogmed and validated by international research.',
    descFr: "Les exercices de fonction exécutive développent la mémoire de travail, freinent l'impulsivité et renforcent la planification — des protocoles inspirés de Cogmed.",
    bullets: ['تدريب الذاكرة العاملة', 'ترموميتر الغضب', 'اليقظة الذهنية للـ ADHD', 'تحليل المهام (برج المهام)'],
    bulletsEn: ['Working memory training', 'Anger thermometer', 'Mindfulness for ADHD', 'Task analysis (Tower of Tasks)'],
    bulletsFr: ['Entraînement de la mémoire de travail', 'Thermomètre de la colère', 'Pleine conscience pour le TDAH', 'Analyse des tâches (Tour des tâches)'],
    stat: '35%', statLabel: 'تقليل أعراض ADHD (Cogmed 2014)', statLabelEn: 'Reduction in ADHD symptoms (Cogmed 2014)', statLabelFr: 'Réduction des symptômes du TDAH (Cogmed 2014)',
  },
]

const EXTRA = [
  { icon: Video,     gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)', title: 'جلسات تفاعلية بالفيديو', titleEn: 'Live Video Sessions', titleFr: 'Séances vidéo en direct', desc: 'الأستاذ يشاهد الطفل مباشرة ويصحح الحركة في الوقت الفعلي', descEn: 'The instructor watches the child live and corrects movement in real time', descFr: "L'instructeur observe l'enfant en direct et corrige le mouvement en temps réel" },
  { icon: Heart,     gradient: 'linear-gradient(135deg,#F43F5E,#FB7185)', title: 'توجيه الوالدين', titleEn: 'Parent Coaching', titleFr: 'Accompagnement des parents', desc: 'كل جلسة تنتهي بـ 10 دقائق توجيه للوالد على المتابعة اليومية في البيت', descEn: 'Every session ends with 10 minutes of parent guidance on daily home follow-up', descFr: "Chaque séance se termine par 10 minutes de conseils au parent pour le suivi quotidien à la maison" },
  { icon: BarChart3, gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)', title: 'تقارير ذكية', titleEn: 'Smart Reports', titleFr: 'Rapports intelligents', desc: 'تقارير دورية تقيس 5 محاور سلوكية مع تفسير علمي وخطة تعديل', descEn: 'Periodic reports measuring 5 behavioral dimensions with scientific interpretation', descFr: "Des rapports périodiques mesurant 5 dimensions comportementales" },
  { icon: Sparkles,  gradient: 'linear-gradient(135deg,#6366F1,#60A5FA)', title: 'تلعيب وتحفيز', titleEn: 'Gamification & Motivation', titleFr: 'Ludification et motivation', desc: 'نقاط وإنجازات وتحديات تجعل الطفل يطلب التمرين بنفسه', descEn: 'Points, achievements, and challenges that make children ask to exercise on their own', descFr: "Points, succès et défis qui donnent envie à l'enfant de s'exercer de lui-même" },
  { icon: Users,     gradient: 'linear-gradient(135deg,#14B8A6,#2DD4BF)', title: 'مجتمع الأسر', titleEn: 'Family Community', titleFr: 'Communauté des familles', desc: 'مجموعة واتساب حصرية للأسر لتبادل التجارب والدعم المتبادل', descEn: 'Exclusive WhatsApp group for families to share experiences and support each other', descFr: "Groupe WhatsApp exclusif pour les familles, pour échanger leurs expériences" },
  { icon: Brain,     gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', title: 'صعوبات التعلم', titleEn: 'Learning Difficulties', titleFr: "Troubles de l'apprentissage", desc: 'تشخيص وتدخل متخصص لعسر القراءة والكتابة والحساب — برامج مخصصة لكل طفل', descEn: 'Specialized diagnosis & intervention for dyslexia, dysgraphia & dyscalculia', descFr: "Diagnostic et intervention spécialisés pour la dyslexie, dysgraphie et dyscalculie" },
]

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const cardStyle = {
  background: 'rgba(255,255,255,0.97)',
  border: '1px solid rgba(0,0,0,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}

export default function FeaturesSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const apa = PILLARS[0]
  const ApaIcon = apa.icon

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
            style={{
              background: 'rgba(107,70,240,0.08)',
              border: '1px solid rgba(107,70,240,0.15)',
              color: '#6B46F0',
            }}
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
              "Aucun programme de la région ne réunit ces trois approches. Chaque pilier est validé par des études internationales — ensemble, ils produisent des résultats inestimables."
            )}
          </p>
        </motion.div>

        {/* Asymmetric bento: APA large (col-span-2 row-span-2), ABA + CBT stacked */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">

          {/* APA — large hero card */}
          <motion.div
            className="rounded-3xl p-7 md:col-span-2 md:row-span-2 flex flex-col"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.4, delay: 0, ease: EASE }}
            whileHover={{ y: -2 }}
            style={cardStyle}
          >
            {/* Tag + Icon */}
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-white text-xs font-black px-3 py-1.5 rounded-full tracking-widest"
                style={{ background: apa.gradientBorder }}
              >
                {apa.tag}
              </span>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: apa.glowColor }}
              >
                <ApaIcon className="w-5 h-5" style={{ color: apa.dotColor }} />
              </div>
            </div>

            <h3 className="font-black text-2xl mb-0.5" style={{ color: '#1E293B' }}>
              {pickLang(lang, apa.title, apa.titleEn, apa.titleFr)}
            </h3>
            <p className="text-xs font-medium mb-4 tracking-wide" style={{ color: '#94A3B8' }}>{apa.subtitle}</p>
            <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: '#475569' }}>
              {pickLang(lang, apa.desc, apa.descEn, apa.descFr)}
            </p>

            {/* Bullets — 2-column grid since the card is wide */}
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6">
              {pickLang(lang, apa.bullets, apa.bulletsEn, apa.bulletsFr).map((b, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: apa.dotColor }} />
                  {b}
                </li>
              ))}
            </ul>

            {/* Stat */}
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: apa.glowColor, border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div
                className="text-4xl font-black ltr-num"
                style={{
                  background: apa.gradientStat,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {apa.stat}
              </div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                {pickLang(lang, apa.statLabel, apa.statLabelEn, apa.statLabelFr)}
              </div>
            </div>
          </motion.div>

          {/* ABA + CBT — compact cards stacked in the right column */}
          {PILLARS.slice(1).map((p, idx) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.id}
                className="rounded-3xl p-6 flex flex-col justify-between"
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.4, delay: (idx + 1) * 0.08, ease: EASE }}
                whileHover={{ y: -2 }}
                style={cardStyle}
              >
                {/* Tag + Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-white text-xs font-black px-3 py-1.5 rounded-full tracking-widest"
                    style={{ background: p.gradientBorder }}
                  >
                    {p.tag}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: p.glowColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: p.dotColor }} />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-black text-lg mb-0.5" style={{ color: '#1E293B' }}>
                    {pickLang(lang, p.title, p.titleEn, p.titleFr)}
                  </h3>
                  <p className="text-xs font-medium mb-3 tracking-wide" style={{ color: '#94A3B8' }}>{p.subtitle}</p>
                </div>

                {/* Stat */}
                <div
                  className="rounded-2xl p-4 text-center mt-3"
                  style={{ background: p.glowColor, border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div
                    className="text-3xl font-black ltr-num"
                    style={{
                      background: p.gradientStat,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {p.stat}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {pickLang(lang, p.statLabel, p.statLabelEn, p.statLabelFr)}
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
          transition={{ duration: 0.4, delay: 0.28, ease: EASE }}
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#94A3B8' }}>
            {pickLang(lang, 'بالإضافة إلى', 'Plus', 'En plus')}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </motion.div>

        {/* Extra features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXTRA.map(({ icon: Icon, gradient, title, titleEn, titleFr, desc, descEn, descFr }, index) => (
            <motion.div
              key={title}
              className="flex items-start gap-4 p-5 rounded-3xl"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.4, delay: 0.32 + index * 0.08, ease: EASE }}
              whileHover={{ y: -0.5 }}
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: gradient }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-black text-sm mb-1" style={{ color: '#1E293B' }}>{pickLang(lang, title, titleEn, titleFr)}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{pickLang(lang, desc, descEn, descFr)}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
