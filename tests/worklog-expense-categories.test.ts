import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import {
  EXPENSE_CATEGORIES, EXPENSE_LABEL, EXPENSE_META, expensesByGroup, frequentItems, sanitizeExpense, sanitizeSettings, DEFAULT_SETTINGS,
  type WorkExpense,
} from '@/lib/worklog'

let n = 0
const E = (date: string, category: WorkExpense['category'], items: [string | undefined, number][], extra: Partial<WorkExpense> = {}) =>
  ({ id: `e${++n}`, date, category, amount: items.reduce((s, [, a]) => s + a, 0), items: items.map(([label, amount]) => ({ label, amount })), createdAt: `${date}T0${n % 10}:00`, ...extra }) as WorkExpense

describe('expense categories', () => {
  it('ads, books, family transfers and the rest are real categories the server keeps', () => {
    for (const c of ['marketing', 'learning', 'family', 'health', 'household'] as const) {
      const r = sanitizeExpense({ date: '2026-10-31', category: c, amount: 50 })
      expect(r.ok && r.value.category).toBe(c)
    }
    const unknown = sanitizeExpense({ date: '2026-10-31', category: 'casino', amount: 50 })
    expect(unknown.ok && unknown.value.category).toBe('other')
  })

  it('every category has an icon, a group and an item list in the form — none is added and forgotten', () => {
    const form = readFileSync('components/worklog/ExpenseForm.tsx', 'utf8')
    for (const c of EXPENSE_CATEGORIES) {
      expect(EXPENSE_META[c].icon).toBeTruthy()
      expect(EXPENSE_LABEL[c]).toBeTruthy()
      if (c !== 'other') expect(form).toMatch(new RegExp(`\\n\\s+${c}: \\[`))
    }
  })

  it('a new budget counts day-to-day spending, not rent, money sent home or an ad campaign', () => {
    expect(EXPENSE_CATEGORIES.filter(c => !EXPENSE_META[c].daily).sort()).toEqual(['family', 'marketing', 'rent'])
    const r = sanitizeSettings({ expenseBudget: { amount: 600, categories: ['household', 'health'] } }, DEFAULT_SETTINGS)
    expect(r.ok && r.value.expenseBudget?.categories).toEqual(['household', 'health'])
  })

  it('work costs and personal spending are summed apart, in a fixed order', () => {
    const g = expensesByGroup([
      { category: 'family', amount: 500 }, { category: 'marketing', amount: 150 }, { category: 'transport', amount: 30.5 },
      { category: 'food', amount: 20 }, { category: 'other', amount: 5 },
    ])
    expect(g).toEqual([{ group: 'work', amount: 180.5 }, { group: 'personal', amount: 520 }, { group: 'other', amount: 5 }])
    expect(expensesByGroup([{ category: 'food', amount: 9 }])).toEqual([{ group: 'personal', amount: 9 }])
  })
})

describe('the owner’s own items come first', () => {
  const ex = [
    E('2026-10-01', 'transport', [['أوبر', 12], ['مواقف', 5]]),
    E('2026-10-05', 'transport', [['أوبر', 14], [undefined, 3]]),
    E('2026-10-09', 'transport', [['اوبر'.replace('ا', 'أ'), 15], ['مترو', 2]]),
    E('2026-10-10', 'marketing', [['إعلان واتساب', 150]]),
    E('2026-10-11', 'transport', [['الكراء', 2300]], { recurringId: 'rec_x' }),
  ]
  it('most used first with the last amount paid; unnamed amounts, other categories and fixed expenses stay out', () => {
    const f = frequentItems(ex, 'transport')
    expect(f[0]).toEqual({ label: 'أوبر', lastAmount: 15, count: 3 })
    expect(f.map(x => x.label)).toEqual(['أوبر', 'مترو', 'مواقف']) // ties: the most recent first
    expect(frequentItems(ex, 'marketing')).toEqual([{ label: 'إعلان واتساب', lastAmount: 150, count: 1 }])
    expect(frequentItems(ex, 'food')).toEqual([])
  })
  it('keeps the list short', () => {
    const many = Array.from({ length: 10 }, (_, i) => E(`2026-10-${String(i + 1).padStart(2, '0')}`, 'food', [[`بند ${i}`, i + 1]]))
    expect(frequentItems(many, 'food')).toHaveLength(6)
  })
})
