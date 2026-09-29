// ── Amine Languages — French placement engine (CEFR-aligned) ─────────────────
// Pedagogical backbone for the French track. Built on the CEFR (Common European
// Framework of Reference for Languages) — the international standard used by the
// Alliance Française, DELF/DALF, and universities worldwide — so a learner's
// result is globally meaningful, not an ad-hoc score.
//
// The test is a mastery-based placement: questions are grouped by level and
// ordered A1 → C2. A learner "reaches" a level when they answer the majority of
// its questions correctly; their placement is the highest level reached before
// the first level they miss. This mirrors how DELF/DALF tiers are structured.

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type Skill = 'grammaire' | 'vocabulaire' | 'compréhension' | 'conjugaison'

export const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export interface LevelDescriptor {
  level: CEFRLevel
  titleAr: string
  titleEn: string
  titleFr: string
  // "Can-do" statement — the CEFR way of describing real ability.
  canDoAr: string
  canDoEn: string
  canDoFr: string
  band: 'débutant' | 'intermédiaire' | 'avancé'
}

export const CEFR_DESCRIPTORS: Record<CEFRLevel, LevelDescriptor> = {
  A1: {
    level: 'A1', band: 'débutant',
    titleAr: 'مبتدئ — أساسيات', titleEn: 'Beginner', titleFr: 'Débutant',
    canDoAr: 'تفهم وتستخدم تعابير مألوفة يوميّة وجُملاً بسيطة جداً لتلبية حاجات ملموسة.',
    canDoEn: 'Can understand and use familiar everyday expressions and very basic phrases.',
    canDoFr: 'Peut comprendre et utiliser des expressions familières et quotidiennes ainsi que des énoncés très simples.',
  },
  A2: {
    level: 'A2', band: 'débutant',
    titleAr: 'ما قبل المتوسّط', titleEn: 'Elementary', titleFr: 'Élémentaire',
    canDoAr: 'تتواصل في مهامّ بسيطة ومعتادة تتطلّب تبادلاً مباشراً للمعلومات حول أمور مألوفة.',
    canDoEn: 'Can communicate in simple, routine tasks on familiar topics.',
    canDoFr: 'Peut communiquer lors de tâches simples et habituelles sur des sujets familiers.',
  },
  B1: {
    level: 'B1', band: 'intermédiaire',
    titleAr: 'متوسّط — عتبة الاستقلاليّة', titleEn: 'Intermediate', titleFr: 'Intermédiaire',
    canDoAr: 'تتدبّر معظم المواقف أثناء السفر، وتُنتج نصّاً بسيطاً متماسكاً حول مواضيع مألوفة.',
    canDoEn: 'Can deal with most situations while travelling and produce simple connected text.',
    canDoFr: 'Peut se débrouiller dans la plupart des situations et produire un texte simple et cohérent.',
  },
  B2: {
    level: 'B2', band: 'intermédiaire',
    titleAr: 'فوق المتوسّط — مستقلّ', titleEn: 'Upper-Intermediate', titleFr: 'Intermédiaire avancé',
    canDoAr: 'تتفاعل بطلاقة وعفويّة تجعل الحوار مع الناطق الأصلي ممكناً دون توتّر للطرفين.',
    canDoEn: 'Can interact with a degree of fluency and spontaneity with native speakers.',
    canDoFr: 'Peut communiquer avec un degré de spontanéité et d’aisance avec un locuteur natif.',
  },
  C1: {
    level: 'C1', band: 'avancé',
    titleAr: 'متقدّم — كفاءة عمليّة', titleEn: 'Advanced', titleFr: 'Avancé',
    canDoAr: 'تعبّر بطلاقة وعفويّة، وتستعمل اللغة بمرونة وفعاليّة في الحياة الاجتماعيّة والمهنيّة والأكاديميّة.',
    canDoEn: 'Can express ideas fluently and use language flexibly for social, academic and professional purposes.',
    canDoFr: 'Peut s’exprimer spontanément et utiliser la langue de manière souple et efficace.',
  },
  C2: {
    level: 'C2', band: 'avancé',
    titleAr: 'إتقان — شبه أصلي', titleEn: 'Mastery / Proficient', titleFr: 'Maîtrise',
    canDoAr: 'تفهم بسهولة كلّ ما تقرأ وتسمع تقريباً، وتعبّر بدقّة عن فروق المعنى الدقيقة.',
    canDoEn: 'Can understand virtually everything and express precise shades of meaning.',
    canDoFr: 'Peut comprendre sans effort pratiquement tout et exprimer de fines nuances de sens.',
  },
}

