'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randIntWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

const COLORS = ['#EF4444','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EC4899']

export default function SequenceTap({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng     = useRef(createRng(seed ?? Date.now())).current
  const SEQ_LEN = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const ROUNDS  = 5
  const COUNT   = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6

  const [round,    setRound]    = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [lit,      setLit]      = useState<number | null>(null)
  const [phase,    setPhase]    = useState<'showing'|'recall'|'feedback'>('showing')
  const [tapped,   setTapped]   = useState<number[]>([])
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [score,    setScore]    = useState(0)
  const [errors,   setErrors]   = useState(0)
  const [startMs]               = useState(Date.now())
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const resolvedRef = useRef(false)   // guard — a round resolves (schedules advance) at most once, even on rapid double-taps

  const clearAll = () => { timerIds.current.forEach(clearTimeout); timerIds.current = [] }

  const playSequence = useCallback((seq: number[]) => {
    clearAll()
    setPhase('showing')
    setLit(null)
    seq.forEach((idx, i) => {
      timerIds.current.push(setTimeout(() => setLit(idx), i * 700))
      timerIds.current.push(setTimeout(() => setLit(null), i * 700 + 500))
    })
    timerIds.current.push(setTimeout(() => {
      setPhase('recall')
      setTapped([])
    }, seq.length * 700 + 600))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const newRound = useCallback(() => {
    resolvedRef.current = false   // arm the guard for the new round
    const seq = Array.from({ length: SEQ_LEN }, () => randIntWithRng(rng, 0, COUNT - 1))
    setSequence(seq)
    timerIds.current.push(setTimeout(() => playSequence(seq), 300))
  }, [SEQ_LEN, COUNT, playSequence])

  useEffect(() => { newRound(); return clearAll }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTap(idx: number) {
    if (phase !== 'recall') return
    const pos     = tapped.length
    const correct = sequence[pos]
    const next    = [...tapped, idx]

    if (idx !== correct) {
      if (resolvedRef.current) return
      resolvedRef.current = true
      const ne = errors + 1
      setErrors(ne)
      setFeedback('wrong')
      setPhase('feedback')
      onProgress?.({ answered: round + 1, total: ROUNDS, correct: score, errors: ne, lastCorrect: false })
      timerIds.current.push(setTimeout(() => advance(false, score, ne), 1300))
    } else {
      setTapped(next)
      if (next.length === sequence.length) {
        if (resolvedRef.current) return
        resolvedRef.current = true
        setFeedback('correct')
        setPhase('feedback')
        const ns = score + 1
        setScore(ns)
        onProgress?.({ answered: round + 1, total: ROUNDS, correct: ns, errors, lastCorrect: true })
        timerIds.current.push(setTimeout(() => advance(true, ns, errors), 1300))
      }
    }
  }

  function advance(wasCorrect: boolean, finalS: number, finalE: number) {
    setFeedback(null)
    const next = round + 1
    if (next >= ROUNDS) {
      const finalScore = Math.round((finalS / ROUNDS) * 100)
      onComplete({
        exerciseType:    'sequence-tap',
        exerciseLabelAr: 'النقر بالتسلسل',
        score:     finalScore,
        accuracy:  finalScore,
        duration:  Math.round((Date.now() - startMs) / 1000),
        errors:    finalE,
        metadata:  { rounds: ROUNDS, seqLen: SEQ_LEN },
        completedAt: new Date().toISOString(),
      })
    } else {
      setRound(next)
      newRound()
    }
  }

  // Positions in a circle layout
  const positions = Array.from({ length: COUNT }, (_, i) => {
    const angle = (i / COUNT) * 2 * Math.PI - Math.PI / 2
    return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) }
  })

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{ROUNDS}</div>
          <div className="text-xs text-white/50">جولة</div>
        </div>
        <h2 className="text-xl font-black text-white">النقر بالتسلسل</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{score}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className={`text-sm font-black px-4 py-2 rounded-xl ${
        phase === 'showing'  ? 'text-amber-400 bg-amber-400/10'
       : phase === 'recall'  ? 'text-brand-400 bg-brand-400/10'
       : feedback === 'correct' ? 'text-green-400 bg-green-400/10'
       : 'text-red-400 bg-red-400/10'
      }`}>
        {phase === 'showing'  ? '👀 تذكر الترتيب...' : phase === 'recall' ? '👆 اضغط بنفس الترتيب' : feedback === 'correct' ? '✅ أحسنت!' : '❌ خطأ'}
      </div>

      {/* Circle grid */}
      <div className="relative" style={{ width: 280, height: 280 }}>
        {positions.map((pos, i) => {
          const isLit = lit === i
          const inTapped = tapped.includes(i)
          return (
            <button key={i} onClick={() => handleTap(i)}
              disabled={phase !== 'recall'}
              style={{
                position:   'absolute',
                left:       `${pos.x}%`,
                top:        `${pos.y}%`,
                transform:  'translate(-50%, -50%)',
                width:      64, height: 64,
                borderRadius: '50%',
                background: isLit ? COLORS[i % COLORS.length] : inTapped ? COLORS[i % COLORS.length] + '88' : 'rgba(255,255,255,0.1)',
                border:     `3px solid ${COLORS[i % COLORS.length]}`,
                boxShadow:  isLit ? `0 0 24px ${COLORS[i % COLORS.length]}` : 'none',
                transition: 'all 0.2s',
              }} />
          )
        })}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {sequence.map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ background: i < tapped.length ? '#22C55E' : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
