// Cognitive performance battery for the specialist toolkit.
//
// WHY THIS EXISTS: the toolkit's three scales are all RATING scales — someone's
// impression of the child. Memory in particular was only ever represented as a
// 4-item subjective checklist inside the learning-difficulties scale. This
// module turns the platform's existing performance tasks into actual
// measurement, so a report handed to a parent carries observed performance
// (span reached, omission/commission errors) and not only opinion.
//
// These are established experimental paradigms (digit/sequence span, n-back,
// CPT-style sustained attention, visual search, Stroop). They are NOT normed
// against an Arabic population, so we report the child's OBSERVED numbers and
// never convert them into percentiles or an IQ-like score.

export interface CognitiveTaskDef {
  /** Must equal the ExerciseResult.exerciseType the task emits. */
  id: string
  labelAr: string
  /** The cognitive domain this task actually measures. */
  domainAr: string
  /** Below this age the task's result is not interpretable. */
  minAge: number
  ageNote?: string
}

export const COGNITIVE_TASKS: CognitiveTaskDef[] = [
  { id: 'span-extension',      labelAr: 'امتداد الذاكرة',   domainAr: 'مدى الذاكرة العاملة',        minAge: 5 },
  { id: 'auditory-memory',     labelAr: 'الذاكرة السمعية',  domainAr: 'الذاكرة السمعية قصيرة المدى', minAge: 5 },
  { id: 'n-back',              labelAr: 'ذاكرة N-Back',     domainAr: 'تحديث الذاكرة العاملة',      minAge: 7,
    ageNote: 'ابدأ بمستوى 1؛ مستوى 2 يفوق قدرة أغلب الأطفال دون سن 9' },
  { id: 'sustained-attention', labelAr: 'الانتباه المستمر', domainAr: 'الانتباه المستمر (نمط CPT)',  minAge: 5 },
  { id: 'visual-search',       labelAr: 'البحث البصري',     domainAr: 'الانتباه الانتقائي',          minAge: 5 },
  { id: 'stroop-test',         labelAr: 'اختبار ستروب',     domainAr: 'الكبح التنفيذي',              minAge: 8,
    ageNote: 'يعتمد على طلاقة القراءة — نتيجته غير موثوقة قبل إتقان القراءة' },
]

export function taskDef(exerciseType: string): CognitiveTaskDef | undefined {
  return COGNITIVE_TASKS.find(t => t.id === exerciseType)
}

export interface TaskReadout {
  labelAr: string
  domainAr: string
  /** The single clinically meaningful number for this task. */
  headline: string
  /** Supporting observed metrics. */
  details: string[]
  /** Why this result may not be interpretable (age, incomplete run). */
  caution?: string
}

function num(meta: Record<string, unknown>, key: string): number | undefined {
  const v = meta?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/**
 * Turn a raw ExerciseResult into an honest, report-ready readout.
 * Reports what was OBSERVED — never a percentile or a diagnosis.
 */
export function readTask(
  exerciseType: string,
  metadata: Record<string, unknown>,
  accuracy: number,
  childAge?: number,
): TaskReadout {
  const def = taskDef(exerciseType)
  const labelAr = def?.labelAr ?? exerciseType
  const domainAr = def?.domainAr ?? ''
  const meta = metadata ?? {}

  let caution: string | undefined
  if (def && typeof childAge === 'number' && childAge < def.minAge) {
    caution = `عمر الطفل (${childAge}) دون الحد الأدنى لتفسير هذه المهمة (${def.minAge}) — النتيجة غير حاسمة`
  } else if (def?.ageNote && typeof childAge === 'number' && childAge < def.minAge + 2) {
    caution = def.ageNote
  }

  const details: string[] = []
  let headline = `الدقة: ${accuracy}%`

  switch (exerciseType) {
    case 'span-extension':
    case 'auditory-memory': {
      const span = num(meta, 'seqLen')
      if (span !== undefined) headline = `أطول تسلسل صحيح: ${span} عناصر`
      const rounds = num(meta, 'rounds')
      if (rounds !== undefined) details.push(`عدد الجولات: ${rounds}`)
      details.push(`الدقة: ${accuracy}%`)
      if (meta.reverse === true) details.push('بترتيب عكسي (أصعب — يقيس المعالجة لا الاستظهار فقط)')
      break
    }
    case 'n-back': {
      const n = num(meta, 'n')
      if (n !== undefined) headline = `مستوى ${n}-Back · الدقة ${accuracy}%`
      const correct = num(meta, 'correct')
      const wrong = num(meta, 'wrong')
      const trials = num(meta, 'totalTrials')
      if (correct !== undefined && trials !== undefined) details.push(`إصابات صحيحة: ${correct} من ${trials}`)
      if (wrong !== undefined) details.push(`استجابات خاطئة: ${wrong}`)
      break
    }
    case 'sustained-attention': {
      // CPT signal-detection profile — the two error types mean different things.
      const misses = num(meta, 'misses')
      const fa = num(meta, 'falseAlarms')
      const hits = num(meta, 'hits')
      const targets = num(meta, 'totalTargets')
      if (hits !== undefined && targets !== undefined) headline = `أهداف مُلتقطة: ${hits} من ${targets}`
      if (misses !== undefined) details.push(`أخطاء إغفال (لم يستجب لهدف): ${misses} — مؤشر تشتت الانتباه`)
      if (fa !== undefined) details.push(`إنذارات كاذبة (استجاب لغير هدف): ${fa} — مؤشر اندفاعية`)
      details.push(`الدقة: ${accuracy}%`)
      break
    }
    case 'visual-search': {
      const t = num(meta, 'avgFindTimeMs')
      if (t !== undefined) headline = `متوسط زمن العثور: ${(t / 1000).toFixed(1)} ثانية`
      const grid = num(meta, 'gridSize')
      if (grid !== undefined) details.push(`حجم الشبكة: ${grid}`)
      details.push(`الدقة: ${accuracy}%`)
      break
    }
    default:
      details.push(`الدقة: ${accuracy}%`)
  }

  return { labelAr, domainAr, headline, details, caution }
}

/**
 * A conservative, non-diagnostic summary line for the parent-facing report.
 * Deliberately describes performance rather than labelling the child.
 */
export function batterySummary(readouts: TaskReadout[]): string {
  if (readouts.length === 0) return ''
  const usable = readouts.filter(r => !r.caution)
  if (usable.length === 0) {
    return 'أُجريت مهام الأداء لكن نتائجها غير حاسمة في هذا العمر — تُعاد لاحقاً للمقارنة.'
  }
  return `أُجريت ${readouts.length} مهمة أداء. الأرقام أعلاه تصف ما لاحظناه أثناء الجلسة، وتصلح كخط أساس تُقارَن به الجلسات القادمة — وليست تشخيصاً ولا مقارنة بأقران.`
}
