// Pediatric Symptom Checklist-17 (PSC-17) — parent/informant-rated.
//
// Why this scale: the platform already screens ADHD (Vanderbilt), autism and
// learning difficulties, and measures attention and memory. None of those touch
// the INTERNALISING dimension — sadness, hopelessness, low self-worth, worry,
// anhedonia — which is common alongside ADHD and autism and changes the plan.
// PSC-17 covers it in 17 items and is free to use and reproduce.
//
// Source: Gardner, W., Murphy, M., Childs, G., Kelleher, K., Pagano, M.,
// Jellinek, M., McInerny, T. K., Wasserman, R. C., Nutting, P., & Chiappetta, L.
// (1999). The PSC-17: a brief Pediatric Symptom Checklist with psychosocial
// problem subscales. A report from PROS and ASPN. Ambulatory Child Health,
// 5(3), 225-236.
//
// TRANSLATION HONESTY: the English wording below is the instrument. The Arabic
// is a working rendering for administration in this clinic — it is NOT a
// separately validated Arabic PSC-17, and the UI says so. Same position the
// platform takes on Vanderbilt.
//
// This is a SCREEN, not a diagnosis: a score above a cut-off means further
// assessment is warranted, nothing more.

export type PscSubscale = 'internalising' | 'attention' | 'externalising'

export interface PscItem {
  /** 1-17, matching the published item order. */
  id: number
  subscale: PscSubscale
  /** Published English wording — authoritative. */
  textEn: string
  /** Working Arabic rendering for administration. */
  text: string
}

/** The official 0-2 frequency scale. */
export const PSC_LABELS = ['أبداً', 'أحياناً', 'غالباً']
export const PSC_LABELS_EN = ['Never', 'Sometimes', 'Often']
export const PSC_COLORS = ['#22C55E', '#F59E0B', '#EF4444']
export const PSC_BG = ['#F0FFF4', '#FFFBEB', '#FEF2F2']

export const PSC17_ITEMS: PscItem[] = [
  { id: 1,  subscale: 'attention',      textEn: 'Fidgety, unable to sit still',             text: 'كثير الحركة، لا يستطيع الجلوس ساكناً' },
  { id: 2,  subscale: 'internalising',  textEn: 'Feels sad, unhappy',                       text: 'يشعر بالحزن وعدم السعادة' },
  { id: 3,  subscale: 'attention',      textEn: 'Daydreams too much',                       text: 'يسرح بخياله كثيراً' },
  { id: 4,  subscale: 'externalising',  textEn: 'Refuses to share',                         text: 'يرفض المشاركة' },
  { id: 5,  subscale: 'externalising',  textEn: "Does not understand other people's feelings", text: 'لا يفهم مشاعر الآخرين' },
  { id: 6,  subscale: 'internalising',  textEn: 'Feels hopeless',                           text: 'يشعر باليأس' },
  { id: 7,  subscale: 'attention',      textEn: 'Has trouble concentrating',                text: 'يجد صعوبة في التركيز' },
  { id: 8,  subscale: 'externalising',  textEn: 'Fights with other children',               text: 'يتشاجر مع الأطفال الآخرين' },
  { id: 9,  subscale: 'internalising',  textEn: 'Is down on themselves',                    text: 'ينتقد نفسه ويقلّل من قيمتها' },
  { id: 10, subscale: 'externalising',  textEn: 'Blames others for their troubles',         text: 'يلوم الآخرين على مشاكله' },
  { id: 11, subscale: 'internalising',  textEn: 'Seems to be having less fun',              text: 'يبدو أنه يستمتع أقل من ذي قبل' },
  { id: 12, subscale: 'externalising',  textEn: 'Does not listen to rules',                 text: 'لا يلتزم بالقواعد' },
  { id: 13, subscale: 'attention',      textEn: 'Acts as if driven by a motor',             text: 'يتصرّف وكأن محركاً يديره' },
  { id: 14, subscale: 'externalising',  textEn: 'Teases others',                            text: 'يضايق الآخرين' },
  { id: 15, subscale: 'internalising',  textEn: 'Worries a lot',                            text: 'يقلق كثيراً' },
  { id: 16, subscale: 'externalising',  textEn: 'Takes things that do not belong to them',  text: 'يأخذ أشياء ليست له' },
  { id: 17, subscale: 'attention',      textEn: 'Distracted easily',                        text: 'يتشتّت بسهولة' },
]

/**
 * Published cut-offs (Gardner et al., 1999). At or above = positive screen.
 * `max` is the subscale's ceiling, used to render the score honestly as x/max.
 */
export const PSC_CUTOFFS: Record<PscSubscale | 'total', { cutoff: number; max: number }> = {
  internalising: { cutoff: 5, max: 10 },
  attention: { cutoff: 7, max: 10 },
  externalising: { cutoff: 7, max: 14 },
  total: { cutoff: 15, max: 34 },
}

