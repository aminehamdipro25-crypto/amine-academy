import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings, type WorkClient, type WorkExpense, type WorkLesson } from '@/lib/worklog'
import { budgetStatus, eveningDue, eveningMessage, unmarkedLessons } from '@/lib/worklog-evening'

const L = (id: string, date: string, start: string, status: WorkLesson['status'] = 'scheduled', price = 120) =>
  ({ id, clientId: 'k', date, start, durationMin: 60, price, status, reminderMin: 60, createdAt: '', updatedAt: '' }) as WorkLesson
const fam = [{ id: 'k', name: 'أبو خالد', childName: 'خالد', hourlyRate: 120, color: '#7C5CFC', createdAt: '' }] as WorkClient[]
const E = (date: string, amount: number, category: WorkExpense['category'] = 'food', recurringId?: string) =>
  ({ id: `${date}${amount}${category}`, date, amount, category, createdAt: '', ...(recurringId ? { recurringId } : {}) }) as WorkExpense

describe('the evening check — lessons that are over and still «مجدولة»', () => {
  const lessons = [
    L('a', '2026-10-12', '10:30'),            // ended
    L('b', '2026-10-12', '20:30'),            // ends 21:30 — exactly now: over
    L('c', '2026-10-12', '21:00'),            // still running
    L('d', '2026-10-12', '09:00', 'done'),    // marked
    L('e', '2026-10-08', '16:00'),            // forgotten days ago
    L('f', '2026-10-09', '16:00', 'cancelled'),
    L('g', '2026-10-14', '16:00'),            // ahead
  ]
  it('lists today’s ended lessons and every earlier one; marked, running and future ones stay out', () => {
    const u = unmarkedLessons(lessons, '2026-10-12', 21 * 60 + 30)
    expect(u.today.map(l => l.id)).toEqual(['a', 'b'])
    expect(u.earlier.map(l => l.id)).toEqual(['e'])
  })

  it('runs from its hour until midnight; null turns it off; absent means 21:30', () => {
    expect(eveningDue(undefined, 21 * 60 + 29)).toBe(false)
    expect(eveningDue(undefined, 21 * 60 + 30)).toBe(true)
    expect(eveningDue('20:00', 23 * 60 + 59)).toBe(true)
    expect(eveningDue(null, 23 * 60)).toBe(false)
  })

  it('says what is at stake and why, with today’s spending and the budget — and nothing when all is marked', () => {
    const u = unmarkedLessons(lessons, '2026-10-12', 21 * 60 + 30)
    const budget = budgetStatus([E('2026-10-12', 20), E('2026-10-02', 400)], { amount: 600, categories: ['food'] }, '2026-10-12', '2026-10-12')
    const m = eveningMessage({ unmarked: u, clients: fam, currency: 'QAR', link: 'https://x/dashboard/work-log', spentToday: 20, budget })!
    expect(m.telegram).toContain('10:30–11:30 خالد — أبو خالد')
    expect(m.telegram).toContain('من أيام سابقة')
    expect(m.telegram).toContain('360') // three lessons × 120 not counted yet
    expect(m.telegram).toContain('لا تدخل الدخل ولا المستحقات')
    expect(m.telegram).toContain('صرفت اليوم 20')
    expect(m.telegram).toContain('بقي من ميزانية الشهر 180')
    expect(m.html).toContain('dir="rtl"')
    expect(eveningMessage({ unmarked: { today: [], earlier: [] }, clients: fam, currency: 'QAR', link: '', spentToday: 50 })).toBeNull()
  })

  it('a family name cannot inject Telegram markup', () => {
    const evil = [{ ...fam[0], name: '<a href="x">هنا</a>' }] as WorkClient[]
    const m = eveningMessage({ unmarked: { today: [L('a', '2026-10-12', '10:30')], earlier: [] }, clients: evil, currency: 'QAR', link: 'L', spentToday: 0 })!
    expect(m.telegram).not.toContain('<a href="x">')
    expect(m.html).not.toContain('<a href="x">')
  })

  it('the route only marks the day sent after a channel accepted it, and is scheduled both ways', () => {
    const src = readFileSync('app/api/cron/worklog-evening/route.ts', 'utf8')
    expect(src.indexOf('redis.set(dedupKey')).toBeGreaterThan(src.indexOf('if (!channels.length)'))
    expect(readFileSync('vercel.json', 'utf8')).toContain('/api/cron/worklog-evening')
    expect(readFileSync('.github/workflows/worklog-reminders.yml', 'utf8')).toContain('/api/cron/worklog-evening')
  })
})

describe('the monthly budget for day-to-day expenses', () => {
  const b = { amount: 600, categories: ['food', 'transport'] as WorkExpense['category'][] }
  const ex = [
    E('2026-10-01', 2300, 'rent', 'rec_rent'), // fixed monthly: never counts
    E('2026-10-02', 75, 'phone', 'rec_phone'),
    E('2026-10-03', 100, 'food'),
    E('2026-10-05', 50, 'transport'),
    E('2026-10-05', 90, 'materials'),           // not a budget category
    E('2026-10-12', 30, 'food'),
    E('2026-09-30', 500, 'food'),               // another month
  ]
  it('counts only its categories in that month, never fixed monthly expenses', () => {
    const s = budgetStatus(ex, b, '2026-10-12', '2026-10-12')
    expect(s.spent).toBe(180)
    expect(s.left).toBe(420)
    expect(s.today).toBe(30)
    expect(s.state).toBe('ok')
  })
  it('spreads what is left over the days to come, today included, and projects the pace from the 7th day', () => {
    const s = budgetStatus(ex, b, '2026-10-12', '2026-10-12')
    expect(s.daysLeft).toBe(20) // 12 → 31
    expect(s.perDayLeft).toBe(21)
    expect(s.projected).toBe(465) // 180 / 12 × 31
    expect(budgetStatus(ex, b, '2026-10-05', '2026-10-05').projected).toBeNull()
  })
  it('warns from 80% and says by how much it is over', () => {
    expect(budgetStatus([E('2026-10-03', 480)], b, '2026-10-12', '2026-10-12').state).toBe('near')
    const over = budgetStatus([E('2026-10-03', 650)], b, '2026-10-12', '2026-10-12')
    expect(over.state).toBe('over'); expect(over.left).toBe(-50); expect(over.perDayLeft).toBeNull()
  })
  it('a past month has no days left and no projection', () => {
    const s = budgetStatus(ex, b, '2026-09-10', '2026-10-12')
    expect(s.spent).toBe(500); expect(s.daysLeft).toBe(0); expect(s.projected).toBeNull(); expect(s.today).toBe(0)
  })
  it('settings: a budget needs an amount and a category; the evening hour is checked', () => {
    const ok = sanitizeSettings({ expenseBudget: { amount: '600', categories: ['food', 'nope'] }, eveningCheckAt: '22:00' }, DEFAULT_SETTINGS)
    expect(ok.ok && ok.value.expenseBudget).toEqual({ amount: 600, categories: ['food'] })
    expect(ok.ok && ok.value.eveningCheckAt).toBe('22:00')
    expect(sanitizeSettings({ expenseBudget: { amount: 600, categories: [] } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ expenseBudget: { amount: -5, categories: ['food'] } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ eveningCheckAt: '25:00' }, DEFAULT_SETTINGS).ok).toBe(false)
    const off = sanitizeSettings({ expenseBudget: null, eveningCheckAt: null }, DEFAULT_SETTINGS)
    expect(off.ok && off.value.expenseBudget).toBeNull()
    expect(off.ok && off.value.eveningCheckAt).toBeNull()
  })
})
