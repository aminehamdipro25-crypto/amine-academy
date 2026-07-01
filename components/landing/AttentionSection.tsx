'use client'
import { useLang, pickLang } from '@/lib/i18n'

const ATTENTION_TYPES = [
  {
    type: 'الانتباه الانتقائي',
    typeEn: 'Selective Attention',
    typeFr: 'Attention sélective',
    en: 'Selective Attention',
    icon: '🎯',
    problem: 'الطفل ينجذب لكل محفز في البيئة — الصوت، الحركة، الألوان — ولا يستطيع تصفية غير المهم.',
    problemEn: "The child is drawn to every stimulus in the environment — sounds, movement, colors — and cannot filter out irrelevant information.",
    problemFr: "L'enfant est attiré par chaque stimulus de son environnement — les sons, les mouvements, les couleurs — et ne parvient pas à filtrer ce qui n'est pas pertinent.",
    protocol: 'بروتوكول التشتيت المُتحكَّم به: نُدرّب الطفل على الانتباه لهدف واحد بينما توجد مشتتات مُتحكَّم بها تدريجياً.',
    protocolEn: 'Controlled Distraction Protocol: We train the child to focus on a single target while gradually introducing managed distractions.',
    protocolFr: "Protocole de distraction contrôlée : nous entraînons l'enfant à se concentrer sur une seule cible tandis que des distractions maîtrisées sont introduites progressivement.",
    steps: ['تمرين النجمة الواحدة (تتبع هدف في حقل بصري مزدحم)', 'لعبة "أين الصوت؟" مع ضوضاء خلفية متدرجة', 'برنامج تحصين التشتت (DIT) — 8 أسابيع'],
    stepsEn: ['Single Star Exercise (tracking a target in a busy visual field)', '"Where\'s the Sound?" game with progressive background noise', 'Distraction Immunization Training (DIT) — 8 weeks'],
    stepsFr: ['Exercice de l\'étoile unique (suivre une cible dans un champ visuel chargé)', 'Jeu « Où est le son ? » avec bruit de fond progressif', 'Programme d\'entraînement à la distraction (DIT) — 8 semaines'],
    improvement: '+65%',
    improvementLabel: 'في الأداء الأكاديمي',
    improvementLabelEn: 'in Academic Performance',
    improvementLabelFr: 'de performance scolaire',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    statGradient: 'linear-gradient(135deg, #60A5FA, #38BDF8)',
    glowColor: 'rgba(59,130,246,0.1)',
  },
  {
    type: 'الانتباه المستمر',
    typeEn: 'Sustained Attention',
    typeFr: 'Attention soutenue',
    en: 'Sustained Attention',
    icon: '⏱️',
    problem: 'الطفل يبدأ المهمة بحماس ثم ينقطع انتباهه بعد 3-5 دقائق — المعروف بـ "تأثير الحافة الزمنية" في ADHD.',
    problemEn: 'The child starts tasks enthusiastically but loses focus after 3–5 minutes — known as the "temporal edge effect" in ADHD.',
    problemFr: "L'enfant démarre une tâche avec enthousiasme puis perd sa concentration après 3 à 5 minutes — un phénomène connu comme « l'effet de bord temporel » dans le TDAH.",
    protocol: 'تدريب CPT (Continuous Performance Test) بالحركة: مهام انتباه مستمر مقرونة بحركة جسدية تُبقي على إثارة الدوبامين.',
    protocolEn: 'Movement-based CPT (Continuous Performance Test) Training: sustained attention tasks paired with physical movement to maintain dopamine activation.',
    protocolFr: "Entraînement CPT (Continuous Performance Test) par le mouvement : des tâches d'attention soutenue associées à un mouvement physique pour maintenir l'activation de la dopamine.",
    steps: ['تمرين الساعة الحركية: أداء حركة معينة عند ظهور هدف معين', 'تقنية Pomodoro المعدّلة للأطفال (5 د تركيز + 2 د حركة)', 'تمارين الاسترخاء اليقظ بين المهام'],
    stepsEn: ['Motor Clock Exercise: performing a specific movement when a target appears', 'Modified Pomodoro for children (5 min focus + 2 min movement)', 'Mindful relaxation exercises between tasks'],
    stepsFr: ['Exercice de l\'horloge motrice : effectuer un mouvement précis à l\'apparition d\'une cible', 'Technique Pomodoro adaptée aux enfants (5 min de concentration + 2 min de mouvement)', 'Exercices de relaxation en pleine conscience entre les tâches'],
    improvement: '+78%',
    improvementLabel: 'في مدة التركيز',
    improvementLabelEn: 'in Focus Duration',
    improvementLabelFr: 'de durée de concentration',
    gradient: 'linear-gradient(135deg, #8B5CF6, #C084FC)',
    statGradient: 'linear-gradient(135deg, #A78BFA, #C084FC)',
    glowColor: 'rgba(139,92,246,0.1)',
  },
  {
    type: 'كبح التشتت',
    typeEn: 'Distraction Inhibition',
    typeFr: 'Inhibition des distractions',
    en: 'Distraction Inhibition',
    icon: '🛡️',
    problem: 'الفص الجبهي في ADHD لا يُفعّل "المرشّح" الذي يمنع المعلومات غير الضرورية من الوصول للوعي.',
    problemEn: "The ADHD prefrontal lobe fails to activate the 'filter' that prevents irrelevant information from reaching conscious awareness.",
    problemFr: "Le lobe préfrontal, dans le TDAH, n'active pas le « filtre » qui empêche les informations non essentielles d'atteindre la conscience.",
    protocol: 'تدريب الكبح التنفيذي: تمارين مصممة لتقوية قشرة الفص الجبهي الأمامي عبر حركات تتطلب التوقف والتفكير.',
    protocolEn: 'Executive Inhibition Training: exercises designed to strengthen the prefrontal cortex through movements that require stopping and thinking.',
    protocolFr: "Entraînement à l'inhibition exécutive : des exercices conçus pour renforcer le cortex préfrontal grâce à des mouvements qui exigent de s'arrêter et de réfléchir.",
    steps: ['لعبة "أوقف الحركة": يجب على الطفل إيقاف نفسه عند إشارة مفاجئة', 'تمرين Go/No-Go مع حركة جسدية', 'بروتوكول مزامنة الإيقاع العصبي (Interactive Metronome)'],
    stepsEn: ['"Freeze!" game: the child must stop themselves upon a sudden signal', 'Go/No-Go exercise with physical movement', 'Neural Rhythm Synchronization Protocol (Interactive Metronome)'],
    stepsFr: ['Jeu « Stop ! » : l\'enfant doit s\'arrêter net à un signal soudain', 'Exercice Go/No-Go associé à un mouvement physique', 'Protocole de synchronisation du rythme neuronal (Interactive Metronome)'],
    improvement: '52%',
    improvementLabel: 'انخفاض الاندفاعية',
    improvementLabelEn: 'Reduction in Impulsivity',
    improvementLabelFr: "de réduction de l'impulsivité",
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    statGradient: 'linear-gradient(135deg, #34D399, #6EE7B7)',
    glowColor: 'rgba(16,185,129,0.1)',
  },
  {
    type: 'الانتباه التنفيذي',
    typeEn: 'Executive Attention',
    typeFr: 'Attention exécutive',
    en: 'Executive Attention',
    icon: '🧩',
    problem: 'ضعف التخطيط، صعوبة تحديد الأولويات، وعجز عن إدارة مهام متعددة — هذا ما يُعيق الأداء المدرسي.',
    problemEn: 'Weak planning, difficulty prioritizing, and inability to manage multiple tasks — all of which impede academic performance.',
    problemFr: "Une planification fragile, des difficultés à prioriser et une incapacité à gérer plusieurs tâches à la fois — autant d'obstacles à la réussite scolaire.",
    protocol: 'برنامج التدريب على الوظيفة التنفيذية: سلسلة من التمارين المتدرجة تُنمّي الذاكرة العاملة والتخطيط والمرونة المعرفية.',
    protocolEn: 'Executive Function Training Program: a series of progressive exercises that develop working memory, planning, and cognitive flexibility.',
    protocolFr: "Programme d'entraînement des fonctions exécutives : une série d'exercices progressifs qui développent la mémoire de travail, la planification et la flexibilité cognitive.",
    steps: ['تحدي التسلسل المعكوس (Cogmed-style)', 'برج المهام التنفيذية: تحليل المهمة الكبيرة', 'لعبة التبديل بين القواعد (Task-Switching)'],
    stepsEn: ['Reverse Sequence Challenge (Cogmed-style)', 'Executive Task Tower: breaking down complex tasks', 'Rule-Switching Game (Task-Switching)'],
    stepsFr: ['Défi de séquence inversée (style Cogmed)', 'Tour des tâches exécutives : décomposer une tâche complexe', 'Jeu de changement de règles (Task-Switching)'],
    improvement: '35%',
    improvementLabel: 'تقليل أعراض ADHD (دراسة 2014)',
    improvementLabelEn: 'Reduction in ADHD Symptoms (2014 Study)',
    improvementLabelFr: 'de réduction des symptômes du TDAH (étude 2014)',
    gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    statGradient: 'linear-gradient(135deg, #FBBF24, #FDE68A)',
    glowColor: 'rgba(245,158,11,0.1)',
  },
]

