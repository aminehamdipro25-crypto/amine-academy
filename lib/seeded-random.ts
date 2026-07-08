// Deterministic PRNG for exercise content that must look IDENTICAL on the
// specialist's screen and the child's screen. Every exercise mounts as two
// separate React trees (one per browser), so any exercise that shuffles its
// own content with Math.random() ends up showing two different boards —
// the specialist can no longer say "look at the third card" because the
// child's third card isn't the same card. Exercises that need this pass a
// shared `seed` (minted once per activation and synced through the `live`
// channel) into these helpers instead of calling Math.random() directly.
//
// Not cryptographic — this is only for making shuffles reproducible, never
// for anything security-sensitive.

export type Rng = () => number

// mulberry32 — small, fast, good statistical quality for this use case.
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleWithRng<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickWithRng<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// Inclusive [min, max] integer, e.g. random spawn position/index ranges.
export function randIntWithRng(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function randBoolWithRng(rng: Rng, trueChance = 0.5): boolean {
  return rng() < trueChance
}
