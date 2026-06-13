'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Bell, ArrowLeft, MessageSquare, FileText, ChevronLeft } from 'lucide-react'
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

const PLAN_INFO: Record<string, { label: string }> = {
  basic: { label: 'أساسي' }, standard: { label: 'متقدم' }, premium: { label: 'مميز' },
}

function greeting() {
  const h = new Date().getHours()
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
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-5xl animate-pulse">⭐</div>
    </div>
  )
  if (!data?.parent) return (
    <div className="text-center py-20 text-gray-500" dir="rtl">حدث خطأ، حاول مجدداً.</div>
  )

  const { parent, children, upcomingAppointment, unreadReports } = data
  const planLabel = PLAN_INFO[parent.subscriptionPlan]?.label || 'أساسي'

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Hero ── */}
      <div
        className="relative rounded-3xl p-6 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(225deg, #6B46F0 0%, #7C5CFC 50%, #9A7BFD 100%)',
          boxShadow: '0 8px 24px -4px rgba(124,92,252,0.35)',
        }}
      >
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full -translate-x-16 -translate-y-16 blur-2xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full translate-x-10 translate-y-10 blur-2xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="relative">
          <p className="text-white/70 text-sm">{greeting()}،</p>
          <h1 className="font-black text-2xl mt-0.5">{parent.firstName} {parent.lastName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>{planLabel}</span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={
                parent.subscriptionStatus === 'active'  ? { background: 'rgba(74,222,128,0.3)', color: '#D1FAE5' } :
                parent.subscriptionStatus === 'pending' ? { background: 'rgba(251,191,36,0.3)', color: '#FEF3C7' } :
                { background: 'rgba(248,113,113,0.3)', color: '#FEE2E2' }
              }
            >
              {parent.subscriptionStatus === 'active' ? '● نشط' :
               parent.subscriptionStatus === 'pending' ? '◌ قيد التفعيل' : parent.subscriptionStatus}
            </span>
          </div>
          {unreadReports > 0 && (
            <Link
              href="/parent/reports"
              className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.15)' }}
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{unreadReports} تقرير جديد</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link
              href="/parent/chat"
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.15)' }}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">رسالة جديدة من الأستاذ</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/parent/appointments"
          className="rounded-3xl p-3.5 text-center transition-all duration-200"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px -4px rgba(124,92,252,0.16)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: '#ECFDF5' }}>
            <Calendar className="w-4 h-4" style={{ color: '#10B981' }} />
          </div>
          <div className="font-black text-gray-900 text-sm ltr-num">
            {upcomingAppointment ? upcomingAppointment.date?.slice(5) : '—'}
          </div>
          <div className="text-gray-400 text-[10px]">موعد قادم</div>
        </Link>

        <Link
          href="/parent/reports"
          className="rounded-3xl p-3.5 text-center transition-all duration-200"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px -4px rgba(124,92,252,0.16)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: '#F3EEFF' }}>
            <FileText className="w-4 h-4" style={{ color: '#7C5CFC' }} />
          </div>
          <div className="font-black text-sm ltr-num" style={{ color: unreadReports > 0 ? '#7C5CFC' : '#111827' }}>
            {unreadReports > 0 ? `${unreadReports} ج` : String(unreadReports)}
          </div>
          <div className="text-gray-400 text-[10px]">تقارير</div>
        </Link>

        <Link
          href="/parent/exercises"
          className="rounded-3xl p-3.5 text-center transition-all duration-200"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px -4px rgba(124,92,252,0.16)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: '#FFF3E8' }}>
            <span className="text-lg leading-none">🎮</span>
          </div>
          <div className="font-black text-gray-900 text-sm">ألعاب</div>
          <div className="text-gray-400 text-[10px]">تفاعلية</div>
        </Link>
      </div>

      {/* ── Upcoming appointment ── */}
      {upcomingAppointment && (
        <div
          className="rounded-3xl p-4 flex items-center gap-3"
          style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#10B981' }}
          >
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-green-900 text-sm">الجلسة القادمة</p>
            <p className="text-green-700 text-xs ltr-num">{upcomingAppointment.date} — {upcomingAppointment.time}</p>
          </div>
          <Link
            href="/parent/appointments"
            className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 whitespace-nowrap transition-all"
            style={{ background: '#BBF7D0', color: '#15803D' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#86EFAC' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#BBF7D0' }}
          >
            التفاصيل
          </Link>
        </div>
      )}

      {/* ── Children cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900">أطفالي</h2>
          <Link
            href="/parent/children"
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: '#6B46F0' }}
          >
            إدارة <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: '#FFFFFF', border: '2px dashed #E8DBFF' }}
          >
            <div className="text-4xl mb-3">👶</div>
            <p className="text-gray-500 text-sm mb-4">لم تضف أي طفل بعد</p>
            <Link
              href="/parent/children"
              className="inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-all"
              style={{ background: '#6B46F0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#5A32D9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#6B46F0' }}
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

              return (
                <div
                  key={child.id}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #9A7BFD, #6B46F0)' }}
                    >
                      {DIAG_EMOJI[child.diagnosis] || child.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-500 text-xs">{child.ageGroup} سنة • {child.diagnosis}</div>
                    </div>
                    <Link
                      href={`/parent/children/${child.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
                      style={{ background: '#F3EEFF', color: '#6B46F0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
                    >
                      التفاصيل
                    </Link>
                  </div>

                  <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF8E8' }}>
                      <div className="font-black text-amber-700 text-base ltr-num">{child.totalPoints}</div>
                      <div className="text-[10px] text-amber-600">نقطة</div>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF3E8' }}>
                      <div className="font-black text-orange-700 text-base">🔥 {child.streak}</div>
                      <div className="text-[10px] text-orange-600">متتالي</div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-center"
                      style={{ background: todayExs.length > 0 ? '#F0FFF4' : '#F9FAFB' }}
                    >
                      <div className="font-black text-base ltr-num" style={{ color: todayExs.length > 0 ? '#15803D' : '#9CA3AF' }}>
                        {todayExs.length}
                      </div>
                      <div className="text-[10px]" style={{ color: todayExs.length > 0 ? '#16A34A' : '#9CA3AF' }}>
                        تمارين اليوم
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-400">التقدم</span>
                      <span className="font-bold ltr-num" style={{ color: '#6B46F0' }}>{pct}٪</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)' }}
                      />
                    </div>
                  </div>

                  {todayExs.length > 0 && (
                    <div
                      className="px-4 py-3"
                      style={{ background: '#F0FFF4', borderTop: '1.5px solid #D1FAE5' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-green-800">🗓 تمارين {DAYS_AR[TODAY_KEY]}</span>
                        <Link href="/parent/exercises" className="text-xs text-green-700 font-bold hover:underline">ابدأ الآن →</Link>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {todayExs.slice(0, 4).map((_, i) => (
                          <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full ltr-num" style={{ background: '#BBF7D0', color: '#15803D' }}>
                            تمرين {i + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/parent/exercises"
          className="rounded-3xl p-4 text-white transition-all duration-200"
          style={{ background: 'linear-gradient(225deg, #7C5CFC, #9A7BFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.transform = '' }}
        >
          <div className="text-2xl mb-1">🎮</div>
          <div className="font-black text-sm">ألعاب تفاعلية</div>
          <div className="text-white/70 text-xs mt-0.5">العب مع طفلك الآن</div>
        </Link>
        <Link
          href="/parent/appointments"
          className="rounded-3xl p-4 text-white transition-all duration-200"
          style={{ background: 'linear-gradient(225deg, #10B981, #2ABFA3)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.transform = '' }}
        >
          <div className="text-2xl mb-1">📅</div>
          <div className="font-black text-sm">احجز جلسة</div>
          <div className="text-white/70 text-xs mt-0.5">6 أنواع متاحة</div>
        </Link>
      </div>
    </div>
  )
}
