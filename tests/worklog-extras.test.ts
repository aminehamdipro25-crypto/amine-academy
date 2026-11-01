// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import {
  buildStatement, dayLegs, lessonsCount, hoursIn, statementText, travelMinutes, travelWarnings, DEFAULT_SETTINGS,
  type GeoPoint, type WorkClient, type WorkLesson, type WorkPayment,
} from '@/lib/worklog'
import { buildXlsx, excelDate, ledgerSheets } from '@/lib/worklog-xlsx'

let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-10-05', start: '16:00', durationMin: 60, price: 150,
  status: 'done', reminderMin: null, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({
  id: `p${++n}`, clientId: 'a', date: '2026-10-05', amount: 150, method: 'cash', createdAt: '', ...over,
})

// Two homes ~3.2 km apart in a straight line (West Bay → Al Dafna, Doha).
const HOME: Record<string, GeoPoint> = { a: { lat: 25.3201, lng: 51.5312 }, b: { lat: 25.3480, lng: 51.5345 } }
const locate = (id: string) => HOME[id]

describe('travel between homes', () => {
  it('estimates drive time with a road factor and a door buffer', () => {
    const m = travelMinutes(HOME.a, HOME.b)
    // 3.1 km straight → ~4.4 km road → ~8 min at 35 km/h + 5 min at the door
    expect(m).toBeGreaterThanOrEqual(11)
    expect(m).toBeLessThanOrEqual(15)
  })

  it('flags back-to-back lessons at different homes, not at the same home', () => {
    const ls = [
      lesson({ id: 'x', clientId: 'a', start: '16:00', durationMin: 60, status: 'scheduled' }),
      lesson({ id: 'y', clientId: 'b', start: '17:00', durationMin: 60, status: 'scheduled' }), // no gap
      lesson({ id: 'z', clientId: 'b', start: '18:00', durationMin: 60, status: 'scheduled' }), // same home
    ]
    const legs = dayLegs(ls, '2026-10-05', locate)
    expect(legs).toHaveLength(1)
    expect(legs[0]).toMatchObject({ fromId: 'x', toId: 'y', gapMin: 0, tight: true })
  })

  it('a wide enough gap is not a warning, and cancelled lessons do not count', () => {
    const ls = [
      lesson({ clientId: 'a', start: '16:00', status: 'scheduled' }),
      lesson({ clientId: 'b', start: '17:30', status: 'scheduled' }), // 30 min gap
    ]
    expect(dayLegs(ls, '2026-10-05', locate)[0].tight).toBe(false)
    const cancelledBetween = [ls[0], lesson({ clientId: 'b', start: '17:00', status: 'cancelled' })]
    expect(dayLegs(cancelledBetween, '2026-10-05', locate)).toEqual([])
  })

  it('warns a lesson being scheduled about the drive before and after it', () => {
    const existing = [
      lesson({ id: 'before', clientId: 'b', start: '14:00', durationMin: 60, status: 'scheduled' }), // ends 15:00
      lesson({ id: 'after', clientId: 'b', start: '17:05', durationMin: 60, status: 'scheduled' }),
    ]
    const w = travelWarnings({ clientId: 'a', date: '2026-10-05', start: '15:05', durationMin: 120 }, existing, locate)
    expect(w.map(x => [x.otherId, x.direction])).toEqual([['before', 'from'], ['after', 'to']])
    // Homes with no saved location produce no claim either way.
    expect(travelWarnings({ clientId: 'nowhere', date: '2026-10-05', start: '15:05', durationMin: 120 }, existing, locate)).toEqual([])
  })
})

describe('Arabic counting', () => {
  it('uses the right noun form for each number', () => {
    expect([0, 1, 2, 3, 10, 11, 25, 103].map(lessonsCount)).toEqual(
      ['لا حصص', 'حصة واحدة', 'حصتان', '3 حصص', '10 حصص', '11 حصة', '25 حصة', '103 حصص'])
  })
})

