'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Video, AlertCircle, CheckCircle2, XCircle, User, Plus, MonitorPlay, ChevronLeft, MessageCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeUp, popIn, liftHover, tapOnly } from '@/lib/motion'
import { ACountUp } from '@/components/ui'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { getAllAppointments, getAllParents } from '@/lib/db'
import type { Parent } from '@/lib/types'

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar'
}

// Absolute start time (ms) of an appointment from its date + timeSlot. Built
// from the parts in LOCAL time (not `new Date(date)`, which parses a bare
// "YYYY-MM-DD" as UTC midnight and drifts across timezones). timeSlot may be
// "16:00" or "16:00-16:45" — we read the leading HH:MM.
function apptStartMs(a: { date: string; timeSlot: string }): number {
  const [y, mo, d] = a.date.split('-').map(Number)
  const tm = a.timeSlot.match(/(\d{1,2}):(\d{2})/)
  const h  = tm ? Number(tm[1]) : 0
  const mi = tm ? Number(tm[2]) : 0
  if (!y || !mo || !d) return new Date(a.date).getTime()   // fallback for odd formats
  return new Date(y, mo - 1, d, h, mi).getTime()
}

const AVATAR_GRADIENTS = [
  'from-brand-600 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-brand-500 to-blue-600',
]

