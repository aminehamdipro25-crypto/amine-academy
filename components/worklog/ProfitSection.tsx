'use client'
import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatDuration, formatMoney, lessonsCount } from '@/lib/worklog'
import { HIGH_CANCEL_MIN_DECIDED, HIGH_CANCEL_RATE, familyProfit, nextMonthOutlook, profitSummary } from '@/lib/worklog-profit'
import { clientLabel, useWorkLog } from './useWorkLog'
import { localToday, monthLabel } from './ui'

/**
 * Is the work as profitable as it looks? The hourly rate three ways, family by
 * family, and next month before it starts. Every figure here is recomputed
 * from the ledger for the period chosen above.
 */
export default function ProfitSection({ from, to }: { from: string; to: string }) {
  const { lessons, expenses, clients, clientsById, settings } = useWorkLog()
  const money = (n: number) => formatMoney(n, settings.currency)
  const s = useMemo(() => profitSummary(lessons, expenses, clients, from, to), [lessons, expenses, clients, from, to])
  const fams = useMemo(() => familyProfit(lessons, clients, from, to), [lessons, clients, from, to])
  const best = Math.max(1, ...fams.map(f => f.hourlyReal ?? 0))

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-black text-gray-500">الربحية — هل يربح عملك كما تظن؟</h3>

      {/* The hourly rate, three ways */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Rate label="السعر الظاهر" value={s.hourlyGross} money={money} hint="قيمة العمل ÷ ساعات التدريس" />
          <Rate label="بعد مصاريف العمل" value={s.hourlyAfterExpenses} money={money} hint={`− ${money(s.workExpenses)} مصاريف للعمل`} />
          <Rate label="الحقيقي (مع الطريق)" value={s.hourlyReal} money={money} hint={s.travelMin ? `+ ${formatDuration(s.travelMin)} طريق` : 'لا طريق محسوب'} strong />
        </div>
        {s.minutesDone > 0 ? (
          <p className="text-[11px] text-gray-600 leading-relaxed">
            في هذه الفترة: قيمة عملك <b>{money(s.earned)}</b> عن <b>{formatDuration(s.minutesDone)}</b> تدريس
            {s.travelMin ? <> و<b>{formatDuration(s.travelMin)}</b> طريقاً بين المنازل</> : null}، ومصاريف العمل <b>{money(s.workExpenses)}</b>
            {' '}(تنقّل، أدوات، هاتف وإنترنت، إعلانات، كتب — دون المصاريف الشخصية)، فيبقى <b>{money(s.profit)}</b>.
          </p>
        ) : <p className="text-[11px] text-gray-400">لا حصص منجزة في هذه الفترة.</p>}
        <p className="text-[10px] text-gray-400 leading-relaxed">
          الطريق تقدير من مواقع المنازل (كما في اليومية)، وبين منزلين فقط: الطريق من بيتك إلى أول حصة في اليوم غير محسوب لأن بيتك ليس في الدفتر — فالرقم الحقيقي أقل قليلاً.
        </p>
      </div>

      {/* Family by family */}
      {fams.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-700 mb-1">كل عائلة — كم تربح فعلاً في الساعة</p>
          <p className="text-[10px] text-gray-400 mb-3">قيمة عملها ÷ (ساعات حصصها + الطريق إليها). الأعلى أولاً.</p>
          <ul className="space-y-3">
            {fams.map(f => {
              const c = clientsById.get(f.clientId)
              const decided = f.lessonsDone + f.cancelled
              const flag = f.cancelRate !== null && decided >= HIGH_CANCEL_MIN_DECIDED && f.cancelRate >= HIGH_CANCEL_RATE
              return (
                <li key={f.clientId} className="text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-gray-900 truncate inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.color ?? '#94a3b8' }} />{clientLabel(c)}
                    </span>
                    <span className="font-black text-gray-900 whitespace-nowrap">{f.hourlyReal === null ? '—' : `${money(f.hourlyReal)} / س`}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${((f.hourlyReal ?? 0) / best) * 100}%`, backgroundColor: c?.color ?? '#94a3b8' }} />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {money(f.earned)} · {formatDuration(f.minutes)} تدريس{f.travelMin ? ` + ${formatDuration(f.travelMin)} طريق` : ''}
                    {f.hourly !== null && f.travelMin ? ` · بلا طريق ${money(f.hourly)}/س` : ''}
                    {f.cancelled ? ` · ${f.cancelled} إلغاء${f.lost ? ` (ضاع ${money(f.lost)})` : ''}` : ''}
                  </p>
                  {flag && (
                    <p className="mt-0.5 text-[10px] font-bold text-rose-700">
                      ⚠ تُلغي {Math.round(f.cancelRate! * 100)}% من حصصها — فكّر في احتساب الإلغاء المتأخر لهذه العائلة.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <NextMonth />
    </section>
  )
}

function Rate({ label, value, money, hint, strong }: { label: string; value: number | null; money: (n: number) => string; hint: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl p-2 ${strong ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      <p className={`text-[10px] font-bold ${strong ? 'text-emerald-800' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-base font-black leading-tight ${strong ? 'text-emerald-700' : 'text-gray-900'}`}>{value === null ? '—' : money(value)}</p>
      <p className="text-[10px] text-gray-400">في الساعة</p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{hint}</p>
    </div>
  )
}

/** Next month before it starts — independent of the period chosen above. */
function NextMonth() {
  const { lessons, settings } = useWorkLog()
  const money = (n: number) => formatMoney(n, settings.currency)
  const today = localToday()
  const o = useMemo(() => nextMonthOutlook(lessons, settings.recurringExpenses ?? [], settings.expenseBudget?.amount ?? null, today),
    [lessons, settings.recurringExpenses, settings.expenseBudget, today])
  const Left = ({ v }: { v: number | null }) => v === null ? <span className="text-gray-400">—</span>
    : <b className={v >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{v >= 0 ? `يبقى ${money(v)}` : `عجز ${money(-v)}`}</b>

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
      <p className="text-xs font-black text-gray-700 inline-flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-600" /> توقّع {monthLabel(o.month)}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] font-bold text-gray-500">إن تمّ المجدول وحده</p>
          <p className="text-lg font-black text-gray-900">{money(o.bookedValue)}</p>
          <p className="text-[10px] text-gray-500">{o.booked ? `${lessonsCount(o.booked)} في اليومية الآن` : 'لا حصص مُدخلة بعد'}</p>
          <p className="mt-1.5 text-[11px]"><Left v={o.leftIfBooked} /></p>
        </div>
        <div className="rounded-xl bg-brand-50 p-3">
          <p className="text-[10px] font-bold text-brand-700">بإيقاعك المعتاد</p>
          <p className="text-lg font-black text-gray-900">{o.paceValue === null ? '—' : `≈ ${money(o.paceValue)}`}</p>
          <p className="text-[10px] text-gray-500">{o.weeklyPace === null ? 'لا سجل سابق بعد' : `${money(o.weeklyPace)} في الأسبوع (آخر 4 أسابيع كاملة)`}</p>
          <p className="mt-1.5 text-[11px]"><Left v={o.leftAtPace} /></p>
        </div>
      </div>
      <p className="text-[11px] text-gray-600">
        يُطرح من كلٍّ منهما: المصاريف الثابتة <b>{money(o.fixed)}</b>{o.budget !== null ? <> وميزانية المصاريف اليومية <b>{money(o.budget)}</b></> : ' (ولا ميزانية يومية محدّدة)'}.
      </p>
      {o.paceValue !== null && o.bookedValue < o.paceValue && (
        <p className="text-[10px] text-gray-400">
          المجدول أقل من إيقاعك عادةً لأن حصص الشهر القادم لم تُدخَل كلها بعد — «كرّر» يملؤها في دقيقة.
        </p>
      )}
    </div>
  )
}
