'use client'
import { useEffect, useState } from 'react'
import type { Appointment } from '@/lib/types'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const TYPE_LABEL: Record<string, string> = {
  assessment: 'تقييمية',
  followup:   'متابعة',
  emergency:  'طارئة',
}

const TYPE_COLOR: Record<string, string> = {
  assessment: 'bg-[#EDE9FF] text-brand-700',
  followup:   'bg-[#F0FFF9] text-teal-700',
  emergency:  'bg-red-50 text-red-600',
}

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
    <div className="flex flex-col items-center justify-center py-20" dir="rtl">
      <div className="text-5xl animate-bounce-soft mb-4">📅</div>
      <p className="text-brand-600 font-black text-lg">جاري التحميل...</p>
    </div>
  )

  const upcoming = appointments.filter(a => a.status === 'scheduled')

  // Next session is the first upcoming appointment
  const nextAppt = upcoming[0]
  const restAppts = upcoming.slice(1)

  // Compute days until next session
  function daysUntil(dateStr: string): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-black text-2xl text-gray-900">جدولي 📅</h1>
        <p className="text-gray-500 text-sm mt-1">جلساتك مع الأستاذ أمين</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#E8DBFF] p-10 text-center">
          <div className="text-5xl mb-3">😊</div>
          <p className="font-black text-gray-700">لا توجد جلسات مجدولة</p>
          <p className="text-gray-400 text-sm mt-1">سيحدد لك ولي أمرك الموعد القادم</p>
        </div>
      ) : (
        <>
          {/* Next session — big highlighted card */}
          {nextAppt && (() => {
            const d = new Date(nextAppt.date)
            const day = DAYS_AR[d.getDay()]
            const isToday = new Date().toDateString() === d.toDateString()
            const days = daysUntil(nextAppt.date)
            return (
              <div className="bg-gradient-to-l from-brand-500 to-[#9A7BFD] rounded-3xl p-5 text-white shadow-brand relative overflow-hidden">
                {/* Decorative circle */}
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full">
                      {isToday ? '⚡ اليوم!' : 'الجلسة القادمة'}
                    </span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full bg-white/20 text-white`}>
                      جلسة {TYPE_LABEL[nextAppt.type] || nextAppt.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 rounded-2xl p-3 text-center min-w-[60px]">
                      <div className="font-black text-2xl ltr-num leading-none">{d.getDate()}</div>
                      <div className="text-white/80 text-xs mt-0.5">{day}</div>
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-tight">
                        {isToday ? 'الجلسة الآن!' : `بعد ${days > 0 ? `${days} يوم` : 'اليوم'}`}
                      </h3>
                      <p className="text-white/80 text-sm ltr-num mt-0.5">⏰ {nextAppt.timeSlot}</p>
                      <p className="text-white/70 text-xs mt-0.5">👨‍⚕️ الأستاذ أمين</p>
                    </div>
                  </div>

                  {nextAppt.meetingUrl && (
                    <a
                      href={nextAppt.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white text-brand-600 text-center font-black py-3 rounded-2xl text-sm hover:bg-white/90 transition-colors active:scale-95"
                    >
                      ▶ ادخل الجلسة
                    </a>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Remaining sessions */}
          {restAppts.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-black text-gray-700 text-sm">جلسات قادمة</h2>
              {restAppts.map(appt => {
                const d = new Date(appt.date)
                const day = DAYS_AR[d.getDay()]
                const isToday = new Date().toDateString() === d.toDateString()
                return (
                  <div key={appt.id} className="bg-white rounded-3xl border border-[#F0E8FF] p-5 shadow-card">
                    {isToday && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                        <span className="text-brand-700 font-black text-xs">اليوم!</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-50 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border border-[#E8DBFF]">
                        <span className="text-brand-700 font-black text-lg ltr-num leading-none">{d.getDate()}</span>
                        <span className="text-brand-400 text-[10px] font-bold mt-0.5">{day}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-gray-900 text-base">
                            جلسة {TYPE_LABEL[appt.type] || appt.type}
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${TYPE_COLOR[appt.type] || 'bg-gray-100 text-gray-500'}`}>
                            {TYPE_LABEL[appt.type]}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm ltr-num mt-0.5">⏰ {appt.timeSlot}</p>
                        <p className="text-gray-400 text-xs mt-0.5">👨‍⚕️ الأستاذ أمين</p>
                      </div>
                    </div>
                    {appt.meetingUrl && (
                      <a
                        href={appt.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block bg-brand-600 text-white text-center font-black py-3 rounded-2xl hover:bg-brand-700 transition-colors text-sm active:scale-95"
                      >
                        ▶ ادخل الجلسة
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Motivational footer card */}
      <div className="bg-gradient-to-l from-[#FFBA44] to-[#FF8C65] rounded-3xl p-5 text-white text-center shadow-warm">
        <div className="text-3xl mb-2">🌟</div>
        <p className="font-black text-lg">كل جلسة = نقاط + تطور!</p>
        <p className="text-white/80 text-sm mt-1">الأستاذ أمين يتطلع لرؤيتك</p>
      </div>
    </div>
  )
}
