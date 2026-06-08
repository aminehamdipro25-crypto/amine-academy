'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const TRIALS = 10

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

type Phase = 'ready' | 'waiting' | 'flash' | 'early' | 'result'

export default function ReactionGame({ onComplete, onCancel, difficulty = 1 }: Props) {
  const minDelay = difficulty === 1 ? 1200 : difficulty === 2 ? 900 : 600
  const maxDelay = difficulty === 1 ? 3200 : difficulty === 2 ? 2600 : 2000

  const [phase, setPhase]         = useState<Phase>('ready')
  const [trial, setTrial]         = useState(0)
  const [times, setTimes]         = useState<number[]>([])
  const [earlyCount, setEarlyCount] = useState(0)
  const [pos, setPos]             = useState({ x: 50, y: 50 })
  const [lastTime, setLastTime]   = useState<number | null>(null)
  const [result, setResult]       = useState<ExerciseResult | null>(null)

  const flashStartRef = useRef(0)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef      = useRef(Date.now())
  const earlyRef      = useRef(0)
  const timesRef      = useRef<number[]>([])

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  useEffect(() => () => clearTimer(), [])

  const scheduleFlash = useCallback(() => {
    const delay = minDelay + Math.random() * (maxDelay - minDelay)
    const x = 15 + Math.random() * 70
    const y = 20 + Math.random() * 60
    setPos({ x, y })
    timerRef.current = setTimeout(() => {
      flashStartRef.current = Date.now()
      setPhase('flash')
    }, delay)
  }, [minDelay, maxDelay])

  function buildResult(allTimes: number[], early: number): ExerciseResult {
    const avg = allTimes.length ? Math.round(allTimes.reduce((s, t) => s + t, 0) / allTimes.length) : 999
    const score = Math.min(100, Math.max(0, Math.round(130 - avg / 9)))
    return {
      exerciseType:    'reaction-game',
      exerciseLabelAr: 'سرعة رد الفعل',
      score,
      accuracy: Math.round((TRIALS / (TRIALS + early)) * 100),
      duration: Math.round((Date.now() - startRef.current) / 1000),
      errors:   early,
      metadata: { avgReactionMs: avg, bestMs: Math.min(...allTimes), trials: TRIALS, earlyPresses: early, difficulty },
      completedAt: new Date().toISOString(),
    }
  }

  function handlePress() {
    if (phase === 'ready') {
      startRef.current = Date.now()
      setPhase('waiting')
      scheduleFlash()
    } else if (phase === 'waiting') {
      clearTimer()
      earlyRef.current++
      setEarlyCount(earlyRef.current)
      setPhase('early')
      timerRef.current = setTimeout(() => {
        setPhase('waiting')
        scheduleFlash()
      }, 1400)
    } else if (phase === 'flash') {
      clearTimer()
      const rt = Date.now() - flashStartRef.current
      timesRef.current = [...timesRef.current, rt]
      setTimes(timesRef.current)
      setLastTime(rt)
      const nextTrial = trial + 1
      if (nextTrial >= TRIALS) {
        const r = buildResult(timesRef.current, earlyRef.current)
        setResult(r)
        setPhase('result')
      } else {
        setTrial(nextTrial)
        setPhase('waiting')
        scheduleFlash()
      }
    }
  }

  const avgSoFar = times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null

  if (phase === 'result' && result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">
              {Math.round(result.metadata.avgReactionMs as number)}ms
            </div>
            <div className="text-xs text-white/50">متوسط ر. الفعل</div>
          </div>
          <div className="bg-brand-900/30 border border-brand-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-brand-400">
              {Math.round(result.metadata.bestMs as number)}ms
            </div>
            <div className="text-xs text-white/50">أسرع محاولة</div>
          </div>
        </div>
        <p className="text-white/50 text-sm text-center">
          {(result.metadata.avgReactionMs as number) < 300 ? 'رد فعل فائق السرعة! 🚀' :
           (result.metadata.avgReactionMs as number) < 500 ? 'سرعة جيدة جداً ⚡' :
           (result.metadata.avgReactionMs as number) < 700 ? 'جيد! استمر في التدريب 💪' :
           'تدرب أكثر وستتحسن 🎯'}
        </p>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{trial}/{TRIALS}</div>
          <div className="text-xs text-white/50">محاولات</div>
        </div>
        {avgSoFar !== null && (
          <div className="text-center">
            <div className="text-2xl font-black text-green-400">{avgSoFar}ms</div>
            <div className="text-xs text-white/50">متوسط</div>
          </div>
        )}
        {lastTime !== null && phase === 'waiting' && (
          <div className="text-center">
            <div className="text-lg font-black text-white/40">{lastTime}ms</div>
            <div className="text-xs text-white/30">آخر</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{earlyCount}</div>
          <div className="text-xs text-white/50">مبكر</div>
        </div>
      </div>

      {/* Arena */}
      <div
        onClick={handlePress}
        className={`relative flex-1 mx-4 mb-4 rounded-2xl cursor-pointer overflow-hidden transition-colors duration-150
          ${phase === 'flash'   ? 'bg-gray-950'           : ''}
          ${phase === 'waiting' ? 'bg-gray-900/60'        : ''}
          ${phase === 'early'   ? 'bg-red-950/80'         : ''}
          ${phase === 'ready'   ? 'bg-gray-900/50'        : ''}
        `}
        style={{ minHeight: 380 }}
      >
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-7xl">⚡</div>
            <p className="text-white font-black text-xl">لعبة رد الفعل</p>
            <p className="text-white/50 text-sm text-center px-6">
              اضغط الهدف الأخضر بأسرع ما يمكن<br />لا تضغط قبل ظهوره!
            </p>
            <div className="mt-4 bg-brand-600 text-white font-black px-8 py-3 rounded-2xl text-lg">
              اضغط للبدء
            </div>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/20 font-black text-3xl">انتظر...</p>
          </div>
        )}

        {phase === 'early' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-5xl">🚫</div>
            <p className="text-red-400 font-black text-xl">مبكر جداً! انتظر الهدف</p>
          </div>
        )}

        {phase === 'flash' && (
          <button
            className="absolute w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl
              shadow-2xl shadow-green-500/60 animate-bounce active:scale-90 transition-transform"
            style={{
              left: `calc(${pos.x}% - 48px)`,
              top:  `calc(${pos.y}% - 48px)`,
            }}
          >
            ⭐
          </button>
        )}
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
