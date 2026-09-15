// PSC-17 scoring.
//
// This feeds a screening statement that reaches a parent, so the cases that
// matter are the cut-off boundaries and the refusal to score an incomplete
// form — a partially filled PSC-17 has an artificially low total and would
// otherwise read as a reassuring negative screen.
import { describe, it, expect } from 'vitest'
import {
  PSC17_ITEMS,
  PSC_CUTOFFS,
  SUBSCALE_IDS,
  describePsc17,
  scorePsc17,
} from '../lib/psc17-data'

/** Answer every item with the same value. */
function all(value: number): Record<number, number> {
  return Object.fromEntries(PSC17_ITEMS.map(i => [i.id, value]))
}

/** Start from all-zero and set specific items. */
function withItems(overrides: Record<number, number>): Record<number, number> {
  return { ...all(0), ...overrides }
}

describe('PSC-17 instrument shape', () => {
  it('has exactly 17 items with ids 1-17', () => {
    expect(PSC17_ITEMS).toHaveLength(17)
    expect(PSC17_ITEMS.map(i => i.id)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1))
  })

  it('assigns every item to exactly one subscale, matching the published sets', () => {
    expect(SUBSCALE_IDS.internalising).toEqual([2, 6, 9, 11, 15])
    expect(SUBSCALE_IDS.attention).toEqual([1, 3, 7, 13, 17])
    expect(SUBSCALE_IDS.externalising).toEqual([4, 5, 8, 10, 12, 14, 16])

    const assigned = [
      ...SUBSCALE_IDS.internalising,
      ...SUBSCALE_IDS.attention,
      ...SUBSCALE_IDS.externalising,
    ].sort((a, b) => a - b)
    expect(assigned).toEqual(Array.from({ length: 17 }, (_, i) => i + 1))
  })

  it('subscale ceilings equal 2 × item count', () => {
    expect(PSC_CUTOFFS.internalising.max).toBe(SUBSCALE_IDS.internalising.length * 2)
    expect(PSC_CUTOFFS.attention.max).toBe(SUBSCALE_IDS.attention.length * 2)
    expect(PSC_CUTOFFS.externalising.max).toBe(SUBSCALE_IDS.externalising.length * 2)
    expect(PSC_CUTOFFS.total.max).toBe(34)
  })

  it('carries the published English wording alongside the Arabic rendering', () => {
    for (const item of PSC17_ITEMS) {
      expect(item.textEn.length, `item ${item.id}`).toBeGreaterThan(0)
      expect(item.text.length, `item ${item.id}`).toBeGreaterThan(0)
    }
    expect(PSC17_ITEMS[0].textEn).toBe('Fidgety, unable to sit still')
    expect(PSC17_ITEMS[16].textEn).toBe('Distracted easily')
  })
})

describe('scorePsc17 totals', () => {
  it('scores an all-never form as zero and negative', () => {
    const s = scorePsc17(all(0))
    expect(s.complete).toBe(true)
    expect(s.total).toBe(0)
    expect(s.totalPositive).toBe(false)
    expect(s.positiveSubscales).toEqual([])
  })

  it('scores an all-often form at the ceiling and positive everywhere', () => {
    const s = scorePsc17(all(2))
    expect(s.total).toBe(34)
    expect(s.totalPositive).toBe(true)
    expect(s.positiveSubscales.sort()).toEqual(['attention', 'externalising', 'internalising'])
  })

  it('treats the total cut-off as at-or-above, not above', () => {
    // 15 "sometimes" answers = 15 exactly.
    const at = scorePsc17(withItems(Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [i + 1, 1]),
    )))
    expect(at.total).toBe(15)
    expect(at.totalPositive).toBe(true)

    const below = scorePsc17(withItems(Object.fromEntries(
      Array.from({ length: 14 }, (_, i) => [i + 1, 1]),
    )))
    expect(below.total).toBe(14)
    expect(below.totalPositive).toBe(false)
  })
})

