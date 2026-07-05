'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { formatTime } from '@/lib/session-helpers'

const DONE_MESSAGES = [
  { emoji: '🌟', text: 'أحسنت! انتهى الوقت' },
  { emoji: '🎉', text: 'رائع! أكملت الوقت' },
  { emoji: '🏆', text: 'ممتاز! انتهى الوقت' },
  { emoji: '⭐', text: 'بطل! انتهى الوقت' },
]

// Synthesize a cheerful applause-like burst using Web Audio API
function playApplause() {
  try {
    const ctx = new AudioContext()
    const duration = 1.8
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
    const data = buf.getChannelData(0)
    // White noise shaped with an envelope that mimics a clap burst then fade
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate
      // Three overlapping clap peaks
      const env =
        Math.exp(-12 * (t - 0.05) ** 2) +
        Math.exp(-12 * (t - 0.55) ** 2) * 0.75 +
        Math.exp(-12 * (t - 1.0) ** 2) * 0.55 +
        Math.exp(-6  * (t - 1.5) ** 2) * 0.35
      data[i] = (Math.random() * 2 - 1) * env * 0.45
    }
    // Bright tone for festivity
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start()
    src.onended = () => ctx.close()
  } catch {}
}

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
  const [stars, setStars] = useState<{ id: number; x: number; y: number; rot: number; scale: number }[]>([])
  const applauseFiredRef = useRef(false)

  // Draggable — direct DOM manipulation during drag for 60fps.
  // posRef is the single source of truth; a tiny counter triggers a re-render
  // after pointer-up so posStyle (which reads posRef) reflects the final position.
  const [, forceUpdate] = useState(0)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const posRef = useRef<{ x: number; y: number } | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    const el = widgetRef.current
    if (el) {
      // Snapshot current rendered position so drag starts from exact visual pos
      const rect = el.getBoundingClientRect()
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      posRef.current = { x: rect.left, y: rect.top }
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !widgetRef.current) return
    const el = widgetRef.current
    const x = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - dragOffset.current.x))
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - dragOffset.current.y))
    // Direct DOM update — bypasses React re-render entirely for 60fps
    el.style.left      = `${x}px`
    el.style.top       = `${y}px`
    el.style.bottom    = 'auto'
    el.style.transform = 'none'
    posRef.current = { x, y }
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    // One forced re-render so posStyle picks up posRef.current permanently
    if (posRef.current) forceUpdate(n => n + 1)
  }, [])

  // Flash border + celebration when finished
  useEffect(() => {
    if (isDone) {
      // One-shot applause + star burst
      if (!applauseFiredRef.current) {
        applauseFiredRef.current = true
        playApplause()
        setStars(
          Array.from({ length: 9 }, (_, i) => ({
            id: i,
            x: 30 + Math.random() * 40,
            y: 15 + Math.random() * 55,
            rot: Math.random() * 360,
            scale: 0.8 + Math.random() * 0.8,
          }))
        )
        setTimeout(() => setStars([]), 2200)
      }
      const id = setInterval(() => setFlash((f: boolean) => !f), 400)
      return () => clearInterval(id)
    } else {
      applauseFiredRef.current = false
      setFlash(false)
      setStars([])
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

  // posRef is always current — safe to read during React re-renders (timer ticks)
  // without posRef, React would re-apply the old pos state and snap the widget
  const posStyle: React.CSSProperties = posRef.current
    ? { left: posRef.current.x, top: posRef.current.y, bottom: 'auto', transform: 'none' }
    : { bottom: 80, left: '50%', transform: 'translateX(-50%)' }

  return (
    <>
    <style>{`
      @keyframes starPop {
        0%   { opacity: 0; transform: scale(0) rotate(var(--r, 0deg)); }
        30%  { opacity: 1; transform: scale(1.4) rotate(var(--r, 0deg)); }
        70%  { opacity: 1; transform: scale(1) rotate(var(--r, 0deg)); }
        100% { opacity: 0; transform: scale(0.6) translateY(-20px) rotate(var(--r, 0deg)); }
      }
    `}</style>
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
        cursor: 'grab',
        touchAction: 'none',
        willChange: 'left, top',
      }}
    >
      {/* ── Celebration star burst ── */}
      {stars.map((s: { id: number; x: number; y: number; rot: number; scale: number }) => (
        <div
          key={s.id}
          className="pointer-events-none absolute text-lg"
          style={{
            left:      `${s.x}%`,
            top:       `${s.y}%`,
            animation: 'starPop 2s ease-out forwards',
            zIndex: 10,
          }}
        >
          ⭐
        </div>
      ))}

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
    </>
  )
}
