// NICHQ Vanderbilt Assessment Scale — PARENT Informant (public, free to use).
// This replaces the earlier custom attention questionnaire with the actual,
// validated Vanderbilt ADHD screen: real DSM-aligned symptom items, the
// official 0–3 frequency scale, a functional-impairment (Performance) section,
// and the published scoring rule (≥6 symptoms rated "Often/Very Often" in a
// domain AND at least one area of functional impairment).
//
// Scope note (honest): we implement the ADHD symptom domains (Inattention,
// Hyperactivity/Impulsivity), a brief Oppositional-Defiant screen, and the
// Performance/impairment section. We deliberately omit the Conduct-Disorder
// and anxiety/depression items — inappropriate for a parent-facing self-serve
// tool in a therapy-education setting. It remains a screen, not a diagnosis.

export type VanderbiltDomain = 'inattention' | 'hyperactivity' | 'oppositional'

export interface VanderbiltItem {
  id: number
  domain: VanderbiltDomain
  text: string   // Arabic (authoritative for this platform)
  textEn: string // NICHQ original wording
}

export interface PerformanceItem {
  id: string
  text: string
  textEn: string
}

// 0–3 symptom frequency scale. A symptom "counts" when rated 2 or 3.
export const FREQ_LABELS    = ['أبداً', 'أحياناً', 'غالباً', 'دائماً']
export const FREQ_LABELS_EN = ['Never', 'Occasionally', 'Often', 'Very Often']
export const FREQ_COLORS    = ['#22C55E', '#84CC16', '#F59E0B', '#EF4444']
export const FREQ_BG        = ['#F0FFF4', '#F7FEE7', '#FFFBEB', '#FEF2F2']
export const SYMPTOM_THRESHOLD = 2 // rated ≥2 ("Often") counts as present

// 1–5 performance scale. 4 or 5 = an area of functional impairment.
export const PERF_LABELS    = ['ممتاز', 'فوق المتوسط', 'متوسط', 'يوجد بعض الصعوبة', 'صعوبة واضحة']
export const PERF_LABELS_EN = ['Excellent', 'Above Average', 'Average', 'Somewhat of a Problem', 'Problematic']
export const PERF_IMPAIRMENT_MIN = 4 // rating 4 or 5 signals impairment

export const DOMAIN_META: Record<VanderbiltDomain, {
  label: string; labelEn: string; color: string; bg: string; emoji: string
  exerciseTips: string[]
}> = {
  inattention: {
    label: 'العجز عن الانتباه', labelEn: 'Inattention',
    color: '#7C5CFC', bg: '#F3EEFF', emoji: '🎯',
    exerciseTips: ['تنفّس الفقاعات', 'قذف الهدف المركّز', 'تتبع البصر', 'الذاكرة العاملة', 'قف واسمع'],
  },
  hyperactivity: {
    label: 'فرط الحركة والاندفاعية', labelEn: 'Hyperactivity / Impulsivity',
    color: '#EF4444', bg: '#FEF2F2', emoji: '⚡',
    exerciseTips: ['يوغا الأطفال', 'المشي على خط التوازن', 'الحركة اليقظة', 'مزامنة الإيقاع الحركي', 'تحدي الانتظار'],
  },
  oppositional: {
    label: 'السلوك المعارض', labelEn: 'Oppositional-Defiant',
    color: '#F59E0B', bg: '#FFFBEB', emoji: '🛑',
    exerciseTips: ['لوحة الاختيارات', 'عقد السلوك', 'ركن الهدوء', 'تنظيم المشاعر'],
  },
}

