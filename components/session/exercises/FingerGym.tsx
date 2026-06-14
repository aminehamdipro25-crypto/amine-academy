'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function FingerGym({ onComplete, onCancel, difficulty = 1 }: Props) {
  const BEAT_MS    = difficulty === 1 ? 1500 : difficulty === 2 ? 1000 : 700
  const TOTAL_BEATS= difficulty === 1 ? 8 : difficulty === 2 ? 12 : 15
  const WINDOW_MS  = 300

  const [phase,     setPhase]     = useState<'ready'|'playing'|'done'>('ready')
  const [beatIdx,   setBeatIdx]   = useState(0)
  const [lit,       setLit]       = useState(false)
  const [accurate,  setAccurate]  = useState(0)
  const [missed,    setMissed]    = useState(0)
  const [startMs]                 = useState(Date.now())
  const beatTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const litRef      = useRef(false)
  const beatIdxRef  = useRef(0)
  const accurateRef = useRef(0)
  const missedRef   = useRef(0)

  function startGame() {
    setPhase('playing')
    beatIdxRef.current  = 0
    accurateRef.current = 0
    missedRef.current   = 0
    setBeatIdx(0)
    setAccurate(0)
    setMissed(0)

    intervalRef.current = setInterval(() => {
      const cur = beatIdxRef.current
      if (cur >= TOTAL_BEATS) {
        clearInterval(intervalRef.current!)
        const acc  = accurateRef.current
        const miss = missedRef.current + (litRef.current ? 1 : 0) // unpressed beat
        const score = Math.round((acc / TOTAL_BEATS) * 100)
        setPhase('done')
        onComplete({
          exerciseType:    'finger-gym',
          exerciseLabelAr: 'جمباز الأصابع',
          score, accuracy: score,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   miss,
          metadata: { accurate: acc, missed: miss, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      // Miss previous beat if user didn't tap
      if (litRef.current) {
        missedRef.current++
        setMissed(missedRef.current)
      }
      litRef.current = true
      beatTimeRef.current = Date.now()
      setLit(true)
      setBeatIdx(cur)
      beatIdxRef.current++

      setTimeout(() => {
        if (litRef.current) {
          litRef.current = false
          setLit(false)
        }
      }, BEAT_MS * 0.6)
    }, BEAT_MS)
  }

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  function handleTap() {
    if (phase !== 'playing') return
    const diff = Date.now() - beatTimeRef.current
    if (litRef.current && diff <= WINDOW_MS) {
      accurateRef.current++
      setAccurate(accurateRef.current)
      litRef.current = false
      setLit(false)
    }
    // else: early/late tap — no penalty, just miss
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{Math.min(beatIdx, TOTAL_BEATS)}/{TOTAL_BEATS}</div>
          <div className="text-xs text-white/50">إيقاعة</div>
        </div>
        <h2 className="text-xl font-black text-white">جمباز الأصابع</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{accurate}</div>
          <div className="text-xs text-white/50">دقيق</div>
        </div>
      </div>

      {phase === 'ready' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/70 text-center text-sm max-w-xs">
            اضغط الطبلة بالضبط عند كل وميض! حاول أن تكون في الوقت المناسب.
          </div>
          <button onClick={startGame}
            className="px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-lg transition-all active:scale-95">
            ابدأ 🥁
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <button onClick={handleTap}
            className="rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 180, height: 180, fontSize: 90,
              background: lit ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.05)',
              border: `4px solid ${lit ? '#7C5CFC' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: lit ? '0 0 60px #7C5CFC88' : 'none',
              transition: 'all 0.1s',
            }}>
            🥁
          </button>
          <div className="text-white/50 text-sm">
            دقيق: {accurate} | فائت: {missed}
          </div>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
