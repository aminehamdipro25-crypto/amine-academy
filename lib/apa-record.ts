// Filing and rolling up Adapted Physical Activity (APA) session records.
//
// The APA planner prescribes per-band indicators to track. Before this, nothing
// recorded them — a 60-minute physical session produced no data at all, so the
// parent's report could say nothing about it. These helpers turn filed records
// into the period summary the report carries.
//
// Everything here is pure so it can be unit-tested without Redis: the API route
// sanitizes with `sanitizeApaRecord`, the report builder aggregates with
// `summarizeApaRecords`.
import { apaPlanData, type ApaCondition } from './apa-plan-data'
import type { ApaIndicatorRating, ApaReportSummary, ApaSessionRecord } from './types'

const MAX_INDICATORS = 20
const MAX_PHASES = 20
const MAX_MINUTES = 300

function clamp5(n: unknown): 1 | 2 | 3 | 4 | 5 {
  const v = Math.min(5, Math.max(1, Math.round(Number(n) || 3)))
  return v as 1 | 2 | 3 | 4 | 5
}

/** YYYY-MM-DD, or today when the input is not a usable calendar date. */
export function normalizeDate(input: unknown): string {
  const s = String(input ?? '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))) return s
  return new Date().toISOString().slice(0, 10)
}

/**
 * The band actually authored in the plan for this condition, or null. Used to
 * reject a record naming a band that does not exist rather than filing data
 * that can never be rendered against a plan.
 */
export function resolveBand(condition: ApaCondition, band: string) {
  return apaPlanData[condition].groups.find(g => g.range === band) ?? null
}

/**
 * Build a storable record from untrusted request input.
 *
 * Returns null when the record could not be anchored to a real plan — an
 * unknown condition or band. Phase names and indicator labels are intersected
 * with the plan so a client cannot inject arbitrary text into a parent's report.
 */
export function sanitizeApaRecord(
  body: unknown,
  studentId: string,
): Omit<ApaSessionRecord, 'id' | 'createdAt'> | null {
  const b = (body ?? {}) as Record<string, unknown>

  const condition: ApaCondition = b.condition === 'asd' ? 'asd' : b.condition === 'adhd' ? 'adhd' : 'adhd'
  if (b.condition !== 'adhd' && b.condition !== 'asd') return null

  const band = String(b.band ?? '').slice(0, 40)
  const group = resolveBand(condition, band)
  if (!group) return null

  const planPhases = new Set(group.session.map(s => s.phase))
  const rawPhases = Array.isArray(b.phasesCompleted) ? b.phasesCompleted : []
  const phasesCompleted = [...new Set(
    rawPhases.slice(0, MAX_PHASES).map(p => String(p ?? '')).filter(p => planPhases.has(p)),
  )]

  const planIndicators = new Set(group.indicators)
  const rawIndicators = Array.isArray(b.indicators) ? b.indicators : []
  const seen = new Set<string>()
  const indicators: ApaIndicatorRating[] = []
  for (const raw of rawIndicators.slice(0, MAX_INDICATORS)) {
    const r = (raw ?? {}) as Record<string, unknown>
    const label = String(r.label ?? '')
    if (!planIndicators.has(label) || seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: clamp5(r.score) })
  }

  return {
    studentId,
    condition,
    band,
    date: normalizeDate(b.date),
    phasesCompleted,
    phasesTotal: group.session.length,
    indicators,
    minutes: Math.min(MAX_MINUTES, Math.max(0, Math.round(Number(b.minutes) || 0))),
    notes: String(b.notes ?? '').slice(0, 2000),
  }
}

/**
 * Roll a child's records for one period into the summary the report carries.
 *
 * Records are sorted by date so `first`/`last` describe a real direction of
 * travel. An indicator rated in only one session reports first === last, and the
 * report is expected to present that as "no trend yet" rather than "no change".
 * Returns null for an empty period so the report omits the section entirely.
 */
export function summarizeApaRecords(records: ApaSessionRecord[]): ApaReportSummary | null {
  if (records.length === 0) return null

  const sorted = [...records].sort((a, b) =>
    a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date),
  )

  let completed = 0
  let planned = 0
  let minutes = 0
  // label → ratings in chronological order
  const byLabel = new Map<string, number[]>()

  for (const r of sorted) {
    completed += r.phasesCompleted.length
    planned += r.phasesTotal
    minutes += r.minutes
    for (const ind of r.indicators) {
      const list = byLabel.get(ind.label)
      if (list) list.push(ind.score)
      else byLabel.set(ind.label, [ind.score])
    }
  }

  const indicators = [...byLabel.entries()].map(([label, scores]) => ({
    label,
    avg: Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10,
    first: scores[0],
    last: scores[scores.length - 1],
    count: scores.length,
  }))

  // The band/condition shown is the most recent one the child was worked under —
  // a child who moves up an age band mid-period should not be labelled with the
  // band they have left behind.
  const latest = sorted[sorted.length - 1]

  return {
    sessions: sorted.length,
    minutes,
    adherencePct: planned > 0 ? Math.round((completed / planned) * 100) : 0,
    indicators,
    condition: latest.condition,
    band: latest.band,
  }
}

/** Records whose `date` falls inside [from, to] inclusive. Both are YYYY-MM-DD. */
export function filterApaRecordsByPeriod(
  records: ApaSessionRecord[],
  from: string,
  to: string,
): ApaSessionRecord[] {
  return records.filter(r => r.date >= from && r.date <= to)
}

// indicatorTrend lives in apa-trend.ts so client bundles can use it without
// pulling the authored plans in. Re-exported here for server-side callers.
export { indicatorTrend, type ApaTrend } from './apa-trend'
