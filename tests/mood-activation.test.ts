// Behavioural activation logic.
//
// The failure that matters here is not arithmetic — it is tone. A child whose
// mood did not lift must never be told they did badly, and a floor reading must
// always reach the specialist. Both are asserted directly.
import { describe, it, expect } from 'vitest'
import {
  MOOD_FACES,
  PLEASANT_ACTIVITIES,
  activitiesForAge,
  bestActivities,
  readMoodChange,
  type MoodLevel,
} from '../lib/mood-activation'

describe('the activity menu', () => {
  it('stays short enough to choose from with low mood', () => {
    expect(PLEASANT_ACTIVITIES.length).toBeLessThanOrEqual(12)
  })

  it('is mostly movement-led — this specialist s own lane', () => {
    const movement = PLEASANT_ACTIVITIES.filter(a => a.movement).length
    expect(movement / PLEASANT_ACTIVITIES.length).toBeGreaterThan(0.5)
  })

  it('keeps every activity short — the point is to start, not to endure', () => {
    for (const a of PLEASANT_ACTIVITIES) {
      expect(a.minutes, a.id).toBeGreaterThan(0)
      expect(a.minutes, a.id).toBeLessThanOrEqual(15)
    }
  })

  it('offers something to the youngest child it claims to serve', () => {
    expect(activitiesForAge(4).length).toBeGreaterThan(0)
  })

  it('never offers an activity above the child s age', () => {
    for (const age of [4, 5, 6, 7, 10, 15]) {
      for (const a of activitiesForAge(age)) {
        expect(a.ageMin, `${a.id} at age ${age}`).toBeLessThanOrEqual(age)
      }
    }
  })

  it('puts movement first in the list', () => {
    const list = activitiesForAge(10)
    const firstStill = list.findIndex(a => !a.movement)
    const lastMovement = list.map(a => a.movement).lastIndexOf(true)
    expect(firstStill).toBeGreaterThan(lastMovement - 1)
  })

  it('falls back to a usable list for a missing or absurd age', () => {
    expect(activitiesForAge(0).length).toBeGreaterThan(0)
    expect(activitiesForAge(NaN).length).toBeGreaterThan(0)
  })

  it('has one face per level, 1 to 5', () => {
    expect(MOOD_FACES.map(f => f.level)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('readMoodChange', () => {
  it('reports a lift', () => {
    const r = readMoodChange(2, 4)
    expect(r.outcome).toBe('lifted')
    expect(r.delta).toBe(2)
    expect(r.needsAttention).toBe(false)
  })

  it('reports no change without calling it a failure', () => {
    const r = readMoodChange(3, 3)
    expect(r.outcome).toBe('unchanged')
    expect(r.delta).toBe(0)
    expect(r.childMessage).toContain('طبيعي')
    expect(r.childMessage).not.toContain('حاول')
  })

  it('never blames the child when mood drops', () => {
    const r = readMoodChange(4, 2)
    expect(r.outcome).toBe('dropped')
    expect(r.needsAttention).toBe(true)
    expect(r.childMessage).toContain('لا بأس')
    // Must point the child at a person, not at trying harder.
    expect(r.childMessage).toContain('أخبِر')
  })

  it('flags a floor reading even when mood technically improved', () => {
    // 1 → 1 is "unchanged" but the child is still at the floor.
    const r = readMoodChange(1, 1)
    expect(r.needsAttention).toBe(true)
    expect(r.specialistNote).toContain('اسأل الطفل مباشرةً')
  })

  it('does not flag an ordinary good run', () => {
    expect(readMoodChange(4, 5).needsAttention).toBe(false)
    expect(readMoodChange(3, 3).needsAttention).toBe(false)
  })

  it('never congratulates the child for feeling better', () => {
    // Rewarding improvement teaches a child to perform it, which destroys the
    // only thing this exercise measures.
    const r = readMoodChange(1, 5)
    expect(r.childMessage).not.toMatch(/أحسنت|ممتاز|رائع|مبروك/)
  })

  it('tells the specialist that one run proves nothing', () => {
    expect(readMoodChange(3, 3).specialistNote).toContain('التكرار')
  })

  it('handles every level pair without throwing', () => {
    for (let b = 1; b <= 5; b++) {
      for (let a = 1; a <= 5; a++) {
        const r = readMoodChange(b as MoodLevel, a as MoodLevel)
        expect(r.delta).toBe(a - b)
        expect(r.childMessage.length).toBeGreaterThan(0)
        expect(r.specialistNote.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('bestActivities', () => {
  it('ignores an activity tried only once — an anecdote is not a finding', () => {
    const out = bestActivities([{ activityId: 'walk', delta: 3 }])
    expect(out).toEqual([])
  })

  it('reports an activity tried twice or more', () => {
    const out = bestActivities([
      { activityId: 'walk', delta: 2 },
      { activityId: 'walk', delta: 1 },
    ])
    expect(out).toEqual([{ activityId: 'walk', runs: 2, avgDelta: 1.5 }])
  })

  it('orders by how much the activity actually lifts the child', () => {
    const out = bestActivities([
      { activityId: 'draw', delta: 0 }, { activityId: 'draw', delta: 1 },
      { activityId: 'ball', delta: 2 }, { activityId: 'ball', delta: 2 },
    ])
    expect(out.map(o => o.activityId)).toEqual(['ball', 'draw'])
  })

  it('keeps an activity that consistently lowers mood visible, not hidden', () => {
    const out = bestActivities([
      { activityId: 'call', delta: -1 },
      { activityId: 'call', delta: -2 },
    ])
    expect(out).toEqual([{ activityId: 'call', runs: 2, avgDelta: -1.5 }])
  })

  it('returns nothing for an empty history', () => {
    expect(bestActivities([])).toEqual([])
  })
})
