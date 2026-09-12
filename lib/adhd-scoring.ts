// DSM-5 ADHD symptom-count scoring.
//
// Extracted from ADHDScale so it can be unit-tested, and because the threshold
// is age-dependent — a detail the scale previously hard-coded.

/** A symptom counts toward the total when rated "كثيراً/دائماً" (>= 2). */
export const SYMPTOM_PRESENT_MIN = 2

/**
 * DSM-5 requires SIX of nine symptoms in a domain for children, but only FIVE
 * "for older adolescents and adults (age 17 and older)". Hard-coding six made
 * the toolkit under-detect ADHD in the 17+ range, which the platform serves
 * (its age groups run to 22).
 */
export function dsmThreshold(age?: number): 5 | 6 {
  return typeof age === 'number' && Number.isFinite(age) && age >= 17 ? 5 : 6
}

export type AdhdSeverity = 'none' | 'mild' | 'moderate' | 'severe'

export function countPresent(
  answers: Record<string, 0 | 1 | 2 | 3>,
  ids: string[],
): number {
  return ids.reduce((n, id) => n + ((answers[id] ?? 0) >= SYMPTOM_PRESENT_MIN ? 1 : 0), 0)
}

/**
 * Severity from the two DSM symptom counts (each out of 9).
 * Not a diagnosis: DSM-5 also requires symptoms across two or more settings and
 * functional impairment, neither of which this scale captures.
 */
export function severityFromCounts(
  inattention: number,
  hyperImpulsive: number,
  threshold: number,
): AdhdSeverity {
  const totalSx = inattention + hyperImpulsive
  const meetsInattentive = inattention >= threshold
  const meetsHyperactive = hyperImpulsive >= threshold
  if (meetsInattentive && meetsHyperactive) return 'severe'      // combined presentation
  if (meetsInattentive || meetsHyperactive) return totalSx >= 12 ? 'severe' : 'moderate'
  if (totalSx >= threshold) return 'mild'                        // subthreshold but notable
  return 'none'
}
