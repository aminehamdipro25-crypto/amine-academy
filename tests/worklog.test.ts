import { describe, expect, it } from 'vitest'
import {
  buildIcs, zonedToUtc, clientBalances, dueReminders, endTime, findConflicts, formatMoney, isAllowedMapHost, isValidDate,
  lessonValue, monthlyMoney, parseGeocodeResults, parseMapLink, periodStats, phoneDigits, priceFor, sanitizeClient, sanitizeLesson,
  sanitizePayment, todayIn, weeklyHours, weeklySeries,
  type WorkClient, type WorkLesson, type WorkPayment, type WorkExpense,
} from '@/lib/worklog'

const client = (id: string, over: Partial<WorkClient> = {}): WorkClient => ({
  id, name: `عائلة ${id}`, hourlyRate: 100, color: '#7C5CFC', createdAt: '2026-01-01T00:00:00Z', ...over,
})
let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-09-10', start: '16:00', durationMin: 60, price: 100,
  status: 'done', reminderMin: 60, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({
  id: `p${++n}`, clientId: 'a', date: '2026-09-15', amount: 100, method: 'cash', createdAt: '', ...over,
})
const exp = (over: Partial<WorkExpense>): WorkExpense => ({
  id: `e${++n}`, date: '2026-09-15', amount: 20, category: 'transport', createdAt: '', ...over,
})

describe('what a lesson is worth', () => {
  it('counts done lessons and charged late cancellations, nothing else', () => {
    expect(lessonValue(lesson({ status: 'done', price: 120 }))).toBe(120)
    expect(lessonValue(lesson({ status: 'cancelled', charged: true, price: 120 }))).toBe(120)
    expect(lessonValue(lesson({ status: 'cancelled', charged: false, price: 120 }))).toBe(0)
    // A lesson still marked "scheduled" is not owed yet — even if its date has passed.
    expect(lessonValue(lesson({ status: 'scheduled', price: 120 }))).toBe(0)
  })

  it('prices a lesson from the hourly rate and its length', () => {
    expect(priceFor(100, 90)).toBe(150)
    expect(priceFor(70, 45)).toBe(52.5)
    expect(priceFor(-5, 60)).toBe(0)
  })
})

describe('family balances — no fixed fee, no fixed pay day', () => {
  const today = '2026-10-01'
  it('balance = billable lessons − payments, all time', () => {
    const ls = [lesson({ price: 100 }), lesson({ price: 100 }), lesson({ status: 'cancelled', price: 100 })]
    const [b] = clientBalances([client('a')], ls, [pay({ amount: 150 })], today)
    expect(b.billed).toBe(200)
    expect(b.paid).toBe(150)
    expect(b.balance).toBe(50)
  })

  it('a family that paid ahead shows a credit (negative balance), not zero', () => {
    const [b] = clientBalances([client('a')], [lesson({ price: 100 })], [pay({ amount: 400 })], today)
    expect(b.balance).toBe(-300)
  })

  it('counts lessons since the last payment and past lessons with no status', () => {
    const ls = [
      lesson({ date: '2026-09-01' }), lesson({ date: '2026-09-20' }), lesson({ date: '2026-09-25' }),
      lesson({ date: '2026-09-28', status: 'scheduled' }), lesson({ date: '2026-10-05', status: 'scheduled' }),
    ]
    const [b] = clientBalances([client('a')], ls, [pay({ date: '2026-09-10' })], today)
    expect(b.lastPaymentDate).toBe('2026-09-10')
    expect(b.lessonsSinceLastPayment).toBe(2)
    expect(b.unconfirmed).toBe(1) // the 28th; the 5th is still ahead
  })

  it('keeps families apart', () => {
    const bs = clientBalances([client('a'), client('b')], [lesson({ clientId: 'a' }), lesson({ clientId: 'b', price: 70 })], [pay({ clientId: 'b', amount: 70 })], today)
    expect(bs.map(b => b.balance)).toEqual([100, 0])
  })
})

