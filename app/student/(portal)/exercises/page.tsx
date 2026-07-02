'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Play, X, Clock } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

// Per-game gradient + icon
const GAME_CFG: Record<string, { gradient: string; icon: string }> = {
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
const CAT_CFG: Record<string, { gradient: string; icon: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#FFAA88)', icon: '🏃' },
  focus:   { gradient: 'linear-gradient(135deg,#3B9EFF,#60B4FF)', icon: '🎯' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#4DD4BD)', icon: '🌊' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#FFD080)', icon: '⚡' },
  sensory: { gradient: 'linear-gradient(135deg,#FF6B6B,#FF9999)', icon: '🌈' },
  social:  { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🤝' },
}
interface CompleteResult {
  ok: boolean
  alreadyDone: boolean
  pointsEarned: number
  newTotalPoints: number
  newAchievements: string[]
}

interface Toast { id: number; message: string }

export default function StudentExercisesPage() {
  const { lang } = useLang()
  const t = tr[lang].studentExercises
  const catLabel = tr[lang].portal.common.categoryLabels
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [achievementBanner, setAchievementBanner] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => {
        setExercises(d.todayExercises || [])
        if (Array.isArray(d.completedTodayIds) && d.completedTodayIds.length > 0) {
          setDone(new Set<string>(d.completedTodayIds))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  function addToast(message: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function open(ex: Exercise) { setSelected(ex); setStep(0); setTimer(0); setRunning(false) }
  function close() { setSelected(null); setRunning(false) }

  async function finish() {
    if (!selected || saving) return
    setRunning(false)
    setSaving(true)
    try {
      const res = await fetch('/api/student/complete-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: selected.id, points: selected.points }),
      })
      const data: CompleteResult = await res.json()

      const next = new Set(done)
      next.add(selected.id)
      setDone(next)

      if (data.ok && !data.alreadyDone) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2800)
        addToast(t.pointsToast(data.pointsEarned, data.newTotalPoints))
        if (data.newAchievements.length > 0) {
          setAchievementBanner(data.newAchievements)
          setTimeout(() => setAchievementBanner([]), 5000)
        }
      } else {
        addToast(t.alreadyDoneToast)
      }
    } catch {
      addToast(t.errorToast)
    } finally {
      setSaving(false)
      setSelected(null)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="text-5xl mb-4">🎮</div>
      <p className="font-black text-lg" style={{ color: '#7C5CFC' }}>{t.loadingGames}</p>
    </div>
  )

  const selCfg = selected
    ? (GAME_CFG[selected.id] || CAT_CFG[selected.category] || { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🏋️' })
    : null

  return (
    <div className="space-y-4">

      {/* ── Celebration overlay ── */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="text-center animate-badge-pop">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-white font-black text-3xl">{t.celebrationTitle}</div>
            <div className="text-white/80 mt-1">{t.celebrationSubtitle}</div>
          </div>
        </div>
      )}

      {/* ── Achievement banner ── */}
      {achievementBanner.length > 0 && (
        <div className="fixed top-20 left-4 right-4 z-50 space-y-2 pointer-events-none">
          {achievementBanner.map((name, i) => (
            <div
              key={i}
              className="text-center py-3 px-4 rounded-2xl font-black animate-badge-pop"
              style={{ background: '#FBBF24', color: '#78350F', boxShadow: '0 4px 12px rgba(251,191,36,0.4)' }}
            >
              {t.newBadge(name)}
            </div>
          ))}
        </div>
      )}

      {/* ── Toasts ── */}
      <div className="fixed bottom-24 left-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="text-center py-3 px-4 rounded-2xl text-sm font-black animate-slide-up"
            style={{ background: 'rgba(17,24,39,0.92)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Page header ── */}
      <div className="text-center pt-1 pb-1">
        <h1 className="font-black text-2xl text-gray-900">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {done.size === exercises.length && exercises.length > 0
            ? t.allCompleted
            : <span className="ltr-num">{t.completedOf(done.size, exercises.length)}</span>
          }
        </p>
      </div>

      {/* ── Progress bar ── */}
      {exercises.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="h-3.5 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${exercises.length ? (done.size / exercises.length) * 100 : 0}%`,
                background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Games grid ── */}
      {exercises.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center"
          style={{ border: '2px dashed #D3BBFF', background: '#FFFFFF' }}
        >
          <div className="text-5xl mb-3">😴</div>
          <p className="font-black text-gray-700">{t.noExercisesToday}</p>
          <p className="text-gray-400 text-sm mt-1">{t.restWellTomorrow}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {exercises.map((ex) => {
            const isDone = done.has(ex.id)
            const cfg = GAME_CFG[ex.id] || CAT_CFG[ex.category] || { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🏋️' }
            return (
              <div
                key={ex.id}
                onClick={() => !isDone && open(ex)}
                className="relative rounded-3xl overflow-hidden transition-all duration-200"
                style={{
                  cursor: isDone ? 'default' : 'pointer',
                  opacity: isDone ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: isDone ? 'none' : undefined,
                }}
                onMouseEnter={e => { if (!isDone) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
                onMouseDown={e => { if (!isDone) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.96)' }}
                onMouseUp={e => { if (!isDone) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px) scale(1.02)' }}
              >
                <div className="p-4 h-36 flex flex-col justify-between" style={{ background: cfg.gradient }}>
                  <div className="flex justify-between items-start">
                    <span className="text-4xl leading-none">{cfg.icon}</span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}
                    >
                      {catLabel[ex.category as keyof typeof catLabel] || ex.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm leading-tight line-clamp-2">{ex.titleAr}</p>
                    <p className="text-white/70 text-[10px] mt-1 ltr-num">{t.pointsUnit(ex.points)}</p>
                  </div>
                </div>

                {isDone && (
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <CheckCircle className="w-7 h-7 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Exercise modal ── */}
      {selected && selCfg && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className="w-full max-w-lg overflow-y-auto"
            style={{ background: '#FFFFFF', borderRadius: '1.5rem 1.5rem 0 0', maxHeight: '90vh' }}
          >
            {/* Modal header */}
            <div
              className="px-5 pt-5 pb-6 rounded-t-3xl"
              style={{ background: selCfg.gradient }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{selCfg.icon}</span>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <h2 className="text-white font-black text-xl mb-1">{selected.titleAr}</h2>
              <div className="flex items-center gap-4 text-white/70 text-xs">
                <span className="ltr-num flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t.minutesUnit(selected.durationMinutes)}
                </span>
                <span>{t.pointsUnit(selected.points)}</span>
              </div>
              {running && (
                <div
                  className="mt-3 py-2 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white font-black text-xl ltr-num">
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Modal body */}
            <div className="p-5">
              <div
                className="rounded-2xl p-4 mb-5"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="text-amber-700 text-xs font-black mb-1">{t.whyThisExercise}</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selected.psychologyObjectiveAr || selected.psychologyObjective}
                </p>
              </div>

              <div className="mb-5 space-y-2">
                {selected.instructionsAr.map((inst, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-2xl transition-all"
                    style={{
                      background: i === step ? '#F3EEFF' : i < step ? '#F0FFF9' : '#F9FAFB',
                      border: i === step ? '2px solid #D3BBFF' : '2px solid transparent',
                      opacity: i > step ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{
                        background: i === step ? '#7C5CFC' : i < step ? '#10B981' : '#E5E7EB',
                        color: i <= step ? '#FFFFFF' : '#6B7280',
                      }}
                    >
                      {i < step ? '✓' : i + 1}
                    </div>
                    <p className={`text-sm leading-relaxed ${i === step ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      {inst}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {!running ? (
                  <button
                    onClick={() => setRunning(true)}
                    className="flex-1 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: selCfg.gradient, boxShadow: '0 4px 12px rgba(124,92,252,0.3)' }}
                  >
                    <Play className="w-5 h-5" /> {t.startButton}
                  </button>
                ) : step < selected.instructionsAr.length - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex-1 text-white font-black py-4 rounded-2xl text-lg transition-all active:scale-95"
                    style={{ background: selCfg.gradient, boxShadow: '0 4px 12px rgba(124,92,252,0.3)' }}
                  >
                    {t.nextButton}
                  </button>
                ) : (
                  <button
                    onClick={finish}
                    disabled={saving}
                    className="flex-1 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                  >
                    {saving
                      ? <span className="animate-pulse">{t.savingButton}</span>
                      : <><CheckCircle className="w-5 h-5" /> {t.finishButton}</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
