'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Banknote, Bell, BellRing, Car, CheckCheck, Copy, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle,
  Navigation, Pencil, Phone, Plus, Route, X,
} from 'lucide-react'
import {
  STATUS_META, addDays, durationText, endOfMonth, endTime, formatDuration, formatMoney, googleDirectionsUrl, googleRouteUrl,
  dayLegs, hoursIn, lessonReminderText, lessonValue, phoneDigits, sortLessons, startOfMonth, startOfWeek, weekdayMon0, type GeoPoint, type LessonStatus, type TravelLeg, type WorkLesson,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Empty, Segmented, Sheet, StatusPill, dayLabel, ghostBtn, localToday, monthLabel, primaryBtn, shortDate } from './ui'
import type { LessonDraft } from './LessonForm'
import { PaidPrompt } from './MoneyForms'

const StopsMap = dynamic(() => import('./WorkMap').then(m => m.StopsMap), {
  ssr: false, loading: () => <div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />,
})

const WEEKDAYS = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']

export default function AgendaView({ onAdd, onEdit, onCopy, onLocate }: {
  onAdd: (d?: LessonDraft) => void; onEdit: (l: WorkLesson) => void; onCopy: (l: WorkLesson) => void; onLocate: (clientId: string) => void
}) {
  const { lessons, payments, clientsById, settings, update } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const [selected, setSelected] = useState(today)
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const [showMap, setShowMap] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  // Lessons waiting for «هل استلمت الأجر؟», asked one after another.
  const [paidQueue, setPaidQueue] = useState<{ items: WorkLesson[]; total: number }>({ items: [], total: 0 })
  const askPaid = (ls: WorkLesson[]) => setPaidQueue({ items: ls, total: ls.length })
  const [bulkOpen, setBulkOpen] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const paidLessons = useMemo(() => new Set(payments.map(p => p.lessonId).filter(Boolean)), [payments])

  const byDate = useMemo(() => {
    const m = new Map<string, WorkLesson[]>()
    for (const l of sortLessons(lessons)) {
      const arr = m.get(l.date) ?? []
      arr.push(l)
      m.set(l.date, arr)
    }
    return m
  }, [lessons])

  const unconfirmed = useMemo(
    () => sortLessons(lessons.filter(l => l.status === 'scheduled' && (l.date < today))),
    [lessons, today],
  )

  const dayLessons = byDate.get(selected) ?? []
  const active = dayLessons.filter(l => l.status !== 'cancelled')
  const dayMinutes = active.reduce((s, l) => s + l.durationMin, 0)
  const dayValue = dayLessons.reduce((s, l) => s + (l.status === 'scheduled' ? l.price : lessonValue(l)), 0)
  const stops = active
    .map((l, i) => {
      const c = clientsById.get(l.clientId)
      return c?.location ? { id: l.id, point: c.location, color: c.color, label: String(i + 1), title: `${l.start} · ${clientLabel(c)}` } : null
    })
    .filter(Boolean) as { id: string; point: GeoPoint; color: string; label: string; title: string }[]
  const routeUrl = googleRouteUrl(stops.map(s => s.point))

  async function setStatus(l: WorkLesson, status: LessonStatus) {
    try {
      await update('lessons', l.id, { status, ...(status === 'cancelled' ? { cancelledBy: 'family', charged: false } : {}) }, true)
      // Many families pay at the door: ask at the moment it happens, not later.
      if (status === 'done' && !paidLessons.has(l.id)) askPaid([{ ...l, status }])
      else toast(status === 'done' ? 'تمّت الحصة ✓' : status === 'cancelled' ? 'سُجّلت كملغاة' : 'أُعيدت إلى «مجدولة»', status === 'cancelled' ? 'info' : 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  // ── Navigation of the period ───────────────────────────────────────────────
  const weekStart = startOfWeek(selected)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthStart = startOfMonth(selected)
  const gridStart = startOfWeek(monthStart)
  const gridWeeks = Math.ceil((weekdayMon0(monthStart) + Number(endOfMonth(selected).slice(8))) / 7)
  const gridDays = Array.from({ length: gridWeeks * 7 }, (_, i) => addDays(gridStart, i))
  const shift = (dir: 1 | -1) => {
    if (mode === 'week') setSelected(addDays(selected, 7 * dir))
    else {
      const [y, m] = selected.split('-').map(Number)
      const nm = new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10)
      setSelected(nm)
    }
  }
  const periodHours = mode === 'week' ? hoursIn(lessons, weekDays[0], weekDays[6]) : hoursIn(lessons, monthStart, endOfMonth(selected))
  const legs = useMemo(
    () => new Map(dayLegs(lessons, selected, id => clientsById.get(id)?.location).map(g => [g.toId, g])),
    [lessons, selected, clientsById],
  )
  // «تمّت كلها»: only for a day that has started, and only the lessons still open.
  const openToday = selected <= today ? dayLessons.filter(l => l.status === 'scheduled') : []
  // Lessons of a day still ahead whose parent can be reminded.
  const remindable = selected >= today ? dayLessons.filter(l => l.status === 'scheduled') : []

  return (
    <div className="space-y-4">
      {unconfirmed.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <button onClick={() => setReviewOpen(o => !o)} className="flex w-full items-center gap-2 text-right">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="flex-1 text-sm font-bold text-amber-900">
              {unconfirmed.length === 1 ? 'حصة سابقة لم تُحدَّد حالتها' : `${unconfirmed.length} حصص سابقة لم تُحدَّد حالتها`}
              <span className="block text-[11px] font-medium text-amber-700">لا تدخل المستحقات ولا الإحصائيات حتى تعلّمها «تمّت» أو «ملغاة»</span>
            </span>
            <span className="text-xs font-bold text-amber-800 underline">{reviewOpen ? 'إخفاء' : 'مراجعة'}</span>
          </button>
          <AnimatePresence>
            {reviewOpen && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2 overflow-hidden">
                {unconfirmed.slice(0, 30).map(l => (
                  <li key={l.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                    <span className="w-2 h-8 rounded-full" style={{ backgroundColor: clientsById.get(l.clientId)?.color }} />
                    <span className="flex-1 min-w-0">
                      <b className="block truncate text-gray-900">{clientLabel(clientsById.get(l.clientId))}</b>
                      <span className="text-gray-400">{shortDate(l.date)} · {l.start}</span>
                    </span>
                    <button onClick={() => setStatus(l, 'done')} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white" aria-label="تمّت"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setStatus(l, 'cancelled')} className="rounded-lg bg-rose-100 px-2.5 py-1.5 font-bold text-rose-700" aria-label="ملغاة"><X className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Period header */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center" aria-label="السابق"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => shift(1)} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center" aria-label="التالي"><ChevronLeft className="w-4 h-4" /></button>
            <div className="mr-1">
              <p className="font-black text-gray-900 text-sm sm:text-base">
                {mode === 'week' ? `${shortDate(weekDays[0])} – ${shortDate(weekDays[6])}` : monthLabel(selected)}
              </p>
              <p className="text-[11px] text-gray-500 flex flex-wrap gap-x-2">
                <span className="text-emerald-700 font-bold">✓ {formatDuration(periodHours.done)} منجزة</span>
                {periodHours.scheduled > 0 && <span className="text-blue-700">◷ {formatDuration(periodHours.scheduled)} مجدولة</span>}
                {periodHours.cancelled > 0 && <span className="text-rose-600">✕ {formatDuration(periodHours.cancelled)} ملغاة</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected !== today && <button onClick={() => setSelected(today)} className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">اليوم</button>}
            <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'week', label: 'أسبوع' }, { value: 'month', label: 'شهر' }]} />
          </div>
        </div>

        {mode === 'week' ? (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((d, i) => {
              const ls = byDate.get(d) ?? []
              const isSel = d === selected
              const mins = ls.filter(l => l.status !== 'cancelled').reduce((s, l) => s + l.durationMin, 0)
              return (
                <button key={d} onClick={() => setSelected(d)} aria-pressed={isSel} aria-label={dayLabel(d)}
                  className={`relative rounded-2xl py-2 sm:py-3 flex flex-col items-center gap-1 transition ${isSel ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : d === today ? 'bg-brand-50 text-brand-800' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span className={`text-[9px] sm:text-[10px] font-bold ${isSel ? 'text-brand-100' : 'text-gray-400'}`}>{WEEKDAYS[i]}</span>
                  <span className="text-lg font-black leading-none">{Number(d.slice(8))}</span>
                  <Dots lessons={ls} light={isSel} />
                  <span className={`text-[9px] font-bold h-3 ${isSel ? 'text-brand-100' : 'text-gray-400'}`}>{mins ? formatDuration(mins) : ''}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(w => <span key={w} className="text-center text-[9px] sm:text-[10px] font-bold text-gray-400">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map(d => {
                const ls = byDate.get(d) ?? []
                const inMonth = d.slice(0, 7) === selected.slice(0, 7)
                const isSel = d === selected
                return (
                  <button key={d} onClick={() => setSelected(d)} aria-pressed={isSel} aria-label={dayLabel(d)}
                    className={`aspect-square sm:aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition ${
                      isSel ? 'bg-brand-600 text-white' : d === today ? 'bg-brand-50 text-brand-800 font-black' : inMonth ? 'hover:bg-gray-50 text-gray-800' : 'text-gray-300'}`}>
                    <span className="font-bold leading-none">{Number(d.slice(8))}</span>
                    <Dots lessons={ls} light={isSel} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
          {(Object.keys(STATUS_META) as LessonStatus[]).map(s => (
            <span key={s} className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[s].color }} />{STATUS_META[s].icon} {STATUS_META[s].label}</span>
          ))}
        </div>
      </div>

      {/* Selected day */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="font-black text-gray-900">{selected === today ? 'اليوم · ' : selected === addDays(today, 1) ? 'غداً · ' : ''}{dayLabel(selected)}</h2>
          <p className="text-xs text-gray-400">
            {dayLessons.length ? `${active.length} حصة · ${formatDuration(dayMinutes)} · ${formatMoney(dayValue, settings.currency)}` : 'يوم فارغ'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {remindable.length > 0 && (
            <button onClick={() => setRemindOpen(true)} className={ghostBtn('text-emerald-700')}>
              <BellRing className="w-4 h-4" /> ذكّر العائلات ({remindable.filter(l => !l.parentRemindedAt).length}/{remindable.length})
            </button>
          )}
          {openToday.length > 1 && (
            <button onClick={() => setBulkOpen(true)} className={ghostBtn('text-emerald-700')}>
              <CheckCheck className="w-4 h-4" /> تمّت كلها ({openToday.length})
            </button>
          )}
          {stops.length > 0 && (
            <button onClick={() => setShowMap(s => !s)} className={ghostBtn(showMap ? 'bg-gray-100' : '')}>
              <Route className="w-4 h-4" /> <span className="hidden sm:inline">مسار اليوم</span>
            </button>
          )}
          <button onClick={() => onAdd({ date: selected })} className={primaryBtn()}><Plus className="w-4 h-4" /> حصة</button>
        </div>
      </div>

      <AnimatePresence>
        {showMap && stops.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
            <StopsMap stops={stops} currency={settings.currency} line />
            {routeUrl && stops.length > 1 && (
              <a href={routeUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn('w-full bg-gray-900 hover:bg-gray-800')}>
                <Navigation className="w-4 h-4" /> افتح مسار اليوم كاملاً في الخرائط ({stops.length} محطات)
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {dayLessons.length === 0 ? (
        <Empty icon={<CalendarDays className="w-5 h-5" />} title="لا حصص في هذا اليوم"
          text="أضف حصة واحدة، أو حصة تتكرر كل أسبوع في نفس الوقت."
          action={<button onClick={() => onAdd({ date: selected })} className={primaryBtn()}><Plus className="w-4 h-4" /> إضافة حصة</button>} />
      ) : (
        <motion.ul layout className="space-y-3">
          <AnimatePresence initial={false}>
            {dayLessons.flatMap(l => {
              const g = legs.get(l.id)
              const card = (
                <LessonCard key={l.id} lesson={l} paid={paidLessons.has(l.id)} onPaid={() => askPaid([l])} onEdit={() => onEdit(l)}
                  onCopy={() => onCopy(l)} onLocate={() => onLocate(l.clientId)} onStatus={s => setStatus(l, s)} />
              )
              if (!g) return [card]
              return [(
                <TravelRow key={`leg-${l.id}`} leg={g} from={dayLessons.find(x => x.id === g.fromId)} to={l} onLocate={onLocate} />
              ), card]
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      <PaidPrompt
        lesson={paidQueue.items[0] ?? null}
        step={paidQueue.total > 1 ? `${paidQueue.total - paidQueue.items.length + 1} من ${paidQueue.total}` : undefined}
        onClose={() => setPaidQueue(q => ({ ...q, items: q.items.slice(1) }))}
      />

      <RemindDay open={remindOpen} lessons={remindable} onClose={() => setRemindOpen(false)} />

      <BulkDone open={bulkOpen} lessons={openToday} onClose={() => setBulkOpen(false)}
        onDone={done => askPaid(done.filter(l => !paidLessons.has(l.id)))} />
    </div>
  )
}

function Dots({ lessons, light }: { lessons: WorkLesson[]; light?: boolean }) {
  if (!lessons.length) return <span className="h-1.5" />
  return (
    <span className="flex gap-0.5 h-1.5" aria-hidden>
      {lessons.slice(0, 4).map(l => (
        <span key={l.id} className={`w-1.5 h-1.5 rounded-full ${light ? 'ring-1 ring-white/60' : ''}`} style={{ backgroundColor: STATUS_META[l.status].color }} />
      ))}
    </span>
  )
}

/**
 * The drive between two consecutive lessons, in words: when the first one
 * ends, when the next one starts, how much free time that leaves, and the
 * estimated drive. An impossible distance is a wrong map pin, so it asks for
 * the pin to be fixed instead of reporting thousands of minutes of driving.
 */
function TravelRow({ leg: g, from, to, onLocate }: {
  leg: TravelLeg; from: WorkLesson | undefined; to: WorkLesson; onLocate: (clientId: string) => void
}) {
  const { clientsById } = useWorkLog()
  const short = (id: string | undefined) => { const c = clientsById.get(id ?? ''); return c?.childName || c?.name || '—' }
  const fromName = short(from?.clientId), toName = short(to.clientId)
  if (g.implausible) {
    return (
      <motion.li layout className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-[12px] text-rose-800 space-y-1.5">
        <p className="flex items-start gap-2 font-bold">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>المسافة بين منزلي {fromName} و{toName} على الخريطة ≈ {Math.round(g.km)} كم — هذا غير ممكن، فموقع إحدى العائلتين مسجّل خطأً.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {from && <button onClick={() => onLocate(from.clientId)} className="h-8 rounded-lg bg-white border border-rose-200 px-2.5 text-[11px] font-bold">صحّح موقع {fromName}</button>}
          <button onClick={() => onLocate(to.clientId)} className="h-8 rounded-lg bg-white border border-rose-200 px-2.5 text-[11px] font-bold">صحّح موقع {toName}</button>
        </div>
      </motion.li>
    )
  }
  const ends = from ? endTime(from.start, from.durationMin) : ''
  const gap = g.gapMin < 0 ? 'الحصتان متداخلتان' : g.gapMin === 0 ? 'لا وقت بينهما' : `بينهما ${durationText(g.gapMin)} فراغ`
  return (
    <motion.li layout className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-[11px] ${g.tight ? 'bg-amber-50 text-amber-800 font-bold' : 'text-gray-500'}`}>
      <Car className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        {ends && <>تنتهي حصة {fromName} {ends} وتبدأ حصة {toName} {to.start} — </>}{gap}
        {' · '}الطريق ≈ {g.km} كم ≈ {durationText(g.needMin)} بالسيارة
        {g.tight && ' — قد لا يكفي الوقت للوصول'}
      </span>
    </motion.li>
  )
}

function LessonCard({ lesson: l, paid, onPaid, onEdit, onCopy, onLocate, onStatus }: {
  lesson: WorkLesson; paid: boolean; onPaid: () => void; onEdit: () => void; onCopy: () => void; onLocate: () => void
  onStatus: (s: LessonStatus) => void
}) {
  const { clientsById, settings } = useWorkLog()
  const c = clientsById.get(l.clientId)
  const tel = phoneDigits(c?.phone, settings.currency)
  const remind = useParentReminder()
  const canRemind = l.status === 'scheduled' && l.date >= localToday() && !!c
  const m = STATUS_META[l.status]
  const faded = l.status === 'cancelled'

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`relative overflow-hidden rounded-2xl bg-white border shadow-sm ${faded ? 'border-rose-100' : 'border-gray-100'}`}>
      <span className="absolute inset-y-0 right-0 w-1.5" style={{ backgroundColor: c?.color ?? '#cbd5e1' }} />
      <div className="p-4 pr-5">
        <div className="flex items-start gap-3">
          <div className="text-center flex-shrink-0 w-14">
            <p className={`text-base font-black leading-none ${faded ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{l.start}</p>
            <p className="text-[10px] text-gray-400 mt-1">{endTime(l.start, l.durationMin)}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <button onClick={onEdit} className="text-right min-w-0">
                <p className={`font-black truncate ${faded ? 'text-gray-400' : 'text-gray-900'}`}>{c?.childName || c?.name || 'عائلة محذوفة'}</p>
                {c?.childName && <p className="text-[11px] text-gray-400 truncate">{c.name}</p>}
              </button>
              <StatusPill status={l.status} charged={l.charged} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(l.durationMin)}</span>
              <span className="font-bold text-gray-700">{formatMoney(l.price, settings.currency)}</span>
              {paid && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700"><Banknote className="w-3 h-3" />مدفوعة</span>}
              {l.status === 'done' && (l.rating
                ? <button onClick={onEdit} className="text-[11px]" aria-label={`تقييم الحصة ${l.rating} من 5`}>{'⭐'.repeat(l.rating)}</button>
                : <button onClick={onEdit} className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">⭐ قيّم الحصة</button>)}
              {l.status === 'scheduled' && l.reminderMin !== null && <span className="inline-flex items-center gap-1"><Bell className="w-3 h-3" />{l.reminderMin >= 60 ? `${l.reminderMin / 60} س` : `${l.reminderMin} د`}</span>}
              {l.status === 'cancelled' && <span>{l.cancelledBy === 'me' ? 'ألغيتُها أنا' : 'ألغتها العائلة'}</span>}
            </div>
            {c?.address && <p className="mt-1 text-[11px] text-gray-400 truncate inline-flex items-center gap-1 max-w-full"><MapPin className="w-3 h-3 flex-shrink-0" />{c.address}</p>}
            {l.note && <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600">{l.note}</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {l.status !== 'done' && (
            <button onClick={() => onStatus('done')} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition">
              <Check className="w-3.5 h-3.5" /> تمّت
            </button>
          )}
          {l.status !== 'cancelled' && (
            <button onClick={() => onStatus('cancelled')} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 transition">
              <X className="w-3.5 h-3.5" /> ألغيت
            </button>
          )}
          {l.status === 'done' && !paid && (
            <button onClick={onPaid} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition">
              <Banknote className="w-3.5 h-3.5" /> استلمت الأجر
            </button>
          )}
          {l.status !== 'scheduled' && (
            <button onClick={() => onStatus('scheduled')} className={`rounded-xl px-3 py-2 text-xs font-bold ${m.text} hover:bg-gray-50`}>تراجع</button>
          )}
          <span className="flex-1" />
          {c && !c.location && (
            <button onClick={onLocate} className="inline-flex items-center gap-1 h-9 rounded-xl border border-dashed border-gray-300 px-2.5 text-[11px] font-bold text-gray-500" aria-label="حدّد موقع المنزل">
              <MapPin className="w-3.5 h-3.5" /> الموقع
            </button>
          )}
          {c?.location && (
            <a href={googleDirectionsUrl(c.location)} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center" aria-label="الطريق إلى المنزل">
              <Navigation className="w-4 h-4" />
            </a>
          )}
          {tel && (
            <>
              <a href={`tel:+${tel}`} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center" aria-label="اتصال"><Phone className="w-4 h-4" /></a>
              {!canRemind && <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center" aria-label="واتساب"><MessageCircle className="w-4 h-4" /></a>}
            </>
          )}
          {canRemind && (
            <a href={remind.href(l)} target="_blank" rel="noopener noreferrer" onClick={() => remind.mark(l)}
              className={`inline-flex items-center gap-1 h-9 rounded-xl px-2.5 text-[11px] font-bold ${l.parentRemindedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white'}`}
              aria-label="تذكير الولي بالحصة على واتساب" title={l.parentRemindedAt ? 'أُرسل التذكير — اضغط لإرساله مجدداً' : 'تذكير الولي على واتساب'}>
              <BellRing className="w-3.5 h-3.5" /> {l.parentRemindedAt ? 'ذُكّر ✓' : 'ذكّر الولي'}
            </a>
          )}
          <button onClick={onCopy} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center" aria-label="نسخ الحصة إلى تاريخ آخر" title="نسخ"><Copy className="w-4 h-4" /></button>
          <button onClick={onEdit} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center" aria-label="تعديل"><Pencil className="w-4 h-4" /></button>
        </div>
      </div>
    </motion.li>
  )
}

/** Close the day in one go: tick the lessons that happened, then ask about payment for each. */
function BulkDone({ open, lessons, onClose, onDone }: {
  open: boolean; lessons: WorkLesson[]; onClose: () => void; onDone: (done: WorkLesson[]) => void
}) {
  const { clientsById, settings, update } = useWorkLog()
  const { toast } = useToast()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setPicked(new Set(lessons.map(l => l.id))) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function apply() {
    const chosen = lessons.filter(l => picked.has(l.id))
    if (!chosen.length) { onClose(); return }
    setSaving(true)
    const done: WorkLesson[] = []
    // One at a time: a failure stops nothing else and is reported by name.
    for (const l of chosen) {
      try { await update('lessons', l.id, { status: 'done' }); done.push({ ...l, status: 'done' }) }
      catch (e) { toast(`${clientLabel(clientsById.get(l.clientId))}: ${(e as Error).message}`, 'error') }
    }
    setSaving(false)
    onClose()
    if (done.length) { toast(`تمّت ${done.length} حصة ✓`); onDone(done) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="تعليم حصص اليوم «تمّت»"
      footer={
        <button onClick={apply} disabled={saving || picked.size === 0} className={primaryBtn('w-full bg-emerald-600 hover:bg-emerald-700')}>
          <CheckCheck className="w-4 h-4" /> {saving ? 'جارٍ الحفظ…' : `تمّت (${picked.size})`}
        </button>
      }>
      <p className="text-xs text-gray-500 mb-3">ألغِ تحديد أي حصة لم تحدث — تبقى «مجدولة» لتعدّلها وحدها. بعدها يسألك عن الأجر لكل عائلة.</p>
      <ul className="space-y-2">
        {lessons.map(l => {
          const c = clientsById.get(l.clientId)
          return (
            <li key={l.id}>
              <label className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 cursor-pointer has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/50">
                <input type="checkbox" className="w-4 h-4 accent-emerald-600" checked={picked.has(l.id)}
                  onChange={e => setPicked(p => { const n = new Set(p); if (e.target.checked) n.add(l.id); else n.delete(l.id); return n })} />
                <span className="w-2 h-8 rounded-full" style={{ backgroundColor: c?.color }} />
                <span className="flex-1 min-w-0">
                  <b className="block text-sm text-gray-900 truncate">{clientLabel(c)}</b>
                  <span className="text-[11px] text-gray-500">{l.start}–{endTime(l.start, l.durationMin)} · {formatMoney(l.price, settings.currency)}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

/** WhatsApp reminder to a parent, and the server-side record that it was sent. */
function useParentReminder() {
  const { clientsById, settings, update } = useWorkLog()
  const today = localToday()
  return {
    href(l: WorkLesson) {
      const c = clientsById.get(l.clientId)
      const tel = phoneDigits(c?.phone, settings.currency)
      const text = c ? lessonReminderText(l, c, dayLabel, today, settings.senderName) : ''
      // Without a number wa.me opens the chat picker with the text ready.
      return `https://wa.me/${tel ?? ''}?text=${encodeURIComponent(text)}`
    },
    mark(l: WorkLesson) {
      // Recorded when the link is opened; WhatsApp gives no delivery receipt back to a web page.
      update('lessons', l.id, { parentReminded: true }).catch(() => {})
    },
  }
}

/** The day's families, one tap each — wa.me opens one chat at a time, so this is a checklist. */
function RemindDay({ open, lessons, onClose }: { open: boolean; lessons: WorkLesson[]; onClose: () => void }) {
  const { clientsById } = useWorkLog()
  const remind = useParentReminder()
  return (
    <Sheet open={open} onClose={onClose} title="تذكير العائلات بحصص اليوم المحدّد">
      <p className="text-xs text-gray-500 mb-3">اضغط «أرسل» لكل عائلة: يفتح واتساب بالرسالة جاهزة، ثم عُد إلى هنا للعائلة التالية. تظهر ✓ بجانب من أرسلتَ له.</p>
      <ul className="space-y-2">
        {lessons.map(l => {
          const c = clientsById.get(l.clientId)
          return (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
              <span className="w-2 h-8 rounded-full" style={{ backgroundColor: c?.color }} />
              <span className="flex-1 min-w-0">
                <b className="block text-sm text-gray-900 truncate">{clientLabel(c)}</b>
                <span className="text-[11px] text-gray-500">{l.start}{c?.phone ? '' : ' · لا رقم هاتف — اختر المحادثة يدوياً'}</span>
              </span>
              <a href={remind.href(l)} target="_blank" rel="noopener noreferrer" onClick={() => remind.mark(l)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${l.parentRemindedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white'}`}>
                {l.parentRemindedAt ? '✓ أُرسل' : 'أرسل'}
              </a>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
