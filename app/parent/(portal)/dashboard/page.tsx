'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Bell, ArrowLeft, MessageSquare, Dumbbell, FileText, ChevronLeft } from 'lucide-react'
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
          } catch { /* no program yet */ }
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
    <div className="flex items-center justify-center py-20">
      <div className="text-5xl animate-pulse">⭐</div>
    </div>
  )
  if (!data?.parent) return (
    <div className="text-center py-20 text-gray-500">حدث خطأ، حاول مجدداً.</div>
  )

  const { parent, children, upcomingAppointment, unreadReports } = data
  const planLabel = PLAN_INFO[parent.subscriptionPlan]?.label || 'أساسي'

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-bl from-brand-600 via-brand-500 to-[#9A7BFD] rounded-3xl p-6 text-white overflow-hidden">
        {/* Decorative blurred circles */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-white/10 rounded-full translate-x-10 translate-y-10 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-6 -translate-y-6 pointer-events-none" />
        <div className="relative">
          <p className="text-white/70 text-sm">{greeting()}،</p>
          <h1 className="font-black text-2xl mt-0.5">{parent.firstName} {parent.lastName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">{planLabel}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              parent.subscriptionStatus === 'active'  ? 'bg-green-400/30 text-green-100' :
              parent.subscriptionStatus === 'pending' ? 'bg-yellow-400/30 text-yellow-100' :
              'bg-red-400/30 text-red-100'
            }`}>
              {parent.subscriptionStatus === 'active' ? '● نشط' :
               parent.subscriptionStatus === 'pending' ? '◌ قيد التفعيل' : parent.subscriptionStatus}
            </span>
          </div>
          {unreadReports > 0 && (
            <Link href="/parent/reports"
              className="mt-3 flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-2 transition-colors">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{unreadReports} تقرير جديد</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link href="/parent/chat"
              className="mt-2 flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-2 transition-colors">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">رسالة جديدة من الأستاذ</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/parent/appointments"
          className="bg-white rounded-3xl p-3.5 border border-[#F0E8FF] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] text-center hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center mx-auto mb-1.5">
            <Calendar className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-black text-gray-900 text-sm">
            {upcomingAppointment ? upcomingAppointment.date?.slice(5) : '—'}
          </div>
          <div className="text-gray-400 text-[10px]">موعد قادم</div>
        </Link>
        <Link href="/parent/reports"
          className="bg-white rounded-3xl p-3.5 border border-[#F0E8FF] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] text-center hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all duration-200">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-1.5">
            <FileText className="w-4 h-4 text-brand-500" />
          </div>
          <div className={`font-black text-sm ${unreadReports > 0 ? 'text-brand-500' : 'text-gray-900'} ltr-num`}>
            {unreadReports > 0 ? `${unreadReports} ج` : unreadReports}
          </div>
          <div className="text-gray-400 text-[10px]">تقارير</div>
        </Link>
        <Link href="/parent/exercises"
          className="bg-white rounded-3xl p-3.5 border border-[#F0E8FF] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] text-center hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] flex items-center justify-center mx-auto mb-1.5">
            <span className="text-lg leading-none">🎮</span>
          </div>
          <div className="font-black text-gray-900 text-sm">ألعاب</div>
          <div className="text-gray-400 text-[10px]">تفاعلية</div>
        </Link>
      </div>

      {/* ── Upcoming appointment ── */}
      {upcomingAppointment && (
        <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-green-900 text-sm">الجلسة القادمة</p>
            <p className="text-green-700 text-xs ltr-num">{upcomingAppointment.date} — {upcomingAppointment.time}</p>
          </div>
          <Link href="/parent/appointments"
            className="text-xs text-green-700 font-bold bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex-shrink-0 whitespace-nowrap">
            التفاصيل
          </Link>
        </div>
      )}

      {/* ── Children cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900">أطفالي</h2>
          <Link href="/parent/children" className="text-brand-600 text-xs font-bold flex items-center gap-1 hover:underline">
            إدارة <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#E8DBFF] p-8 text-center">
            <div className="text-4xl mb-3">👶</div>
            <p className="text-gray-500 text-sm mb-4">لم تضف أي طفل بعد</p>
            <Link href="/parent/children"
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-brand-700 transition-colors">
              إضافة طفل
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => {
              const prog  = programs[child.id]
              const todayExs: string[] = (prog?.weeklySchedule as unknown as Record<string,string[]>)?.[TODAY_KEY] || []
              const pct = Math.min(100, Math.round((child.totalPoints / 500) * 100))

              return (
                <div key={child.id} className="bg-white rounded-3xl border border-[#F0E8FF] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                      {DIAG_EMOJI[child.diagnosis] || child.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-500 text-xs">{child.ageGroup} سنة • {child.diagnosis}</div>
                    </div>
                    <Link href={`/parent/children/${child.id}`}
                      className="text-xs text-brand-600 font-bold bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors flex-shrink-0">
                      التفاصيل
                    </Link>
                  </div>

                  <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                    <div className="bg-[#FFF8E8] rounded-2xl p-3 text-center">
                      <div className="font-black text-amber-700 text-base ltr-num">{child.totalPoints}</div>
                      <div className="text-[10px] text-amber-600">نقطة</div>
                    </div>
                    <div className="bg-[#FFF3E8] rounded-2xl p-3 text-center">
                      <div className="font-black text-orange-700 text-base">🔥 {child.streak}</div>
                      <div className="text-[10px] text-orange-600">متتالي</div>
                    </div>
                    <div className={`rounded-2xl p-3 text-center ${todayExs.length > 0 ? 'bg-[#F0FFF4]' : 'bg-[#FFF8F0]'}`}>
                      <div className={`font-black text-base ltr-num ${todayExs.length > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {todayExs.length}
                      </div>
                      <div className={`text-[10px] ${todayExs.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>تمارين اليوم</div>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-400">التقدم</span>
                      <span className="font-bold text-brand-600 ltr-num">{pct}٪</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-brand-500 to-[#9A7BFD] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {todayExs.length > 0 && (
                    <div className="bg-[#F0FFF4] border-t border-[#D1FAE5] px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-green-800">🗓 تمارين {DAYS_AR[TODAY_KEY]}</span>
                        <Link href="/parent/exercises"
                          className="text-xs text-green-700 font-bold hover:underline">ابدأ الآن →</Link>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {todayExs.slice(0, 4).map((_, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full ltr-num">
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
        <Link href="/parent/exercises"
          className="bg-gradient-to-bl from-brand-500 to-[#9A7BFD] rounded-3xl p-4 text-white hover:opacity-95 hover:-translate-y-1 transition-all duration-200">
          <div className="text-2xl mb-1">🎮</div>
          <div className="font-black text-sm">ألعاب تفاعلية</div>
          <div className="text-white/70 text-xs mt-0.5">العب مع طفلك الآن</div>
        </Link>
        <Link href="/parent/appointments"
          className="bg-gradient-to-bl from-[#10B981] to-[#2ABFA3] rounded-3xl p-4 text-white hover:opacity-95 hover:-translate-y-1 transition-all duration-200">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-black text-sm">احجز جلسة</div>
          <div className="text-white/70 text-xs mt-0.5">6 أنواع متاحة</div>
        </Link>
      </div>
    </div>
  )
}
