// Deterministic "recommended plan" derived from the parent's first assessment.
// This is NOT a diagnosis — it's a transparent, rule-based triage that turns the
// domain scores + overall severity into a concrete starting plan the specialist
// can accept or adjust: how many sessions per week, for how many weeks, which
// attention domains to target first, and when to re-assess.
//
// Kept pure (no I/O, no randomness) so the SAME plan is computed on the parent's
// results screen (for display) and on the server (for trusted persistence).
import { DOMAINS, DOMAIN_ORDER, type DomainKey } from './assessment-data'

export type PlanSeverity = 'none' | 'mild' | 'moderate' | 'severe'

export interface TargetDomain {
  key: string
  label: string
  score: number
  priority: 'high' | 'medium'
}

export interface RecommendedPlan {
  severity: PlanSeverity
  sessionsPerWeek: number
  programWeeks: number
  totalSessions: number
  reassessWeeks: number
  targetDomains: TargetDomain[]
  focusExercises: string[]
}

// Same thresholds used on the results screen and the save payload.
export function severityFromScore(total: number): PlanSeverity {
  return total >= 45 ? 'severe' : total >= 30 ? 'moderate' : total >= 15 ? 'mild' : 'none'
}

// Session cadence + program length by severity tier. Conservative, defensible
// numbers for weekly special-needs therapy — the specialist has final say.
const TIER: Record<PlanSeverity, { sessionsPerWeek: number; programWeeks: number; reassessWeeks: number }> = {
  none:     { sessionsPerWeek: 0, programWeeks: 0,  reassessWeeks: 8 },
  mild:     { sessionsPerWeek: 1, programWeeks: 6,  reassessWeeks: 6 },
  moderate: { sessionsPerWeek: 2, programWeeks: 8,  reassessWeeks: 4 },
  severe:   { sessionsPerWeek: 2, programWeeks: 12, reassessWeeks: 4 },
}

const HIGH_PRIORITY = 8 // out of 15 per domain
const MEDIUM_PRIORITY = 5

/**
 * Build a recommended plan from per-domain scores (0–15 each) and the total.
 * `scores` may be a partial/loose record (e.g. from Redis) — missing domains
 * are treated as 0.
 */
export function buildRecommendedPlan(
  scores: Partial<Record<DomainKey, number>> | Record<string, number>,
  totalScore: number,
): RecommendedPlan {
  const severity = severityFromScore(totalScore)
  const tier = TIER[severity]

  // No active plan → no path either, so the UI never shows a target domain next
  // to a zero-session plan.
  const selected = severity === 'none' ? [] : DOMAIN_ORDER
    .map(key => ({ key, score: Number((scores as Record<string, number>)[key] ?? 0) }))
    .filter(d => d.score >= MEDIUM_PRIORITY)
    .sort((a, b) => b.score - a.score)

  const targetDomains: TargetDomain[] = selected.map(d => ({
    key: d.key,
    label: DOMAINS[d.key].label,
    score: d.score,
    priority: d.score >= HIGH_PRIORITY ? 'high' : 'medium',
  }))

  // Dedupe the exercise tips of the targeted domains, high-priority first.
  const focusExercises = Array.from(
    new Set(selected.flatMap(d => DOMAINS[d.key].exerciseTips)),
  )

  return {
    severity,
    sessionsPerWeek: tier.sessionsPerWeek,
    programWeeks: tier.programWeeks,
    totalSessions: tier.sessionsPerWeek * tier.programWeeks,
    reassessWeeks: tier.reassessWeeks,
    targetDomains,
    focusExercises,
  }
}

// ── Vanderbilt-based plan ─────────────────────────────────────
// Same RecommendedPlan output shape (so every downstream view keeps working),
// but derived from the validated Vanderbilt screen: severity comes straight
// from scoreVanderbilt, and the target path is the symptom domains ordered by
// how many symptoms are present.
import type { VanderbiltScore, VanderbiltDomain } from './vanderbilt-data'
import { DOMAIN_META } from './vanderbilt-data'

const VB_HIGH_PRIORITY = 6   // ≥6 present symptoms in a domain (the DSM count)
const VB_MEDIUM_PRIORITY = 3

export function buildPlanFromVanderbilt(score: VanderbiltScore): RecommendedPlan {
  const severity = score.severity
  const tier = TIER[severity]

  const domainCounts: { key: VanderbiltDomain; score: number }[] = [
    { key: 'inattention', score: score.inattentionCount },
    { key: 'hyperactivity', score: score.hyperactivityCount },
  ]
  // Only surface the oppositional path when it clears the concern threshold.
  if (score.oppositionalConcern || score.oppositionalCount >= VB_MEDIUM_PRIORITY) {
    domainCounts.push({ key: 'oppositional', score: score.oppositionalCount })
  }

  // No active plan → no path (keeps the UI from showing a target next to 0 sessions).
  const selected = severity === 'none' ? [] : domainCounts
    .filter(d => d.score >= VB_MEDIUM_PRIORITY)
    .sort((a, b) => b.score - a.score)

  const targetDomains: TargetDomain[] = selected.map(d => ({
    key: d.key,
    label: DOMAIN_META[d.key].label,
    score: d.score,
    priority: d.score >= VB_HIGH_PRIORITY ? 'high' : 'medium',
  }))

  const focusExercises = Array.from(
    new Set(selected.flatMap(d => DOMAIN_META[d.key].exerciseTips)),
  )

  return {
    severity,
    sessionsPerWeek: tier.sessionsPerWeek,
    programWeeks: tier.programWeeks,
    totalSessions: tier.sessionsPerWeek * tier.programWeeks,
    reassessWeeks: tier.reassessWeeks,
    targetDomains,
    focusExercises,
  }
}
