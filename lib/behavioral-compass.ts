// ─────────────────────────────────────────────────────────────────────────────
// البوصلة السلوكية–التعلّمية — المحرّك (تصحيح أوتوماتيكي)
//
// نسخة رقمية من "دليل الأخصائي + أوراق الطفل" (AMINE ACADEMY):
//   • استمارة "كيف أرى نفسي" — 24 عبارة، 4 محاور × 6 عبارات، سلّم 1–4
//   • كرّاسة المهام المتدرّجة — 13 بنداً (3 مستويات)
//
// أداة فحص وملاحظة غير معيارية — ليست اختباراً مقنّناً ولا أداة تشخيص.
// كل البنود أصليّة وغير منقولة من أي اختبار محمي.
// ─────────────────────────────────────────────────────────────────────────────

export type AxisKey = 'A' | 'B' | 'C' | 'D'

export interface AxisMeta {
  key: AxisKey
  code: string          // الرمز العربي (أ/ب/ج/د)
  title: string
  subtitle: string
}

export const AXES: AxisMeta[] = [
  { key: 'A', code: 'أ', title: 'العقليّة تجاه القدرة', subtitle: 'هل يرى قدرته قابلة للتطوّر أم ثابتة' },
  { key: 'B', code: 'ب', title: 'تحمّل الإحباط والمثابرة', subtitle: 'كم يصمد أمام الصعوبة قبل الانسحاب' },
  { key: 'C', code: 'ج', title: 'طلب المساعدة', subtitle: 'هل يطلب المساعدة أم يتجنّبها خوفاً من الصورة' },
  { key: 'D', code: 'د', title: 'تنظيم الانفعال والتعافي', subtitle: 'هل يملك أدوات للتهدئة والعودة' },
]

export interface SelfReportItem {
  id: string            // مثل A1
  axis: AxisKey
  n: number             // ترتيب داخل المحور 1..6
  text: string
  reverse: boolean      // عبارة سالبة تُحسب معكوسة (5 − الإجابة)
}

// سلّم الإجابة: 1 = أبداً · 2 = أحياناً · 3 = غالباً · 4 = دائماً
export const ANSWER_SCALE = [
  { value: 1, label: 'أبداً' },
  { value: 2, label: 'أحياناً' },
  { value: 3, label: 'غالباً' },
  { value: 4, label: 'دائماً' },
] as const

export type AnswerValue = 1 | 2 | 3 | 4

