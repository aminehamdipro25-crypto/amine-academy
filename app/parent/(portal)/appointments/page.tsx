'use client'
import { useEffect, useState } from 'react'
import { Calendar, Clock, Video, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Appointment, Student } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  assessment: 'جلسة تقييمية',
  followup: 'جلسة متابعة',
  emergency: 'استشارة طارئة',
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:  { label: 'مُجدولة',  color: 'bg-blue-100 text-blue-700',   icon: Clock },
  completed:  { label: 'منتهية',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled:  { label: 'ملغاة',    color: 'bg-red-100 text-red-700',     icon: XCircle },
  'no-show':  { label: 'غياب',     color: 'bg-gray-100 text-gray-500',   icon: AlertCircle },
}

const TIME_SLOTS = [
  '09:00-09:45', '10:00-10:45', '11:00-11:45',
  '14:00-14:45', '15:00-15:45', '16:00-16:45', '17:00-17:45',
]

function isSessionLive(date: string, timeSlot: string): boolean {
  const [startH, startM] = timeSlot.split('-')[0].split(':').map(Number)
  const [endH, endM] = timeSlot.split('-')[1].split(':').map(Number)
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
  const [showBook, setShowBook] = useState(false)
  const [booking, setBooking] = useState({ studentId: '', date: '', timeSlot: '', type: 'followup', notes: '' })
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
    <div className="flex items-center justify-center py-20">
      <div className="text-brand-600 text-4xl animate-pulse">📅</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">مواعيدي</h1>
          <p className="text-gray-500 text-sm mt-0.5">جلساتك القادمة والسابقة</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          حجز جلسة
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">تم تأكيد حجزك بنجاح!</p>
            <p className="text-green-700 text-xs mt-0.5">ستجد رابط الجلسة في تفاصيل الموعد. ستصلك أيضاً رسالة تأكيد على بريدك.</p>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          الجلسات القادمة
          {upcoming.length > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">{upcoming.length}</span>
          )}
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">لا توجد جلسات مجدولة</p>
            <button onClick={() => setShowBook(true)} className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-700 transition-colors">
              <Plus className="w-4 h-4" />
              احجز جلسة الآن
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(appt => {
              const live = isSessionLive(appt.date, appt.timeSlot)
              return (
                <div key={appt.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${live ? 'border-green-400 shadow-lg shadow-green-100' : 'border-gray-100'}`}>
                  {live && (
                    <div className="flex items-center gap-2 mb-3 bg-green-50 rounded-xl px-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700 font-black text-sm">الجلسة جارية الآن!</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-black text-gray-900">{TYPE_LABELS[appt.type] || appt.type}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CFG[appt.status]?.color}`}>
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
                        className={`flex items-center gap-2 font-black px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0 ${
                          live
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse'
                            : 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        {live ? 'انضم الآن' : 'رابط الجلسة'}
                      </a>
                    )}
                  </div>
                  {appt.meetingUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
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

      {/* Past appointments */}
      {past.length > 0 && (
        <div>
          <h2 className="font-black text-gray-900 mb-3 text-sm text-gray-600">الجلسات السابقة</h2>
          <div className="space-y-2">
            {past.map(appt => (
              <div key={appt.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-700 text-sm">{TYPE_LABELS[appt.type]}</span>
                  <div className="text-gray-400 text-xs mt-0.5 ltr-num">{appt.date} • {appt.timeSlot}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_CFG[appt.status]?.color}`}>
                  {STATUS_CFG[appt.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking modal */}
      {showBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowBook(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h3 className="font-black text-xl text-gray-900 mb-5">حجز جلسة جديدة</h3>
            <form onSubmit={handleBook} className="space-y-4">
              {children.length > 1 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">الطفل</label>
                  <select
                    value={booking.studentId}
                    onChange={e => setBooking(b => ({ ...b, studentId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">نوع الجلسة</label>
                <select
                  value={booking.type}
                  onChange={e => setBooking(b => ({ ...b, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="assessment">جلسة تقييمية (أول مرة)</option>
                  <option value="followup">جلسة متابعة أسبوعية</option>
                  <option value="emergency">استشارة طارئة</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={booking.date}
                  onChange={e => setBooking(b => ({ ...b, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">الوقت المفضل</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBooking(b => ({ ...b, timeSlot: slot }))}
                      className={`py-2 text-xs font-bold rounded-xl border-2 transition-colors ltr-num ${
                        booking.timeSlot === slot
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {slot.split('-')[0]}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBook(false)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting || !booking.date || !booking.timeSlot || !booking.studentId}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm transition-colors"
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
