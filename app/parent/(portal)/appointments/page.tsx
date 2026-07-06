'use client'
import { useEffect, useState, useCallback } from 'react'
import { Calendar, Clock, Video, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Appointment, Student } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

function jitsiUrl(url: string, name: string): string {
  return `${url}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&userInfo.displayName=${encodeURIComponent(name)}`
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { bg: '#F0FFF4', color: '#15803D' },
  cancelled: { bg: '#FEF2F2', color: '#B91C1C' },
  'no-show': { bg: '#F9FAFB', color: '#6B7280' },
}

function isSessionLive(date: string, timeSlot: string): boolean {
  const startPart = timeSlot.includes('-') ? timeSlot.split('-')[0] : timeSlot
  const endPart   = timeSlot.includes('-') ? timeSlot.split('-')[1] : null
  const [startH, startM] = startPart.split(':').map(Number)
  const [endH, endM] = endPart ? endPart.split(':').map(Number) : [startH, startM + 60]
  const now = new Date()
  const sessionDate = new Date(date)
  if (
    now.getFullYear() !== sessionDate.getFullYear() ||
    now.getMonth() !== sessionDate.getMonth() ||
    now.getDate() !== sessionDate.getDate()
  ) return false
  const start = new Date(now); start.setHours(startH, startM - 15, 0)
  const end = new Date(now); end.setHours(endH, endM + 5, 0)
  return now >= start && now <= end
}

interface SlotInfo { time: string; available: boolean }