// العبارات (أصليّة). العبارات المعكوسة (reverse) سالبة الصياغة.
export const SELF_REPORT: SelfReportItem[] = [
  // المحور أ — العقليّة تجاه القدرة
  { id: 'A1', axis: 'A', n: 1, reverse: true,  text: 'ذكاء الإنسان شيء يولد به ولا يتغيّر كثيراً' },
  { id: 'A2', axis: 'A', n: 2, reverse: false, text: 'إذا تدرّبت بما يكفي أستطيع أن أتحسّن في أيّ مادة' },
  { id: 'A3', axis: 'A', n: 3, reverse: true,  text: 'عندما أرى زميلاً أفضل منّي أشعر أنني لن أصل إلى مستواه' },
  { id: 'A4', axis: 'A', n: 4, reverse: false, text: 'الخطأ جزء طبيعي من التعلّم' },
  { id: 'A5', axis: 'A', n: 5, reverse: true,  text: 'إذا احتجت وقتاً أطول من غيري فهذا يعني أنني أقلّ منهم' },
  { id: 'A6', axis: 'A', n: 6, reverse: false, text: 'المهارات الصعبة تحتاج وقتاً طويلاً، وهذا شيء عادي' },
  // المحور ب — تحمّل الإحباط والمثابرة
  { id: 'B1', axis: 'B', n: 1, reverse: true,  text: 'عندما لا أفهم شيئاً بسرعة أترك المهمة' },
  { id: 'B2', axis: 'B', n: 2, reverse: false, text: 'أستطيع الاستمرار في تمرين صعب حتى أنهيه' },
  { id: 'B3', axis: 'B', n: 3, reverse: true,  text: 'إذا أخطأت مرتين أفقد رغبتي في المحاولة' },
  { id: 'B4', axis: 'B', n: 4, reverse: false, text: 'أجرّب طريقة أخرى عندما لا تنجح الطريقة الأولى' },
  { id: 'B5', axis: 'B', n: 5, reverse: true,  text: 'أشعر أحياناً أنّ رأسي يتوقّف فجأة ولا أعود أفهم شيئاً' },
  { id: 'B6', axis: 'B', n: 6, reverse: false, text: 'أستطيع العودة إلى المهمة بعد استراحة قصيرة' },
  // المحور ج — طلب المساعدة
  { id: 'C1', axis: 'C', n: 1, reverse: false, text: 'أطلب المساعدة عندما لا أفهم' },
  { id: 'C2', axis: 'C', n: 2, reverse: true,  text: 'أخاف أن يظنّ الآخرون أنني ضعيف إذا سألت' },
  { id: 'C3', axis: 'C', n: 3, reverse: true,  text: 'أفضّل أن أترك الورقة فارغة على أن أسأل' },
  { id: 'C4', axis: 'C', n: 4, reverse: false, text: 'أستطيع أن أحدّد بالضبط الخطوة التي لم أفهمها' },
  { id: 'C5', axis: 'C', n: 5, reverse: true,  text: 'أتحجّج بالتعب أو الملل عندما تكون المهمة صعبة' },
  { id: 'C6', axis: 'C', n: 6, reverse: false, text: 'أرتاح عندما يشرح لي أحدهم من جديد بطريقة أخرى' },
  // المحور د — تنظيم الانفعال والتعافي
  { id: 'D1', axis: 'D', n: 1, reverse: false, text: 'ألاحظ في جسدي علامات تدلّ على أنني بدأت أتوتّر' },
  { id: 'D2', axis: 'D', n: 2, reverse: true,  text: 'عندما أغضب من نفسي أحتاج وقتاً طويلاً حتى أهدأ' },
  { id: 'D3', axis: 'D', n: 3, reverse: false, text: 'أعرف شيئاً واحداً على الأقل يهدّئني فعلاً' },
  { id: 'D4', axis: 'D', n: 4, reverse: true,  text: 'عندما أفشل في شيء أقول لنفسي كلاماً قاسياً' },
  { id: 'D5', axis: 'D', n: 5, reverse: false, text: 'أستطيع أن أطلب استراحة بدل أن أنسحب أو أغضب' },
  { id: 'D6', axis: 'D', n: 6, reverse: false, text: 'بعد يوم سيّئ أستطيع أن أبدأ من جديد في اليوم التالي' },
]

// ── الفئات (مجموع المحور 6..24) ───────────────────────────────────────────────
export type AxisCategory = 'intervention' | 'support' | 'strength'

export const CATEGORY_META: Record<AxisCategory, { label: string; range: string; tone: string }> = {
  intervention: { label: 'أولويّة تدخّل', range: '6–11',  tone: 'red' },
  support:      { label: 'يحتاج دعماً',   range: '12–17', tone: 'amber' },
  strength:     { label: 'نقطة قوّة',     range: '18–24', tone: 'emerald' },
}

export function categoryForSum(sum: number): AxisCategory {
  if (sum <= 11) return 'intervention'
  if (sum <= 17) return 'support'
  return 'strength'
}

export interface AxisScore {
  axis: AxisKey
  sum: number
  category: AxisCategory
}

// الدرجة المعدّلة للعبارة الواحدة: المعكوسة = 5 − الإجابة، وغيرها كما هي
export function adjustedItemScore(item: SelfReportItem, answer: AnswerValue): number {
  return item.reverse ? 5 - answer : answer
}