describe('period statistics', () => {
  const ls = [
    lesson({ date: '2026-09-01', durationMin: 60, price: 100 }),
    lesson({ date: '2026-09-02', durationMin: 90, price: 150 }),
    lesson({ date: '2026-09-03', status: 'cancelled', durationMin: 60, price: 100, cancelledBy: 'family' }),
    lesson({ date: '2026-09-04', status: 'cancelled', durationMin: 60, price: 100, cancelledBy: 'me', charged: false }),
    lesson({ date: '2026-09-05', status: 'cancelled', durationMin: 60, price: 100, charged: true }),
    lesson({ date: '2026-09-30', status: 'scheduled', durationMin: 60, price: 100 }),
    lesson({ date: '2026-10-01', durationMin: 60, price: 999 }), // outside
  ]
  const s = periodStats(ls, [pay({ date: '2026-09-15', amount: 200 }), pay({ date: '2026-10-02', amount: 999 })],
    [exp({ amount: 30 }), exp({ amount: 20, category: 'materials' })], '2026-09-01', '2026-09-30')

  it('separates hours done, cancelled and still scheduled', () => {
    expect(s.minutesDone).toBe(150)
    expect(s.minutesCancelled).toBe(180)
    expect(s.minutesScheduled).toBe(60)
    expect(s.lessonsDone).toBe(2)
    expect(s.lessonsCancelled).toBe(3)
  })

  it('keeps "earned" (work done) and "collected" (money in) apart', () => {
    expect(s.earned).toBe(350) // 100 + 150 + charged cancellation 100
    expect(s.collected).toBe(200)
    expect(s.expenses).toBe(50)
    expect(s.net).toBe(150)
    expect(s.lostToCancellations).toBe(200)
    expect(s.expected).toBe(100)
  })

  it('cancellation rate and who cancelled', () => {
    expect(s.cancellationRate).toBeCloseTo(3 / 5)
    expect(s.cancelledByMe).toBe(1)
    expect(s.cancelledByFamily).toBe(2)
  })

  it('average hourly rate is over delivered hours only', () => {
    expect(s.avgHourly).toBe(100) // 250 for 2.5 h
  })

  it('says "no data" rather than 0% when nothing happened', () => {
    const empty = periodStats([], [], [], '2026-09-01', '2026-09-30')
    expect(empty.cancellationRate).toBeNull()
    expect(empty.avgHourly).toBeNull()
  })

  it('breaks expenses down by category, largest first', () => {
    expect(s.byExpenseCategory).toEqual([{ category: 'transport', amount: 30 }, { category: 'materials', amount: 20 }])
  })
})

