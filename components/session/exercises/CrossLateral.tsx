'use client'
// Cross-lateral midline crossing exercise — core intervention for dyslexia,
// bilateral coordination deficits, and sensory-motor integration disorders.
// Web adaptation of the OpenCV/MediaPipe pose-based concept: instead of camera
// tracking, the child physically reaches across the midline to tap targets on
// a touchscreen or with a mouse, producing the same therapeutic crossing motion.
import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  onComplete: (r: {
    score: number; errors: number; duration: number
    accuracy: number; metadata: Record<string, unknown>
  }) => void
  onCancel: () => void
  difficulty?: 1 | 2 | 3
}

const CFG = {
  1: { rounds: 8,  timeoutMs: 3500, label: '8 جولات — 3.5 ثانية/جولة' },
  2: { rounds: 12, timeoutMs: 2500, label: '12 جولة — 2.5 ثانية/جولة' },
  3: { rounds: 16, timeoutMs: 1800, label: '16 جولة — 1.8 ثانية/جولة' },
} as const

// Which hand to use based on target side
// Target on RIGHT → use LEFT hand (crosses midline) and vice versa
const HAND_LABELS: Record<'L' | 'R', string> = {
  R: '← المس بيدك اليسرى',
  L: 'المس بيدك اليمنى →',
}
const HAND_COLORS: Record<'L' | 'R', string> = {
  R: '#7C5CFC', // purple — right side / left hand
  L: '#3B82F6', // blue  — left  side / right hand
}

function rng(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }

