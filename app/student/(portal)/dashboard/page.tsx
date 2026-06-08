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

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-6xl animate-bounce">⏳</div>
      <p className="text-brand-600 font-bold">جاري التحميل...</p>
    </div>
  )

  const { student, todayExercises, completedTodayIds } = data ?? {
    student: null, todayExercises: [], completedTodayIds: [],
  }
  // Use Redis-backed count (completedTodayIds length) for accurate display
  const completedToday = completedTodayIds?.length ?? 0

  if (!student) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-gray-500">حدث خطأ، حاول مجدداً</p>
    </div>
  )

  const progressPct = todayExercises.length > 0
    ? Math.round((completedToday / todayExercises.length) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-10 font-black -mt-2 -mr-2">🌟</div>
        <div className="relative z-10">
          <div className="text-5xl mb-3 animate-float inline-block">
            {student.streak >= 7 ? '🦸' : student.streak >= 3 ? '💪' : '👋'}
          </div>
          <h1 className="font-black text-2xl">أهلاً {student.firstName}!</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-white/80 text-sm">🔥</span>
            <span className="text-white font-bold text-sm">
              {student.streak} يوم متتالي!
            </span>
          </div>
        </div>
      </div>

      {/* Points & level */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">⭐</div>
          <div className="font-black text-xl text-gray-900 ltr-num">{student.totalPoints}</div>
          <div className="text-gray-400 text-xs">نقطة</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-black text-xl text-gray-900 ltr-num">{student.achievements.length}</div>
          <div className="text-gray-400 text-xs">وسام</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-black text-xl text-gray-900 ltr-num">{completedToday}</div>
          <div className="text-gray-400 text-xs">أنجزت اليوم</div>
        </div>
      </div>

      {/* Today's progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900">تمارين اليوم</h2>
          <span className="text-sm font-bold text-brand-600 ltr-num">{completedToday}/{todayExercises.length}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="progress-bar h-full" style={{ width: `${progressPct}%` }} />
        </div>
        {progressPct === 100 ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2 animate-badge-pop">🎉</div>
            <p className="font-black text-green-600">أحسنت! أكملت كل تمارين اليوم!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayExercises.slice(0, 3).map((ex) => (
              <Link key={ex.id} href={`/student/exercises/${ex.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-lg">
                  {ex.category === 'motor' ? '🏃' :
                   ex.category === 'focus' ? '🎯' :
                   ex.category === 'balance' ? '🌊' :
                   ex.category === 'energy' ? '⚡' : '🧘'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{ex.titleAr}</div>
                  <div className="text-gray-400 text-xs ltr-num">{ex.durationMinutes} دقيقة • {ex.points} نقطة</div>
                </div>
                <div className="text-brand-600 text-lg">←</div>
              </Link>
            ))}
            {todayExercises.length > 3 && (
              <Link href="/student/exercises"
                className="block text-center text-brand-600 font-bold text-sm py-2 hover:underline">
                عرض الكل ({todayExercises.length - 3} تمرين آخر)
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Achievements preview */}
      {student.achievements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900">آخر جوائزي</h2>
            <Link href="/student/achievements" className="text-brand-600 text-sm font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {student.achievements.slice(-4).map((ach) => (
              <div key={ach.id}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                  ach.tier === 'gold' ? 'tier-gold' :
                  ach.tier === 'silver' ? 'tier-silver' :
                  ach.tier === 'platinum' ? 'tier-platinum' : 'tier-bronze'
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
