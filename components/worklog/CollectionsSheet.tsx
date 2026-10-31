'use client'
import { useMemo, useState } from 'react'
import { Banknote, BellRing, FileText, Hourglass, MessageCircle } from 'lucide-react'
import { formatMoney, lessonsCount, phoneDigits, type WorkClient } from '@/lib/worklog'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import {
  DUES_REMIND_COOLDOWN_DAYS, daysText, debtAge, duesReminderText, familiesText, receivables, remindedRecently, type Receivable,
} from '@/lib/worklog-planning'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Sheet, ghostBtn, localToday, primaryBtn, shortDate } from './ui'

const msgDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { day: 'numeric', month: 'long' })

const AGE_STYLE = {
  fresh: 'bg-gray-100 text-gray-600',
  due: 'bg-amber-100 text-amber-800',
  late: 'bg-rose-100 text-rose-700',
} as const

/**
 * Everyone who owes, the longest-waiting first, with what to do about it in
 * one tap: send the statement, or record the payment that just arrived.
 */
export default function CollectionsSheet({ open, onClose, onStatement, onPay }: {
  open: boolean; onClose: () => void; onStatement: (c: WorkClient) => void; onPay: (clientId: string) => void
}) {
  const { clients, lessons, payments, settings, clientsById, update } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const list = useMemo(() => receivables(clients, lessons, payments, today), [clients, lessons, payments, today])
  const total = list.reduce((s, r) => s + r.balance, 0)
  const late = list.filter(r => debtAge(r.daysOutstanding) === 'late')
  const money = (n: number) => formatMoney(n, settings.currency)

  // «ذكّر الكل»: wa.me opens one chat at a time, so it is a queue — one family, send, next.
  const telOf = (c?: WorkClient) => phoneDigits(c?.phone, settings.currency)
  const due = list.filter(r => { const c = clientsById.get(r.clientId); return c && telOf(c) && !remindedRecently(c, today) })
  const noPhone = list.filter(r => !telOf(clientsById.get(r.clientId)))
  const [queue, setQueue] = useState<string[] | null>(null)
  const [step, setStep] = useState(0)
  const [sent, setSent] = useState(0)
  const [draft, setDraft] = useState('')
  const textFor = (r: Receivable) => {
    const c = clientsById.get(r.clientId)
    return c ? duesReminderText(c, r, settings.currency, msgDay, settings.senderName) : ''
  }
  const start = () => {
    const ids = due.map(r => r.clientId)
    setQueue(ids); setStep(0); setSent(0)
    const first = list.find(r => r.clientId === ids[0]); setDraft(first ? textFor(first) : '')
  }
  const goTo = (i: number) => {
    setStep(i)
    const r = queue && list.find(x => x.clientId === queue[i]); setDraft(r ? textFor(r) : '')
  }
  /** The server stamps the time; a failed stamp only loses the «ذُكّرت» badge, never the message. */
  const markReminded = (clientId: string) => {
    update('clients', clientId, { duesReminded: true }).catch(e => toast(`أُرسلت الرسالة، لكن لم يُسجَّل التذكير: ${(e as Error).message}`, 'error'))
  }
  const current = queue ? list.find(r => r.clientId === queue[step]) : undefined
  const currentClient = current ? clientsById.get(current.clientId) : undefined

  if (queue) {
    return (
      <Sheet open={open} onClose={() => { setQueue(null); onClose() }} wide title="تذكير العائلات بالمستحقات">
        <div className="space-y-4">
          {current && currentClient ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-500">{step + 1} من {queue.length}</p>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${((step + 1) / queue.length) * 100}%` }} /></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ backgroundColor: currentClient.color }}>
                  {(currentClient.childName || currentClient.name).charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{clientLabel(currentClient)}</p>
                  <p className="text-[11px] text-gray-500">{lessonsCount(current.unpaidLessons)} غير مدفوعة{current.oldestUnpaidDate ? ` · منذ ${shortDate(current.oldestUnpaidDate)}` : ''}</p>
                </div>
                <p className="font-black text-gray-900">{money(current.balance)}</p>
              </div>
              <div>
                <label htmlFor="dues-msg" className="text-xs font-bold text-gray-600">الرسالة — عدّلها كما تشاء قبل الإرسال</label>
                <textarea id="dues-msg" rows={9} className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800 outline-none focus:border-brand-400"
                  value={draft} onChange={e => setDraft(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/${telOf(currentClient)}?text=${encodeURIComponent(draft)}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => { markReminded(currentClient.id); setSent(n => n + 1); if (step + 1 < queue.length) goTo(step + 1); else setStep(queue.length) }}
                  className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')}>
                  <MessageCircle className="w-4 h-4" /> أرسل على واتساب{step + 1 < queue.length ? ' ثم التالي' : ''}
                </a>
                <button onClick={() => (step + 1 < queue.length ? goTo(step + 1) : setStep(queue.length))} className={ghostBtn()}>تخطَّ</button>
                <button onClick={() => onStatement(currentClient)} className={ghostBtn()}><FileText className="w-4 h-4" /> الكشف</button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-3xl">✅</p>
              <p className="font-black text-gray-900">{sent ? `أُرسل التذكير إلى ${familiesText(sent)}` : 'لم يُرسَل شيء'}</p>
              <p className="text-xs text-gray-500">لن تظهر هذه العائلات في «ذكّر الكل» قبل {daysText(DUES_REMIND_COOLDOWN_DAYS)}.</p>
            </div>
          )}
          <button onClick={() => setQueue(null)} className={ghostBtn('w-full')}>{current ? 'إنهاء والعودة للقائمة' : 'العودة للقائمة'}</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} wide title="من عليه مبالغ">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-brand-50 p-3">
            <p className="text-[11px] font-bold text-brand-700">المجموع</p>
            <p className="text-xl font-black text-gray-900">{money(total)}</p>
            <p className="text-[11px] text-gray-500">{familiesText(list.length)}</p>
          </div>
          <div className={`rounded-2xl p-3 ${late.length ? 'bg-rose-50' : 'bg-emerald-50'}`}>
            <p className={`text-[11px] font-bold ${late.length ? 'text-rose-700' : 'text-emerald-700'}`}>متأخر أكثر من شهر</p>
            <p className="text-xl font-black text-gray-900">{late.length ? money(late.reduce((s, r) => s + r.balance, 0)) : 'لا شيء'}</p>
            <p className="text-[11px] text-gray-500">{late.length ? `لدى ${familiesText(late.length)}` : 'كل المستحقات حديثة'}</p>
          </div>
        </div>

        {list.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
            <button onClick={start} disabled={!due.length} className={primaryBtn('w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50')}>
              <BellRing className="w-4 h-4" /> {due.length ? `ذكّر العائلات على واتساب (${due.length})` : 'كل العائلات ذُكّرت مؤخراً'}
            </button>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              رسالة مهذّبة لكل عائلة بمبلغها وعدد حصصها ومنذ متى، تراجعها وتعدّلها قبل الإرسال، واحدة تلو الأخرى.
              {list.length - due.length - noPhone.length > 0 ? ` العائلات التي ذُكّرت خلال آخر ${daysText(DUES_REMIND_COOLDOWN_DAYS)} لا تدخل.` : ''}
              {noPhone.length ? ` بلا رقم هاتف: ${noPhone.map(r => clientLabel(clientsById.get(r.clientId))).join('، ')}.` : ''}
            </p>
          </div>
        )}

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">🎉 كل العائلات مسدّدة — لا مبالغ معلّقة.</p>
        ) : (
          <ul className="space-y-2">
            {list.map(r => {
              const c = clientsById.get(r.clientId)
              if (!c) return null
              const age = debtAge(r.daysOutstanding)
              return (
                <li key={r.clientId} className="rounded-2xl border border-gray-100 bg-white p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ backgroundColor: c.color }}>
                      {(c.childName || c.name).charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{clientLabel(c)}{c.archived ? <span className="mr-1 text-[10px] font-bold text-gray-400">(مؤرشفة)</span> : null}</p>
                      <p className="text-[11px] text-gray-500">
                        {lessonsCount(r.unpaidLessons)} غير مدفوعة
                        {r.oldestUnpaidDate ? ` · أقدمها ${shortDate(r.oldestUnpaidDate)}` : ''}
                        {r.lastPaymentDate ? ` · آخر دفعة ${shortDate(r.lastPaymentDate)}` : ' · لم تدفع بعد'}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="font-black text-gray-900">{money(r.balance)}</p>
                      {r.daysOutstanding !== null && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${AGE_STYLE[age]}`}>
                          <Hourglass className="w-3 h-3" /> {r.daysOutstanding === 0 ? 'اليوم' : `منذ ${daysText(r.daysOutstanding)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.duesRemindedAt && (
                    <p className="text-[10px] font-bold text-emerald-700">✓ ذُكّرت بالمبلغ {shortDate(c.duesRemindedAt.slice(0, 10))}</p>
                  )}
                  <div className="flex gap-2">
                    {telOf(c) && (
                      <a href={`https://wa.me/${telOf(c)}?text=${encodeURIComponent(textFor(r))}`} target="_blank" rel="noopener noreferrer" onClick={() => markReminded(c.id)}
                        className={ghostBtn('flex-1 text-xs py-1.5')} aria-label={`ذكّر ${clientLabel(c)} بالمبلغ على واتساب`}>
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> ذكّر
                      </a>
                    )}
                    <button onClick={() => onStatement(c)} className={primaryBtn('flex-1 text-xs py-1.5')}><FileText className="w-3.5 h-3.5" /> كشف الحساب</button>
                    <button onClick={() => onPay(c.id)} className={ghostBtn('flex-1 text-xs py-1.5')}><Banknote className="w-3.5 h-3.5 text-emerald-600" /> سجّل دفعة</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-[11px] text-gray-400 leading-relaxed">
          الدفعات تُحتسب للحصص الأقدم أولاً، فـ«منذ» تعني عمر أول حصة لم يصلها المال. الحصص التي لم تُحدَّد حالتها (تمّت/ملغاة) لا تدخل هنا.
        </p>
      </div>
    </Sheet>
  )
}
