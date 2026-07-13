// Structural, category-based link between a scale's domain scores and the real
// exercise catalog (lib/exercises-data.ts). Deliberately NOT text-matched against
// AssessmentResult.recommendations — that field is free text (and for
// LearningDifficultiesScale it's dynamically interpolated, not even a fixed set of
// strings), so matching on it would be fragile. Reading domainScores instead means
// this works for every already-persisted AssessmentResult with zero schema change.
//
// This is a categorical heuristic for surfacing plausible catalog exercises next to
// each recommendation — not a clinically validated exercise prescription. The actual
// individualized program should still go through /api/admin/ai-generate-program,
// which reasons over the full child profile rather than a fixed category lookup.
import type { AssessmentResult, AssessmentType, Exercise, ExerciseCategory } from './types'

const DOMAIN_CATEGORY_MAP: Record<AssessmentType, Record<string, ExerciseCategory[]>> = {
  adhd: {
    attention: ['focus'],
    hyperactivity: ['motor', 'energy'],
    impulsivity: ['focus', 'social'],
  },
  autism: {
    social: ['social'],
    repetitive: ['sensory', 'motor'],
    sensory: ['sensory'],
    flexibility: ['balance'],
    selfRegulation: ['sensory', 'balance'],
  },
  'attention-domains': {
    sustained: ['focus'],
    selective: ['focus'],
    executive: ['focus', 'motor'],
    inhibition: ['balance', 'motor'],
  },
  'vanderbilt-adhd': {
    inattention: ['focus'],
    hyperactivity: ['motor', 'energy'],
    oppositional: ['social', 'balance'],
  },
  'learning-difficulties': {
    dyslexia: ['focus'],
    dyscalculia: ['focus'],
    dysgraphia: ['motor'],
    workingMemory: ['focus'],
    processingSpeed: ['focus', 'energy'],
  },
  motor: {},
  cognitive: {},
}

// Mirrors each scale component's own elevation threshold exactly (see comments in
// ADHDScale.tsx / AutismScale.tsx / AttentionDomainsScale.tsx / LearningDifficultiesScale.tsx
// — these are NOT a unified cutoff, by clinical-content decision, not oversight).
function isElevated(type: AssessmentType, score: number): boolean {
  switch (type) {
    case 'adhd': return score > 50
    case 'autism': return score >= 45
    case 'attention-domains': return score >= 50
    case 'vanderbilt-adhd': return score >= 6 // ≥6 present symptoms in a domain (DSM count)
    case 'learning-difficulties': return score >= 20
    default: return false
  }
}

export function getElevatedDomains(result: AssessmentResult): string[] {
  return Object.entries(result.domainScores)
    .filter(([, score]) => isElevated(result.type, score))
    .map(([domain]) => domain)
}

export function getRecommendedCategories(result: AssessmentResult): ExerciseCategory[] {
  const map = DOMAIN_CATEGORY_MAP[result.type] ?? {}
  const categories = new Set<ExerciseCategory>()
  for (const domain of getElevatedDomains(result)) {
    for (const cat of map[domain] ?? []) categories.add(cat)
  }
  return [...categories]
}

export function findMatchingExercises(categories: ExerciseCategory[], allExercises: Exercise[], limit = 4): Exercise[] {
  if (categories.length === 0) return []
  const catSet = new Set(categories)
  return allExercises.filter(ex => catSet.has(ex.category)).slice(0, limit)
}
