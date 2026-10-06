'use client'
import { useState } from 'react'
import { Pause, Pencil, Play, Plus, Repeat, Trash2 } from 'lucide-react'
import {
  EXPENSE_LABEL, dueRecurring, formatMoney, recurringDate,
  type ExpenseCategory, type RecurringExpense,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog } from './useWorkLog'
import { Field, ghostBtn, inputCls, localToday, primaryBtn, shortDate } from './ui'

type Draft = { id?: string; label: string; category: ExpenseCategory; amount: string; day: string; since: string }

/** The date this fixed expense will next be written on: the month after the last one written, on its day. */
function nextDate(r: RecurringExpense): string {
  if (!r.lastMonth) return recurringDate(r.since, r.day)
  const [y, m] = r.lastMonth.split('-').map(Number)
  return recurringDate(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`, r.day)
}

/**
 * Rent and other fixed monthly costs. Entered once; on its day each month a
 * real expense is written, so it counts in every total and report.
 */
export default function RecurringExpenses() {
  const { settings, saveSettings, reload } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const items = settings.recurringExpenses ?? []
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const money = (n: number) => formatMoney(n, settings.currency)

  async function persist(next: Partial<RecurringExpense>[], msg: string) {
    setBusy(true)
    try {
      await saveSettings({ recurringExpenses: next })
      await reload() // a month already due is written by the server on this read
      toast(msg); setDraft(null)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  function save() {
    if (!draft) return
    const row = { ...(draft.id ? { id: draft.id } : {}), label: draft.label.trim(), category: draft.category, amount: Number(draft.amount), day: Number(draft.day), since: draft.since }
    const rest = items.filter(r => r.id !== draft.id)
    persist([...rest, row], draft.id ? 'حُفظ التعديل' : 'أُضيف المصروف الثابت')
  }

  const due = dueRecurring(items, today)
  const monthly = items.filter(r => !r.paused).reduce((s, r) => s + r.amount, 0)

  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-orange-600" />
          <h3 className="font-black text-sm text-gray-900">مصاريف ثابتة شهرية</h3>
          {monthly > 0 && <span className="text-[11px] font-bold text-gray-400">{money(monthly)} / شهر</span>}
        </div>
        {!draft && (
          <button onClick={() => setDraft({ label: items.some(r => r.category === 'rent') ? '' : 'الكراء', category: items.some(r => r.category === 'rent') ? 'other' : 'rent', amount: '', day: '1', since: today.slice(0, 7) })}
            className={ghostBtn('text-xs')}><Plus className="w-3.5 h-3.5" /> إضافة</button>
        )}
      </div>

      {items.length === 0 && !draft && (
        <p className="text-xs text-gray-500 leading-relaxed">الكراء، اشتراك الهاتف، قسط السيارة… أضفه مرة واحدة، ويُسجَّل وحده مصروفاً في يومه من كل شهر.</p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-gray-50">
          {items.map(r => (
            <li key={r.id} className={`flex items-center gap-2 py-2 ${r.paused ? 'opacity-50' : ''}`}>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-sm text-gray-900 truncate">{r.label}{r.label !== EXPENSE_LABEL[r.category] && <span className="text-[11px] font-medium text-gray-400"> · {EXPENSE_LABEL[r.category]}</span>}</span>
                <span className="block text-[11px] text-gray-500">
                  يوم {r.day} من كل شهر{r.paused ? ' · موقوف' : ` · القادم ${shortDate(nextDate(r))}`}
                </span>
              </span>
              <span className="font-black text-sm text-orange-600 whitespace-nowrap">{money(r.amount)}</span>
              <button disabled={busy} onClick={() => setDraft({ id: r.id, label: r.label, category: r.category, amount: String(r.amount), day: String(r.day), since: r.since })}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" aria-label={`تعديل ${r.label}`}><Pencil className="w-3.5 h-3.5" /></button>
              <button disabled={busy} onClick={() => persist(items.map(x => (x.id === r.id ? { ...x, paused: !x.paused } : x)), r.paused ? 'استُؤنف' : 'أُوقف — لن يُسجَّل حتى تستأنفه')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" aria-label={r.paused ? `استئناف ${r.label}` : `إيقاف ${r.label}`}>
                {r.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button disabled={busy} onClick={() => { if (window.confirm(`حذف «${r.label}» من المصاريف الثابتة؟ ما سُجّل منه سابقاً يبقى في المصاريف.`)) persist(items.filter(x => x.id !== r.id), 'حُذف — ما سُجّل سابقاً باقٍ') }}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500" aria-label={`حذف ${r.label}`}><Trash2 className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      {due.length > 0 && <p className="text-[11px] text-amber-700">يُسجَّل {due.length === 1 ? 'شهر مستحق' : `${due.length} أشهر مستحقة`} عند التحديث التالي.</p>}

      {draft && (
        <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم">{id => <input id={id} className={inputCls} value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} maxLength={60} placeholder="الكراء" />}</Field>
            <Field label={`المبلغ الشهري`}>{id => <input id={id} type="number" inputMode="decimal" min={0} className={`${inputCls} font-black`} value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} placeholder="2300" />}</Field>
            <Field label="يوم الدفع من الشهر">
              {id => (
                <select id={id} className={inputCls} value={draft.day} onChange={e => setDraft({ ...draft, day: e.target.value })}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </Field>
            <Field label="ابتداءً من شهر">{id => <input id={id} type="month" className={inputCls} value={draft.since} onChange={e => setDraft({ ...draft, since: e.target.value })} />}</Field>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map(c => (
              <button key={c} type="button" onClick={() => setDraft({ ...draft, category: c })} aria-pressed={draft.category === c}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${draft.category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>{EXPENSE_LABEL[c]}</button>
            ))}
          </div>
          {draft.since < today.slice(0, 7) && !draft.id && (
            <p className="text-[11px] text-amber-700">بداية في شهر سابق: ستُسجَّل الأشهر الماضية كلها دفعة واحدة. اختر هذا الشهر إن كانت مسجّلة يدوياً.</p>
          )}
          <div className="flex gap-2">
            <button disabled={busy || !draft.label.trim() || !(Number(draft.amount) > 0) || !draft.since} onClick={save} className={primaryBtn('flex-1 bg-orange-600 hover:bg-orange-700')}>
              {busy ? 'جارٍ الحفظ…' : 'حفظ'}
            </button>
            <button onClick={() => setDraft(null)} className={ghostBtn()}>إلغاء</button>
          </div>
        </div>
      )}
    </section>
  )
}
