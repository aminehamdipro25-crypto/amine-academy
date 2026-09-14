// Deliberately its own module with no data imports.
//
// Both the parent portal and the report form are client components that need to
// describe an indicator's direction of travel. Importing this from apa-record.ts
// would pull apa-plan-data.ts (the full authored plans) into those browser
// bundles for the sake of three comparisons.
import type { ApaReportSummary } from './types'

export type ApaTrend = 'insufficient' | 'up' | 'down' | 'stable'

/**
 * Describe an indicator's movement across a reporting period.
 *
 * A single rating is 'insufficient', never 'stable' — one data point is not a
 * flat line, and a parent's report must not imply that it is.
 */
export function indicatorTrend(ind: ApaReportSummary['indicators'][number]): ApaTrend {
  if (ind.count < 2) return 'insufficient'
  if (ind.last > ind.first) return 'up'
  if (ind.last < ind.first) return 'down'
  return 'stable'
}
