import { describe, expect, it } from 'vitest'
import React from 'react'
import { Font, renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import {
  DEFAULT_SETTINGS, buildStatement, paymentLines, sanitizeSettings, statementClosing, statementOwes, statementText,
  type WorkLesson, type WorkPayment,
} from '@/lib/worklog'
import { StatementPdf, statementPdfModel } from '@/lib/worklog-statement-pdf'
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
const invoice = { title: 'أخصائي نشاط بدني معدّل', phone: '+974 5555 1234', payment: 'فوران: 5555 1234\nتحويل بنكي — QNB — IBAN QA00 TEST 0000' }
const st = (ls: WorkLesson[], ps: WorkPayment[], from = '2026-10-01') => buildStatement('a', ls, ps, from, '2026-10-31', '2026-10-20')

describe('statement invoice settings', () => {
  it('keeps title, phone and payment lines; drops blank lines and control characters', () => {
    const r = sanitizeSettings({ invoice: { title: ' أخصائي\nنشاط ', phone: '+974 5555 1234', payment: 'فوران: 1\n\n  نقداً ‮عند الحصة  \n' } }, DEFAULT_SETTINGS)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.invoice).toEqual({ title: 'أخصائي نشاط', phone: '+974 5555 1234', payment: 'فوران: 1\nنقداً عند الحصة' })
  })
  it('refuses a phone that is not one, and a payment text that is too long', () => {
    expect(sanitizeSettings({ invoice: { phone: 'call me' } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ invoice: { payment: 'x'.repeat(401) } }, DEFAULT_SETTINGS).ok).toBe(false)
    expect(sanitizeSettings({ invoice: 'x' }, DEFAULT_SETTINGS).ok).toBe(false)
  })
  it('an empty form or null removes it', () => {
    const cur = { ...DEFAULT_SETTINGS, invoice }
    const a = sanitizeSettings({ invoice: { title: '', phone: '', payment: '' } }, cur)
    const b = sanitizeSettings({ invoice: null }, cur)
    expect(a.ok && a.value.invoice).toBeFalsy()
    expect(b.ok && b.value.invoice).toBeFalsy()
  })
})

describe('payment methods on the statement — only when something is owed', () => {
  const owed = st([lesson({})], [])
  const settled = st([lesson({})], [pay({})])
  // October is paid, but September is not: the family still owes.
  const olderOwed = st([lesson({}), lesson({ date: '2026-09-20' })], [pay({})], '2026-10-01')
  // October is unpaid, but an earlier advance covers it: nothing owed.
  const coveredByAdvance = st([lesson({})], [pay({ date: '2026-09-10' })], '2026-10-01')

  it('statementOwes follows what is owed today', () => {
    expect(statementOwes(statementClosing(owed, 'QAR'))).toBe(true)
    expect(statementOwes(statementClosing(settled, 'QAR'))).toBe(false)
    expect(statementOwes(statementClosing(olderOwed, 'QAR'))).toBe(true)
    expect(statementOwes(statementClosing(coveredByAdvance, 'QAR'))).toBe(false)
  })
  it('the WhatsApp text lists them after the amount, and not on a settled statement', () => {
    const lines = paymentLines(invoice)
    const t = statementText(owed, client, 'QAR', d => d, 'أمين', { payment: lines })
    expect(t).toContain('طرق الدفع:\n  - فوران: 5555 1234\n  - تحويل بنكي — QNB — IBAN QA00 TEST 0000')
    expect(t.indexOf('طرق الدفع')).toBeGreaterThan(t.indexOf('المتبقي عن هذه الفترة'))
    expect(statementText(settled, client, 'QAR', d => d, 'أمين', { payment: lines })).not.toContain('طرق الدفع')
  })
  it('the PDF carries title and phone always, payment only when owed', () => {
    const a = statementPdfModel(owed, client, 'QAR', { sender: 'أمين', today: '2026-10-20', invoice })
    expect(a.issuerTitle).toBe(invoice.title)
    expect(a.issuerPhone).toBe(invoice.phone)
    expect(a.payment).toEqual(['فوران: 5555 1234', 'تحويل بنكي — QNB — IBAN QA00 TEST 0000'])
    const b = statementPdfModel(settled, client, 'QAR', { sender: 'أمين', today: '2026-10-20', invoice })
    expect(b.issuerTitle).toBe(invoice.title)
    expect(b.payment).toBeUndefined()
    const none = statementPdfModel(owed, client, 'QAR', { today: '2026-10-20' })
    expect(none.issuerTitle).toBeUndefined()
    expect(none.payment).toBeUndefined()
  })
  it('renders', async () => {
    Font.register({ family: 'Tajawal', fonts: [{ src: TAJAWAL_REGULAR, fontWeight: 400 }, { src: TAJAWAL_BOLD, fontWeight: 700 }] })
    Font.registerHyphenationCallback(w => [w])
    const m = statementPdfModel(owed, client, 'QAR', { sender: 'أمين', today: '2026-10-20', invoice })
    const buf = await renderToBuffer(React.createElement(StatementPdf, { m }) as React.ReactElement<DocumentProps>)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  }, 30_000)
})

describe('payment lines in the PDF keep account numbers in order', () => {
  it('splits Arabic and Latin runs in reading order', async () => {
    const { bidiRuns } = await import('@/lib/worklog-statement-pdf')
    expect(bidiRuns('فوران: 5555 1234')).toEqual([{ text: 'فوران:', ltr: false }, { text: '5555 1234', ltr: true }])
    expect(bidiRuns('تحويل بنكي — QNB — IBAN QA58 DOHB 0000 1234')).toEqual([
      { text: 'تحويل بنكي —', ltr: false }, { text: 'QNB', ltr: true }, { text: '—', ltr: false }, { text: 'IBAN QA58 DOHB 0000 1234', ltr: true },
    ])
    expect(bidiRuns('نقداً عند الحصة')).toEqual([{ text: 'نقداً عند الحصة', ltr: false }])
  })
})