export function scoreSelfReport(answers: Record<string, AnswerValue>): {
  axes: Record<AxisKey, AxisScore>
  complete: boolean
  answeredCount: number
} {
  const sums: Record<AxisKey, number> = { A: 0, B: 0, C: 0, D: 0 }
  let answeredCount = 0
  for (const item of SELF_REPORT) {
    const a = answers[item.id]
    if (a === 1 || a === 2 || a === 3 || a === 4) {
      sums[item.axis] += adjustedItemScore(item, a)
      answeredCount++
    }
  }
  const axes = {} as Record<AxisKey, AxisScore>
  for (const k of ['A', 'B', 'C', 'D'] as AxisKey[]) {
    axes[k] = { axis: k, sum: sums[k], category: categoryForSum(sums[k]) }
  }
  return { axes, complete: answeredCount === SELF_REPORT.length, answeredCount }
}

// ── كرّاسة المهام المتدرّجة ────────────────────────────────────────────────────
// المهام العدديّة: الطفل يكتب الإجابة → تصحيح أوتوماتيكي.
// المهام البصريّة: أربعة خيارات مرسومة، الخيار الصحيح مُعرّف بالموضع.
// (عدد الإجابات الصحيحة مؤشّر ثانوي — الأهمّ ملاحظة السلوك: الزمن، التلميحات، الانغلاق.)

export type Glyph =
  | { t: 'poly'; shape: 'square' | 'triangle' | 'circle'; fill: boolean; inner?: 'hline' | 'vline' | 'plus' }
  | { t: 'arrow'; dir: 'up' | 'right' | 'down' | 'left' }
  | { t: 'dots'; n: number }

export type VisualStem =
  | { kind: 'row'; cells: (Glyph | null)[] }
  | { kind: 'grid'; cols: number; cells: (Glyph | null)[] }
  | { kind: 'analogy'; a: Glyph; b: Glyph; c: Glyph }

export interface NumericTask {
  id: string
  level: 1 | 2 | 3
  kind: 'numeric'
  sequence: number[]      // تُعرض متبوعة بـ "؟"
  answer: number
  rule: string
}

export interface VisualTask {
  id: string
  level: 1 | 2 | 3
  kind: 'visual'
  prompt: string
  stem: VisualStem
  options: Glyph[]
  correctIndex: number
  rule: string
}

export type Task = NumericTask | VisualTask

