'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng, randIntWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface EmojiPair {
  emoji: string
  category: 'animals' | 'fruits' | 'objects'
}

const EMOJI_POOL: EmojiPair[] = [
  { emoji: '🐱', category: 'animals' }, { emoji: '🐶', category: 'animals' },
  { emoji: '🐘', category: 'animals' }, { emoji: '🦁', category: 'animals' },
  { emoji: '🐟', category: 'animals' }, { emoji: '🦋', category: 'animals' },
  { emoji: '🐦', category: 'animals' }, { emoji: '🐢', category: 'animals' },
  { emoji: '🐸', category: 'animals' }, { emoji: '🦊', category: 'animals' },
  { emoji: '🐻', category: 'animals' }, { emoji: '🐼', category: 'animals' },
  { emoji: '🦒', category: 'animals' }, { emoji: '🦓', category: 'animals' },
  { emoji: '🐯', category: 'animals' },
  { emoji: '🍎', category: 'fruits' },  { emoji: '🍌', category: 'fruits' },
  { emoji: '🍊', category: 'fruits' },  { emoji: '🍇', category: 'fruits' },
  { emoji: '🍓', category: 'fruits' },  { emoji: '🍉', category: 'fruits' },
  { emoji: '🍑', category: 'fruits' },  { emoji: '🍍', category: 'fruits' },
  { emoji: '🥭', category: 'fruits' },
  { emoji: '⭐', category: 'objects' }, { emoji: '🌙', category: 'objects' },
  { emoji: '☀️', category: 'objects' }, { emoji: '🌈', category: 'objects' },
  { emoji: '⚡', category: 'objects' }, { emoji: '🌺', category: 'objects' },
  { emoji: '🎈', category: 'objects' }, { emoji: '🎯', category: 'objects' },
  { emoji: '🏆', category: 'objects' }, { emoji: '📚', category: 'objects' },
  { emoji: '🎨', category: 'objects' },
]

interface Question {
  target: EmojiPair
  choices: EmojiPair[]
  correctIndex: number
}

function buildQuestions(count: number, difficulty: 1|2|3, rng: () => number): Question[] {
  const shuffled = shuffleWithRng(rng, EMOJI_POOL)
  const questions: Question[] = []

  for (let i = 0; i < count && i < shuffled.length; i++) {
    const target = shuffled[i]

    let distractorPool: EmojiPair[]
    if (difficulty === 1) {
      distractorPool = EMOJI_POOL.filter(e => e.category === target.category && e.emoji !== target.emoji)
    } else {
      distractorPool = EMOJI_POOL.filter(e => e.emoji !== target.emoji)
    }

    const numDistractors = 2
    const distractors = shuffleWithRng(rng, distractorPool).slice(0, numDistractors)
    const correctIndex = randIntWithRng(rng, 0, numDistractors)
    const choices = [...distractors]
    choices.splice(correctIndex, 0, target)

    questions.push({ target, choices, correctIndex })
  }
  return questions
}

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'reveal'

export default function ShadowMatch({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const totalQuestions = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10

  const [questions] = useState<Question[]>(() => buildQuestions(totalQuestions, difficulty, rng))
  const [idx, setIdx] = useState(0)
  const [choiceStates, setChoiceStates] = useState<ChoiceState[]>(['idle', 'idle', 'idle'])
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'done'>('playing')
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  useEffect(() => () => clearTimer(), [])

  const advance = useCallback((newCorrect: number, newIdx: number) => {
    if (newIdx >= questions.length) {
      const score = Math.round((newCorrect / questions.length) * 100)
      onComplete({
        exerciseType: 'shadow-match',
        exerciseLabelAr: 'مطابقة الظلال',
        score,
        accuracy: score,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        errors: questions.length - newCorrect,
        metadata: { correct: newCorrect, total: questions.length, difficulty },
        completedAt: new Date().toISOString(),
      })
    } else {
      setIdx(newIdx)
      setChoiceStates(['idle', 'idle', 'idle'])
      setAnswered(false)
    }
  }, [questions.length, onComplete, difficulty])

  function handleChoice(choiceIdx: number) {
    if (answered) return
    const q = questions[idx]
    setAnswered(true)

    if (choiceIdx === q.correctIndex) {
      const states: ChoiceState[] = ['idle', 'idle', 'idle']
      states[choiceIdx] = 'correct'
      setChoiceStates(states)
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      timerRef.current = setTimeout(() => advance(newCorrect, idx + 1), 800)
    } else {
      const states: ChoiceState[] = ['idle', 'idle', 'idle']
      states[choiceIdx] = 'wrong'
      states[q.correctIndex] = 'reveal'
      setChoiceStates(states)
      timerRef.current = setTimeout(() => advance(correctCount, idx + 1), 1200)
    }
  }

  if (phase === 'done') return null

  const q = questions[idx]

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">{idx + 1} / {totalQuestions}</span>
          <span className="text-green-400 text-xs font-bold">{correctCount} صحيح</span>
          <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">✕</button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(idx / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Shadow + Choices */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-5">
        {/* Shadow card */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/40 text-sm">ما هذا الظل؟</p>
          <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
            <span
              style={{
                filter: 'brightness(0) contrast(1)',
                fontSize: '6rem',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {q.target.emoji}
            </span>
          </div>
        </div>

        {/* Choice grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {q.choices.map((choice, i) => {
            const state = choiceStates[i]
            return (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                disabled={answered}
                className={[
                  'flex flex-col items-center justify-center rounded-2xl border-2 py-4 transition-all duration-200 active:scale-95',
                  state === 'correct'
                    ? 'border-green-500 bg-green-500/20 scale-105 shadow-lg shadow-green-500/30'
                    : state === 'wrong'
                    ? 'border-red-500 bg-red-500/20 animate-[shake_0.3s_ease-in-out]'
                    : state === 'reveal'
                    ? 'border-green-500/60 bg-green-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30',
                ].join(' ')}
              >
                <span style={{ fontSize: '4rem', lineHeight: 1 }}>{choice.emoji}</span>
                {state === 'correct' && (
                  <span className="text-green-400 font-black text-lg mt-1">✓</span>
                )}
                {state === 'wrong' && (
                  <span className="text-red-400 font-black text-lg mt-1">✗</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
