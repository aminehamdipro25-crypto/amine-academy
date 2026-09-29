// ── Amine Languages — French curriculum (CEFR A1→C2) ─────────────────────────
// The pedagogical backbone shared by the learner roadmap (/languages/curriculum)
// and the teacher syllabus (/dashboard/curriculum). Each level states its overall
// goal, the CEFR guided-learning hours typically needed to reach it, and a set of
// units. Each unit lists "can-do" objectives (the CEFR way of describing real
// ability), the grammar points, and the vocabulary themes it covers.
//
// Content is aligned to the CEFR global scale and the standard progression used
// by DELF/DALF and the Alliance Française. Grammar/vocab labels stay in French
// (the language being taught); objectives are trilingual (ar/en/fr).

import type { CEFRLevel } from './placement-fr'

export interface CanDo { ar: string; en: string; fr: string }

export interface CurriculumUnit {
  id: string
  titleAr: string; titleEn: string; titleFr: string
  canDo: CanDo[]
  grammar: string[]   // French grammar points
  vocab: string[]     // French vocabulary themes
}

export interface LevelCurriculum {
  level: CEFRLevel
  goalAr: string; goalEn: string; goalFr: string
  guidedHours: string   // approx. cumulative guided hours to reach this level (CEFR)
  units: CurriculumUnit[]
}

