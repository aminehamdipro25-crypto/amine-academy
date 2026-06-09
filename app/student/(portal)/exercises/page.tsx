'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Play, X, Clock } from 'lucide-react'
import type { Exercise } from '@/lib/types'

const CAT_EMOJI: Record<string, string> = {
  motor: '🏃', focus: '🎯', balance: '🌊', energy: '⚡', sensory: '🌈', social: '🤝',
}

// Per-game gradient colors
const GAME_GRADIENT: Record<string, string> = {
  'memory-cards':    'from-[#7C5CFC] to-[#9A7BFD]',
  'sequence-memory': 'from-[#3B9EFF] to-[#60B4FF]',
  'n-back':          'from-[#6B46F0] to-[#8B66F0]',
  'word-recall':     'from-[#7C5CFC] to-[#B99AFF]',
  'breathing':       'from-[#2ABFA3] to-[#4DD4BD]',
  'tap-target':      'from-[#FF8C65] to-[#FFAA88]',
  'simon-says':      'from-[#10B981] to-[#34D399]',
  'letter-match':    'from-[#FFBA44] to-[#FFD080]',
  'reaction-game':   'from-[#FF6B6B] to-[#FF9999]',
  'stroop-test':     'from-[#FF6B6B] to-[#FF8C65]',
  'stop-signal':     'from-[#EF4444] to-[#F87171]',
  'emotion-cards':   'from-[#EC4899] to-[#F472B6]',
}

// Category → gradient fallback
const CAT_GRADIENT: Record<string, string> = {
  motor:   'from-[#FF8C65] to-[#FFAA88]',
  focus:   'from-[#3B9EFF] to-[#60B4FF]',
  balance: 'from-[#2ABFA3] to-[#4DD4BD]',
  energy:  'from-[#FFBA44] to-[#FFD080]',
  sensory: 'from-[#FF6B6B] to-[#FF9999]',
  social:  'from-[#7C5CFC] to-[#9A7BFD]',
}

const CAT_LABEL: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن', energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}

interface CompleteResult {
  ok: boolean
  alreadyDone: boolean
  pointsEarned: number
  newTotalPoints: number
  newStreak: number
  newAchievements: string[]
}

interface Toast {
  id: number
  type: 'points' | 'achievement'
  message: string
}

