'use client'
import { useMemo, useState } from 'react'
import { Copy, MessageCircle, TrendingDown, TrendingUp } from 'lucide-react'
import {
  addDays, phoneDigits, progressSummary, progressText, startOfMonth, type WorkClient, type WorkLesson,
} from '@/lib/worklog'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Segmented, Sheet, ghostBtn, localToday, primaryBtn } from './ui'

type Period = 'month' | '30' | '90' | 'all'
const msgDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * A child's lessons as a record of what happened: the specialist's note and
 * own 1–5 rating for each. The ratings are judgements, so the trend is only
 * shown with at least three on each side — two good days are not progress.
 */
export default function ProgressSheet({ client, onClose, onEditLesson }: {
  client: WorkClient | null; onClose: () => void; onEditLesson: (l: WorkLesson) => void
}) {
  const { lessons, settings } = useWorkLog()
  const { toast } = useToast()
  const [period, setPeriod] = useState<Period>('90')
  const today = localToday()
  const from = period === 'month' ? startOfMonth(today) : period === '30' ? addDays(today, -30) : period === '90' ? addDays(today, -90) : '0000-01-01'

  const ps = useMemo(() => (client ? progressSummary(client.id, lessons, from, today) : null), [client, lessons, from, today])
  const text = client && ps ? progressText(ps, client, msgDay) : ''
  const tel = phoneDigits(client?.phone, settings.currency)
  const unrated = ps ? ps.lessons.length - ps.rated : 0

  return (
    <Sheet open={!!client} onClose={onClose} wide title={client ? `سجل التقدّم · ${clientLabel(client)}` : 'سجل التقدّم'}
      footer={
        <div className="flex gap-2">
          <a href={`https://wa.me/${tel ?? ''}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
            className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')}>
            <MessageCircle className="w-4 h-4" /> إرسال للولي عبر واتساب
          </a>
          <button onClick={async () => { try { await navigator.clipboard.writeText(text); toast('نُسخ الملخّص') } catch { toast('تعذّر النسخ', 'error') } }}
            className={ghostBtn()}><Copy className="w-4 h-4" /> نسخ</button>
        </div>
      }>
      {client && ps && (
        <div className="space-y-4">
          <Segmented size="sm" value={period} onChange={setPeriod} options={[
            { value: 'month', label: 'هذا الشهر' }, { value: '30', label: '30 يوماً' }, { value: '90', label: '3 أشهر' }, { value: 'all', label: 'الكل' },
          ]} />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-gray-50 p-2.5"><p className="text-[10px] font-bold text-gray-500">حصص منجزة</p><p className="font-black text-gray-900">{ps.lessons.length}</p></div>
            <div className="rounded-xl bg-amber-50 p-2.5"><p className="text-[10px] font-bold text-amber-700">متوسط تقديرك</p><p className="font-black text-gray-900">{ps.average === null ? '—' : `${ps.average} / 5`}</p></div>
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-[10px] font-bold text-gray-500">الاتجاه</p>
              {ps.trend ? (
                <p className={`font-black inline-flex items-center gap-1 ${ps.trend.recent >= ps.trend.before ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {ps.trend.recent >= ps.trend.before ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {ps.trend.before} ← {ps.trend.recent}
                </p>
              ) : <p className="text-[11px] text-gray-400 mt-1">يلزم 6 تقديرات على الأقل</p>}
            </div>
          </div>
          <p className="text-[11px] text-gray-400">التقييم تقديرك أنت لسير الحصة، لا قياس — والاتجاه يقارن آخر 5 تقديرات بالخمسة قبلها.</p>
          {unrated > 0 && <p className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-600">{unrated} من الحصص بلا تقييم — اضغط أي حصة لتقييمها.</p>}

          <ul className="space-y-2">
            {ps.lessons.length === 0 && <li className="py-6 text-center text-sm text-gray-400">لا حصص منجزة في هذه الفترة</li>}
            {[...ps.lessons].reverse().map(l => (
              <li key={l.id}>
                <button onClick={() => onEditLesson(l)} className="w-full rounded-xl border border-gray-100 px-3 py-2.5 text-right hover:border-brand-200 hover:bg-brand-50/40 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">{msgDay(l.date)} · {l.start}</span>
                    <span className="text-sm" aria-label={l.rating ? `${l.rating} من 5` : 'بلا تقييم'}>{l.rating ? '⭐'.repeat(l.rating) : <span className="text-[11px] text-gray-300">+ تقييم</span>}</span>
                  </div>
                  {l.note ? <p className="mt-1 text-[12px] text-gray-600 leading-relaxed">{l.note}</p> : <p className="mt-1 text-[11px] text-gray-300">بلا ملاحظة</p>}
                </button>
              </li>
            ))}
          </ul>

          <div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">نص الرسالة كما سيُرسَل</p>
            <pre dir="rtl" className="whitespace-pre-wrap rounded-xl bg-[#e7fbe6] border border-emerald-100 p-3 text-[12px] leading-relaxed text-gray-800 font-sans max-h-52 overflow-y-auto">{text}</pre>
          </div>
        </div>
      )}
    </Sheet>
  )
}
