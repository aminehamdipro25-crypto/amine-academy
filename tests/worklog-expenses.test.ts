import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS, dueRecurring, evalAmount, isCalculation, recurringDate, sanitizeExpense, sanitizeSettings, type RecurringExpense,
} from '@/lib/worklog'

describe('calculator in the amount field', () => {
  it('sums an outing typed as it came', () => {
    expect(evalAmount('12+15+8.5')).toBe(35.5)
    expect(evalAmount(' 20 + 20 + 7 ')).toBe(47)
  })
  it('knows × ÷ and brackets, with the usual precedence', () => {
    expect(evalAmount('2×12+5')).toBe(29)
    expect(evalAmount('3*(10+2)')).toBe(36)
    expect(evalAmount('100÷4')).toBe(25)
    expect(evalAmount('50-12.5')).toBe(37.5)
  })
  it('reads Arabic-Indic digits and the Arabic decimal mark', () => {
    expect(evalAmount('١٢+٨٫٥')).toBe(20.5)
  })
  it('rejects anything that is not arithmetic, and division by zero', () => {
    for (const bad of ['', 'abc', '12+', '1++2', '5/0', 'alert(1)', '2**3', '(1+2']) expect(evalAmount(bad)).toBeNull()
  })
  it('tells a calculation from a plain number', () => {
    expect(isCalculation('12+3')).toBe(true)
    expect(isCalculation('12')).toBe(false)
    expect(isCalculation('12.5')).toBe(false)
  })
})

describe('rent and other fixed monthly expenses', () => {
  const rent: RecurringExpense = { id: 'rec_rent1', label: 'الكراء', category: 'rent', amount: 2300, day: 10, since: '2026-09' }

  it('rent is an expense category', () => {
    const e = sanitizeExpense({ date: '2026-10-10', amount: 2300, category: 'rent' })
    expect(e.ok && e.value.category).toBe('rent')
  })

  it('falls due on its day, not before', () => {
    expect(dueRecurring([rent], '2026-09-09')).toEqual([])
    expect(dueRecurring([rent], '2026-09-10').map(d => d.date)).toEqual(['2026-09-10'])
  })

  it('catches up the months missed, and never rewrites a month already written', () => {
    expect(dueRecurring([rent], '2026-11-12').map(d => d.month)).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(dueRecurring([{ ...rent, lastMonth: '2026-10' }], '2026-11-12').map(d => d.month)).toEqual(['2026-11'])
    expect(dueRecurring([{ ...rent, lastMonth: '2026-11' }], '2026-11-30')).toEqual([])
    expect(dueRecurring([{ ...rent, paused: true }], '2026-11-30')).toEqual([])
  })

  it('the 31st of a short month is its last day', () => {
    expect(recurringDate('2026-02', 31)).toBe('2026-02-28')
    expect(recurringDate('2026-04', 31)).toBe('2026-04-30')
  })

  it('settings: lastMonth is kept by the server, never taken from the request', () => {
    const current = { ...DEFAULT_SETTINGS, recurringExpenses: [{ ...rent, lastMonth: '2026-10' }] }
    const r = sanitizeSettings({ recurringExpenses: [{ ...rent, amount: 2400, lastMonth: '2020-01' }] }, current)
    expect(r.ok && r.value.recurringExpenses).toEqual([{ ...rent, amount: 2400, lastMonth: '2026-10' }])
    expect(sanitizeSettings({ recurringExpenses: [{ ...rent, amount: 0 }] }, current).ok).toBe(false)
    expect(sanitizeSettings({ recurringExpenses: [{ ...rent, day: 40 }] }, current).ok).toBe(false)
  })
})
