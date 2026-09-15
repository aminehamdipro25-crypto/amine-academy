// One calendar-exact age calculation for the whole platform.
//
// Age was being derived in three places with a `/ 365.25` division, which
// drifts by a day around a birthday. That matters here more than it looks:
// the learning-difficulties scale is withheld below 8, and the DSM-5 ADHD
// symptom threshold drops from 6 to 5 at 17. A child reported a year older or
// younger than they are crosses those lines wrongly, so the arithmetic is done
// on calendar fields rather than on elapsed milliseconds.
import type { AgeGroup } from './types'

/**
 * Completed years between `birthDate` (YYYY-MM-DD) and `on` (default: today).
 * Returns null for an unparseable or future date rather than a misleading 0.
 */
export function ageYearsFromBirthDate(birthDate: string, on: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate ?? ''))) return null
  const [y, m, d] = birthDate.split('-').map(Number)
  if (!y || !m || !d) return null

  // Reject dates the calendar does not have (2025-02-30, 2025-13-01): Date would
  // silently roll them forward into a different, wrong day.
  const born = new Date(Date.UTC(y, m - 1, d))
  if (born.getUTCFullYear() !== y || born.getUTCMonth() !== m - 1 || born.getUTCDate() !== d) return null

  const ry = on.getFullYear()
  const rm = on.getMonth() + 1
  const rd = on.getDate()

  let years = ry - y
  // The birthday has not come round yet this year.
  if (rm < m || (rm === m && rd < d)) years--

  return years < 0 ? null : years
}

/** The catalogue's own age bands, from a birth date. Falls back to the youngest. */
export function ageGroupFromBirthDate(birthDate: string, on: Date = new Date()): AgeGroup {
  return ageGroupFromYears(ageYearsFromBirthDate(birthDate, on))
}

/** The catalogue's own age bands, from completed years. */
export function ageGroupFromYears(years: number | null): AgeGroup {
  if (years === null) return '5-11'
  if (years <= 11) return '5-11'
  if (years <= 17) return '12-17'
  return '18-22'
}
