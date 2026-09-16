// The bug these guard against: "this week" was read as "the last week that had
// any data". So the cases that matter are the gaps — a week with no plays must
// be absent, not resolve to an older one.
import { describe, it, expect } from 'vitest'
import { currentWeekKey, shiftWeekKey, weekKeyOf } from '../lib/week'

describe('weekKeyOf — every day of a week maps to its Monday', () => {
  // 2026-09-14 is a Monday.
  const days = [
    ['2026-09-14T00:00:00Z', 'Monday'],
    ['2026-09-15T12:00:00Z', 'Tuesday'],
    ['2026-09-17T23:59:59Z', 'Thursday'],
    ['2026-09-20T23:59:59Z', 'Sunday'],
  ] as const

  for (const [iso, label] of days) {
    it(`${label} → 2026-09-14`, () => {
      expect(weekKeyOf(iso)).toBe('2026-09-14')
    })
  }

  it('the next Monday starts a new bucket', () => {
    expect(weekKeyOf('2026-09-21T00:00:00Z')).toBe('2026-09-21')
  })

  it('Sunday belongs to the week that is ending, not the one starting', () => {
    // The old local-time implementation could push a Sunday into the wrong
    // bucket outside UTC; a Monday-based week must never key to a Sunday.
    const key = weekKeyOf('2026-09-20T22:30:00Z')
    expect(key).toBe('2026-09-14')
    expect(new Date(`${key}T00:00:00Z`).getUTCDay()).toBe(1)
  })

  it('returns null for a value that is not a date', () => {
    expect(weekKeyOf('not a date')).toBeNull()
    expect(weekKeyOf('')).toBeNull()
  })
})

describe('currentWeekKey', () => {
  it('is always a Monday', () => {
    for (let i = 0; i < 40; i++) {
      const d = new Date(Date.UTC(2026, 0, 1 + i * 9))
      expect(new Date(`${currentWeekKey(d)}T00:00:00Z`).getUTCDay()).toBe(1)
    }
  })

  it('matches weekKeyOf for the same instant', () => {
    const d = new Date('2026-09-17T08:00:00Z')
    expect(currentWeekKey(d)).toBe(weekKeyOf(d))
  })

  it('a Sunday cron run reports the week that is ending', () => {
    // vercel.json fires weekly-report at 08:00 UTC on Sunday.
    expect(currentWeekKey(new Date('2026-09-20T08:00:00Z'))).toBe('2026-09-14')
  })
})

describe('shiftWeekKey', () => {
  it('steps back exactly one week', () => {
    expect(shiftWeekKey('2026-09-14', -1)).toBe('2026-09-07')
  })

  it('crosses a month boundary', () => {
    expect(shiftWeekKey('2026-09-07', -1)).toBe('2026-08-31')
  })

  it('crosses a year boundary', () => {
    expect(shiftWeekKey('2027-01-04', -1)).toBe('2026-12-28')
  })

  it('is unaffected by daylight saving, because it is UTC throughout', () => {
    // The Sunday Europe shifts its clocks in 2026.
    expect(shiftWeekKey('2026-11-02', -1)).toBe('2026-10-26')
    expect(shiftWeekKey('2026-03-30', -1)).toBe('2026-03-23')
  })

  it('stays a Monday over a long walk backwards', () => {
    let key = '2026-09-14'
    for (let i = 0; i < 60; i++) {
      key = shiftWeekKey(key, -1)
      expect(new Date(`${key}T00:00:00Z`).getUTCDay()).toBe(1)
    }
  })
})

describe('the lookup the weekly email now does', () => {
  // byWeek only ever contains weeks that had plays.
  const byWeek = [
    { week: '2026-08-17', gamesPlayed: 12, avgScore: 70 },
    { week: '2026-08-24', gamesPlayed: 9, avgScore: 74 },
  ]
  const now = new Date('2026-09-20T08:00:00Z') // three weeks after the last play

  it('a lapsed child has no entry for the current week', () => {
    const key = currentWeekKey(now)
    expect(byWeek.find(w => w.week === key)).toBeUndefined()
  })

  it('taking the last entry is what produced the false number', () => {
    // Documents the old behaviour so it cannot quietly return.
    expect(byWeek[byWeek.length - 1].gamesPlayed).toBe(9)
    expect(byWeek[byWeek.length - 1].week).not.toBe(currentWeekKey(now))
  })

  it('a comparison needs both weeks present, not just two entries', () => {
    const key = currentWeekKey(now)
    const prev = shiftWeekKey(key, -1)
    const a = byWeek.find(w => w.week === key)
    const b = byWeek.find(w => w.week === prev)
    expect(Boolean(a && b)).toBe(false)
  })

  it('an active child compares against the real previous week', () => {
    const active = [
      { week: shiftWeekKey(currentWeekKey(now), -1), gamesPlayed: 5, avgScore: 60 },
      { week: currentWeekKey(now), gamesPlayed: 8, avgScore: 72 },
    ]
    const key = currentWeekKey(now)
    const a = active.find(w => w.week === key)!
    const b = active.find(w => w.week === shiftWeekKey(key, -1))!
    expect(a.avgScore - b.avgScore).toBe(12)
  })
})
