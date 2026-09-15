// Calendar-exact age.
//
// The cases that matter clinically are the boundaries: the learning-difficulties
// scale is withheld below 8, and the DSM-5 ADHD threshold drops at 17. A
// day-either-side error there changes which scale a child is given and which
// cut-off is applied, so the day before a birthday is tested explicitly.
import { describe, it, expect } from 'vitest'
import { ageYearsFromBirthDate, ageGroupFromBirthDate, ageGroupFromYears } from '../lib/age'

const on = (s: string) => new Date(`${s}T12:00:00`)

describe('ageYearsFromBirthDate', () => {
  it('counts completed years, not elapsed ones', () => {
    expect(ageYearsFromBirthDate('2018-03-15', on('2026-03-15'))).toBe(8) // birthday today
    expect(ageYearsFromBirthDate('2018-03-15', on('2026-03-14'))).toBe(7) // day before
    expect(ageYearsFromBirthDate('2018-03-15', on('2026-03-16'))).toBe(8) // day after
  })

  it('does not round a nearly-8-year-old up across the LD gate', () => {
    // A 365.25-based calculation drifts here; this child must still read as 7.
    expect(ageYearsFromBirthDate('2018-12-31', on('2026-12-30'))).toBe(7)
    expect(ageYearsFromBirthDate('2018-12-31', on('2026-12-31'))).toBe(8)
  })

  it('handles the DSM-5 threshold boundary at 17', () => {
    expect(ageYearsFromBirthDate('2009-06-01', on('2026-05-31'))).toBe(16)
    expect(ageYearsFromBirthDate('2009-06-01', on('2026-06-01'))).toBe(17)
  })

  it('handles a 29 February birth date in a non-leap year', () => {
    // Born on a leap day: not yet had a "birthday" on 28 Feb of a common year.
    expect(ageYearsFromBirthDate('2016-02-29', on('2026-02-28'))).toBe(9)
    expect(ageYearsFromBirthDate('2016-02-29', on('2026-03-01'))).toBe(10)
  })

  it('crosses a month boundary correctly', () => {
    expect(ageYearsFromBirthDate('2018-01-31', on('2026-01-30'))).toBe(7)
    expect(ageYearsFromBirthDate('2018-01-31', on('2026-02-01'))).toBe(8)
  })

  it('returns null rather than a misleading number for unusable input', () => {
    expect(ageYearsFromBirthDate('', on('2026-01-01'))).toBeNull()
    expect(ageYearsFromBirthDate('15/03/2018', on('2026-01-01'))).toBeNull()
    expect(ageYearsFromBirthDate('not-a-date', on('2026-01-01'))).toBeNull()
    expect(ageYearsFromBirthDate(undefined as never, on('2026-01-01'))).toBeNull()
  })

  it('rejects calendar dates that do not exist instead of rolling them forward', () => {
    // new Date(2025, 1, 30) silently becomes 2 March — that must not become an age.
    expect(ageYearsFromBirthDate('2025-02-30', on('2026-06-01'))).toBeNull()
    expect(ageYearsFromBirthDate('2025-13-01', on('2026-06-01'))).toBeNull()
    expect(ageYearsFromBirthDate('2018-04-31', on('2026-06-01'))).toBeNull()
  })

  it('returns null for a future birth date', () => {
    expect(ageYearsFromBirthDate('2030-01-01', on('2026-01-01'))).toBeNull()
  })

  it('reports a newborn as 0, not null', () => {
    expect(ageYearsFromBirthDate('2026-01-01', on('2026-06-01'))).toBe(0)
  })
})

describe('age groups', () => {
  it('maps years onto the catalogue bands', () => {
    expect(ageGroupFromYears(5)).toBe('5-11')
    expect(ageGroupFromYears(11)).toBe('5-11')
    expect(ageGroupFromYears(12)).toBe('12-17')
    expect(ageGroupFromYears(17)).toBe('12-17')
    expect(ageGroupFromYears(18)).toBe('18-22')
    expect(ageGroupFromYears(30)).toBe('18-22')
  })

  it('falls back to the youngest band when the age is unknown', () => {
    expect(ageGroupFromYears(null)).toBe('5-11')
    expect(ageGroupFromBirthDate('nonsense', on('2026-01-01'))).toBe('5-11')
  })

  it('derives the band straight from a birth date', () => {
    expect(ageGroupFromBirthDate('2018-03-15', on('2026-06-01'))).toBe('5-11')
    expect(ageGroupFromBirthDate('2012-03-15', on('2026-06-01'))).toBe('12-17')
    expect(ageGroupFromBirthDate('2005-03-15', on('2026-06-01'))).toBe('18-22')
  })

  it('moves a child up a band on the day they turn 12', () => {
    expect(ageGroupFromBirthDate('2014-07-10', on('2026-07-09'))).toBe('5-11')
    expect(ageGroupFromBirthDate('2014-07-10', on('2026-07-10'))).toBe('12-17')
  })
})
