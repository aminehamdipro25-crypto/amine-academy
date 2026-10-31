'use client'
import { useState } from 'react'
import { PiggyBank, Pencil } from 'lucide-react'
import { EXPENSE_CATEGORIES, EXPENSE_LABEL, EXPENSE_META, formatMoney, type ExpenseCategory } from '@/lib/worklog'
import { BUDGET_PACE_FROM_DAY, budgetStatus } from '@/lib/worklog-evening'
import { daysText } from '@/lib/worklog-planning'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog } from './useWorkLog'
import { ghostBtn, inputCls, localToday, primaryBtn } from './ui'

const ALL = EXPENSE_CATEGORIES
/** Day-to-day spending — not rent, a family transfer or an ad campaign. */
const DEFAULT_CATEGORIES = ALL.filter(c => EXPENSE_META[c].daily)

const TONE = {
  ok: { bar: 'bg-emerald-500', text: 'text-emerald-700', box: 'border-gray-100 bg-white' },
  near: { bar: 'bg-amber-500', text: 'text-amber-700', box: 'border-amber-200 bg-amber-50/50' },
  over: { bar: 'bg-rose-500', text: 'text-rose-700', box: 'border-rose-200 bg-rose-50/50' },
} as const

/**
 * The monthly ceiling for day-to-day expenses: spent, left, left per remaining
 * day, and where the current pace ends the month. Fixed monthly expenses
 * (rent…) never count — one rent payment would swamp every coffee.
 */
export default function BudgetCard({ month }: { month: string }) {
  const { settings, expenses, saveSettings } = useWorkLog()
  const { toast } = useToast()
  const budget = settings.expenseBudget ?? null
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [cats, setCats] = useState<ExpenseCategory[]>(DEFAULT_CATEGORIES)
  const [busy, setBusy] = useState(false)
  const money = (n: number) => formatMoney(n, settings.currency)

  const open = () => {
    setAmount(budget ? String(budget.amount) : ''); setCats(budget?.categories ?? DEFAULT_CATEGORIES); setEditing(true)
  }
  async function save(value: { amount: number; categories: ExpenseCategory[] } | null) {
    setBusy(true)
    try {
      await saveSettings({ expenseBudget: value })
      toast(value ? 'حُفظت الميزانية' : 'أُزيلت الميزانية'); setEditing(false)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  if (editing) {
    return (
      <section className="rounded-2xl bg-white border border-brand-200 shadow-sm p-4 space-y-3">
        <h3 className="font-black text-sm text-gray-900 inline-flex items-center gap-2"><PiggyBank className="w-4 h-4 text-brand-600" /> ميزانية المصاريف اليومية</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="budget-amount" className="text-xs font-bold text-gray-600 whitespace-nowrap">السقف الشهري</label>
          <input id="budget-amount" type="number" inputMode="decimal" min={0} className={`${inputCls} max-w-[9rem]`} value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="600" autoFocus />
          <span className="text-xs text-gray-500">{settings.currency === 'TND' ? 'د.ت' : 'ر.ق'}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">ما تشمله</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL.map(c => {
              const on = cats.includes(c)
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => setCats(x => (on ? x.filter(y => y !== c) : [...x, c]))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600'}`}>
                  <span aria-hidden>{EXPENSE_META[c].icon}</span> {EXPENSE_LABEL[c]}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">المصاريف الثابتة الشهرية (🔁 الكراء والاشتراكات) لا تُحتسب فيها أبداً.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || !(Number(amount) > 0) || !cats.length} onClick={() => save({ amount: Number(amount), categories: cats })} className={primaryBtn()}>حفظ</button>
          {budget && <button disabled={busy} onClick={() => save(null)} className={ghostBtn('text-rose-600')}>إزالة الميزانية</button>}
          <button onClick={() => setEditing(false)} className={ghostBtn()}>إلغاء</button>
        </div>
      </section>
    )
  }

  if (!budget) {
    return (
      <button onClick={open} className="w-full rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-right hover:border-brand-300 transition">
        <span className="font-black text-sm text-gray-900 inline-flex items-center gap-2"><PiggyBank className="w-4 h-4 text-brand-600" /> حدّد ميزانية شهرية للمصاريف اليومية</span>
        <span className="block mt-1 text-[11px] text-gray-500">مثلاً 600 للأكل والتنقّل — فترى كم بقي، وكم يمكنك أن تصرف في كل يوم متبقٍّ، وأين سينتهي الشهر بهذا الإيقاع.</span>
      </button>
    )
  }

  const b = budgetStatus(expenses, budget, month, localToday())
  const t = TONE[b.state]
  const covers = budget.categories.length === DEFAULT_CATEGORIES.length && DEFAULT_CATEGORIES.every(c => budget.categories.includes(c))
    ? 'كل المصاريف اليومية' : budget.categories.map(c => EXPENSE_LABEL[c]).join('، ')
  return (
    <section className={`rounded-2xl border shadow-sm p-4 space-y-2.5 ${t.box}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-black text-sm text-gray-900 inline-flex items-center gap-2"><PiggyBank className="w-4 h-4 text-brand-600" /> ميزانية الشهر</h3>
          <p className="text-[11px] text-gray-500 truncate">{covers} · دون الثابتة</p>
        </div>
        <button onClick={open} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-500" aria-label="تعديل الميزانية"><Pencil className="w-4 h-4" /></button>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-gray-700">صرفت <b className="text-gray-900">{money(b.spent)}</b> من {money(b.amount)}</p>
        <p className={`text-sm font-black ${t.text}`}>{b.state === 'over' ? `تجاوزت بـ${money(-b.left)}` : `بقي ${money(b.left)}`}</p>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={Math.min(b.pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`صُرف ${b.pct}% من الميزانية`}>
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
      </div>
      <div className="text-[11px] text-gray-600 space-y-0.5">
        {b.daysLeft > 0 && b.perDayLeft !== null && (
          <p>يمكنك أن تصرف ≈ <b>{money(b.perDayLeft)}</b> لليوم فيما تبقّى من الشهر ({daysText(b.daysLeft)} مع اليوم){b.today > 0 ? ` — صرفت اليوم ${money(b.today)}` : ''}.</p>
        )}
        {b.projected !== null
          ? <p className={b.projected > b.amount ? 'text-rose-700 font-bold' : ''}>بهذا الإيقاع سينتهي الشهر عند ≈ {money(b.projected)}{b.projected > b.amount ? ` — أعلى من الميزانية بـ${money(b.projected - b.amount)}` : ''}.</p>
          : b.daysLeft > 0 && <p className="text-gray-400">التوقّع لآخر الشهر يظهر من اليوم {BUDGET_PACE_FROM_DAY} — قبله يقرّره يوم واحد كبير.</p>}
      </div>
    </section>
  )
}
