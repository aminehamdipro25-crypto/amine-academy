// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import SocialScenarios from '../components/session/exercises/SocialScenarios'
import VerbalFluency from '../components/session/exercises/VerbalFluency'
import WordRecall from '../components/session/exercises/WordRecall'
import SimonSays from '../components/session/exercises/SimonSays'
import SequenceMemory from '../components/session/exercises/SequenceMemory'
import WaitingGame from '../components/session/exercises/WaitingGame'

// Regression tests for the double-fire / timer-cleanup fixes from the
// 1-hour-session hardening audit. Each exercise below could previously call
// onComplete twice on a same-tick double-tap of a TERMINAL button (double
// session-save), or fire setState/onComplete after unmount from an untracked
// async timer. These lock the guards in place.
//
// The generic driver in exercise-scoring.test.tsx single-clicks lone terminal
// buttons (correct for that suite), so it can't catch these — hence the
// dedicated double-tap and unmount-safety drivers here.

afterEach(() => { cleanup(); vi.useRealTimers() })

// Countdown timers reschedule themselves each second (setTimeout → setState →
// re-render → new setTimeout). A single advanceTimersByTime doesn't reliably
// walk that chain through React's render/effect flush, so step one second at a
// time, letting each re-render schedule the next tick.
function tickSeconds(n: number) {
  for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(1000) })
}

// ── Terminal-button double-tap → exactly one onComplete ──────────────────────

describe('SocialScenarios single-fire', () => {
  it('double-tapping the final "إنهاء وحفظ" completes exactly once', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const { container } = render(
      <SocialScenarios onComplete={onComplete} onCancel={() => {}} studentAge={9} difficulty={1} seed={5} />,
    )
    // difficulty 1 → 2 scenarios. Each: pick a choice, then the footer button.
    for (let step = 0; step < 20 && onComplete.mock.calls.length === 0; step++) {
      const buttons = Array.from(container.querySelectorAll('button'))
      const finish = buttons.find(b => /إنهاء وحفظ/.test(b.textContent ?? ''))
      const nextBtn = buttons.find(b => /الموقف التالي/.test(b.textContent ?? ''))
      if (finish) {
        // The regression: hammer the terminal button — the guard must accept one.
        act(() => { fireEvent.click(finish); fireEvent.click(finish); fireEvent.click(finish) })
      } else if (nextBtn) {
        act(() => { fireEvent.click(nextBtn) })
      } else {
        // No footer yet → pick the first scenario choice (not the cancel link).
        const choice = buttons.find(b => !/إلغاء|سؤال للنقاش/.test(b.textContent ?? ''))
        if (choice) act(() => { fireEvent.click(choice) })
      }
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('VerbalFluency single-fire', () => {
  it('double-tapping "حفظ النتيجة" completes exactly once', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<VerbalFluency onComplete={onComplete} onCancel={() => {}} studentAge={10} difficulty={1} />)
    // Setup screen → pick the first category to start the 60s task.
    act(() => { fireEvent.click(screen.getAllByRole('button')[0]) })
    // Run the clock out (60s task) to reach the "انتهى الوقت!" results screen.
    tickSeconds(62)
    const save = screen.getByRole('button', { name: /حفظ النتيجة/ })
    act(() => { fireEvent.click(save); fireEvent.click(save); fireEvent.click(save) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('WordRecall single-fire', () => {
  it('double-tapping "تأكيد" completes exactly once', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<WordRecall onComplete={onComplete} onCancel={() => {}} studentAge={9} difficulty={1} seed={8} />)
    // Study phase countdown (displayTime=10s at difficulty 1) → recall phase.
    tickSeconds(11)
    const confirm = screen.getByRole('button', { name: /تأكيد/ })
    // Hammer confirm: the guard bails once a completion timer is scheduled.
    act(() => { fireEvent.click(confirm); fireEvent.click(confirm); fireEvent.click(confirm) })
    act(() => { vi.advanceTimersByTime(2_500) }) // the 2s completion delay
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

// ── Unmount safety: async timers must not fire onComplete after teardown ─────
// SimonSays / SequenceMemory drive an async watch-sequence; WaitingGame schedules
// a completion timer. Unmounting mid-sequence then letting all timers run must
// NOT throw and must NOT call onComplete (dead-guard + tracked-timer fixes).

describe.each([
  ['SimonSays', SimonSays],
  ['SequenceMemory', SequenceMemory],
  ['WaitingGame', WaitingGame],
] as const)('unmount safety: %s', (_name, Comp) => {
  it('unmounting mid-sequence fires no post-unmount onComplete and does not throw', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const { unmount } = render(
      <Comp onComplete={onComplete} onCancel={() => {}} studentAge={9} difficulty={1} seed={2} />,
    )
    act(() => { vi.advanceTimersByTime(900) }) // let the sequence/round get going
    expect(() => { unmount() }).not.toThrow()
    // Flush everything the torn-down component might have left pending.
    expect(() => { act(() => { vi.advanceTimersByTime(20_000) }) }).not.toThrow()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