export const SUBSCALE_META: Record<PscSubscale, {
  label: string; labelEn: string; desc: string; color: string; bg: string; emoji: string
}> = {
  internalising: {
    label: 'الأعراض الداخلية', labelEn: 'Internalising',
    desc: 'الحزن، اليأس، تدنّي تقدير الذات، القلق، وفقدان الاستمتاع',
    color: '#4338CA', bg: '#EEF2FF', emoji: '💙',
  },
  attention: {
    label: 'الانتباه', labelEn: 'Attention',
    desc: 'التململ الحركي، السرحان، صعوبة التركيز، وسهولة التشتّت',
    color: '#7C5CFC', bg: '#F3EEFF', emoji: '🎯',
  },
  externalising: {
    label: 'الأعراض الخارجية', labelEn: 'Externalising',
    desc: 'الشجار، عدم الالتزام بالقواعد، المضايقة، واللوم، وأخذ ما ليس له',
    color: '#C2410C', bg: '#FFF7ED', emoji: '⚡',
  },
}

export const SUBSCALE_IDS: Record<PscSubscale, number[]> = {
  internalising: PSC17_ITEMS.filter(i => i.subscale === 'internalising').map(i => i.id),
  attention: PSC17_ITEMS.filter(i => i.subscale === 'attention').map(i => i.id),
  externalising: PSC17_ITEMS.filter(i => i.subscale === 'externalising').map(i => i.id),
}

export interface PscSubscaleScore {
  subscale: PscSubscale
  score: number
  max: number
  cutoff: number
  positive: boolean
}

export interface Psc17Score {
  /** True only when all 17 items were answered — a partial form is not scorable. */
  complete: boolean
  answered: number
  total: number
  totalMax: number
  totalCutoff: number
  totalPositive: boolean
  subscales: PscSubscaleScore[]
  /** Subscales at or above their cut-off, for the summary line. */
  positiveSubscales: PscSubscale[]
}

/**
 * Score a completed PSC-17.
 *
 * Deliberately strict about completeness: PSC-17 cut-offs are sums over a fixed
 * item set, so a form with missing answers has an artificially low total and
 * would read as a negative screen. Missing items are treated as unanswered and
 * `complete` is false — the caller must not present an incomplete form's score
 * as a screening result.
 *
 * Answers map item id (1-17) to 0, 1 or 2. Anything else is ignored rather than
 * coerced, so a malformed value cannot quietly become a 0.
 */
export function scorePsc17(answers: Record<number, number>): Psc17Score {
  const valid = new Map<number, number>()
  for (const item of PSC17_ITEMS) {
    const raw = answers[item.id]
    if (raw === 0 || raw === 1 || raw === 2) valid.set(item.id, raw)
  }

  const subscales: PscSubscaleScore[] = (Object.keys(SUBSCALE_IDS) as PscSubscale[]).map(key => {
    const score = SUBSCALE_IDS[key].reduce((sum, id) => sum + (valid.get(id) ?? 0), 0)
    const { cutoff, max } = PSC_CUTOFFS[key]
    return { subscale: key, score, max, cutoff, positive: score >= cutoff }
  })

  const total = [...valid.values()].reduce((s, n) => s + n, 0)
  const complete = valid.size === PSC17_ITEMS.length

  return {
    complete,
    answered: valid.size,
    total,
    totalMax: PSC_CUTOFFS.total.max,
    totalCutoff: PSC_CUTOFFS.total.cutoff,
    totalPositive: total >= PSC_CUTOFFS.total.cutoff,
    subscales,
    // Only meaningful on a complete form; the caller gates on `complete`.
    positiveSubscales: subscales.filter(s => s.positive).map(s => s.subscale),
  }
}

/**
 * A plain-Arabic reading of the result for the specialist's report.
 * Never states or implies a diagnosis.
 */
export function describePsc17(score: Psc17Score): string {
  if (!score.complete) {
    return `النموذج غير مكتمل (${score.answered} من ${PSC17_ITEMS.length} بنداً) — لا يمكن احتساب نتيجة فرز.`
  }
  const names = score.positiveSubscales.map(s => SUBSCALE_META[s].label)
  if (!score.totalPositive && names.length === 0) {
    return `المجموع ${score.total} من ${score.totalMax} (العتبة ${score.totalCutoff}) — دون عتبة الفرز في كل المجالات. لا يعني هذا غياب صعوبة، بل أن هذا المقياس لم يلتقط ما يستدعي تقييماً إضافياً.`
  }
  const parts: string[] = []
  if (score.totalPositive) {
    parts.push(`المجموع ${score.total} من ${score.totalMax} — عند أو فوق عتبة الفرز (${score.totalCutoff}).`)
  } else {
    parts.push(`المجموع ${score.total} من ${score.totalMax} — دون العتبة الكلية (${score.totalCutoff}).`)
  }
  if (names.length > 0) {
    parts.push(`المجالات التي بلغت عتبتها: ${names.join('، ')}.`)
  }
  parts.push('فرز إيجابي يعني الحاجة لتقييم متخصّص، ولا يعني تشخيصاً.')
  return parts.join(' ')
}