export default function AppointmentsView({ appointments, parents, error }: {
  appointments: Awaited<ReturnType<typeof getAllAppointments>>
  parents: Omit<Parent, 'passwordHash'>[]
  error: boolean
}) {
  const { lang } = useLang()
  const t = tr[lang].adminAppointments
  const navT = tr[lang].adminNav
  const adminT = tr[lang].adminChrome

  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Mark a real session as held → status 'completed', so it's counted in the
  // "sessions per child" stat. (Held+saved sessions auto-complete on the "حفظ"
  // action; this is for sessions done offline or marked retroactively.)
  async function handleSetStatus(id: string, status: 'completed', e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (deletingId) return
    setDeletingId(id)
    try {
      const r = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (r.ok) router.refresh()
      else window.alert('تعذّر تحديث حالة الموعد.')
    } catch {
      window.alert('تعذّر تحديث حالة الموعد.')
    } finally {
      setDeletingId(null)
    }
  }

  // Permanently delete an appointment (distinct from cancelling). Confirms
  // first — this can't be undone — then refreshes the server-rendered list.
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (deletingId) return
    if (!window.confirm('حذف هذا الموعد نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return
    setDeletingId(id)
    try {
      const r = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
      if (r.ok) router.refresh()
      else window.alert('تعذّر حذف الموعد. حاول مرة أخرى.')
    } catch {
      window.alert('تعذّر حذف الموعد. تحقّق من الاتصال.')
    } finally {
      setDeletingId(null)
    }
  }

  const STATUS_CFG: Record<string, { label: string; dot: string; badge: string; icon: React.ComponentType<{className?: string}> }> = {
    scheduled: { label: t.status.scheduled, dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',     icon: Clock },
    completed: { label: t.status.completed, dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 },
    cancelled: { label: t.status.cancelled, dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 ring-1 ring-red-200',         icon: XCircle },
    'no-show': { label: t.status.noShow,    dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',      icon: AlertCircle },
  }

  const TYPE_CFG: Record<string, { label: string; color: string }> = {
    assessment: { label: t.type.assessment, color: 'bg-violet-100 text-violet-700' },
    followup:   { label: t.type.followup,   color: 'bg-brand-100 text-brand-700' },
    emergency:  { label: t.type.emergency,  color: 'bg-red-100 text-red-700' },
  }

  function waReminderLink(phone: string | undefined, firstName: string, date: string, timeSlot: string): string | null {
    if (!phone) return null
    const digits = phone.replace(/[^\d]/g, '').replace(/^00/, '')
    if (digits.length < 8) return null
    const dateStr = new Date(date).toLocaleDateString(localeFor(lang), { weekday: 'long', day: 'numeric', month: 'long' })
    const message = t.waReminderMessage(firstName, dateStr, timeSlot)
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  }

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p]))

  // "Upcoming" = a scheduled appointment whose start time hasn't passed yet
  // (+1h grace so a session that's already in progress still counts). This is
  // the fix for the reported bug: previously ANY scheduled appointment — even
  // long-past ones never marked done/cancelled — counted as upcoming, and
  // being the oldest dates they filled the top-3 spotlight, so a newly-booked
  // FUTURE appointment (which does appear in the notification bell) was sorted
  // to the bottom and never showed here. Now upcoming is future-only and
  // sorted soonest-first, so a new booking surfaces immediately.
  const GRACE_MS = 60 * 60 * 1000
  const now = Date.now()
  const scheduled = appointments.filter(a => a.status === 'scheduled')
  const upcoming = scheduled
    .filter(a => apptStartMs(a) >= now - GRACE_MS)
    .sort((a, b) => apptStartMs(a) - apptStartMs(b))          // soonest first
  // Past-due but still 'scheduled' — overdue, needs the specialist to mark it
  // done/cancelled. Kept in the full list below (so nothing vanishes), just
  // never allowed to crowd the upcoming spotlight.
  const pastDue = scheduled
    .filter(a => apptStartMs(a) < now - GRACE_MS)
    .sort((a, b) => apptStartMs(b) - apptStartMs(a))          // most-recent overdue first
  const completed = appointments.filter(a => a.status === 'completed')
  const cancelled = appointments.filter(a => ['cancelled', 'no-show'].includes(a.status))

  const allSorted = [
    ...upcoming,
    ...pastDue,
    ...appointments.filter(a => a.status !== 'scheduled').sort(
      (a, b) => apptStartMs(b) - apptStartMs(a)
    ),
  ]

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-500" />
            {navT.appointments}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.pageSubtitle}</p>
        </div>
        <motion.div {...tapOnly}>
          <Link
            href="/dashboard/appointments/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/30"
          >
            <Plus className="w-4 h-4" />
            {t.newApptButton}
          </Link>
        </motion.div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{adminT.dbConnectionError}</p>
        </motion.div>
      )}

      {/* ── Stats Strip ── */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={staggerContainer}>
        {[
          { label: t.statTotal,            value: appointments.length, bg: 'bg-brand-600',   glow: 'shadow-brand-500/20',   icon: Calendar },
          { label: t.statUpcoming,         value: upcoming.length,     bg: 'bg-blue-600',    glow: 'shadow-blue-500/20',    icon: Clock },
          { label: t.statCompleted,        value: completed.length,    bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20', icon: CheckCircle2 },
          { label: t.statCancelledNoShow,  value: cancelled.length,    bg: 'bg-gray-500',    glow: 'shadow-gray-500/20',    icon: XCircle },
        ].map(({ label, value, bg, glow, icon: Icon }) => (
          <motion.div key={label} variants={popIn} {...liftHover} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900"><ACountUp value={value} /></div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Upcoming spotlight ── */}
      {upcoming.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 border-l-4 border-l-brand-600 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              {t.upcomingSpotlightTitle}
            </h2>
            <span className="bg-brand-50 text-brand-600 text-xs font-black px-2.5 py-1 rounded-full"><ACountUp value={upcoming.length} /></span>
          </div>
          <motion.div className="space-y-2" variants={staggerContainer}>
            <AnimatePresence initial={false}>
              {upcoming.slice(0, 5).map((appt, idx) => {
                const parent = parentMap[appt.parentId]
                const type = TYPE_CFG[appt.type]
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                const wa = parent ? waReminderLink(parent.phone, parent.firstName, appt.date, appt.timeSlot) : null
                return (
                  <motion.div key={appt.id} variants={fadeUp} {...liftHover} className="bg-white rounded-2xl border border-gray-100 hover:border-brand-200 px-4 py-3 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0`}>
                        {parent ? parent.firstName[0] : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-black text-sm text-gray-900">
                          {parent ? `${parent.firstName} ${parent.lastName}` : '—'}
                        </p>
                        <p className="text-gray-400 text-[11px] ltr-num">
                          {new Date(appt.date).toLocaleDateString(localeFor(lang), { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}{appt.timeSlot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {type && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${type.color}`}>
                          {type.label}
                        </span>
                      )}
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer"
                          title={t.waReminderTitle}
                          className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors">
                          <MessageCircle className="w-3 h-3" />
                          {t.reminderLabel}
                        </a>
                      )}
                      <Link
                        href={`/session/${appt.id}`}
                        className="flex items-center gap-1 bg-brand-50 text-brand-600 hover:bg-brand-100 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors">
                        <MonitorPlay className="w-3 h-3" />
                        {t.startSessionButton}
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {/* ── All appointments cards ── */}
      {appointments.length === 0 && !error ? (
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-900 font-black text-lg">{t.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">{t.emptySubtitle}</p>
          <Link href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t.addApptNowButton}
          </Link>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" variants={staggerContainer}>
          <AnimatePresence initial={false}>
          {allSorted.map((appt, idx) => {
            const parent = parentMap[appt.parentId]
            const status = STATUS_CFG[appt.status] ?? { label: appt.status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', icon: Clock }
            const type = TYPE_CFG[appt.type]
            const StatusIcon = status.icon
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
            const dateStr = new Date(appt.date).toLocaleDateString(localeFor(lang), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
            const wa = appt.status === 'scheduled' && parent ? waReminderLink(parent.phone, parent.firstName, appt.date, appt.timeSlot) : null

            return (
              <motion.div
                key={appt.id}
                variants={fadeUp}
                {...liftHover}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:border-brand-200 transition-shadow duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0`}>
                      {parent ? parent.firstName[0].toUpperCase() : <User className="w-5 h-5" />}
                      <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 ${status.dot} rounded-full border-2 border-white`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm group-hover:text-brand-600 transition-colors">
                        {parent ? `${parent.firstName} ${parent.lastName}` : '—'}
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5 truncate max-w-[140px]">
                        {parent?.email ?? appt.parentId.slice(0, 20)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${status.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {/* Date + time block */}
                <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 ltr-num">{dateStr}</p>
                    <p className="text-[11px] text-gray-400 ltr-num mt-0.5">{appt.timeSlot}</p>
                  </div>
                </div>

                {/* Type + notes */}
                <div className="space-y-2 mb-4">
                  {type && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">{t.typeFieldLabel}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg ${type.color}`}>{type.label}</span>
                    </div>
                  )}
                  {appt.notes && (
                    <p className="text-[11px] text-amber-700 line-clamp-2 bg-amber-50 rounded-xl px-3 py-2">
                      {appt.notes}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <Link
                    href={`/session/${appt.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    {t.startSessionButton}
                  </Link>
                  <div className="flex items-center gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer"
                        title={t.waReminderTitle}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {t.reminderLabel}
                      </a>
                    )}
                    {appt.meetingUrl && (
                      <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition-colors">
                        <Video className="w-3.5 h-3.5" />
                        {t.meetingLabel}
                      </a>
                    )}
                    {appt.status === 'scheduled' && (
                      <button
                        onClick={(e) => handleSetStatus(appt.id, 'completed', e)}
                        disabled={deletingId === appt.id}
                        title="تعليم الحصة كمُنجزة (تُحتسب في إحصائيات عدد الحصص لكل طفل)"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تمّت
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(appt.id, e)}
                      disabled={deletingId === appt.id}
                      title="حذف الموعد نهائياً"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </motion.div>
      )}

    </motion.div>
  )
}
