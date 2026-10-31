import { describe, expect, it } from 'vitest'
import { travelMinutes, type WorkClient, type WorkExpense, type WorkLesson } from '@/lib/worklog'
import { familyProfit, nextMonthOutlook, profitSummary } from '@/lib/worklog-profit'

let n = 0
const L = (clientId: string, date: string, start: string, status: WorkLesson['status'], price: number, extra: Partial<WorkLesson> = {}) =>
  ({ id: `l${++n}`, clientId, date, start, durationMin: 60, price, status, reminderMin: null, createdAt: '', updatedAt: '', ...extra }) as WorkLesson
const C = (id: string, lat?: number, lng?: number) => ({ id, name: id, hourlyRate: 100, color: '#000', createdAt: '', ...(lat ? { location: { lat, lng } } : {}) }) as WorkClient
const E = (date: string, amount: number, category: WorkExpense['category'], recurringId?: string) =>
  ({ id: `e${++n}`, date, amount, category, createdAt: '', ...(recurringId ? { recurringId } : {}) }) as WorkExpense

// a near b (≈ 3 km); c has no pin
const a = C('a', 25.28, 51.52), b = C('b', 25.30, 51.53), c = C('c')
const drive = travelMinutes(a.location!, b.location!)
const lessons = [
  L('a', '2026-11-03', '15:00', 'done', 120), L('b', '2026-11-03', '16:30', 'done', 100),   // a → b: one drive, into b
  L('a', '2026-11-05', '15:00', 'done', 120), L('a', '2026-11-05', '16:00', 'done', 120),   // same family twice: no drive
  L('c', '2026-11-06', '10:00', 'done', 150), L('b', '2026-11-06', '12:00', 'done', 100),   // c has no pin: no estimate
  L('b', '2026-11-10', '16:00', 'cancelled', 100, { charged: true }),                      // charged: value, no time
  L('b', '2026-11-12', '16:00', 'cancelled', 100),                                          // lost
  L('a', '2026-11-20', '16:00', 'scheduled', 120),                                          // not yet work
]
const expenses = [E('2026-11-02', 40, 'transport'), E('2026-11-04', 300, 'marketing'), E('2026-11-17', 165, 'phone', 'rec_net'), E('2026-11-05', 500, 'family'), E('2026-11-06', 30, 'food')]

describe('what an hour of work really earns', () => {
  const s = profitSummary(lessons, expenses, [a, b, c], '2026-11-01', '2026-11-30')
  it('earned counts done lessons and charged cancellations; hours count only lessons taught', () => {
    expect(s.earned).toBe(810)          // 120+100+120+120+150+100 + 100 charged
    expect(s.minutesDone).toBe(360)     // six lessons taught
  })
  it('only work expenses come off — fixed work costs included, family transfers and food not', () => {
    expect(s.workExpenses).toBe(505)    // 40 + 300 + 165
    expect(s.profit).toBe(305)
  })
  it('three honest rates: as charged, after work expenses, and counting the drive between homes', () => {
    expect(s.travelMin).toBe(drive)     // only a → b on the 3rd
    expect(s.hourlyGross).toBe(135)     // 810 / 6
    expect(s.hourlyAfterExpenses).toBe(50.83) // 305 / 6
    expect(s.hourlyReal).toBe(Math.round((305 / ((360 + drive) / 60)) * 100) / 100)
  })
  it('no hours, no rate — never a division by zero', () => {
    expect(profitSummary([], [], [], '2026-11-01', '2026-11-30').hourlyReal).toBeNull()
  })
})

describe('family by family', () => {
  const f = familyProfit(lessons, [a, b, c], '2026-11-01', '2026-11-30')
  it('the drive is charged to the family it leads to, and cancellations are counted against the family', () => {
    const fb = f.find(x => x.clientId === 'b')!
    expect(fb.lessonsDone).toBe(2); expect(fb.travelMin).toBe(drive); expect(fb.earned).toBe(300)
    expect(fb.cancelled).toBe(2); expect(fb.cancelRate).toBe(0.5); expect(fb.lost).toBe(100)
    const fa = f.find(x => x.clientId === 'a')!
    expect(fa.travelMin).toBe(0); expect(fa.hourly).toBe(120); expect(fa.hourlyReal).toBe(120)
  })
  it('best real hourly first; a charged cancellation earns without taking time; scheduled-only families are not listed', () => {
    // b: 300 for 2 h taught + one drive — the charged cancellation lifts it above a's plain 120
    expect(f.map(x => x.clientId)).toEqual(['c', 'b', 'a'])
    expect(f.find(x => x.clientId === 'b')!.hourly).toBe(150)
    expect(f.find(x => x.clientId === 'b')!.hourlyReal!).toBeLessThan(150)
  })
})

describe('next month before it starts', () => {
  const history = [
    L('a', '2026-10-05', '16:00', 'done', 120), L('a', '2026-10-12', '16:00', 'done', 120),
    L('a', '2026-10-19', '16:00', 'done', 120), L('a', '2026-10-26', '16:00', 'done', 120), // weeks of 5/12/19/26 Oct
    L('b', '2026-10-21', '16:00', 'cancelled', 100),                                          // worth nothing
    L('a', '2026-11-04', '16:00', 'scheduled', 120), L('a', '2026-11-11', '16:00', 'scheduled', 120),
  ]
  const recurring = [
    { id: 'rec_r', label: 'الكراء', category: 'rent' as const, amount: 2300, day: 10, since: '2026-01' },
    { id: 'rec_x', label: 'متوقف', category: 'phone' as const, amount: 50, day: 1, since: '2026-01', paused: true },
    { id: 'rec_n', label: 'جديد', category: 'phone' as const, amount: 20, day: 1, since: '2026-12' },
  ]
  it('booked, the pace of the last four full weeks, fixed costs and the budget', () => {
    // today Sat 31 Oct: this week starts Mon 26 Oct, so the four weeks are 28 Sep – 25 Oct (5, 12, 19 Oct)
    const o = nextMonthOutlook(history, recurring, 1850, '2026-10-31')
    expect(o.month).toBe('2026-11-01')
    expect(o.booked).toBe(2); expect(o.bookedValue).toBe(240)
    expect(o.weeklyPace).toBe(90); expect(o.paceValue).toBe(385.71) // 360 / 4 = 90 a week × 30 / 7
    expect(o.fixed).toBe(2300)       // paused left out, a fixed cost starting later left out
    expect(o.leftIfBooked).toBe(240 - 2300 - 1850)
    expect(o.leftAtPace).toBe(Math.round((385.71 - 4150) * 100) / 100)
  })
  it('without any history there is no pace to speak of', () => {
    expect(nextMonthOutlook([], [], null, '2026-10-31').paceValue).toBeNull()
  })
})