export default function AttentionSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      id="attention"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(180deg, #0C1829 0%, #121E30 100%)', padding: '96px 0' }}
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#C4B5FD' }}
          >
            {pickLang(lang, 'التركيز والانتباه وكبح التشتت', 'Focus, Attention & Distraction Control', 'Concentration, attention et maîtrise des distractions')}
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
            {pickLang(
              lang,
              <>الانتباه ليس مشكلة إرادة —<span className="block" style={{
                background: 'linear-gradient(135deg, #C084FC, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>إنها مشكلة تدريب عصبي</span></>,
              <>Attention is not a willpower problem —<span className="block" style={{
                background: 'linear-gradient(135deg, #C084FC, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>It&apos;s a neural training problem</span></>,
              <>L&apos;attention n&apos;est pas un problème de volonté —<span className="block" style={{
                background: 'linear-gradient(135deg, #C084FC, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>c&apos;est un problème d&apos;entraînement neuronal</span></>
            )}
          </h2>
          <p className="text-white/65 max-w-2xl mx-auto text-lg leading-relaxed">
            {pickLang(
              lang,
              'دماغ ADHD لا يفتقر للذكاء — يفتقر لآلية التصفية الصحيحة. برامجنا تُعيد بناء هذه الآلية خلية عصبية في كل مرة.',
              "The ADHD brain doesn't lack intelligence — it lacks the right filtering mechanism. Our programs rebuild that mechanism one neuron at a time.",
              "Le cerveau TDAH ne manque pas d'intelligence — il manque du bon mécanisme de filtrage. Nos programmes reconstruisent ce mécanisme, neurone après neurone."
            )}
          </p>
        </div>

        {/* Science banner */}
        <div
          className="rounded-3xl p-7 mb-12 flex flex-col md:flex-row items-center gap-6"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex-1">
            <h3 className="text-white font-black text-xl mb-2">
              {pickLang(
                lang,
                '4 أنواع من الانتباه — 4 بروتوكولات مختلفة',
                '4 Types of Attention — 4 Different Protocols',
                "4 types d'attention — 4 protocoles différents"
              )}
            </h3>
            <p className="text-white/65 text-sm leading-relaxed">
              {pickLang(
                lang,
                'الخطأ الشائع: معالجة كل مشاكل الانتباه بنفس الطريقة. نحن ندرّب كل نوع على حدة.',
                'The common mistake: treating all attention problems the same way. We train each type individually.',
                "L'erreur classique : traiter tous les troubles de l'attention de la même façon. Nous entraînons chaque type individuellement."
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {['CPT مُعدَّل', 'Go/No-Go', 'DIT بروتوكول', 'Cogmed-style'].map(b => (
              <span
                key={b}
                className="text-center text-white text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ATTENTION_TYPES.map((item) => (
            <div
              key={item.type}
              className="rounded-3xl p-7 transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: item.glowColor }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <span
                      className="text-white text-xs font-black px-2.5 py-1 rounded-full"
                      style={{ background: item.gradient }}
                    >
                      {item.en}
                    </span>
                    <h3 className="font-black text-white text-lg mt-1">{pickLang(lang, item.type, item.typeEn, item.typeFr)}</h3>
                  </div>
                </div>
                <div
                  className="text-center px-4 py-2 rounded-2xl flex-shrink-0"
                  style={{ background: item.glowColor }}
                >
                  <div
                    className="text-2xl font-black ltr-num"
                    style={{
                      background: item.statGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {item.improvement}
                  </div>
                  <div className="text-white/55 text-xs leading-tight mt-0.5 max-w-[80px]">
                    {pickLang(lang, item.improvementLabel, item.improvementLabelEn, item.improvementLabelFr)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-white/45 uppercase tracking-wide mb-1.5">
                  {pickLang(lang, 'المشكلة', 'The Problem', 'Le problème')}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">{pickLang(lang, item.problem, item.problemEn, item.problemFr)}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-white/45 uppercase tracking-wide mb-1.5">
                  {pickLang(lang, 'البروتوكول', 'The Protocol', 'Le protocole')}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">{pickLang(lang, item.protocol, item.protocolEn, item.protocolFr)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-white/45 uppercase tracking-wide mb-2">
                  {pickLang(lang, 'التمارين الأساسية', 'Core Exercises', 'Exercices fondamentaux')}
                </p>
                <ul className="space-y-1.5">
                  {pickLang(lang, item.steps, item.stepsEn, item.stepsFr).map(s => (
                    <li key={s} className="flex items-start gap-2 text-sm text-white/55">
                      <span className="text-white/25 mt-0.5 flex-shrink-0">›</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 rounded-3xl p-6"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <p className="text-white/60 text-sm leading-relaxed max-w-2xl mx-auto text-center">
            {pickLang(
              lang,
              <>
                <strong className="text-white/70">ملاحظة علمية:</strong> جميع بروتوكولات الانتباه مُصممة لتُطبَّق عبر الحركة الجسدية،
                لأن الأبحاث تُثبت أن النشاط البدني يرفع مستوى الدوبامين والنورإبينفرين في الفص الجبهي بنسبة تصل إلى 200%.
                <span style={{ color: '#818CF8' }}> (Ratey, 2008 — Spark)</span>
              </>,
              <>
                <strong className="text-white/70">Scientific Note:</strong> All attention protocols are designed to be implemented through physical movement,
                because research proves that physical activity raises dopamine and norepinephrine levels in the prefrontal cortex by up to 200%.
                <span style={{ color: '#818CF8' }}> (Ratey, 2008 — Spark)</span>
              </>,
              <>
                <strong className="text-white/70">Note scientifique :</strong> tous les protocoles d&apos;attention sont conçus pour être mis en œuvre par le mouvement physique,
                car la recherche démontre que l&apos;activité physique augmente les niveaux de dopamine et de noradrénaline dans le cortex préfrontal jusqu&apos;à 200 %.
                <span style={{ color: '#818CF8' }}> (Ratey, 2008 — Spark)</span>
              </>
            )}
          </p>
        </div>

      </div>
    </section>
  )
}
