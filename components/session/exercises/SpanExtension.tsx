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

export default function SpanExtension({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const START_LEN  = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const ROUNDS     = 5
  const SHOW_MS    = 800  // ms per digit
  const REVERSE    = difficulty === 3

  const [seq,      setSeq]      = useState<number[]>([])
  const [showing,  setShowing]  = useState<number | null>(null)
  const [phase,    setPhase]    = useState<'showing'|'input'|'feedback'>('showing')
  const [input,    setInput]    = useState<number[]>([])
  const [round,    setRound]    = useState(0)
  const [correct,  setCorrect]  = useState(0)
  const [errors,   setErrors]   = useState(0)
  const [startMs]               = useState(Date.now())


  const genSeq = useCallback((len: number) =>
    Array.from({ length: len }, () => randIntWithRng(rng, 1, 9))
  , [rng])

  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearAll = () => { timerIds.current.forEach(clearTimeout); timerIds.current = [] }

  const playSeq = useCallback((s: number[]) => {
    clearAll()
    setPhase('showing')
    s.forEach((n, i) => {
      timerIds.current.push(setTimeout(() => setShowing(n), i * (SHOW_MS + 200)))
      timerIds.current.push(setTimeout(() => setShowing(null), i * (SHOW_MS + 200) + SHOW_MS))
    })
    timerIds.current.push(setTimeout(() => {
      setPhase('input')
      setInput([])
    }, s.length * (SHOW_MS + 200) + 300))
  }, [SHOW_MS]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = genSeq(START_LEN)
    setSeq(s)
    playSeq(s)
    return clearAll
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDigit(n: number) {
    if (phase !== 'input') return
    const next = [...input, n]
    setInput(next)
    if (next.length === seq.length) {
      const target = REVERSE ? [...seq].reverse() : seq
      const isCorrect = next.every((v, i) => v === target[i])
      const nc = correct + (isCorrect ? 1 : 0)
      const ne = errors  + (isCorrect ? 0 : 1)
      setPhase('feedback')
      if (isCorrect) setCorrect(nc)
      else           setErrors(ne)
      onProgress?.({ answered: round + 1, total: ROUNDS, correct: nc, errors: ne, lastCorrect: isCorrect })

      timerIds.current.push(setTimeout(() => {
        const nextRound = round + 1
        if (nextRound >= ROUNDS) {
          onComplete({
            exerciseType:    'span-extension',
            exerciseLabelAr: 'امتداد الذاكرة',
            score:    Math.round((nc / ROUNDS) * 100),
            accuracy: Math.round((nc / ROUNDS) * 100),
            duration: Math.round((Date.now() - startMs) / 1000),
            errors:   ne,
            metadata: { rounds: ROUNDS, seqLen: seq.length, reverse: REVERSE },
            completedAt: new Date().toISOString(),
          })
        } else {
          setRound(nextRound)
          const newLen = START_LEN + Math.floor(nextRound / 2)
          const s = genSeq(newLen)
          setSeq(s)
          playSeq(s)
        }
      }, 1300))
    }
  }

  const target = REVERSE ? [...seq].reverse() : seq

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{ROUNDS}</div>
          <div className="text-xs text-white/50">جولة</div>
        </div>
        <h2 className="text-xl font-black text-white">امتداد الذاكرة</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {REVERSE && (
        <div className="text-xs text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full">
          تذكّر الأرقام بالترتيب العكسي
        </div>
      )}

      {/* Big digit display */}
      <div className="w-40 h-40 rounded-3xl flex items-center justify-center"
        style={{ background: showing !== null ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.04)',
          border: `3px solid ${showing !== null ? '#7C5CFC' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: showing !== null ? '0 0 40px rgba(124,92,252,0.4)' : 'none' }}>
        <span className="text-7xl font-black text-white"
          style={{ opacity: showing !== null ? 1 : 0.15 }}>
          {showing ?? '?'}
        </span>
      </div>

      {/* Status */}
      <div className={`text-sm font-bold px-4 py-2 rounded-xl ${
        phase === 'showing'  ? 'text-amber-400 bg-amber-400/10'
       : phase === 'input'   ? 'text-brand-400 bg-brand-400/10'
       : correct > (round > 0 ? correct : -1) ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
      }`}>
        {phase === 'showing' ? '👁️ احفظ الأرقام...' : phase === 'input' ? `أدخل ${seq.length} أرقام ${REVERSE ? '(عكسياً)' : ''}` : ''}
        {phase === 'feedback' && (input.every((v,i) => v === target[i]) ? '✅ أحسنت!' : `❌ الترتيب: ${target.join(' - ')}`)}
      </div>

      {/* Input dots */}
      {phase === 'input' && (
        <div className="flex gap-2 min-h-[40px]">
          {seq.map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: i < input.length ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.08)',
                border: `2px solid ${i < input.length ? '#7C5CFC' : 'rgba(255,255,255,0.15)'}` }}>
              {i < input.length ? input[i] : ''}
            </div>
          ))}
        </div>
      )}

      {/* Numpad */}
      {phase === 'input' && (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleDigit(n)}
              className="w-16 h-16 rounded-2xl text-2xl font-black text-white transition-all active:scale-90
                bg-white/10 hover:bg-white/20 border-2 border-white/15">
              {n}
            </button>
          ))}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
