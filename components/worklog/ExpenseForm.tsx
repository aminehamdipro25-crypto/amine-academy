'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import {
  CURRENCY_LABEL, EXPENSE_LABEL, evalAmount, expenseItemsText, formatMoney,
  type ExpenseCategory, type WorkExpense,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog } from './useWorkLog'
import { Field, Sheet, ghostBtn, inputCls, localToday, primaryBtn } from './ui'

type Row = { key: number; label: string; amount: string }

/** One tap names an item — the usual things, per category. */
const QUICK: Partial<Record<ExpenseCategory, string[]>> = {
  transport: ['أوبر', 'كريم', 'تاكسي', 'بنزين', 'مواقف', 'مترو'],
  food: ['قهوة', 'ماء', 'عصير', 'غداء', 'وجبة خفيفة'],
  materials: ['مقتنيات', 'أدوات', 'طباعة', 'ألعاب تعليمية'],
  phone: ['رصيد', 'إنترنت'],
}

let seq = 0
const row = (label = '', amount = ''): Row => ({ key: ++seq, label, amount })
const rowsOf = (e: WorkExpense): Row[] =>
  e.items?.length ? e.items.map(i => row(i.label ?? '', String(i.amount))) : [row('', String(e.amount))]

/**
 * An expense is a list of named items — «أوبر 12 · قهوة 8 · مقتنيات 15» —
 * so even a small one says what it was. The day's expense of a category can
 * be reopened and added to until the evening instead of a new line each time.
 */
