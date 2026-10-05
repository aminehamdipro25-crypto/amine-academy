'use client'
import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Plus, Receipt, Wallet } from 'lucide-react'
import {
  EXPENSE_LABEL, PAYMENT_METHOD_LABEL, endOfMonth, formatMoney, startOfMonth,
  type ExpenseCategory, type WorkExpense, type WorkPayment,
} from '@/lib/worklog'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Empty, Stat, dayLabel, localToday, monthLabel, primaryBtn } from './ui'

const EXPENSE_COLOR = '#E8890C'

/**
 * One month of money, in one of two directions: what came in (payments) or
 * what went out (expenses). They are separate tabs so neither hides behind
 * the other; each still shows the month's net, the number that matters.
 */
export default function MoneyView({ mode, onAdd, onEditPayment, onEditExpense }: {
  mode: 'payments' | 'expenses'
  onAdd: () => void
  onEditPayment: (p: WorkPayment) => void
  onEditExpense: (e: WorkExpense) => void
}) {
  const { payments, expenses, clientsById, settings } = useWorkLog()
  const [month, setMonth] = useState(startOfMonth(localToday()))
  const from = month, to = endOfMonth(month)
  const money = (n: number) => formatMoney(n, settings.currency)

  const monthPayments = useMemo(() => payments.filter(p => p.date >= from && p.date <= to), [payments, from, to])
  const monthExpenses = useMemo(() => expenses.filter(e => e.date >= from && e.date <= to), [expenses, from, to])
  const income = monthPayments.reduce((s, p) => s + p.amount, 0)
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const rows = (mode === 'payments' ? monthPayments : monthExpenses) as (WorkPayment | WorkExpense)[]
  const groups = [...rows]
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
    .reduce<{ date: string; rows: (WorkPayment | WorkExpense)[] }[]>((acc, r) => {
      const g = acc.at(-1)
      if (g && g.date === r.date) g.rows.push(r)
      else acc.push({ date: r.date, rows: [r] })
      return acc
    }, [])

  const byCategory = useMemo(() => {
    const m = new Map<ExpenseCategory, number>()
    for (const e of monthExpenses) m.set(e.category, (m.get(e.category) ?? 0) + e.amount)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [monthExpenses])
  const byFamily = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of monthPayments) m.set(p.clientId, (m.get(p.clientId) ?? 0) + p.amount)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [monthPayments])

  const shiftMonth = (dir: 1 | -1) => {
    const [y, m] = month.split('-').map(Number)
    setMonth(new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10))
  }
  const isIn = mode === 'payments'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الشهر السابق"><ChevronRight className="w-4 h-4" /></button>
          <span className="font-black text-gray-900 min-w-[7rem] text-center">{monthLabel(month)}</span>
          <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الشهر التالي"><ChevronLeft className="w-4 h-4" /></button>
        </div>
        <button onClick={onAdd} className={primaryBtn(isIn ? '' : 'bg-orange-600 hover:bg-orange-700')}>
          <Plus className="w-4 h-4" /> {isIn ? 'استلمت مبلغاً' : 'مصروف'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="المستلم" tone="green" icon={<ArrowDownLeft className="w-3.5 h-3.5" />} value={money(income)} sub={`${monthPayments.length} دفعة`} />
        <Stat label="المصاريف" tone="rose" icon={<ArrowUpRight className="w-3.5 h-3.5" />} value={money(spent)} sub={`${monthExpenses.length} مصروف`} />
        <Stat label="الصافي" tone="violet" icon={<Wallet className="w-3.5 h-3.5" />} value={money(income - spent)} sub="المستلم − المصاريف" />
      </div>

      {/* Where it came from / went */}
      {(isIn ? byFamily.length : byCategory.length) > 0 && (
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-black text-gray-500 mb-3">{isIn ? 'حسب العائلة' : 'حسب الفئة'}</h3>
          <ul className="space-y-2">
            {(isIn ? byFamily : byCategory).map(([key, amount]) => {
              const total = isIn ? income : spent
              const color = isIn ? clientsById.get(key as string)?.color ?? '#94a3b8' : EXPENSE_COLOR
              return (
                <li key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate font-bold text-gray-600">{isIn ? clientLabel(clientsById.get(key as string)) : EXPENSE_LABEL[key as ExpenseCategory]}</span>
                  <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${total ? (amount / total) * 100 : 0}%`, backgroundColor: color }} />
                  </span>
                  <span className="whitespace-nowrap font-bold text-gray-800">{money(amount)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {groups.length === 0 ? (
        <Empty icon={isIn ? <Wallet className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
          title={isIn ? 'لا دفعات مستلمة في هذا الشهر' : 'لا مصاريف في هذا الشهر'}
          text={isIn
            ? 'سجّل كل دفعة يوم تستلمها، مهما كان مبلغها — والمستحقات تُحسب تلقائياً من الحصص المنجزة.'
            : 'البنزين، مواصلات، أدوات ومواد الحصص، الهاتف… سجّلها هنا لترى ربحك الصافي الحقيقي.'}
          action={<button onClick={onAdd} className={primaryBtn(isIn ? '' : 'bg-orange-600 hover:bg-orange-700')}><Plus className="w-4 h-4" /> {isIn ? 'سجّل مبلغاً استلمته' : 'إضافة مصروف'}</button>} />
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.date}>
              <p className="text-[11px] font-bold text-gray-400 mb-1.5 px-1">{dayLabel(g.date)}</p>
              <ul className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {g.rows.map(r => {
                  const p = isIn ? (r as WorkPayment) : null
                  const e = isIn ? null : (r as WorkExpense)
                  return (
                    <li key={r.id}>
                      <button onClick={() => (p ? onEditPayment(p) : onEditExpense(e!))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm text-gray-900 truncate">
                            {p ? clientLabel(clientsById.get(p.clientId)) : EXPENSE_LABEL[e!.category]}
                          </span>
                          <span className="block text-[11px] text-gray-400 truncate">
                            {p ? PAYMENT_METHOD_LABEL[p.method] + (p.lessonId ? ' · عند انتهاء الحصة' : '') : 'مصروف'}{r.note ? ` · ${r.note}` : ''}
                          </span>
                        </span>
                        <span className={`font-black text-sm ${isIn ? 'text-emerald-700' : 'text-orange-600'}`}>
                          {isIn ? '+' : '−'}{money(r.amount)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
