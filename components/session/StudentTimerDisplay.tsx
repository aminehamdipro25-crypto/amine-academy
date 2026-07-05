'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
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

  // Draggable position — null means "use default bottom-center"
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from the handle (top strip), not the buttons
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const newX = e.clientX - dragOffset.current.x
    const newY = e.clientY - dragOffset.current.y
    // Clamp inside viewport
    const w = widgetRef.current?.offsetWidth  ?? 210
    const h = widgetRef.current?.offsetHeight ?? 160
    setPos({
      x: Math.max(0, Math.min(window.innerWidth  - w, newX)),
      y: Math.max(0, Math.min(window.innerHeight - h, newY)),
    })
  }, [])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  // Flash border when finished
  useEffect(() => {
    if (isDone) {
      const id = setInterval(() => setFlash((f: boolean) => !f), 400)
      return () => clearInterval(id)
    } else {
      setFlash(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, total, countUp])

  const pct     = left / total
  const isDone  = countUp ? left >= total : left === 0

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

  // Inline position style — fixed coords when dragged, default bottom-center otherwise
  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto', transform: 'none' }
    : { bottom: 80, left: '50%', transform: 'translateX(-50%)' }

  return (
    <div
      ref={widgetRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-[150] flex flex-col items-center justify-center select-none"
      style={{
        ...posStyle,
        background: 'rgba(0,0,0,0.88)',
        borderRadius: 24,
        backdropFilter: 'blur(12px)',
        border: `2px solid ${borderColor}88`,
        boxShadow: `0 0 40px ${borderColor}22`,
        minWidth: 210,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: dragging.current ? 'grabbing' : 'grab',
      }}
    >
      {/* ── Drag handle strip ── */}
      <div
        className="w-full flex items-center justify-center pb-1 pt-3 px-4"
        style={{ cursor: 'grab' }}
      >
        <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
      </div>

      <div className="px-8 pb-4 flex flex-col items-center">
        {isDone ? (
          /* ── Done: celebration ── */
          <div className="flex flex-col items-center gap-1">
            <div style={{ fontSize: '3rem', lineHeight: 1 }}>{doneMsg.emoji}</div>
            <div className="text-white font-black text-lg mt-1">{doneMsg.text}</div>
          </div>
        ) : (
          /* ── Counting ── */
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
            <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pct * 100}%`, background: numColor }}
              />
            </div>
            {!countUp && pct <= 0.1 && left > 0 && (
              <div className="text-red-400 font-black text-xs mt-1 animate-pulse">يوشك الوقت على الانتهاء!</div>
            )}
            {countUp && (
              <div className="text-gray-400 text-[10px] mt-1">الوقت المنقضي</div>
            )}
          </>
        )}

        {/* Controls */}
        <div className="mt-3 flex gap-2">
          {!isDone && (
            <button
              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              onClick={onToggleRunning}
              className="text-white/60 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {running ? '⏸ توقف' : '▶ استئناف'}
            </button>
          )}
          <button
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
            onClick={onReset}
            className="text-white/60 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            ↺ إعادة
          </button>
          <button
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
            onClick={onClose}
            className="text-white/30 hover:text-white text-xs px-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
