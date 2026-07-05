'use client'
import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/session-helpers'

const DONE_MESSAGES = [
  { emoji: '🌟', text: 'أحسنت! انتهى الوقت' },
  { emoji: '🎉', text: 'رائع! أكملت الوقت' },
  { emoji: '🏆', text: 'ممتاز! انتهى الوقت' },
  { emoji: '⭐', text: 'بطل! انتهى الوقت' },
]

export default function StudentTimerDisplay({
  left,
  total,
  running,
  countUp = false,
  onToggleRunning,
  onReset,
  onClose,
}: {
  left: number
  total: number
  running: boolean
  countUp?: boolean
  onToggleRunning: () => void
  onReset: () => void
  onClose: () => void
}) {
  const [doneMsg] = useState(() => DONE_MESSAGES[Math.floor(total / 30) % DONE_MESSAGES.length])
  const [flash, setFlash] = useState(false)

  // Flash border when finished
  useEffect(() => {
    if (left === 0) {
      const id = setInterval(() => setFlash((f: boolean) => !f), 400)
      return () => clearInterval(id)
    } else {
      setFlash(false)
    }
  }, [left])

  const pct = countUp ? left / total : left / total
  const isDone = countUp ? left >= total : left === 0

  // countUp: always green — non-anxious upward progress
  const borderColor = isDone
    ? (flash ? '#22C55E' : '#EF4444')
    : countUp ? '#22C55E'
    : pct <= 0.1 ? '#EF4444'
    : pct <= 0.25 ? '#F59E0B'
    : '#22C55E'

  const numColor = countUp ? '#22C55E'
    : pct <= 0.1 ? '#EF4444'
    : pct <= 0.25 ? '#F59E0B'
    : '#22C55E'

  return (
    <div
      className="fixed z-[150] flex flex-col items-center justify-center pointer-events-none select-none"
      style={{
        bottom: 80, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.88)',
        borderRadius: 24,
        padding: '16px 32px',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${borderColor}88`,
        boxShadow: `0 0 40px ${borderColor}22`,
        minWidth: 210,
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {isDone ? (
        /* ── Done state: celebration ── */
        <div className="flex flex-col items-center gap-1">
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>{doneMsg.emoji}</div>
          <div className="text-white font-black text-lg mt-1">{doneMsg.text}</div>
        </div>
      ) : (
        /* ── Counting state ── */
        <>
          <div
            className="font-black ltr-num"
            style={{
              fontSize: '3.5rem',
              color: numColor,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em',
              transition: 'color 0.5s',
            }}
          >
            {formatTime(left)}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct * 100}%`, background: numColor }}
            />
          </div>
          {/* Last 10s urgent label (countdown only) */}
          {!countUp && pct <= 0.1 && left > 0 && (
            <div className="text-red-400 font-black text-xs mt-1 animate-pulse">يوشك الوقت على الانتهاء!</div>
          )}
          {/* CountUp mode label */}
          {countUp && (
            <div className="text-gray-400 text-[10px] mt-1">الوقت المنقضي</div>
          )}
        </>
      )}

      {/* Controls */}
      <div className="pointer-events-auto mt-3 flex gap-2">
        {!isDone && (
          <button
            onClick={onToggleRunning}
            className="text-white/60 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {running ? '⏸ توقف' : '▶ استئناف'}
          </button>
        )}
        <button
          onClick={onReset}
          className="text-white/60 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          ↺ إعادة
        </button>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white text-xs px-2 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
