'use client'
// Small pure helpers and self-contained UI bits shared by the in-session
// player (app/session/[id]/page.tsx). Extracted out of page.tsx to keep
// that file focused on session state/behavior.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

// Renders dropdown panels via a portal so the toolbar's overflow-x-auto
// (which forces overflow-y to clip too, per the CSS overflow spec) never hides them.
export function ToolbarPopover({ anchorRef, open, onClose, children }: { anchorRef: React.RefObject<HTMLElement | null>; open: boolean; onClose?: () => void; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !anchorRef.current) { setPos(null); return }
    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef])

  // Click/tap outside the popover (and its toggle button) or pressing Escape
  // dismisses it — without this, the only way to close a popover was to
  // re-click its own toggle or pick an item, even though it can visually sit
  // on top of other clickable UI (e.g. the exercises sidebar).
  useEffect(() => {
    if (!open || !onClose) return
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointer, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, anchorRef])

  if (!open || !pos || typeof document === 'undefined') return null
  return createPortal(
    <div ref={popoverRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}>
      {children}
    </div>,
    document.body
  )
}

export type SoundType = 'success' | 'complete' | 'start' | 'phase' | 'tick' | 'ding' | 'compare' | 'abc' | 'star-up'

export function playSound(type: SoundType) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const g = ctx.createGain()
    g.connect(ctx.destination)

    if (type === 'success') {
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.frequency.setValueAtTime(523, ctx.currentTime)
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      o.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4)

    } else if (type === 'complete') {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.3)
      })

    } else if (type === 'start') {
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.value = 440
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2)

    } else if (type === 'phase') {
      // Gong-like tone for phase transition
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.setValueAtTime(660, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.6)
      g.gain.setValueAtTime(0.35, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8)

    } else if (type === 'tick') {
      // Countdown tick
      const o = ctx.createOscillator(); o.connect(g); o.type = 'square'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.05)

    } else if (type === 'ding') {
      // Timer done — rising bell
      const notes = [659, 784, 988, 1319]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25)
        o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + i * 0.08 + 0.3)
      })

    } else if (type === 'compare') {
      // Improvement fanfare — major chord
      const chord = [523, 659, 784]
      chord.forEach(freq => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'triangle'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.7)
      })

    } else if (type === 'abc') {
      // Soft click — ABC entry saved
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.value = 300
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1)

    } else if (type === 'star-up') {
      // Rising 5-note arpeggio — "level up" feeling
      const notes = [523, 659, 784, 1047, 1319]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.connect(g)
        o.type = i === notes.length - 1 ? 'sine' : 'triangle'
        o.frequency.value = freq
        const t = ctx.currentTime + i * 0.09
        g.gain.setValueAtTime(i === notes.length - 1 ? 0.32 : 0.22, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + (i === notes.length - 1 ? 0.55 : 0.18))
        o.start(t); o.stop(t + (i === notes.length - 1 ? 0.6 : 0.2))
      })
    }
  } catch { /* AudioContext blocked */ }
}

export function ScoreBar({ score, color = 'bg-brand-500' }: { score: number; color?: string }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}
