// APA session records: what a specialist files after a physical-activity
// session, and how it rolls up into the parent's report.
//
// These numbers reach a parent's document, so the rules that matter are:
// nothing enters a record that the authored plan does not contain, and a single
// session never reads as a trend.
import { describe, it, expect } from 'vitest'
import {
  filterApaRecordsByPeriod,
  normalizeDate,
  resolveBand,
  sanitizeApaRecord,
  summarizeApaRecords,
} from '../lib/apa-record'
import { indicatorTrend } from '../lib/apa-trend'
import { apaPlanData } from '../lib/apa-plan-data'
import type { ApaSessionRecord } from '../lib/types'

const BAND = '6 - 9 سنوات'
const group = apaPlanData.adhd.groups.find(g => g.range === BAND)!
const PHASE_A = group.session[0].phase
const PHASE_B = group.session[1].phase
const IND_A = group.indicators[0]
const IND_B = group.indicators[1]

function rec(over: Partial<ApaSessionRecord> = {}): ApaSessionRecord {
  return {
    id: 'APA-1',
    studentId: 'S1',
    condition: 'adhd',
    band: BAND,
    date: '2026-01-10',
    phasesCompleted: [PHASE_A],
    phasesTotal: group.session.length,
    indicators: [{ label: IND_A, score: 3 }],
    minutes: 60,
    notes: '',
    createdAt: '2026-01-10T10:00:00.000Z',
    ...over,
  }
}

describe('sanitizeApaRecord', () => {
  it('accepts a well-formed record', () => {
    const out = sanitizeApaRecord(
      { condition: 'adhd', band: BAND, date: '2026-01-10', phasesCompleted: [PHASE_A], indicators: [{ label: IND_A, score: 4 }], minutes: 55 },
      'S1',
    )
    expect(out).not.toBeNull()
    expect(out!.phasesCompleted).toEqual([PHASE_A])
    expect(out!.indicators).toEqual([{ label: IND_A, score: 4 }])
    expect(out!.phasesTotal).toBe(group.session.length)
    expect(out!.minutes).toBe(55)
  })

  it('rejects an unknown condition', () => {
    expect(sanitizeApaRecord({ condition: 'other', band: BAND }, 'S1')).toBeNull()
  })

  it('rejects a band that is not authored for that condition', () => {
    expect(sanitizeApaRecord({ condition: 'adhd', band: 'لا وجود لها' }, 'S1')).toBeNull()
    // A real ASD-only band must not be accepted under adhd if the plans diverge.
    const asdBands = apaPlanData.asd.groups.map(g => g.range)
    const adhdBands = new Set(apaPlanData.adhd.groups.map(g => g.range))
    for (const b of asdBands.filter(b => !adhdBands.has(b))) {
      expect(sanitizeApaRecord({ condition: 'adhd', band: b }, 'S1')).toBeNull()
    }
  })

  it('drops phase names that are not in the plan', () => {
    const out = sanitizeApaRecord(
      { condition: 'adhd', band: BAND, phasesCompleted: [PHASE_A, 'مرحلة مخترعة', '<script>x</script>'] },
      'S1',
    )
    expect(out!.phasesCompleted).toEqual([PHASE_A])
  })

  it('drops indicator labels that are not in the plan', () => {
    const out = sanitizeApaRecord(
      { condition: 'adhd', band: BAND, indicators: [{ label: IND_A, score: 5 }, { label: 'مؤشر مزيّف', score: 5 }] },
      'S1',
    )
    expect(out!.indicators).toEqual([{ label: IND_A, score: 5 }])
  })

  it('deduplicates repeated phases and indicators', () => {
    const out = sanitizeApaRecord(
      {
        condition: 'adhd', band: BAND,
        phasesCompleted: [PHASE_A, PHASE_A, PHASE_B],
        indicators: [{ label: IND_A, score: 5 }, { label: IND_A, score: 1 }],
      },
      'S1',
    )
    expect(out!.phasesCompleted).toEqual([PHASE_A, PHASE_B])
    // First rating wins — a duplicate must not silently overwrite it.
    expect(out!.indicators).toEqual([{ label: IND_A, score: 5 }])
  })

  it('clamps out-of-range scores and minutes', () => {
    const out = sanitizeApaRecord(
      { condition: 'adhd', band: BAND, indicators: [{ label: IND_A, score: 99 }], minutes: 99999 },
      'S1',
    )
    expect(out!.indicators[0].score).toBe(5)
    expect(out!.minutes).toBe(300)

    const low = sanitizeApaRecord(
      { condition: 'adhd', band: BAND, indicators: [{ label: IND_A, score: -4 }], minutes: -10 },
      'S1',
    )
    expect(low!.indicators[0].score).toBe(1)
    expect(low!.minutes).toBe(0)
  })

  it('caps the notes field', () => {
    const out = sanitizeApaRecord({ condition: 'adhd', band: BAND, notes: 'ب'.repeat(5000) }, 'S1')
    expect(out!.notes.length).toBe(2000)
  })

  it('always files under the server-supplied student, never the body', () => {
    const out = sanitizeApaRecord({ condition: 'adhd', band: BAND, studentId: 'ATTACKER' }, 'S1')
    expect(out!.studentId).toBe('S1')
  })
})

