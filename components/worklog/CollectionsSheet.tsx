'use client'
import { useMemo } from 'react'
import { Banknote, FileText, Hourglass } from 'lucide-react'
import { formatMoney, lessonsCount, type WorkClient } from '@/lib/worklog'
import { daysText, debtAge, familiesText, receivables } from '@/lib/worklog-planning'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Sheet, ghostBtn, localToday, primaryBtn, shortDate } from './ui'

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
  const { clients, lessons, payments, settings, clientsById } = useWorkLog()
  const today = localToday()
  const list = useMemo(() => receivables(clients, lessons, payments, today), [clients, lessons, payments, today])
  const total = list.reduce((s, r) => s + r.balance, 0)
  const late = list.filter(r => debtAge(r.daysOutstanding) === 'late')
  const money = (n: number) => formatMoney(n, settings.currency)

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
                  <div className="flex gap-2">
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
