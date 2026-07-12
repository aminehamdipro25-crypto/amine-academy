import { describe, it, expect } from 'vitest'
import { buildRecommendedPlan, severityFromScore } from '../lib/assessment-plan'

describe('severityFromScore', () => {
  it('maps totals to tiers at the boundaries', () => {
    expect(severityFromScore(0)).toBe('none')
    expect(severityFromScore(14)).toBe('none')
    expect(severityFromScore(15)).toBe('mild')
    expect(severityFromScore(29)).toBe('mild')
    expect(severityFromScore(30)).toBe('moderate')
    expect(severityFromScore(44)).toBe('moderate')
    expect(severityFromScore(45)).toBe('severe')
    expect(severityFromScore(60)).toBe('severe')
  })
})

describe('buildRecommendedPlan', () => {
  it('gives no active plan when scores are within normal range', () => {
    const plan = buildRecommendedPlan({ sustained: 2, selective: 1, executive: 3, inhibition: 2 }, 8)
    expect(plan.severity).toBe('none')
    expect(plan.sessionsPerWeek).toBe(0)
    expect(plan.totalSessions).toBe(0)
    expect(plan.targetDomains).toHaveLength(0)
  })

  it('computes cadence and total sessions for a moderate profile', () => {
    const plan = buildRecommendedPlan({ sustained: 10, selective: 8, executive: 6, inhibition: 6 }, 30)
    expect(plan.severity).toBe('moderate')
    expect(plan.sessionsPerWeek).toBe(2)
    expect(plan.programWeeks).toBe(8)
    expect(plan.totalSessions).toBe(16)
    expect(plan.reassessWeeks).toBe(4)
  })

  it('ranks target domains by score, highest first, and flags priority', () => {
    const plan = buildRecommendedPlan({ sustained: 12, selective: 5, executive: 9, inhibition: 3 }, 29)
    // inhibition (3) is below the 5 threshold → excluded
    expect(plan.targetDomains.map(d => d.key)).toEqual(['sustained', 'executive', 'selective'])
    expect(plan.targetDomains[0].priority).toBe('high')   // 12 >= 8
    expect(plan.targetDomains[1].priority).toBe('high')   // 9  >= 8
    expect(plan.targetDomains[2].priority).toBe('medium') // 5  < 8
  })

  it('dedupes focus exercises drawn from targeted domains', () => {
    const plan = buildRecommendedPlan({ sustained: 10, selective: 10, executive: 0, inhibition: 0 }, 30)
    expect(plan.focusExercises.length).toBe(new Set(plan.focusExercises).size)
    expect(plan.focusExercises.length).toBeGreaterThan(0)
  })

  it('treats missing domains as zero', () => {
    const plan = buildRecommendedPlan({ sustained: 15 }, 15)
    expect(plan.severity).toBe('mild')
    expect(plan.targetDomains.map(d => d.key)).toEqual(['sustained'])
  })
})