describe('scorePsc17 subscales', () => {
  function sub(s: ReturnType<typeof scorePsc17>, key: string) {
    return s.subscales.find(x => x.subscale === key)!
  }

  it('flags internalising at 5, not 4', () => {
    // items 2,6,9 = 2,2,1 → 5
    const at = scorePsc17(withItems({ 2: 2, 6: 2, 9: 1 }))
    expect(sub(at, 'internalising').score).toBe(5)
    expect(sub(at, 'internalising').positive).toBe(true)

    const below = scorePsc17(withItems({ 2: 2, 6: 2 }))
    expect(sub(below, 'internalising').score).toBe(4)
    expect(sub(below, 'internalising').positive).toBe(false)
  })

  it('flags attention at 7, not 6', () => {
    const at = scorePsc17(withItems({ 1: 2, 3: 2, 7: 2, 13: 1 }))
    expect(sub(at, 'attention').score).toBe(7)
    expect(sub(at, 'attention').positive).toBe(true)

    const below = scorePsc17(withItems({ 1: 2, 3: 2, 7: 2 }))
    expect(sub(below, 'attention').score).toBe(6)
    expect(sub(below, 'attention').positive).toBe(false)
  })

  it('flags externalising at 7, not 6', () => {
    const at = scorePsc17(withItems({ 4: 2, 5: 2, 8: 2, 10: 1 }))
    expect(sub(at, 'externalising').score).toBe(7)
    expect(sub(at, 'externalising').positive).toBe(true)

    const below = scorePsc17(withItems({ 4: 2, 5: 2, 8: 2 }))
    expect(sub(below, 'externalising').score).toBe(6)
    expect(sub(below, 'externalising').positive).toBe(false)
  })

  it('reproduces the published worked example (total 15, attention 9)', () => {
    // Attention 9 (1,3,7,13,17 = 2,2,2,2,1), internalising 3, externalising 3.
    const s = scorePsc17(withItems({
      1: 2, 3: 2, 7: 2, 13: 2, 17: 1,   // attention 9
      2: 2, 6: 1,                        // internalising 3
      4: 2, 5: 1,                        // externalising 3
    }))
    expect(s.total).toBe(15)
    expect(s.totalPositive).toBe(true)
    expect(sub(s, 'attention').score).toBe(9)
    expect(sub(s, 'attention').positive).toBe(true)
    expect(sub(s, 'internalising').score).toBe(3)
    expect(sub(s, 'internalising').positive).toBe(false)
    expect(sub(s, 'externalising').score).toBe(3)
    expect(sub(s, 'externalising').positive).toBe(false)
  })

  it('catches internalising distress that a low total would hide', () => {
    // The whole reason this scale was added: total is far below 15, yet the
    // internalising subscale is over its cut-off and must still be flagged.
    const s = scorePsc17(withItems({ 2: 2, 6: 2, 9: 2, 11: 2, 15: 2 }))
    expect(s.total).toBe(10)
    expect(s.totalPositive).toBe(false)
    expect(sub(s, 'internalising').positive).toBe(true)
    expect(s.positiveSubscales).toEqual(['internalising'])
  })
})

describe('incomplete and malformed forms', () => {
  it('refuses to call a partial form complete', () => {
    const partial = { 1: 2, 2: 2, 3: 2 }
    const s = scorePsc17(partial)
    expect(s.complete).toBe(false)
    expect(s.answered).toBe(3)
  })

  it('ignores out-of-range and non-numeric answers rather than coercing them', () => {
    const s = scorePsc17({ ...all(0), 1: 5, 2: -1, 3: NaN as never, 4: '2' as never })
    // Four items rejected, so the form is not complete and none contributed.
    expect(s.complete).toBe(false)
    expect(s.answered).toBe(13)
    expect(s.total).toBe(0)
  })

  it('scores an empty form as incomplete, not as a clean negative screen', () => {
    const s = scorePsc17({})
    expect(s.complete).toBe(false)
    expect(s.total).toBe(0)
    expect(describePsc17(s)).toContain('غير مكتمل')
  })
})

describe('describePsc17', () => {
  it('never claims a diagnosis on a positive screen', () => {
    const text = describePsc17(scorePsc17(all(2)))
    expect(text).toContain('لا يعني تشخيصاً')
    expect(text).not.toContain('مصاب')
  })

  it('does not present a negative screen as proof nothing is wrong', () => {
    const text = describePsc17(scorePsc17(all(0)))
    expect(text).toContain('لا يعني هذا غياب صعوبة')
  })

  it('names the subscale that crossed its cut-off', () => {
    const text = describePsc17(scorePsc17(withItems({ 2: 2, 6: 2, 9: 2, 11: 2, 15: 2 })))
    expect(text).toContain('الأعراض الداخلية')
  })
})
