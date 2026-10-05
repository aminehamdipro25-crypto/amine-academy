import { describe, expect, it } from 'vitest'
import React from 'react'
import { Font, renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { buildStatement, type WorkLesson, type WorkPayment } from '@/lib/worklog'
import { StatementPdf, statementPdfModel, statementReference } from '@/lib/worklog-statement-pdf'
import { TAJAWAL_BOLD, TAJAWAL_REGULAR } from '@/lib/fonts-tajawal'

let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-10-05', start: '16:00', durationMin: 60, price: 150,
  status: 'done', reminderMin: null, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({
  id: `p${++n}`, clientId: 'a', date: '2026-10-05', amount: 150, method: 'cash', createdAt: '', ...over,
})
const client = { id: 'a', name: 'عائلة خالد', childName: 'خالد' }
const model = (ls: WorkLesson[], ps: WorkPayment[], sender?: string) =>
  statementPdfModel(buildStatement('a', ls, ps, '2026-10-01', '2026-10-31', '2026-10-20'), client, 'QAR', { sender, today: '2026-10-20' })

describe('PDF statement — the figures', () => {
  it('matches the ledger: billed, paid, and the all-time balance', () => {
    const m = model(
      [lesson({ date: '2026-10-02' }), lesson({ date: '2026-10-06' }), lesson({ date: '2026-09-20' })], // September is outside the period
      [pay({ date: '2026-10-03', amount: 150 })],
    )
    expect(m.rows).toHaveLength(2)
    expect(m.tiles[0].value).toBe('حصتان')
    expect(m.billedTotal).toContain('300')
    expect(m.paidTotal).toContain('150')
    // 3 lessons ever (450) − 150 paid: the unpaid September lesson is not hidden by the period.
    expect(m.balanceTone).toBe('due')
    expect(m.balanceValue).toContain('300')
    expect(m.balanceNote).toContain('منذ بداية التعامل')
  })

  it('shows a cancelled lesson with its reason, charged or not', () => {
    const m = model([
      lesson({ date: '2026-10-02', status: 'cancelled', charged: false, cancelReason: 'ظرف طارئ' }),
      lesson({ date: '2026-10-03', status: 'cancelled', charged: true }),
    ], [])
    expect(m.rows[0]).toMatchObject({ tone: 'free', amount: '—', reason: 'ظرف طارئ', status: 'ملغاة · غير محتسبة' })
    expect(m.rows[1]).toMatchObject({ tone: 'charged', status: 'ملغاة · محتسبة' })
    expect(m.rows[1].reason).toBeUndefined()
  })

  it('names the child per row only when the period has two children', () => {
    expect(model([lesson({})], []).showChild).toBe(false)
    const two = model([lesson({}), lesson({ child: 'تميم', date: '2026-10-06' })], [])
    expect(two.showChild).toBe(true)
    expect(two.rows.map(r => r.child)).toEqual(['خالد', 'تميم'])
    expect(two.children).toBe('خالد وتميم')
  })

  it('credit and settled read as such, not as a debt', () => {
    expect(model([lesson({})], [pay({ amount: 300 })])).toMatchObject({ balanceTone: 'credit', balanceLabel: 'رصيد مدفوع مسبقاً لديكم' })
    expect(model([lesson({})], [pay({ amount: 150 })])).toMatchObject({ balanceTone: 'settled', balanceValue: 'مسدّد بالكامل' })
  })

  it('warns about lessons with no status, and signs with the sender', () => {
    const m = model([lesson({ date: '2026-10-04', status: 'scheduled' })], [], 'الأستاذ أمين')
    expect(m.unconfirmedNote).toContain('لم تُحدَّد')
    expect(m.issuer).toBe('الأستاذ أمين')
    expect(model([], []).issuer).toBe('Amine Academy')
  })

  it('a package payment says so', () => {
    const m = model([], [pay({ lessonsCovered: 8, amount: 1200 })])
    expect(m.payments[0].note).toContain('باقة')
  })

  it('reference is stable for the same family and period, different otherwise', () => {
    const a = statementReference('a', '2026-10-01', '2026-10-31')
    expect(a).toBe(statementReference('a', '2026-10-01', '2026-10-31'))
    expect(a).toMatch(/^20261031-[0-9A-Z]{4}$/)
    expect(a).not.toBe(statementReference('b', '2026-10-01', '2026-10-31'))
  })

  it('uses Western digits only', () => {
    const m = model([lesson({ date: '2026-10-02' })], [pay({})])
    expect(JSON.stringify(m)).not.toMatch(/[٠-٩۰-۹]/)
  })
})

describe('PDF statement — the document', () => {
  it('renders a real PDF', async () => {
    Font.register({ family: 'Tajawal', fonts: [{ src: TAJAWAL_REGULAR, fontWeight: 400 }, { src: TAJAWAL_BOLD, fontWeight: 700 }] })
    Font.registerHyphenationCallback(w => [w])
    const m = model([lesson({ date: '2026-10-02', status: 'cancelled', cancelReason: 'سفر' }), lesson({ child: 'تميم' })], [pay({})], 'أمين')
    const buf = await renderToBuffer(React.createElement(StatementPdf, { m }) as React.ReactElement<DocumentProps>)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(5000)
  }, 30_000)
})
