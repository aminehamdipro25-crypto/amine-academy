'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic, cancelSpeech } from '@/lib/speech'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

interface WordPair {
  a: string
  b: string
  areSame: boolean
}

const ALL_PAIRS: WordPair[] = [
  // Same pairs (24)
  { a: 'باب',    b: 'باب',    areSame: true },
  { a: 'قلم',    b: 'قلم',    areSame: true },
  { a: 'شمس',    b: 'شمس',    areSame: true },
  { a: 'بيت',    b: 'بيت',    areSame: true },
  { a: 'كلب',    b: 'كلب',    areSame: true },
  { a: 'قط',     b: 'قط',     areSame: true },
  { a: 'نور',    b: 'نور',    areSame: true },
  { a: 'سمك',    b: 'سمك',    areSame: true },
  { a: 'زهرة',   b: 'زهرة',   areSame: true },
  { a: 'ماء',    b: 'ماء',    areSame: true },
  { a: 'طفل',    b: 'طفل',    areSame: true },
  { a: 'قمر',    b: 'قمر',    areSame: true },
  { a: 'جبل',    b: 'جبل',    areSame: true },
  { a: 'نمر',    b: 'نمر',    areSame: true },
  { a: 'ريح',    b: 'ريح',    areSame: true },
  { a: 'حليب',   b: 'حليب',   areSame: true },
  { a: 'درس',    b: 'درس',    areSame: true },
  { a: 'كتاب',   b: 'كتاب',   areSame: true },
  { a: 'ورقة',   b: 'ورقة',   areSame: true },
  { a: 'تفاح',   b: 'تفاح',   areSame: true },
  { a: 'رياح',   b: 'رياح',   areSame: true },
  { a: 'صديق',   b: 'صديق',   areSame: true },
  { a: 'بحر',    b: 'بحر',    areSame: true },
  { a: 'قلب',    b: 'قلب',    areSame: true },
  // Different pairs — easy (clear difference, 12)
  { a: 'باب',    b: 'ناب',    areSame: false },
  { a: 'قلم',    b: 'علم',    areSame: false },
  { a: 'شمس',    b: 'شمع',    areSame: false },
  { a: 'بيت',    b: 'بيض',    areSame: false },
  { a: 'كلب',    b: 'كتب',    areSame: false },
  { a: 'قط',     b: 'قد',     areSame: false },
  { a: 'نور',    b: 'ثور',    areSame: false },
  { a: 'سمك',    b: 'سماء',   areSame: false },
  { a: 'زهرة',   b: 'نهرة',   areSame: false },
  { a: 'طفل',    b: 'جفل',    areSame: false },
  { a: 'جبل',    b: 'عبل',    areSame: false },
  { a: 'نمر',    b: 'قمر',    areSame: false },
  // Different pairs — hard (minimal phonemic difference, 12)
  { a: 'قلم',    b: 'قلب',    areSame: false },
  { a: 'كلب',    b: 'قلب',    areSame: false },
  { a: 'حصان',   b: 'حسان',   areSame: false },
  { a: 'سمع',    b: 'سمك',    areSame: false },
  { a: 'درس',    b: 'دلس',    areSame: false },
  { a: 'ريح',    b: 'ريش',    areSame: false },
  { a: 'قمر',    b: 'قمع',    areSame: false },
  { a: 'صديق',   b: 'صدوق',   areSame: false },
  { a: 'بحر',    b: 'بخر',    areSame: false },
  { a: 'حليب',   b: 'حبيب',   areSame: false },
  { a: 'تفاح',   b: 'تفاخ',   areSame: false },
  { a: 'كتاب',   b: 'كثاب',   areSame: false },
]

function getPairs(difficulty: 1 | 2 | 3): WordPair[] {
  const same = shuffle(ALL_PAIRS.filter(p => p.areSame))
  const easy = shuffle(ALL_PAIRS.filter(p => !p.areSame).slice(0, 12))
  const hard  = shuffle(ALL_PAIRS.filter(p => !p.areSame).slice(12))
  // d=1: 4 same + 4 easy = 8, d=2: 6 same + 4 easy + 4 hard = 14, d=3: 10 same + 6 easy + 8 hard = 24
  if (difficulty === 1) return shuffle([...same.slice(0, 4), ...easy.slice(0, 4)])
  if (difficulty === 2) return shuffle([...same.slice(0, 6), ...easy.slice(0, 4), ...hard.slice(0, 4)])
  return shuffle([...same.slice(0, 10), ...easy.slice(0, 6), ...hard.slice(0, 8)])
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
  speakArabic(text, 0.85)
}

