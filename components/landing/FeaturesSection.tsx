'use client'
import { Brain, Dumbbell, Heart, Target, Sparkles, Users, BarChart3, Video } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

const PILLARS = [
  {
    id: 'apa',
    tag: 'APA',
    icon: Dumbbell,
    gradientBorder: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    gradientStat: 'linear-gradient(135deg, #60A5FA, #38BDF8)',
    glowColor: 'rgba(59,130,246,0.12)',
    dotColor: '#60A5FA',
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
    glowColor: 'rgba(16,185,129,0.1)',
    dotColor: '#34D399',
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
    glowColor: 'rgba(139,92,246,0.12)',
    dotColor: '#A78BFA',
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

export default function FeaturesSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      id="features"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(180deg, #1A2640 0%, #1A2640 100%)', padding: '96px 0' }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.22)',
              color: '#C4B5FD',
            }}
          >
            {pickLang(lang, 'المنهجية العلمية', 'Scientific Methodology', 'Méthodologie scientifique')}
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
            {pickLang(lang, 'ثلاث ركائز علمية في برنامج واحد', 'Three Scientific Pillars in One Program', 'Trois piliers scientifiques dans un seul programme')}
          </h2>
          <p className="text-white/65 max-w-2xl mx-auto text-lg leading-relaxed">
            {pickLang(
              lang,
              'لا يوجد في المنطقة برنامج يجمع الثلاثة معاً. كل ركيزة معتمدة بدراسات دولية — الثلاثة معاً تُعطي نتائج لا تقدر بثمن.',
              'No program in the region combines all three. Each pillar is validated by international studies — together they produce invaluable results.',
              "Aucun programme de la région ne réunit ces trois approches. Chaque pilier est validé par des études internationales — ensemble, ils produisent des résultats inestimables."
            )}
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.id}
                className="rounded-3xl p-7 transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: `0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.11)`,
                }}
              >
                {/* Tag + Icon */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-white text-xs font-black px-3 py-1.5 rounded-full tracking-widest"
                    style={{ background: p.gradientBorder }}
                  >
                    {p.tag}
                  </span>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: p.glowColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: p.dotColor }} />
                  </div>
                </div>

                <h3 className="font-black text-white text-xl mb-0.5">{pickLang(lang, p.title, p.titleEn, p.titleFr)}</h3>
                <p className="text-white/45 text-xs font-medium mb-4 tracking-wide">{p.subtitle}</p>
                <p className="text-white/60 text-sm leading-relaxed mb-5">{pickLang(lang, p.desc, p.descEn, p.descFr)}</p>

                {/* Bullets */}
                <ul className="space-y-2 mb-6">
                  {pickLang(lang, p.bullets, p.bulletsEn, p.bulletsFr).map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dotColor }} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* Stat */}
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ background: p.glowColor, border: `1px solid rgba(255,255,255,0.11)` }}
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
                  <div className="text-white/60 text-xs mt-1">{pickLang(lang, p.statLabel, p.statLabelEn, p.statLabelFr)}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.11)' }} />
          <span className="text-white/45 text-sm font-medium whitespace-nowrap">
            {pickLang(lang, 'بالإضافة إلى', 'Plus', 'En plus')}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.11)' }} />
        </div>

        {/* Extra features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXTRA.map(({ icon: Icon, gradient, title, titleEn, titleFr, desc, descEn, descFr }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-5 rounded-3xl transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.11)',
                border: '1px solid rgba(255,255,255,0.11)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: gradient }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1">{pickLang(lang, title, titleEn, titleFr)}</h4>
                <p className="text-white/65 text-xs leading-relaxed">{pickLang(lang, desc, descEn, descFr)}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
