import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS, MAX_PLAUSIBLE_KM, buildStatement, dayLegs, durationText, familyChildren, lessonChild, lessonReminderText, lessonWho, monthForecast, packageNeedsRenewal, packageStatus, progressSummary, progressText,
  renewalText, sanitizeLesson, sanitizePayment, sanitizeSettings, seriesEditTargets, statementText, travelWarnings,
  type WorkLesson, type WorkPayment,
} from '@/lib/worklog'

let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-10-05', start: '16:00', durationMin: 60, price: 150,
  status: 'done', reminderMin: null, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({
  id: `p${++n}`, clientId: 'a', date: '2026-10-01', amount: 150, method: 'cash', createdAt: `2026-10-01T0${n % 10}:00:00Z`, ...over,
})

describe('1. editing a weekly series', () => {
  const series = [
    lesson({ id: 's1', seriesId: 'S', date: '2026-09-28', status: 'done' }),       // before: history
    lesson({ id: 's2', seriesId: 'S', date: '2026-10-05', status: 'scheduled' }),  // the one being edited
    lesson({ id: 's3', seriesId: 'S', date: '2026-10-12', status: 'cancelled' }),  // after, but cancelled: history
    lesson({ id: 's4', seriesId: 'S', date: '2026-10-19', status: 'scheduled' }),
    lesson({ id: 's5', seriesId: 'S', date: '2026-10-26', status: 'scheduled' }),
    lesson({ id: 'x', seriesId: 'OTHER', date: '2026-10-19', status: 'scheduled' }),
  ]

  it('touches this lesson and the scheduled ones after it — never history, never another series', () => {
    const out = seriesEditTargets(series, series[1], { start: '17:00' })
    expect(out.map(l => l.id)).toEqual(['s2', 's4', 's5'])
    expect(out.every(l => l.start === '17:00')).toBe(true)
  })

  it('moving the date moves every lesson by the same number of days (Sunday → Monday stays weekly)', () => {
    const out = seriesEditTargets(series, series[1], { date: '2026-10-06' })
    expect(out.map(l => l.date)).toEqual(['2026-10-06', '2026-10-20', '2026-10-27'])
  })

  it('carries price, length and reminder; a lesson with no series has nothing to carry', () => {
    const out = seriesEditTargets(series, series[1], { price: 180, durationMin: 90, reminderMin: 30 })
    expect(out.map(l => [l.price, l.durationMin, l.reminderMin])).toEqual([[180, 90, 30], [180, 90, 30], [180, 90, 30]])
    expect(seriesEditTargets(series, lesson({}), { start: '18:00' })).toEqual([])
  })
})

describe('2. prepaid packages', () => {
  it('counts billable lessons from the package date and says what is left', () => {
    const ls = [
      lesson({ date: '2026-09-28' }),                                  // before the package
      lesson({ date: '2026-10-01' }), lesson({ date: '2026-10-08' }),  // in
      lesson({ date: '2026-10-15', status: 'cancelled', charged: false }), // free cancellation: not used
      lesson({ date: '2026-10-22', status: 'cancelled', charged: true }),  // charged: used
      lesson({ date: '2026-10-29', status: 'scheduled' }),              // not yet
      lesson({ clientId: 'b', date: '2026-10-08' }),                    // another family
    ]
    const st = packageStatus('a', ls, [pay({ date: '2026-10-01', amount: 1200, lessonsCovered: 8 })])
    expect(st).toMatchObject({ covered: 8, used: 3, remaining: 5 })
    expect(packageNeedsRenewal(st)).toBe(false)
  })

  it('the latest package wins, and running low or over is flagged', () => {
    const ps = [pay({ date: '2026-09-01', lessonsCovered: 4 }), pay({ date: '2026-10-01', lessonsCovered: 2 })]
    const ls = [lesson({ date: '2026-10-02' }), lesson({ date: '2026-10-09' }), lesson({ date: '2026-10-16' })]
    const st = packageStatus('a', ls, ps)!
    expect(st).toMatchObject({ covered: 2, used: 3, remaining: -1 })
    expect(packageNeedsRenewal(st)).toBe(true)
    expect(renewalText({ name: 'أم سيف', childName: 'سيف' }, st)).toContain('تجاوزناها بـحصة واحدة')
  })

  it('no package, no status — an ordinary payment is not a package', () => {
    expect(packageStatus('a', [lesson({})], [pay({})])).toBeNull()
    expect(packageNeedsRenewal(null)).toBe(false)
  })

  it('a package size must be a sensible whole number', () => {
    expect(sanitizePayment({ clientId: 'a', date: '2026-10-01', amount: 100, lessonsCovered: 8 }).ok).toBe(true)
    expect(sanitizePayment({ clientId: 'a', date: '2026-10-01', amount: 100, lessonsCovered: 2.5 }).ok).toBe(false)
    expect(sanitizePayment({ clientId: 'a', date: '2026-10-01', amount: 100, lessonsCovered: 999 }).ok).toBe(false)
    const plain = sanitizePayment({ clientId: 'a', date: '2026-10-01', amount: 100, lessonsCovered: null })
    expect(plain.ok && plain.value.lessonsCovered).toBeUndefined()
  })
})

