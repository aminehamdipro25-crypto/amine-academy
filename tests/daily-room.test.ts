import { describe, it, expect } from 'vitest'
import { dailyRoomNameFor } from '../lib/daily'

// Regression tests for the Daily.co room-name bug: room names are capped at
// 41 characters, and deriving the name directly from the (high-entropy,
// long) appointment ID used to blow past that cap and silently break video
// joins ("خطأ في الانضمام"). The name is now a fixed-length hash — these
// tests lock that invariant so a future change to ID length can't reintroduce
// the failure.

const DAILY_MAX = 41

describe('dailyRoomNameFor', () => {
  it('always stays within Daily.co\'s 41-char cap, even for very long IDs', () => {
    const ids = ['AP-abc', 'AP-mrc470yp-434ab6d6014ea83acac4035a', 'x'.repeat(500)]
    for (const id of ids) {
      expect(dailyRoomNameFor(id).length).toBeLessThanOrEqual(DAILY_MAX)
    }
  })

  it('produces a fixed 30-char name decoupled from input length', () => {
    const short = dailyRoomNameFor('a')
    const long = dailyRoomNameFor('a'.repeat(300))
    expect(short.length).toBe(30)
    expect(long.length).toBe(30)
  })

  it('is prefixed with "amine-"', () => {
    expect(dailyRoomNameFor('AP-xyz').startsWith('amine-')).toBe(true)
  })

  it('is deterministic (same appointment → same room)', () => {
    expect(dailyRoomNameFor('AP-session-1')).toBe(dailyRoomNameFor('AP-session-1'))
  })

  it('maps different appointments to different rooms (no prefix collision)', () => {
    // Two IDs sharing a long common prefix must NOT collide (the reason we
    // hash instead of truncate).
    const a = dailyRoomNameFor('AP-longcommonprefix-0000000000-A')
    const b = dailyRoomNameFor('AP-longcommonprefix-0000000000-B')
    expect(a).not.toBe(b)
  })

  it('uses only URL/Daily-safe characters', () => {
    expect(dailyRoomNameFor('AP-mrc470yp-434ab6d6014ea83acac4035a')).toMatch(/^amine-[a-f0-9]{24}$/)
  })
})