describe('hours at a glance', () => {
  it('splits a range into done / scheduled / cancelled minutes', () => {
    const ls = [
      lesson({ date: '2026-10-05', durationMin: 90 }),
      lesson({ date: '2026-10-06', durationMin: 60, status: 'scheduled' }),
      lesson({ date: '2026-10-07', durationMin: 45, status: 'cancelled' }),
      lesson({ date: '2026-10-20', durationMin: 60 }), // outside
    ]
    expect(hoursIn(ls, '2026-10-05', '2026-10-11')).toEqual({ done: 90, scheduled: 60, cancelled: 45 })
  })
})

describe('family account statement', () => {
  const ls = [
    lesson({ date: '2026-09-28', price: 150 }), // before the period, still unpaid
    lesson({ date: '2026-10-05', price: 150 }),
    lesson({ date: '2026-10-07', status: 'cancelled', charged: true, price: 150 }),
    lesson({ date: '2026-10-09', status: 'cancelled', charged: false, price: 150 }),
    lesson({ date: '2026-10-10', status: 'scheduled', price: 150 }), // past, no status
    lesson({ clientId: 'other', date: '2026-10-05', price: 999 }),
  ]
  const ps = [pay({ date: '2026-10-06', amount: 100 })]
  const st = buildStatement('a', ls, ps, '2026-10-01', '2026-10-31', '2026-10-15')

  it('counts only billable lessons of this family in the period', () => {
    expect(st.billedCount).toBe(2)
    expect(st.billed).toBe(300)
    expect(st.billedMinutes).toBe(120)
    expect(st.paidInPeriod).toBe(100)
    expect(st.unconfirmed).toBe(1)
  })

  it('the period’s own result and the rest of the account are kept apart, so an older unpaid lesson is not hidden', () => {
    // billable all-time: 150 (Sep) + 150 + 150 (charged) = 450; paid 100
    expect(st.balance).toBe(350)
    expect(st.periodBalance).toBe(200)  // 300 billed in October − 100 paid in October
    expect(st.otherBalance).toBe(150)   // the unpaid September lesson
  })

  it('reads as a message to a parent, with Latin digits', () => {
    const text = statementText(st, { name: 'عائلة الكعبي', childName: 'سارة' }, 'QAR', d => d.slice(5))
    expect(text).toContain('أسعد الله أوقاتكم عائلة الكعبي')
    expect(text).toContain('كشف حصص سارة')
    expect(text).toContain('✕ ملغاة (محتسبة)')
    expect(text).toContain('✕ ملغاة (غير محتسبة)')
    // the period first, under its own name; September on its own line; then the total
    expect(text).toContain('المتبقي عن هذه الفترة: 200 ر.ق')
    expect(text).toContain('مستحق من فترات أخرى: 150 ر.ق')
    expect(text).toContain('المجموع المستحق حتى اليوم: 350 ر.ق')
    expect(text.indexOf('عن هذه الفترة')).toBeLessThan(text.indexOf('المجموع المستحق'))
    expect(text).toContain('مجموع الحصص المحتسبة: حصتان')
    expect(text).toContain('  - 10-06: 100 ر.ق')
    expect(text).not.toMatch(/[٠-٩]/)
  })

  it('says "paid ahead" or "fully paid" instead of a negative or zero debt', () => {
    const ahead = buildStatement('a', [lesson({})], [pay({ amount: 400 })], '2026-10-01', '2026-10-31', '2026-10-15')
    const aheadText = statementText(ahead, { name: 'X' }, 'QAR', d => d)
    expect(aheadText).toContain('المدفوع في هذه الفترة زائد عن حصصها: 250 ر.ق')
    expect(aheadText).not.toContain('المجموع المستحق') // nothing else in the account: no second figure
    const even = buildStatement('a', [lesson({})], [pay({})], '2026-10-01', '2026-10-31', '2026-10-15')
    const evenText = statementText(even, { name: 'X' }, 'QAR', d => d)
    expect(evenText).toContain('حصص هذه الفترة: مسدّدة')
    expect(evenText).not.toContain('نرجو التكرّم بتسويته')
  })
})

