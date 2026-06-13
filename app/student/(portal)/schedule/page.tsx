'use client'
import { useEffect, useState } from 'react'
import type { Appointment } from '@/lib/types'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const TYPE_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  assessment:   { label: 'تقييمية',  bg: '#EDE9FF', color: '#6B46F0', icon: '📊' },
  followup:     { label: 'متابعة',   bg: '#ECFDF5', color: '#059669', icon: '🔄' },
  emergency:    { label: 'طارئة',    bg: '#FEF2F2', color: '#DC2626', icon: '🚨' },
  training:     { label: 'تدريبية',  bg: '#F0FFF9', color: '#0D9488', icon: '💪' },
  consultation: { label: 'استشارة',  bg: '#FFF8E8', color: '#D97706', icon: '💬' },
  review:       { label: 'مراجعة',   bg: '#F3EEFF', color: '#7C5CFC', icon: '📋' },
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
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
    <div className="flex flex-col items-center justify-center py-24" dir="rtl">
      <div className="text-5xl animate-bounce-soft mb-4">📅</div>
      <p className="font-black text-lg" style={{ color: '#7C5CFC' }}>جاري التحميل...</p>
    </div>
  )

  const upcoming = appointments.filter(a => a.status === 'scheduled')
  const nextAppt = upcoming[0]
  const restAppts = upcoming.slice(1)

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Header ── */}
      <div className="text-center pt-1 pb-1">
        <h1 className="font-black text-2xl text-gray-900">جدولي 📅</h1>
        <p className="text-gray-500 text-sm mt-1">جلساتك مع الأستاذ أمين</p>
      </div>

      {upcoming.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center"
          style={{ background: '#FFFFFF', border: '2px dashed #D3BBFF' }}
        >
          <div className="text-5xl mb-3">😊</div>
          <p className="font-black text-gray-700">لا توجد جلسات مجدولة</p>
          <p className="text-gray-400 text-sm mt-1">سيحدد لك ولي أمرك الموعد القادم</p>
        </div>
      ) : (
        <>
          {/* ── Next session hero card ── */}
          {nextAppt && (() => {
            const d = new Date(nextAppt.date)
            const day = DAYS_AR[d.getDay()]
            const isToday = new Date().toDateString() === d.toDateString()
            const days = daysUntil(nextAppt.date)
            const typeCfg = TYPE_CFG[nextAppt.type] || { label: nextAppt.type, bg: '#F3EEFF', color: '#7C5CFC', icon: '📅' }

            return (
              <div
                className="rounded-3xl p-5 text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6B46F0 0%, #7C5CFC 60%, #9A7BFD 100%)',
                  boxShadow: '0 8px 24px -4px rgba(124,92,252,0.35)',
                }}
              >
                {/* Decorative blobs */}
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(16px)' }} />
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full pointer-events-none" style={{ background: 'rgba(154,123,253,0.3)', filter: 'blur(12px)' }} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs font-black px-3 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      {isToday ? '⚡ اليوم!' : '🗓 الجلسة القادمة'}
                    </span>
                    <span
                      className="text-xs font-black px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      {typeCfg.icon} {typeCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="rounded-2xl p-3 text-center min-w-[60px]"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      <div className="font-black text-2xl ltr-num leading-none">{d.getDate()}</div>
                      <div className="text-white/80 text-xs mt-0.5">{day}</div>
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-tight">
                        {isToday
                          ? 'الجلسة الآن! 🎉'
                          : days === 0 ? 'اليوم!'
                          : days === 1 ? 'غداً!'
                          : `بعد ${days} أيام`}
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
                      className="block text-center font-black py-3 rounded-2xl text-sm transition-all active:scale-95 hover:opacity-90"
                      style={{ background: '#FFFFFF', color: '#7C5CFC' }}
                    >
                      ▶ ادخل الجلسة
                    </a>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── Rest of sessions ── */}
          {restAppts.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-black text-gray-700 text-sm">جلسات قادمة</h2>
              {restAppts.map(appt => {
                const d = new Date(appt.date)
                const day = DAYS_AR[d.getDay()]
                const isToday = new Date().toDateString() === d.toDateString()
                const typeCfg = TYPE_CFG[appt.type] || { label: appt.type, bg: '#F3EEFF', color: '#7C5CFC', icon: '📅' }

                return (
                  <div
                    key={appt.id}
                    className="rounded-3xl p-5 transition-all duration-200"
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #F0E8FF',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={el => { (el.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (el.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(124,92,252,0.12)' }}
                    onMouseLeave={el => { (el.currentTarget as HTMLDivElement).style.transform = ''; (el.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                  >
                    {isToday && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7C5CFC' }} />
                        <span className="font-black text-xs" style={{ color: '#7C5CFC' }}>اليوم!</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                        style={{ background: '#F3EEFF', border: '1.5px solid #E8DBFF' }}
                      >
                        <span className="font-black text-lg ltr-num leading-none" style={{ color: '#7C5CFC' }}>{d.getDate()}</span>
                        <span className="font-bold text-[10px] mt-0.5" style={{ color: '#9A7BFD' }}>{day}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-gray-900 text-sm">
                            {typeCfg.icon} جلسة {typeCfg.label}
                          </h3>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: typeCfg.bg, color: typeCfg.color }}
                          >
                            {typeCfg.label}
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
                        className="mt-4 block text-center font-black py-3 rounded-2xl text-sm transition-all active:scale-95 hover:opacity-90"
                        style={{
                          background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 8px rgba(124,92,252,0.25)',
                        }}
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

      {/* ── Motivational footer ── */}
      <div
        className="rounded-3xl p-5 text-white text-center"
        style={{
          background: 'linear-gradient(to left, #FFBA44, #FF8C65)',
          boxShadow: '0 8px 24px -4px rgba(255,140,101,0.3)',
        }}
      >
        <div className="text-3xl mb-2">🌟</div>
        <p className="font-black text-lg">كل جلسة = نقاط + تطور!</p>
        <p className="text-white/80 text-sm mt-1">الأستاذ أمين يتطلع لرؤيتك</p>
      </div>
    </div>
  )
}
