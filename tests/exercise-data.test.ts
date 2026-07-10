import { describe, it, expect } from 'vitest'
import { HOUR_QS, HALF_QS, QUARTER_QS } from '../components/session/exercises/ClockReading'
import { ALL_QUESTIONS as ODD_QS } from '../components/session/exercises/OddOneOut'
import { ALL as ANALOGIES } from '../components/session/exercises/AnalogiesGame'
import { ALL as IF_THEN } from '../components/session/exercises/IfThen'
import { ALL as SPELLING } from '../components/session/exercises/SpellingBee'

// Data-validity regression tests. The comprehensive review found content
// bugs that no type check or runtime path would catch — e.g. a ClockReading
// question labeled "quarter to six" (5:45) was DRAWN as 6:45, so a child who
// read the clock correctly was marked wrong and taught the wrong time. These
// tests lock the exercise data against that whole class of defect.

// Arabic feminine ordinal for a clock hour (1..12).
const HOUR_NAMES = [
  '', 'الواحدة', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة',
  'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة',
]

// Canonical Arabic reading of a clock time, for the exact minute patterns the
// exercise uses. `label` in the data MUST equal this for the drawn (h, m).
function timeToLabel(h: number, m: number): string {
  const hour = HOUR_NAMES[h === 0 ? 12 : h]
  const nextHour = HOUR_NAMES[(h % 12) + 1]
  switch (m) {
    case 0:  return hour
    case 10: return `${hour} وعشر دقائق`
    case 15: return `${hour} والربع`
    case 20: return `${hour} وعشرون دقيقة`
    case 30: return `${hour} والنصف`
    case 40: return `${hour} وأربعون دقيقة`
    case 45: return `${nextHour} إلا ربع`   // "quarter to <next hour>"
    case 50: return `${hour} وخمسون دقيقة`
    default: throw new Error(`unhandled minute pattern: ${m}`)
  }
}

const ALL_CLOCK_QS = [...HOUR_QS, ...HALF_QS, ...QUARTER_QS]

describe('ClockReading data', () => {
  it('every question label matches the time the clock actually draws (h, m)', () => {
    for (const q of ALL_CLOCK_QS) {
      expect(timeToLabel(q.h, q.m), `clock ${q.h}:${String(q.m).padStart(2, '0')}`).toBe(q.label)
    }
  })

  it('the correct label is present among the choices', () => {
    for (const q of ALL_CLOCK_QS) {
      expect(q.choices, q.label).toContain(q.label)
    }
  })

  it('choices are all distinct (no duplicate-answer distractor)', () => {
    for (const q of ALL_CLOCK_QS) {
      expect(new Set(q.choices).size, q.label).toBe(q.choices.length)
    }
  })

  it('no distractor is a valid reading of the SAME drawn time', () => {
    // The correct label is the only choice that reads the drawn (h, m).
    for (const q of ALL_CLOCK_QS) {
      const correctReading = timeToLabel(q.h, q.m)
      const distractors = q.choices.filter(c => c !== q.label)
      for (const d of distractors) {
        expect(d, `${q.label}: distractor "${d}"`).not.toBe(correctReading)
      }
    }
  })

  it('has questions for each difficulty tier', () => {
    expect(HOUR_QS.length).toBeGreaterThanOrEqual(4)
    expect(HALF_QS.length).toBeGreaterThanOrEqual(4)
    expect(QUARTER_QS.length).toBeGreaterThanOrEqual(4)
  })
})

describe('OddOneOut data', () => {
  it('every question has a valid odd index within its items', () => {
    for (const q of ODD_QS) {
      expect(q.odd).toBeGreaterThanOrEqual(0)
      expect(q.odd).toBeLessThan(q.items.length)
    }
  })

  it('items are distinct within a question (so the odd one is unambiguous after shuffling)', () => {
    for (const q of ODD_QS) {
      expect(new Set(q.items).size, q.items.join(',')).toBe(q.items.length)
    }
  })

  it('every question has a non-empty explanation', () => {
    for (const q of ODD_QS) {
      expect(q.explain.trim().length).toBeGreaterThan(0)
    }
  })

  it('has at least 4 items per question (a 2×2 grid)', () => {
    for (const q of ODD_QS) {
      expect(q.items.length).toBeGreaterThanOrEqual(4)
    }
  })
})

// Multiple-choice banks where the correct answer is mixed with distractors.
// The critical invariant (the ClockReading-bug class): a distractor must never
// equal the correct answer — otherwise a child picking a genuinely-correct-
// looking choice is scored wrong.
describe.each([
  ['AnalogiesGame', ANALOGIES],
  ['IfThen', IF_THEN],
])('%s data', (_name, bank) => {
  it('no distractor equals the correct answer', () => {
    for (const q of bank) {
      for (const w of q.wrong) {
        expect(w, `correct "${q.correct}"`).not.toBe(q.correct)
      }
    }
  })
  it('the two distractors differ from each other', () => {
    for (const q of bank) {
      expect(q.wrong[0], q.correct).not.toBe(q.wrong[1])
    }
  })
  it('correct and distractors are non-empty', () => {
    for (const q of bank) {
      expect(q.correct.trim().length).toBeGreaterThan(0)
      for (const w of q.wrong) expect(w.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('SpellingBee data', () => {
  it('the correct spelling is present among the choices', () => {
    for (const q of SPELLING) {
      expect(q.choices, q.word).toContain(q.word)
    }
  })
  it('choices are distinct (the correct word appears once, no duplicate)', () => {
    for (const q of SPELLING) {
      expect(new Set(q.choices).size, q.word).toBe(q.choices.length)
    }
  })
  it('each item offers at least two choices', () => {
    for (const q of SPELLING) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2)
    }
  })
})