describe('normalizeDate', () => {
  it('keeps a valid calendar date', () => {
    expect(normalizeDate('2026-03-04')).toBe('2026-03-04')
  })
  it('falls back to today for junk or impossible dates', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(normalizeDate('not-a-date')).toBe(today)
    expect(normalizeDate('2026-13-45')).toBe(today)
    expect(normalizeDate(undefined)).toBe(today)
  })
})

describe('resolveBand', () => {
  it('finds every authored band for both conditions', () => {
    for (const cond of ['adhd', 'asd'] as const) {
      for (const g of apaPlanData[cond].groups) {
        expect(resolveBand(cond, g.range)?.range).toBe(g.range)
      }
    }
  })
})

describe('summarizeApaRecords', () => {
  it('returns null for an empty period so the report omits the section', () => {
    expect(summarizeApaRecords([])).toBeNull()
  })

  it('sums sessions, minutes and adherence across records', () => {
    const s = summarizeApaRecords([
      rec({ id: 'a', phasesCompleted: [PHASE_A], minutes: 60 }),
      rec({ id: 'b', date: '2026-01-17', phasesCompleted: [PHASE_A, PHASE_B], minutes: 45 }),
    ])!
    expect(s.sessions).toBe(2)
    expect(s.minutes).toBe(105)
    // 3 completed of 2 × 5 planned = 30%
    expect(s.adherencePct).toBe(Math.round((3 / (group.session.length * 2)) * 100))
  })

  it('orders indicator history by date, not by array order', () => {
    const s = summarizeApaRecords([
      rec({ id: 'late', date: '2026-02-01', indicators: [{ label: IND_A, score: 5 }] }),
      rec({ id: 'early', date: '2026-01-01', indicators: [{ label: IND_A, score: 2 }] }),
    ])!
    const ind = s.indicators.find(i => i.label === IND_A)!
    expect(ind.first).toBe(2)
    expect(ind.last).toBe(5)
    expect(ind.avg).toBe(3.5)
    expect(indicatorTrend(ind)).toBe('up')
  })

  it('breaks a same-day tie by creation time', () => {
    const s = summarizeApaRecords([
      rec({ id: 'pm', createdAt: '2026-01-10T18:00:00.000Z', indicators: [{ label: IND_A, score: 4 }] }),
      rec({ id: 'am', createdAt: '2026-01-10T08:00:00.000Z', indicators: [{ label: IND_A, score: 1 }] }),
    ])!
    const ind = s.indicators.find(i => i.label === IND_A)!
    expect(ind.first).toBe(1)
    expect(ind.last).toBe(4)
  })

  it('labels the child with the most recent band, not the one they left', () => {
    const s = summarizeApaRecords([
      rec({ id: 'old', date: '2026-01-01', band: BAND }),
      rec({ id: 'new', date: '2026-06-01', band: '9 - 12 سنة', condition: 'adhd' }),
    ])!
    expect(s.band).toBe('9 - 12 سنة')
  })

  it('handles a record with no rated indicators', () => {
    const s = summarizeApaRecords([rec({ indicators: [] })])!
    expect(s.sessions).toBe(1)
    expect(s.indicators).toEqual([])
  })

  it('reports 0% adherence rather than NaN when nothing was planned', () => {
    const s = summarizeApaRecords([rec({ phasesCompleted: [], phasesTotal: 0 })])!
    expect(s.adherencePct).toBe(0)
  })
})

describe('indicatorTrend', () => {
  it('calls a single rating insufficient, never stable', () => {
    expect(indicatorTrend({ label: IND_A, avg: 3, first: 3, last: 3, count: 1 })).toBe('insufficient')
  })
  it('distinguishes up, down and genuinely stable', () => {
    expect(indicatorTrend({ label: IND_A, avg: 3, first: 2, last: 4, count: 2 })).toBe('up')
    expect(indicatorTrend({ label: IND_A, avg: 3, first: 4, last: 2, count: 2 })).toBe('down')
    expect(indicatorTrend({ label: IND_A, avg: 3, first: 3, last: 3, count: 2 })).toBe('stable')
  })
})

describe('filterApaRecordsByPeriod', () => {
  const records = [
    rec({ id: 'before', date: '2025-12-31' }),
    rec({ id: 'start', date: '2026-01-01' }),
    rec({ id: 'mid', date: '2026-01-15' }),
    rec({ id: 'end', date: '2026-01-31' }),
    rec({ id: 'after', date: '2026-02-01' }),
  ]

  it('includes both boundaries', () => {
    const ids = filterApaRecordsByPeriod(records, '2026-01-01', '2026-01-31').map(r => r.id)
    expect(ids).toEqual(['start', 'mid', 'end'])
  })

  it('supports a single-day period', () => {
    const ids = filterApaRecordsByPeriod(records, '2026-01-15', '2026-01-15').map(r => r.id)
    expect(ids).toEqual(['mid'])
  })

  it('returns nothing for a period with no sessions', () => {
    expect(filterApaRecordsByPeriod(records, '2026-03-01', '2026-03-31')).toEqual([])
  })
})
