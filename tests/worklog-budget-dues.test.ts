import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeClient, sanitizeSettings, type ExpenseBudget, type WorkExpense } from '@/lib/worklog'
import { budgetDigestLines, budgetStatus, categoryBudgets, limitsExceedTotal } from '@/lib/worklog-evening'
import { DUES_REMIND_COOLDOWN_DAYS, duesReminderText, remindedRecently } from '@/lib/worklog-planning'

let n = 0
const E = (date: string, amount: number, category: WorkExpense['category'], recurringId?: string) =>
  ({ id: `x${++n}`, date, amount, category, createdAt: '', ...(recurringId ? { recurringId } : {}) }) as WorkExpense

const budget: ExpenseBudget = { amount: 1000, categories: ['food', 'transport'], limits: { food: 600, transport: 300, marketing: 200 } }
const ex = [
  E('2026-11-02', 480, 'food'), E('2026-11-10', 30, 'food'),     // food 510 of 600 — 85%
  E('2026-11-03', 100, 'transport'),                              // transport 100 of 300
  E('2026-11-04', 250, 'marketing'),                              // over its own ceiling, outside the total
  E('2026-11-01', 2300, 'rent', 'rec_rent'),                      // fixed: never counts
]

describe('a ceiling per category', () => {
  it('each category against its own ceiling, the most pressing first; fixed expenses never count', () => {
    const c = categoryBudgets(ex, budget, '2026-11-10', '2026-11-10')
    expect(c.map(x => [x.category, x.spent, x.left, x.state])).toEqual([
      ['marketing', 250, -50, 'over'], ['food', 510, 90, 'near'], ['transport', 100, 200, 'ok'],
    ])
    expect(c.find(x => x.category === 'marketing')!.inTotal).toBe(false)
  })
  it('today’s share of a category is measured from this morning, like the total', () => {
    // food: 480 before today, 600 ceiling, 21 days left with the 10th → (600 − 480) / 21 = 5.71; spent 30 today
    const food = categoryBudgets(ex, budget, '2026-11-10', '2026-11-10').find(x => x.category === 'food')!
    expect(food.todayShare).toBe(5.71); expect(food.today).toBe(30); expect(food.todayLeft).toBe(-24.29)
  })
  it('warns when the ceilings inside the total add up to more than the total — ceilings outside it do not count', () => {
    expect(limitsExceedTotal(budget)).toBeNull() // 600 + 300 = 900 ≤ 1000; marketing is outside
    expect(limitsExceedTotal({ ...budget, amount: 800 })).toBe(900)
  })
  it('settings keep valid ceilings only, and reject a bad one by name', () => {
    const ok = sanitizeSettings({ expenseBudget: { amount: 1000, categories: ['food'], limits: { food: '600', transport: '', casino: 5, marketing: 0 } } }, DEFAULT_SETTINGS)
    expect(ok.ok && ok.value.expenseBudget).toEqual({ amount: 1000, categories: ['food'], limits: { food: 600 } })
    const bad = sanitizeSettings({ expenseBudget: { amount: 1000, categories: ['food'], limits: { food: -3 } } }, DEFAULT_SETTINGS)
    expect(bad.ok).toBe(false); expect(!bad.ok && bad.error).toContain('أكل')
    const none = sanitizeSettings({ expenseBudget: { amount: 1000, categories: ['food'] } }, DEFAULT_SETTINGS)
    expect(none.ok && none.value.expenseBudget && 'limits' in none.value.expenseBudget).toBe(false)
  })
})

describe('the morning message says what can be spent today', () => {
  it('today’s share and the month left, then only the categories near or over their ceiling', () => {
    const st = budgetStatus(ex, budget, '2026-11-10', '2026-11-10')
    const lines = budgetDigestLines(st, categoryBudgets(ex, budget, '2026-11-10', '2026-11-10'), 'QAR')
    // total: 1000 − (610 − 30 today) = 420 left this morning ÷ 21 days = 20
    expect(lines[0]).toContain('يمكنك أن تصرف اليوم 20')
    expect(lines.some(l => l.includes('إعلانات وتسويق') && l.includes('تجاوزت سقفها بـ50'))).toBe(true)
    expect(lines.some(l => l.includes('أكل') && l.includes('بقي 90'))).toBe(true)
    expect(lines.some(l => l.includes('تنقّل'))).toBe(false)
  })
  it('over the month: says so instead of a share', () => {
    const st = budgetStatus([E('2026-11-02', 1200, 'food')], budget, '2026-11-10', '2026-11-10')
    expect(budgetDigestLines(st, [], 'QAR')[0]).toContain('تجاوزت ميزانية الشهر بـ200')
  })
  it('the digest route reads the budget and no longer stays silent on a day without lessons when a budget is set', () => {
    const src = readFileSync('app/api/cron/worklog-digest/route.ts', 'utf8')
    expect(src).toContain('budgetDigestLines(')
    expect(src).toContain('!budgetLines.length')
  })
})

describe('reminding families of what they owe', () => {
  it('a polite message with the amount, the lessons and since when', () => {
    const t = duesReminderText({ name: 'أبو خالد', childName: 'خالد' }, { balance: 360, unpaidLessons: 3, oldestUnpaidDate: '2026-10-05' }, 'QAR', d => `«${d}»`, 'الأستاذ أمين')
    expect(t.startsWith('السلام عليكم ورحمة الله وبركاته')).toBe(true)
    expect(t).toContain('رصيد حصص خالد المستحق حتى اليوم هو 360')
    expect(t).toContain('عن 3 حصص منذ «2026-10-05»')
    expect(t).toContain('في الوقت الذي يناسبكم')
    expect(t.trim().endsWith('الأستاذ أمين')).toBe(true)
  })
  it('the reminder time is the server’s, and a recent one keeps the family out of «ذكّر الكل»', () => {
    const r = sanitizeClient({ duesReminded: true, duesRemindedAt: '2020-01-01T00:00:00Z' }, true)
    expect(r.ok && r.value.duesRemindedAt && r.value.duesRemindedAt > '2026').toBe(true)
    expect(remindedRecently({ duesRemindedAt: '2026-11-08T10:00:00Z' }, '2026-11-10')).toBe(true)
    expect(remindedRecently({ duesRemindedAt: '2026-11-01T10:00:00Z' }, '2026-11-10')).toBe(DUES_REMIND_COOLDOWN_DAYS > 9)
    expect(remindedRecently({}, '2026-11-10')).toBe(false)
  })
})
