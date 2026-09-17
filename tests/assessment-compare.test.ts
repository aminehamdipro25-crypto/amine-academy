// What matters here is not that subtraction works — it is that the comparison
// refuses to say more than it knows, and that it never reads the direction
// backwards. A scale that reported improvement when a child was deteriorating
// would be worse than having no comparison at all.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  MIN_INTERVAL_DAYS,
  NOISE_THRESHOLD,
  compareAssessments,
  findPreviousOfSameScale,
  summariseComparison,
} from '../lib/assessment-compare'

const day = 86_400_000
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString()

function run(type: string, severity: string, domainScores: Record<string, number>, daysAgo: number) {
  return { type, severity, domainScores, completedAt: at(daysAgo) }
}

describe('direction — a fall in a symptom score is improvement', () => {
  it('reads a drop as improvement', () => {
    const c = compareAssessments(
      run('adhd', 'mild', { attention: 40 }, 0),
      run('adhd', 'moderate', { attention: 65 }, 60),
    )!
    expect(c.domains[0].delta).toBe(-25)
    expect(c.domains[0].direction).toBe('improved')
    expect(c.severityDirection).toBe('improved')
  })

  it('reads a rise as worsening', () => {
    const c = compareAssessments(
      run('adhd', 'severe', { attention: 80 }, 0),
      run('adhd', 'mild', { attention: 40 }, 60),
    )!
    expect(c.domains[0].direction).toBe('worsened')
    expect(c.severityDirection).toBe('worsened')
  })
})

describe('every scale in the toolkit really is scored symptom-high', () => {
  // The direction above is a claim about the scale components. If a future
  // scale computed an ABILITY percentage instead, every reading would invert
  // silently — so assert the shape in the source rather than trusting memory.
  const dir = path.resolve(__dirname, '../components/session/assessments')

  it('each scale builds domain scores as a share of the symptom maximum', () => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'))
    expect(files.length).toBeGreaterThanOrEqual(5)

    const offenders: string[] = []
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8')
      // Either the shared "sum / (items * 3)" shape, or PSC-17's "score / max".
      const symptomShare = /\(\s*sum\s*\/\s*\(\s*\w+(\.\w+)*\.length\s*\*\s*3\s*\)\s*\)/.test(src)
        || /s\.score\s*\/\s*s\.max/.test(src)
      if (!symptomShare) offenders.push(f)
    }
    expect(offenders, `these scales do not score symptom-high:\n${offenders.join('\n')}`).toEqual([])
  })

  it('each scale raises severity as the score rises', () => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'))
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8')
      const m = src.match(/function severity\([^)]*\)[^{]*\{([\s\S]*?)\n\}/)
      if (!m) continue // scales that import their severity elsewhere
      const body = m[1]
      // The first branch must be the low-score branch returning 'none'.
      expect(body.trim().startsWith('if'), f).toBe(true)
      expect(body.trim().split('\n')[0], f).toContain("'none'")
      expect(body.trim().endsWith("return 'severe'"), f).toBe(true)
    }
  })
})