type Phase = 'playing' | 'answer' | 'feedback' | 'done'

export default function SoundDiscrimination({ onComplete, onCancel, difficulty = 1 }: Props) {
  const pairs = useRef<WordPair[]>(getPairs(difficulty))
  const [qIdx, setQIdx]       = useState(0)
  const [phase, setPhase]     = useState<Phase>('playing')
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors]   = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const startRef  = useRef(Date.now())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = pairs.current.length
  const pair  = pairs.current[qIdx]

  const playPair = useCallback((p: WordPair) => {
    speak(p.a)
    playRef.current = setTimeout(() => {
      speak(p.b)
      playRef.current = setTimeout(() => {
        setPhase('answer')
      }, 1400)
    }, 1200)
  }, [])

  // Auto-play on mount and when question changes
  useEffect(() => {
    startRef.current = qIdx === 0 ? Date.now() : startRef.current
    setPhase('playing')
    timerRef.current = setTimeout(() => {
      playPair(pair)
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (playRef.current)  clearTimeout(playRef.current)
      cancelSpeech()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (playRef.current)  clearTimeout(playRef.current)
      cancelSpeech()
    }
  }, [])

  function handleAnswer(answer: boolean) {
    if (phase !== 'answer') return
    const isCorrect = answer === pair.areSame
    const newCorrect = correct + (isCorrect ? 1 : 0)
    const newErrors  = errors  + (isCorrect ? 0 : 1)
    setCorrect(newCorrect)
    setErrors(newErrors)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setPhase('feedback')

    timerRef.current = setTimeout(() => {
      setFeedback(null)
      if (qIdx + 1 >= total) {
        const score = Math.round((newCorrect / total) * 100)
        const dur   = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType:    'sound-discrimination',
          exerciseLabelAr: 'تمييز الأصوات',
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
    }, 900)
  }

  function handleReplay() {
    setPhase('playing')
    playPair(pair)
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
        <h2 className="text-lg font-black text-white">تمييز الأصوات</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${((qIdx) / total) * 100}%`, background: '#7C5CFC' }}
        />
      </div>

      {/* Word pair display */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div
          className="w-28 h-28 rounded-3xl border-2 flex items-center justify-center text-2xl font-black text-white transition-all duration-300"
          style={{
            background: 'rgba(124,92,252,0.15)',
            borderColor: 'rgba(124,92,252,0.5)',
          }}
        >
          {pair.a}
        </div>
        <div className="text-white/40 text-3xl">•</div>
        <div
          className="w-28 h-28 rounded-3xl border-2 flex items-center justify-center text-2xl font-black text-white transition-all duration-300"
          style={{
            background: 'rgba(124,92,252,0.15)',
            borderColor: 'rgba(124,92,252,0.5)',
          }}
        >
          {pair.b}
        </div>
      </div>

      {/* Status / instruction */}
      <div className="text-center">
        {phase === 'playing' && (
          <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse">
            <span className="text-2xl">🔊</span>
            <span>استمع…</span>
          </div>
        )}
        {(phase === 'answer' || phase === 'feedback') && (
          <p className="text-white/70 text-base font-bold">هل الكلمتان متشابهتان أم مختلفتان؟</p>
        )}
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div
          className="text-4xl font-black text-center"
          style={{ color: feedback === 'correct' ? '#22c55e' : '#ef4444' }}
        >
          {feedback === 'correct' ? '✅ صحيح!' : '❌ خطأ!'}
        </div>
      )}

      {/* Answer buttons */}
      <div className="flex gap-4 w-full mt-2">
        <button
          onClick={() => handleAnswer(true)}
          disabled={phase !== 'answer'}
          className="flex-1 h-20 rounded-3xl text-xl font-black flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: phase === 'answer' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${phase === 'answer' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
            color: phase === 'answer' ? '#86efac' : 'rgba(255,255,255,0.3)',
            cursor: phase === 'answer' ? 'pointer' : 'not-allowed',
          }}
        >
          ✅ متشابهتان
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={phase !== 'answer'}
          className="flex-1 h-20 rounded-3xl text-xl font-black flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: phase === 'answer' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${phase === 'answer' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: phase === 'answer' ? '#fca5a5' : 'rgba(255,255,255,0.3)',
            cursor: phase === 'answer' ? 'pointer' : 'not-allowed',
          }}
        >
          ❌ مختلفتان
        </button>
      </div>

      {/* Replay button */}
      <button
        onClick={handleReplay}
        disabled={phase === 'playing' || phase === 'feedback'}
        className="px-6 py-2 rounded-xl border-2 border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        🔁 أعِد الاستماع
      </button>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