export default function StudentExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [celebrated, setCelebrated] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [achievementBanner, setAchievementBanner] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => {
        setExercises(d.todayExercises || [])
        // Pre-mark exercises already completed today (from Redis)
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

  function addToast(type: Toast['type'], message: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
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

      if (data.ok && !data.alreadyDone) {
        // Mark as done in local state
        const next = new Set(done)
        next.add(selected.id)
        setDone(next)

        // Show celebration overlay
        setCelebrated(selected.id)
        setTimeout(() => setCelebrated(null), 3000)

        // Show points toast
        addToast('points', `+${data.pointsEarned} نقطة! المجموع: ${data.newTotalPoints} ⭐`)

        // Show achievement banners
        if (data.newAchievements.length > 0) {
          setAchievementBanner(data.newAchievements)
          setTimeout(() => setAchievementBanner([]), 5000)
        }
      } else if (data.alreadyDone) {
        // Already done — still mark in local state
        const next = new Set(done)
        next.add(selected.id)
        setDone(next)
        addToast('points', 'أتممت هذا التمرين بالفعل اليوم ✅')
      }
    } catch {
      addToast('points', 'حدث خطأ، حاول مجدداً')
    } finally {
      setSaving(false)
      setSelected(null)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20" dir="rtl">
      <div className="text-5xl animate-bounce-soft mb-4">🎮</div>
      <p className="text-brand-600 font-black text-lg">جاري تحضير ألعابك...</p>
    </div>
  )

  const selectedGradient = selected
    ? (GAME_GRADIENT[selected.id] || CAT_GRADIENT[selected.category] || 'from-brand-500 to-brand-700')
    : ''

  return (
    <div className="space-y-4" dir="rtl">
      {/* Celebration overlay */}
      {celebrated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="text-center animate-badge-pop">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-white font-black text-3xl">أحسنت!</div>
          </div>
        </div>
      )}

      {/* Achievement unlock banner */}
      {achievementBanner.length > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 space-y-2 pointer-events-none">
          {achievementBanner.map((name, i) => (
            <div key={i} className="bg-[#FBBF24] text-yellow-900 font-black text-center py-3 px-4 rounded-2xl shadow-lg animate-badge-pop">
              🏆 وسام جديد: {name}
            </div>
          ))}
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-24 left-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="bg-gray-900/90 text-white text-center py-3 px-4 rounded-2xl text-sm font-black shadow-lg animate-badge-pop"
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-black text-2xl text-gray-900">اختر لعبتك 🎮</h1>
        <p className="text-gray-500 text-sm mt-1">
          {done.size === exercises.length && exercises.length > 0
            ? '🎊 أكملت جميع التمارين!'
            : <span className="ltr-num">{done.size} من {exercises.length} مكتمل</span>
          }
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E8FF] shadow-card">
        <div className="h-3.5 bg-[#F0E8FF] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-brand-500 to-[#9A7BFD] rounded-full transition-all duration-700"
            style={{ width: `${exercises.length ? (done.size / exercises.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Games grid */}
      {exercises.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#E8DBFF] bg-white p-10 text-center">
          <div className="text-5xl mb-3">😴</div>
          <p className="font-black text-gray-700">لا توجد تمارين اليوم</p>
          <p className="text-gray-400 text-sm mt-1">استرح جيداً، ستصلك تمارين غداً!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {exercises.map((ex) => {
            const isDone = done.has(ex.id)
            const gradient = GAME_GRADIENT[ex.id] || CAT_GRADIENT[ex.category] || 'from-brand-500 to-brand-700'
            return (
              <div
                key={ex.id}
                onClick={() => !isDone && open(ex)}
                className={`relative rounded-3xl overflow-hidden shadow-card transition-all duration-200 ${
                  isDone ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-95 hover:shadow-brand-sm'
                }`}
              >
                <div className={`bg-gradient-to-br ${gradient} p-4 h-36 flex flex-col justify-between`}>
                  {/* Category pill */}
                  <div className="flex justify-between items-start">
                    <span className="text-4xl leading-none">{CAT_EMOJI[ex.category] || '🏋️'}</span>
                    <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {CAT_LABEL[ex.category] || ex.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm leading-tight line-clamp-2">{ex.titleAr}</p>
                    <p className="text-white/70 text-[10px] mt-1 ltr-num">⭐ {ex.points} نقطة</p>
                  </div>
                </div>
                {/* Done overlay */}
                {isDone && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
                    <div className="bg-white rounded-full p-1">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Exercise player modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className={`bg-gradient-to-l ${selectedGradient} rounded-t-3xl px-5 pt-5 pb-6`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{CAT_EMOJI[selected.category] || '🏋️'}</span>
                <button onClick={close} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <h2 className="text-white font-black text-xl mb-1">{selected.titleAr}</h2>
              <div className="flex items-center gap-4 text-white/70 text-xs">
                <span className="ltr-num flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.durationMinutes} دقيقة</span>
                <span>⭐ {selected.points} نقطة</span>
              </div>
              {running && (
                <div className="mt-3 bg-white/20 rounded-xl py-2 text-center">
                  <span className="text-white font-black text-xl ltr-num">
                    {Math.floor(timer/60).toString().padStart(2,'0')}:{(timer%60).toString().padStart(2,'0')}
                  </span>
                </div>
              )}
            </div>

            {/* Modal body */}
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                <p className="text-amber-700 text-xs font-black mb-1">لماذا هذا التمرين؟</p>
                <p className="text-gray-700 text-sm leading-relaxed">{selected.psychologyObjectiveAr || selected.psychologyObjective}</p>
              </div>

              <div className="mb-5 space-y-2">
                {(selected.instructionsAr || selected.instructions).map((inst, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
                    i === step ? 'bg-brand-50 border-2 border-[#E8DBFF]' :
                    i < step  ? 'bg-green-50' : 'bg-gray-50 opacity-50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      i === step ? 'bg-brand-600 text-white' :
                      i < step  ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <p className={`text-sm leading-relaxed ${i === step ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{inst}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {!running ? (
                  <button onClick={() => setRunning(true)} className="flex-1 bg-gradient-to-l from-brand-500 to-[#9A7BFD] text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-brand-sm">
                    <Play className="w-5 h-5" /> ابدأ!
                  </button>
                ) : step < (selected.instructionsAr || selected.instructions).length - 1 ? (
                  <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-gradient-to-l from-brand-500 to-[#9A7BFD] text-white font-black py-4 rounded-2xl text-lg shadow-brand-sm">
                    التالي ←
                  </button>
                ) : (
                  <button
                    onClick={finish}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-l from-green-500 to-green-600 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 disabled:opacity-60 shadow-card"
                  >
                    {saving
                      ? <span className="animate-pulse">جاري الحفظ...</span>
                      : <><CheckCircle className="w-5 h-5" /> انتهيت! 🎉</>
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