export interface PlacementQuestion {
  id: string
  level: CEFRLevel
  skill: Skill
  // The question stem is in French (we test French). UI instructions are localised.
  prompt: string
  options: string[]
  answer: number // index into options
}

// 24 items — 4 per CEFR level, ordered A1 → C2. Kept concise but genuinely
// discriminating: each item targets a structure/lexis typical of its level.
export const PLACEMENT_FR: PlacementQuestion[] = [
  // ── A1 ──
  { id: 'a1_1', level: 'A1', skill: 'grammaire',   prompt: 'Bonjour, je ___ Amine.',                       options: ['suis', 'es', 'est', 'sont'], answer: 0 },
  { id: 'a1_2', level: 'A1', skill: 'vocabulaire', prompt: 'Le contraire de « grand » est ___.',            options: ['petit', 'gros', 'long', 'haut'], answer: 0 },
  { id: 'a1_3', level: 'A1', skill: 'grammaire',   prompt: 'Elle a ___ chat noir.',                         options: ['un', 'une', 'des', 'le'], answer: 0 },
  { id: 'a1_4', level: 'A1', skill: 'conjugaison', prompt: 'Nous ___ français le lundi.',                   options: ['parlons', 'parlez', 'parle', 'parlent'], answer: 0 },
  // ── A2 ──
  { id: 'a2_1', level: 'A2', skill: 'conjugaison', prompt: 'Hier, j’ ___ au cinéma avec mes amis.',         options: ['suis allé', 'vais', 'irai', 'allais'], answer: 0 },
  { id: 'a2_2', level: 'A2', skill: 'grammaire',   prompt: 'Ce livre est ___ intéressant que l’autre.',     options: ['plus', 'très', 'beaucoup', 'trop de'], answer: 0 },
  { id: 'a2_3', level: 'A2', skill: 'vocabulaire', prompt: 'Pour acheter du pain, je vais à la ___.',       options: ['boulangerie', 'pharmacie', 'librairie', 'banque'], answer: 0 },
  { id: 'a2_4', level: 'A2', skill: 'grammaire',   prompt: 'Il n’y a ___ lait dans le frigo.',              options: ['plus de', 'plus des', 'pas le', 'non'], answer: 0 },
  // ── B1 ──
  { id: 'b1_1', level: 'B1', skill: 'conjugaison', prompt: 'Si j’avais le temps, je ___ plus souvent.',     options: ['voyagerais', 'voyage', 'voyagerai', 'voyageais'], answer: 0 },
  { id: 'b1_2', level: 'B1', skill: 'grammaire',   prompt: 'C’est la ville ___ je suis né.',                options: ['où', 'que', 'dont', 'qui'], answer: 0 },
  { id: 'b1_3', level: 'B1', skill: 'vocabulaire', prompt: 'Malgré la pluie, nous avons ___ notre balade.', options: ['poursuivi', 'annulé', 'oublié', 'raté'], answer: 0 },
  { id: 'b1_4', level: 'B1', skill: 'conjugaison', prompt: 'Il faut que tu ___ à l’heure demain.',          options: ['sois', 'es', 'seras', 'étais'], answer: 0 },
  // ── B2 ──
  { id: 'b2_1', level: 'B2', skill: 'grammaire',   prompt: 'Bien qu’il ___ fatigué, il a continué.',        options: ['soit', 'est', 'était', 'sera'], answer: 0 },
  { id: 'b2_2', level: 'B2', skill: 'vocabulaire', prompt: 'Sa remarque était tout à fait ___ ; personne ne s’y attendait.', options: ['pertinente', 'banale', 'évidente', 'attendue'], answer: 0 },
  { id: 'b2_3', level: 'B2', skill: 'conjugaison', prompt: 'Une fois qu’il ___ terminé, il nous préviendra.', options: ['aura', 'a', 'avait', 'aurait'], answer: 0 },
  { id: 'b2_4', level: 'B2', skill: 'grammaire',   prompt: 'Le rapport ___ vous parlez est sur mon bureau.', options: ['dont', 'duquel', 'que', 'où'], answer: 0 },
  // ── C1 ──
  { id: 'c1_1', level: 'C1', skill: 'vocabulaire', prompt: 'Il a réussi ___ ; ses concurrents étaient pourtant redoutables.', options: ['haut la main', 'à la va-vite', 'tant bien que mal', 'de justesse'], answer: 0 },
  { id: 'c1_2', level: 'C1', skill: 'grammaire',   prompt: '___ que soient les obstacles, elle ne renonce jamais.', options: ['Quels', 'Quel', 'Quelles', 'Que'], answer: 0 },
  { id: 'c1_3', level: 'C1', skill: 'vocabulaire', prompt: 'Ce discours ___ un profond sentiment d’injustice.', options: ['traduit', 'traduise', 'traduirait', 'a traduit de'], answer: 0 },
  { id: 'c1_4', level: 'C1', skill: 'conjugaison', prompt: 'Je crains qu’il n’ ___ déjà pris sa décision.',  options: ['ait', 'a', 'avait', 'aura'], answer: 0 },
  // ── C2 ──
  { id: 'c2_1', level: 'C2', skill: 'vocabulaire', prompt: 'Son argumentation, quoique ___, n’a convaincu personne.', options: ['spécieuse', 'limpide', 'fallacieuse', 'probante'], answer: 0 },
  { id: 'c2_2', level: 'C2', skill: 'grammaire',   prompt: 'Fût-il génial, un plan ___ rien sans exécution.', options: ['ne vaut', 'vaut', 'valait', 'vaudrait de'], answer: 0 },
  { id: 'c2_3', level: 'C2', skill: 'vocabulaire', prompt: 'Il n’a eu de cesse de ___ les mérites de son mentor.', options: ['vanter', 'vanté', 'se vanter', 'vantant'], answer: 0 },
  { id: 'c2_4', level: 'C2', skill: 'compréhension', prompt: '« Battre le fer tant qu’il est chaud » signifie :', options: ['agir au bon moment', 'travailler le métal', 'perdre patience', 'se disputer'], answer: 0 },
]

