import { describe, it, expect } from 'vitest'
import {
  createRng,
  shuffleWithRng,
  pickWithRng,
  randIntWithRng,
  randBoolWithRng,
} from '../lib/seeded-random'

// The seeded RNG is the foundation of the platform's core promise: the
// specialist's screen and the child's screen render the EXACT same exercise
// content. Both screens build their content from the same shared `seed`, so
// determinism here is what keeps the two boards identical. These tests guard
// that guarantee — if any of them break, the two screens can silently diverge.

describe('createRng — determinism', () => {
  it('produces the identical sequence for the same seed', () => {
    const a = createRng(12345)
    const b = createRng(12345)
    const seqA = Array.from({ length: 50 }, () => a())
    const seqB = Array.from({ length: 50 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = Array.from({ length: 20 }, createRng(1))
    const b = Array.from({ length: 20 }, createRng(2))
    expect(a).not.toEqual(b)
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng(999)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is stable across process runs (a fixed seed yields fixed known values)', () => {
    // Locks the algorithm: if mulberry32 is ever swapped out, this breaks and
    // forces a conscious decision (both screens must change together).
    const rng = createRng(42)
    const first = rng()
    // Guard the first draw so a change in the generator is caught and forces a
    // conscious decision (both screens must change together).
    expect(first).toBeCloseTo(0.6011037519201636, 9)
  })
})

describe('shuffleWithRng', () => {
  it('is a permutation (same multiset of elements)', () => {
    const rng = createRng(7)
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const out = shuffleWithRng(rng, input)
    expect(out).toHaveLength(input.length)
    expect([...out].sort((x, y) => x - y)).toEqual(input)
  })

  it('does not mutate the input array', () => {
    const rng = createRng(7)
    const input = [1, 2, 3, 4, 5]
    const snapshot = [...input]
    shuffleWithRng(rng, input)
    expect(input).toEqual(snapshot)
  })

  it('two RNGs with the same seed shuffle IDENTICALLY (the two-screen guarantee)', () => {
    const specialist = createRng(2024)
    const child = createRng(2024)
    const deck = ['🦊', '🐙', '🌙', '⚡', '🦁', '🎸', '🌊', '🔮']
    expect(shuffleWithRng(specialist, deck)).toEqual(shuffleWithRng(child, deck))
  })

  it('actually reorders (not the identity) for a typical deck', () => {
    const rng = createRng(3)
    const input = Array.from({ length: 12 }, (_, i) => i)
    const out = shuffleWithRng(rng, input)
    expect(out).not.toEqual(input) // vanishingly unlikely to be identity for 12 items
  })
})

describe('pickWithRng', () => {
  it('always returns an element of the array', () => {
    const rng = createRng(11)
    const arr = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(pickWithRng(rng, arr))
    }
  })

  it('same seed picks the same element', () => {
    const arr = ['a', 'b', 'c', 'd', 'e']
    expect(pickWithRng(createRng(5), arr)).toBe(pickWithRng(createRng(5), arr))
  })
})

describe('randIntWithRng', () => {
  it('stays within the inclusive range', () => {
    const rng = createRng(13)
    for (let i = 0; i < 2000; i++) {
      const v = randIntWithRng(rng, 3, 9)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(9)
    }
  })

  it('can reach both endpoints', () => {
    const rng = createRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randIntWithRng(rng, 0, 2))
    expect(seen).toEqual(new Set([0, 1, 2]))
  })

  it('same seed yields the same integer', () => {
    expect(randIntWithRng(createRng(8), 0, 100)).toBe(randIntWithRng(createRng(8), 0, 100))
  })
})

describe('randBoolWithRng', () => {
  it('respects the trueChance skew', () => {
    const rng = createRng(21)
    let trues = 0
    const N = 5000
    for (let i = 0; i < N; i++) if (randBoolWithRng(rng, 0.8)) trues++
    // ~80% ± a loose tolerance
    expect(trues / N).toBeGreaterThan(0.74)
    expect(trues / N).toBeLessThan(0.86)
  })

  it('same seed yields the same boolean', () => {
    expect(randBoolWithRng(createRng(9))).toBe(randBoolWithRng(createRng(9)))
  })
})
