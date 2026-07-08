'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface Dot { x: number; y: number; dx: number; dy: number; isTarget: boolean; id: number }

export default function TargetTracking({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const DURATION = difficulty === 1 ? 20 : difficulty === 2 ? 30 : 40
  const SPEED    = difficulty === 1 ? 1.5 : difficulty === 2 ? 2 : 2.8
  const W = 340, H = 300

  const [dots,      setDots]      = useState<Dot[]>([])
  const [hits,      setHits]      = useState(0)
  const [falseTaps, setFalseTaps] = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(DURATION)
  const [started,   setStarted]   = useState(false)
  const [startMs]                 = useState(Date.now())
  const rafRef   = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotsRef  = useRef<Dot[]>([])
  const hitsRef  = useRef(0)
  const falseRef = useRef(0)
  const doneRef  = useRef(false)

  const initDots = useCallback(() => {
    const count = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
    const ds: Dot[] = Array.from({ length: count }, (_, i) => ({
      id: i, isTarget: i === 0,
      x: 40 + rng() * (W - 80),
      y: 40 + rng() * (H - 80),
      dx: (rng() - 0.5) * SPEED * 2,
      dy: (rng() - 0.5) * SPEED * 2,
    }))
    dotsRef.current = ds
    setDots(ds)
  }, [SPEED, difficulty])

  function tick() {
    dotsRef.current = dotsRef.current.map(d => {
      let x = d.x + d.dx, y = d.y + d.dy
      let dx = d.dx, dy = d.dy
      if (x < 20 || x > W - 20) { dx = -dx; x = Math.max(20, Math.min(W - 20, x)) }
      if (y < 20 || y > H - 20) { dy = -dy; y = Math.max(20, Math.min(H - 20, y)) }
      return { ...d, x, y, dx, dy }
    })
    setDots([...dotsRef.current])
    rafRef.current = requestAnimationFrame(tick)
  }

  function start() {
    setStarted(true)
    initDots()
    rafRef.current = requestAnimationFrame(tick)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t <= 1 ? 0 : t - 1)
    }, 1000)
  }

  function stopGame() {
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    const h = hitsRef.current, f = falseRef.current
    const total = dotsRef.current.filter(d => d.isTarget).length
    const score = Math.max(0, Math.round(((h - f) / Math.max(h + 5, 1)) * 100))
    onComplete({
      exerciseType:    'target-tracking',
      exerciseLabelAr: 'تتبع الهدف',
      score, accuracy: score,
      duration: Math.round((Date.now() - startMs) / 1000),
      errors:   f,
      metadata: { hits: h, falseTaps: f, difficulty },
      completedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (timeLeft === 0 && started && !doneRef.current) {
      doneRef.current = true
      stopGame()
    }
  }, [timeLeft, started]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  function handleTap(dot: Dot) {
    if (dot.isTarget) {
      hitsRef.current++
      setHits(hitsRef.current)
    } else {
      falseRef.current++
      setFalseTaps(falseRef.current)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-amber-400">{timeLeft}s</div>
          <div className="text-xs text-white/50">الوقت</div>
        </div>
        <h2 className="text-xl font-black text-white">تتبع الهدف</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{hits}</div>
          <div className="text-xs text-white/50">ضربات</div>
        </div>
      </div>

      {!started ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/70 text-center text-sm max-w-xs leading-relaxed">
            اضغط على النجمة <span className="text-3xl">🌟</span> فقط!<br />
            لا تضغط على الدوائر الحمراء 🔴
          </div>
          <button onClick={start}
            className="px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-lg transition-all active:scale-95">
            ابدأ
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden"
          style={{ width: W, height: H, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
          {dots.map(dot => (
            <button key={dot.id} onClick={() => handleTap(dot)}
              style={{ position: 'absolute', left: dot.x - 20, top: dot.y - 20, width: 40, height: 40,
                fontSize: 30, lineHeight: '40px', textAlign: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              {dot.isTarget ? '🌟' : '🔴'}
            </button>
          ))}
          {/* Time bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
            background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', width: '100%', background: '#22C55E', transition: 'transform 1s linear',
              transform: `scaleX(${timeLeft / DURATION})`, transformOrigin: 'left' }} />
          </div>
        </div>
      )}

      {started && (
        <div className="text-xs text-white/40 flex gap-4">
          <span>🌟 نجم: {hits}</span>
          <span>🔴 خطأ: {falseTaps}</span>
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
