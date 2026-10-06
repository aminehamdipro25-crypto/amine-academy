import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings, type GeoPoint, type WorkClient, type WorkLesson, type WorkPayment } from '@/lib/worklog'
import {
  UNKNOWN_TRAVEL_MIN, availabilityText, daysText, debtAge, familiesText, freeSlots, receivables, weeklyDigest, weeklyDigestLines,
} from '@/lib/worklog-planning'

let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-10-05', start: '16:00', durationMin: 60, price: 100,
  status: 'done', reminderMin: null, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({
  id: `p${++n}`, clientId: 'a', date: '2026-10-05', amount: 100, method: 'cash', createdAt: '', ...over,
})
const client = (id: string, over: Partial<WorkClient> = {}): WorkClient => ({
  id, name: `عائلة ${id}`, hourlyRate: 100, color: '#000', createdAt: '', ...over,
} as WorkClient)

describe('receivables — who owes, since when', () => {
  const clients = [client('a'), client('b'), client('c')]
  it('applies payments to the oldest lessons first; the debt is as old as the first lesson they did not reach', () => {
    const ls = [
      lesson({ date: '2026-09-01' }), lesson({ date: '2026-09-08' }), lesson({ date: '2026-09-15' }),
      lesson({ date: '2026-09-22', status: 'cancelled', charged: false }), // not billable — never «owed»
    ]
    const [r] = receivables(clients, ls, [pay({ amount: 100 })], '2026-10-06')
    expect(r).toMatchObject({ clientId: 'a', balance: 200, oldestUnpaidDate: '2026-09-08', unpaidLessons: 2, daysOutstanding: 28 })
  })

  it('a part-paid lesson is still unpaid', () => {
    const [r] = receivables(clients, [lesson({ date: '2026-10-01' })], [pay({ amount: 40 })], '2026-10-06')
    expect(r).toMatchObject({ balance: 60, oldestUnpaidDate: '2026-10-01', unpaidLessons: 1 })
  })

  it('lists only families that owe, the longest-waiting first', () => {
    const ls = [
      lesson({ clientId: 'a', date: '2026-10-01' }),
      lesson({ clientId: 'b', date: '2026-08-20' }),
      lesson({ clientId: 'c', date: '2026-09-01' }),
    ]
    const r = receivables(clients, ls, [pay({ clientId: 'c', amount: 100 })], '2026-10-06')
    expect(r.map(x => x.clientId)).toEqual(['b', 'a'])
  })

  it('counts days in correct Arabic', () => {
    expect([1, 2, 7, 10, 11, 35, 103].map(daysText)).toEqual(['يوم واحد', 'يومين', '7 أيام', '10 أيام', '11 يوماً', '35 يوماً', '103 أيام'])
  })

  it('counts families in correct Arabic', () => {
    expect([1, 2, 3, 11].map(familiesText)).toEqual(['عائلة واحدة', 'عائلتان', '3 عائلات', '11 عائلة'])
  })

  it('ages: under two weeks is routine, over a month is late', () => {
    expect([debtAge(null), debtAge(3), debtAge(14), debtAge(29), debtAge(30)]).toEqual(['fresh', 'fresh', 'due', 'due', 'late'])
  })
})

