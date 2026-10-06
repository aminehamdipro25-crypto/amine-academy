import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { WorkClient, WorkExpense, WorkLesson, WorkPayment } from '@/lib/worklog'
import { AnnualPdf, annualModel } from '@/lib/worklog-annual-pdf'
import { registerTajawal } from '@/lib/pdf-fonts'

let n = 0
const lesson = (over: Partial<WorkLesson>): WorkLesson => ({
  id: `l${++n}`, clientId: 'a', date: '2026-03-05', start: '16:00', durationMin: 60, price: 100,
  status: 'done', reminderMin: null, createdAt: '', updatedAt: '', ...over,
})
const pay = (over: Partial<WorkPayment>): WorkPayment => ({ id: `p${++n}`, clientId: 'a', date: '2026-03-06', amount: 100, method: 'cash', createdAt: '', ...over })
const clients = [{ id: 'a', name: 'أبو خالد', childName: 'خالد' }, { id: 'b', name: 'أم حمد' }] as WorkClient[]
const exp: WorkExpense[] = [{ id: 'e', date: '2026-04-01', amount: 30, category: 'transport', createdAt: '' }]

const data = {
  clients,
  lessons: [
    lesson({ date: '2026-03-05' }), lesson({ date: '2026-03-12' }), lesson({ clientId: 'b', date: '2026-04-02', price: 150 }),
    lesson({ date: '2026-04-09', status: 'cancelled', charged: false }),
    lesson({ date: '2025-12-30' }), // another year
    lesson({ date: '2026-09-30', status: 'scheduled' }), // past, no status
  ],
  payments: [pay({}), pay({ clientId: 'b', date: '2026-04-03', amount: 150 })],
  expenses: exp,
}

describe('annual report model', () => {
  const m = annualModel(2026, data, 'QAR', { today: '2026-10-06', sender: 'الأستاذ أمين' })

  it('twelve months, and the months add up to the year', () => {
    expect(m.months).toHaveLength(12)
    expect(m.months.reduce((s, x) => s + x.lessons, 0)).toBe(m.totals.lessons)
    expect(m.totals.lessons).toBe(3)
    expect(m.totals.earned).toContain('350')
    expect(m.totals.net).toContain('220') // 250 collected − 30 expenses
  })

  it('marks the best month, leaves quiet months visibly empty', () => {
    expect(m.months[2]).toMatchObject({ best: true, lessons: 2, share: 1 })
    expect(m.months[3].share).toBeCloseTo(0.75)
    expect(m.months[0]).toMatchObject({ empty: true, earned: '—' })
  })

  it('families, expenses and cancellations are named', () => {
    expect(m.families.map(f => f.name)).toEqual(['خالد · أبو خالد', 'أم حمد'])
    expect(m.expenses[0]).toMatchObject({ label: expect.any(String), pct: 1 })
    expect(m.cancellations?.line).toContain('حصة واحدة ملغاة من 4')
    expect(m.cancellations?.lost).toContain('100')
  })

  it('says the year is still running, and what is left out', () => {
    expect(m.coverage).toContain('حتى')
    expect(m.notes.join(' ')).toContain('لم تُحدَّد حالتها')
    expect(m.issuer).toBe('الأستاذ أمين')
    expect(annualModel(2025, data, 'QAR', { today: '2026-10-06' }).coverage).toContain('31 ديسمبر')
  })

  it('an empty year is said, not drawn as twelve rows of dashes', () => {
    expect(annualModel(2020, data, 'QAR', { today: '2026-10-06' }).empty).toBe(true)
  })

  it('renders a real PDF', async () => {
    registerTajawal()
    const buf = await renderToBuffer(React.createElement(AnnualPdf, { m }) as React.ReactElement<DocumentProps>)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  }, 30_000)
})
