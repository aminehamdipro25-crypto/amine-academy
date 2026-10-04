'use client'
import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  CURRENCY_LABEL, EXPENSE_LABEL, PAYMENT_METHOD_LABEL, clientBalances, formatMoney,
  type ExpenseCategory, type PaymentMethod, type WorkExpense, type WorkPayment,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Field, Sheet, Segmented, ghostBtn, inputCls, localToday, primaryBtn } from './ui'

export function PaymentForm({ open, onClose, payment, clientId: presetClient }: {
  open: boolean; onClose: () => void; payment?: WorkPayment | null; clientId?: string
}) {
  const { clients, lessons, payments, settings, create, update, remove } = useWorkLog()
  const { toast } = useToast()
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(localToday())
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const balances = useMemo(
    () => new Map(clientBalances(clients, lessons, payments, localToday()).map(b => [b.clientId, b])),
    [clients, lessons, payments],
  )

  useEffect(() => {
    if (!open) return
    setError(''); setSaving(false)
    setClientId(payment?.clientId ?? presetClient ?? ''); setDate(payment?.date ?? localToday())
    setAmount(payment ? String(payment.amount) : ''); setMethod(payment?.method ?? 'cash'); setNote(payment?.note ?? '')
  }, [open, payment, presetClient])

  const bal = balances.get(clientId)
  const options = clients.filter(c => !c.archived || c.id === clientId || c.id === payment?.clientId)

  async function save() {
    setError('')
    if (!clientId) { setError('اختر العائلة'); return }
    if (!(Number(amount) > 0)) { setError('أدخل المبلغ'); return }
    setSaving(true)
    try {
      const body = { clientId, date, amount: Number(amount), method, note }
      if (payment) await update('payments', payment.id, body)
      else await create('payments', body)
      toast(payment ? 'حُفظت الدفعة' : `سُجّلت دفعة ${formatMoney(Number(amount), settings.currency)}`)
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  async function del() {
    if (!payment) return
    setSaving(true)
    try { await remove('payments', payment.id); toast('حُذفت الدفعة'); onClose() }
    catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={payment ? 'تعديل دفعة' : 'تسجيل دفعة مستلمة'}
      footer={
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn('flex-1')}>{saving ? 'جارٍ الحفظ…' : 'حفظ الدفعة'}</button>
          {payment && <button onClick={del} disabled={saving} className={ghostBtn('text-rose-600')} aria-label="حذف"><Trash2 className="w-4 h-4" /></button>}
        </div>
      }>
      <div className="space-y-4">
        <Field label="من العائلة">
          {id => (
            <select id={id} className={inputCls} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">— اختر —</option>
              {options.map(c => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}
            </select>
          )}
        </Field>
        {bal && !payment && (
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 flex items-center justify-between gap-2">
            {bal.balance > 0 ? (
              <>
                <span>المستحق حالياً: <b className="text-gray-900">{formatMoney(bal.balance, settings.currency)}</b> ({bal.lessonsSinceLastPayment} حصة منذ آخر دفعة)</span>
                <button type="button" onClick={() => setAmount(String(bal.balance))} className="rounded-lg bg-white border border-gray-200 px-2 py-1 font-bold text-brand-700">كامل المبلغ</button>
              </>
            ) : bal.balance < 0 ? (
              <span>لدى العائلة رصيد مدفوع مسبقاً: <b>{formatMoney(-bal.balance, settings.currency)}</b></span>
            ) : <span>لا مستحقات حالياً — الدفعة ستُسجَّل رصيداً مسبقاً</span>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`المبلغ (${CURRENCY_LABEL[settings.currency]})`}>
            {id => <input id={id} type="number" min={0} step="any" inputMode="decimal" className={`${inputCls} text-lg font-black`} value={amount} onChange={e => setAmount(e.target.value)} />}
          </Field>
          <Field label="تاريخ الاستلام">{id => <input id={id} type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />}</Field>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-600">طريقة الدفع</span>
          <Segmented value={method} onChange={setMethod}
            options={(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(m => ({ value: m, label: PAYMENT_METHOD_LABEL[m] }))} />
        </div>
        <Field label="ملاحظة (اختياري)">{id => <input id={id} className={inputCls} value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="مثال: عن حصص شهر سبتمبر" />}</Field>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </Sheet>
  )
}

export function ExpenseForm({ open, onClose, expense }: { open: boolean; onClose: () => void; expense?: WorkExpense | null }) {
  const { settings, create, update, remove } = useWorkLog()
  const { toast } = useToast()
  const [date, setDate] = useState(localToday())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('transport')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError(''); setSaving(false)
    setDate(expense?.date ?? localToday()); setAmount(expense ? String(expense.amount) : '')
    setCategory(expense?.category ?? 'transport'); setNote(expense?.note ?? '')
  }, [open, expense])

  async function save() {
    setError('')
    if (!(Number(amount) > 0)) { setError('أدخل المبلغ'); return }
    setSaving(true)
    try {
      const body = { date, amount: Number(amount), category, note }
      if (expense) await update('expenses', expense.id, body)
      else await create('expenses', body)
      toast('حُفظ المصروف')
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  async function del() {
    if (!expense) return
    setSaving(true)
    try { await remove('expenses', expense.id); toast('حُذف المصروف'); onClose() }
    catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={expense ? 'تعديل مصروف' : 'مصروف جديد'}
      footer={
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn('flex-1')}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          {expense && <button onClick={del} disabled={saving} className={ghostBtn('text-rose-600')} aria-label="حذف"><Trash2 className="w-4 h-4" /></button>}
        </div>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`المبلغ (${CURRENCY_LABEL[settings.currency]})`}>
            {id => <input id={id} type="number" min={0} step="any" inputMode="decimal" className={`${inputCls} text-lg font-black`} value={amount} onChange={e => setAmount(e.target.value)} autoFocus />}
          </Field>
          <Field label="التاريخ">{id => <input id={id} type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />}</Field>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-600">الفئة</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                {EXPENSE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <Field label="ملاحظة (اختياري)">{id => <input id={id} className={inputCls} value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="مثال: بنزين الأسبوع" />}</Field>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </Sheet>
  )
}