describe('charts keep quiet periods as zeros, not gaps', () => {
  it('every week is present', () => {
    const w = weeklyHours([lesson({ date: '2026-09-01' }), lesson({ date: '2026-09-22', status: 'cancelled', durationMin: 90 })], '2026-09-01', '2026-09-30')
    expect(w.map(x => x.week)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'])
    expect(w[0].done).toBe(1)
    expect(w[1]).toMatchObject({ done: 0, cancelled: 0 })
    expect(w[3].cancelled).toBe(1.5)
  })

  it('every month is present', () => {
    const m = monthlyMoney([], [pay({ date: '2026-07-03', amount: 50 })], [], '2026-06-01', '2026-09-30')
    expect(m.map(x => x.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09'])
    expect(m[1].collected).toBe(50)
  })
})

describe('scheduling', () => {
  it('weekly series lands on the same weekday, across month ends', () => {
    expect(weeklySeries('2026-09-24', 3)).toEqual(['2026-09-24', '2026-10-01', '2026-10-08'])
    expect(weeklySeries('2026-01-01', 500)).toHaveLength(52)
  })

  it('finds overlaps, ignores touching lessons and cancelled ones', () => {
    const existing = [
      lesson({ id: 'x', date: '2026-09-10', start: '16:00', durationMin: 60, status: 'scheduled' }),
      lesson({ id: 'y', date: '2026-09-10', start: '18:00', durationMin: 60, status: 'cancelled' }),
    ]
    expect(findConflicts({ date: '2026-09-10', start: '16:30', durationMin: 60 }, existing).map(l => l.id)).toEqual(['x'])
    expect(findConflicts({ date: '2026-09-10', start: '17:00', durationMin: 60 }, existing)).toEqual([])
    expect(findConflicts({ date: '2026-09-10', start: '18:00', durationMin: 60 }, existing)).toEqual([])
    // Editing a lesson never conflicts with itself.
    expect(findConflicts({ id: 'x', date: '2026-09-10', start: '16:00', durationMin: 60 }, existing)).toEqual([])
  })

  it('end time wraps past midnight', () => {
    expect(endTime('23:30', 60)).toBe('00:30')
    expect(endTime('16:15', 90)).toBe('17:45')
  })

  it('rejects dates that do not exist', () => {
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2028-02-29')).toBe(true)
  })
})

describe('reminders', () => {
  const l = lesson({ id: 'r', date: '2026-09-10', start: '16:00', status: 'scheduled', reminderMin: 60 })
  const at = (h: number, m: number) => new Date(2026, 8, 10, h, m)

  it('fires inside the window, not before and not after the start', () => {
    expect(dueReminders([l], at(14, 59), new Set())).toEqual([])
    expect(dueReminders([l], at(15, 0), new Set())).toHaveLength(1)
    expect(dueReminders([l], at(15, 59), new Set())).toHaveLength(1)
    expect(dueReminders([l], at(16, 0), new Set())).toEqual([])
  })

  it('never repeats, and stays silent for done/cancelled or "no reminder"', () => {
    expect(dueReminders([l], at(15, 30), new Set(['r']))).toEqual([])
    expect(dueReminders([{ ...l, status: 'cancelled' }], at(15, 30), new Set())).toEqual([])
    expect(dueReminders([{ ...l, reminderMin: null }], at(15, 30), new Set())).toEqual([])
  })
})

describe('locations', () => {
  it('reads coordinates from the links people actually paste', () => {
    expect(parseMapLink('25.2854, 51.531')).toEqual({ lat: 25.2854, lng: 51.531 })
    expect(parseMapLink('https://www.google.com/maps?q=25.3,51.5')).toEqual({ lat: 25.3, lng: 51.5 })
    expect(parseMapLink('https://maps.google.com/?q=loc:36.8065,10.1815')).toEqual({ lat: 36.8065, lng: 10.1815 })
    expect(parseMapLink('https://waze.com/ul?ll=25.1,51.4&navigate=yes')).toEqual({ lat: 25.1, lng: 51.4 })
    expect(parseMapLink('https://www.openstreetmap.org/?mlat=36.8&mlon=10.18#map=16/36.8/10.18')).toEqual({ lat: 36.8, lng: 10.18 })
  })

  it('prefers the pin (!3d!4d) over the viewport (@) on a place page', () => {
    const url = 'https://www.google.com/maps/place/X/@25.30,51.40,15z/data=!3m1!4b1!4m6!3m5!8m2!3d25.2911!4d51.5222'
    expect(parseMapLink(url)).toEqual({ lat: 25.2911, lng: 51.5222 })
  })

  it('rejects nonsense and out-of-range values', () => {
    expect(parseMapLink('https://maps.app.goo.gl/abc123')).toBeNull()
    expect(parseMapLink('95, 10')).toBeNull()
    expect(parseMapLink('0,0')).toBeNull()
    expect(parseMapLink('hello')).toBeNull()
  })

  it('the short-link resolver only follows Google map hosts over https', () => {
    expect(isAllowedMapHost('https://maps.app.goo.gl/abc')).toBe(true)
    expect(isAllowedMapHost('http://maps.app.goo.gl/abc')).toBe(false)
    expect(isAllowedMapHost('https://169.254.169.254/latest')).toBe(false)
    expect(isAllowedMapHost('https://maps.app.goo.gl.evil.com/x')).toBe(false)
  })

  it('adds the country code to a local phone number for wa.me', () => {
    expect(phoneDigits('3065 3759', 'QAR')).toBe('97430653759')
    expect(phoneDigits('+216 22 123 456', 'TND')).toBe('21622123456')
    expect(phoneDigits('0097430653759', 'QAR')).toBe('97430653759')
    expect(phoneDigits('', 'QAR')).toBeNull()
  })
})

describe('address search results', () => {
  it('keeps valid places and drops malformed ones', () => {
    const hits = parseGeocodeResults([
      { lat: '25.3698', lon: '51.5513', display_name: 'Zig Zag Tower A, West Bay Lagoon, Doha' },
      { lat: 'x', lon: '51.5', display_name: 'broken' },
      { lat: '95', lon: '51.5', display_name: 'out of range' },
      { lat: '25.1', lon: '51.2' }, // no name
      null,
    ])
    expect(hits).toEqual([{ label: 'Zig Zag Tower A, West Bay Lagoon, Doha', point: { lat: 25.3698, lng: 51.5513 } }])
  })

  it('never trusts a non-list response', () => {
    expect(parseGeocodeResults({ error: 'rate limited' })).toEqual([])
    expect(parseGeocodeResults(null)).toEqual([])
  })

  it('caps the list', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ lat: '25.' + (i + 1), lon: '51.5', display_name: 'p' + i }))
    expect(parseGeocodeResults(many)).toHaveLength(5)
  })
})

