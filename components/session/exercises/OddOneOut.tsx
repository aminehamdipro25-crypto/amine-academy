'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'

interface Question {
  items: string[]
  odd: number          // index of the odd item (0-based)
  explain: string
}

const ALL_QUESTIONS: Question[] = [
  { items: ['🐶', '🐱', '🐭', '🍎'], odd: 3, explain: 'الفاكهة تختلف عن الحيوانات' },
  { items: ['🚗', '🚌', '✈️', '🌸'], odd: 3, explain: 'الوردة ليست وسيلة نقل' },
  { items: ['🔴', '🔵', '🟡', '🍊'], odd: 3, explain: 'البرتقال ليس لوناً' },
  { items: ['⚽', '🏀', '🎾', '🎸'], odd: 3, explain: 'الجيتار ليس كرة' },
  { items: ['📚', '📖', '✏️', '🐠'], odd: 3, explain: 'السمكة ليست أداة مدرسية' },
  { items: ['🍕', '🍔', '🍜', '🌴'], odd: 3, explain: 'النخلة ليست طعاماً' },
  { items: ['🌞', '⭐', '🌙', '🐸'], odd: 3, explain: 'الضفدع ليس جسماً سماوياً' },
  { items: ['👕', '👗', '👠', '🎺'], odd: 3, explain: 'الترومبيت ليس ملبساً' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

type ItemFeedback = 'correct' | 'wrong' | null

export default function OddOneOut({ onComplete, onCancel, difficulty = 1, onProgress }: Props) {
  const totalQuestions = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 8
  const questions = ALL_QUESTIONS.slice(0, totalQuestions)

  const [qIndex, setQIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState<ItemFeedback>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const finishGame = useCallback((finalCorrect: number, finalErrors: number) => {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const score = Math.round((finalCorrect / totalQuestions) * 100)
    setDone(true)
    onComplete({
      exerciseType: 'odd-one-out',
      exerciseLabelAr: 'الغريب في المجموعة',
      score,
      accuracy: score,
      duration: dur,
      errors: finalErrors,
      metadata: {
        correctAnswers: finalCorrect,
        totalQuestions,
        difficulty,
      },
      completedAt: new Date().toISOString(),
    })
  }, [totalQuestions, difficulty, onComplete])

  const handleSelect = useCallback((idx: number) => {
    if (feedback !== null) return
    const q = questions[qIndex]
    setSelectedIdx(idx)
    const isCorrect = idx === q.odd
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc); else setErrors(ne)
    onProgress?.({ answered: qIndex + 1, total: totalQuestions, correct: nc, errors: ne, lastCorrect: isCorrect })
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setShowExplain(true)
    timerRef.current = setTimeout(() => {
      setFeedback(null)
      setSelectedIdx(null)
      setShowExplain(false)
      const nextQ = qIndex + 1
      if (nextQ >= totalQuestions) {
        finishGame(nc, ne)
      } else {
        setQIndex(nextQ)
      }
    }, 1500)
  }, [feedback, questions, qIndex, totalQuestions, errors, correct, finishGame, onProgress])

  if (done) return null

  const q = questions[qIndex]

  return (
    <div dir="rtl" className="flex flex-col items-center gap-6 p-6 select-none min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{qIndex}/{totalQuestions}</div>
          <div className="text-xs text-white/50">أسئلة</div>
        </div>
        <h2 className="text-xl font-black text-white">الغريب في المجموعة</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md bg-white/10 rounded-full h-2">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(qIndex / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Instruction */}
      <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
        <p className="text-white/80 font-bold text-base">أيّ واحد لا ينتمي للمجموعة؟</p>
      </div>

      {/* Item buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {q.items.map((emoji, idx) => {
          const isSelected = selectedIdx === idx
          const isOdd = idx === q.odd
          let btnClass = 'bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-brand-400'
          if (feedback !== null && isSelected) {
            btnClass = feedback === 'correct'
              ? 'bg-green-500/30 border-2 border-green-400 shadow-lg shadow-green-500/30'
              : 'bg-red-500/30 border-2 border-red-400'
          } else if (feedback === 'wrong' && isOdd) {
            // Highlight the correct answer when wrong selected
            btnClass = 'bg-green-500/20 border-2 border-green-400/60'
          }

          return (
            <button
              key={`${qIndex}-${idx}`}
              onClick={() => handleSelect(idx)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-5xl transition-all duration-200 active:scale-90 cursor-pointer
                ${btnClass}
                ${feedback !== null && !isSelected ? 'opacity-60' : ''}
                ${isSelected && feedback === 'wrong' ? 'animate-shake' : ''}
              `}
              style={{ minHeight: 110 }}
            >
              {emoji}
            </button>
          )
        })}
      </div>

      {/* Explanation bubble */}
      <div
        className={`transition-all duration-300 overflow-hidden ${showExplain ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className={`px-5 py-3 rounded-2xl text-center font-bold text-sm border
          ${feedback === 'correct'
            ? 'bg-green-900/40 border-green-500/40 text-green-300'
            : 'bg-red-900/30 border-red-500/30 text-red-300'
          }`}
        >
          {feedback === 'correct' ? '✓ أحسنت! ' : '✗ الإجابة الصحيحة: '}
          {q.explain}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-8px) rotate(-2deg); }
          40% { transform: translateX(8px) rotate(2deg); }
          60% { transform: translateX(-5px) rotate(-1deg); }
          80% { transform: translateX(5px) rotate(1deg); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>

      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mt-auto"
      >
        ← إنهاء التمرين
      </button>
    </div>
  )
}
