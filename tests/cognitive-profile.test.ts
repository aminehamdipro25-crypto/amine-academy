// The cognitive battery measures ABILITY: higher is better. Every rating scale
// in this toolkit is the opposite. So the single most dangerous thing this
// module can do is be read with the wrong direction — telling a specialist that
// a child who improved has deteriorated, or the reverse.
//
// The rest is about refusing to become an IQ test: no composite, no percentile,
// no severity, and nothing called a strength unless the gap is real.
import { describe, it, expect } from 'vitest'
import {
  MIN_DOMAINS_FOR_PROFILE,
  RELATIVE_GAP,
  buildCognitiveProfile,
  profileToAssessment,
  taskScore,
} from '../lib/cognitive-profile'
import { compareAssessments, higherIsBetter } from '../lib/assessment-compare'
import type { ExerciseResult } from '../lib/types'

function task(
  exerciseType: string,
  accuracy: number,
  metadata: Record<string, unknown> = {},
  completedAt = '2026-09-17T10:00:00.000Z',
): ExerciseResult {
  return {
    exerciseType,
    exerciseLabelAr: exerciseType,
    score: accuracy,
    accuracy,
    duration: 120,
    errors: 0,
    metadata,
    completedAt,
  }
}

/** A battery a 10-year-old can be scored on across every task. */
const AGE = 10
const FULL = [
  task('span-extension', 80, { seqLen: 5, rounds: 6 }),
  task('auditory-memory', 70, { seqLen: 4, rounds: 6 }),
  task('span-backward', 60, { seqLen: 3, rounds: 6 }),
  task('visual-search', 90, { avgFindTimeMs: 2400, gridSize: 25 }),
  task('sustained-attention', 95, { hits: 19, totalTargets: 20, falseAlarms: 0, totalStimuli: 80 }),
]

describe('direction — a RISE on this battery is improvement', () => {
  it('the comparison layer knows this scale is ability-scored', () => {
    expect(higherIsBetter('cognitive')).toBe(true)
    for (const symptomScale of ['adhd', 'autism', 'psc17', 'learning-difficulties', 'attention-domains']) {
      expect(higherIsBetter(symptomScale), symptomScale).toBe(false)
    }
  })

  it('reads a higher span as improvement, not deterioration', () => {
    const c = compareAssessments(
      { type: 'cognitive', severity: 'none', completedAt: '2026-09-17T00:00:00Z', domainScores: { 'span-extension': 80 } },
      { type: 'cognitive', severity: 'none', completedAt: '2026-07-17T00:00:00Z', domainScores: { 'span-extension': 55 } },
    )!
    expect(c.domains[0].delta).toBe(25)
    expect(c.domains[0].direction).toBe('improved')
  })

  it('reads a fall as a decline', () => {
    const c = compareAssessments(
      { type: 'cognitive', severity: 'none', completedAt: '2026-09-17T00:00:00Z', domainScores: { 'span-extension': 50 } },
      { type: 'cognitive', severity: 'none', completedAt: '2026-07-17T00:00:00Z', domainScores: { 'span-extension': 80 } },
    )!
    expect(c.domains[0].direction).toBe('worsened')
  })

  it('the identical numbers on a symptom scale read the opposite way', () => {
    // The guard against a future edit that drops the ability list.
    const rise = { completedAt: '2026-09-17T00:00:00Z', severity: 'mild', domainScores: { attention: 80 } }
    const base = { completedAt: '2026-07-17T00:00:00Z', severity: 'mild', domainScores: { attention: 55 } }
    expect(compareAssessments({ ...rise, type: 'cognitive' }, { ...base, type: 'cognitive' })!.domains[0].direction).toBe('improved')
    expect(compareAssessments({ ...rise, type: 'adhd' }, { ...base, type: 'adhd' })!.domains[0].direction).toBe('worsened')
  })

  it('surfaces the DECLINED domain first on an ability scale', () => {
    const c = compareAssessments(
      { type: 'cognitive', severity: 'none', completedAt: '2026-09-17T00:00:00Z', domainScores: { 'span-extension': 80, 'visual-search': 40 } },
      { type: 'cognitive', severity: 'none', completedAt: '2026-07-17T00:00:00Z', domainScores: { 'span-extension': 55, 'visual-search': 85 } },
    )!
    expect(c.movedDomains[0].key).toBe('visual-search')
    expect(c.movedDomains[0].direction).toBe('worsened')
  })
})

describe('sustained attention is not scored on hit rate alone', () => {
  // cognitive-tasks.ts refuses to PRINT that task's raw accuracy because hits
  // over targets ignores false alarms entirely. Scoring it that way would be
  // the same mistake one layer down.
  it('penalises pressing on non-targets', () => {
    const clean = task('sustained-attention', 100, { hits: 20, totalTargets: 20, falseAlarms: 0, totalStimuli: 80 })
    const impulsive = task('sustained-attention', 100, { hits: 20, totalTargets: 20, falseAlarms: 18, totalStimuli: 80 })
    expect(taskScore(clean)).toBe(100)
    expect(taskScore(impulsive)).toBeLessThan(80)
  })

  it('falls back to accuracy when the run reports no target counts', () => {
    expect(taskScore(task('sustained-attention', 64, {}))).toBe(64)
  })

  it('uses plain accuracy for the other tasks', () => {
    expect(taskScore(task('span-extension', 73, { seqLen: 4 }))).toBe(73)
  })

  it('clamps nonsense rather than propagating it', () => {
    expect(taskScore(task('span-extension', Number.NaN))).toBe(0)
    expect(taskScore(task('span-extension', 140))).toBe(100)
  })
})

