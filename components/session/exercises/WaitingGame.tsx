'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, pickWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

const REWARD_EMOJIS = ['🌟', '⭐', '🏆', '🎯', '🎈']
const TOTAL_ROUNDS = 5
const FADE_DURATION = 2000   // ms to go from opacity 0 → 1
const TAP_WINDOW = 3000      // ms after fully visible to tap
const READY_THRESHOLD = 0.85 // opacity considered "ready"

type RoundPhase = 'waiting' | 'fading' | 'ready' | 'result'
type RoundResult = 'hit' | 'early' | 'miss'

function getDelayRange(difficulty: 1|2|3): [number, number] {
  if (difficulty === 1) return [1000, 2000]
  if (difficulty === 2) return [1500, 3000]
  return [2000, 4000]
}

function randomDelay(rng: Rng, difficulty: 1|2|3): number {
  const [min, max] = getDelayRange(difficulty)
  return min + rng() * (max - min)
}

export default function WaitingGame({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<RoundPhase>('waiting')
  const [opacity, setOpacity] = useState(0)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [hits, setHits] = useState(0)
  const [earlyTaps, setEarlyTaps] = useState(0)
  const [misses, setMisses] = useState(0)
  const [emoji] = useState<string[]>(() =>
    Array.from({ length: TOTAL_ROUNDS }, () => pickWithRng(rng, REWARD_EMOJIS))
  )

  const startRef = useRef(Date.now())
  const fadeStartRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opacityRef = useRef(0)
  const phaseRef = useRef<RoundPhase>('waiting')

  const clearTimers = () => {
    if (delayTimerRef.current) { clearTimeout(delayTimerRef.current); delayTimerRef.current = null }
    if (windowTimerRef.current) { clearTimeout(windowTimerRef.current); windowTimerRef.current = null }
    if (resultTimerRef.current) { clearTimeout(resultTimerRef.current); resultTimerRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }

  useEffect(() => () => clearTimers(), [])

  const finishRound = useCallback((result: RoundResult, newHits: number, newEarly: number, newMisses: number, currentRound: number) => {
    clearTimers()
    setOpacity(0)
    opacityRef.current = 0
    setPhase('result')
    phaseRef.current = 'result'
    setLastResult(result)

    resultTimerRef.current = setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        const score = Math.round((newHits / TOTAL_ROUNDS) * 100)
        onComplete({
          exerciseType: 'waiting-game',
          exerciseLabelAr: 'لعبة الانتظار',
          score,
          accuracy: score,
          duration: Math.round((Date.now() - startRef.current) / 1000),
          errors: newEarly + newMisses,
          metadata: { hits: newHits, early_taps: newEarly, misses: newMisses },
          completedAt: new Date().toISOString(),
        })
      } else {
        const next = currentRound + 1
        setRound(next)
        setLastResult(null)
        setPhase('waiting')
        phaseRef.current = 'waiting'
      }
    }, 1200)
  }, [onComplete])

  const startFade = useCallback((currentRound: number, currentHits: number, currentEarly: number, currentMisses: number) => {
    setPhase('fading')
    phaseRef.current = 'fading'
    setOpacity(0)
    opacityRef.current = 0
    fadeStartRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - fadeStartRef.current
      const newOp = Math.min(1, elapsed / FADE_DURATION)
      opacityRef.current = newOp
      setOpacity(newOp)

      if (newOp < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Fully visible — enter ready window
        setPhase('ready')
        phaseRef.current = 'ready'
        windowTimerRef.current = setTimeout(() => {
          // Timeout — miss
          const newMisses = currentMisses + 1
          setMisses(newMisses)
          finishRound('miss', currentHits, currentEarly, newMisses, currentRound)
        }, TAP_WINDOW)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [finishRound])

  // Start each round's delay countdown
  useEffect(() => {
    if (phase === 'waiting') {
      const delay = randomDelay(rng, difficulty)
      delayTimerRef.current = setTimeout(() => {
        startFade(round, hits, earlyTaps, misses)
      }, delay)
    }
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase])

  function handleTap() {
    // Guard on the synchronous phaseRef, not the async `phase` state: two taps
    // in the same React batch both read stale `phase` and each call finishRound
    // → double onComplete. finishRound flips phaseRef to 'result' immediately,
    // so the second same-tick tap sees 'result' here and bails.
    const ph = phaseRef.current
    if (ph === 'waiting') return // before emoji appears — ignore
    if (ph === 'result') return

    if (ph === 'fading') {
      if (opacityRef.current < READY_THRESHOLD) {
        // Early tap
        const newEarly = earlyTaps + 1
        setEarlyTaps(newEarly)
        finishRound('early', hits, newEarly, misses, round)
      } else {
        // Close enough — treat as hit
        const newHits = hits + 1
        setHits(newHits)
        finishRound('hit', newHits, earlyTaps, misses, round)
      }
      return
    }

    if (ph === 'ready') {
      const newHits = hits + 1
      setHits(newHits)
      finishRound('hit', newHits, earlyTaps, misses, round)
    }
  }

  // Derive ring fill from opacity (0→360 degrees)
  const ringDegrees = Math.round(opacity * 360)
  const ringProgress = Math.min(100, Math.round(opacity * 100))

  // SVG circular progress
  const RADIUS = 72
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const strokeDashoffset = CIRCUMFERENCE * (1 - opacity)

  const currentEmoji = emoji[round - 1] ?? '🌟'

  const resultConfig: Record<RoundResult, { text: string; color: string }> = {
    hit:   { text: 'ممتاز! ✅',       color: 'text-green-400' },
    early: { text: 'مبكر جداً! 🚫',   color: 'text-red-400' },
    miss:  { text: 'فاتتك! ⏰',        color: 'text-orange-400' },
  }

  return (
    <div className="flex flex-col h-full select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="text-center">
          <div className="text-xs text-white/40 mb-0.5">الجولة</div>
          <div className="text-xl font-black text-brand-400">{round} / {TOTAL_ROUNDS}</div>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-xs text-white/40">نجاح</div>
            <div className="text-lg font-black text-green-400">{hits}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">مبكر</div>
            <div className="text-lg font-black text-red-400">{earlyTaps}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">فاتت</div>
            <div className="text-lg font-black text-orange-400">{misses}</div>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-white/30 hover:text-white/60 text-sm transition-colors px-2 py-1"
        >
          ✕
        </button>
      </div>

      {/* Main arena */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 cursor-pointer"
        onClick={handleTap}
      >
        {/* Instruction badge */}
        <div className={[
          'px-5 py-2 rounded-full font-black text-base transition-all duration-300',
          phase === 'waiting'
            ? 'bg-white/10 text-white/50'
            : phase === 'fading'
            ? 'bg-yellow-500/20 text-yellow-400 animate-pulse'
            : phase === 'ready'
            ? 'bg-green-500/30 text-green-300 scale-110 shadow-lg shadow-green-500/30'
            : lastResult
            ? resultConfig[lastResult].color + ' bg-white/10'
            : 'bg-white/10 text-white/50',
        ].join(' ')}>
          {phase === 'waiting' && 'انتظر...'}
          {phase === 'fading' && 'انتظر...'}
          {phase === 'ready' && 'الآن! 👆'}
          {phase === 'result' && lastResult && resultConfig[lastResult].text}
        </div>

        {/* Circular progress ring + emoji */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          {/* SVG ring */}
          <svg
            width="200"
            height="200"
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            {/* Progress */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={phase === 'ready' ? '#22c55e' : phase === 'result' && lastResult === 'hit' ? '#22c55e' : '#7c3aed'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={phase === 'result' && lastResult === 'hit' ? 0 : strokeDashoffset}
              style={{ transition: 'stroke 0.3s ease' }}
            />
          </svg>

          {/* Emoji */}
          <span
            style={{
              fontSize: '8rem',
              lineHeight: 1,
              opacity: phase === 'waiting' ? 0 : phase === 'result' ? (lastResult === 'hit' ? 1 : 0.3) : opacity,
              transition: phase === 'result' ? 'opacity 0.3s ease' : 'none',
              userSelect: 'none',
            }}
          >
            {currentEmoji}
          </span>
        </div>

        {/* Progress percentage */}
        {(phase === 'fading' || phase === 'ready') && (
          <div className="text-white/40 text-sm font-bold">
            {ringProgress}%
          </div>
        )}

        {/* Tap hint */}
        {phase === 'waiting' && (
          <p className="text-white/30 text-sm text-center px-8">
            انتظر حتى يظهر الرمز بالكامل ثم اضغط!
          </p>
        )}
      </div>

      {/* Round progress bar */}
      <div className="px-6 pb-5">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
            const isHit = i < round - 1 ? true : false
            const isCurrent = i === round - 1
            return (
              <div
                key={i}
                className={[
                  'flex-1 h-2 rounded-full transition-all',
                  isCurrent
                    ? 'bg-brand-500'
                    : i < round - 1
                    ? 'bg-white/20'
                    : 'bg-white/8',
                ].join(' ')}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