export default function AppointmentsPage() {
  const { lang } = useLang()
  const t = tr[lang].parentAppointments
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const defaultDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  const [showBook, setShowBook] = useState(false)
  const [booking, setBooking] = useState({ studentId: '', date: defaultDate, timeSlot: '', type: 'followup', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [slots, setSlots] = useState<SlotInfo[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/parent/me').then(r => r.json()),
    ]).then(([apptData, meData]) => {
      setAppointments(apptData.appointments || [])
      setChildren(meData.children || [])
      if (meData.children?.length) setBooking(b => ({ ...b, studentId: meData.children[0].id }))
    }).finally(() => setLoading(false))
  }, [])

  const fetchSlots = useCallback(async (date: string) => {
    if (!date) return
    setLoadingSlots(true)
    setSlots([])
    try {
      const res = await fetch(`/api/appointments/available?date=${date}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  // Load slots whenever the booking panel opens or the date changes
  useEffect(() => {
    if (showBook && booking.date) fetchSlots(booking.date)
  }, [showBook, booking.date, fetchSlots])

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setBookingError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      const data = await res.json()
      if (res.ok) {
        setAppointments(prev => [data.appointment, ...prev])
        setSuccess(true)
        setShowBook(false)
        setBooking(b => ({ ...b, timeSlot: '' }))
        setTimeout(() => setSuccess(false), 4000)
      } else {
        setBookingError(data.error || 'خطأ في الحجز')
        // If slot was taken, refresh slots
        if (res.status === 409) fetchSlots(booking.date)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const upcoming = appointments.filter(a => a.status === 'scheduled')
  const past = appointments.filter(a => a.status !== 'scheduled')

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-4xl animate-pulse">📅</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">{t.pageTitle}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t.pageSubtitle}</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: '#6B46F0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
        >
          <Plus className="w-4 h-4" /> {t.bookSessionButton}
        </button>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#F0FFF4', border: '1.5px solid #A7F3D0' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16A34A' }} />
          <div>
            <p className="font-bold text-green-800 text-sm">{t.successTitle}</p>
            <p className="text-green-700 text-xs mt-0.5">{t.successBody}</p>
          </div>
        </div>
      )}

      {/* ── Upcoming ── */}
      <div>
        <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#6B46F0' }} />
          {t.upcomingSessionsTitle}
          {upcoming.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full ltr-num" style={{ background: '#F3EEFF', color: '#5A32D9' }}>
              {upcoming.length}
            </span>
          )}
        </h2>

        {upcoming.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#FFFFFF', border: '2px dashed #E5E7EB' }}
          >
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">{t.noScheduledSessions}</p>
            <button
              onClick={() => setShowBook(true)}
              className="inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: '#6B46F0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
            >
              <Plus className="w-4 h-4" /> {t.bookNowButton}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(appt => {
              const live = isSessionLive(appt.date, appt.timeSlot)
              return (
                <div
                  key={appt.id}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    background: '#FFFFFF',
                    border: live ? '2px solid #4ADE80' : '1.5px solid #F0E8FF',
                    boxShadow: live ? '0 4px 24px rgba(74,222,128,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {live && (
                    <div className="flex items-center gap-2 mb-3 rounded-xl px-3 py-2" style={{ background: '#F0FFF4' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                      <span className="font-black text-sm" style={{ color: '#15803D' }}>{t.sessionLiveNow}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-black text-gray-900">{t.typeLabels[appt.type as keyof typeof t.typeLabels] || appt.type}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_COLORS[appt.status]?.bg || '#F9FAFB', color: STATUS_COLORS[appt.status]?.color || '#6B7280' }}
                        >
                          {t.statusLabels[appt.status as keyof typeof t.statusLabels]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="ltr-num">{new Date(appt.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="ltr-num">{appt.timeSlot}</span>
                        </span>
                      </div>
                      {appt.notes && <p className="text-gray-500 text-xs mt-2">{appt.notes}</p>}
                    </div>
                    {appt.meetingUrl && (
                      <a
                        href={jitsiUrl(appt.meetingUrl, t.parentDisplayName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-black px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0"
                        style={
                          live
                            ? { background: '#16A34A', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }
                            : { background: '#F3EEFF', color: '#5A32D9', border: '1.5px solid #E8DBFF' }
                        }
                        onMouseEnter={e => {
                          if (live) (e.currentTarget as HTMLAnchorElement).style.background = '#15803D'
                          else { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }
                        }}
                        onMouseLeave={e => {
                          if (live) (e.currentTarget as HTMLAnchorElement).style.background = '#16A34A'
                          else { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }
                        }}
                      >
                        <Video className="w-4 h-4" />
                        {live ? t.joinNowButton : t.sessionLinkButton}
                      </a>
                    )}
                  </div>
                  {appt.meetingUrl && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F0E8FF' }}>
                      <p className="text-xs text-gray-400">
                        <span className="font-bold">{t.sessionToolLabel}</span> {t.sessionToolDesc}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Past appointments ── */}
      {past.length > 0 && (
        <div>
          <h2 className="font-black text-gray-600 mb-3 text-sm">{t.pastSessionsTitle}</h2>
          <div className="space-y-2">
            {past.map(appt => (
              <div
                key={appt.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: '#FFFFFF', border: '1px solid #F3F4F6' }}
              >
                <div>
                  <span className="font-bold text-gray-700 text-sm">{t.typeLabels[appt.type as keyof typeof t.typeLabels]}</span>
                  <div className="text-gray-400 text-xs mt-0.5 ltr-num">{appt.date} • {appt.timeSlot}</div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: STATUS_COLORS[appt.status]?.bg || '#F9FAFB', color: STATUS_COLORS[appt.status]?.color || '#6B7280' }}
                >
                  {t.statusLabels[appt.status as keyof typeof t.statusLabels]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking modal ── */}
      {showBook && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => e.target === e.currentTarget && setShowBook(false)}
        >
          <div
            className="rounded-3xl w-full max-w-md p-6 overflow-y-auto"
            style={{ background: '#FFFFFF', maxHeight: '90vh' }}
          >
            <h3 className="font-black text-xl text-gray-900 mb-5">{t.bookingModalTitle}</h3>
            <form onSubmit={handleBook} className="space-y-4">

              {/* Child selector */}
              {children.length > 1 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">{t.childLabel}</label>
                  <select
                    value={booking.studentId}
                    onChange={e => setBooking(b => ({ ...b, studentId: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ border: '1.5px solid #E5E7EB' }}
                    onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                    onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                  >
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Session type */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">{t.sessionTypeLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(t.typeLabels).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBooking(b => ({ ...b, type: val }))}
                      className="text-right p-3 rounded-xl transition-all"
                      style={
                        booking.type === val
                          ? { border: '2px solid #7C5CFC', background: '#F3EEFF' }
                          : { border: '2px solid #E5E7EB', background: '#FFFFFF' }
                      }
                      onMouseEnter={e => { if (booking.type !== val) (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF' }}
                      onMouseLeave={e => { if (booking.type !== val) (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}
                    >
                      <div className="font-bold text-xs text-gray-900">{label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.typeDescs[val as keyof typeof t.typeDescs]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">{t.dateLabel}</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={booking.date}
                  onChange={e => {
                    setBooking(b => ({ ...b, date: e.target.value, timeSlot: '' }))
                  }}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Visual slot picker */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">{t.preferredTimeLabel}</label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6 rounded-2xl" style={{ background: '#F9FAFB' }}>
                    <div className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد مواعيد متاحة في هذا اليوم</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(slot => {
                      const selected = booking.timeSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => slot.available && setBooking(b => ({ ...b, timeSlot: slot.time }))}
                          className="ltr-num rounded-xl py-2.5 text-sm font-bold transition-all relative"
                          style={
                            !slot.available
                              ? { background: '#F3F4F6', color: '#D1D5DB', cursor: 'not-allowed', border: '1.5px solid #F3F4F6' }
                              : selected
                              ? { background: '#6B46F0', color: '#FFFFFF', border: '1.5px solid #6B46F0', boxShadow: '0 4px 12px rgba(107,70,240,0.3)' }
                              : { background: '#F0FFF4', color: '#15803D', border: '1.5px solid #A7F3D0' }
                          }
                        >
                          {slot.time}
                          {!slot.available && (
                            <span className="block text-[9px] font-normal mt-0.5" style={{ color: '#9CA3AF' }}>
                              محجوز
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">{t.notesLabel}</label>
                <textarea
                  rows={2}
                  value={booking.notes}
                  onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                  placeholder={t.notesPlaceholder}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Error message */}
              {bookingError && (
                <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#DC2626' }} />
                  <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{bookingError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBook(false); setBookingError('') }}
                  className="flex-1 font-bold py-3 rounded-xl text-sm text-gray-600 transition-all"
                  style={{ border: '2px solid #E5E7EB', background: '#FFFFFF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF' }}
                >
                  {t.cancelButton}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !booking.date || !booking.timeSlot || !booking.studentId}
                  className="flex-1 font-black py-3 rounded-xl text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: '#6B46F0' }}
                  onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
                >
                  {submitting ? t.bookingInProgress : t.confirmBookingButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