export const TASKS: Task[] = [
  // ── المستوى الأول (سهل) ──
  { id: 'T1', level: 1, kind: 'numeric', sequence: [2, 4, 6, 8], answer: 10, rule: 'إضافة 2 في كل خطوة' },
  { id: 'T2', level: 1, kind: 'numeric', sequence: [5, 10, 15, 20], answer: 25, rule: 'إضافة 5 في كل خطوة' },
  {
    id: 'T3', level: 1, kind: 'visual', prompt: 'ما الشكل الناقص؟',
    rule: 'الصفّ يحدّد الشكل، والعمود يحدّد الامتلاء',
    stem: {
      kind: 'grid', cols: 3, cells: [
        { t: 'poly', shape: 'circle', fill: true }, { t: 'poly', shape: 'circle', fill: false }, { t: 'poly', shape: 'circle', fill: true },
        { t: 'poly', shape: 'triangle', fill: true }, { t: 'poly', shape: 'triangle', fill: false }, { t: 'poly', shape: 'triangle', fill: true },
        { t: 'poly', shape: 'square', fill: true }, { t: 'poly', shape: 'square', fill: false }, null,
      ],
    },
    options: [
      { t: 'poly', shape: 'square', fill: true },
      { t: 'poly', shape: 'square', fill: false },
      { t: 'poly', shape: 'triangle', fill: true },
      { t: 'poly', shape: 'circle', fill: true },
    ],
    correctIndex: 0,
  },
  {
    id: 'T4', level: 1, kind: 'visual', prompt: 'ما الشكل الذي يكمل السلسلة؟',
    rule: 'دوران 90° مع عقارب الساعة في كل خطوة',
    stem: { kind: 'row', cells: [{ t: 'arrow', dir: 'up' }, { t: 'arrow', dir: 'right' }, { t: 'arrow', dir: 'down' }, null] },
    options: [
      { t: 'arrow', dir: 'left' },
      { t: 'arrow', dir: 'up' },
      { t: 'arrow', dir: 'right' },
      { t: 'arrow', dir: 'down' },
    ],
    correctIndex: 0,
  },
  // ── المستوى الثاني (متوسّط) ──
  { id: 'T5', level: 2, kind: 'numeric', sequence: [3, 6, 12, 24], answer: 48, rule: 'ضرب في 2' },
  { id: 'T6', level: 2, kind: 'numeric', sequence: [1, 4, 9, 16], answer: 25, rule: 'مربّعات الأعداد: 1، 4، 9، 16، 25' },
  {
    id: 'T7', level: 2, kind: 'visual', prompt: 'ما الذي يكمل السلسلة؟',
    rule: 'زيادة نقطة واحدة في كل خطوة',
    stem: { kind: 'row', cells: [{ t: 'dots', n: 2 }, { t: 'dots', n: 3 }, { t: 'dots', n: 4 }, null] },
    options: [
      { t: 'dots', n: 5 },
      { t: 'dots', n: 4 },
      { t: 'dots', n: 6 },
      { t: 'dots', n: 3 },
    ],
    correctIndex: 0,
  },
  {
    id: 'T8', level: 2, kind: 'visual', prompt: 'أكمل العلاقة',
    rule: 'يُضاف خطّ أفقي داخل الشكل نفسه',
    stem: {
      kind: 'analogy',
      a: { t: 'poly', shape: 'circle', fill: false },
      b: { t: 'poly', shape: 'circle', fill: false, inner: 'hline' },
      c: { t: 'poly', shape: 'square', fill: false },
    },
    options: [
      { t: 'poly', shape: 'square', fill: false, inner: 'hline' },
      { t: 'poly', shape: 'square', fill: false, inner: 'vline' },
      { t: 'poly', shape: 'triangle', fill: false, inner: 'hline' },
      { t: 'poly', shape: 'square', fill: false },
    ],
    correctIndex: 0,
  },
  // ── المستوى الثالث (صعب) ──
  { id: 'T9', level: 3, kind: 'numeric', sequence: [2, 3, 5, 8, 13], answer: 21, rule: 'كل عدد = مجموع العددين السابقين' },
  { id: 'T10', level: 3, kind: 'numeric', sequence: [7, 14, 10, 20, 16], answer: 32, rule: 'قاعدتان بالتناوب: ضرب في 2 ثم طرح 4' },
  {
    id: 'T11', level: 3, kind: 'visual', prompt: 'ما الذي يكمل الشبكة؟',
    rule: 'العمود يحدّد الشكل، والصفّ يحدّد الامتلاء',
    stem: {
      kind: 'grid', cols: 3, cells: [
        { t: 'poly', shape: 'circle', fill: true }, { t: 'poly', shape: 'square', fill: true }, { t: 'poly', shape: 'triangle', fill: true },
        { t: 'poly', shape: 'circle', fill: false }, { t: 'poly', shape: 'square', fill: false }, { t: 'poly', shape: 'triangle', fill: false },
        { t: 'poly', shape: 'circle', fill: true }, { t: 'poly', shape: 'square', fill: true }, null,
      ],
    },
    options: [
      { t: 'poly', shape: 'triangle', fill: true },
      { t: 'poly', shape: 'triangle', fill: false },
      { t: 'poly', shape: 'square', fill: true },
      { t: 'poly', shape: 'circle', fill: true },
    ],
    correctIndex: 0,
  },
  {
    id: 'T12', level: 3, kind: 'visual', prompt: 'لاحظ القاعدة ثم أكمل',
    rule: 'الشكل الثالث = تركيب الشكلين السابقين فوق بعضهما',
    stem: {
      kind: 'row', cells: [
        { t: 'poly', shape: 'triangle', fill: false },
        { t: 'poly', shape: 'circle', fill: false, inner: 'plus' },
        null,
      ],
    },
    options: [
      { t: 'poly', shape: 'triangle', fill: false, inner: 'plus' },
      { t: 'poly', shape: 'square', fill: false, inner: 'plus' },
      { t: 'poly', shape: 'triangle', fill: false },
      { t: 'poly', shape: 'circle', fill: false, inner: 'plus' },
    ],
    correctIndex: 0,
  },
  { id: 'T13', level: 3, kind: 'numeric', sequence: [2, 4, 3, 9, 4, 16, 5], answer: 25, rule: 'أزواج: العدد ثمّ مربّعه (2و4، 3و9، 4و16، 5و25)' },
]

