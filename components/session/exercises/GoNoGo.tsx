'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

type Phase = 'ready' | 'show' | 'feedback' | 'iti' | 'result'

const GO_EMOJI    = '🟢'
const NOGO_EMOJI  = '🔴'

export default function GoNoGo({ onComplete, onCancel, difficulty = 1 }: Props) {
  const totalTrials  = difficulty === 1 ? 15 : difficulty === 2 ? 20 : 25
  const goRate       = difficulty === 1 ? 0.70 : difficulty === 2 ? 0.60 : 0.50
  const nogoWaitMs   = 800
  const displayMs    = 500
  const feedbackMs   = 400

  const [phase,     setPhase]     = useState<Phase>('ready')
  const [trial,     setTrial]     = useState(0)
  const [isGo,      setIsGo]      = useState(true)
  const [fbText,    setFbText]    = useState('')
  const [fbColor,   setFbColor]   = useState('')
  const [result,    setResult]    = useState<ExerciseResult | null>(null)

  const hitsRef          = useRef(0)
  const falseAlarmsRef   = useRef(0)
  const missesRef        = useRef(0)
  const goCountRef       = useRef(0)
  const respondedRef     = useRef(false)
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef         = useRef(Date.now())
  const isGoRef          = useRef(true)
  const trialRef         = useRef(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const finish = useCallback(() => {
    const hits  = hitsRef.current
    const fas   = falseAlarmsRef.current
    const goCnt = goCountRef.current
    const raw   = goCnt > 0 ? (hits / goCnt) * 100 : 0
    const score = Math.max(0, Math.round(raw - fas * 5))
    const r: ExerciseResult = {
      exerciseType:    'go-no-go',
      exerciseLabelAr: 'اضغط / لا تضغط',
      score,
      accuracy: goCnt > 0 ? Math.round((hits / goCnt) * 100) : 0,
      duration:  Math.round((Date.now() - startRef.current) / 1000),
      errors:    falseAlarmsRef.current + missesRef.current,
      metadata: {
        hits,
        misses:      missesRef.current,
        falseAlarms: fas,
        goCount:     goCnt,
        nogoCount:   totalTrials - goCnt,
        difficulty,
      },
      completedAt: new Date().toISOString(),
    }
    setResult(r)
    setPhase('result')
  }, [totalTrials, difficulty])

  const showFeedback = useCallback((text: string, color: string, nextTrial: number) => {
    setFbText(text)
    setFbColor(color)
    setPhase('feedback')
    timerRef.current = setTimeout(() => {
      if (nextTrial >= totalTrials) { finish(); return }
      runTrial(nextTrial)
    }, feedbackMs)
  }, [totalTrials, finish]) // eslint-disable-line react-hooks/exhaustive-deps

  const runTrial = useCallback((n: number) => {
    clearTimer()
    const go = Math.random() < goRate
    isGoRef.current  = go
    trialRef.current = n
    if (go) goCountRef.current++
    respondedRef.current = false
    setTrial(n)
    setIsGo(go)
    setPhase('show')

    timerRef.current = setTimeout(() => {
      // Display window over — resolve non-response
      if (!respondedRef.current) {
        if (isGoRef.current) {
          missesRef.current++
          showFeedback('❌ خطأ!', 'text-red-400', trialRef.current + 1)
        } else {
          // Correct inhibition — no overt response needed
          showFeedback('✅ صح!', 'text-green-400', trialRef.current + 1)
        }
      }
    }, isGoRef.current ? displayMs : nogoWaitMs)
  }, [goRate, displayMs, nogoWaitMs, clearTimer, showFeedback])

  function handlePress() {
    if (phase !== 'show') return
    if (respondedRef.current) return
    respondedRef.current = true
    clearTimer()
    if (isGoRef.current) {
      hitsRef.current++
      showFeedback('✅ صح!', 'text-green-400', trialRef.current + 1)
    } else {
      falseAlarmsRef.current++
      showFeedback('❌ خطأ!', 'text-red-400', trialRef.current + 1)
    }
  }

  // ── Ready ──────────────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-gray-950">
        <div className="text-7xl">🎯</div>
        <h2 className="text-white font-black text-2xl text-center">اضغط / لا تضغط</h2>
        <div className="bg-white/5 rounded-2xl p-5 space-y-4 w-full max-w-xs">
          <div className="flex items-center gap-3 text-white/80 text-base">
            <span className="text-3xl">{GO_EMOJI}</span>
            <span>ارى الأخضر؟ اضغط بسرعة!</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-base">
            <span className="text-3xl">{NOGO_EMOJI}</span>
            <span>ارى الأحمر؟ لا تضغط!</span>
          </div>
        </div>
        <button
          onClick={() => { startRef.current = Date.now(); runTrial(0) }}
          className="bg-[#7C5CFC] hover:bg-[#6a4de8] text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إنهاء التمرين
        </button>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-5 px-6 bg-gray-950">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى التمرين!</h2>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-400">{hitsRef.current}</div>
            <div className="text-xs text-white/40">ضغطات صحيحة</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-red-400">{falseAlarmsRef.current}</div>
            <div className="text-xs text-white/40">اندفاع</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-orange-400">{missesRef.current}</div>
            <div className="text-xs text-white/40">فائتة</div>
          </div>
        </div>
        <div className="text-[#7C5CFC] font-black text-5xl">{result.score}%</div>
        <button
          onClick={() => onComplete(result)}
          className="bg-[#7C5CFC] hover:bg-[#6a4de8] text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  // ── Active game ────────────────────────────────────────────────
  return (
    <div dir="rtl" className="flex flex-col h-full bg-gray-950 select-none">
      {/* Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">{trial + 1} / {totalTrials}</span>
          <span className="text-green-400 text-xs font-bold">{hitsRef.current} ضغطة صحيحة</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-[#7C5CFC] h-2 rounded-full transition-all"
            style={{ width: `${(trial / totalTrials) * 100}%` }}
          />
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Stimulus */}
        <div className="w-48 h-48 flex items-center justify-center">
          {phase === 'show' && (
            <span className="text-9xl select-none">{isGo ? GO_EMOJI : NOGO_EMOJI}</span>
          )}
          {phase === 'feedback' && (
            <span className={`text-5xl font-black ${fbColor}`}>{fbText}</span>
          )}
          {phase === 'iti' && (
            <div className="w-6 h-6 rounded-full bg-white/10" />
          )}
        </div>

        {/* Big press button — only shown on GO */}
        <button
          onClick={handlePress}
          disabled={phase !== 'show' || !isGo}
          className={`
            w-40 h-40 rounded-full font-black text-2xl text-white transition-all duration-100 shadow-2xl
            ${phase === 'show' && isGo
              ? 'bg-green-500 hover:bg-green-400 active:scale-90 shadow-green-500/50 cursor-pointer'
              : 'bg-white/5 border-2 border-white/10 cursor-not-allowed opacity-30'}
          `}
        >
          {phase === 'show' && isGo ? 'اضغط!' : ''}
        </button>
      </div>

      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm pb-4 transition-colors text-center"
      >
        ← إنهاء التمرين
      </button>
    </div>
  )
}
