'use client'
import { useEffect, useState } from 'react'
import { Calendar, Clock, Video, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Appointment, Student } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  assessment:   'جلسة تقييمية',
  followup:     'جلسة متابعة',
  emergency:    'استشارة طارئة',
  consultation: 'استشارة للوالدين',
  training:     'جلسة تدريبية مكثفة',
  review:       'مراجعة البرنامج',
}

const TYPE_DESCS: Record<string, string> = {
  assessment:   'تقييم شامل لمستوى الطفل',
  followup:     'متابعة التقدم الأسبوعي',
  emergency:    'تواصل عاجل مع الأستاذ',
  consultation: 'نقاش حول التطور والخطة',
  training:     'جلسة مكثفة بروتوكول ABA',
  review:       'مراجعة وتعديل البرنامج',
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  scheduled: { label: 'مُجدولة', bg: '#EFF6FF', color: '#1D4ED8', icon: Clock },
  completed: { label: 'منتهية',  bg: '#F0FFF4', color: '#15803D', icon: CheckCircle },
  cancelled: { label: 'ملغاة',   bg: '#FEF2F2', color: '#B91C1C', icon: XCircle },
  'no-show': { label: 'غياب',    bg: '#F9FAFB', color: '#6B7280', icon: AlertCircle },
}

const QUICK_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

function isSessionLive(date: string, timeSlot: string): boolean {
  const startPart = timeSlot.includes('-') ? timeSlot.split('-')[0] : timeSlot
  const endPart   = timeSlot.includes('-') ? timeSlot.split('-')[1] : null
  const [startH, startM] = startPart.split(':').map(Number)
  const [endH, endM] = endPart ? endPart.split(':').map(Number) : [startH, startM + 45]
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const defaultDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  const [showBook, setShowBook] = useState(false)
  const [booking, setBooking] = useState({ studentId: '', date: defaultDate, timeSlot: '', type: 'followup', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
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
        setTimeout(() => setSuccess(false), 4000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const upcoming = appointments.filter(a => a.status === 'scheduled')
  const past = appointments.filter(a => a.status !== 'scheduled')

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-4xl animate-pulse">📅</div>
    </div>
  )

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">مواعيدي</h1>
          <p className="text-gray-500 text-sm mt-0.5">جلساتك القادمة والسابقة</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: '#6B46F0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
        >
          <Plus className="w-4 h-4" /> حجز جلسة
        </button>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#F0FFF4', border: '1.5px solid #A7F3D0' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16A34A' }} />
          <div>
            <p className="font-bold text-green-800 text-sm">تم تأكيد حجزك بنجاح!</p>
            <p className="text-green-700 text-xs mt-0.5">ستجد رابط الجلسة في تفاصيل الموعد. ستصلك أيضاً رسالة تأكيد على بريدك.</p>
          </div>
        </div>
      )}

      {/* ── Upcoming ── */}
      <div>
        <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#6B46F0' }} />
          الجلسات القادمة
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
            <p className="text-gray-500 text-sm mb-4">لا توجد جلسات مجدولة</p>
            <button
              onClick={() => setShowBook(true)}
              className="inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: '#6B46F0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
            >
              <Plus className="w-4 h-4" /> احجز جلسة الآن
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
                      <span className="font-black text-sm" style={{ color: '#15803D' }}>الجلسة جارية الآن!</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-black text-gray-900">{TYPE_LABELS[appt.type] || appt.type}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_CFG[appt.status]?.bg || '#F9FAFB', color: STATUS_CFG[appt.status]?.color || '#6B7280' }}
                        >
                          {STATUS_CFG[appt.status]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(appt.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                        href={appt.meetingUrl}
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
                        {live ? 'انضم الآن' : 'رابط الجلسة'}
                      </a>
                    )}
                  </div>
                  {appt.meetingUrl && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F0E8FF' }}>
                      <p className="text-xs text-gray-400">
                        <span className="font-bold">أداة الجلسة:</span> Jitsi Meet — تعمل مباشرة في المتصفح، لا حاجة لتنزيل أي برنامج
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
          <h2 className="font-black text-gray-600 mb-3 text-sm">الجلسات السابقة</h2>
          <div className="space-y-2">
            {past.map(appt => (
              <div
                key={appt.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: '#FFFFFF', border: '1px solid #F3F4F6' }}
              >
                <div>
                  <span className="font-bold text-gray-700 text-sm">{TYPE_LABELS[appt.type]}</span>
                  <div className="text-gray-400 text-xs mt-0.5 ltr-num">{appt.date} • {appt.timeSlot}</div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: STATUS_CFG[appt.status]?.bg || '#F9FAFB', color: STATUS_CFG[appt.status]?.color || '#6B7280' }}
                >
                  {STATUS_CFG[appt.status]?.label}
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
          <div className="rounded-3xl w-full max-w-md p-6" style={{ background: '#FFFFFF' }}>
            <h3 className="font-black text-xl text-gray-900 mb-5">حجز جلسة جديدة</h3>
            <form onSubmit={handleBook} className="space-y-4">
              {children.length > 1 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">الطفل</label>
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

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">نوع الجلسة</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
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
                      <div className="text-[10px] text-gray-400 mt-0.5">{TYPE_DESCS[val]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={booking.date}
                  onChange={e => setBooking(b => ({ ...b, date: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">الوقت المفضل</label>
                <input
                  type="time"
                  required
                  value={booking.timeSlot}
                  onChange={e => setBooking(b => ({ ...b, timeSlot: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none ltr-num"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {QUICK_TIMES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBooking(b => ({ ...b, timeSlot: t }))}
                      className="text-xs font-bold px-2.5 py-1 rounded-full transition-all ltr-num"
                      style={
                        booking.timeSlot === t
                          ? { background: '#6B46F0', color: '#FFFFFF', border: '1px solid #6B46F0' }
                          : { background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }
                      }
                      onMouseEnter={e => { if (booking.timeSlot !== t) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF'; (e.currentTarget as HTMLButtonElement).style.color = '#6B46F0' } }}
                      onMouseLeave={e => { if (booking.timeSlot !== t) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' } }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">ملاحظات (اختياري)</label>
                <textarea
                  rows={2}
                  value={booking.notes}
                  onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                  placeholder="أي معلومات مهمة تريد إبلاغ الأستاذ بها..."
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBook(false)}
                  className="flex-1 font-bold py-3 rounded-xl text-sm text-gray-600 transition-all"
                  style={{ border: '2px solid #E5E7EB', background: '#FFFFFF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting || !booking.date || !booking.timeSlot || !booking.studentId}
                  className="flex-1 font-black py-3 rounded-xl text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: '#6B46F0' }}
                  onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
                >
                  {submitting ? 'جاري الحجز...' : 'تأكيد الحجز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