export function isTaskCorrect(task: Task, answer: string | number | null | undefined): boolean {
  if (answer === null || answer === undefined || answer === '') return false
  if (task.kind === 'numeric') return Number(answer) === task.answer
  return Number(answer) === task.correctIndex
}

export function gradeTasks(answers: Record<string, string | number>): {
  correct: number
  total: number
  byLevel: Record<1 | 2 | 3, { correct: number; total: number }>
} {
  const byLevel: Record<1 | 2 | 3, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 },
  }
  let correct = 0
  for (const task of TASKS) {
    byLevel[task.level].total++
    if (isTaskCorrect(task, answers[task.id])) { correct++; byLevel[task.level].correct++ }
  }
  return { correct, total: TASKS.length, byLevel }
}

// ── علامات الانغلاق (للتسجيل أثناء المهام) ────────────────────────────────────
export const CLOSURE_SIGNS = {
  verbal: [
    { code: 'ل1', text: '«ما فهمت شي» دون تحديد' },
    { code: 'ل2', text: '«أنا غبي» أو ما يشبهها' },
    { code: 'ل3', text: '«ما بقدر» قبل المحاولة' },
    { code: 'ل4', text: 'تغيير الموضوع أو مزاح لتخفيف الضغط' },
    { code: 'ل5', text: 'غضب أو اتهام للمهمة («هذا سخيف»)' },
    { code: 'ل6', text: 'توقّف عن الكلام تماماً' },
  ],
  physical: [
    { code: 'ج1', text: 'صمت مفاجئ ونظرة ثابتة' },
    { code: 'ج2', text: 'إبعاد الورقة أو الأداة' },
    { code: 'ج3', text: 'إسناد الرأس إلى اليد أو الطاولة' },
    { code: 'ج4', text: 'حركة زائدة أو لعب بالقلم' },
    { code: 'ج5', text: 'احمرار الوجه أو تغيّر النَفَس' },
    { code: 'ج6', text: 'انسحاب جسدي أو طلب الخروج' },
  ],
} as const

// ── نظام التلميحات الثلاثة ─────────────────────────────────────────────────────
export const HINTS = [
  { code: 'ت1', say: 'توجيه الانتباه: «انظر إلى الصفّ الأول فقط. ما الذي تغيّر؟»' },
  { code: 'ت2', say: 'إعطاء الخطوة الأولى: «لاحظ أنّ العدد يزيد في كل مرة. بكم؟»' },
  { code: 'ت3', say: 'كشف نصف القاعدة: «القاعدة أنّ كل عدد يساوي مجموع العددين السابقين. جرّب.»' },
] as const

// ── أسئلة مقابلة وليّ الأمر ─────────────────────────────────────────────────────
export const PARENT_INTERVIEW: string[] = [
  'صِف لي آخر مرة «انغلق» فيها. ماذا حدث قبلها بدقائق؟',
  'كم مرة يحدث هذا في الأسبوع تقريباً؟',
  'في أيّ المواد أو المواقف يحدث أكثر؟',
  'كم يستغرق حتى يعود إلى حالته الطبيعية؟',
  'ما الذي يُخرجه منها عادة؟ وما الذي يزيدها سوءاً؟',
  'هل يحدث في المدرسة أيضاً أم في البيت فقط؟',
  'منذ متى بدأ هذا؟ وهل تزامن مع حدث معيّن؟',
  'كيف هو نومه وشهيّته ومزاجه عموماً في الأشهر الأخيرة؟',
  'هل يحدث في الأنشطة التي يحبّها أيضاً، أم في الدراسة فقط؟',
  'ماذا جرّبتم حتى الآن؟ وما الذي نفع ولو قليلاً؟',
]

