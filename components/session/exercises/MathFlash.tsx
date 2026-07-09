'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, pickWithRng, randIntWithRng, randBoolWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

function genQuestion(rng: Rng, difficulty: 1|2|3): { text: string; answer: number; choices: number[] } {
  let a: number, b: number, op: string, answer: number
  if (difficulty === 1) {
    a = randIntWithRng(rng, 1, 5)
    b = randIntWithRng(rng, 1, 5)
    op = '+'; answer = a + b
  } else if (difficulty === 2) {
    a = randIntWithRng(rng, 1, 10)
    b = randIntWithRng(rng, 1, Math.min(a, 10))
    op = randBoolWithRng(rng) ? '+' : '-'
    answer = op === '+' ? a + b : a - b
  } else {
    const ops = ['+','-','×'] as const
    op = pickWithRng(rng, ops)
    if (op === '×') {
      a = randIntWithRng(rng, 2, 5)
      b = randIntWithRng(rng, 2, 5)
      answer = a * b
    } else {
      a = randIntWithRng(rng, 1, 15)
      b = randIntWithRng(rng, 1, Math.min(a, 15))
      answer = op === '+' ? a + b : a - b
    }
  }
  const wrongs = new Set<number>()
  while (wrongs.size < 2) {
    const w = answer + (randBoolWithRng(rng) ? 1 : -1) * randIntWithRng(rng, 1, 3)
    if (w !== answer && w >= 0) wrongs.add(w)
  }
  return { text: `${a} ${op} ${b} = ?`, answer, choices: shuffleWithRng(rng, [answer, ...Array.from(wrongs)]) }
}

export default function MathFlash({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const TOTAL    = difficulty === 1 ? 8 : difficulty === 2 ? 10 : 12
  const SHOW_MS  = difficulty === 1 ? 3000 : difficulty === 2 ? 2000 : 1500

  const [q,       setQ]       = useState(() => genQuestion(rng, difficulty))
  const [phase,   setPhase]   = useState<'show'|'answer'|'feedback'>('show')
  const [chosen,  setChosen]  = useState<number | null>(null)
  const [idx,     setIdx]     = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextQ = useCallback(() => {
    setQ(genQuestion(rng, difficulty))
    setPhase('show')
    setChosen(null)
    timerRef.current = setTimeout(() => setPhase('answer'), SHOW_MS)
  }, [difficulty, SHOW_MS, rng])

  useEffect(() => {
    timerRef.current = setTimeout(() => setPhase('answer'), SHOW_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [SHOW_MS])

  function handleChoice(c: number) {
    if (phase === 'feedback' || chosen !== null) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setChosen(c)
    setPhase('feedback')
    const isCorrect = c === q.answer
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)
    onProgress?.({ answered: idx + 1, total: TOTAL, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      const next = idx + 1
      if (next >= TOTAL) {
        onComplete({
          exerciseType:    'math-flash',
          exerciseLabelAr: 'الحساب السريع',
          score:    Math.round((nc / TOTAL) * 100),
          accuracy: Math.round((nc / TOTAL) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: TOTAL, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        nextQ()
      }
    }, 1200)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{TOTAL}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">الحساب السريع</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Equation */}
      <div className="w-full max-w-xs rounded-3xl flex items-center justify-center"
        style={{ height: 160, background: 'rgba(124,92,252,0.12)', border: '2px solid rgba(124,92,252,0.3)' }}>
        {phase !== 'answer' || chosen !== null ? (
          <div className="text-4xl font-black text-white">{q.text}</div>
        ) : (
          <div className="text-white/30 text-lg font-bold">؟</div>
        )}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {q.choices.map(c => {
          const isChosen  = c === chosen
          const isCorrect = c === q.answer
          let cls = 'bg-white/10 hover:bg-white/20 border-transparent'
          if (isChosen && isCorrect)  cls = 'bg-green-500/30 border-green-400'
          if (isChosen && !isCorrect) cls = 'bg-red-500/30 border-red-400'
          if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/15 border-green-400/40'
          return (
            <button key={c} onClick={() => handleChoice(c)}
              disabled={phase === 'feedback' || chosen !== null}
              className={`py-4 rounded-2xl text-2xl font-black text-white border-2 transition-all
                disabled:cursor-not-allowed ${cls}`}>
              {c}
            </button>
          )
        })}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