describe('calendar feed', () => {
  const c = client('a', { childName: 'سارة', address: 'الدفنة، شارع 12, مبنى 5; الطابق 2', location: { lat: 25.3, lng: 51.5 } })
  const ics = buildIcs([
    lesson({ id: 'k1', status: 'scheduled', reminderMin: 30, date: '2026-09-10', start: '16:05', durationMin: 90 }),
    lesson({ id: 'k2', status: 'cancelled', date: '2026-09-11' }),
  ], [c], 'Asia/Qatar', new Date('2026-09-01T00:00:00Z'))

  it('writes absolute UTC times, so Google shows a 16:05 Doha lesson at 16:05 (not 19:05)', () => {
    expect(ics).toContain('DTSTART:20260910T130500Z')
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}\r/)
    expect(ics).toContain('DURATION:PT90M')
  })

  it('converts from the ledger\'s own zone, across midnight and daylight saving', () => {
    expect(zonedToUtc('2026-10-05', '10:00', 'Asia/Qatar').toISOString()).toBe('2026-10-05T07:00:00.000Z')
    expect(zonedToUtc('2026-10-05', '01:30', 'Asia/Qatar').toISOString()).toBe('2026-10-04T22:30:00.000Z')
    expect(zonedToUtc('2026-07-01', '16:00', 'Europe/Paris').toISOString()).toBe('2026-07-01T14:00:00.000Z')
    expect(zonedToUtc('2026-01-15', '16:00', 'Europe/Paris').toISOString()).toBe('2026-01-15T15:00:00.000Z')
    expect(zonedToUtc('2026-10-05', '16:00', 'Africa/Tunis').toISOString()).toBe('2026-10-05T15:00:00.000Z')
  })

  it('has an alarm only for scheduled lessons, and cancels cancelled ones', () => {
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1)
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics).toContain('STATUS:CANCELLED')
  })

  it('escapes commas and semicolons, folds long lines and uses CRLF', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('LOCATION:الدفنة، شارع 12\\, مبنى 5\\; الطابق 2')
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})

describe('input from the browser', () => {
  it('a name with line breaks or bidi overrides is flattened', () => {
    const r = sanitizeClient({ name: 'عائلة\nأحمد‮', hourlyRate: '80' })
    expect(r.ok && r.value.name).toBe('عائلة أحمد')
    expect(r.ok && r.value.hourlyRate).toBe(80)
  })

  it('rejects a lesson on a date that does not exist, or with no duration', () => {
    const base = { clientId: 'a', date: '2026-09-10', start: '16:00', durationMin: 60, price: 100, status: 'done', reminderMin: null }
    expect(sanitizeLesson(base).ok).toBe(true)
    expect(sanitizeLesson({ ...base, date: '2026-02-30' }).ok).toBe(false)
    expect(sanitizeLesson({ ...base, durationMin: 0 }).ok).toBe(false)
    expect(sanitizeLesson({ ...base, start: '25:00' }).ok).toBe(false)
    expect(sanitizeLesson({ ...base, status: 'paid' }).ok).toBe(false)
  })

  it('a lesson that is not cancelled carries no cancellation details', () => {
    const r = sanitizeLesson({ status: 'done', cancelledBy: 'me', charged: true }, true)
    expect(r.ok && r.value).toMatchObject({ status: 'done', cancelledBy: undefined, charged: false })
  })

  it('a payment needs a positive amount', () => {
    expect(sanitizePayment({ clientId: 'a', date: '2026-09-10', amount: 0 }).ok).toBe(false)
    expect(sanitizePayment({ clientId: 'a', date: '2026-09-10', amount: '-5' }).ok).toBe(false)
    const ok = sanitizePayment({ clientId: 'a', date: '2026-09-10', amount: '150,5', method: 'bitcoin' })
    expect(ok.ok && ok.value).toMatchObject({ amount: 150.5, method: 'cash' })
  })
})

describe('formatting', () => {
  it('money uses Latin digits and a currency symbol', () => {
    expect(formatMoney(1250, 'QAR')).toBe('1,250 ر.ق')
    expect(formatMoney(52.5, 'TND')).toBe('52.50 د.ت')
    expect(formatMoney(-300, 'QAR')).toBe('-300 ر.ق')
  })

  it('"today" follows the configured zone, not the server', () => {
    const lateUtc = new Date('2026-09-10T22:30:00Z')
    expect(todayIn('Asia/Qatar', lateUtc)).toBe('2026-09-11')
    expect(todayIn('Africa/Tunis', lateUtc)).toBe('2026-09-10')
  })
})