export const FRENCH_CURRICULUM: LevelCurriculum[] = [
  {
    level: 'A1', guidedHours: '80–100 ساعة',
    goalAr: 'التواصل بجُمل بسيطة في مواقف الحياة اليوميّة والتعريف بالنفس والآخرين.',
    goalEn: 'Communicate with simple phrases in everyday situations; introduce yourself and others.',
    goalFr: 'Communiquer avec des phrases simples au quotidien ; se présenter et présenter les autres.',
    units: [
      {
        id: 'a1u1', titleAr: 'التحيّة والتعريف بالنفس', titleEn: 'Greetings & introductions', titleFr: 'Salutations et présentations',
        canDo: [
          { ar: 'أُحيّي وأودّع بشكل مناسب', en: 'Greet and say goodbye appropriately', fr: 'Saluer et prendre congé' },
          { ar: 'أُعرّف بنفسي (الاسم، الجنسيّة، المهنة)', en: 'Introduce myself (name, nationality, job)', fr: 'Me présenter (nom, nationalité, profession)' },
          { ar: 'أسأل شخصاً عن اسمه وأحواله', en: 'Ask someone their name and how they are', fr: 'Demander le nom et des nouvelles' },
        ],
        grammar: ['être / s’appeler', 'les pronoms sujets', 'le genre (un/une)', 'l’interrogation simple'],
        vocab: ['les nombres 0–20', 'les nationalités', 'les professions', 'les formules de politesse'],
      },
      {
        id: 'a1u2', titleAr: 'العائلة والحياة اليوميّة', titleEn: 'Family & daily life', titleFr: 'La famille et le quotidien',
        canDo: [
          { ar: 'أصف عائلتي بجُمل بسيطة', en: 'Describe my family simply', fr: 'Décrire ma famille simplement' },
          { ar: 'أتحدّث عن روتيني اليومي', en: 'Talk about my daily routine', fr: 'Parler de ma routine quotidienne' },
          { ar: 'أقول الوقت والأيام', en: 'Tell the time and days', fr: 'Dire l’heure et les jours' },
        ],
        grammar: ['les verbes en -er au présent', 'les adjectifs possessifs', 'l’heure', 'les articles définis'],
        vocab: ['la famille', 'les jours et les mois', 'les activités quotidiennes'],
      },
      {
        id: 'a1u3', titleAr: 'التسوّق والمطعم', titleEn: 'Shopping & café', titleFr: 'Achats et café',
        canDo: [
          { ar: 'أطلب في المقهى وأسأل عن السعر', en: 'Order in a café and ask the price', fr: 'Commander au café et demander le prix' },
          { ar: 'أشتري أشياء بسيطة بالكميّة', en: 'Buy simple items with quantities', fr: 'Acheter des articles avec les quantités' },
        ],
        grammar: ['les articles partitifs (du/de la)', 'vouloir / prendre', 'les quantités', 'c’est / il y a'],
        vocab: ['les aliments', 'les prix et la monnaie', 'les commerces'],
      },
    ],
  },
  {
    level: 'A2', guidedHours: '~180 ساعة (تراكميّاً)',
    goalAr: 'التعبير عن الماضي والمستقبل القريب وإدارة مواقف يوميّة متعدّدة.',
    goalEn: 'Express past and near future; handle a range of everyday situations.',
    goalFr: 'Exprimer le passé et le futur proche ; gérer diverses situations quotidiennes.',
    units: [
      {
        id: 'a2u1', titleAr: 'الحديث عن الماضي', titleEn: 'Talking about the past', titleFr: 'Parler du passé',
        canDo: [
          { ar: 'أروي حدثاً في الماضي', en: 'Recount a past event', fr: 'Raconter un événement passé' },
          { ar: 'أصف عطلتي أو يومي السابق', en: 'Describe my holiday or yesterday', fr: 'Décrire mes vacances ou ma journée d’hier' },
        ],
        grammar: ['le passé composé (avoir/être)', 'les participes passés', 'les marqueurs temporels'],
        vocab: ['les voyages', 'les loisirs', 'les souvenirs'],
      },
      {
        id: 'a2u2', titleAr: 'المدينة والاتّجاهات', titleEn: 'The city & directions', titleFr: 'La ville et les directions',
        canDo: [
          { ar: 'أطلب وأعطي الاتّجاهات', en: 'Ask for and give directions', fr: 'Demander et indiquer le chemin' },
          { ar: 'أصف حيّي والخدمات فيه', en: 'Describe my neighbourhood and its services', fr: 'Décrire mon quartier et ses services' },
        ],
        grammar: ['l’impératif', 'les prépositions de lieu', 'il faut + infinitif'],
        vocab: ['la ville', 'les transports', 'les lieux publics'],
      },
      {
        id: 'a2u3', titleAr: 'الصحّة والمشاعر', titleEn: 'Health & feelings', titleFr: 'La santé et les sentiments',
        canDo: [
          { ar: 'أعبّر عن الألم وأصف حالتي الصحّيّة', en: 'Express pain and describe how I feel', fr: 'Exprimer la douleur et décrire mon état' },
          { ar: 'أعطي نصيحة بسيطة', en: 'Give simple advice', fr: 'Donner un conseil simple' },
        ],
        grammar: ['les verbes pronominaux', 'le futur proche', 'devoir / pouvoir'],
        vocab: ['le corps', 'la santé', 'les émotions'],
      },
    ],
  },
  {
    level: 'B1', guidedHours: '~350–400 ساعة (تراكميّاً)',
    goalAr: 'التدبّر باستقلاليّة، سرد التجارب، وإبداء الرأي وتبريره.',
    goalEn: 'Cope independently, narrate experiences, and give and justify opinions.',
    goalFr: 'Se débrouiller de façon autonome, raconter des expériences, donner et justifier un avis.',
    units: [
      {
        id: 'b1u1', titleAr: 'إبداء الرأي والنقاش', titleEn: 'Opinions & discussion', titleFr: 'Opinions et discussion',
        canDo: [
          { ar: 'أعبّر عن رأيي وأبرّره', en: 'Express and justify my opinion', fr: 'Exprimer et justifier mon opinion' },
          { ar: 'أوافق وأعترض بأدب', en: 'Agree and disagree politely', fr: 'Exprimer l’accord et le désaccord' },
        ],
        grammar: ['le subjonctif présent (introduction)', 'les connecteurs logiques', 'le pronom relatif (qui/que/où/dont)'],
        vocab: ['les médias', 'la société', 'l’argumentation'],
      },
      {
        id: 'b1u2', titleAr: 'الفرضيّة والمستقبل', titleEn: 'Hypothesis & future', titleFr: 'Hypothèse et futur',
        canDo: [
          { ar: 'أتحدّث عن مشاريعي المستقبليّة', en: 'Talk about my future plans', fr: 'Parler de mes projets futurs' },
          { ar: 'أصوغ فرضيّات', en: 'Make hypotheses', fr: 'Formuler des hypothèses' },
        ],
        grammar: ['le futur simple', 'le conditionnel présent', 'si + présent/imparfait'],
        vocab: ['le travail', 'les études', 'l’environnement'],
      },
      {
        id: 'b1u3', titleAr: 'السرد والوصف المتقدّم', titleEn: 'Narration & description', titleFr: 'Récit et description',
        canDo: [
          { ar: 'أروي قصّة بترتيب زمني واضح', en: 'Tell a story in a clear sequence', fr: 'Raconter une histoire de façon structurée' },
          { ar: 'أصف تجربة وأعبّر عن مشاعري تجاهها', en: 'Describe an experience and my feelings about it', fr: 'Décrire une expérience et mes ressentis' },
        ],
        grammar: ['l’imparfait vs le passé composé', 'le plus-que-parfait', 'le discours indirect au présent'],
        vocab: ['les récits', 'la culture', 'les expériences de vie'],
      },
    ],
  },
  {
    level: 'B2', guidedHours: '~500–600 ساعة (تراكميّاً)',
    goalAr: 'التفاعل بطلاقة، بناء حجّة مفصّلة، وفهم النصوص المعقّدة.',
    goalEn: 'Interact fluently, build a detailed argument, and understand complex texts.',
    goalFr: 'Interagir avec aisance, construire une argumentation détaillée, comprendre des textes complexes.',
    units: [
      {
        id: 'b2u1', titleAr: 'الحجاج المُنظّم', titleEn: 'Structured argumentation', titleFr: 'L’argumentation structurée',
        canDo: [
          { ar: 'أبني حجّة متماسكة مع أمثلة', en: 'Build a coherent argument with examples', fr: 'Construire une argumentation cohérente avec des exemples' },
          { ar: 'أعبّر عن التنازل والتعارض', en: 'Express concession and contrast', fr: 'Exprimer la concession et l’opposition' },
        ],
        grammar: ['le subjonctif (emplois étendus)', 'la concession (bien que, malgré)', 'les articulateurs du discours'],
        vocab: ['les enjeux de société', 'l’économie', 'la politique'],
      },
      {
        id: 'b2u2', titleAr: 'الإعلام والنصوص الصحفيّة', titleEn: 'Media & press texts', titleFr: 'Médias et textes de presse',
        canDo: [
          { ar: 'ألخّص مقالاً وأنقده', en: 'Summarise and critique an article', fr: 'Résumer et critiquer un article' },
          { ar: 'أميّز الحقيقة من الرأي', en: 'Distinguish fact from opinion', fr: 'Distinguer les faits des opinions' },
        ],
        grammar: ['la voix passive', 'la nominalisation', 'le discours rapporté au passé'],
        vocab: ['la presse', 'les sciences', 'l’actualité'],
      },
      {
        id: 'b2u3', titleAr: 'عالم الشغل', titleEn: 'The world of work', titleFr: 'Le monde du travail',
        canDo: [
          { ar: 'أكتب سيرة ورسالة تحفيز', en: 'Write a CV and a cover letter', fr: 'Rédiger un CV et une lettre de motivation' },
          { ar: 'أُدير مقابلة عمل', en: 'Handle a job interview', fr: 'Gérer un entretien d’embauche' },
        ],
        grammar: ['le gérondif', 'les temps du futur (antérieur)', 'le registre formel'],
        vocab: ['l’entreprise', 'la candidature', 'les compétences professionnelles'],
      },
    ],
  },
  {
    level: 'C1', guidedHours: '~700–800 ساعة (تراكميّاً)',
    goalAr: 'استعمال اللغة بمرونة وفعاليّة في السياقات الأكاديميّة والمهنيّة.',
    goalEn: 'Use language flexibly and effectively for academic and professional purposes.',
    goalFr: 'Utiliser la langue avec souplesse et efficacité dans des contextes académiques et professionnels.',
    units: [
      {
        id: 'c1u1', titleAr: 'الخطاب الأكاديمي', titleEn: 'Academic discourse', titleFr: 'Le discours académique',
        canDo: [
          { ar: 'أُنتج synthèse من عدّة مصادر', en: 'Produce a synthesis from several sources', fr: 'Produire une synthèse à partir de plusieurs sources' },
          { ar: 'أُنظّم عرضاً مُطوّلاً بوضوح', en: 'Structure a long, clear presentation', fr: 'Structurer un exposé long et clair' },
        ],
        grammar: ['les nuances du subjonctif', 'la mise en relief', 'les tournures impersonnelles'],
        vocab: ['le vocabulaire académique', 'l’abstraction', 'les connecteurs sophistiqués'],
      },
      {
        id: 'c1u2', titleAr: 'الدقّة الأسلوبيّة', titleEn: 'Stylistic precision', titleFr: 'La précision stylistique',
        canDo: [
          { ar: 'أختار السجلّ المناسب للسياق', en: 'Choose the register suited to context', fr: 'Choisir le registre adapté au contexte' },
          { ar: 'أعبّر عن فروق دقيقة في المعنى', en: 'Express fine shades of meaning', fr: 'Exprimer de fines nuances de sens' },
        ],
        grammar: ['les temps littéraires (introduction)', 'l’inversion stylistique', 'les figures de style'],
        vocab: ['les expressions idiomatiques', 'les collocations', 'le vocabulaire soutenu'],
      },
    ],
  },
  {
    level: 'C2', guidedHours: '~1000+ ساعة (تراكميّاً)',
    goalAr: 'إتقان شبه أصلي: فهم كلّ ما يُقرأ ويُسمع والتعبير بدقّة تامّة.',
    goalEn: 'Near-native mastery: understand everything read/heard and express with full precision.',
    goalFr: 'Maîtrise quasi native : tout comprendre et s’exprimer avec une précision totale.',
    units: [
      {
        id: 'c2u1', titleAr: 'البلاغة والإقناع', titleEn: 'Rhetoric & persuasion', titleFr: 'Rhétorique et persuasion',
        canDo: [
          { ar: 'أُقنع جمهوراً في سياق رسمي', en: 'Persuade an audience in a formal setting', fr: 'Convaincre un public en contexte formel' },
          { ar: 'أستعمل السخرية والتلميح بدقّة', en: 'Use irony and implication precisely', fr: 'Manier l’ironie et l’implicite avec justesse' },
        ],
        grammar: ['les subtilités modales', 'le style indirect libre', 'la concordance des temps complète'],
        vocab: ['la rhétorique', 'le vocabulaire spécialisé', 'les registres extrêmes'],
      },
      {
        id: 'c2u2', titleAr: 'النصوص المتخصّصة والأدبيّة', titleEn: 'Specialised & literary texts', titleFr: 'Textes spécialisés et littéraires',
        canDo: [
          { ar: 'أُحلّل نصّاً أدبيّاً أو تقنيّاً معقّداً', en: 'Analyse a complex literary or technical text', fr: 'Analyser un texte littéraire ou technique complexe' },
          { ar: 'أكتب بأسلوب يناسب كلّ نوع أدبي', en: 'Write in a style suited to each genre', fr: 'Écrire dans un style adapté à chaque genre' },
        ],
        grammar: ['les temps littéraires (maîtrise)', 'la syntaxe complexe', 'les nuances aspectuelles'],
        vocab: ['la littérature', 'les domaines de spécialité', 'l’étymologie'],
      },
    ],
  },
]

export function getLevelCurriculum(level: CEFRLevel): LevelCurriculum | undefined {
  return FRENCH_CURRICULUM.find(l => l.level === level)
}
