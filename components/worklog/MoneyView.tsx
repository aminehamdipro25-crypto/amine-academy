'use client'
import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Plus, Receipt, Wallet } from 'lucide-react'
import {
  EXPENSE_LABEL, PAYMENT_METHOD_LABEL, endOfMonth, formatMoney, startOfMonth,
  type WorkExpense, type WorkPayment,
} from '@/lib/worklog'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Empty, Segmented, Stat, dayLabel, ghostBtn, localToday, monthLabel, primaryBtn } from './ui'

type Row = { kind: 'in'; row: WorkPayment } | { kind: 'out'; row: WorkExpense }

export default function MoneyView({ onPay, onExpense, onEditPayment, onEditExpense }: {
  onPay: () => void; onExpense: () => void; onEditPayment: (p: WorkPayment) => void; onEditExpense: (e: WorkExpense) => void
}) {
  const { payments, expenses, clientsById, settings } = useWorkLog()
  const [month, setMonth] = useState(startOfMonth(localToday()))
  const [show, setShow] = useState<'all' | 'in' | 'out'>('all')
  const from = month, to = endOfMonth(month)

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = [
      ...payments.filter(p => p.date >= from && p.date <= to).map(row => ({ kind: 'in' as const, row })),
      ...expenses.filter(e => e.date >= from && e.date <= to).map(row => ({ kind: 'out' as const, row })),
    ]
    return r.sort((a, b) => (a.row.date === b.row.date ? b.row.createdAt.localeCompare(a.row.createdAt) : b.row.date.localeCompare(a.row.date)))
  }, [payments, expenses, from, to])

  const income = rows.filter(r => r.kind === 'in').reduce((s, r) => s + r.row.amount, 0)
  const spent = rows.filter(r => r.kind === 'out').reduce((s, r) => s + r.row.amount, 0)
  const visible = rows.filter(r => show === 'all' || r.kind === show)

  // Group by day for a readable statement.
  const groups = visible.reduce<{ date: string; rows: Row[] }[]>((acc, r) => {
    const g = acc.at(-1)
    if (g && g.date === r.row.date) g.rows.push(r)
    else acc.push({ date: r.row.date, rows: [r] })
    return acc
  }, [])

  const shiftMonth = (dir: 1 | -1) => {
    const [y, m] = month.split('-').map(Number)
    setMonth(new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الشهر السابق"><ChevronRight className="w-4 h-4" /></button>
          <span className="font-black text-gray-900 min-w-[7rem] text-center">{monthLabel(month)}</span>
          <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الشهر التالي"><ChevronLeft className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={onExpense} className={ghostBtn()}><ArrowUpRight className="w-4 h-4 text-rose-500" /> مصروف</button>
          <button onClick={onPay} className={primaryBtn()}><Plus className="w-4 h-4" /> دفعة</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="المستلم" tone="green" icon={<ArrowDownLeft className="w-3.5 h-3.5" />} value={formatMoney(income, settings.currency)} />
        <Stat label="المصاريف" tone="rose" icon={<ArrowUpRight className="w-3.5 h-3.5" />} value={formatMoney(spent, settings.currency)} />
        <Stat label="الصافي" tone="violet" icon={<Wallet className="w-3.5 h-3.5" />} value={formatMoney(income - spent, settings.currency)} />
      </div>

      <Segmented value={show} onChange={setShow} options={[{ value: 'all', label: 'الكل' }, { value: 'in', label: 'الدفعات' }, { value: 'out', label: 'المصاريف' }]} />

      {groups.length === 0 ? (
        <Empty icon={<Receipt className="w-5 h-5" />} title="لا حركة مالية في هذا الشهر"
          text="سجّل كل دفعة يوم تستلمها، مهما كان مبلغها — فالمستحقات تُحسب تلقائياً من الحصص المنجزة." />
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.date}>
              <p className="text-[11px] font-bold text-gray-400 mb-1.5 px-1">{dayLabel(g.date)}</p>
              <ul className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {g.rows.map(r => (
                  <li key={r.row.id}>
                    <button onClick={() => (r.kind === 'in' ? onEditPayment(r.row) : onEditExpense(r.row))}
                      className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.kind === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {r.kind === 'in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-sm text-gray-900 truncate">
                          {r.kind === 'in' ? clientLabel(clientsById.get(r.row.clientId)) : EXPENSE_LABEL[r.row.category]}
                        </span>
                        <span className="block text-[11px] text-gray-400 truncate">
                          {r.kind === 'in' ? PAYMENT_METHOD_LABEL[r.row.method] : 'مصروف'}{r.row.note ? ` · ${r.row.note}` : ''}
                        </span>
                      </span>
                      <span className={`font-black text-sm ${r.kind === 'in' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {r.kind === 'in' ? '+' : '−'}{formatMoney(r.row.amount, settings.currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
