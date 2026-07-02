'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

type Phase = 'ready' | 'growing' | 'feedback' | 'result'
type FbType = 'too-early' | 'good' | 'too-late' | null

const TOTAL_ROUNDS   = 5
const MIN_SIZE       = 50
const MAX_SIZE       = 200
const TARGET_MIN     = 140
const TARGET_MAX     = 200

export default function BalloonControl({ onComplete, onCancel, difficulty = 1 }: Props) {
  const growthMs = difficulty === 1 ? 4000 : difficulty === 2 ? 3000 : 2000

  const [phase,      setPhase]      = useState<Phase>('ready')
  const [round,      setRound]      = useState(0)
  const [balloonSize, setBalloonSize] = useState(MIN_SIZE)
  const [fb,         setFb]         = useState<FbType>(null)
  const [fbMsg,      setFbMsg]      = useState('')
  const [result,     setResult]     = useState<ExerciseResult | null>(null)

  const pendingResultRef = useRef<ExerciseResult | null>(null)
  const goodPressesRef   = useRef(0)
  const tooEarlyRef      = useRef(0)
  const tooLateRef       = useRef(0)
  const startRef         = useRef(Date.now())
  const roundStartRef    = useRef(0)
  const rafRef           = useRef<number | null>(null)
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedRef       = useRef(false)
  const currentSizeRef   = useRef(MIN_SIZE)

  const clearAll = useCallback(() => {
    if (rafRef.current)   { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => clearAll(), [clearAll])

  // Deliver result on unmount if the user left before clicking "متابعة"
  useEffect(() => () => {
    if (pendingResultRef.current) onComplete(pendingResultRef.current)
  }, [onComplete])

  const finish = useCallback((goodPresses: number) => {
    const score = Math.round((goodPresses / TOTAL_ROUNDS) * 100)
    const resultObj: ExerciseResult = {
      exerciseType:    'balloon-control',
      exerciseLabelAr: 'البالون الهادئ',
      score,
      accuracy: score,
      duration:  Math.round((Date.now() - startRef.current) / 1000),
      errors:    tooEarlyRef.current + tooLateRef.current,
      metadata: {
        goodPresses,
        tooEarly:   tooEarlyRef.current,
        tooLate:    tooLateRef.current,
        totalRounds: TOTAL_ROUNDS,
        difficulty,
      },
      completedAt: new Date().toISOString(),
    }
    pendingResultRef.current = resultObj
    setResult(resultObj)
    setPhase('result')
  }, [difficulty])

  const startRound = useCallback((n: number) => {
    clearAll()
    pressedRef.current     = false
    currentSizeRef.current = MIN_SIZE
    setBalloonSize(MIN_SIZE)
    setFb(null)
    setRound(n)
    setPhase('growing')
    roundStartRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed  = now - roundStartRef.current
      const progress = Math.min(elapsed / growthMs, 1)
      const size     = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * progress
      currentSizeRef.current = size
      setBalloonSize(size)

      if (progress < 1 && !pressedRef.current) {
        rafRef.current = requestAnimationFrame(animate)
      } else if (progress >= 1 && !pressedRef.current) {
        // Balloon burst — too late
        pressedRef.current = true
        tooLateRef.current++
        setFb('too-late')
        setFbMsg('فاتك الوقت! 😢')
        setPhase('feedback')
        timerRef.current = setTimeout(() => {
          const nextRound = n + 1
          if (nextRound >= TOTAL_ROUNDS) finish(goodPressesRef.current)
          else startRound(nextRound)
        }, 1500)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [growthMs, clearAll, finish])

  function handlePress() {
    if (phase !== 'growing') return
    if (pressedRef.current) return
    pressedRef.current = true
    clearAll()
    const size = currentSizeRef.current

    if (size < TARGET_MIN) {
      tooEarlyRef.current++
      setFb('too-early')
      setFbMsg('اندفعت! 😅')
      setPhase('feedback')
    } else {
      goodPressesRef.current++
      setFb('good')
      setFbMsg('ممتاز! 🎉')
      setPhase('feedback')
    }

    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) finish(goodPressesRef.current)
      else startRound(nextRound)
    }, 1500)
  }

  // ── Ready ──────────────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-gray-950">
        <div className="text-7xl">🎈</div>
        <h2 className="text-white font-black text-2xl text-center">البالون الهادئ</h2>
        <div className="bg-white/5 rounded-2xl p-5 space-y-3 w-full max-w-xs text-white/70 text-sm leading-relaxed">
          <p>البالون سيكبر ببطء.</p>
          <p>اضغط الزر عندما يكون البالون <span className="text-green-400 font-bold">كبيراً</span> — ليس قبل!</p>
          <p>إذا ضغطت مبكراً جداً قيل لك "اندفعت!"</p>
        </div>
        <button
          onClick={() => { startRef.current = Date.now(); startRound(0) }}
          className="bg-[#7C5CFC] hover:bg-[#6a4de8] text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إنهاء التمرين
        </button>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-5 px-6 bg-gray-950">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى التمرين!</h2>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-400">{goodPressesRef.current}</div>
            <div className="text-xs text-white/40">ممتاز</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-red-400">{tooEarlyRef.current}</div>
            <div className="text-xs text-white/40">اندفاع</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-orange-400">{tooLateRef.current}</div>
            <div className="text-xs text-white/40">فات الوقت</div>
          </div>
        </div>
        <div className="text-[#7C5CFC] font-black text-5xl">{result.score}%</div>
        <button
          onClick={() => { pendingResultRef.current = null; onComplete(result) }}
          className="bg-[#7C5CFC] hover:bg-[#6a4de8] text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  // ── Active game ────────────────────────────────────────────────
  const isGoodZone = balloonSize >= TARGET_MIN

  return (
    <div dir="rtl" className="flex flex-col h-full bg-gray-950 select-none">
      {/* Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">جولة {round + 1} / {TOTAL_ROUNDS}</span>
          <span className="text-green-400 text-xs font-bold">{goodPressesRef.current} ممتاز</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-[#7C5CFC] h-2 rounded-full transition-all"
            style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Balloon arena */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {/* Target zone indicator */}
        <div className="text-white/40 text-sm">
          {phase === 'growing' && (
            isGoodZone
              ? <span className="text-green-400 font-bold animate-pulse">اضغط الآن!</span>
              : 'انتظر...'
          )}
          {phase === 'feedback' && (
            <span className={
              fb === 'good' ? 'text-green-400 font-black text-xl' :
              fb === 'too-early' ? 'text-red-400 font-black text-xl' :
              'text-orange-400 font-black text-xl'
            }>
              {fbMsg}
            </span>
          )}
        </div>

        {/* Balloon */}
        <div
          className="flex items-center justify-center transition-none"
          style={{ width: MAX_SIZE + 20, height: MAX_SIZE + 20 }}
        >
          <div
            className="flex items-center justify-center transition-none"
            style={{
              width:  balloonSize,
              height: balloonSize,
              fontSize: balloonSize * 0.75,
              lineHeight: 1,
            }}
          >
            {fb === 'too-late' ? '💥' : '🎈'}
          </div>
        </div>

        {/* Target zone visual guide */}
        <div className="flex items-center gap-2 text-xs text-white/30">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <span>صغير جداً</span>
          <div className="w-3 h-3 rounded-full bg-green-500/50 mx-2" />
          <span className="text-green-400/70">المنطقة الصحيحة</span>
        </div>

        {/* Press button */}
        <button
          onClick={handlePress}
          disabled={phase !== 'growing'}
          className={`
            px-10 py-5 rounded-2xl font-black text-xl transition-all duration-100 shadow-xl
            ${phase === 'growing'
              ? isGoodZone
                ? 'bg-green-500 hover:bg-green-400 active:scale-95 text-white shadow-green-500/40 cursor-pointer'
                : 'bg-[#7C5CFC] hover:bg-[#6a4de8] active:scale-95 text-white shadow-[#7C5CFC]/40 cursor-pointer'
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          اضغط الآن!
        </button>
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
