'use client'
import { useEffect, useState } from 'react'
import type { Appointment } from '@/lib/types'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function StudentSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/appointments')
      .then(r => r.json())
      .then(d => setAppointments(d.appointments || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl animate-bounce mb-4">📅</div>
      <p className="text-brand-600 font-bold">جاري التحميل...</p>
    </div>
  )

  const upcoming = appointments.filter(a => a.status === 'scheduled')

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <h1 className="font-black text-2xl text-gray-900">جدولي 📅</h1>
        <p className="text-gray-500 text-sm mt-1">جلساتك مع الأستاذ أمين</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
          <div className="text-5xl mb-3">😊</div>
          <p className="font-bold text-gray-700">لا توجد جلسات مجدولة</p>
          <p className="text-gray-400 text-sm mt-1">سيحدد لك ولي أمرك الموعد القادم</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map(appt => {
            const d = new Date(appt.date)
            const day = DAYS_AR[d.getDay()]
            const isToday = new Date().toDateString() === d.toDateString()
            return (
              <div key={appt.id} className={`bg-white rounded-3xl border-2 p-5 ${isToday ? 'border-brand-400' : 'border-gray-100'}`}>
                {isToday && (
                  <div className="bg-brand-50 rounded-xl px-3 py-1.5 flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    <span className="text-brand-700 font-black text-sm">اليوم!</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-lg ltr-num">{d.getDate()}</span>
                    <span className="text-brand-500 text-xs">{day}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">
                      {appt.type === 'assessment' ? 'جلسة تقييمية' : appt.type === 'followup' ? 'جلسة متابعة' : 'جلسة طارئة'}
                    </h3>
                    <p className="text-gray-500 text-sm ltr-num mt-0.5">⏰ {appt.timeSlot}</p>
                    <p className="text-gray-400 text-xs mt-1">👨‍⚕️ الأستاذ أمين</p>
                  </div>
                </div>
                {appt.meetingUrl && (
                  <a
                    href={appt.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block bg-brand-600 text-white text-center font-black py-3 rounded-2xl hover:bg-brand-700 transition-colors"
                  >
                    ▶ ادخل الجلسة
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Fun motivation */}
      <div className="bg-gradient-to-l from-amber-400 to-orange-400 rounded-2xl p-5 text-white text-center">
        <div className="text-3xl mb-2">🌟</div>
        <p className="font-black text-lg">كل جلسة = نقاط + تطور!</p>
        <p className="text-white/80 text-sm mt-1">الأستاذ أمين يتطلع لرؤيتك</p>
      </div>
    </div>
  )
}
