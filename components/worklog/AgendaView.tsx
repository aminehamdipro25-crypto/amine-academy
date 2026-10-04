'use client'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle,
  Navigation, Pencil, Phone, Plus, Route, X,
} from 'lucide-react'
import {
  STATUS_META, addDays, endOfMonth, endTime, formatDuration, formatMoney, googleDirectionsUrl, googleRouteUrl,
  lessonValue, phoneDigits, sortLessons, startOfMonth, startOfWeek, weekdayMon0, type GeoPoint, type LessonStatus, type WorkLesson,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Empty, Segmented, StatusPill, dayLabel, ghostBtn, localToday, monthLabel, primaryBtn, shortDate } from './ui'
import type { LessonDraft } from './LessonForm'

const StopsMap = dynamic(() => import('./WorkMap').then(m => m.StopsMap), {
  ssr: false, loading: () => <div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />,
})

const WEEKDAYS = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']

export default function AgendaView({ onAdd, onEdit }: { onAdd: (d?: LessonDraft) => void; onEdit: (l: WorkLesson) => void }) {
  const { lessons, clientsById, settings, update } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const [selected, setSelected] = useState(today)
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const [showMap, setShowMap] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

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
      toast(status === 'done' ? 'تمّت الحصة ✓' : status === 'cancelled' ? 'سُجّلت كملغاة' : 'أُعيدت إلى «مجدولة»', status === 'cancelled' ? 'info' : 'success')
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
  const periodMinutes = (from: string, to: string) =>
    lessons.filter(l => l.date >= from && l.date <= to && l.status !== 'cancelled').reduce((s, l) => s + l.durationMin, 0)

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
              <p className="text-[11px] text-gray-400">
                {formatDuration(mode === 'week' ? periodMinutes(weekDays[0], weekDays[6]) : periodMinutes(monthStart, endOfMonth(selected)))} عمل مجدول ومنجز
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
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-black text-gray-900">{selected === today ? 'اليوم · ' : selected === addDays(today, 1) ? 'غداً · ' : ''}{dayLabel(selected)}</h2>
          <p className="text-xs text-gray-400">
            {dayLessons.length ? `${active.length} حصة · ${formatDuration(dayMinutes)} · ${formatMoney(dayValue, settings.currency)}` : 'يوم فارغ'}
          </p>
        </div>
        <div className="flex gap-2">
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
            {dayLessons.map(l => (
              <LessonCard key={l.id} lesson={l} onEdit={() => onEdit(l)} onStatus={s => setStatus(l, s)} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
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

function LessonCard({ lesson: l, onEdit, onStatus }: { lesson: WorkLesson; onEdit: () => void; onStatus: (s: LessonStatus) => void }) {
  const { clientsById, settings } = useWorkLog()
  const c = clientsById.get(l.clientId)
  const tel = phoneDigits(c?.phone, settings.currency)
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
          {l.status !== 'scheduled' && (
            <button onClick={() => onStatus('scheduled')} className={`rounded-xl px-3 py-2 text-xs font-bold ${m.text} hover:bg-gray-50`}>تراجع</button>
          )}
          <span className="flex-1" />
          {c?.location && (
            <a href={googleDirectionsUrl(c.location)} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center" aria-label="الطريق إلى المنزل">
              <Navigation className="w-4 h-4" />
            </a>
          )}
          {tel && (
            <>
              <a href={`tel:+${tel}`} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center" aria-label="اتصال"><Phone className="w-4 h-4" /></a>
              <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center" aria-label="واتساب"><MessageCircle className="w-4 h-4" /></a>
            </>
          )}
          <button onClick={onEdit} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center" aria-label="تعديل"><Pencil className="w-4 h-4" /></button>
        </div>
      </div>
    </motion.li>
  )
}
