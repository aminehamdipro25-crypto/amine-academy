import { COGNITIVE_TASKS, readTask, taskDef } from './cognitive-tasks'
import type { AssessmentResult, ExerciseResult } from './types'

// Turning a run of the performance battery into a record that survives the
// session.
//
// The battery in the toolkit already produces real measurement — span reached,
// CPT hits and false alarms, search times — and prints it. But `perfResults`
// lived only in the draft in localStorage, and the save effect filed the rating
// SCALES and nothing else. So the one part of the toolkit that measures rather
// than rates evaporated at the end of every session: no baseline, nothing in
// the child's record, nothing in the backup, nothing the family could see, and
// nothing to compare the next run against.
//
// WHAT THIS IS NOT. It is not an intelligence test and it must never be
// presented as one. There is no standardisation sample behind these tasks, so
// there is no percentile and no composite. Every number here is this child
// compared with THIS CHILD — their own strongest and weakest domain, and their
// own previous run.
//
// DIRECTION. Unlike every rating scale in this toolkit, these scores are
// ABILITY: higher is better. lib/assessment-compare.ts is told so explicitly,
// because reading them symptom-high would report a child who improved as a
// child who deteriorated.

/** Gap below which two domains are not meaningfully different for one child. */
export const RELATIVE_GAP = 12

/** Minimum usable tasks before any within-child comparison is offered. */
export const MIN_DOMAINS_FOR_PROFILE = 3

export interface CognitiveDomain {
  /** The task id, which is also the domain key in the stored record. */
  key: string
  labelAr: string
  domainAr: string
  /** 0-100, HIGHER IS BETTER. A handle for trends, not a score to report. */
  score: number
  /** The observed figure a human should read — span, hit rate, search time. */
  headline: string
  details: string[]
  /** False when age or a short run makes the result uninterpretable. */
  interpretable: boolean
  caution?: string
}

export interface CognitiveProfile {
  domains: CognitiveDomain[]
  /** Only the domains that can actually be read. */
  usable: CognitiveDomain[]
  /** This child's relatively strongest / weakest domain, or null. */
  strongest: CognitiveDomain | null
  weakest: CognitiveDomain | null
  /** True when the spread is too small to call anything a relative strength. */
  evenProfile: boolean
  /** Fewer than MIN_DOMAINS_FOR_PROFILE usable tasks. */
  insufficient: boolean
}

/**
 * The 0-100 trend handle for one task.
 *
 * `accuracy` is used wherever the task reports it as a share of correct
 * responses. Sustained attention is the exception: its `accuracy` is hits over
 * targets only, so a child who caught every target while also pressing on five
 * non-targets scores 100 — cognitive-tasks.ts refuses to print that figure for
 * exactly this reason, and so do we. Both error types are folded in instead.
 */
export function taskScore(result: ExerciseResult): number {
  const meta = result.metadata ?? {}
  const n = (k: string): number | undefined => {
    const v = meta[k]
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined
  }

  if (result.exerciseType === 'sustained-attention') {
    const hits = n('hits')
    const targets = n('totalTargets')
    const falseAlarms = n('falseAlarms')
    const stimuli = n('totalStimuli')
    if (hits === undefined || targets === undefined || targets <= 0) {
      return clamp(result.accuracy)
    }
    const hitRate = hits / targets
    const nonTargets = stimuli !== undefined ? stimuli - targets : undefined
    const faRate = falseAlarms !== undefined && nonTargets && nonTargets > 0
      ? falseAlarms / nonTargets
      : 0
    // Catching targets and not pressing on non-targets are both the task.
    return clamp(Math.round((hitRate * (1 - faRate)) * 100))
  }

  return clamp(result.accuracy)
}