describe('3. reminding a parent', () => {
  const c = { name: 'أم سيف', childName: 'سيف' }
  it('says today / tomorrow when it is, and the date otherwise', () => {
    expect(lessonReminderText({ date: '2026-10-05', start: '16:00' }, c, d => d, '2026-10-05')).toContain('بموعد حصة سيف اليوم الساعة 16:00')
    expect(lessonReminderText({ date: '2026-10-06', start: '16:00' }, c, d => d, '2026-10-05')).toContain('غداً')
    expect(lessonReminderText({ date: '2026-10-09', start: '16:00' }, c, d => `D:${d}`, '2026-10-05')).toContain('D:2026-10-09')
  })

  it('the "reminded" time is the server\'s, and can be cleared', () => {
    const on = sanitizeLesson({ parentReminded: true }, true)
    expect(on.ok && typeof on.value.parentRemindedAt).toBe('string')
    const off = sanitizeLesson({ parentReminded: false }, true)
    expect(off.ok && off.value.parentRemindedAt).toBeUndefined()
    // A browser cannot backdate it by sending the field itself.
    const forged = sanitizeLesson({ parentRemindedAt: '2020-01-01T00:00:00Z' }, true)
    expect(forged.ok && 'parentRemindedAt' in forged.value).toBe(false)
  })
})

describe('4. monthly goal and forecast', () => {
  const today = '2026-10-15'
  const ls = [
    lesson({ date: '2026-10-02', price: 1000 }),                         // done
    lesson({ date: '2026-10-10', price: 200, status: 'scheduled' }),     // past, no status
    lesson({ date: '2026-10-15', price: 500, status: 'scheduled' }),     // today: still ahead
    lesson({ date: '2026-10-28', price: 500, status: 'scheduled' }),
    lesson({ date: '2026-11-02', price: 999, status: 'scheduled' }),     // next month
  ]
  it('projected = done + scheduled ahead; unconfirmed past lessons are named, not counted', () => {
    const f = monthForecast(ls, [pay({ date: '2026-10-03', amount: 600 })], today, 3000)
    expect(f).toMatchObject({ earned: 1000, ahead: 1000, unconfirmed: 200, projected: 2000, collected: 600, goal: 3000, gap: 1000 })
    expect(f.progress).toBeCloseTo(2000 / 3000)
  })
  it('no goal → no progress and no gap, and a met goal leaves no gap', () => {
    expect(monthForecast(ls, [], today, null)).toMatchObject({ goal: null, progress: null, gap: null })
    expect(monthForecast(ls, [], today, 1500).gap).toBe(0)
  })
  it('settings accept a goal and clear it', () => {
    const set = sanitizeSettings({ monthlyGoal: '6000' }, DEFAULT_SETTINGS)
    expect(set.ok && set.value.monthlyGoal).toBe(6000)
    const clear = sanitizeSettings({ monthlyGoal: null }, { ...DEFAULT_SETTINGS, monthlyGoal: 6000 })
    expect(clear.ok && clear.value.monthlyGoal).toBeNull()
    expect(sanitizeSettings({ monthlyGoal: -5 }, DEFAULT_SETTINGS).ok).toBe(false)
  })
})

