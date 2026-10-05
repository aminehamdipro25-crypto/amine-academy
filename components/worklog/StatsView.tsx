'use client'
import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Ban, CheckCircle2, FileSpreadsheet, Clock, Coins, Hourglass, PiggyBank, TrendingDown, Wallet } from 'lucide-react'
import {
  EXPENSE_LABEL, STATUS_META, addDays, endOfMonth, formatHours, formatMoney, monthlyMoney, periodStats,
  startOfMonth, startOfWeek, weeklyHours,
} from '@/lib/worklog'
import { clientLabel, useWorkLog } from './useWorkLog'
import { useToast } from '@/components/ui/Toast'
import { downloadLedgerXlsx } from './exportXlsx'
import { Field, Segmented, Stat, ghostBtn, inputCls, localToday, monthLabel, shortDate } from './ui'

type Preset = 'week' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom'
const INCOME_COLOR = '#7C5CFC'
const EXPENSE_COLOR = '#E8890C'
const WEEKDAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']

function range(p: Preset, today: string, custom: { from: string; to: string }) {
  switch (p) {
    case 'week': return { from: startOfWeek(today), to: addDays(startOfWeek(today), 6) }
    case 'month': return { from: startOfMonth(today), to: endOfMonth(today) }
    case 'lastMonth': { const lm = addDays(startOfMonth(today), -1); return { from: startOfMonth(lm), to: endOfMonth(lm) } }
    case 'quarter': { const [y, m] = today.split('-').map(Number); return { from: new Date(Date.UTC(y, m - 3, 1)).toISOString().slice(0, 10), to: endOfMonth(today) } }
    case 'year': return { from: today.slice(0, 4) + '-01-01', to: today.slice(0, 4) + '-12-31' }
    default: return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from }
  }
}

