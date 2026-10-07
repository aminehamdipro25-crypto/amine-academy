'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, Navigation, NotebookPen, Plus, Receipt, RefreshCw, Settings2, Users, Wallet } from 'lucide-react'
import {
  addDays, clientBalances, lessonsCount, endOfMonth, hoursIn, monthForecast, startOfWeek, endTime, formatDuration, formatMoney, googleDirectionsUrl, lessonStartLocal,
  periodStats, sortLessons, startOfMonth, type WorkClient, type WorkExpense, type WorkLesson, type WorkPayment,
} from '@/lib/worklog'
import { readStorage, writeStorage } from '@/lib/safe-storage'
import { WorkLogContext, clientLabel, useWorkLog, useWorkLogState } from './useWorkLog'
import AgendaView from './AgendaView'
import ClientsView from './ClientsView'
import MoneyView from './MoneyView'
import StatsView from './StatsView'
import SettingsView from './SettingsView'
import LessonForm, { type LessonDraft } from './LessonForm'
import ClientForm from './ClientForm'
import AvailabilitySheet from './AvailabilitySheet'
import { ExpenseForm, PaymentForm } from './MoneyForms'
import { dayLabel, localToday, primaryBtn } from './ui'

type Tab = 'agenda' | 'clients' | 'payments' | 'expenses' | 'stats' | 'settings'
const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'agenda', label: 'اليومية', icon: CalendarDays },
  { id: 'clients', label: 'العائلات', icon: Users },
  { id: 'payments', label: 'الدفعات', icon: Wallet },
  { id: 'expenses', label: 'المصاريف', icon: Receipt },
  { id: 'stats', label: 'إحصائيات', icon: BarChart3 },
  { id: 'settings', label: 'إعدادات', icon: Settings2 },
]
const TAB_KEY = 'worklog-tab'

