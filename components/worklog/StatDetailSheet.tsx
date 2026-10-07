'use client'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  EXPENSE_LABEL, addDays, clientBalances, endOfMonth, expenseItemsText, formatDuration, formatMoney, lessonsCount,
  periodBreakdown, startOfMonth, startOfWeek, type BreakdownLine,
} from '@/lib/worklog'
import { familiesText } from '@/lib/worklog-planning'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Sheet, localToday, monthLabel, shortDate } from './ui'

export type StatDetail = 'income-week' | 'income-month' | 'hours-week' | 'hours-month' | 'net-month' | 'dues'

const TITLE: Record<StatDetail, string> = {
  'income-week': 'دخل الأسبوع — كيف حُسب',
  'income-month': 'دخل الشهر — كيف حُسب',
  'hours-week': 'ساعات الأسبوع — كيف حُسبت',
  'hours-month': 'ساعات الشهر — كيف حُسبت',
  'net-month': 'صافي الشهر — كيف حُسب',
  dues: 'المستحقات المعلّقة — من عليه وكم',
}

/**
 * Tap a dashboard tile and see the very rows that make its number, with the
 * rule written above them — and step to the previous or next week or month.
 */
export default function StatDetailSheet({ kind, onClose }: { kind: StatDetail | null; onClose: () => void }) {
  const { lessons, clients, payments, expenses, settings } = useWorkLog()
  const today = localToday()
  const [offset, setOffset] = useState(0)
  const money = (n: number) => formatMoney(n, settings.currency)
  const byWeek = kind === 'income-week' || kind === 'hours-week'
  const byMonth = kind === 'income-month' || kind === 'hours-month' || kind === 'net-month'

  // Reset to the current period whenever another tile is opened.
  const [openedFor, setOpenedFor] = useState<StatDetail | null>(null)
  if (kind !== openedFor) { setOpenedFor(kind); setOffset(0) }

  const range = useMemo(() => {
    if (byWeek) { const from = addDays(startOfWeek(today), offset * 7); return { from, to: addDays(from, 6) } }
    const [y, m] = today.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 10)
    return { from: startOfMonth(d), to: endOfMonth(d) }
  }, [byWeek, today, offset])

  const b = useMemo(() => periodBreakdown(lessons, clients, range.from, range.to, today), [lessons, clients, range, today])
  const periodName = byWeek
    ? `${offset === 0 ? 'هذا الأسبوع' : offset === -1 ? 'الأسبوع الماضي' : offset === 1 ? 'الأسبوع القادم' : 'أسبوع'}: من الاثنين ${shortDate(range.from)} إلى الأحد ${shortDate(range.to)}`
    : monthLabel(range.from)

  if (!kind) return null
  const isHours = kind === 'hours-week' || kind === 'hours-month'

  return (
    <Sheet open={!!kind} onClose={onClose} title={TITLE[kind]}>
      <div className="space-y-4 text-sm">
        {(byWeek || byMonth) && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 p-2">
            <button onClick={() => setOffset(o => o - 1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الفترة السابقة"><ChevronRight className="w-4 h-4" /></button>
            <p className="text-xs font-black text-gray-800 text-center">{periodName}</p>
            <button onClick={() => setOffset(o => o + 1)} className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center" aria-label="الفترة التالية"><ChevronLeft className="w-4 h-4" /></button>
          </div>
        )}

        {(kind === 'income-week' || kind === 'income-month') && (
          <>
            <Rule>يُحسب الدخل من <b>الحصص التي ضغطت عليها «تمّت»</b> بسعر كل حصة، ومعها الحصص الملغاة التي اخترت <b>احتسابها</b>. المجدولة لا تُحتسب حتى تتم، والملغاة غير المحتسبة لا تُحتسب. الأسبوع يبدأ الاثنين وينتهي الأحد.</Rule>
            <Total label={`المجموع · ${lessonsCount(b.counted.length)}`} value={money(b.total)} />
            {kind === 'income-month' && b.weeks.length > 1 && (
              <Section title="حسب الأسابيع">
                {b.weeks.map(w => (
                  <Row key={w.from} main={`${shortDate(w.from)} – ${shortDate(w.to)}`} sub={w.count ? lessonsCount(w.count) : 'لا حصص منجزة'} value={money(w.total)} muted={!w.count} />
                ))}
              </Section>
            )}
            <Lines title="✓ محتسبة" lines={b.counted} money={money} tone="text-emerald-700" />
            <Lines title="◷ مجدولة قادمة — لا تُحتسب بعد" lines={b.ahead} money={money} tone="text-blue-700" hint="تدخل الدخل يوم تضغط عليها «تمّت»." />
            <Lines title="⚠ سابقة لم تُحدَّد — لا تُحتسب" lines={b.unmarked} money={money} tone="text-amber-700" hint="حدّد لكل منها «تمّت» أو «ألغيت» من اليومية لتدخل الحساب." />
            <Lines title="✕ ملغاة غير محتسبة" lines={b.cancelledFree} money={money} tone="text-rose-700" />
          </>
        )}

        {isHours && (
          <>
            <Rule>تُجمع <b>مدة كل حصة ضغطت عليها «تمّت»</b>. المجدولة والملغاة تظهر أسفلها للعلم ولا تدخل الرقم. الأسبوع من الاثنين إلى الأحد.</Rule>
            <Total label={`ساعات منجزة · ${lessonsCount(b.counted.filter(x => !x.note).length)}`} value={formatDuration(b.minutesDone)} />
            <Lines title="✓ منجزة" lines={b.counted.filter(x => !x.note)} money={money} tone="text-emerald-700" hours />
            <Lines title="◷ مجدولة" lines={[...b.unmarked, ...b.ahead]} money={money} tone="text-blue-700" hours />
            <Lines title="✕ ملغاة" lines={[...b.counted.filter(x => x.note), ...b.cancelledFree]} money={money} tone="text-rose-700" hours />
          </>
        )}

        {kind === 'net-month' && <NetMonth from={range.from} to={range.to} />}
        {kind === 'dues' && <Dues />}
      </div>
    </Sheet>
  )

  function NetMonth({ from, to }: { from: string; to: string }) {
    const ps = payments.filter(p => p.date >= from && p.date <= to).sort((a, c) => a.date.localeCompare(c.date))
    const es = expenses.filter(e => e.date >= from && e.date <= to).sort((a, c) => a.date.localeCompare(c.date))
    const got = ps.reduce((s, p) => s + p.amount, 0), spent = es.reduce((s, e) => s + e.amount, 0)
    const byId = new Map(clients.map(c => [c.id, c]))
    return (
      <>
        <Rule>الصافي = <b>المال الذي استلمته فعلاً</b> هذا الشهر (الدفعات المسجّلة، أياً كانت الحصص التي تخصّها) <b>ناقص المصاريف</b>. لذلك قد يختلف عن «دخل الشهر» الذي يحسب قيمة العمل المنجز.</Rule>
        <Total label="الصافي" value={money(got - spent)} />
        <Section title={`المستلم · ${money(got)}`}>
          {ps.length ? ps.map(p => <Row key={p.id} main={clientLabel(byId.get(p.clientId))} sub={shortDate(p.date)} value={money(p.amount)} />) : <Empty>لا دفعات مسجّلة.</Empty>}
        </Section>
        <Section title={`المصاريف · ${money(spent)}`}>
          {es.length ? es.map(e => <Row key={e.id} main={EXPENSE_LABEL[e.category]} sub={`${shortDate(e.date)}${e.items?.length ? ` · ${expenseItemsText(e.items)}` : e.note ? ` · ${e.note}` : ''}`} value={`− ${money(e.amount)}`} />) : <Empty>لا مصاريف.</Empty>}
        </Section>
      </>
    )
  }

  function Dues() {
    const rows = clientBalances(clients, lessons, payments, today).filter(r => r.balance > 0).sort((a, c) => c.balance - a.balance)
    const byId = new Map(clients.map(c => [c.id, c]))
    const total = rows.reduce((s, r) => s + r.balance, 0)
    return (
      <>
        <Rule>لكل عائلة: <b>قيمة كل الحصص المنجزة والمحتسبة منذ البداية ناقص كل ما دفعته</b>. هذا ليس رقم الشهر وحده، بل الرصيد المتراكم حتى اليوم.</Rule>
        <Total label={`المجموع · ${familiesText(rows.length)}`} value={money(total)} />
        <Section title="حسب العائلة">
          {rows.length ? rows.map(r => (
            <Row key={r.clientId} main={clientLabel(byId.get(r.clientId))} sub={`مستحق ${money(r.billed)} − مدفوع ${money(r.paid)}`} value={money(r.balance)} />
          )) : <Empty>لا مستحقات — كل العائلات مسدّدة.</Empty>}
        </Section>
      </>
    )
  }
}