export default function ExpenseForm({ open, onClose, expense }: { open: boolean; onClose: () => void; expense?: WorkExpense | null }) {
  const { settings, expenses, create, update, remove } = useWorkLog()
  const { toast } = useToast()
  const [target, setTarget] = useState<WorkExpense | null>(null)
  const [date, setDate] = useState(localToday())
  const [category, setCategory] = useState<ExpenseCategory>('transport')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Row[]>([row()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const amountRefs = useRef(new Map<number, HTMLInputElement>())
  const focusAmount = (key: number) => requestAnimationFrame(() => amountRefs.current.get(key)?.focus())

  useEffect(() => {
    if (!open) return
    setError(''); setSaving(false); setTarget(expense ?? null)
    setDate(expense?.date ?? localToday()); setCategory(expense?.category ?? 'transport'); setNote(expense?.note ?? '')
    setRows(expense ? rowsOf(expense) : [row()])
  }, [open, expense])

  // Today's expense of this category, to add to instead of starting another line.
  const sameDay = useMemo(() => target ? null : expenses
    .filter(e => e.date === date && e.category === category && !e.recurringId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null, [target, expenses, date, category])

  const parsed = rows.map(r => ({ ...r, value: r.amount.trim() ? evalAmount(r.amount) : null }))
  const filled = parsed.filter(r => r.amount.trim())
  const invalid = filled.some(r => r.value === null || r.value <= 0)
  const total = filled.reduce((s, r) => s + (r.value ?? 0), 0)
  const money = (n: number) => formatMoney(n, settings.currency)

  function setRow(key: number, patch: Partial<Row>) { setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r))) }
  function addRow(label = '') {
    const n = row(label)
    setRows(rs => [...rs, n]); focusAmount(n.key)
  }
  function quick(label: string) {
    const empty = rows.find(r => !r.label.trim() && !r.amount.trim()) ?? rows.find(r => !r.label.trim())
    if (empty) { setRow(empty.key, { label }); focusAmount(empty.key) } else addRow(label)
  }
  function joinToday() {
    if (!sameDay) return
    const mine = rows.filter(r => r.amount.trim() || r.label.trim())
    setTarget(sameDay); setNote(sameDay.note ?? note)
    const next = [...rowsOf(sameDay), ...(mine.length ? mine : [row()])]
    setRows(next); focusAmount(next[next.length - 1].key)
  }

  async function save() {
    setError('')
    if (!filled.length) { setError('أدخل مبلغاً واحداً على الأقل'); return }
    if (invalid) { setError('أحد المبالغ غير صالح — راجعه'); return }
    setSaving(true)
    try {
      const items = filled.map(r => ({ label: r.label.trim() || undefined, amount: r.value! }))
      const body = { date, category, note, items, amount: total }
      if (target) await update('expenses', target.id, body)
      else await create('expenses', body)
      toast(target && !expense ? `أُضيف إلى مصروف اليوم — المجموع ${money(total)}` : 'حُفظ المصروف')
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  async function del() {
    if (!expense) return
    setSaving(true)
    try { await remove('expenses', expense.id); toast('حُذف المصروف'); onClose() }
    catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  const title = expense ? 'تعديل مصروف' : target ? `مصروف اليوم · ${EXPENSE_LABEL[category]}` : 'مصروف جديد'
  return (
    <Sheet open={open} onClose={onClose} title={title}
      footer={
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn('flex-1')}>
            {saving ? 'جارٍ الحفظ…' : filled.length ? `حفظ · ${money(total)}` : 'حفظ'}
          </button>
          {expense && <button onClick={del} disabled={saving} className={ghostBtn('text-rose-600')} aria-label="حذف"><Trash2 className="w-4 h-4" /></button>}
        </div>
      }>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-600">الفئة</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} disabled={!!target && !expense}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'} disabled:opacity-60`}>
                {EXPENSE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {sameDay && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-orange-900">لديك مصروف «{EXPENSE_LABEL[category]}» اليوم: {money(sameDay.amount)}</p>
              {sameDay.items?.length ? <p className="text-orange-700 truncate">{expenseItemsText(sameDay.items)}</p> : null}
            </div>
            <button type="button" onClick={joinToday} className={primaryBtn('text-xs bg-orange-600 hover:bg-orange-700 whitespace-nowrap')}>
              <Plus className="w-3.5 h-3.5" /> أضف إليه
            </button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-600">البنود <span className="font-medium text-gray-400">— سمِّ كل مبلغ مهما كان صغيراً</span></p>
          {QUICK[category] && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK[category]!.map(q => (
                <button key={q} type="button" onClick={() => quick(q)} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200">+ {q}</button>
              ))}
            </div>
          )}
          <ul className="space-y-2">
            {parsed.map((r, i) => {
              const bad = !!r.amount.trim() && (r.value === null || r.value <= 0)
              return (
                <li key={r.key} className="flex items-start gap-2">
                  <input aria-label={`اسم البند ${i + 1}`} className={`${inputCls} flex-1 min-w-0`} value={r.label} maxLength={40}
                    placeholder={QUICK[category]?.[0] ? `مثال: ${QUICK[category]![0]}` : 'ما هو؟'}
                    onChange={e => setRow(r.key, { label: e.target.value })} />
                  <div className="w-28 flex-shrink-0">
                    <input ref={el => { if (el) amountRefs.current.set(r.key, el); else amountRefs.current.delete(r.key) }}
                      aria-label={`مبلغ البند ${i + 1} (${CURRENCY_LABEL[settings.currency]})`} dir="ltr" inputMode="decimal" autoComplete="off"
                      className={`${inputCls} text-right font-black ${bad ? 'border-rose-300 bg-rose-50' : ''}`} value={r.amount} placeholder="0"
                      onChange={e => setRow(r.key, { amount: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (r.amount.trim() && !bad) addRow() } }} />
                  </div>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))} className="mt-2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" aria-label={`حذف البند ${i + 1}`}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => addRow()} className={ghostBtn('text-xs')}><Plus className="w-3.5 h-3.5" /> بند آخر</button>
            <p className="text-sm font-black text-gray-900" aria-live="polite">
              المجموع: {money(total)}{filled.length > 1 ? <span className="text-xs font-medium text-gray-400"> · {filled.length} بنود</span> : null}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ">{id => <input id={id} type="date" className={inputCls} value={date} disabled={!!target && !expense} onChange={e => setDate(e.target.value)} />}</Field>
          <Field label="ملاحظة (اختياري)">{id => <input id={id} className={inputCls} value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="مثال: مشوار حصة خالد" />}</Field>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </Sheet>
  )
}