// ── Symptom items (NICHQ Vanderbilt Parent, items 1–26) ────────────────────
export const VANDERBILT_ITEMS: VanderbiltItem[] = [
  // Inattention (DSM 1–9)
  { id: 1,  domain: 'inattention', text: 'لا ينتبه للتفاصيل أو يرتكب أخطاء غير مقصودة (مثلاً في الواجبات)', textEn: 'Does not pay attention to details or makes careless mistakes, e.g., in homework' },
  { id: 2,  domain: 'inattention', text: 'يجد صعوبة في الحفاظ على انتباهه لما ينبغي عمله', textEn: 'Has difficulty keeping attention to what needs to be done' },
  { id: 3,  domain: 'inattention', text: 'لا يبدو أنه يستمع عند التحدث إليه مباشرةً', textEn: 'Does not seem to listen when spoken to directly' },
  { id: 4,  domain: 'inattention', text: 'لا يتبع التعليمات ولا يُنهي المهام (ليس بسبب الرفض أو عدم الفهم)', textEn: 'Does not follow through on instructions and fails to finish tasks (not due to refusal or failure to understand)' },
  { id: 5,  domain: 'inattention', text: 'يجد صعوبة في تنظيم المهام والأنشطة', textEn: 'Has difficulty organizing tasks and activities' },
  { id: 6,  domain: 'inattention', text: 'يتجنّب أو لا يحب المهام التي تتطلب جهداً ذهنياً متواصلاً', textEn: 'Avoids, dislikes, or does not want to start tasks that require ongoing mental effort' },
  { id: 7,  domain: 'inattention', text: 'يفقد الأشياء اللازمة للمهام (ألعاب، أقلام، كتب، واجبات)', textEn: 'Loses things necessary for tasks or activities (toys, assignments, pencils, or books)' },
  { id: 8,  domain: 'inattention', text: 'يتشتت بسهولة بالأصوات أو المثيرات الأخرى', textEn: 'Is easily distracted by noises or other stimuli' },
  { id: 9,  domain: 'inattention', text: 'كثير النسيان في الأنشطة اليومية', textEn: 'Is forgetful in daily activities' },
  // Hyperactivity / Impulsivity (DSM 10–18)
  { id: 10, domain: 'hyperactivity', text: 'يحرّك يديه أو قدميه كثيراً أو يتلوّى في مقعده', textEn: 'Fidgets with hands or feet or squirms in seat' },
  { id: 11, domain: 'hyperactivity', text: 'يترك مقعده حين يُتوقّع منه البقاء جالساً', textEn: 'Leaves seat when remaining seated is expected' },
  { id: 12, domain: 'hyperactivity', text: 'يجري أو يتسلّق كثيراً في مواقف غير مناسبة', textEn: 'Runs about or climbs too much when remaining seated is expected' },
  { id: 13, domain: 'hyperactivity', text: 'يجد صعوبة في اللعب أو الانخراط في نشاط هادئ', textEn: 'Has difficulty playing or beginning quiet play activities' },
  { id: 14, domain: 'hyperactivity', text: 'دائم الحركة وكأنه «مدفوع بمحرّك»', textEn: 'Is "on the go" or often acts as if "driven by a motor"' },
  { id: 15, domain: 'hyperactivity', text: 'يتكلّم كثيراً', textEn: 'Talks too much' },
  { id: 16, domain: 'hyperactivity', text: 'يجيب قبل اكتمال السؤال', textEn: 'Blurts out answers before questions have been completed' },
  { id: 17, domain: 'hyperactivity', text: 'يجد صعوبة في انتظار دوره', textEn: 'Has difficulty waiting his or her turn' },
  { id: 18, domain: 'hyperactivity', text: 'يقاطع الآخرين أو يتدخّل في أحاديثهم وأنشطتهم', textEn: "Interrupts or intrudes on others' conversations and/or activities" },
  // Oppositional-Defiant (brief screen, items 19–26)
  { id: 19, domain: 'oppositional', text: 'يجادل الكبار', textEn: 'Argues with adults' },
  { id: 20, domain: 'oppositional', text: 'يفقد أعصابه', textEn: 'Loses temper' },
  { id: 21, domain: 'oppositional', text: 'يتحدّى أو يرفض الالتزام بطلبات الكبار وقواعدهم', textEn: "Actively defies or refuses to go along with adults' requests or rules" },
  { id: 22, domain: 'oppositional', text: 'يزعج الآخرين عمداً', textEn: 'Deliberately annoys people' },
  { id: 23, domain: 'oppositional', text: 'يلوم الآخرين على أخطائه', textEn: 'Blames others for his or her mistakes or misbehaviors' },
  { id: 24, domain: 'oppositional', text: 'سريع الانزعاج والتحسّس من الآخرين', textEn: 'Is touchy or easily annoyed by others' },
  { id: 25, domain: 'oppositional', text: 'غاضب أو حانق', textEn: 'Is angry or resentful' },
  { id: 26, domain: 'oppositional', text: 'حاقد ويريد الانتقام', textEn: 'Is spiteful and wants to get even' },
]

// Performance / functional-impairment section (Parent form).
export const PERFORMANCE_ITEMS: PerformanceItem[] = [
  { id: 'school',   text: 'الأداء الدراسي العام',        textEn: 'Overall school performance' },
  { id: 'reading',  text: 'القراءة',                     textEn: 'Reading' },
  { id: 'writing',  text: 'الكتابة',                     textEn: 'Writing' },
  { id: 'math',     text: 'الرياضيات',                   textEn: 'Mathematics' },
  { id: 'parents',  text: 'العلاقة مع الوالدين',         textEn: 'Relationship with parents' },
  { id: 'siblings', text: 'العلاقة مع الإخوة',           textEn: 'Relationship with siblings' },
  { id: 'peers',    text: 'العلاقة مع الأقران',          textEn: 'Relationship with peers' },
  { id: 'activities', text: 'المشاركة في الأنشطة المنظّمة', textEn: 'Participation in organized activities' },
]

