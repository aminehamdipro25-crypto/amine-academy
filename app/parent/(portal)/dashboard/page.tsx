'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Bell, MessageSquare, FileText, ChevronLeft, Zap, TrendingUp, Clock, Star } from 'lucide-react'
import type { Parent, Student, Program } from '@/lib/types'

interface DashboardData {
  parent: Parent
  children: Student[]
  upcomingAppointment: { date: string; time: string; type?: string } | null
  unreadReports: number
}

const DIAG_EMOJI: Record<string, string> = {
  ADHD: '⚡', AUTISM: '🌈', 'ADHD+AUTISM': '🌟', OTHER: '💙',
}

const DAYS_AR: Record<string, string> = {
  monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
  thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت', sunday: 'الأحد',
}
const TODAY_KEY = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()]

const PLAN_INFO: Record<string, { label: string; color: string; bg: string }> = {
  basic:    { label: 'أساسي',  color: '#6B7280', bg: 'rgba(107,114,128,0.2)' },
  standard: { label: 'متقدم',  color: '#FDE68A', bg: 'rgba(253,230,138,0.25)' },
  premium:  { label: 'مميز ✨', color: '#FDE68A', bg: 'rgba(253,230,138,0.25)' },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'ليلة طيبة'
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'مساء الخير'
  return 'مساء النور'
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [programs, setPrograms] = useState<Record<string, Program>>({})
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(async d => {
        setData(d)
        const progs: Record<string, Program> = {}
        await Promise.all((d.children || []).map(async (c: Student) => {
          try {
            const r = await fetch(`/api/parent/children/${c.id}/program`)
            if (r.ok) { const p = await r.json(); if (p.program) progs[c.id] = p.program }
          } catch { /* no program */ }
        }))
        setPrograms(progs)
      })
      .finally(() => setLoading(false))

    fetch('/api/messages')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUnreadMessages(d.unreadFromAdmin ?? 0) })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" dir="rtl">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)' }}
      >
        <span className="text-3xl">⭐</span>
      </div>
      <p className="font-black text-sm" style={{ color: '#7C5CFC' }}>جاري التحميل...</p>
    </div>
  )

  if (!data?.parent) return (
    <div className="text-center py-20 text-gray-500" dir="rtl">حدث خطأ، حاول مجدداً.</div>
  )

  const { parent, children, upcomingAppointment, unreadReports } = data
  const planCfg = PLAN_INFO[parent.subscriptionPlan] || PLAN_INFO.basic
  const totalPoints = children.reduce((s, c) => s + (c.totalPoints || 0), 0)
  const totalStreak = children.reduce((s, c) => s + (c.streak || 0), 0)

  return (
    <div className="space-y-5" dir="rtl">

      {/* ══ Hero ══ */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #5A32D9 0%, #7C5CFC 45%, #9A7BFD 100%)',
          boxShadow: '0 12px 40px -8px rgba(124,92,252,0.45)',
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-56 h-56 rounded-full -translate-x-20 -translate-y-20 pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(1px)' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full translate-x-12 translate-y-12 pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(1px)' }} />
        <div className="absolute top-6 left-8 w-2 h-2 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute top-12 left-20 w-1 h-1 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.3)' }} />

        <div className="relative p-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-sm font-medium">{greeting()}</p>
              <h1 className="font-black text-2xl text-white mt-0.5 leading-tight">
                {parent.firstName} {parent.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: planCfg.bg, color: planCfg.color }}>
                  {planCfg.label}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  parent.subscriptionStatus === 'active'
                    ? 'bg-green-400/20 text-green-200'
                    : 'bg-amber-400/20 text-amber-200'
                }`}>
                  {parent.subscriptionStatus === 'active' ? '● نشط' :
                   parent.subscriptionStatus === 'pending' ? '◌ قيد التفعيل' : parent.subscriptionStatus}
                </span>
              </div>
            </div>

            {/* Stats bubble */}
            <div className="flex-shrink-0 text-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
              <div className="font-black text-2xl text-white ltr-num">{totalPoints}</div>
              <div className="text-white/60 text-[10px] font-bold">نقطة مجموع</div>
            </div>
          </div>

          {/* Alerts */}
          {unreadReports > 0 && (
            <Link
              href="/parent/reports"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)' }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-bold flex-1">{unreadReports} تقرير جديد ينتظرك</span>
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link
              href="/parent/chat"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)' }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-bold flex-1">رسالة جديدة من الأستاذ أمين</span>
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </Link>
          )}
        </div>
      </div>

      {/* ══ Quick stats row ══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            href: '/parent/appointments',
            icon: <Calendar className="w-5 h-5" />,
            iconBg: '#ECFDF5',
            iconColor: '#10B981',
            value: upcomingAppointment ? upcomingAppointment.date?.slice(5) : '—',
            label: 'موعد قادم',
          },
          {
            href: '/parent/exercises',
            icon: <Zap className="w-5 h-5" />,
            iconBg: '#FFF8E8',
            iconColor: '#F59E0B',
            value: `🔥 ${totalStreak}`,
            label: 'يوم متتالي',
          },
          {
            href: '/parent/progress',
            icon: <TrendingUp className="w-5 h-5" />,
            iconBg: '#F3EEFF',
            iconColor: '#7C5CFC',
            value: String(children.length),
            label: children.length === 1 ? 'طفل مسجل' : 'أطفال',
          },
        ].map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="rounded-3xl p-4 text-center transition-all duration-200 group"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #F0E8FF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px -4px rgba(124,92,252,0.18)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)' }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div className="font-black text-gray-900 text-sm ltr-num">{s.value}</div>
            <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ══ Upcoming appointment banner ══ */}
      {upcomingAppointment && (
        <div
          className="rounded-3xl p-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            border: '1.5px solid #A7F3D0',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-green-900 text-sm">الجلسة القادمة</p>
            <p className="text-green-700 text-xs mt-0.5 ltr-num">{upcomingAppointment.date} — {upcomingAppointment.time}</p>
          </div>
          <Link
            href="/parent/appointments"
            className="text-xs font-black px-4 py-2 rounded-xl flex-shrink-0 whitespace-nowrap transition-all"
            style={{ background: '#10B981', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#059669' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#10B981' }}
          >
            التفاصيل
          </Link>
        </div>
      )}

      {/* ══ Children ══ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-lg">أطفالي</h2>
          <Link
            href="/parent/children"
            className="text-xs font-black flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
            style={{ color: '#6B46F0', background: '#F3EEFF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
          >
            إدارة <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div
            className="rounded-3xl p-10 text-center"
            style={{ background: '#FFFFFF', border: '2px dashed #E8DBFF' }}
          >
            <div className="text-5xl mb-3">👶</div>
            <p className="font-black text-gray-700 mb-1">لم تضف أي طفل بعد</p>
            <p className="text-gray-400 text-sm mb-5">ابدأ بإضافة بيانات طفلك للمتابعة</p>
            <Link
              href="/parent/children"
              className="inline-flex items-center gap-2 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all"
              style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.3)' }}
            >
              إضافة طفل
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => {
              const prog = programs[child.id]
              const todayExs: string[] = (prog?.weeklySchedule as unknown as Record<string,string[]>)?.[TODAY_KEY] || []
              const pct = Math.min(100, Math.round((child.totalPoints / 500) * 100))
              const emoji = DIAG_EMOJI[child.diagnosis] || '🌟'

              return (
                <div
                  key={child.id}
                  className="rounded-3xl overflow-hidden transition-all duration-200"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #F0E8FF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px -4px rgba(124,92,252,0.16)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}
                >
                  {/* Child header */}
                  <div className="p-5 flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #F3EEFF, #E8DBFF)',
                        border: '1.5px solid #D8C5FF',
                      }}
                    >
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-base">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{child.ageGroup} سنة • {child.diagnosis}</div>
                      {/* Progress bar inline */}
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">التقدم نحو الهدف</span>
                          <span className="font-black ltr-num" style={{ color: '#7C5CFC' }}>{pct}٪</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)' }}
                          />
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/parent/children`}
                      className="text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0 transition-all"
                      style={{ background: '#F3EEFF', color: '#6B46F0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
                    >
                      التفاصيل
                    </Link>
                  </div>

                  {/* Stats row */}
                  <div className="px-5 pb-4 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF8E8' }}>
                      <div className="font-black text-amber-700 text-base ltr-num">{child.totalPoints}</div>
                      <div className="text-[10px] text-amber-600 mt-0.5">نقطة</div>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF3E8' }}>
                      <div className="font-black text-orange-700 text-base">🔥 {child.streak}</div>
                      <div className="text-[10px] text-orange-600 mt-0.5">متتالي</div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-center"
                      style={{ background: todayExs.length > 0 ? '#F0FFF4' : '#F9FAFB' }}
                    >
                      <div
                        className="font-black text-base ltr-num"
                        style={{ color: todayExs.length > 0 ? '#15803D' : '#9CA3AF' }}
                      >
                        {todayExs.length}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: todayExs.length > 0 ? '#16A34A' : '#9CA3AF' }}>
                        تمارين اليوم
                      </div>
                    </div>
                  </div>

                  {/* Today's exercises */}
                  {todayExs.length > 0 && (
                    <div className="px-5 pb-4">
                      <div
                        className="rounded-2xl p-3"
                        style={{ background: 'linear-gradient(135deg, #F0FFF4, #ECFDF5)', border: '1.5px solid #D1FAE5' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-green-800">
                            🗓 تمارين {DAYS_AR[TODAY_KEY]} ({todayExs.length})
                          </span>
                          <Link
                            href="/parent/exercises"
                            className="text-xs font-black px-2.5 py-1 rounded-lg transition-all"
                            style={{ background: '#10B981', color: '#FFFFFF' }}
                          >
                            ابدأ الآن
                          </Link>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {todayExs.slice(0, 4).map((_, i) => (
                            <span
                              key={i}
                              className="text-xs font-bold px-2.5 py-0.5 rounded-full ltr-num"
                              style={{ background: '#BBF7D0', color: '#15803D' }}
                            >
                              تمرين {i + 1}
                            </span>
                          ))}
                          {todayExs.length > 4 && (
                            <span className="text-xs text-green-600">+{todayExs.length - 4} أخرى</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Quick action cards ══ */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/parent/exercises"
          className="rounded-3xl p-5 text-white transition-all duration-200 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6B46F0 0%, #9A7BFD 100%)',
            boxShadow: '0 8px 24px -4px rgba(124,92,252,0.4)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px -4px rgba(124,92,252,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px -4px rgba(124,92,252,0.4)' }}
        >
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full -translate-x-8 -translate-y-8 pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-3xl mb-2 relative">🎮</div>
          <div className="font-black text-base relative">ألعاب تفاعلية</div>
          <div className="text-white/70 text-xs mt-1 relative">العب مع طفلك الآن</div>
        </Link>
        <Link
          href="/parent/appointments"
          className="rounded-3xl p-5 text-white transition-all duration-200 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0EA58A 0%, #2ABFA3 100%)',
            boxShadow: '0 8px 24px -4px rgba(14,165,138,0.4)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px -4px rgba(14,165,138,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px -4px rgba(14,165,138,0.4)' }}
        >
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full translate-x-8 translate-y-8 pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-3xl mb-2 relative">📅</div>
          <div className="font-black text-base relative">احجز جلسة</div>
          <div className="text-white/70 text-xs mt-1 relative">6 أنواع متاحة</div>
        </Link>
      </div>

      {/* ══ Tips card ══ */}
      <div
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, #FFF8E8, #FFFBF0)',
          border: '1.5px solid #FDE68A',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#FFBA44,#FF8C65)', boxShadow: '0 4px 12px rgba(255,186,68,0.3)' }}
        >
          💡
        </div>
        <div className="flex-1">
          <p className="font-black text-amber-900 text-sm">نصيحة اليوم</p>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed">
            الثبات في التمارين اليومية يُحقق نتائج أفضل بكثير من الجلسات المكثفة المتفرقة.
          </p>
        </div>
      </div>
    </div>
  )
}
