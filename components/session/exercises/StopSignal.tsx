'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const TOTAL = 24

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

type Phase = 'ready' | 'wait' | 'go' | 'stop' | 'result'
type Fb    = 'hit' | 'miss' | 'stop-ok' | 'stop-err' | null

export default function StopSignal({ onComplete, onCancel, difficulty = 1 }: Props) {
  const displayMs = difficulty === 1 ? 1000 : difficulty === 2 ? 750 : 550
  const stopRate  = difficulty === 1 ? 0.25 : difficulty === 2 ? 0.30 : 0.35

  const [phase, setPhase]   = useState<Phase>('ready')
  const [isStop, setIsStop] = useState(false)
  const [trial, setTrial]   = useState(0)
  const [fb, setFb]         = useState<Fb>(null)
  const [result, setResult] = useState<ExerciseResult | null>(null)

  // Refs — avoid async setState in countdown logic
  const goHitsRef  = useRef(0)
  const goMissRef  = useRef(0)
  const stopOkRef  = useRef(0)
  const stopErrRef = useRef(0)
  const tappedRef  = useRef(false)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef   = useRef(Date.now())

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }
  useEffect(() => () => clearTimer(), [])

  const finish = useCallback(() => {
    const gh = goHitsRef.current
    const gm = goMissRef.current
    const sh = stopOkRef.current
    const se = stopErrRef.current
    const total   = gh + gm + sh + se
    const correct = gh + sh
    const score   = total > 0 ? Math.round((correct / total) * 100) : 0
    setResult({
      exerciseType:    'stop-signal',
      exerciseLabelAr: 'ضبط الاندفاع — توقف أو اكمل',
      score,
      accuracy: score,
      duration: Math.round((Date.now() - startRef.current) / 1000),
      errors:   gm + se,
      metadata: { goHits: gh, goMisses: gm, stopSuccess: sh, stopErrors: se, total, difficulty },
      completedAt: new Date().toISOString(),
    })
    setPhase('result')
  }, [difficulty])

  const runTrial = useCallback((n: number) => {
    if (n >= TOTAL) { finish(); return }
    const stop = Math.random() < stopRate
    setIsStop(stop)
    tappedRef.current = false
    setFb(null)
    setTrial(n)
    setPhase('wait')

    const iti = 600 + Math.random() * 900
    timerRef.current = setTimeout(() => {
      setPhase(stop ? 'stop' : 'go')
      timerRef.current = setTimeout(() => {
        if (!tappedRef.current) {
          if (stop) { stopOkRef.current++;  setFb('stop-ok') }
          else      { goMissRef.current++;  setFb('miss')    }
        }
        timerRef.current = setTimeout(() => runTrial(n + 1), 500)
      }, displayMs)
    }, iti)
  }, [stopRate, displayMs, finish])

  function handleTap() {
    if (phase !== 'go' && phase !== 'stop') return
    if (tappedRef.current) return
    tappedRef.current = true
    clearTimer()
    if (phase === 'go') {
      goHitsRef.current++
      setFb('hit')
    } else {
      stopErrRef.current++
      setFb('stop-err')
    }
    timerRef.current = setTimeout(() => runTrial(trial + 1), 500)
  }

  // ── Ready screen ────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-7xl">🛑</div>
        <h2 className="text-white font-black text-2xl text-center">توقف أو اكمل!</h2>
        <div className="bg-white/5 rounded-2xl p-5 space-y-4 w-full max-w-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500 flex-shrink-0 shadow-lg shadow-green-500/40" />
            <p className="text-white/70 text-sm">أخضر ← اضغط بسرعة!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500 flex-shrink-0 shadow-lg shadow-red-500/40" />
            <p className="text-white/70 text-sm">أحمر ← لا تضغط!</p>
          </div>
        </div>
        <button
          onClick={() => { startRef.current = Date.now(); runTrial(0) }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  // ── Result screen ────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-400">{goHitsRef.current}</div>
            <div className="text-xs text-white/40">اضغط ✓</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-400">{stopOkRef.current}</div>
            <div className="text-xs text-white/40">توقف ✓</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-orange-400">{goMissRef.current}</div>
            <div className="text-xs text-white/40">فائتة</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-red-400">{stopErrRef.current}</div>
            <div className="text-xs text-white/40">اندفاع</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-4xl">{result.score}%</div>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  // ── Active game ────────────────────────────────────────────
  const bgClass = phase === 'go'   ? 'bg-gray-950' :
                  phase === 'stop' ? 'bg-gray-950' :
                  fb === 'hit'     ? 'bg-green-950/40' :
                  fb === 'stop-err'? 'bg-red-950/40'   :
                  fb === 'miss'    ? 'bg-orange-950/30' :
                  'bg-gray-900/50'

  return (
    <div className="flex flex-col h-full select-none">
      {/* Progress */}
      <div className="px-6 py-3">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">{trial + 1} / {TOTAL}</span>
          <span className="text-green-400 text-xs font-bold">{goHitsRef.current + stopOkRef.current} صحيح</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${(trial / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Game arena */}
      <div
        onClick={handleTap}
        className={`relative flex-1 mx-4 mb-4 rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-colors duration-100 ${bgClass}`}
        style={{ minHeight: 360 }}
      >
        {phase === 'wait' && (
          <>
            <div className="w-10 h-10 rounded-full border-4 border-white/15" />
            <p className="text-white/20 font-bold text-lg mt-3">انتظر...</p>
          </>
        )}

        {phase === 'go' && (
          <>
            <div className="w-36 h-36 rounded-full bg-green-500 shadow-2xl shadow-green-500/50 flex items-center justify-center text-5xl active:scale-90 transition-transform" />
            <p className="text-green-400 font-black text-2xl mt-4">اضغط!</p>
          </>
        )}

        {phase === 'stop' && (
          <>
            <div className="w-36 h-36 rounded-full bg-red-500 shadow-2xl shadow-red-500/50 flex items-center justify-center text-5xl" />
            <p className="text-red-400 font-black text-2xl mt-4">توقف!</p>
          </>
        )}

        {/* Feedback overlay */}
        {fb && (
          <div className="absolute bottom-5 text-sm font-bold">
            {fb === 'hit'      && <span className="text-green-400">✓ ممتاز!</span>}
            {fb === 'stop-ok'  && <span className="text-blue-400">✓ تحكم رائع!</span>}
            {fb === 'stop-err' && <span className="text-red-400">✗ كان يجب التوقف!</span>}
            {fb === 'miss'     && <span className="text-orange-400">⏰ كان يجب الضغط!</span>}
          </div>
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