export default function WorkLogApp() {
  const state = useWorkLogState()
  const [tab, setTab] = useState<Tab>('agenda')

  // Modals
  const [lessonOpen, setLessonOpen] = useState(false)
  const [editLesson, setEditLesson] = useState<WorkLesson | null>(null)
  const [draft, setDraft] = useState<LessonDraft | undefined>()
  const [clientOpen, setClientOpen] = useState(false)
  const [editClient, setEditClient] = useState<WorkClient | null>(null)
  const [reopenLesson, setReopenLesson] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<WorkPayment | null>(null)
  const [payClient, setPayClient] = useState<string | undefined>()
  const [expOpen, setExpOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<WorkExpense | null>(null)
  const [findTime, setFindTime] = useState(false)

  useEffect(() => {
    // Back from Google's calendar consent: open Settings, where the outcome is shown.
    if (new URLSearchParams(window.location.search).has('gcal')) { setTab('settings'); return }
    const saved = readStorage(TAB_KEY) as Tab | null
    if (saved && TABS.some(t => t.id === saved)) setTab(saved)
  }, [])
  const go = (t: Tab) => { setTab(t); writeStorage(TAB_KEY, t); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const openLesson = (d?: LessonDraft) => { setEditLesson(null); setDraft(d); setLessonOpen(true) }
  /** Same family, time, length, price and reminder — only the date is left to choose. */
  const copyLesson = (l: WorkLesson) => openLesson({
    clientId: l.clientId, start: l.start, durationMin: l.durationMin, price: l.price,
    reminderMin: l.reminderMin, date: addDays(l.date, 7), child: l.child,
  })
  const editClientById = (id: string) => {
    const c = state.clientsById.get(id)
    if (!c) return
    // Opened on top of the lesson form, which stays open with its unsaved edits.
    setEditClient(c); setReopenLesson(false)
    setClientOpen(true)
  }
  const openNewClient = (fromLesson = false) => {
    setEditClient(null); setReopenLesson(fromLesson)
    if (fromLesson) setLessonOpen(false)
    setClientOpen(true)
  }

  return (
    <WorkLogContext.Provider value={state}>
      <div dir="rtl" className="max-w-5xl mx-auto pb-24 lg:pb-8">
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-200">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-xl text-gray-900 leading-tight">دفتر الحصص الخاصة</h1>
              <p className="text-xs text-gray-400">الحصص المنزلية · الساعات · المستحقات · الدخل والمصاريف</p>
            </div>
          </div>
          <button onClick={() => openLesson()} className={primaryBtn('hidden sm:inline-flex')}><Plus className="w-4 h-4" /> حصة جديدة</button>
        </header>

        {state.loading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-3xl bg-white animate-pulse" />)}</div>
        ) : state.error ? (
          <div className="rounded-3xl bg-rose-50 border border-rose-100 p-6 text-center">
            <p className="font-bold text-rose-800">{state.error}</p>
            <button onClick={() => state.reload()} className={primaryBtn('mt-3')}><RefreshCw className="w-4 h-4" /> إعادة المحاولة</button>
          </div>
        ) : (
          <>
            <Overview onAddClient={() => openNewClient()} onAddLesson={() => openLesson()} />
            {state.clients.length > 0 && <GoalCard onSetGoal={() => go('settings')} />}

            <nav className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-2 mb-4 bg-slate-100/90 backdrop-blur" aria-label="أقسام الدفتر">
              <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-sm border border-gray-100">
                {TABS.map(t => {
                  const on = tab === t.id
                  return (
                    <button key={t.id} onClick={() => go(t.id)} aria-current={on ? 'page' : undefined}
                      className={`relative flex-1 min-w-0 inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 rounded-xl px-1 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold transition ${on ? 'text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      {on && <motion.span layoutId="wl-tab" className="absolute inset-0 rounded-xl bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      <t.icon className="relative w-4 h-4" />
                      <span className="relative whitespace-nowrap">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'agenda' && <AgendaView onAdd={openLesson} onEdit={l => { setEditLesson(l); setLessonOpen(true) }} onCopy={copyLesson} onLocate={id => editClientById(id)} onFindTime={() => setFindTime(true)} />}
              {tab === 'clients' && (
                <ClientsView onAdd={() => openNewClient()} onEdit={c => { setEditClient(c); setClientOpen(true) }} onAddLesson={id => openLesson({ clientId: id })}
                  onEditLesson={l => { setEditLesson(l); setLessonOpen(true) }}
                  onPay={id => { setEditPayment(null); setPayClient(id); setPayOpen(true) }} />
              )}
              {(tab === 'payments' || tab === 'expenses') && (
                <MoneyView
                  key={tab}
                  mode={tab}
                  onAdd={() => {
                    if (tab === 'payments') { setEditPayment(null); setPayClient(undefined); setPayOpen(true) }
                    else { setEditExpense(null); setExpOpen(true) }
                  }}
                  onEditPayment={p => { setEditPayment(p); setPayOpen(true) }}
                  onEditExpense={e => { setEditExpense(e); setExpOpen(true) }} />
              )}
              {tab === 'stats' && <StatsView />}
              {tab === 'settings' && <SettingsView />}
            </motion.div>
          </>
        )}

        {/* Thumb-reach add button on phones */}
        {!state.loading && !state.error && (
          <button onClick={() => openLesson()} aria-label="حصة جديدة"
            className="sm:hidden fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-300 flex items-center justify-center active:scale-95 transition">
            <Plus className="w-6 h-6" />
          </button>
        )}

        <LessonForm open={lessonOpen} onClose={() => setLessonOpen(false)} lesson={editLesson} draft={draft} onNewClient={() => openNewClient(true)}
          onEditClient={id => editClientById(id)} onCopy={copyLesson} />
        <ClientForm open={clientOpen} client={editClient}
          onClose={() => { setClientOpen(false); if (reopenLesson) { setReopenLesson(false); setLessonOpen(true) } }}
          onCreated={c => { if (reopenLesson) setDraft(d => ({ ...d, clientId: c.id })) }} />
        <PaymentForm open={payOpen} onClose={() => setPayOpen(false)} payment={editPayment} clientId={payClient} />
        <ExpenseForm open={expOpen} onClose={() => setExpOpen(false)} expense={editExpense} />
        <AvailabilitySheet open={findTime} onClose={() => setFindTime(false)} onPick={d => openLesson(d)} />
      </div>
    </WorkLogContext.Provider>
  )
}

/** Today at a glance: the next lesson, today's load, this month, what is owed. */
function Overview({ onAddClient, onAddLesson }: { onAddClient: () => void; onAddLesson: () => void }) {
  const { clients, lessons, payments, expenses, settings, clientsById } = useWorkLog()
  const today = localToday()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t) }, [])

  const next = useMemo(
    () => sortLessons(lessons.filter(l => l.status === 'scheduled' && l.date >= today))
      .find(l => lessonStartLocal(l).getTime() + l.durationMin * 60_000 > now),
    [lessons, today, now],
  )
  const week = hoursIn(lessons, startOfWeek(today), addDays(startOfWeek(today), 6))
  const month = useMemo(() => periodStats(lessons, payments, expenses, startOfMonth(today), endOfMonth(today)), [lessons, payments, expenses, today])
  // Income from completed lessons only — what is still scheduled is not income yet.
  const weekEarned = useMemo(() => periodStats(lessons, [], [], startOfWeek(today), addDays(startOfWeek(today), 6)), [lessons, today])
  const owed = useMemo(() => clientBalances(clients, lessons, payments, today).reduce((s, b) => s + Math.max(0, b.balance), 0), [clients, lessons, payments, today])

  if (!clients.length) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white mb-4 shadow-lg shadow-brand-200">
        <p className="text-lg font-black">ابدأ في ثلاث خطوات</p>
        <ol className="mt-3 space-y-1.5 text-sm text-brand-50 list-decimal pr-5">
          <li>أضف العائلات: سعر الساعة، الهاتف، وموقع المنزل على الخريطة.</li>
          <li>أضف الحصص في اليومية — واحدة أو متكررة كل أسبوع.</li>
          <li>بعد كل حصة اضغط «تمّت» أو «ألغيت»، وسجّل كل دفعة يوم تستلمها.</li>
        </ol>
        <button onClick={onAddClient} className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-brand-700">+ أضف أول عائلة</button>
      </div>
    )
  }

  const start = next ? lessonStartLocal(next).getTime() : 0
  const mins = next ? Math.round((start - now) / 60_000) : 0
  const nc = next ? clientsById.get(next.clientId) : undefined
  const countdown = !next ? '' : mins <= 0 ? 'جارية الآن' : mins < 60 ? `بعد ${mins} دقيقة` : mins < 24 * 60 ? `بعد ${formatDuration(mins)}` : ''

  return (
    <div className="grid gap-3 lg:grid-cols-5 mb-4">
      <div className="lg:col-span-3 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-5 text-white shadow-lg">
        <p className="text-[11px] font-bold text-gray-400">الحصة القادمة</p>
        {next ? (
          <>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-black truncate">{clientLabel(nc)}</p>
                <p className="text-sm text-gray-300 mt-0.5">
                  {next.date === today ? 'اليوم' : next.date === addDays(today, 1) ? 'غداً' : dayLabel(next.date)} · {next.start}–{endTime(next.start, next.durationMin)}
                  {countdown && <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-amber-300">{countdown}</span>}
                </p>
                {nc?.address && <p className="text-[11px] text-gray-400 mt-1 truncate">📍 {nc.address}</p>}
              </div>
              <span className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: nc?.color }} />
            </div>
            {nc?.location && (
              <a href={googleDirectionsUrl(nc.location)} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-gray-900 active:scale-95 transition">
                <Navigation className="w-4 h-4" /> انطلق إلى المنزل
              </a>
            )}
          </>
        ) : (
          <div className="mt-2">
            <p className="text-gray-300 text-sm">لا حصص مجدولة قادمة.</p>
            <button onClick={onAddLesson} className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-black text-gray-900">+ جدولة حصة</button>
          </div>
        )}
      </div>
      <div className="lg:col-span-2 grid grid-cols-2 gap-3">
        <MiniStat label="دخل الأسبوع (حصص منجزة)" value={formatMoney(weekEarned.earned, settings.currency)}
          sub={`${lessonsCount(weekEarned.lessonsDone)} منجزة — المجدولة لا تُحتسب`} good />
        <MiniStat label="دخل الشهر (حصص منجزة)" value={formatMoney(month.earned, settings.currency)}
          sub={`${lessonsCount(month.lessonsDone)} منجزة — المجدولة لا تُحتسب`} good />
        <MiniStat label="ساعات الأسبوع (منجزة)" value={formatDuration(week.done)}
          sub={hoursSub(week.scheduled, week.cancelled)} />
        <MiniStat label="ساعات الشهر (منجزة)" value={formatDuration(month.minutesDone)}
          sub={hoursSub(month.minutesScheduled, month.minutesCancelled)} />
        <MiniStat label="صافي الشهر" value={formatMoney(month.net, settings.currency)}
          sub={`مستلم ${formatMoney(month.collected, settings.currency)} − مصاريف ${formatMoney(month.expenses, settings.currency)}`} />
        <MiniStat label="مستحقات معلّقة" value={formatMoney(owed, settings.currency)} sub="لدى العائلات" warn={owed > 0} />
      </div>
    </div>
  )
}

/** "+ 3 س مجدولة · 1 س ملغاة" — empty parts left out rather than shown as zero. */
function hoursSub(scheduled: number, cancelled: number): string {
  const parts = [
    scheduled ? `+ ${formatDuration(scheduled)} مجدولة` : '',
    cancelled ? `${formatDuration(cancelled)} ملغاة` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'لا مجدولة ولا ملغاة'
}

function MiniStat({ label, value, sub, warn, good }: { label: string; value: string; sub: string; warn?: boolean; good?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 shadow-sm ${warn ? 'bg-amber-50 border-amber-100' : good ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
      <p className={`text-[10px] font-bold ${warn ? 'text-amber-700' : good ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</p>
      <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5 leading-tight">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>
    </div>
  )
}

/**
 * This month against the goal: what is done, what is still on the calendar,
 * and what that adds up to. Unconfirmed past lessons are named separately —
 * counting them would promise money for lessons that may not have happened.
 */
function GoalCard({ onSetGoal }: { onSetGoal: () => void }) {
  const { lessons, payments, settings } = useWorkLog()
  const today = localToday()
  const f = useMemo(() => monthForecast(lessons, payments, today, settings.monthlyGoal), [lessons, payments, today, settings.monthlyGoal])
  const money = (n: number) => formatMoney(n, settings.currency)

  if (!f.goal) {
    return (
      <div className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-600">
          <b>هذا الشهر:</b> منجز {money(f.earned)} + مجدول {money(f.ahead)} = متوقّع <b>{money(f.projected)}</b>
        </p>
        <button onClick={onSetGoal} className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white">🎯 حدّد هدفاً</button>
      </div>
    )
  }
  const pctDone = Math.min(100, (f.earned / f.goal) * 100)
  const pctAhead = Math.min(100 - pctDone, (f.ahead / f.goal) * 100)
  const onTrack = (f.progress ?? 0) >= 1
  return (
    <div className="mb-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
        <p className="text-sm font-black text-gray-900">🎯 هدف الشهر {money(f.goal)}</p>
        <p className={`text-xs font-bold ${onTrack ? 'text-emerald-700' : 'text-amber-700'}`}>
          {onTrack ? `على المسار ✓ متوقّع ${money(f.projected)}` : `ينقص ${money(f.gap ?? 0)} — متوقّع ${money(f.projected)}`}
        </p>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex" role="img"
        aria-label={`منجز ${Math.round(pctDone)}٪ ومجدول ${Math.round(pctAhead)}٪ من الهدف`}>
        <div className="h-full bg-emerald-600" style={{ width: `${pctDone}%` }} />
        <div className="h-full bg-emerald-300" style={{ width: `${pctAhead}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-600 ml-1" />منجز {money(f.earned)}</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-300 ml-1" />مجدول متبقٍّ {money(f.ahead)}</span>
        <span>مستلم فعلاً {money(f.collected)}</span>
        {f.unconfirmed > 0 && <span className="text-amber-700">+ {money(f.unconfirmed)} في حصص بلا حالة (غير محسوبة)</span>}
      </div>
    </div>
  )
}