describe('refusing to over-read', () => {
  it('treats a movement below the noise threshold as unchanged', () => {
    const c = compareAssessments(
      run('autism', 'mild', { social: 42 }, 0),
      run('autism', 'mild', { social: 44 }, 60),
    )!
    expect(Math.abs(c.domains[0].delta)).toBeLessThan(NOISE_THRESHOLD)
    expect(c.domains[0].direction).toBe('unchanged')
    expect(c.movedDomains).toEqual([])
  })

  it('counts a movement exactly at the threshold as real', () => {
    const c = compareAssessments(
      run('autism', 'mild', { social: 40 }, 0),
      run('autism', 'mild', { social: 45 }, 60),
    )!
    expect(c.domains[0].direction).toBe('improved')
  })

  it('flags a re-screen that came too soon to mean much', () => {
    const soon = compareAssessments(run('adhd', 'mild', { a: 30 }, 0), run('adhd', 'mild', { a: 60 }, 3))!
    expect(soon.daysApart).toBe(3)
    expect(soon.tooSoon).toBe(true)

    const later = compareAssessments(run('adhd', 'mild', { a: 30 }, 0), run('adhd', 'mild', { a: 60 }, MIN_INTERVAL_DAYS))!
    expect(later.tooSoon).toBe(false)
  })

  it('never claims a treatment effect', () => {
    const c = compareAssessments(
      run('adhd', 'mild', { attention: 30 }, 0),
      run('adhd', 'severe', { attention: 80 }, 60),
    )!
    const ar = summariseComparison(c, 'ar')
    expect(ar).toContain('فارق مُسجَّل')
    expect(ar).not.toMatch(/شُفي|علاج ناجح|بفضل/)
    expect(summariseComparison(c, 'en')).toContain('not a measured treatment effect')
  })

  it('says plainly when nothing moved', () => {
    const c = compareAssessments(run('adhd', 'mild', { a: 40 }, 0), run('adhd', 'mild', { a: 41 }, 60))!
    expect(summariseComparison(c, 'ar')).toContain('لم يتحرّك')
  })
})

describe('refusing to compare things that are not comparable', () => {
  it('returns null across different scales', () => {
    expect(compareAssessments(run('adhd', 'mild', { a: 40 }, 0), run('autism', 'mild', { a: 40 }, 60))).toBeNull()
  })

  it('returns null when the two runs share no domain', () => {
    expect(compareAssessments(run('adhd', 'mild', { a: 40 }, 0), run('adhd', 'mild', { b: 40 }, 60))).toBeNull()
  })

  it('ignores a domain the earlier run does not have', () => {
    const c = compareAssessments(
      run('adhd', 'mild', { a: 40, brandNew: 70 }, 0),
      run('adhd', 'mild', { a: 60 }, 60),
    )!
    expect(c.domains.map(d => d.key)).toEqual(['a'])
  })
})

describe('picking the right earlier run', () => {
  const current = run('adhd', 'mild', { a: 40 }, 0)
  const history = [
    run('adhd', 'moderate', { a: 60 }, 30),
    run('adhd', 'severe', { a: 80 }, 200),
    run('autism', 'mild', { social: 20 }, 10),
    current,
  ]

  it('takes the most recent earlier run of the same scale', () => {
    const prev = findPreviousOfSameScale(current, history)!
    expect(prev.domainScores.a).toBe(60)
  })

  it('never returns the run being compared', () => {
    expect(findPreviousOfSameScale(current, [current])).toBeNull()
  })

  it('never returns a later run', () => {
    const future = run('adhd', 'mild', { a: 10 }, -30)
    expect(findPreviousOfSameScale(current, [future])).toBeNull()
  })

  it('returns null on a first-ever run', () => {
    expect(findPreviousOfSameScale(current, [run('autism', 'mild', { social: 20 }, 10)])).toBeNull()
  })

  it('survives an unparseable date instead of throwing', () => {
    const broken = { type: 'adhd', severity: 'mild', domainScores: { a: 1 }, completedAt: 'not a date' }
    expect(() => findPreviousOfSameScale(current, [broken])).not.toThrow()
    expect(findPreviousOfSameScale(current, [broken])).toBeNull()
  })
})

describe('worsening is surfaced first', () => {
  it('orders moved domains by the largest rise', () => {
    const c = compareAssessments(
      run('psc17', 'moderate', { internalising: 70, attention: 30, externalising: 50 }, 0),
      run('psc17', 'mild', { internalising: 40, attention: 60, externalising: 50 }, 60),
    )!
    expect(c.movedDomains[0].key).toBe('internalising')
    expect(c.movedDomains[0].direction).toBe('worsened')
    expect(c.movedDomains.map(d => d.key)).not.toContain('externalising')
  })
})