describe('5. a child\'s progress', () => {
  it('rating is 1 to 5, and can be cleared', () => {
    expect(sanitizeLesson({ rating: 4 }, true).ok).toBe(true)
    expect(sanitizeLesson({ rating: 6 }, true).ok).toBe(false)
    expect(sanitizeLesson({ rating: 2.5 }, true).ok).toBe(false)
    const cleared = sanitizeLesson({ rating: null }, true)
    expect(cleared.ok && cleared.value.rating).toBeUndefined()
  })

  it('averages the ratings and shows a trend only with 3+ on each side', () => {
    const few = [3, 4].map((r, i) => lesson({ date: `2026-10-0${i + 1}`, rating: r }))
    expect(progressSummary('a', few, '2026-10-01', '2026-10-31')).toMatchObject({ rated: 2, average: 3.5, trend: null })
    const many = [2, 2, 3, 2, 3, 4, 4, 5, 4, 5].map((r, i) => lesson({ date: `2026-09-${String(i + 10)}`, rating: r }))
    const ps = progressSummary('a', many, '2026-09-01', '2026-09-30')
    expect(ps.trend).toEqual({ recent: 4.4, before: 2.4 })
  })

  it('only done lessons of this family count, and the message carries notes and stars', () => {
    const ls = [
      lesson({ date: '2026-10-01', rating: 4, note: 'أتقن جدول 7' }),
      lesson({ date: '2026-10-02', status: 'cancelled', rating: 1 }),
      lesson({ clientId: 'b', date: '2026-10-03', rating: 5 }),
    ]
    const ps = progressSummary('a', ls, '2026-10-01', '2026-10-31')
    expect(ps.lessons).toHaveLength(1)
    const text = progressText(ps, { name: 'أم سيف', childName: 'سيف' }, d => d)
    expect(text).toContain('ملخّص حصص سيف')
    expect(text).toContain('⭐⭐⭐⭐')
    expect(text).toContain('أتقن جدول 7')
  })
})

describe('6. the drive between two lessons', () => {
  const doha = { lat: 25.2854, lng: 51.531 }, nearby = { lat: 25.3, lng: 51.5 }
  const far = { lat: -33.86, lng: 151.2 } // a pin dropped in Sydney by mistake
  const day = [
    lesson({ id: 'a1', clientId: 'a', start: '10:00', durationMin: 60, status: 'scheduled' }),
    lesson({ id: 'b1', clientId: 'b', start: '15:30', durationMin: 60, status: 'scheduled' }),
  ]

  it('reads the gap and the drive in words people use', () => {
    expect(durationText(45)).toBe('45 د')
    expect(durationText(60)).toBe('ساعة')
    expect(durationText(270)).toBe('4 س و30 د')
    expect(durationText(150)).toBe('ساعتان و30 د')
  })

  it('a normal drive: gap from end of one lesson to start of the next', () => {
    const [g] = dayLegs(day, '2026-10-05', id => (id === 'a' ? doha : nearby))
    expect(g).toMatchObject({ gapMin: 270, tight: false, implausible: false })
  })

  it('an impossible distance is a wrong pin — flagged, never a "tight" drive of thousands of minutes', () => {
    const [g] = dayLegs(day, '2026-10-05', id => (id === 'a' ? doha : far))
    expect(g.km).toBeGreaterThan(MAX_PLAUSIBLE_KM)
    expect(g).toMatchObject({ implausible: true, tight: false })
    // Back and forth to the same wrong pin is said once, not on every drive.
    const thrice = [...day, lesson({ id: 'a2', clientId: 'a', start: '17:00', status: 'scheduled' })]
    expect(dayLegs(thrice, '2026-10-05', id => (id === 'a' ? doha : far))).toHaveLength(1)
    // The lesson form surfaces it too, even though the gap would be "enough".
    const w = travelWarnings({ clientId: 'b', date: '2026-10-05', start: '15:30', durationMin: 60 }, [day[0]], id => (id === 'a' ? doha : far))
    expect(w).toHaveLength(1)
    expect(w[0].implausible).toBe(true)
  })
})