function Rule({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">{children}</p>
}
function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-2xl bg-gray-900 px-4 py-3 text-white">
      <span className="text-xs font-bold text-gray-300">{label}</span>
      <span className="text-xl font-black">{value}</span>
    </div>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black text-gray-700 mb-1.5">{title}</p>
      <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">{children}</ul>
    </div>
  )
}
function Row({ main, sub, value, muted }: { main: string; sub?: string; value: string; muted?: boolean }) {
  return (
    <li className={`flex items-center gap-3 px-3 py-2 ${muted ? 'opacity-50' : ''}`}>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-gray-900 truncate">{main}</span>
        {sub && <span className="block text-[11px] text-gray-500 truncate">{sub}</span>}
      </span>
      <span className="font-black text-gray-900 whitespace-nowrap">{value}</span>
    </li>
  )
}
function Empty({ children }: { children: React.ReactNode }) {
  return <li className="px-3 py-3 text-xs text-gray-400">{children}</li>
}
function Lines({ title, lines, money, tone, hint, hours }: {
  title: string; lines: BreakdownLine[]; money: (n: number) => string; tone: string; hint?: string; hours?: boolean
}) {
  if (!lines.length) return null
  return (
    <div>
      <p className={`text-xs font-black mb-1 ${tone}`}>{title} <span className="font-medium text-gray-400">({lines.length})</span></p>
      {hint && <p className="text-[11px] text-gray-500 mb-1.5">{hint}</p>}
      <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {lines.map(x => (
          <Row key={x.id} main={x.who} sub={`${shortDate(x.date)} · ${x.start} · ${formatDuration(x.durationMin)}${x.note ? ` · ${x.note}` : ''}`}
            value={hours ? formatDuration(x.durationMin) : money(x.amount)} />
        ))}
      </ul>
    </div>
  )
}