// ── الأسئلة المفتوحة الثلاثة (شفهيّة، تُنقل حرفيّاً) ─────────────────────────────
export const OPEN_QUESTIONS: string[] = [
  'صِف لي ما يحدث داخل رأسك في اللحظة التي لا تفهم فيها شيئاً.',
  'ما الشيء الذي يساعدك فعلاً عندما تصل إلى تلك اللحظة؟',
  'لو كنت أنت المعلّم، كيف كنت ستشرح لطالب مثلك؟',
]

// ── مؤشّرات ورقة التسجيل أثناء المهام ──────────────────────────────────────────
export interface ObservationRecord {
  startDelaySec: string          // زمن البدء بعد التعليمة
  persistenceSec: string         // زمن الاستمرار قبل أول توقّف
  attempts: string               // عدد المحاولات المختلفة
  helpRequests: string           // عدد مرات طلب المساعدة
  helpSpecific: 'yes' | 'no' | ''// هل طلب المساعدة بصيغة محدّدة؟
  hintsUsed: string[]            // ت1/ت2/ت3
  firstClosureSign: string       // رمز أول علامة انغلاق
  timeToClosureSec: string       // الزمن من أول صعوبة إلى الانغلاق
  broughtBack: string            // ما الذي أعاده إلى المهمة؟
  finished: 'yes' | 'no' | 'partly' | ''
  selfPhrases: string            // عبارات قالها عن نفسه (حرفيّاً)
}

export function emptyObservation(): ObservationRecord {
  return {
    startDelaySec: '', persistenceSec: '', attempts: '', helpRequests: '',
    helpSpecific: '', hintsUsed: [], firstClosureSign: '', timeToClosureSec: '',
    broughtBack: '', finished: '', selfPhrases: '',
  }
}

// ── قراءة النتائج (قواعد الدليل) ───────────────────────────────────────────────
export interface Interpretation {
  priorities: { axis: AxisKey; label: string; note: string }[]
  hypotheses: string[]
  protocol: { step: number; title: string; detail: string }[]
  remeasure: string[]
  limits: string
  referral: string
}

const low = (s: AxisScore) => s.category === 'intervention'
const high = (s: AxisScore) => s.category === 'strength'

