import type { ExerciseResult } from './types'

// ── Phase 1: Adaptive Difficulty ─────────────────────────────────────────────
// Rules (per exercise type, within current session):
//   • last 3 results avg ≥ 85% AND not already at max → bump up 1 level
//   • last 3 results avg ≤ 45% AND not already at min → drop down 1 level
//   • otherwise → no change
// Only triggers once per "window" to avoid rapid oscillation.

export interface AdaptiveDecision {
  exerciseId:    string
  exerciseLabel: string
  oldLevel:      1|2|3
  newLevel:      1|2|3
  reason:        'excellent' | 'struggling'
  avgScore:      number
}

export function computeAdaptiveDecision(
  result: ExerciseResult,
  allResults: ExerciseResult[],
  currentLevel: 1|2|3,
): AdaptiveDecision | null {
  // allResults is the CURRENT results state, which already contains `result`
  // (appended by the caller's setResults before this runs) — filtering by
  // exerciseType alone gives the up-to-date list without double-counting it.
  const typeResults = allResults.filter(r => r.exerciseType === result.exerciseType)
  if (typeResults.length < 2) return null

  const last3 = typeResults.slice(-3)
  const avg   = last3.reduce((s, r) => s + r.score, 0) / last3.length

  if (avg >= 85 && currentLevel < 3) {
    return {
      exerciseId:    result.exerciseType,
      exerciseLabel: result.exerciseLabelAr,
      oldLevel:      currentLevel,
      newLevel:      (currentLevel + 1) as 1|2|3,
      reason:        'excellent',
      avgScore:      Math.round(avg),
    }
  }
  if (avg <= 45 && currentLevel > 1) {
    return {
      exerciseId:    result.exerciseType,
      exerciseLabel: result.exerciseLabelAr,
      oldLevel:      currentLevel,
      newLevel:      (currentLevel - 1) as 1|2|3,
      reason:        'struggling',
      avgScore:      Math.round(avg),
    }
  }
  return null
}

// ── Phase 2: Session Intelligence ────────────────────────────────────────────

export interface SessionMomentum {
  trend:          'rising' | 'falling' | 'stable'
  recentAvg:      number
  earlyAvg:       number
  totalAvg:       number
  fatigueWarning: boolean // score declining AND session > 30 min
}

export function computeSessionMomentum(
  results: ExerciseResult[],
  elapsedSecs: number,
): SessionMomentum {
  if (results.length < 2) {
    const avg = results.length === 1 ? results[0].score : 0
    return { trend: 'stable', recentAvg: avg, earlyAvg: avg, totalAvg: avg, fatigueWarning: false }
  }
  const half      = Math.ceil(results.length / 2)
  const early     = results.slice(0, half)
  const recent    = results.slice(-half)
  const earlyAvg  = Math.round(early.reduce((s, r) => s + r.score, 0) / early.length)
  const recentAvg = Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length)
  const totalAvg  = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
  const diff      = recentAvg - earlyAvg
  const trend     = diff > 8 ? 'rising' : diff < -8 ? 'falling' : 'stable'
  return {
    trend,
    recentAvg,
    earlyAvg,
    totalAvg,
    fatigueWarning: trend === 'falling' && elapsedSecs > 30 * 60,
  }
}

export interface BestExercise {
  id:       string
  label:    string
  avgScore: number
  plays:    number
}

export function computeBestExercise(results: ExerciseResult[]): BestExercise | null {
  if (results.length === 0) return null
  const byType: Record<string, { scores: number[]; label: string }> = {}
  for (const r of results) {
    if (!byType[r.exerciseType]) byType[r.exerciseType] = { scores: [], label: r.exerciseLabelAr }
    byType[r.exerciseType].scores.push(r.score)
  }
  let best: BestExercise | null = null
  for (const [id, { scores, label }] of Object.entries(byType)) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    if (!best || avg > best.avgScore) {
      best = { id, label, avgScore: Math.round(avg), plays: scores.length }
    }
  }
  return best
}

// ── Phase 3: Stars ────────────────────────────────────────────────────────────
// ⭐⭐ score ≥ 85, ⭐ score ≥ 70, nothing below 70

export function computeSessionStars(results: ExerciseResult[]): number {
  return results.reduce((total, r) => {
    if (r.score >= 85) return total + 2
    if (r.score >= 70) return total + 1
    return total
  }, 0)
}

export function starsFromResult(score: number): number {
  if (score >= 85) return 2
  if (score >= 70) return 1
  return 0
}

// Compare today's session avg against historical avg for this student
export function computeVsYesterday(
  results: ExerciseResult[],
  historicalAvgByGame: Record<string, { plays: number; avgScore: number }>,
): { better: boolean; diff: number } | null {
  if (results.length === 0) return null
  let sessionTotal = 0
  let historicalTotal = 0
  let count = 0
  for (const r of results) {
    const hist = historicalAvgByGame[r.exerciseType]
    if (hist && hist.plays >= 2) {
      sessionTotal += r.score
      historicalTotal += hist.avgScore
      count++
    }
  }
  if (count === 0) return null
  const sessionAvg    = sessionTotal / count
  const historicalAvg = historicalTotal / count
  const diff          = Math.round(sessionAvg - historicalAvg)
  return { better: diff > 0, diff }
}
