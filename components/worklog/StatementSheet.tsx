'use client'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Copy, MessageCircle } from 'lucide-react'
import {
  addDays, buildStatement, clientBalances, endOfMonth, formatDuration, formatMoney, isBillable, lessonsCount, phoneDigits,
  startOfMonth, statementText, type WorkClient,
} from '@/lib/worklog'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Field, Segmented, Sheet, ghostBtn, inputCls, localToday, primaryBtn } from './ui'

type Period = 'since' | 'month' | 'lastMonth' | 'all' | 'custom'

/**
 * "الأحد، 5 أكتوبر". The month is spelled out on purpose: a numeric 5/10 is
 * reordered by bidi inside Arabic text (it showed as «10/5»), and a parent
 * cannot tell which number is the day.
 */
const msgDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

export default function StatementSheet({ client, onClose }: { client: WorkClient | null; onClose: () => void }) {
  const { lessons, payments, settings } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const [period, setPeriod] = useState<Period>('since')
  const [custom, setCustom] = useState({ from: startOfMonth(today), to: today })

  const balance = useMemo(
    () => (client ? clientBalances([client], lessons, payments, today)[0] : null),
    [client, lessons, payments, today],
  )

  // Open on the period that answers "what is owed": since the last payment —
  // unless nothing is owed, where that range is empty (a payment received
  // today gives "5 → 5 October, no lessons") and this month is what is useful.
  const owes = (balance?.balance ?? 0) > 0
  useEffect(() => { if (client) setPeriod(owes ? 'since' : 'month') }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const range = useMemo(() => {
    if (!client) return { from: today, to: today }
    const own = lessons.filter(l => l.clientId === client.id).map(l => l.date).sort()
    const first = own[0] ?? today
    switch (period) {
      case 'since': return { from: balance?.lastPaymentDate ? addDays(balance.lastPaymentDate, 1) : first, to: today }
      case 'month': return { from: startOfMonth(today), to: endOfMonth(today) }
      case 'lastMonth': { const lm = addDays(startOfMonth(today), -1); return { from: startOfMonth(lm), to: endOfMonth(lm) } }
      case 'all': return { from: first, to: today }
      default: return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from }
    }
  }, [client, lessons, period, custom, balance, today])

  const st = useMemo(
    () => (client ? buildStatement(client.id, lessons, payments, range.from, range.to, today) : null),
    [client, lessons, payments, range, today],
  )
  const text = client && st ? statementText(st, client, settings.currency, msgDay, settings.senderName) : ''
  const tel = phoneDigits(client?.phone, settings.currency)
  const money = (n: number) => formatMoney(n, settings.currency)

  async function copy() {
    try { await navigator.clipboard.writeText(text); toast('نُسخ الكشف') } catch { toast('تعذّر النسخ — حدّد النص وانسخه يدوياً', 'error') }
  }

  return (
    <Sheet open={!!client} onClose={onClose} wide title={client ? `كشف حساب · ${clientLabel(client)}` : 'كشف حساب'}
      footer={
        <div className="flex gap-2">
          {tel ? (
            <a href={`https://wa.me/${tel}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
              className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')}>
              <MessageCircle className="w-4 h-4" /> إرسال عبر واتساب
            </a>
          ) : (
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
              className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')} title="لا رقم هاتف لهذه العائلة — اختر المحادثة في واتساب">
              <MessageCircle className="w-4 h-4" /> واتساب (اختر المحادثة)
            </a>
          )}
          <button onClick={copy} className={ghostBtn()}><Copy className="w-4 h-4" /> نسخ</button>
        </div>
      }>
      {client && st && (
        <div className="space-y-4">
          <div className="overflow-x-auto -mx-1 px-1">
            <Segmented size="sm" value={period} onChange={setPeriod} options={[
              { value: 'since', label: 'منذ آخر دفعة' }, { value: 'month', label: 'هذا الشهر' },
              { value: 'lastMonth', label: 'الشهر الماضي' }, { value: 'all', label: 'الكل' }, { value: 'custom', label: 'مخصّص' },
            ]} />
          </div>
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="من">{id => <input id={id} type="date" className={inputCls} value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />}</Field>
              <Field label="إلى">{id => <input id={id} type="date" className={inputCls} value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />}</Field>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-gray-50 p-2.5"><p className="text-[10px] font-bold text-gray-500">الحصص المحتسبة</p><p className="font-black text-gray-900">{lessonsCount(st.billedCount)}</p><p className="text-[10px] text-gray-500">{formatDuration(st.billedMinutes)}</p><p className="text-[10px] text-gray-500">{money(st.billed)}</p></div>
            <div className="rounded-xl bg-emerald-50 p-2.5"><p className="text-[10px] font-bold text-emerald-700">مدفوع في الفترة</p><p className="font-black text-gray-900">{money(st.paidInPeriod)}</p></div>
            <div className={`rounded-xl p-2.5 ${st.balance > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}><p className={`text-[10px] font-bold ${st.balance > 0 ? 'text-amber-700' : 'text-gray-500'}`}>{st.balance < 0 ? 'رصيد مسبق' : 'المتبقي حتى اليوم'}</p><p className="font-black text-gray-900">{money(Math.abs(st.balance))}</p></div>
          </div>

          {st.unconfirmed > 0 && (
            <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {st.unconfirmed} حصة في هذه الفترة بلا حالة (تمّت/ملغاة) فلا تظهر في الكشف — حدّدها من اليومية قبل الإرسال.
            </p>
          )}

          <ul className="rounded-xl border border-gray-100 divide-y divide-gray-50 text-xs">
            {st.lessons.length === 0 && (
              <li className="px-3 py-4 text-center text-gray-400">
                {period === 'since' && balance?.lastPaymentDate
                  ? `لا حصص بعد آخر مبلغ استلمته (${msgDay(balance.lastPaymentDate)})${owes ? '' : ' — الحساب مسدَّد'}. اختر «هذا الشهر» أو «الكل» لكشف أطول.`
                  : 'لا حصص في هذه الفترة'}
              </li>
            )}
            {st.lessons.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-gray-700">{msgDay(l.date)} · {l.start} · {formatDuration(l.durationMin)}</span>
                <span className={isBillable(l) ? 'font-bold text-gray-900' : 'text-rose-600'}>
                  {l.status === 'done' ? money(l.price) : l.charged ? `ملغاة · ${money(l.price)}` : 'ملغاة · غير محتسبة'}{l.status === 'cancelled' && l.cancelReason ? ` · ${l.cancelReason}` : ''}
                </span>
              </li>
            ))}
          </ul>

          <div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">نص الرسالة كما سيُرسَل</p>
            <pre dir="rtl" className="whitespace-pre-wrap rounded-xl bg-[#e7fbe6] border border-emerald-100 p-3 text-[12px] leading-relaxed text-gray-800 font-sans max-h-60 overflow-y-auto">{text}</pre>
          </div>
        </div>
      )}
    </Sheet>
  )
}
