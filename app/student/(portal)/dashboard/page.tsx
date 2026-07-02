'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Student, Exercise } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

interface StudentData {
  student: Student
  todayExercises: Exercise[]
  completedToday: number
  completedTodayIds: string[]
}

// Per-game gradient + icon map
const GAME_GRADIENTS: Record<string, { gradient: string; icon: string }> = {
  'memory-cards':    { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🃏' },
  'sequence-memory': { gradient: 'linear-gradient(135deg,#3B9EFF,#60B4FF)', icon: '🔢' },
  'n-back':          { gradient: 'linear-gradient(135deg,#6B46F0,#8B66F0)', icon: '🧩' },
  'word-recall':     { gradient: 'linear-gradient(135deg,#7C5CFC,#B99AFF)', icon: '📝' },
  'breathing':       { gradient: 'linear-gradient(135deg,#2ABFA3,#4DD4BD)', icon: '🌬️' },
  'tap-target':      { gradient: 'linear-gradient(135deg,#FF8C65,#FFAA88)', icon: '🎯' },
  'simon-says':      { gradient: 'linear-gradient(135deg,#10B981,#34D399)', icon: '🎨' },
  'letter-match':    { gradient: 'linear-gradient(135deg,#FFBA44,#FFD080)', icon: '🔤' },
  'reaction-game':   { gradient: 'linear-gradient(135deg,#FF6B6B,#FF9999)', icon: '⚡' },
  'stroop-test':     { gradient: 'linear-gradient(135deg,#FF6B6B,#FF8C65)', icon: '🎨' },
  'stop-signal':     { gradient: 'linear-gradient(135deg,#EF4444,#F87171)', icon: '🛑' },
  'emotion-cards':   { gradient: 'linear-gradient(135deg,#EC4899,#F472B6)', icon: '🎭' },
}

const CAT_FALLBACK: Record<string, { gradient: string; icon: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#FFAA88)', icon: '🏃' },
  focus:   { gradient: 'linear-gradient(135deg,#3B9EFF,#60B4FF)', icon: '🎯' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#4DD4BD)', icon: '🌊' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#FFD080)', icon: '⚡' },
  sensory: { gradient: 'linear-gradient(135deg,#FF6B6B,#FF9999)', icon: '🌈' },
  social:  { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🤝' },
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const { lang } = useLang()
  const t = tr[lang].studentDashboard

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d?.student) {
          try {
            localStorage.setItem('data-student-name', d.student.firstName)
            localStorage.setItem('data-student-streak', String(d.student.streak ?? 0))
          } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-6xl">⏳</div>
      <p className="font-black text-lg" style={{ color: '#7C5CFC' }}>{t.loading}</p>
    </div>
  )

  if (!data?.student) return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">😕</div>
      <p className="font-bold text-gray-500">{t.error}</p>
    </div>
  )

  const { student, todayExercises = [], completedTodayIds = [] } = data
  const completedToday = completedTodayIds.length
  const progressPct = todayExercises.length > 0
    ? Math.round((completedToday / todayExercises.length) * 100)
    : 0

  return (
    <div className="space-y-5">

      {/* ── Hero greeting ── */}
      <div
        className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6B46F0 0%, #7C5CFC 50%, #9A7BFD 100%)',
          boxShadow: '0 8px 24px -4px rgba(124,92,252,0.35)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(20px)' }} />
        <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(154,123,253,0.3)', filter: 'blur(16px)' }} />

        <div className="relative z-10">
          <div className="text-4xl mb-2 inline-block animate-float">👋</div>
          <h1 className="font-black text-2xl leading-tight">{t.greeting(student.firstName)}</h1>
          <p className="text-white/80 text-sm mt-1">{t.readyToday}</p>

          {progressPct > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1 font-bold">
                <span>{t.progressToday}</span>
                <span className="ltr-num">{completedToday}/{todayExercises.length}</span>
              </div>
              <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.9)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats strip — 4 mini-cards ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { emoji: '🔥', value: student.streak ?? 0,              label: tr[lang].portal.common.day, bg: '#FFF3E8', border: '#FFD5B0', color: '#EA6C0A' },
          { emoji: '⭐', value: student.totalPoints ?? 0,          label: t.statPoint, bg: '#FFF8E8', border: '#FFE58A', color: '#D97706' },
          { emoji: '🏆', value: (student.achievements ?? []).length, label: t.statBadge, bg: '#F3EEFF', border: '#D3BBFF', color: '#7C5CFC' },
          { emoji: '🎯', value: todayExercises.length - completedToday, label: t.statLeft, bg: '#F0FFF9', border: '#A7F3D0', color: '#059669' },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl p-3 text-center"
            style={{ background: stat.bg, border: `1.5px solid ${stat.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div className="text-xl mb-0.5">{stat.emoji}</div>
            <div className="font-black text-base ltr-num" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] font-bold" style={{ color: stat.color, opacity: 0.7 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Today's exercises ── */}
      <div
        className="rounded-3xl p-5"
        style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-base">{t.todayExercisesTitle}</h2>
          <span
            className="text-xs font-black px-3 py-1 rounded-full ltr-num"
            style={{ background: '#F3EEFF', color: '#7C5CFC' }}
          >
            {completedToday}/{todayExercises.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full mb-4 overflow-hidden" style={{ background: '#F0E8FF' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
            }}
          />
        </div>

        {progressPct === 100 ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2 animate-badge-pop">🎉</div>
            <p className="font-black text-green-600 text-lg">{t.allDoneToday}</p>
          </div>
        ) : todayExercises.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ border: '2px dashed #E8DBFF' }}>
            <div className="text-4xl mb-2">😴</div>
            <p className="font-bold text-gray-500 text-sm">{t.noExercisesToday}</p>
            <p className="text-gray-400 text-xs mt-1">{t.restWell}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {todayExercises.slice(0, 4).map((ex) => {
              const isDone = completedTodayIds.includes(ex.id)
              const cfg = GAME_GRADIENTS[ex.id] || CAT_FALLBACK[ex.category] || { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🏋️' }
              return (
                <Link
                  key={ex.id}
                  href="/student/exercises"
                  className="relative rounded-3xl overflow-hidden card-lift"
                  style={{
                    height: '112px',
                    background: cfg.gradient,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    opacity: isDone ? 0.6 : 1,
                  }}
                >
                  <div className="p-4 h-full flex flex-col justify-between">
                    <span className="text-3xl leading-none">{cfg.icon}</span>
                    <p className="text-white font-black text-sm leading-tight line-clamp-2">{ex.titleAr}</p>
                  </div>
                  {isDone && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.9)' }}>✅</div>
                    </div>
                  )}
                </Link>
              )
            })}
            {todayExercises.length > 4 && (
              <Link
                href="/student/exercises"
                className="rounded-3xl flex flex-col items-center justify-center gap-1 card-lift"
                style={{ height: '112px', border: '2px dashed #D3BBFF', color: '#7C5CFC' }}
              >
                <span className="text-2xl">➕</span>
                <span className="text-xs font-black">+{todayExercises.length - 4}</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/student/exercises"
          className="card-lift text-white font-black py-4 px-4 rounded-2xl text-center text-sm"
          style={{ background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)', boxShadow: '0 4px 12px rgba(124,92,252,0.3)' }}
        >
          {t.startExercises}
        </Link>
        <Link
          href="/student/achievements"
          className="card-lift text-white font-black py-4 px-4 rounded-2xl text-center text-sm"
          style={{ background: 'linear-gradient(to left, #FFBA44, #FF8C65)', boxShadow: '0 4px 12px rgba(255,140,101,0.3)' }}
        >
          {t.myAchievements}
        </Link>
      </div>

      {/* ── Recent achievements preview ── */}
      {(student.achievements ?? []).length > 0 && (
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900">{t.recentAwardsTitle}</h2>
            <Link href="/student/achievements" className="text-sm font-black" style={{ color: '#7C5CFC' }}>
              {t.viewAll}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(student.achievements ?? []).slice(-4).map((ach) => (
              <div
                key={ach.id}
                className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background:
                    ach.tier === 'gold'     ? 'linear-gradient(135deg,#FBBF24,#F59E0B)' :
                    ach.tier === 'silver'   ? 'linear-gradient(135deg,#94A3B8,#64748B)' :
                    ach.tier === 'platinum' ? 'linear-gradient(135deg,#9A7BFD,#7C5CFC)' :
                                              'linear-gradient(135deg,#D97706,#B45309)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                }}
              >
                {ach.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