export default function StatsView() {
  const { lessons, payments, expenses, clientsById, settings, data } = useWorkLog()
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const today = localToday()
  const [preset, setPreset] = useState<Preset>('month')
  const [custom, setCustom] = useState({ from: startOfMonth(today), to: today })
  const { from, to } = range(preset, today, custom)
  const cur = settings.currency
  const money = (n: number) => formatMoney(n, cur)

  const s = useMemo(() => periodStats(lessons, payments, expenses, from, to), [lessons, payments, expenses, from, to])
  const weeks = useMemo(() => weeklyHours(lessons, from, to), [lessons, from, to])
  const months = useMemo(() => {
    // Always at least the last 6 months, so one month's figure has context.
    const [y, m] = to.split('-').map(Number)
    const sixBack = new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 10)
    return monthlyMoney(lessons, payments, expenses, from < sixBack ? from : sixBack, to)
  }, [lessons, payments, expenses, from, to])

  const decided = s.lessonsDone + s.lessonsCancelled
  const maxClientEarned = Math.max(1, ...s.byClient.map(c => c.earned))
  const maxWeekday = Math.max(1, ...s.byWeekday.map(w => w.minutes))
  const totalExpenses = s.byExpenseCategory.reduce((a, c) => a + c.amount, 0) || 1

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="overflow-x-auto -mx-1 px-1">
          <Segmented value={preset} onChange={setPreset} options={[
            { value: 'week', label: 'هذا الأسبوع' }, { value: 'month', label: 'هذا الشهر' }, { value: 'lastMonth', label: 'الشهر الماضي' },
            { value: 'quarter', label: '3 أشهر' }, { value: 'year', label: 'هذه السنة' }, { value: 'custom', label: 'مخصّص' },
          ]} />
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <Field label="من">{id => <input id={id} type="date" className={inputCls} value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />}</Field>
            <Field label="إلى">{id => <input id={id} type="date" className={inputCls} value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />}</Field>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">{shortDate(from)} – {shortDate(to)}</p>
          <button disabled={exporting} className={ghostBtn('text-xs')}
            onClick={async () => {
              setExporting(true)
              try { await downloadLedgerXlsx(data, from, to, today); toast('نُزّل ملف Excel') }
              catch (e) { toast(`تعذّر إنشاء الملف: ${(e as Error).message}`, 'error') }
              finally { setExporting(false) }
            }}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {exporting ? 'جارٍ التجهيز…' : 'تصدير Excel لهذه الفترة'}
          </button>
        </div>
      </div>

      {/* Hours */}
      <section>
        <h3 className="text-xs font-black text-gray-500 mb-2">الساعات</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Stat label="ساعات منجزة" tone="green" icon={<CheckCircle2 className="w-3.5 h-3.5" />} value={`${formatHours(s.minutesDone)} س`} sub={`${s.lessonsDone} حصة`} />
          <Stat label="ساعات ملغاة" tone="rose" icon={<Ban className="w-3.5 h-3.5" />} value={`${formatHours(s.minutesCancelled)} س`}
            sub={`${s.lessonsCancelled} حصة · العائلة ${s.cancelledByFamily} / أنا ${s.cancelledByMe}`} />
          <Stat label="نسبة الإلغاء" tone="amber" icon={<TrendingDown className="w-3.5 h-3.5" />}
            value={s.cancellationRate === null ? '—' : `${Math.round(s.cancellationRate * 100)}%`}
            sub={s.cancellationRate === null ? 'لا حصص منتهية بعد' : `من ${decided} حصة منتهية`} />
          <Stat label="مجدولة متبقية" tone="blue" icon={<Hourglass className="w-3.5 h-3.5" />} value={`${formatHours(s.minutesScheduled)} س`} sub={`${s.lessonsScheduled} حصة · ${money(s.expected)}`} />
        </div>
      </section>

      {/* Money */}
      <section>
        <h3 className="text-xs font-black text-gray-500 mb-2">المال</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Stat label="قيمة العمل المنجز" tone="violet" icon={<Coins className="w-3.5 h-3.5" />} value={money(s.earned)} sub="ما استحققته عن حصص الفترة" />
          <Stat label="المستلم فعلاً" tone="green" icon={<Wallet className="w-3.5 h-3.5" />} value={money(s.collected)} sub="دفعات وصلت في الفترة" />
          <Stat label="المصاريف" tone="rose" icon={<TrendingDown className="w-3.5 h-3.5" />} value={money(s.expenses)} />
          <Stat label="الصافي في اليد" tone="gray" icon={<PiggyBank className="w-3.5 h-3.5" />} value={money(s.net)} sub="المستلم − المصاريف" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
          <Stat label="متوسط سعر الساعة" icon={<Clock className="w-3.5 h-3.5" />} value={s.avgHourly === null ? '—' : money(s.avgHourly)} />
          <Stat label="ضاع بسبب الإلغاء" icon={<Ban className="w-3.5 h-3.5" />} value={money(s.lostToCancellations)} sub="إلغاءات غير مدفوعة" />
        </div>
      </section>

      {/* Weekly hours chart */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-black text-gray-900 text-sm">الساعات أسبوعياً</h3>
        <p className="text-[11px] text-gray-400 mb-3">منجزة وملغاة ومجدولة، لكل أسبوع يبدأ الإثنين</p>
        {weeks.some(w => w.done || w.cancelled || w.scheduled) ? (
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks.map(w => ({ ...w, label: shortDate(w.week) }))} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, direction: 'rtl' }}
                  formatter={(v: number, name: string) => [`${v} س`, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="done" name={STATUS_META.done.label} stackId="h" fill={STATUS_META.done.color} stroke="#fff" strokeWidth={1} animationDuration={500} />
                <Bar dataKey="cancelled" name={STATUS_META.cancelled.label} stackId="h" fill={STATUS_META.cancelled.color} stroke="#fff" strokeWidth={1} animationDuration={500} />
                <Bar dataKey="scheduled" name={STATUS_META.scheduled.label} stackId="h" fill={STATUS_META.scheduled.color} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-10 text-center text-sm text-gray-400">لا حصص في هذه الفترة</p>}
      </section>

      {/* Monthly money chart */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-black text-gray-900 text-sm">المستلم والمصاريف شهرياً</h3>
        <p className="text-[11px] text-gray-400 mb-3">آخر {months.length} أشهر · الأرقام كاملة في الجدول تحته</p>
        <div className="h-56" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months.map(m => ({ ...m, label: monthLabel(m.month + '-01').split(' ')[0] }))} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, direction: 'rtl' }}
                formatter={(v: number, name: string) => [money(v), name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" name="المستلم" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} animationDuration={500} />
              <Bar dataKey="expenses" name="المصاريف" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="text-gray-400"><th className="text-right font-bold py-1">الشهر</th><th className="font-bold">العمل المنجز</th><th className="font-bold">المستلم</th><th className="font-bold">المصاريف</th><th className="font-bold">الصافي</th></tr></thead>
            <tbody>
              {[...months].reverse().map(m => (
                <tr key={m.month} className="border-t border-gray-50 text-center">
                  <td className="text-right py-1.5 font-bold text-gray-700">{monthLabel(m.month + '-01')}</td>
                  <td>{money(m.earned)}</td><td className="text-emerald-700">{money(m.collected)}</td>
                  <td className="text-rose-600">{money(m.expenses)}</td><td className="font-black">{money(m.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per family */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-black text-gray-900 text-sm mb-3">حسب العائلة</h3>
        {s.byClient.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">لا نشاط في هذه الفترة</p> : (
          <ul className="space-y-3">
            {s.byClient.map(c => {
              const cl = clientsById.get(c.clientId)
              return (
                <li key={c.clientId}>
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="inline-flex items-center gap-2 font-bold text-gray-800 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cl?.color }} />
                      <span className="truncate">{clientLabel(cl)}</span>
                    </span>
                    <span className="font-black text-gray-900 whitespace-nowrap">{money(c.earned)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(c.earned / maxClientEarned) * 100}%`, backgroundColor: cl?.color ?? '#94a3b8' }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {c.lessons} حصة · {formatHours(c.minutes)} س · استُلم {money(c.collected)}{c.cancelled ? ` · ${c.cancelled} ملغاة` : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="font-black text-gray-900 text-sm mb-3">أيام العمل</h3>
          <ul className="space-y-2">
            {s.byWeekday.map(w => (
              <li key={w.weekday} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-gray-500 font-bold">{WEEKDAYS[w.weekday]}</span>
                <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(w.minutes / maxWeekday) * 100}%` }} />
                </span>
                <span className="w-10 text-left font-bold text-gray-700">{formatHours(w.minutes)} س</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="font-black text-gray-900 text-sm mb-3">أين تذهب المصاريف</h3>
          {s.byExpenseCategory.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">لا مصاريف في هذه الفترة</p> : (
            <ul className="space-y-2">
              {s.byExpenseCategory.map(c => (
                <li key={c.category} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-gray-500 font-bold truncate">{EXPENSE_LABEL[c.category]}</span>
                  <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${(c.amount / totalExpenses) * 100}%`, backgroundColor: EXPENSE_COLOR }} />
                  </span>
                  <span className="text-left font-bold text-gray-700 whitespace-nowrap">{money(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
