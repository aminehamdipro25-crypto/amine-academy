// Drift guard for the APA planner ↔ exercise-library mapping.
//
// The planner shows real protocols from lib/exercises-data.ts inside each plan
// phase. That link is by Arabic title and by phase name, so renaming either side
// would silently blank the phase card in production. These tests fail instead.
import { describe, it, expect } from 'vitest'
import { DEFAULT_EXERCISES } from '../lib/exercises-data'
import { apaPlanData, type ApaCondition } from '../lib/apa-plan-data'
import {
  APA_PHASE_EXERCISES,
  BAND_AGE_GROUPS,
  allLinkedExerciseKeys,
  buildLinkedExerciseMap,
  exerciseKeysForPhase,
} from '../lib/apa-exercise-link'

const CONDITIONS: ApaCondition[] = ['adhd', 'asd']
const catalogueTitles = new Set(DEFAULT_EXERCISES.map(e => e.titleAr))

describe('APA planner ↔ exercise library mapping', () => {
  it('every referenced exercise exists in the catalogue', () => {
    const missing = allLinkedExerciseKeys().filter(k => !catalogueTitles.has(k))
    expect(missing).toEqual([])
  })

  it('every mapped age band matches a band actually authored in the plan', () => {
    for (const cond of CONDITIONS) {
      const authored = new Set(apaPlanData[cond].groups.map(g => g.range))
      for (const range of Object.keys(APA_PHASE_EXERCISES[cond])) {
        expect(authored.has(range), `${cond} / ${range}`).toBe(true)
      }
    }
  })

  it('every mapped phase name matches a phase actually authored in that band', () => {
    for (const cond of CONDITIONS) {
      for (const range of Object.keys(APA_PHASE_EXERCISES[cond])) {
        const group = apaPlanData[cond].groups.find(g => g.range === range)!
        const authored = new Set(group.session.map(s => s.phase))
        for (const phase of Object.keys(APA_PHASE_EXERCISES[cond][range])) {
          expect(authored.has(phase), `${cond} / ${range} / ${phase}`).toBe(true)
        }
      }
    }
  })

  it('linked exercises are age-appropriate for the band they appear in', () => {
    for (const cond of CONDITIONS) {
      for (const [range, phases] of Object.entries(APA_PHASE_EXERCISES[cond])) {
        const allowed = BAND_AGE_GROUPS[range]
        expect(allowed, `no age mapping for band ${range}`).toBeDefined()
        for (const [phase, keys] of Object.entries(phases)) {
          for (const key of keys) {
            const ex = DEFAULT_EXERCISES.find(e => e.titleAr === key)!
            const overlaps = ex.ageGroups.some(g => allowed.includes(g))
            expect(overlaps, `${cond} / ${range} / ${phase} → ${key} (${ex.ageGroups.join(',')})`).toBe(true)
          }
        }
      }
    }
  })

  it('linked exercises match the condition they are offered under', () => {
    const wanted: Record<ApaCondition, string[]> = {
      adhd: ['ADHD', 'ADHD+AUTISM'],
      asd: ['AUTISM', 'ADHD+AUTISM'],
    }
    for (const cond of CONDITIONS) {
      for (const [range, phases] of Object.entries(APA_PHASE_EXERCISES[cond])) {
        for (const [phase, keys] of Object.entries(phases)) {
          for (const key of keys) {
            const ex = DEFAULT_EXERCISES.find(e => e.titleAr === key)!
            const ok = ex.diagnoses.some(d => wanted[cond].includes(d)) || ex.diagnoses.includes('OTHER')
            expect(ok, `${cond} / ${range} / ${phase} → ${key} (${ex.diagnoses.join(',')})`).toBe(true)
          }
        }
      }
    }
  })

  it('most phases carry at least one linked exercise', () => {
    let total = 0
    let linked = 0
    for (const cond of CONDITIONS) {
      for (const group of apaPlanData[cond].groups) {
        for (const s of group.session) {
          total++
          if (exerciseKeysForPhase(cond, group.range, s.phase).length > 0) linked++
        }
      }
    }
    expect(total).toBeGreaterThan(30)
    expect(linked / total).toBeGreaterThan(0.85)
  })

  it('the trimmed map carries a usable protocol for every referenced key', () => {
    const map = buildLinkedExerciseMap()
    for (const key of allLinkedExerciseKeys()) {
      const ex = map[key]
      expect(ex, key).toBeDefined()
      expect(ex.instructionsAr.length, key).toBeGreaterThan(0)
      expect(ex.psychologyObjectiveAr.length, key).toBeGreaterThan(0)
      expect(ex.durationMinutes, key).toBeGreaterThan(0)
    }
  })

  it('the trimmed map excludes catalogue entries nothing links to', () => {
    const map = buildLinkedExerciseMap()
    expect(Object.keys(map).length).toBe(allLinkedExerciseKeys().length)
    expect(Object.keys(map).length).toBeLessThan(DEFAULT_EXERCISES.length)
  })
})