export const INATTENTION_IDS  = VANDERBILT_ITEMS.filter(i => i.domain === 'inattention').map(i => i.id)
export const HYPERACTIVITY_IDS = VANDERBILT_ITEMS.filter(i => i.domain === 'hyperactivity').map(i => i.id)
export const OPPOSITIONAL_IDS  = VANDERBILT_ITEMS.filter(i => i.domain === 'oppositional').map(i => i.id)

export interface VanderbiltScore {
  inattentionCount: number      // symptoms rated ≥2 (0–9)
  hyperactivityCount: number    // (0–9)
  oppositionalCount: number     // (0–8)
  hasImpairment: boolean        // any performance area rated ≥4
  impairedAreas: string[]
  inattentivePositive: boolean  // ≥6 inattention symptoms AND impairment
  hyperactivePositive: boolean  // ≥6 H/I symptoms AND impairment
  oppositionalConcern: boolean  // ≥4 ODD symptoms AND impairment
  subtype: 'inattentive' | 'hyperactive' | 'combined' | 'subthreshold' | 'none'
  totalAdhdSymptoms: number     // present symptoms among the 18 core items
  severity: 'none' | 'mild' | 'moderate' | 'severe'
}

function countPresent(answers: Record<number, number>, ids: number[]): number {
  return ids.reduce((n, id) => n + ((answers[id] ?? 0) >= SYMPTOM_THRESHOLD ? 1 : 0), 0)
}

/**
 * Apply the official NICHQ Vanderbilt scoring rule, then derive an intensity
 * tier used to size the therapy plan. The intensity tier is OUR transparent
 * triage (documented), separate from the validated screen result above.
 */
export function scoreVanderbilt(
  answers: Record<number, number>,
  performance: Record<string, number>,
): VanderbiltScore {
  const inattentionCount   = countPresent(answers, INATTENTION_IDS)
  const hyperactivityCount = countPresent(answers, HYPERACTIVITY_IDS)
  const oppositionalCount  = countPresent(answers, OPPOSITIONAL_IDS)

  const impairedAreas = PERFORMANCE_ITEMS
    .filter(p => (performance[p.id] ?? 0) >= PERF_IMPAIRMENT_MIN)
    .map(p => p.id)
  const hasImpairment = impairedAreas.length > 0

  const inattentivePositive = inattentionCount >= 6 && hasImpairment
  const hyperactivePositive = hyperactivityCount >= 6 && hasImpairment
  const oppositionalConcern = oppositionalCount >= 4 && hasImpairment

  const totalAdhdSymptoms = inattentionCount + hyperactivityCount

  let subtype: VanderbiltScore['subtype']
  if (inattentivePositive && hyperactivePositive) subtype = 'combined'
  else if (inattentivePositive) subtype = 'inattentive'
  else if (hyperactivePositive) subtype = 'hyperactive'
  else if (inattentionCount >= 6 || hyperactivityCount >= 6) subtype = 'subthreshold' // symptoms without reported impairment
  else subtype = 'none'

  let severity: VanderbiltScore['severity']
  if (subtype === 'combined' || totalAdhdSymptoms >= 15) severity = 'severe'
  else if (inattentivePositive || hyperactivePositive) severity = totalAdhdSymptoms >= 12 ? 'severe' : 'moderate'
  else if (totalAdhdSymptoms >= 6) severity = 'mild'
  else severity = 'none'

  return {
    inattentionCount, hyperactivityCount, oppositionalCount,
    hasImpairment, impairedAreas,
    inattentivePositive, hyperactivePositive, oppositionalConcern,
    subtype, totalAdhdSymptoms, severity,
  }
}

export const SUBTYPE_LABEL: Record<VanderbiltScore['subtype'], { label: string; desc: string; color: string; bg: string }> = {
  combined:     { label: 'مؤشرات النمط المشترك', desc: 'مؤشرات على العجز في الانتباه وفرط الحركة معاً مع تأثير وظيفي', color: '#B91C1C', bg: '#FEF2F2' },
  inattentive:  { label: 'مؤشرات نمط قلة الانتباه', desc: 'مؤشرات على العجز في الانتباه مع تأثير وظيفي', color: '#6D28D9', bg: '#F3EEFF' },
  hyperactive:  { label: 'مؤشرات نمط فرط الحركة', desc: 'مؤشرات على فرط الحركة والاندفاعية مع تأثير وظيفي', color: '#C2410C', bg: '#FFF7ED' },
  subthreshold: { label: 'أعراض دون عتبة الفرز', desc: 'توجد أعراض ملحوظة لكن دون تأثير وظيفي واضح مُبلَّغ عنه — يُنصح بالمتابعة', color: '#B45309', bg: '#FFFBEB' },
  none:         { label: 'ضمن المعدل الطبيعي', desc: 'لا تظهر مؤشرات كافية للفرز في هذه الاستمارة', color: '#16A34A', bg: '#F0FFF4' },
}
