'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Student, Exercise } from '@/lib/types'

interface StudentData {
  student: Student
  todayExercises: Exercise[]
  completedToday: number
  completedTodayIds: string[]
}

const DOMAIN_COLORS: Record<string, string> = {
  motor:   'bg-[#FF8C65]',
  focus:   'bg-[#3B9EFF]',
  balance: 'bg-[#2ABFA3]',
  energy:  'bg-[#FFBA44]',
  sensory: 'bg-[#FF6B6B]',
  social:  'bg-[#7C5CFC]',
}

const CAT_EMOJI: Record<string, string> = {
  motor: '🏃', focus: '🎯', balance: '🌊', energy: '⚡', sensory: '🌈', social: '🤝',
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Cache name & streak for layout header
        if (d?.student) {
          try {
            localStorage.setItem('data-student-name', d.student.firstName)
            localStorage.setItem('data-student-streak', String(d.student.streak))
          } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4" dir="rtl">
      <div className="text-6xl animate-bounce-soft">⏳</div>
      <p className="text-brand-600 font-black text-lg">جاري التحميل...</p>
    </div>
  )

  const { student, todayExercises, completedTodayIds } = data ?? {
    student: null, todayExercises: [], completedTodayIds: [],
  }
  // Use Redis-backed count (completedTodayIds length) for accurate display
  const completedToday = completedTodayIds?.length ?? 0

  if (!student) return (
    <div className="text-center py-20" dir="rtl">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-gray-500 font-bold">حدث خطأ، حاول مجدداً</p>
    </div>
  )

  const progressPct = todayExercises.length > 0
    ? Math.round((completedToday / todayExercises.length) * 100)
    : 0

  // Days until next session (placeholder — just shows streak info)
  const nextSessionDays = 2

  return (
    <div className="space-y-5" dir="rtl">

      {/* Hero greeting */}
      <div className="bg-gradient-to-l from-brand-600 via-brand-500 to-[#9A7BFD] rounded-3xl p-6 text-white mb-2 relative overflow-hidden shadow-brand">
        {/* Decorative blurred circles */}
        <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 left-1/2 w-24 h-24 rounded-full bg-[#9A7BFD]/30 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-4xl mb-2 animate-float inline-block">👋</div>
          <h1 className="font-black text-2xl leading-tight">مرحباً {student.firstName}!</h1>
          <p className="text-white/80 text-sm mt-1">جاهز للعب اليوم؟ ✨</p>
        </div>
      </div>

      {/* Stats strip — 4 mini-cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#FFF3E8] rounded-2xl p-3 text-center border border-orange-100 shadow-card">
          <div className="text-xl mb-1">🔥</div>
          <div className="font-black text-base text-orange-600 ltr-num">{student.streak}</div>
          <div className="text-orange-400 text-[10px] font-bold leading-none mt-0.5">يوم</div>
        </div>
        <div className="bg-[#FFF8E8] rounded-2xl p-3 text-center border border-amber-100 shadow-card">
          <div className="text-xl mb-1">⭐</div>
          <div className="font-black text-base text-amber-600 ltr-num">{student.totalPoints}</div>
          <div className="text-amber-400 text-[10px] font-bold leading-none mt-0.5">نقطة</div>
        </div>
        <div className="bg-brand-50 rounded-2xl p-3 text-center border border-[#E8DBFF] shadow-card">
          <div className="text-xl mb-1">🏆</div>
          <div className="font-black text-base text-brand-600 ltr-num">{student.achievements.length}</div>
          <div className="text-brand-400 text-[10px] font-bold leading-none mt-0.5">وسام</div>
        </div>
        <div className="bg-[#F0FFF9] rounded-2xl p-3 text-center border border-teal-100 shadow-card">
          <div className="text-xl mb-1">📅</div>
          <div className="font-black text-base text-teal-600 ltr-num">{nextSessionDays}</div>
          <div className="text-teal-400 text-[10px] font-bold leading-none mt-0.5">أيام</div>
        </div>
      </div>

      {/* Today's exercises */}
      <div className="bg-white rounded-3xl border border-[#F0E8FF] p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-base">تمارين اليوم 🎮</h2>
          <span className="text-sm font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full ltr-num">
            {completedToday}/{todayExercises.length} مكتمل
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-[#F0E8FF] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-l from-brand-500 to-[#9A7BFD] rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {progressPct === 100 ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2 animate-badge-pop">🎉</div>
            <p className="font-black text-green-600 text-lg">أحسنت! أكملت كل تمارين اليوم!</p>
          </div>
        ) : todayExercises.length === 0 ? (
          <div className="border-2 border-dashed border-[#E8DBFF] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">😴</div>
            <p className="font-bold text-gray-500 text-sm">لا توجد تمارين اليوم</p>
            <p className="text-gray-400 text-xs mt-1">استرح جيداً!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {todayExercises.slice(0, 4).map((ex, idx) => {
              const isDone = completedTodayIds?.includes(ex.id)
              const colors = ['from-[#7C5CFC] to-[#9A7BFD]', 'from-[#3B9EFF] to-[#60B4FF]', 'from-[#2ABFA3] to-[#4DD4BD]', 'from-[#FFBA44] to-[#FFD080]']
              const gradient = colors[idx % colors.length]
              return (
                <Link
                  key={ex.id}
                  href="/student/exercises"
                  className={`relative rounded-3xl h-28 p-4 flex flex-col justify-between bg-gradient-to-br ${gradient} shadow-card transition-transform active:scale-95 ${isDone ? 'opacity-60' : ''}`}
                >
                  <span className="text-4xl leading-none">{CAT_EMOJI[ex.category] || '🏋️'}</span>
                  <div>
                    <p className="text-white font-black text-sm leading-tight line-clamp-2">{ex.titleAr}</p>
                  </div>
                  {isDone && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/10">
                      <span className="text-3xl">✅</span>
                    </div>
                  )}
                </Link>
              )
            })}
            {todayExercises.length > 4 && (
              <Link href="/student/exercises"
                className="rounded-3xl h-28 border-2 border-dashed border-[#E8DBFF] flex flex-col items-center justify-center gap-1 text-brand-400 hover:bg-brand-50 transition-colors">
                <span className="text-2xl">➕</span>
                <span className="text-xs font-black">+{todayExercises.length - 4} تمرين</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/student/exercises"
          className="bg-gradient-to-l from-brand-500 to-[#9A7BFD] text-white font-black py-4 px-4 rounded-2xl text-center text-sm shadow-brand-sm active:scale-95 transition-transform"
        >
          🎮 ابدأ التمارين
        </Link>
        <Link
          href="/student/achievements"
          className="bg-gradient-to-l from-[#FFBA44] to-[#FF8C65] text-white font-black py-4 px-4 rounded-2xl text-center text-sm shadow-warm-sm active:scale-95 transition-transform"
        >
          🏆 إنجازاتي
        </Link>
      </div>

      {/* Recent achievements preview */}
      {student.achievements.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#F0E8FF] p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900">آخر جوائزي ✨</h2>
            <Link href="/student/achievements" className="text-brand-600 text-sm font-black hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {student.achievements.slice(-4).map((ach) => (
              <div key={ach.id}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-card ${
                  ach.tier === 'gold'     ? 'bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]' :
                  ach.tier === 'silver'   ? 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]' :
                  ach.tier === 'platinum' ? 'bg-gradient-to-br from-brand-400 to-brand-600' :
                                            'bg-gradient-to-br from-[#D97706] to-[#B45309]'
                }`}>
                {ach.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
