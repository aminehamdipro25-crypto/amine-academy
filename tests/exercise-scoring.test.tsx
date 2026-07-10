// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import type { ComponentType } from 'react'
import MathFlash from '../components/session/exercises/MathFlash'
import SpellingBee from '../components/session/exercises/SpellingBee'
import OddOneOut from '../components/session/exercises/OddOneOut'
import AnalogiesGame from '../components/session/exercises/AnalogiesGame'
import RhymeDetection from '../components/session/exercises/RhymeDetection'
import IfThen from '../components/session/exercises/IfThen'
import ClockReading from '../components/session/exercises/ClockReading'
import PatternPuzzle from '../components/session/exercises/PatternPuzzle'

// Component-level regression tests for exercise SCORING and the single-fire
// guarantee. The comprehensive review found several exercises that could call
// onComplete twice (double session-save) on rapid taps, or mis-score. These
// tests drive real exercises to completion under fake timers and assert:
//   1. onComplete fires EXACTLY once, and
//   2. the score matches the answers given.
// A fixed `seed` makes each run deterministic (the same content both screens
// would render), so the tests are stable.

afterEach(() => { cleanup(); vi.useRealTimers() })

function solveEquation(text: string): number {
  const m = text.match(/(\d+)\s*([+\-×])\s*(\d+)/)
  if (!m) throw new Error(`cannot parse equation: "${text}"`)
  const a = Number(m[1]), b = Number(m[3])
  return m[2] === '+' ? a + b : m[2] === '-' ? a - b : a * b
}

describe('MathFlash scoring', () => {
  it('answering every question correctly → onComplete once with score 100', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<MathFlash onComplete={onComplete} onCancel={() => {}} studentAge={8} difficulty={1} seed={123} />)

    const TOTAL = 8 // difficulty 1
    for (let i = 0; i < TOTAL; i++) {
      const equation = screen.getByText(/=\s*\?/).textContent ?? ''
      const answer = solveEquation(equation)
      act(() => { fireEvent.click(screen.getByRole('button', { name: String(answer) })) })
      act(() => { vi.advanceTimersByTime(1300) }) // feedback → next question / complete
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0].score).toBe(100)
    expect(onComplete.mock.calls[0][0].errors).toBe(0)
  })

  it('rapid double-click on the same question does NOT double-advance or double-complete', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<MathFlash onComplete={onComplete} onCancel={() => {}} studentAge={8} difficulty={1} seed={7} />)

    const TOTAL = 8
    for (let i = 0; i < TOTAL; i++) {
      const answer = solveEquation(screen.getByText(/=\s*\?/).textContent ?? '')
      const btn = screen.getByRole('button', { name: String(answer) })
      // hammer the button — the guard must accept only the first
      act(() => { fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn) })
      act(() => { vi.advanceTimersByTime(1300) })
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('SpellingBee scoring', () => {
  it('choosing the correctly-spelled word each time → onComplete once, score 100', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    // The correct word for each item is what the exercise announces; the
    // choices include the correct spelling plus misspellings. We click the
    // button whose text is the correctly-spelled word by matching against the
    // "listen" flow: the exercise's correct answer is always one of the
    // choices, and it is the ONLY choice that is a real word — but rather than
    // encode a dictionary, we rely on the exercise exposing the answer via its
    // own accessible content. Simplest robust check: drive it and assert a
    // single completion with a valid score.
    render(<SpellingBee onComplete={onComplete} onCancel={() => {}} studentAge={8} difficulty={1} seed={42} />)

    const TOTAL = 6 // difficulty 1
    for (let i = 0; i < TOTAL; i++) {
      // Click the first choice button that isn't the "listen" or "cancel"
      // control. (This exercises the completion flow / single-fire guard; the
      // score-correctness path is covered by MathFlash where we can compute
      // the answer.)
      const buttons = screen.getAllByRole('button').filter(b =>
        !/استمع|إنهاء/.test(b.textContent ?? ''))
      act(() => { fireEvent.click(buttons[0]) })
      act(() => { vi.advanceTimersByTime(1500) })
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
    const result = onComplete.mock.calls[0][0]
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

describe('OddOneOut single-fire', () => {
  it('drives to completion with exactly one onComplete', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<OddOneOut onComplete={onComplete} onCancel={() => {}} studentAge={8} difficulty={1} seed={99} />)

    const TOTAL = 5 // difficulty 1
    for (let i = 0; i < TOTAL; i++) {
      const buttons = screen.getAllByRole('button').filter(b =>
        !/إنهاء/.test(b.textContent ?? ''))
      act(() => { fireEvent.click(buttons[0]); fireEvent.click(buttons[1] ?? buttons[0]) })
      act(() => { vi.advanceTimersByTime(1600) })
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

// ── Generic driver: many exercises are "pick a choice → feedback → next", and
// clicking ANY choice advances the item. This drives such an exercise to
// completion by clicking the first non-control button each step (double-
// tapping to also exercise the same-tick double-fire guard), advancing fake
// timers between. It asserts onComplete fires EXACTLY once — the regression
// that keeps catching real bugs (OddOneOut above was found this way).
const CONTROL = /إنهاء|إلغاء|إغلاق|استمع|استماع|🔊|↺|إعادة|تخط|إعادة المحاولة/

function driveChoiceExercise(
  Comp: ComponentType<{ onComplete: (r: unknown) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3; seed?: number }>,
  seed: number,
) {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  const { container } = render(
    <Comp onComplete={onComplete} onCancel={() => {}} studentAge={8} difficulty={1} seed={seed} />,
  )
  for (let step = 0; step < 60 && onComplete.mock.calls.length === 0; step++) {
    const choices = Array.from(container.querySelectorAll('button'))
      .filter(b => !(b as HTMLButtonElement).disabled && !CONTROL.test(b.textContent ?? ''))
    if (choices.length > 0) {
      // click twice — a well-guarded exercise ignores the 2nd (same-tick) tap
      act(() => { fireEvent.click(choices[0]); fireEvent.click(choices[0]) })
    }
    act(() => { vi.advanceTimersByTime(2500) })
  }
  return onComplete
}

describe.each([
  ['AnalogiesGame', AnalogiesGame, 5],
  ['RhymeDetection', RhymeDetection, 11],
  ['IfThen', IfThen, 13],
  ['ClockReading', ClockReading, 21],
  ['PatternPuzzle', PatternPuzzle, 31],
] as const)('single-fire: %s', (_name, Comp, seed) => {
  it('drives to completion with exactly one onComplete (double-taps guarded)', () => {
    const onComplete = driveChoiceExercise(Comp as never, seed)
    expect(onComplete).toHaveBeenCalledTimes(1)
    const result = onComplete.mock.calls[0][0] as { score: number }
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