export interface PlacementResult {
  level: CEFRLevel
  workingTowards: CEFRLevel | null
  correct: number
  total: number
  perLevel: Record<CEFRLevel, { correct: number; total: number }>
}

// Mastery-based scoring: a level is "reached" when the learner answers the
// majority (≥ 3/4) of its items correctly. Placement = the highest level
// reached with no earlier level failed; the next level up is "working towards".
export function scorePlacement(answers: Record<string, number>): PlacementResult {
  const perLevel = {} as Record<CEFRLevel, { correct: number; total: number }>
  for (const lvl of CEFR_ORDER) perLevel[lvl] = { correct: 0, total: 0 }

  let correct = 0
  for (const q of PLACEMENT_FR) {
    perLevel[q.level].total++
    if (answers[q.id] === q.answer) { perLevel[q.level].correct++; correct++ }
  }

  const passed = (lvl: CEFRLevel) => perLevel[lvl].correct >= Math.ceil(perLevel[lvl].total * 0.75)

  let level: CEFRLevel = 'A1'
  let reachedAny = false
  for (const lvl of CEFR_ORDER) {
    if (passed(lvl)) { level = lvl; reachedAny = true } else break
  }
  // If they didn't even pass A1, they are a true beginner starting at A1.
  if (!reachedAny) level = 'A1'

  const idx = CEFR_ORDER.indexOf(level)
  const workingTowards = reachedAny && idx < CEFR_ORDER.length - 1 ? CEFR_ORDER[idx + 1] : (!reachedAny ? 'A1' : null)

  return { level, workingTowards, correct, total: PLACEMENT_FR.length, perLevel }
}