export function interpret(axes: Record<AxisKey, AxisScore>): Interpretation {
  const A = axes.A, B = axes.B, C = axes.C, D = axes.D

  const priorities = (['A', 'B', 'C', 'D'] as AxisKey[])
    .map(k => axes[k])
    .filter(s => s.category === 'intervention')
    .map(s => {
      const meta = AXES.find(a => a.key === s.axis)!
      const note: Record<AxisKey, string> = {
        A: 'ابنِ مفهوم القدرة القابلة للتطوّر: اربط التقدّم بالتدريب لا بالموهبة، وطبّع الخطأ كجزء من التعلّم.',
        B: 'اشتغل على التجزئة والسقالات التعليمية، وامنحه مهامّ متدرّجة ينجح فيها قبل رفع الصعوبة.',
        C: 'اجعل طلب المساعدة سلوكاً عاديّاً يُمدح عليه، وعلّمه صيغة «لم أفهم بعد» المحدّدة.',
        D: 'ابدأ بتنظيم الانفعال: إشارات الجسد، بطاقة استراحة، أداة تهدئة واحدة يتقنها.',
      }
      return { axis: s.axis, label: `${meta.code} — ${meta.title}`, note: note[s.axis] }
    })

  const hypotheses: string[] = []
  if (low(A) && low(C)) {
    hypotheses.push('نمط «القدرة الثابتة + تجنّب طلب المساعدة»: معتقد أنّ القدرة لا تتغيّر، مع خوف من الصورة أمام الآخرين. الأولوية: ترسيخ مفهوم القدرة القابلة للتطوّر، وجعل السؤال سلوكاً يُمدح عليه.')
  }
  if (low(B) && low(D)) {
    hypotheses.push('نمط «الانغلاق الانفعالي»: الإحباط يتجاوز قدرته على التنظيم. الأولوية: تنظيم الانفعال أولاً (إشارات الجسد، استراحة قصيرة، تهدئة) ثم العودة إلى المهمة.')
  }
  if (low(B) && high(D)) {
    hypotheses.push('نمط «المشكلة في المهمة لا في الانفعال»: تنظيمه الانفعالي سليم لكنه ينهار أمام الصعوبة. الأولوية: تعديل مستوى المهام والتجزئة والسقالات التعليمية فوق/تحت مستواه الحالي.')
  }
  if (!hypotheses.length) {
    const strengths = (['A', 'B', 'C', 'D'] as AxisKey[]).filter(k => high(axes[k]))
    if (strengths.length >= 3) {
      hypotheses.push('ملمح متوازن عموماً: معظم المحاور نقاط قوّة. تابع عبر الملاحظة السلوكيّة وأعد القياس بعد 8–12 أسبوعاً دون تدخّل مكثّف.')
    } else {
      hypotheses.push('ملمح متذبذب بحسب الموقف: استند إلى ملاحظة السلوك أثناء المهام (الزمن قبل الانغلاق، طلب المساعدة، العودة بعد الاستراحة) أكثر من الدرجات وحدها.')
    }
  }

  const protocol = [
    { step: 1, title: 'التوقّف قبل التكرار', detail: 'لا تُعد الشرح بالطريقة نفسها بصوت أعلى — فذلك يزيد الانغلاق. قل: «خذ نَفَساً، لا مشكلة، سنعود إليها بعد قليل».' },
    { step: 2, title: 'تسمية ما يحدث دون حكم', detail: '«يبدو أنّ رأسك امتلأ؛ هذا يحدث لكل الناس عندما تتجاوز المعلوماتُ قدرةَ الاستيعاب في لحظة واحدة».' },
    { step: 3, title: 'استراحة قصيرة بشرط العودة', detail: '60–90 ثانية: ماء، وقوف، حركة بسيطة — مع جملة واضحة: «نعود بعد دقيقة إلى الخطوة الأولى فقط».' },
    { step: 4, title: 'العودة من مستوى ينجح فيه', detail: 'ارجع خطوة إلى مهمة يتقنها ثم تقدّم، ليستعيد شعور القدرة قبل مواصلة الصعب.' },
    { step: 5, title: 'نظام التلميحات الثلاثة', detail: 'بدل الإجابة الجاهزة أو تركه يتخبّط: توجيه الانتباه ← الخطوة الأولى ← نصف القاعدة. ينجح بجهده ويتعلّم أنّ المساعدة سُلّم لا هزيمة.' },
    { step: 6, title: 'بطاقة «لم أفهم بعد»', detail: 'علّمه صيغة محدّدة: «فهمت حتى الخطوة الثانية وتوقّفت عند…» بدل «ما فهمت شي».' },
    { step: 7, title: 'إنهاء كل جلسة بنجاح', detail: 'آخر مهمة في الجلسة في مستوى يتقنها — فما يبقى في ذاكرته هو آخر دقيقتين.' },
  ]

  const remeasure = [
    'تُعاد الاستمارة والمهامّ بعد 8 إلى 12 أسبوعاً بنفس التعليمات.',
    'المؤشّرات التي تتحرّك أولاً: الزمن قبل أول انغلاق، عدد مرات طلب المساعدة بصيغة محدّدة، العودة إلى المهمة بعد الاستراحة.',
    'هذه المؤشّرات السلوكيّة تتحسّن عادةً قبل أن تتغيّر درجات الاستمارة — فلا تنتظر تغيّر الأرقام وحدها.',
  ]

  const limits =
    'أداة فحص وملاحظة غير معياريّة لتخطيط التدخّل ومتابعة التقدّم فقط. ليست اختباراً مقنّناً ولا أداة تشخيص، ولا تُكتب نتائجها بصيغة تشخيصيّة ولا للمقارنة بالأقران.'

  const referral =
    'عند ظهور انغلاق في كل المجالات حتى المحبّبة، أو تغيّر واضح في النوم والمزاج والشهيّة، أو مؤشّرات قلق أو اكتئاب أو صعوبة تعلّم — تُحال الحالة إلى أخصائي نفسي مؤهّل مع استمرار الدعم التربوي.'

  return { priorities, hypotheses, protocol, remeasure, limits, referral }
}

