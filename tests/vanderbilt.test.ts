import { describe, it, expect } from 'vitest'
import {
  scoreVanderbilt, INATTENTION_IDS, HYPERACTIVITY_IDS, OPPOSITIONAL_IDS,
} from '../lib/vanderbilt-data'
import { buildPlanFromVanderbilt } from '../lib/assessment-plan'

// Helper: mark the first `n` ids in `ids` as "Often" (rating 2 = present).
function present(ids: number[], n: number, rating = 2): Record<number, number> {
  const a: Record<number, number> = {}
  ids.slice(0, n).forEach(id => { a[id] = rating })
  return a
}
const impaired = { school: 4 }        // one area rated ≥4 → functional impairment
const noImpair = { school: 3 }        // all average → no impairment

describe('scoreVanderbilt — official screen rule', () => {
  it('needs BOTH ≥6 symptoms AND impairment to screen positive', () => {
    // 6 inattention symptoms but no reported impairment → subthreshold, not positive
    const noImp = scoreVanderbilt(present(INATTENTION_IDS, 6), noImpair)
    expect(noImp.inattentionCount).toBe(6)
    expect(noImp.inattentivePositive).toBe(false)
    expect(noImp.subtype).toBe('subthreshold')

    // Same symptoms WITH impairment → positive, inattentive subtype
    const withImp = scoreVanderbilt(present(INATTENTION_IDS, 6), impaired)
    expect(withImp.inattentivePositive).toBe(true)
    expect(withImp.subtype).toBe('inattentive')
    expect(withImp.hasImpairment).toBe(true)
  })

  it('is negative below the 6-symptom threshold', () => {
    const s = scoreVanderbilt(present(INATTENTION_IDS, 5), impaired)
    expect(s.inattentivePositive).toBe(false)
    expect(s.subtype).toBe('none')
    expect(s.severity).toBe('none')
  })

  it('flags combined subtype and severe when both domains positive', () => {
    const answers = { ...present(INATTENTION_IDS, 7), ...present(HYPERACTIVITY_IDS, 7) }
    const s = scoreVanderbilt(answers, impaired)
    expect(s.inattentivePositive).toBe(true)
    expect(s.hyperactivePositive).toBe(true)
    expect(s.subtype).toBe('combined')
    expect(s.severity).toBe('severe')
  })

  it('only counts ratings of 2 or 3 as present', () => {
    const ones: Record<number, number> = {}
    INATTENTION_IDS.forEach(id => { ones[id] = 1 }) // "Occasionally" never counts
    const s = scoreVanderbilt(ones, impaired)
    expect(s.inattentionCount).toBe(0)
    expect(s.subtype).toBe('none')
  })

  it('raises an oppositional concern at ≥4 ODD symptoms with impairment', () => {
    const s = scoreVanderbilt(present(OPPOSITIONAL_IDS, 4), impaired)
    expect(s.oppositionalCount).toBe(4)
    expect(s.oppositionalConcern).toBe(true)
  })
})

describe('buildPlanFromVanderbilt', () => {
  it('produces no active plan for a negative screen', () => {
    const plan = buildPlanFromVanderbilt(scoreVanderbilt(present(INATTENTION_IDS, 2), noImpair))
    expect(plan.severity).toBe('none')
    expect(plan.sessionsPerWeek).toBe(0)
    expect(plan.targetDomains).toHaveLength(0)
  })

  it('targets the dominant domain first and sizes the program by severity', () => {
    const answers = { ...present(INATTENTION_IDS, 8), ...present(HYPERACTIVITY_IDS, 4) }
    const plan = buildPlanFromVanderbilt(scoreVanderbilt(answers, impaired))
    expect(plan.targetDomains[0].key).toBe('inattention')
    expect(plan.targetDomains[0].priority).toBe('high')   // 8 ≥ 6
    expect(plan.targetDomains[1].key).toBe('hyperactivity')
    expect(plan.targetDomains[1].priority).toBe('medium')  // 4 < 6
    expect(plan.totalSessions).toBe(plan.sessionsPerWeek * plan.programWeeks)
    expect(plan.focusExercises.length).toBeGreaterThan(0)
  })
})
