// Comparing a scale against the last time the same scale was run.
//
// The platform's stated purpose is documented change over time, and the toolkit
// already stores every result against the child — but it showed the previous
// runs only as a row of date + severity badge. Whether a domain moved, and by
// how much, the specialist had to hold in their head.
//
// DIRECTION. Every scale in this toolkit (adhd, autism, learning-difficulties,
// attention-domains, psc17) reports each domain as a 0-100 percentage of the
// SYMPTOM maximum: `Math.round((sum / (items.length * 3)) * 100)`, with severity
// rising as the number rises. So a FALL is improvement, in all of them. This is
// checked by a test that reads the scale components, because a future scale
// scored the other way round would silently invert every reading here.
//
// WHAT THIS DELIBERATELY DOES NOT SAY. It reports a measured difference between
// two ratings. It does not attribute that difference to the intervention, and
// it does not call a small movement a change:
//
//   • Below NOISE_THRESHOLD is reported as "unchanged". A domain is built from
//     a handful of 0-3 items, so a single item moving one step is already worth
//     3-7 points. Calling a 2-point drop "improvement" would be reading noise.
//   • Two runs closer together than MIN_INTERVAL_DAYS are flagged `tooSoon`.
//     A re-screen days later mostly reflects the week the family had.
//   • Both of these are ratings by an observer, not instrument readings — the
//     surfaces that show this must keep saying so.

export const NOISE_THRESHOLD = 5
export const MIN_INTERVAL_DAYS = 14

// Scales whose domain scores are ABILITY rather than symptoms — higher is
// better, so a RISE is improvement. Everything else in this toolkit is scored
// symptom-high (see the test that reads the scale components), and reading an
// ability scale that way would report a child who improved as one who
// deteriorated. The cognitive battery is the only member today; a new ability
// scale that forgets to join it inverts every reading it produces silently.
const ABILITY_SCALES = new Set<string>(['cognitive'])

export function higherIsBetter(type: string): boolean {
  return ABILITY_SCALES.has(type)
}

export type ChangeDirection = 'improved' | 'worsened' | 'unchanged'

export interface DomainChange {
  key: string
  previous: number
  current: number
  /** current − previous. Positive means MORE symptoms. */
  delta: number
  direction: ChangeDirection
}

export interface AssessmentComparison {
  type: string
  previousDate: string
  currentDate: string
  daysApart: number
  /** The interval is too short for a re-measure to carry much meaning. */
  tooSoon: boolean
  severityBefore: string
  severityAfter: string
  severityDirection: ChangeDirection
  domains: DomainChange[]
  /** Domains that moved beyond noise, worst movement first. */
  movedDomains: DomainChange[]
}

const SEVERITY_RANK: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 }

function directionOf(delta: number, threshold: number, abilityScale: boolean): ChangeDirection {
  if (Math.abs(delta) < threshold) return 'unchanged'
  const rose = delta > 0
  return rose === abilityScale ? 'improved' : 'worsened'
}

interface ComparableAssessment {
  type: string
  severity: string
  completedAt: string
  domainScores: Record<string, number>
}

/** Whole days between two timestamps, never negative. */
function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier).getTime()
  const b = new Date(later).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/**
 * The most recent earlier run of the same scale, or null.
 *
 * `history` may hold anything the child has ever had. Only the same scale is a
 * comparison; a different one measures different things on a different range.
 */
export function findPreviousOfSameScale<T extends ComparableAssessment>(
  current: T,
  history: T[],
): T | null {
  const currentTime = new Date(current.completedAt).getTime()
  if (Number.isNaN(currentTime)) return null

  const earlier = history.filter(h => {
    if (h === current) return false
    if (h.type !== current.type) return false
    const t = new Date(h.completedAt).getTime()
    return !Number.isNaN(t) && t < currentTime
  })
  if (earlier.length === 0) return null

  return earlier.reduce((best, h) =>
    new Date(h.completedAt).getTime() > new Date(best.completedAt).getTime() ? h : best)
}

