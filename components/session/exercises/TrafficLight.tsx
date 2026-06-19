'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

type Phase = 'idle' | 'red' | 'yellow' | 'green' | 'feedback'

export default function TrafficLight({ onComplete, onCancel, difficulty = 1 }: Props) {
  const ROUNDS       = 6
  const RED_MS       = difficulty === 1 ? 2000 : difficulty === 2 ? 1500 : 1000
  const YELLOW_MS    = 800
  const GREEN_WINDOW = 1500
  const TRICK_CHANCE = difficulty === 3 ? 0.35 : difficulty === 2 ? 0.2 : 0

  const [round,        setRound]        = useState(0)
  const [phase,        setPhase]        = useState<Phase>('idle')
  const [feedback,     setFeedback]     = useState<'hit'|'false'|'miss'|null>(null)
  const [score,        setScore]        = useState(0)
  const [falseStarts,  setFalseStarts]  = useState(0)
  const [startMs]                       = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const greenRef = useRef(false)
  const trickRef = useRef(false)

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const endRound = useCallback((result: 'hit'|'false'|'miss') => {
    clear()
    greenRef.current = false
    setPhase('feedback')
    setFeedback(result)
    if (result === 'hit')   setScore(s => s + 1)
    if (result === 'false') setFalseStarts(s => s + 1)

    timerRef.current = setTimeout(() => {
      setFeedback(null)
      const next = round + 1
      if (next >= ROUNDS) {
        const finalScore = Math.max(0, Math.round(((score + (result === 'hit' ? 1 : 0)) / ROUNDS) * 100) - falseStarts * 10)
        onComplete({
          exerciseType:    'traffic-light',
          exerciseLabelAr: 'إشارة المرور',
          score:           finalScore,
          accuracy:        finalScore,
          duration:        Math.round((Date.now() - startMs) / 1000),
          errors:          falseStarts + (result === 'miss' ? 1 : 0),
          metadata:        { rounds: ROUNDS, difficulty },
          completedAt:     new Date().toISOString(),
        })
      } else {
        setRound(next)
        setPhase('idle')
      }
    }, 1200)
  }, [round, score, falseStarts, startMs, ROUNDS, difficulty, onComplete])

  // Run the traffic light sequence when phase is 'idle'
  useEffect(() => {
    if (phase !== 'idle') return
    greenRef.current  = false
    trickRef.current  = false
    timerRef.current  = setTimeout(() => {
      setPhase('red')
      timerRef.current = setTimeout(() => {
        // trick: sometimes briefly flash green then go back
        if (Math.random() < TRICK_CHANCE) {
          trickRef.current = true
          setPhase('green')
          timerRef.current = setTimeout(() => {
            if (greenRef.current) return // child already pressed
            setPhase('red')
            timerRef.current = setTimeout(() => {
              setPhase('yellow')
              timerRef.current = setTimeout(() => {
                trickRef.current = false
                setPhase('green')
                greenRef.current = true
                timerRef.current = setTimeout(() => endRound('miss'), GREEN_WINDOW)
              }, YELLOW_MS)
            }, RED_MS / 2)
          }, 200)
        } else {
          setPhase('yellow')
          timerRef.current = setTimeout(() => {
            setPhase('green')
            greenRef.current = true
            timerRef.current = setTimeout(() => endRound('miss'), GREEN_WINDOW)
          }, YELLOW_MS)
        }
      }, RED_MS)
    }, 600)
    return clear
  }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clear(), [])

  function handlePress() {
    if (phase === 'feedback') return
    if (phase === 'green' && !trickRef.current) {
      endRound('hit')
    } else {
      endRound('false')
    }
  }

  const lightColor = (c: 'red'|'yellow'|'green') => {
    const active = phase === c || (phase === 'feedback' && feedback === 'hit' && c === 'green')
    const baseColors = { red: '#FF4444', yellow: '#FFD700', green: '#22C55E' }
    return active ? baseColors[c] : 'rgba(255,255,255,0.08)'
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{ROUNDS}</div>
          <div className="text-xs text-white/50">جولة</div>
        </div>
        <h2 className="text-xl font-black text-white">إشارة المرور</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{falseStarts}</div>
          <div className="text-xs text-white/50">انطلاق مبكر</div>
        </div>
      </div>

      {/* Traffic light box */}
      <div className="rounded-3xl p-5 flex flex-col gap-4 shadow-2xl"
        style={{ background: 'rgba(0,0,0,0.6)', border: '3px solid rgba(255,255,255,0.1)', width: 120 }}>
        {(['red','yellow','green'] as const).map(c => (
          <div key={c} className="rounded-full transition-all duration-200"
            style={{ width: 70, height: 70, background: lightColor(c),
              boxShadow: lightColor(c) !== 'rgba(255,255,255,0.08)' ? `0 0 30px ${lightColor(c)}88` : 'none' }} />
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-2xl font-black ${feedback === 'hit' ? 'text-green-400' : 'text-red-400'}`}>
          {feedback === 'hit' ? '✅ أحسنت!' : feedback === 'false' ? '⚠️ انطلاق مبكر!' : '⏰ فاتتك!'}
        </div>
      )}

      {/* Instruction */}
      {!feedback && (
        <div className="text-white/60 text-sm text-center">
          {phase === 'red'    ? '🔴 انتظر...'
         : phase === 'yellow' ? '🟡 استعد...'
         : phase === 'green'  ? '🟢 اضغط الآن!'
         : 'استعد للجولة التالية...'}
        </div>
      )}

      <button
        onClick={handlePress}
        disabled={phase === 'feedback' || phase === 'idle'}
        className="w-40 h-40 rounded-full text-5xl font-black transition-all active:scale-90 shadow-2xl
          disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: phase === 'green' ? '#22C55E' : 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.2)' }}>
        🚦
      </button>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
