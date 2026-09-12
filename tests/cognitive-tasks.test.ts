import { describe, it, expect } from 'vitest'
import { readTask, taskDef, batterySummary, COGNITIVE_TASKS } from '../lib/cognitive-tasks'

describe('cognitive task definitions', () => {
  it('every task id is unique', () => {
    const ids = COGNITIVE_TASKS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('resolves a known task and ignores an unknown one', () => {
    expect(taskDef('span-extension')?.domainAr).toContain('الذاكرة')
    expect(taskDef('not-a-task')).toBeUndefined()
  })
})

describe('readTask — memory span', () => {
  it('reports the span reached as the headline number', () => {
    const r = readTask('span-extension', { seqLen: 5, rounds: 6 }, 83, 7)
    expect(r.headline).toContain('5')
    expect(r.details.join(' ')).toContain('83%')
    expect(r.caution).toBeUndefined()
  })

  it('flags a reverse span as the harder variant', () => {
    const r = readTask('span-extension', { seqLen: 4, rounds: 6, reverse: true }, 70, 9)
    expect(r.details.join(' ')).toContain('عكسي')
  })
})

describe('readTask — sustained attention (CPT profile)', () => {
  it('separates omission from commission errors, which mean different things', () => {
    const r = readTask('sustained-attention',
      { hits: 18, misses: 6, falseAlarms: 2, totalTargets: 24, totalStimuli: 90 }, 75, 7)
    expect(r.headline).toContain('18')
    const all = r.details.join(' | ')
    expect(all).toContain('إغفال')      // omissions -> inattention
    expect(all).toContain('اندفاعية')   // false alarms -> impulsivity
  })

  it('never prints a bare "100% accuracy" alongside false alarms', () => {
    // Real case from a session report: every target caught, but five presses on
    // non-targets. The task's raw accuracy field is hits/targets = 100%, which
    // would contradict the false-alarm line.
    const r = readTask('sustained-attention',
      { hits: 5, misses: 0, falseAlarms: 5, totalTargets: 5, totalStimuli: 30 }, 100, 7)
    const printed = [r.headline, ...r.details].join(' | ')
    expect(printed).not.toContain('الدقة: 100%')
    expect(printed).toContain('إنذارات كاذبة')
    // the false-alarm rate is expressed against non-targets (5/25 = 20%)
    expect(printed).toContain('20%')
  })

  it('flags a run with too few targets as unstable', () => {
    const r = readTask('sustained-attention',
      { hits: 5, misses: 0, falseAlarms: 5, totalTargets: 5, totalStimuli: 30 }, 100, 9)
    expect(r.caution).toBeDefined()
    expect(r.caution).toContain('قليل')
  })

  it('does not flag a run with enough targets', () => {
    const r = readTask('sustained-attention',
      { hits: 20, misses: 4, falseAlarms: 1, totalTargets: 24, totalStimuli: 90 }, 83, 9)
    expect(r.caution).toBeUndefined()
  })
})

describe('readTask — age guards', () => {
  it('marks a task as not interpretable below its minimum age', () => {
    // Stroop needs reading fluency; minAge 8
    const r = readTask('stroop-test', {}, 60, 6)
    expect(r.caution).toBeDefined()
    expect(r.caution).toContain('غير حاسمة')
  })

  it('still surfaces the age note just above the threshold', () => {
    const r = readTask('n-back', { n: 1, correct: 8, wrong: 2, totalTrials: 12 }, 67, 7)
    expect(r.caution).toBeDefined() // n-back minAge 7, note applies below 9
  })

  it('gives no caution for an age-appropriate task', () => {
    const r = readTask('visual-search', { avgFindTimeMs: 2400, gridSize: 16 }, 90, 9)
    expect(r.caution).toBeUndefined()
    expect(r.headline).toContain('2.4')
  })
})

describe('batterySummary', () => {
  it('is empty with no tasks', () => {
    expect(batterySummary([])).toBe('')
  })
  it('says results are inconclusive when every task was age-flagged', () => {
    const r = readTask('stroop-test', {}, 50, 6)
    expect(batterySummary([r])).toContain('غير حاسمة')
  })
  it('never claims a diagnosis or peer comparison', () => {
    const r = readTask('span-extension', { seqLen: 5 }, 80, 8)
    const s = batterySummary([r])
    expect(s).toContain('وليست تشخيصاً')
    expect(s).toContain('خط أساس')
  })
})
