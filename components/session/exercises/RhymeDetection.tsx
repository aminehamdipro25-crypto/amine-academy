'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

interface Question {
  word:    string
  correct: string
  wrong:   [string, string]
}

const ALL_QUESTIONS: Question[] = [
  { word: 'قمر',   correct: 'شجر',   wrong: ['باب',   'سمك']   },
  { word: 'بيت',   correct: 'زيت',   wrong: ['قلم',   'ولد']   },
  { word: 'ليل',   correct: 'خيل',   wrong: ['شمس',   'قمر']   },
  { word: 'كتاب',  correct: 'حساب',  wrong: ['بيت',   'زهرة']  },
  { word: 'نجمة',  correct: 'رحمة',  wrong: ['سمكة',  'طائر']  },
  { word: 'ذهب',   correct: 'لهب',   wrong: ['قمر',   'ماء']   },
  { word: 'سماء',  correct: 'هواء',  wrong: ['أرض',   'نار']   },
  { word: 'حليب',  correct: 'قريب',  wrong: ['جبل',   'شجرة']  },
]

function getQuestions(difficulty: 1 | 2 | 3): Question[] {
  if (difficulty === 1) return ALL_QUESTIONS.slice(0, 4)
  if (difficulty === 2) return ALL_QUESTIONS.slice(0, 6)
  return ALL_QUESTIONS
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speak(text: string): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ar-SA'
  u.rate = 0.85
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

type Phase = 'playing' | 'answer' | 'feedback' | 'done'

export default function RhymeDetection({ onComplete, onCancel, difficulty = 1 }: Props) {
  const questions = useRef<Question[]>(getQuestions(difficulty))
  const [qIdx, setQIdx]         = useState(0)
  const [phase, setPhase]       = useState<Phase>('playing')
  const [choices, setChoices]   = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect]   = useState(0)
  const [errors, setErrors]     = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const startRef  = useRef(Date.now())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = questions.current.length
  const q     = questions.current[qIdx]

  const playWord = useCallback((word: string) => {
    speak(word)
  }, [])

  // Build shuffled choices for this question
  useEffect(() => {
    const c = shuffle([q.correct, ...q.wrong])
    setChoices(c)
    setSelected(null)
    setFeedback(null)
    setPhase('playing')

    // Speak the main word
    timerRef.current = setTimeout(() => {
      speak(q.word)
      timerRef.current = setTimeout(() => {
        setPhase('answer')
      }, 1500)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  }, [])

  function handleChoice(choice: string) {
    if (phase !== 'answer') return
    setSelected(choice)
    const isCorrect = choice === q.correct
    const newCorrect = correct + (isCorrect ? 1 : 0)
    const newErrors  = errors  + (isCorrect ? 0 : 1)
    setCorrect(newCorrect)
    setErrors(newErrors)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setPhase('feedback')

    timerRef.current = setTimeout(() => {
      setFeedback(null)
      setSelected(null)
      if (qIdx + 1 >= total) {
        const score = Math.round((newCorrect / total) * 100)
        const dur   = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType:    'rhyme-detection',
          exerciseLabelAr: 'اكتشاف القافية',
          score,
          accuracy: score,
          duration: dur,
          errors:   newErrors,
          metadata: { total, correct: newCorrect, difficulty },
          completedAt: new Date().toISOString(),
        })
        setPhase('done')
      } else {
        setQIdx(i => i + 1)
      }
    }, 1000)
  }

  function getChoiceStyle(choice: string) {
    if (phase !== 'feedback' || !selected) {
      return {
        background: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.2)',
        color: 'white',
      }
    }
    if (choice === q.correct) {
      return {
        background: 'rgba(34,197,94,0.25)',
        borderColor: '#22c55e',
        color: '#86efac',
      }
    }
    if (choice === selected) {
      return {
        background: 'rgba(239,68,68,0.25)',
        borderColor: '#ef4444',
        color: '#fca5a5',
      }
    }
    return {
      background: 'rgba(255,255,255,0.04)',
      borderColor: 'rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.4)',
    }
  }

  if (phase === 'done') return null

  return (
    <div dir="rtl" className="flex flex-col items-center gap-6 p-6 select-none max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{qIdx + 1}/{total}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-lg font-black text-white">اكتشاف القافية</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${(qIdx / total) * 100}%`, background: '#7C5CFC' }}
        />
      </div>

      {/* Main word */}
      <div className="mt-2 flex flex-col items-center gap-3">
        <p className="text-white/60 text-sm">ما الكلمة التي تُقافي:</p>
        <button
          onClick={() => playWord(q.word)}
          className="w-40 h-40 rounded-3xl text-4xl font-black text-white flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            background: phase === 'playing'
              ? 'rgba(124,92,252,0.4)'
              : 'rgba(124,92,252,0.2)',
            border: '3px solid rgba(124,92,252,0.7)',
            boxShadow: phase === 'playing' ? '0 0 32px rgba(124,92,252,0.5)' : 'none',
          }}
        >
          <span className="text-3xl">{q.word}</span>
          <span className="text-sm font-normal text-white/60">🔊 اضغط للسماع</span>
        </button>
      </div>

      {/* Status */}
      {phase === 'playing' && (
        <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse">
          <span className="text-xl">🔊</span>
          <span>استمع…</span>
        </div>
      )}
      {(phase === 'answer' || phase === 'feedback') && (
        <p className="text-white/70 font-bold">اختر الكلمة التي تُقافيها:</p>
      )}

      {/* Choices */}
      <div className="grid grid-cols-3 gap-3 w-full mt-1">
        {choices.map(choice => (
          <button
            key={choice}
            onClick={() => {
              playWord(choice)
              handleChoice(choice)
            }}
            disabled={phase !== 'answer'}
            className="h-20 rounded-2xl border-2 text-xl font-black transition-all duration-200 active:scale-95"
            style={{
              ...getChoiceStyle(choice),
              cursor: phase === 'answer' ? 'pointer' : 'default',
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="text-3xl font-black animate-bounce"
          style={{ color: feedback === 'correct' ? '#22c55e' : '#ef4444' }}
        >
          {feedback === 'correct' ? '✅ ممتاز!' : `❌ الصحيح: ${q.correct}`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors mt-2">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