// ── السجلّ المحفوظ لكل طفل + المقارنة ──────────────────────────────────────────
export interface CompassRecord {
  id: string
  childId: string
  childName: string
  age: string
  appNo: string
  specialist?: string
  createdAt: string
  axes: Record<AxisKey, number>        // مجاميع المحاور (6..24)
  tasksCorrect: number
  tasksTotal: number
  // مؤشّرات الملاحظة التي تتحرّك أولاً
  persistenceSec?: string
  timeToClosureSec?: string
  helpRequests?: string
  helpSpecific?: 'yes' | 'no' | ''
  firstClosureSign?: string
  finished?: '' | 'yes' | 'no' | 'partly'
}

export interface AxisDelta {
  axis: AxisKey
  prev: number
  curr: number
  delta: number
  prevCat: AxisCategory
  currCat: AxisCategory
}

export interface IndicatorDelta {
  label: string
  prev: string
  curr: string
  trend: 'up' | 'down' | 'flat' | 'na'   // اتجاه التغيّر الفعلي
  betterWhenUp: boolean                   // هل الارتفاع هو التحسّن؟
}

export interface CompassComparison {
  axes: AxisDelta[]
  indicators: IndicatorDelta[]
  daysBetween: number
}

function numTrend(prev?: string, curr?: string): { trend: IndicatorDelta['trend'] } {
  const p = prev !== undefined && prev !== '' ? Number(prev) : NaN
  const c = curr !== undefined && curr !== '' ? Number(curr) : NaN
  if (!Number.isFinite(p) || !Number.isFinite(c)) return { trend: 'na' }
  if (c > p) return { trend: 'up' }
  if (c < p) return { trend: 'down' }
  return { trend: 'flat' }
}

export function compareCompass(prev: CompassRecord, curr: CompassRecord): CompassComparison {
  const axes: AxisDelta[] = (['A', 'B', 'C', 'D'] as AxisKey[]).map(k => ({
    axis: k,
    prev: prev.axes[k],
    curr: curr.axes[k],
    delta: curr.axes[k] - prev.axes[k],
    prevCat: categoryForSum(prev.axes[k]),
    currCat: categoryForSum(curr.axes[k]),
  }))

  const indicators: IndicatorDelta[] = [
    { label: 'زمن الاستمرار قبل التوقّف (ث)', prev: prev.persistenceSec || '', curr: curr.persistenceSec || '', ...numTrend(prev.persistenceSec, curr.persistenceSec), betterWhenUp: true },
    { label: 'الزمن من الصعوبة إلى الانغلاق (ث)', prev: prev.timeToClosureSec || '', curr: curr.timeToClosureSec || '', ...numTrend(prev.timeToClosureSec, curr.timeToClosureSec), betterWhenUp: true },
    {
      label: 'طلب المساعدة بصيغة محدّدة',
      prev: prev.helpSpecific === 'yes' ? 'نعم' : prev.helpSpecific === 'no' ? 'لا' : '—',
      curr: curr.helpSpecific === 'yes' ? 'نعم' : curr.helpSpecific === 'no' ? 'لا' : '—',
      trend: (!prev.helpSpecific || !curr.helpSpecific) ? 'na'
        : prev.helpSpecific === curr.helpSpecific ? 'flat'
        : (curr.helpSpecific === 'yes' ? 'up' : 'down'),
      betterWhenUp: true,
    },
  ]

  const daysBetween = Math.max(0, Math.round((new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()) / 86400000))
  return { axes, indicators, daysBetween }
}