describe('freeSlots — when a lesson still fits', () => {
  // Monday 2026-10-05; 14:00–21:00 every day.
  const av = { days: [0, 1, 2, 3, 4, 5, 6], start: '14:00', end: '21:00', gapMin: 0 }
  const HOME: Record<string, GeoPoint> = { a: { lat: 25.3201, lng: 51.5312 }, b: { lat: 25.3480, lng: 51.5345 }, far: { lat: 25.20, lng: 51.40 } }
  const locate = (id: string) => HOME[id]
  const base = { from: '2026-10-05', days: 1, durationMin: 60, availability: av, locate }

  it('an empty day is one window, start times up to an hour before closing', () => {
    expect(freeSlots([], base)).toEqual([{ date: '2026-10-05', windows: [{ earliest: '14:00', latest: '20:00' }] }])
  })

  it('reserves the drive to and from the other homes around a booked lesson', () => {
    const ls = [lesson({ clientId: 'b', start: '16:00', durationMin: 60, status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a' })
    // a→b is ~13 min: the lesson must end by ~15:47 → start by 14:45; after 17:00 + ~13 min → 17:15.
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '14:45' }, { earliest: '17:15', latest: '20:00' }])
  })

  it('the same family before or after needs no drive', () => {
    const ls = [lesson({ clientId: 'a', start: '16:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a' })
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '15:00' }, { earliest: '17:00', latest: '20:00' }])
  })

  it('a new family with no pin gets a cautious drive buffer, never zero', () => {
    const ls = [lesson({ clientId: 'b', start: '16:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, base)
    expect(UNKNOWN_TRAVEL_MIN).toBeGreaterThan(0)
    expect(day.windows[1].earliest).toBe('17:15')
  })

  it('cancelled lessons free their time; days off and the past are not offered', () => {
    const ls = [lesson({ clientId: 'b', start: '14:00', durationMin: 420, status: 'cancelled' })]
    const r = freeSlots(ls, {
      ...base, days: 3, availability: { ...av, days: [0, 2] }, today: '2026-10-05', nowMin: 17 * 60 + 5,
    })
    expect(r).toEqual([
      { date: '2026-10-05', windows: [{ earliest: '17:15', latest: '20:00' }] },
      { date: '2026-10-07', windows: [{ earliest: '14:00', latest: '20:00' }] },
    ])
  })

  it('keeps at least the owner\'s minimum gap after a lesson at another home, even when the map says closer', () => {
    const ls = [lesson({ clientId: 'b', start: '16:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a', availability: { ...av, gapMin: 45 } })
    // ~13 min drive, but 45 min is the floor: done by 15:15 → start by 14:15; after 17:00 + 45 → 17:45.
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '14:15' }, { earliest: '17:45', latest: '20:00' }])
    // The same family needs no gap.
    const [same] = freeSlots(ls, { ...base, clientId: 'b', availability: { ...av, gapMin: 45 } })
    expect(same.windows[1].earliest).toBe('17:00')
  })

  it('a fully booked day is left out', () => {
    const ls = [lesson({ clientId: 'b', start: '14:00', durationMin: 420, status: 'scheduled' })]
    expect(freeSlots(ls, base)).toEqual([])
  })

  it('the reply names start times, politely, and signs', () => {
    const t = availabilityText(
      [{ date: '2026-10-05', windows: [{ earliest: '14:00', latest: '15:00' }, { earliest: '18:00', latest: '18:00' }] }],
      { client: { name: 'أبو خالد' }, durationMin: 60, formatDay: d => d, sender: 'الأستاذ أمين' },
    )
    expect(t).toContain('أسعد الله أوقاتكم أبو خالد')
    expect(t).toContain('2026-10-05: بين 14:00 و15:00، أو الساعة 18:00')
    expect(t.trim().endsWith('الأستاذ أمين')).toBe(true)
  })
})

describe('availability setting', () => {
  it('accepts days and hours, rejects an empty or inverted one', () => {
    const ok = sanitizeSettings({ availability: { days: [6, 0, 0, 9], start: '15:00', end: '20:00' } }, DEFAULT_SETTINGS)
    expect(ok.ok && ok.value.availability).toEqual({ days: [0, 6], start: '15:00', end: '20:00', gapMin: 45 })
    expect(sanitizeSettings({ availability: { days: [1], start: '15:00', end: '20:00', gapMin: 500 } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ availability: { days: [], start: '15:00', end: '20:00' } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ availability: { days: [1], start: '20:00', end: '15:00' } }, DEFAULT_SETTINGS).ok).toBe(false)
  })
})

describe('weekly digest', () => {
  const clients = [client('a', { childName: 'خالد' })]
  it('covers the seven days before today, the week ahead, and who owes', () => {
    const ls = [
      lesson({ date: '2026-09-28' }), // before the window
      lesson({ date: '2026-09-29' }), lesson({ date: '2026-10-04', status: 'cancelled', charged: false }),
      lesson({ date: '2026-10-07', status: 'scheduled' }), lesson({ date: '2026-10-13', status: 'scheduled' }), // after the window
    ]
    const d = weeklyDigest(clients, ls, [], [], '2026-10-06')
    expect([d.from, d.to]).toEqual(['2026-09-29', '2026-10-05'])
    expect(d.last.lessonsDone).toBe(1)
    expect(d.ahead).toEqual({ lessons: 1, minutes: 60, value: 100 })
    expect(d.owed).toMatchObject({ total: 200, families: 1 })
    const lines = weeklyDigestLines(d, () => 'خالد', 'QAR', x => x)
    expect(lines.join('\n')).toContain('خالد: 200')
    expect(lines.join('\n')).toContain('منذ 8 أيام')
    expect(lines.join('\n')).toContain('حصة واحدة ملغاة')
  })

  it('says so when nothing happened, instead of a column of zeros', () => {
    const lines = weeklyDigestLines(weeklyDigest(clients, [], [], [], '2026-10-06'), () => '', 'QAR', x => x)
    expect(lines).toContain('لا حصص مسجّلة في الأسبوع الماضي.')
  })
})