function clamp(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function buildCognitiveProfile(
  results: ExerciseResult[],
  childAge?: number,
): CognitiveProfile {
  const byTask = new Map<string, ExerciseResult>()
  // The battery may be re-run; the latest attempt at a task is the one that counts.
  for (const r of results) {
    if (!taskDef(r.exerciseType)) continue
    const existing = byTask.get(r.exerciseType)
    if (!existing || r.completedAt > existing.completedAt) byTask.set(r.exerciseType, r)
  }

  const domains: CognitiveDomain[] = []
  for (const task of COGNITIVE_TASKS) {
    const result = byTask.get(task.id)
    if (!result) continue
    const readout = readTask(task.id, result.metadata, result.accuracy, childAge)
    domains.push({
      key: task.id,
      labelAr: task.labelAr,
      domainAr: task.domainAr,
      score: taskScore(result),
      headline: readout.headline,
      details: readout.details,
      interpretable: !readout.caution,
      caution: readout.caution,
    })
  }

  // A domain flagged with a caution is excluded from every comparison: an
  // uninterpretable number must not become someone's "relative weakness".
  const usable = domains.filter(d => d.interpretable)
  const insufficient = usable.length < MIN_DOMAINS_FOR_PROFILE

  let strongest: CognitiveDomain | null = null
  let weakest: CognitiveDomain | null = null
  let evenProfile = true

  if (!insufficient) {
    const sorted = [...usable].sort((a, b) => b.score - a.score)
    const top = sorted[0]
    const bottom = sorted[sorted.length - 1]
    // Only call it a relative strength when the spread is big enough to mean
    // something. A flat profile is a real and common finding, not a failure.
    if (top.score - bottom.score >= RELATIVE_GAP) {
      strongest = top
      weakest = bottom
      evenProfile = false
    }
  }

  return { domains, usable, strongest, weakest, evenProfile, insufficient }
}

/**
 * The record filed against the child. `domainScores` are ABILITY values; the
 * type 'cognitive' is what tells the comparison layer to read them that way.
 *
 * `severity` is always 'none'. These tasks measure performance — there is no
 * severity to assign, and inventing one would turn a performance number into a
 * label the child then carries.
 */
export function profileToAssessment(
  profile: CognitiveProfile,
  studentId: string,
): Pick<AssessmentResult,
  'studentId' | 'type' | 'domainScores' | 'totalScore' | 'severity' | 'recommendations'> {
  const domainScores: Record<string, number> = {}
  for (const d of profile.usable) domainScores[d.key] = d.score

  return {
    studentId,
    type: 'cognitive',
    domainScores,
    // No composite. A single number across these tasks is the thing this whole
    // module exists to avoid producing.
    totalScore: 0,
    severity: 'none',
    recommendations: buildNotes(profile),
  }
}

/** Observations, phrased as what was seen rather than what the child is. */
export function buildNotes(profile: CognitiveProfile): string[] {
  const notes: string[] = []

  if (profile.insufficient) {
    notes.push(
      `أُنجزت ${profile.usable.length} مهمة قابلة للتفسير — لا يكفي لرسم ملف معرفي. ` +
      `أعِد البطارية بمهام أكثر قبل الاعتماد على المقارنة بين المجالات.`,
    )
  } else if (profile.evenProfile) {
    notes.push('الأداء متقارب عبر المجالات المقاسة — لا مجال يبرز كقوة أو ضعف نسبي في هذه الجولة.')
  } else if (profile.strongest && profile.weakest) {
    notes.push(`أعلى أداء نسبي: ${profile.strongest.domainAr} (${profile.strongest.headline}).`)
    notes.push(`أدنى أداء نسبي: ${profile.weakest.domainAr} (${profile.weakest.headline}).`)
    notes.push('«نسبي» تعني مقارنةً ببقية مجالات هذا الطفل نفسه — لا بأقرانه.')
  }

  for (const d of profile.domains) {
    if (d.caution) notes.push(`${d.labelAr}: ${d.caution}`)
  }

  notes.push(
    'هذه مهام أداء مُلاحَظة، وليست اختبار ذكاء ولا مقياساً معيارياً: ' +
    'لا تُوجد عيّنة تقنين خلفها، فلا مئين ولا درجة كلية، ولا تصلح لقرار أهلية أو تصنيف مدرسي. ' +
    'الأداء يتأثّر بالدافعية وبالألفة بالجهاز وبتكرار المحاولة.',
  )

  return notes
}
