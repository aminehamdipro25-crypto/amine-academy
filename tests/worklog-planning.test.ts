import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings, seriesPlan, periodBreakdown, periodStats, type GeoPoint, type WorkClient, type WorkLesson, type WorkPayment } from '@/lib/worklog'
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
    expect(freeSlots([], base)).toEqual([{ date: '2026-10-05', windows: [{ earliest: '14:00', latest: '20:00', until: '21:00' }], booked: [] }])
  })

  it('reserves the drive to and from the other homes around a booked lesson', () => {
    const ls = [lesson({ clientId: 'b', start: '16:00', durationMin: 60, status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a' })
    // a→b is ~13 min: the lesson must end by ~15:47 → start by 14:45; after 17:00 + ~13 min → 17:15.
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '14:45', until: '15:45' }, { earliest: '17:15', latest: '20:00', until: '21:00' }])
  })

  it('the same family before or after needs no drive', () => {
    const ls = [lesson({ clientId: 'a', start: '16:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a' })
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '15:00', until: '16:00' }, { earliest: '17:00', latest: '20:00', until: '21:00' }])
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
      { date: '2026-10-05', windows: [{ earliest: '17:15', latest: '20:00', until: '21:00' }], booked: [] },
      { date: '2026-10-07', windows: [{ earliest: '14:00', latest: '20:00', until: '21:00' }], booked: [] },
    ])
  })

  it('keeps at least the owner\'s minimum gap after a lesson at another home, even when the map says closer', () => {
    const ls = [lesson({ clientId: 'b', start: '16:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, clientId: 'a', availability: { ...av, gapMin: 45 } })
    // ~13 min drive, but 45 min is the floor: done by 15:15 → start by 14:15; after 17:00 + 45 → 17:45.
    expect(day.windows).toEqual([{ earliest: '14:00', latest: '14:15', until: '15:15' }, { earliest: '17:45', latest: '20:00', until: '21:00' }])
    // The same family needs no gap.
    const [same] = freeSlots(ls, { ...base, clientId: 'b', availability: { ...av, gapMin: 45 } })
    expect(same.windows[1].earliest).toBe('17:00')
  })

  it('the owner\'s Wednesday: 15:30 and 18:30 with a 45-min gap leave no full hour in 14:00–21:00 — said, not hidden', () => {
    const ls = [lesson({ clientId: 'b', start: '15:30', status: 'scheduled' }), lesson({ clientId: 'b', start: '18:30', status: 'scheduled' })]
    const narrow = { ...av, gapMin: 45 }
    expect(freeSlots(ls, { ...base, availability: narrow })).toEqual([])
    const [day] = freeSlots(ls, { ...base, availability: narrow, includeFull: true })
    expect(day).toEqual({ date: '2026-10-05', windows: [], booked: [{ start: '15:30', end: '16:30' }, { start: '18:30', end: '19:30' }] })
    // Open the morning and the day has room again.
    const [morning] = freeSlots(ls, { ...base, availability: { ...narrow, start: '08:00' } })
    expect(morning.windows[0]).toEqual({ earliest: '08:00', latest: '13:45', until: '14:45' })
  })

  it('a day with no room is not written into the message', () => {
    const t = availabilityText([{ date: 'X', windows: [], booked: [{ start: '15:30', end: '16:30' }] }], { durationMin: 60, formatDay: d => d })
    expect(t).not.toContain('• X')
    expect(t).toContain('لا أوقات متاحة')
  })

  it('the owner\'s Thursday: free time reads as spans that fit an hour, never as a 15-minute gap', () => {
    const ls = [lesson({ clientId: 'b', start: '10:00', status: 'scheduled' }), lesson({ clientId: 'b', start: '14:00', status: 'scheduled' })]
    const [day] = freeSlots(ls, { ...base, availability: { ...av, start: '08:00', gapMin: 45 } })
    // Shown «08:00 – 08:15» before: start times. The spans are what a family can read.
    expect(day.windows.map(w => [w.earliest, w.until])).toEqual([['08:00', '09:15'], ['11:45', '13:15'], ['15:45', '21:00']])
    for (const w of day.windows) {
      const span = (Number(w.until.slice(0, 2)) * 60 + Number(w.until.slice(3))) - (Number(w.earliest.slice(0, 2)) * 60 + Number(w.earliest.slice(3)))
      expect(span).toBeGreaterThanOrEqual(60)
    }
  })

  it('a fully booked day is left out', () => {
    const ls = [lesson({ clientId: 'b', start: '14:00', durationMin: 420, status: 'scheduled' })]
    expect(freeSlots(ls, base)).toEqual([])
  })

  it('the reply names start times, politely, and signs', () => {
    const t = availabilityText(
      [{ date: '2026-10-05', windows: [{ earliest: '14:00', latest: '15:00', until: '16:00' }, { earliest: '18:00', latest: '18:00', until: '19:00' }], booked: [] }],
      { client: { name: 'أبو خالد' }, durationMin: 60, formatDay: d => d, sender: 'الأستاذ أمين' },
    )
    expect(t).toContain('أسعد الله أوقاتكم أبو خالد')
    expect(t).toContain('2026-10-05: من 14:00 إلى 16:00، أو من 18:00 إلى 19:00')
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

describe('available times as a PDF', () => {
  it('lists only days with room, start-time ranges, the family and the length', async () => {
    const { availabilityPdfModel, AvailabilityPdf } = await import('@/lib/worklog-availability-pdf')
    const m = availabilityPdfModel([
      { date: '2026-10-07', windows: [], booked: [{ start: '15:30', end: '16:30' }] },
      { date: '2026-10-08', windows: [{ earliest: '08:00', latest: '13:45', until: '14:45' }, { earliest: '18:00', latest: '18:00', until: '19:00' }], booked: [] },
    ], { family: 'أبو خالد', durationMin: 60, sender: 'الأستاذ أمين', today: '2026-10-06' })
    expect(m.days).toHaveLength(1)
    expect(m.days[0].slots).toEqual([['08:00', '14:45'], ['18:00', '19:00']])
    expect(m).toMatchObject({ to: 'إلى: أبو خالد', duration: 'مدة الحصة: ساعة', issuer: 'الأستاذ أمين' })
    expect(JSON.stringify(m)).not.toMatch(/[٠-٩]/)

    const React = (await import('react')).default
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { registerTajawal } = await import('@/lib/pdf-fonts')
    registerTajawal()
    const buf = await renderToBuffer(React.createElement(AvailabilityPdf, { m }) as never)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  }, 30_000)
})

describe('weekly repeat over weeks the agenda already holds', () => {
  const ls = (date: string, start = '15:30', status: WorkLesson['status'] = 'scheduled', clientId = 'hamad') =>
    ({ id: `${clientId}-${date}-${start}`, clientId, date, start, durationMin: 60, price: 150, status, reminderMin: 60, createdAt: '', updatedAt: '' }) as WorkLesson

  it('skips the weeks where the family already has that hour, and extends the series past them', () => {
    const existing = [ls('2026-10-07'), ls('2026-10-14')]
    const p = seriesPlan(existing, { clientId: 'hamad', date: '2026-10-14', start: '15:30', durationMin: 60 }, 3)
    expect(p.skipped).toEqual(['2026-10-14'])
    expect(p.dates).toEqual(['2026-10-21', '2026-10-28'])
  })

  it('a cancelled lesson, another family, or another hour does not hold the slot', () => {
    const existing = [ls('2026-10-14', '15:30', 'cancelled'), ls('2026-10-21', '15:30', 'scheduled', 'saif'), ls('2026-10-28', '18:30')]
    const p = seriesPlan(existing, { clientId: 'hamad', date: '2026-10-14', start: '15:30', durationMin: 60 }, 3)
    expect(p.skipped).toEqual([])
    expect(p.dates).toHaveLength(3)
  })

  it('an overlap of part of the hour is still the same lesson', () => {
    const p = seriesPlan([ls('2026-10-14', '16:00')], { clientId: 'hamad', date: '2026-10-14', start: '15:30', durationMin: 60 }, 1)
    expect(p.skipped).toEqual(['2026-10-14'])
  })
})

describe('the rows behind an income tile', () => {
  const L = (id: string, date: string, status: WorkLesson['status'], extra: Partial<WorkLesson> = {}) =>
    ({ id, clientId: 'h', date, start: '15:30', durationMin: 60, price: 150, status, reminderMin: null, createdAt: '', updatedAt: '', ...extra }) as WorkLesson
  const fam = [{ id: 'h', name: 'أم حمد', childName: 'حمد' }] as unknown as WorkClient[]
  const lessons = [
    L('a', '2026-10-05', 'done'),
    L('b', '2026-10-06', 'cancelled', { charged: true }),
    L('c', '2026-10-07', 'cancelled', { cancelReason: 'سفر' }),
    L('d', '2026-10-07', 'scheduled'),              // yesterday, never marked
    L('e', '2026-10-09', 'scheduled'),              // ahead
    L('f', '2026-10-13', 'done', { durationMin: 120, price: 300 }),
    L('g', '2026-11-02', 'done'),                   // outside the month
  ]

  it('counts done lessons and charged cancellations only — the tile total is the sum of its lines', () => {
    const b = periodBreakdown(lessons, fam, '2026-10-01', '2026-10-31', '2026-10-08')
    expect(b.counted.map(x => x.id)).toEqual(['a', 'b', 'f'])
    expect(b.total).toBe(600)
    expect(b.total).toBe(b.counted.reduce((s, x) => s + x.amount, 0))
    expect(b.unmarked.map(x => x.id)).toEqual(['d'])
    expect(b.ahead.map(x => x.id)).toEqual(['e'])
    expect(b.cancelledFree[0].note).toBe('سبب الإلغاء: سفر')
    expect(b.counted[0].who).toBe('حمد — أم حمد')
    expect(b.minutesDone).toBe(180)
  })

  it('the sheet total is exactly the statistics page figure for the same period', () => {
    const b = periodBreakdown(lessons, fam, '2026-10-01', '2026-10-31', '2026-10-08')
    expect(b.total).toBe(periodStats(lessons, [], [], '2026-10-01', '2026-10-31').earned)
  })

  it('a month is split into its Monday-to-Sunday weeks, clipped to the month, adding up to the month', () => {
    const b = periodBreakdown(lessons, fam, '2026-10-01', '2026-10-31', '2026-10-08')
    expect(b.weeks[0]).toMatchObject({ from: '2026-10-01', to: '2026-10-04', total: 0 })
    expect(b.weeks[1]).toMatchObject({ from: '2026-10-05', to: '2026-10-11', total: 300, count: 2 })
    expect(b.weeks[2]).toMatchObject({ from: '2026-10-12', to: '2026-10-18', total: 300, count: 1, minutes: 120 })
    expect(b.weeks.at(-1)!.to).toBe('2026-10-31')
    expect(b.weeks.reduce((s, w) => s + w.total, 0)).toBe(b.total)
  })
})
