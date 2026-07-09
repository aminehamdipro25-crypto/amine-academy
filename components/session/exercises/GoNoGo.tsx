'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randBoolWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

type Phase = 'ready' | 'iti' | 'show' | 'feedback' | 'result'

export default function GoNoGo({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const totalTrials = difficulty === 1 ? 15 : difficulty === 2 ? 20 : 25
  const goRate      = difficulty === 1 ? 0.70 : difficulty === 2 ? 0.60 : 0.50
  const displayMs   = difficulty === 3 ? 600 : difficulty === 2 ? 700 : 800
  const itiMinMs    = 400
  const itiMaxMs    = 800
  const rng         = useRef(createRng(seed ?? Date.now())).current

  const [phase, setPhase]       = useState<Phase>('ready')
  const [trial, setTrial]       = useState(0)
  const [isGo, setIsGo]         = useState(true)
  const [fbText, setFbText]     = useState('')
  const [fbType, setFbType]     = useState<'good'|'bad'|null>(null)
  const [result, setResult]     = useState<ExerciseResult | null>(null)
  const [lastRt, setLastRt]     = useState<number | null>(null)
  const [hits, setHits]         = useState(0)
  const [fas, setFas]           = useState(0)
  const [misses, setMisses]     = useState(0)

  const hitsRef         = useRef(0)
  const fasRef          = useRef(0)
  const missesRef       = useRef(0)
  const goCountRef      = useRef(0)
  const respondedRef    = useRef(false)
  const isGoRef         = useRef(true)
  const trialRef        = useRef(0)
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef        = useRef(Date.now())
  const trialStartRef   = useRef(Date.now())
  const rtsRef          = useRef<number[]>([])

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const finish = useCallback(() => {
    const h  = hitsRef.current
    const f  = fasRef.current
    const go = goCountRef.current
    const raw = go > 0 ? (h / go) * 100 : 0
    const score = Math.max(0, Math.round(raw - f * 5))
    const avgRt = rtsRef.current.length
      ? Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)
      : 0
    const r: ExerciseResult = {
      exerciseType: 'go-no-go',
      exerciseLabelAr: 'اضغط / لا تضغط',
      score,
      accuracy: go > 0 ? Math.round((h / go) * 100) : 0,
      duration: Math.round((Date.now() - startRef.current) / 1000),
      errors: fasRef.current + missesRef.current,
      metadata: { hits: h, misses: missesRef.current, falseAlarms: f, goCount: go, nogoCount: totalTrials - go, difficulty, avgReactionMs: avgRt },
      completedAt: new Date().toISOString(),
    }
    setResult(r)
    setPhase('result')
  }, [totalTrials, difficulty])

  const showFeedback = useCallback((text: string, type: 'good'|'bad', nextTrial: number) => {
    // nextTrial = trials resolved so far (incl. this one); refs already incremented above.
    const errs = fasRef.current + missesRef.current
    onProgress?.({ answered: nextTrial, total: totalTrials, correct: nextTrial - errs, errors: errs, lastCorrect: type === 'good' })
    setFbText(text)
    setFbType(type)
    setPhase('feedback')
    timerRef.current = setTimeout(() => {
      if (nextTrial >= totalTrials) { finish(); return }
      const itiDelay = itiMinMs + rng() * (itiMaxMs - itiMinMs)
      setPhase('iti')
      timerRef.current = setTimeout(() => runTrial(nextTrial), itiDelay)
    }, 420)
  }, [totalTrials, finish, itiMinMs, itiMaxMs, rng, onProgress]) // eslint-disable-line react-hooks/exhaustive-deps

  const runTrial = useCallback((n: number) => {
    clearTimer()
    const go = randBoolWithRng(rng, goRate)
    isGoRef.current  = go
    trialRef.current = n
    if (go) goCountRef.current++
    respondedRef.current = false
    trialStartRef.current = Date.now()
    setTrial(n)
    setIsGo(go)
    setLastRt(null)
    setPhase('show')

    timerRef.current = setTimeout(() => {
      if (!respondedRef.current) {
        if (isGoRef.current) {
          missesRef.current++
          setMisses(missesRef.current)
          showFeedback('❌ فائتة', 'bad', trialRef.current + 1)
        } else {
          showFeedback('✓ صح!', 'good', trialRef.current + 1)
        }
      }
    }, isGoRef.current ? displayMs : displayMs + 200)
  }, [goRate, displayMs, clearTimer, showFeedback, rng])

  function handlePress() {
    if (phase !== 'show') return
    if (respondedRef.current) return
    respondedRef.current = true
    const rt = Date.now() - trialStartRef.current
    clearTimer()
    if (isGoRef.current) {
      hitsRef.current++
      rtsRef.current.push(rt)
      setHits(hitsRef.current)
      setLastRt(rt)
      showFeedback(`✓ ${rt}ms`, 'good', trialRef.current + 1)
    } else {
      fasRef.current++
      setFas(fasRef.current)
      showFeedback('✗ اندفاع!', 'bad', trialRef.current + 1)
    }
  }

  // Ready screen
  if (phase === 'ready') return (
    <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="text-7xl">🎯</div>
      <h2 className="text-white font-black text-2xl text-center">اضغط / لا تضغط</h2>
      <div className="bg-white/5 rounded-2xl p-5 w-full max-w-xs space-y-4">
        <div className="flex items-center gap-3 text-white/80 text-base">
          <span className="text-3xl">🟢</span>
          <span>أخضر؟ <strong className="text-green-400">اضغط بسرعة!</strong></span>
        </div>
        <div className="flex items-center gap-3 text-white/80 text-base">
          <span className="text-3xl">🔴</span>
          <span>أحمر؟ <strong className="text-red-400">لا تضغط!</strong></span>
        </div>
      </div>
      <button
        onClick={() => { startRef.current = Date.now(); runTrial(0) }}
        className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all active:scale-95"
      >
        ابدأ التمرين
      </button>
      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">← إنهاء</button>
    </div>
  )

  // Result screen
  if (phase === 'result' && result) {
    const avgRtMs = (result.metadata as { avgReactionMs?: number })?.avgReactionMs ?? 0
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{hits}</div>
            <div className="text-xs text-white/40 mt-1">ضغطات صحيحة</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{fas}</div>
            <div className="text-xs text-white/40 mt-1">اندفاع</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-orange-400">{misses}</div>
            <div className="text-xs text-white/40 mt-1">فائتة</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-blue-400">{avgRtMs ? `${avgRtMs}ms` : '--'}</div>
            <div className="text-xs text-white/40 mt-1">متوسط الزمن</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-5xl">{result.score}%</div>
        <div className="w-full max-w-xs bg-white/10 rounded-full h-3 overflow-hidden">
          <div className="bg-brand-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${result.score}%` }} />
        </div>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-all active:scale-95"
        >
          متابعة →
        </button>
      </div>
    )
  }

  // Active game
  return (
    <div dir="rtl" className="flex flex-col h-full select-none">
      {/* Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between mb-1.5">
          <span className="text-white/40 text-xs">{trial + 1} / {totalTrials}</span>
          <span className="text-green-400 text-xs font-bold">{hits} ضغطة صحيحة</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${(trial / totalTrials) * 100}%` }} />
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Stimulus */}
        <div className="w-52 h-52 flex items-center justify-center">
          {phase === 'show' && (
            <span className="text-[120px] select-none animate-[pulse_0.3s_ease-in-out]">
              {isGo ? '🟢' : '🔴'}
            </span>
          )}
          {phase === 'feedback' && (
            <div className="text-center">
              <span className={`text-4xl font-black ${fbType === 'good' ? 'text-green-400' : 'text-red-400'}`}>
                {fbText}
              </span>
              {lastRt && (
                <div className="text-white/40 text-sm mt-1 font-mono">{lastRt}ms</div>
              )}
            </div>
          )}
          {phase === 'iti' && (
            <div className="w-4 h-4 rounded-full bg-white/10" />
          )}
        </div>

        {/* Big press button */}
        <button
          onClick={handlePress}
          disabled={phase !== 'show' || !isGo}
          className={`w-44 h-44 rounded-full font-black text-2xl text-white transition-all duration-100 shadow-2xl
            ${phase === 'show' && isGo
              ? 'bg-green-500 hover:bg-green-400 active:scale-90 shadow-green-500/60 cursor-pointer'
              : 'bg-white/5 border-2 border-white/10 cursor-not-allowed opacity-20'
            }`}
        >
          {phase === 'show' && isGo ? 'اضغط!' : ''}
        </button>
      </div>

      <button onClick={onCancel}
        className="text-white/30 hover:text-white/60 text-sm pb-4 transition-colors text-center">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
