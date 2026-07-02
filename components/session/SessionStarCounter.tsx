'use client'
import { useEffect, useRef, useState } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { computeSessionStars, starsFromResult, computeVsYesterday } from '@/lib/session-adaptive'

export default function SessionStarCounter({
  running,
  results,
  gameHistoryByGame,
  kidMode,
}: {
  running: boolean
  results: ExerciseResult[]
  gameHistoryByGame: Record<string, { plays: number; avgScore: number }>
  kidMode: boolean
}) {
  const stars         = computeSessionStars(results)
  const prevResultsRef = useRef<ExerciseResult[]>([])
  const [newStars, setNewStars]   = useState(0)
  const [burst, setBurst]         = useState(false)
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect newly earned stars after each exercise completion
  useEffect(() => {
    if (results.length <= prevResultsRef.current.length) {
      prevResultsRef.current = results
      return
    }
    const latest = results[results.length - 1]
    const earned = starsFromResult(latest.score)
    if (earned > 0) {
      setNewStars(earned)
      setBurst(true)
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
      burstTimerRef.current = setTimeout(() => {
        setBurst(false)
        setNewStars(0)
      }, 2200)
    }
    prevResultsRef.current = results
  }, [results])

  const vsHist = computeVsYesterday(results, gameHistoryByGame)

  if (!running || results.length === 0) return null

  // In kid mode, render a prominent centered star counter
  if (kidMode) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] pointer-events-none" dir="rtl">
        <div
          className="flex items-center gap-2 rounded-2xl px-5 py-3 shadow-xl"
          style={{
            background: 'linear-gradient(135deg,#111827,#1F2937)',
            border: '2px solid rgba(251,191,36,0.4)',
            boxShadow: burst ? '0 0 24px rgba(251,191,36,0.6)' : '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <span className="text-2xl font-black text-amber-400 ltr-num">{stars}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(stars, 10) }).map((_, i) => (
              <span key={i} className="text-lg leading-none">⭐</span>
            ))}
            {stars > 10 && <span className="text-amber-400 text-xs font-black">+{stars - 10}</span>}
          </div>
          {burst && newStars > 0 && (
            <div
              className="text-amber-300 font-black text-sm"
            >
              +{newStars === 2 ? '⭐⭐' : '⭐'}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Specialist mode: compact star pill in the corner
  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      <span className="text-amber-400 font-black text-xs ltr-num">{stars}</span>
      <span className="text-xs">⭐</span>
      {vsHist && Math.abs(vsHist.diff) >= 3 && (
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{
            background: vsHist.better ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            color: vsHist.better ? '#22C55E' : '#EF4444',
          }}
        >
          {vsHist.better ? '+' : ''}{vsHist.diff}% {vsHist.better ? '🔥' : ''}
        </span>
      )}
    </div>
  )
}