export default function CrossLateral({ onComplete, onCancel, difficulty = 1 }: Props) {
  const cfg = CFG[difficulty]

  const [phase, setPhase]         = useState<'intro' | 'playing'>('intro')
  const [round, setRound]         = useState(0)
  const [side, setSide]           = useState<'L' | 'R'>('R')
  const [pos, setPos]             = useState({ x: 75, y: 50 })
  const [feedback, setFeedback]   = useState<'hit' | 'miss' | null>(null)
  const [hitsDisplay, setHitsDisplay] = useState(0)

  const startRef  = useRef(Date.now())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef   = useRef(false)
  const hitsRef   = useRef(0)
  const missRef   = useRef(0)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const advance = useCallback((nextRound: number) => {
    if (doneRef.current) return

    if (nextRound >= cfg.rounds) {
      doneRef.current = true
      const accuracy = Math.round((hitsRef.current / cfg.rounds) * 100)
      onComplete({
        score:    accuracy,
        accuracy,
        errors:   missRef.current,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        metadata: {
          hits:   hitsRef.current,
          misses: missRef.current,
          rounds: cfg.rounds,
          technique: 'cross-lateral-tap',
        },
      })
      return
    }

    // Alternate sides so every tap crosses the midline
    const nextSide: 'L' | 'R' = nextRound % 2 === 0 ? 'R' : 'L'
    const x = nextSide === 'R' ? rng(60, 88) : rng(12, 40)
    const y = rng(20, 78)

    setRound(nextRound)
    setSide(nextSide)
    setPos({ x, y })
    setFeedback(null)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      missRef.current += 1
      setFeedback('miss')
      timerRef.current = setTimeout(() => advance(nextRound + 1), 650)
    }, cfg.timeoutMs)
  }, [cfg, onComplete])

  function handleHit() {
    if (feedback !== null) return
    if (timerRef.current) clearTimeout(timerRef.current)
    hitsRef.current += 1
    setHitsDisplay(hitsRef.current)
    setFeedback('hit')
    timerRef.current = setTimeout(() => advance(round + 1), 420)
  }

  function start() {
    doneRef.current = false
    hitsRef.current = 0
    missRef.current = 0
    startRef.current = Date.now()
    setHitsDisplay(0)
    setPhase('playing')
    advance(0)
  }

  // ── INTRO ────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 p-6" dir="rtl">
        <div style={{ fontSize: 64, lineHeight: 1 }}>🤸</div>
        <h2 className="text-2xl font-black text-gray-800 text-center">
          عبور خط المنتصف
        </h2>

        {/* Scientific context */}
        <div
          className="max-w-sm w-full rounded-2xl p-4 border text-center space-y-3"
          style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}
        >
          <p className="text-gray-600 text-sm font-bold leading-relaxed">
            تحريك اليد عبر خط منتصف الجسم يُنشّط نصفَي الدماغ معاً —
            علاج مُثبَت لعسر القراءة واضطرابات التنسيق الحركي
          </p>

          {/* Visual instruction */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <div
              className="flex-1 py-2 rounded-xl text-xs font-black text-center"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}
            >
              نجمة اليسار<br/>← اليد اليمنى
            </div>
            <div className="text-gray-400 text-lg font-black">|</div>
            <div
              className="flex-1 py-2 rounded-xl text-xs font-black text-center"
              style={{ background: '#EDE9FE', color: '#5B21B6' }}
            >
              نجمة اليمين<br/>اليد اليسرى →
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">{cfg.label}</p>

        <div className="flex gap-3">
          <button
            onClick={start}
            className="px-10 py-3 rounded-2xl font-black text-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C5CFC, #3B82F6)',
              boxShadow: '0 8px 24px rgba(124,92,252,0.35)',
            }}
          >
            ابدأ
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING ───────────────────────────────────────────────────────
  const sideKey = side as 'L' | 'R'
  const color = HAND_COLORS[sideKey]
  const targetBg =
    feedback === 'hit'  ? '#22C55E' :
    feedback === 'miss' ? '#EF4444' :
    color

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none touch-none"
      style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #EFF6FF 100%)' }}
    >
      {/* ── Midline ── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          background:
            'repeating-linear-gradient(to bottom,#A5B4FC 0,#A5B4FC 8px,transparent 8px,transparent 18px)',
        }}
      />

      {/* Zone labels (subtle) */}
      <div
        className="absolute top-4 right-5 text-xs font-black pointer-events-none"
        style={{ color: '#7C5CFC80' }}
      >
        يمين ← اليسرى
      </div>
      <div
        className="absolute top-4 left-5 text-xs font-black pointer-events-none"
        style={{ color: '#3B82F680' }}
      >
        يسار → اليمنى
      </div>

      {/* ── Progress ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
        <span className="text-[11px] font-black text-gray-400">
          {round + 1} / {cfg.rounds}
        </span>
        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(round / cfg.rounds) * 100}%`, background: color }}
          />
        </div>
      </div>

      {/* ── Hit counter ── */}
      <div
        className="absolute top-3 left-4 text-sm font-black pointer-events-none"
        style={{ color: '#22C55E' }}
      >
        ✓ {hitsDisplay}
      </div>

      {/* ── Target ── */}
      <button
        onPointerDown={handleHit}
        className="absolute focus:outline-none active:scale-95"
        style={{
          left:      `${pos.x}%`,
          top:       `${pos.y}%`,
          transform: 'translate(-50%, -50%)',
          width:     feedback ? 90 : 78,
          height:    feedback ? 90 : 78,
          borderRadius: '50%',
          background:   targetBg,
          boxShadow: `0 0 ${feedback ? 48 : 28}px ${targetBg}70, 0 4px 16px rgba(0,0,0,0.1)`,
          border:    '5px solid white',
          display:   'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize:  38,
          transition: 'all 0.15s ease',
          cursor:    'pointer',
        }}
        aria-label="اضغط على النجمة"
      >
        {feedback === 'hit' ? '✓' : feedback === 'miss' ? '✗' : '⭐'}
      </button>

      {/* ── Hand instruction banner ── */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div
          className="px-6 py-2.5 rounded-2xl font-black text-white text-base shadow-lg transition-all duration-300"
          style={{
            background:  color,
            boxShadow:  `0 8px 24px ${color}40`,
          }}
        >
          {HAND_LABELS[sideKey]}
        </div>
      </div>

      {/* ── Feedback flash (full-screen tint) ── */}
      {feedback && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: feedback === 'hit'
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
          }}
        />
      )}
    </div>
  )
}