/**
 * Compare two runs of the same scale. Returns null when they are not the same
 * scale or share no domain — there is nothing honest to say in either case.
 */
export function compareAssessments(
  current: ComparableAssessment,
  previous: ComparableAssessment,
  threshold: number = NOISE_THRESHOLD,
): AssessmentComparison | null {
  if (current.type !== previous.type) return null

  const keys = Object.keys(current.domainScores ?? {})
    .filter(k => typeof previous.domainScores?.[k] === 'number')
  if (keys.length === 0) return null

  const ability = higherIsBetter(current.type)

  const domains: DomainChange[] = keys.map(key => {
    const prev = Math.round(previous.domainScores[key])
    const cur = Math.round(current.domainScores[key])
    const delta = cur - prev
    return { key, previous: prev, current: cur, delta, direction: directionOf(delta, threshold, ability) }
  })

  const before = SEVERITY_RANK[previous.severity] ?? 0
  const after = SEVERITY_RANK[current.severity] ?? 0

  const daysApart = daysBetween(previous.completedAt, current.completedAt)

  return {
    type: current.type,
    previousDate: previous.completedAt,
    currentDate: current.completedAt,
    daysApart,
    tooSoon: daysApart < MIN_INTERVAL_DAYS,
    severityBefore: previous.severity,
    severityAfter: current.severity,
    severityDirection: after === before ? 'unchanged' : after < before ? 'improved' : 'worsened',
    domains,
    // Worsening first: the thing a specialist must not miss is the domain that
    // went the wrong way, not the one that went right. Which end of the sort
    // that is depends on the scale's direction.
    movedDomains: domains
      .filter(d => d.direction !== 'unchanged')
      .sort((a, b) => (ability ? a.delta - b.delta : b.delta - a.delta)),
  }
}

/**
 * One honest sentence for the comparison, or null when there is nothing to say.
 * Deliberately describes a measurement, never an effect.
 */
export function summariseComparison(c: AssessmentComparison, lang: 'ar' | 'en' | 'fr' = 'ar'): string {
  const worsened = c.movedDomains.filter(d => d.direction === 'worsened').length
  const improved = c.movedDomains.filter(d => d.direction === 'improved').length

  if (lang === 'en') {
    if (c.movedDomains.length === 0) return `No domain moved beyond rating noise over ${c.daysApart} days.`
    const parts: string[] = []
    // Direction words, not "lower"/"higher": on an ability scale a rise IS the
    // improvement, so describing the movement by its sign would read backwards.
    if (improved) parts.push(`${improved} domain(s) improved`)
    if (worsened) parts.push(`${worsened} domain(s) declined`)
    return `Over ${c.daysApart} days: ${parts.join(', ')}. A recorded difference between two ratings, not a measured treatment effect.`
  }
  if (lang === 'fr') {
    if (c.movedDomains.length === 0) return `Aucun domaine n'a bougé au-delà du bruit de cotation sur ${c.daysApart} jours.`
    const parts: string[] = []
    if (improved) parts.push(`${improved} domaine(s) en progrès`)
    if (worsened) parts.push(`${worsened} domaine(s) en recul`)
    return `Sur ${c.daysApart} jours : ${parts.join(', ')}. Une différence entre deux cotations, pas un effet mesuré.`
  }

  if (c.movedDomains.length === 0) return `لم يتحرّك أي مجال بما يتجاوز تذبذب التقدير خلال ${c.daysApart} يوماً.`
  const parts: string[] = []
  if (improved) parts.push(`${improved} مجال تحسّن`)
  if (worsened) parts.push(`${worsened} مجال تراجع`)
  return `خلال ${c.daysApart} يوماً: ${parts.join('، ')}. فارق مُسجَّل بين تقديرين، وليس أثراً علاجياً مقيساً.`
}