describe('7. messages to parents are formal', () => {
  const c = { name: 'أم سيف', childName: 'سيف' }
  const st = { from: '2026-10-01', to: '2026-10-05', lessons: [], payments: [], billed: 0, billedCount: 0, billedMinutes: 0, paidInPeriod: 0, balance: 300, unconfirmed: 0 }
  const all = [
    lessonReminderText({ date: '2026-10-05', start: '20:00' }, c, d => d, '2026-10-05', 'الأستاذ أمين'),
    statementText(st as never, c, 'QAR', d => d, 'الأستاذ أمين'),
    renewalText(c, { covered: 8, used: 7, remaining: 1, since: '2026-10-01' } as never, 'الأستاذ أمين'),
    progressText({ lessons: [], rated: 0, average: null, trend: null } as never, c, d => d, 'الأستاذ أمين'),
  ]

  it('every message opens with the full greeting and closes with thanks and the signature', () => {
    for (const t of all) {
      const lines = t.split('\n')
      expect(lines[0]).toBe('السلام عليكم ورحمة الله وبركاته،')
      expect(lines[1]).toBe('أسعد الله أوقاتكم أم سيف،')
      expect(lines.at(-1)).toBe('الأستاذ أمين')
      expect(lines.at(-2)).toMatch(/شاكرين|الشكر/)
    }
  })

  it('the reminder names the child and asks — politely — to be told of any change', () => {
    expect(all[0]).toContain('نودّ تذكيركم بموعد حصة سيف اليوم الساعة 20:00 بإذن الله.')
    expect(all[0]).toContain('نرجو التكرّم بإعلامنا مسبقاً')
  })

  it('an amount still owed is asked for courteously', () => {
    expect(all[1]).toContain('نرجو التكرّم بتسويته في الوقت الذي يناسبكم.')
  })

  it('no signature set → the message just ends on the thanks', () => {
    const t = lessonReminderText({ date: '2026-10-05', start: '20:00' }, c, d => d, '2026-10-05')
    expect(t.split('\n').at(-1)).toBe('شاكرين لكم حسن تعاونكم 🌷')
  })

  it('the signature is a sanitised name, and clearing it removes it', () => {
    const set = sanitizeSettings({ senderName: '  الأستاذ\nأمين  ' }, DEFAULT_SETTINGS)
    expect(set.ok && set.value.senderName).toBe('الأستاذ أمين')
    const cleared = sanitizeSettings({ senderName: '' }, { ...DEFAULT_SETTINGS, senderName: 'x' })
    expect(cleared.ok && 'senderName' in cleared.value).toBe(false)
  })
})

describe('8. two children in one family', () => {
  const fam = { name: 'أبو خالد', childName: 'خالد' }
  const day = (over: Partial<WorkLesson>) => lesson({ clientId: 'k', date: '2026-10-02', ...over })

  it('a lesson may name its own child; absent means the family\'s child', () => {
    expect(lessonChild({}, fam)).toBe('خالد')
    expect(lessonChild({ child: 'تميم' }, fam)).toBe('تميم')
    const ok = sanitizeLesson({ child: '  تميم\n' }, true)
    expect(ok.ok && ok.value.child).toBe('تميم')
    const cleared = sanitizeLesson({ child: null }, true)
    expect(cleared.ok && cleared.value.child).toBeUndefined()
  })

  it('lists the family\'s children, its own first, without repeats', () => {
    const ls = [day({ child: 'تميم' }), day({}), day({ child: 'تميم', date: '2026-09-25' }), lesson({ clientId: 'x', child: 'غريب' })]
    expect(familyChildren('k', fam, ls)).toEqual(['خالد', 'تميم'])
  })

  it('the statement says whose lesson each line was, once there are two children', () => {
    const ls = [day({ start: '15:00', price: 120 }), day({ start: '16:00', price: 120, child: 'تميم' })]
    const st = buildStatement('k', ls, [], '2026-10-01', '2026-10-05', '2026-10-05')
    const text = statementText(st, fam, 'QAR', d => d)
    expect(text).toContain('نرفق لكم كشف حصص خالد وتميم')
    expect(text).toContain('15:00 — خالد')
    expect(text).toContain('16:00 — تميم')
    // One child only: no name on every line.
    const one = statementText(buildStatement('k', [ls[0]], [], '2026-10-01', '2026-10-05', '2026-10-05'), fam, 'QAR', d => d)
    expect(one).not.toContain('15:00 — خالد')
  })

  it('the reminder names the child the lesson is for', () => {
    expect(lessonReminderText({ date: '2026-10-05', start: '16:00', child: 'تميم' }, fam, d => d, '2026-10-05')).toContain('بموعد حصة تميم')
    expect(lessonWho({ child: 'تميم' }, fam)).toBe('تميم — أبو خالد')
  })
})