describe('a statement for one period says only that period — unless another period changes what is owed', () => {
  it('a period that is the whole account: one figure, and no «since the beginning» note', () => {
    const st = buildStatement('a', [lesson({ date: '2026-11-01', price: 120 })], [], '2026-11-01', '2026-11-01', '2026-11-01')
    const text = statementText(st, { name: 'أبو خالد', childName: 'خالد' }, 'QAR', d => d)
    expect(text).toContain('المتبقي عن هذه الفترة: 120 ر.ق')
    expect(text).not.toContain('فترات أخرى')
    expect(text).not.toContain('منذ بداية')
  })
  it('credit from another period is shown as such and lowers the total', () => {
    const st = buildStatement('a', [lesson({ date: '2026-11-01', price: 120 })], [pay({ date: '2026-10-20', amount: 200 })], '2026-11-01', '2026-11-30', '2026-11-05')
    const text = statementText(st, { name: 'X' }, 'QAR', d => d)
    expect(text).toContain('المتبقي عن هذه الفترة: 120 ر.ق')
    expect(text).toContain('رصيد لصالحكم من فترات أخرى: 200 ر.ق')
    expect(text).toContain('رصيد مدفوع مسبقاً لديكم حتى اليوم: 80 ر.ق')
  })
  it('lesson notes go under their lesson only when asked for', () => {
    const st = buildStatement('a', [lesson({ date: '2026-11-01', note: 'صارت الحصة مع تميم' })], [], '2026-11-01', '2026-11-01', '2026-11-01')
    expect(statementText(st, { name: 'X' }, 'QAR', d => d, undefined, { notes: true })).toContain('ملاحظة: صارت الحصة مع تميم')
    expect(statementText(st, { name: 'X' }, 'QAR', d => d)).not.toContain('صارت الحصة مع تميم')
  })
})

describe('Excel export', () => {
  const clients: WorkClient[] = [{ id: 'a', name: 'عائلة <الكعبي> & co', hourlyRate: 150, color: '#7C5CFC', createdAt: '', phone: '+974 5583 8296' }]
  const data = {
    clients,
    lessons: [lesson({ date: '2026-10-05', price: 150, note: 'واجب "القراءة"' }), lesson({ date: '2026-10-07', status: 'cancelled' })],
    payments: [pay({ date: '2026-10-06', amount: 100 })],
    expenses: [{ id: 'e1', date: '2026-10-06', amount: 20, category: 'transport' as const, createdAt: '' }],
    settings: DEFAULT_SETTINGS,
  }
  const files = unzipSync(buildXlsx(ledgerSheets(data, '2026-10-01', '2026-10-31', '2026-10-15')))
  const xml = (name: string) => strFromU8(files[name])
  const parse = (s: string) => new DOMParser().parseFromString(s, 'application/xml')

  it('is a complete workbook with five right-to-left sheets', () => {
    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      '[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml',
      'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet5.xml',
    ]))
    const names = [...xml('xl/workbook.xml').matchAll(/<sheet name="([^"]+)"/g)].map(m => m[1])
    expect(names).toEqual(['ملخص', 'الحصص', 'الدفعات', 'المصاريف', 'العائلات'])
    expect(xml('xl/worksheets/sheet2.xml')).toContain('rightToLeft="1"')
  })

  it('the well-formedness check itself catches broken XML', () => {
    expect(parse('<a><b></a>').getElementsByTagName('parsererror').length).toBeGreaterThan(0)
  })

  it('every part is well-formed XML, even with < & " in names and notes', () => {
    for (const [name, bytes] of Object.entries(files)) {
      const doc = parse(strFromU8(bytes))
      expect(doc.getElementsByTagName('parsererror').length, name).toBe(0)
    }
    expect(xml('xl/worksheets/sheet5.xml')).toContain('عائلة &lt;الكعبي&gt; &amp; co')
  })

  it('writes dates as real Excel dates and money as numbers', () => {
    expect(excelDate('1900-03-01')).toBe(61)
    expect(excelDate('2026-10-05')).toBe(46300)
    const lessonsXml = xml('xl/worksheets/sheet2.xml')
    expect(lessonsXml).toContain('<v>46300</v>')
    expect(lessonsXml).toMatch(/<c r="F2" s="3"><v>150<\/v><\/c>/)
  })

  it('the families sheet carries the all-time balance', () => {
    // billed 150 (the cancelled one is not charged), paid 100
    expect(xml('xl/worksheets/sheet5.xml')).toMatch(/<c r="F2" s="3"><v>50<\/v><\/c>/)
  })
})
