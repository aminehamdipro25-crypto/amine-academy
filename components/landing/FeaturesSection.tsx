'use client'
import { Brain, Dumbbell, Heart, Target, Sparkles, Users, BarChart3, Video } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

const PILLARS = [
  {
    id: 'apa',
    tag: 'APA',
    tagColor: 'bg-blue-600',
    icon: Dumbbell,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'الرياضة المعدّلة',
    titleEn: 'Adapted Physical Activity',
    titleFr: 'Activité physique adaptée',
    subtitle: 'Adapted Physical Activity',
    subtitleEn: 'Adapted Physical Activity',
    subtitleFr: 'Activité physique adaptée',
    desc: 'حركة هادفة تُعيد بناء الجهاز العصبي. كل تمرين مصمم بدقة لتشخيص طفلك، فئته العمرية، وملفه الحسي — لا تمارين جاهزة.',
    descEn: 'Purposeful movement that rebuilds the nervous system. Every exercise is precisely designed for your child\'s diagnosis, age group, and sensory profile — no generic routines.',
    descFr: "Un mouvement intentionnel qui reconstruit le système nerveux. Chaque exercice est conçu avec précision selon le diagnostic, la tranche d'âge et le profil sensoriel de votre enfant — pas de routines génériques.",
    bullets: ['تنسيق حركي ودهليزي', 'تفريغ الطاقة بطريقة منظمة', 'تكامل حسي (Ayres)', 'إيقاع وتوقيت عصبي'],
    bulletsEn: ['Motor & vestibular coordination', 'Structured energy release', 'Sensory integration (Ayres)', 'Neural rhythm & timing'],
    bulletsFr: ['Coordination motrice et vestibulaire', "Libération d'énergie structurée", 'Intégration sensorielle (Ayres)', 'Rythme et timing neuronal'],
    stat: '+87%', statLabel: 'تحسن في التنسيق الحركي', statLabelEn: 'Improvement in motor coordination', statLabelFr: 'Amélioration de la coordination motrice',
  },
  {
    id: 'aba',
    tag: 'ABA',
    tagColor: 'bg-emerald-600',
    icon: Target,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'تعديل السلوك',
    titleEn: 'Applied Behavior Analysis',
    titleFr: 'Analyse appliquée du comportement',
    subtitle: 'Applied Behavior Analysis',
    subtitleEn: 'Applied Behavior Analysis',
    subtitleFr: 'Applied Behavior Analysis',
    desc: 'نظام علمي معتمد دولياً يحوّل السلوكيات الصعبة إلى سلوكيات إيجابية عبر التعزيز المنظم — مع نظام نقاط يشغّل دوبامين الطفل.',
    descEn: 'An internationally accredited scientific system that transforms challenging behaviors into positive ones through structured reinforcement — with a points system that activates the child\'s dopamine reward circuit.',
    descFr: "Un système scientifique reconnu à l'international qui transforme les comportements difficiles en comportements positifs grâce à un renforcement structuré — avec un système de points qui active le circuit de récompense de l'enfant.",
    bullets: ['نظام Token Economy', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS للمهارات الاجتماعية'],
    bulletsEn: ['Token Economy system', 'Zone of Regulation', 'Social Stories (Carol Gray)', 'PEERS social skills protocol'],
    bulletsFr: ['Système Token Economy', 'Zone of Regulation', 'Histoires sociales (Carol Gray)', 'Protocole PEERS pour les compétences sociales'],
    stat: '76%', statLabel: 'انخفاض السلوكيات الصعبة', statLabelEn: 'Reduction in challenging behaviors', statLabelFr: 'Réduction des comportements difficiles',
  },
  {
    id: 'cbt',
    tag: 'CBT',
    tagColor: 'bg-purple-600',
    icon: Brain,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'التدريب المعرفي',
    titleEn: 'Cognitive Behavioral Training',
    titleFr: 'Entraînement cognitivo-comportemental',
    subtitle: 'Cognitive Behavioral Training',
    subtitleEn: 'Cognitive Behavioral Training',
    subtitleFr: 'Cognitive Behavioral Training',
    desc: 'تمارين الوظيفة التنفيذية تبني الذاكرة العاملة، تكبح الاندفاعية، وتطوّر التخطيط — بروتوكولات مستوحاة من Cogmed ومعتمدة بدراسات دولية.',
    descEn: 'Executive function exercises build working memory, inhibit impulsivity, and develop planning skills — protocols inspired by Cogmed and validated by international research.',
    descFr: "Les exercices de fonction exécutive développent la mémoire de travail, freinent l'impulsivité et renforcent la planification — des protocoles inspirés de Cogmed et validés par des études internationales.",
    bullets: ['تدريب الذاكرة العاملة', 'ترموميتر الغضب', 'اليقظة الذهنية للـ ADHD', 'تحليل المهام (برج المهام)'],
    bulletsEn: ['Working memory training', 'Anger thermometer', 'Mindfulness for ADHD', 'Task analysis (Tower of Tasks)'],
    bulletsFr: ['Entraînement de la mémoire de travail', 'Thermomètre de la colère', 'Pleine conscience pour le TDAH', 'Analyse des tâches (Tour des tâches)'],
    stat: '35%', statLabel: 'تقليل أعراض ADHD (Cogmed 2014)', statLabelEn: 'Reduction in ADHD symptoms (Cogmed 2014)', statLabelFr: 'Réduction des symptômes du TDAH (Cogmed 2014)',
  },
]

const EXTRA = [
  { icon: Video,     color: 'text-brand-600 bg-brand-50',   title: 'جلسات تفاعلية بالفيديو', titleEn: 'Live Video Sessions', titleFr: 'Séances vidéo en direct', desc: 'الأستاذ يشاهد الطفل مباشرة ويصحح الحركة في الوقت الفعلي', descEn: 'The instructor watches the child live and corrects movement in real time', descFr: "L'instructeur observe l'enfant en direct et corrige le mouvement en temps réel" },
  { icon: Heart,     color: 'text-rose-600 bg-rose-50',     title: 'توجيه الوالدين', titleEn: 'Parent Coaching', titleFr: 'Accompagnement des parents', desc: 'كل جلسة تنتهي بـ 10 دقائق توجيه للوالد على المتابعة اليومية في البيت', descEn: 'Every session ends with 10 minutes of parent guidance on daily home follow-up', descFr: "Chaque séance se termine par 10 minutes de conseils au parent pour le suivi quotidien à la maison" },
  { icon: BarChart3, color: 'text-amber-600 bg-amber-50',   title: 'تقارير ذكية', titleEn: 'Smart Reports', titleFr: 'Rapports intelligents', desc: 'تقارير دورية تقيس 5 محاور سلوكية مع تفسير علمي وخطة تعديل', descEn: 'Periodic reports measuring 5 behavioral dimensions with scientific interpretation and adjustment plans', descFr: "Des rapports périodiques mesurant 5 dimensions comportementales, avec interprétation scientifique et plan d'ajustement" },
  { icon: Sparkles,  color: 'text-indigo-600 bg-indigo-50', title: 'تلعيب وتحفيز', titleEn: 'Gamification & Motivation', titleFr: 'Ludification et motivation', desc: 'نقاط وإنجازات وتحديات تجعل الطفل يطلب التمرين بنفسه', descEn: 'Points, achievements, and challenges that make children ask to exercise on their own', descFr: "Points, succès et défis qui donnent envie à l'enfant de s'exercer de lui-même" },
  { icon: Users,     color: 'text-teal-600 bg-teal-50',     title: 'مجتمع الأسر', titleEn: 'Family Community', titleFr: 'Communauté des familles', desc: 'مجموعة واتساب حصرية للأسر لتبادل التجارب والدعم المتبادل', descEn: 'Exclusive WhatsApp group for families to share experiences and support each other', descFr: "Groupe WhatsApp exclusif pour les familles, pour échanger leurs expériences et se soutenir mutuellement" },
  { icon: Brain,     color: 'text-amber-600 bg-amber-50',   title: 'صعوبات التعلم', titleEn: 'Learning Difficulties', titleFr: "Troubles de l'apprentissage", desc: 'تشخيص وتدخل متخصص لعسر القراءة والكتابة والحساب — برامج مخصصة لكل طفل', descEn: 'Specialized diagnosis & intervention for dyslexia, dysgraphia & dyscalculia — personalized programs for every child', descFr: "Diagnostic et intervention spécialisés pour la dyslexie, la dysgraphie et la dyscalculie — des programmes personnalisés pour chaque enfant" },
]

export default function FeaturesSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section className="py-24 bg-white" id="features" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            {pickLang(lang, 'المنهجية العلمية', 'Scientific Methodology', 'Méthodologie scientifique')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            {pickLang(lang, 'ثلاث ركائز علمية في برنامج واحد', 'Three Scientific Pillars in One Program', 'Trois piliers scientifiques dans un seul programme')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
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
              <div key={p.id} className="bg-white rounded-3xl p-7 border border-[#F0E8FF] shadow-card hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all">
                {/* Tag + Icon */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`${p.tagColor} text-white text-xs font-black px-3 py-1 rounded-full tracking-widest`}>
                    {p.tag}
                  </span>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${p.iconBg}`}>
                    <Icon className={`w-5 h-5 ${p.iconColor}`} />
                  </div>
                </div>

                <h3 className="font-black text-gray-900 text-xl mb-0.5">{pickLang(lang, p.title, p.titleEn, p.titleFr)}</h3>
                <p className="text-gray-400 text-xs font-medium mb-4 tracking-wide">{p.subtitle}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{pickLang(lang, p.desc, p.descEn, p.descFr)}</p>

                {/* Bullets */}
                <ul className="space-y-2 mb-6">
                  {pickLang(lang, p.bullets, p.bulletsEn, p.bulletsFr).map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        p.id === 'apa' ? 'bg-blue-400' : p.id === 'aba' ? 'bg-emerald-400' : 'bg-purple-400'
                      }`} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* Stat */}
                <div className={`rounded-2xl p-4 text-center ${p.iconBg}`}>
                  <div className={`text-3xl font-black ltr-num ${p.iconColor}`}>{p.stat}</div>
                  <div className="text-gray-500 text-xs mt-1">{pickLang(lang, p.statLabel, p.statLabelEn, p.statLabelFr)}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Divider label */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
            {pickLang(lang, 'بالإضافة إلى', 'Plus', 'En plus')}
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Extra features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXTRA.map(({ icon: Icon, color, title, titleEn, titleFr, desc, descEn, descFr }) => (
            <div key={title} className="flex items-start gap-4 p-5 rounded-3xl border border-[#F0E8FF] shadow-card hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all bg-white">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-sm mb-1">{pickLang(lang, title, titleEn, titleFr)}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{pickLang(lang, desc, descEn, descFr)}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