describe('refusing to over-read the profile', () => {
  it('needs enough usable tasks before comparing domains at all', () => {
    const thin = buildCognitiveProfile(FULL.slice(0, MIN_DOMAINS_FOR_PROFILE - 1), AGE)
    expect(thin.insufficient).toBe(true)
    expect(thin.strongest).toBeNull()
    expect(thin.weakest).toBeNull()
  })

  it('calls a flat profile flat instead of inventing a strength', () => {
    const flat = buildCognitiveProfile([
      task('span-extension', 70, { seqLen: 4 }),
      task('auditory-memory', 72, { seqLen: 4 }),
      task('span-backward', 68, { seqLen: 3 }),
    ], AGE)
    expect(flat.insufficient).toBe(false)
    expect(flat.evenProfile).toBe(true)
    expect(flat.strongest).toBeNull()
  })

  it('names a relative strength only once the gap is real', () => {
    const spread = buildCognitiveProfile([
      task('span-extension', 90, { seqLen: 6 }),
      task('auditory-memory', 70, { seqLen: 4 }),
      task('span-backward', 90 - RELATIVE_GAP - 10, { seqLen: 2 }),
    ], AGE)
    expect(spread.evenProfile).toBe(false)
    expect(spread.strongest!.key).toBe('span-extension')
    expect(spread.weakest!.key).toBe('span-backward')
  })

  it('excludes an uninterpretable task from the comparison', () => {
    // Stroop needs reading fluency; below its minimum age the result is not a
    // finding, and must not become the child's "relative weakness".
    const young = buildCognitiveProfile([...FULL, task('stroop-test', 20, {})], 6)
    expect(young.domains.some(d => d.key === 'stroop-test')).toBe(true)
    expect(young.usable.some(d => d.key === 'stroop-test')).toBe(false)
    expect(young.weakest?.key).not.toBe('stroop-test')
  })

  it('keeps only the latest attempt when a task is re-run', () => {
    const p = buildCognitiveProfile([
      task('span-extension', 40, { seqLen: 2 }, '2026-09-17T09:00:00.000Z'),
      task('span-extension', 85, { seqLen: 6 }, '2026-09-17T11:00:00.000Z'),
      task('auditory-memory', 70, { seqLen: 4 }),
      task('span-backward', 65, { seqLen: 3 }),
    ], AGE)
    expect(p.domains.filter(d => d.key === 'span-extension')).toHaveLength(1)
    expect(p.domains.find(d => d.key === 'span-extension')!.score).toBe(85)
  })

  it('ignores exercises that are not part of the battery', () => {
    const p = buildCognitiveProfile([...FULL, task('memory-cards', 99, {})], AGE)
    expect(p.domains.some(d => d.key === 'memory-cards')).toBe(false)
  })
})

describe('the record it files is not an intelligence test', () => {
  const profile = buildCognitiveProfile(FULL, AGE)
  const record = profileToAssessment(profile, 's1')

  it('files no composite score', () => {
    expect(record.totalScore).toBe(0)
  })

  it('assigns no severity — these tasks measure performance', () => {
    expect(record.severity).toBe('none')
  })

  it('carries one entry per usable domain and no others', () => {
    expect(Object.keys(record.domainScores).sort()).toEqual(profile.usable.map(d => d.key).sort())
  })

  it('states plainly what it is not', () => {
    const notes = record.recommendations.join(' ')
    expect(notes).toContain('ليست اختبار ذكاء')
    expect(notes).toContain('لا مئين')
    expect(notes).toMatch(/أهلية|تصنيف مدرسي/)
  })

  it('says "relative" means against this child, not against peers', () => {
    const spread = buildCognitiveProfile([
      task('span-extension', 92, { seqLen: 6 }),
      task('auditory-memory', 70, { seqLen: 4 }),
      task('span-backward', 55, { seqLen: 2 }),
    ], AGE)
    expect(profileToAssessment(spread, 's1').recommendations.join(' ')).toContain('لا بأقرانه')
  })

  it('exposes no composite or percentile field to build one from', () => {
    // Scanning the source for the WORD is the wrong test — the module says
    // "no percentile" in its own disclaimer. What matters is that nothing in
    // the shape invites a single headline number.
    const keys = Object.keys(profile)
    expect(keys).not.toContain('total')
    expect(keys).not.toContain('composite')
    expect(keys).not.toContain('percentile')
    expect(keys).not.toContain('iq')
    for (const d of profile.domains) {
      expect(Object.keys(d)).not.toContain('percentile')
    }
  })
})
