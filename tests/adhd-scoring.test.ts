import { describe, it, expect } from 'vitest'
import { dsmThreshold, countPresent, severityFromCounts, SYMPTOM_PRESENT_MIN } from '../lib/adhd-scoring'

describe('dsmThreshold — age-dependent per DSM-5', () => {
  it('requires 6 symptoms for children', () => {
    expect(dsmThreshold(6)).toBe(6)
    expect(dsmThreshold(11)).toBe(6)
    expect(dsmThreshold(16)).toBe(6)
  })

  it('drops to 5 from age 17, as DSM-5 specifies for older adolescents and adults', () => {
    expect(dsmThreshold(17)).toBe(5)
    expect(dsmThreshold(22)).toBe(5)
  })

  it('defaults to the stricter child threshold when age is unknown', () => {
    expect(dsmThreshold(undefined)).toBe(6)
    expect(dsmThreshold(NaN)).toBe(6)
  })
})

describe('countPresent', () => {
  it('counts a symptom only when rated "often" or higher', () => {
    const answers = { a1: 0, a2: 1, a3: 2, a4: 3 } as Record<string, 0|1|2|3>
    expect(SYMPTOM_PRESENT_MIN).toBe(2)
    expect(countPresent(answers, ['a1', 'a2', 'a3', 'a4'])).toBe(2)
  })

  it('treats a missing answer as absent', () => {
    expect(countPresent({} as Record<string, 0|1|2|3>, ['a1', 'a2'])).toBe(0)
  })
})

describe('severityFromCounts', () => {
  it('is negative below threshold', () => {
    expect(severityFromCounts(3, 0, 6)).toBe('none')
  })

  it('flags a combined presentation as severe', () => {
    expect(severityFromCounts(7, 7, 6)).toBe('severe')
  })

  it('a 17-year-old with 5 symptoms meets criteria that a child would not', () => {
    // Same answers, different age: this is the whole point of the age rule.
    expect(severityFromCounts(5, 0, dsmThreshold(17))).toBe('moderate') // adult: meets
    expect(severityFromCounts(5, 0, dsmThreshold(10))).toBe('none')     // child: does not
  })

  it('escalates to severe when one domain qualifies and symptoms are many', () => {
    expect(severityFromCounts(8, 4, 6)).toBe('severe')  // 12 total
    expect(severityFromCounts(6, 2, 6)).toBe('moderate') // 8 total
  })
})
