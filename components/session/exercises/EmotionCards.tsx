'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, pickWithRng } from '@/lib/seeded-random'

const TOTAL = 14

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface Emotion {
  emoji: string
  nameAr: string
  key: string
}

const BASIC: Emotion[] = [
  { emoji: '😊', nameAr: 'سعيد',   key: 'happy'   },
  { emoji: '😢', nameAr: 'حزين',   key: 'sad'     },
  { emoji: '😠', nameAr: 'غاضب',   key: 'angry'   },
  { emoji: '😨', nameAr: 'خائف',   key: 'scared'  },
]

const ADVANCED: Emotion[] = [
  ...BASIC,
  { emoji: '😲', nameAr: 'مندهش',  key: 'surprised' },
  { emoji: '🤩', nameAr: 'متحمس',  key: 'excited'   },
  { emoji: '😴', nameAr: 'متعب',   key: 'tired'     },
  { emoji: '🥰', nameAr: 'محب',    key: 'loving'    },
]

function makeTrial(rng: ReturnType<typeof createRng>, emotions: Emotion[], difficulty: 1|2|3) {
  const target = pickWithRng(rng, emotions)
  const pool   = difficulty === 1 ? BASIC : ADVANCED
  // Pick 3 distractors (different from target)
  const distractors = shuffleWithRng(rng, pool.filter(e => e.key !== target.key)).slice(0, 3)
  const choices = shuffleWithRng(rng, [target, ...distractors])
  return { target, choices }
}

export default function EmotionCards({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const emotions = studentAge <= 9 || difficulty === 1 ? BASIC : ADVANCED

  const [started, setStarted]   = useState(false)
  const [trial, setTrial]       = useState(0)
  const [current, setCurrent]   = useState(() => makeTrial(rng, emotions, difficulty))
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [result, setResult]     = useState<ExerciseResult | null>(null)

  const correctRef = useRef(0)
  const errRef     = useRef(0)
  const startRef   = useRef(Date.now())
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function start() {
    startRef.current = Date.now()
    setCurrent(makeTrial(rng, emotions, difficulty))
    setStarted(true)
  }

  function answer(key: string) {
    if (feedback !== null) return
    const isCorrect = key === current.target.key
    if (isCorrect) correctRef.current++
    else           errRef.current++
    setFeedback(isCorrect ? 'correct' : 'wrong')
    onProgress?.({ answered: trial + 1, total: TOTAL, correct: correctRef.current, errors: errRef.current, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      setFeedback(null)
      const next = trial + 1
      if (next >= TOTAL) {
        const score = Math.round((correctRef.current / TOTAL) * 100)
        setResult({
          exerciseType:    'emotion-cards',
          exerciseLabelAr: 'التعرف على المشاعر',
          score,
          accuracy: score,
          duration: Math.round((Date.now() - startRef.current) / 1000),
          errors:   errRef.current,
          metadata: { correct: correctRef.current, total: TOTAL, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setTrial(next)
        setCurrent(makeTrial(rng, emotions, difficulty))
      }
    }, 600)
  }

  // ── Intro ──────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-7xl">🎭</div>
        <h2 className="text-white font-black text-2xl text-center">التعرف على المشاعر</h2>
        <div className="bg-white/5 rounded-2xl p-5 text-center max-w-xs w-full">
          <p className="text-white/70 text-sm mb-4">انظر إلى وجه المشاعر واختر اسمه الصحيح</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {BASIC.map(e => (
              <div key={e.key} className="flex flex-col items-center gap-1">
                <span className="text-4xl">{e.emoji}</span>
                <span className="text-white/60 text-xs">{e.nameAr}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={start}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{correctRef.current}</div>
            <div className="text-xs text-white/50">صحيح</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{errRef.current}</div>
            <div className="text-xs text-white/50">خطأ</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-4xl">{result.score}%</div>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  // ── Active game ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full select-none">
      {/* Progress */}
      <div className="px-6 py-3">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">{trial + 1} / {TOTAL}</span>
          <span className="text-white/50 text-xs">صحيح: {correctRef.current}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${(trial / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Face display */}
      <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-150 ${
        feedback === 'correct' ? 'bg-green-900/20' : feedback === 'wrong' ? 'bg-red-900/20' : ''
      }`}>
        <div className="text-[120px] leading-none mb-4 select-none">
          {current.target.emoji}
        </div>
        {feedback === null    && <p className="text-white/40 text-sm">ما هذا الشعور؟</p>}
        {feedback === 'correct' && <p className="text-green-400 font-black text-xl">✓ ممتاز!</p>}
        {feedback === 'wrong'   && (
          <p className="text-red-400 font-black text-xl">
            ✗ هذا <span className="text-white">{current.target.nameAr}</span>
          </p>
        )}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-4">
        {current.choices.map(e => (
          <button
            key={e.key}
            onClick={() => answer(e.key)}
            disabled={feedback !== null}
            className={`py-4 rounded-2xl font-black text-lg text-white transition-all active:scale-95
              bg-white/10 border border-white/20 hover:bg-white/20
              ${feedback !== null ? 'opacity-50 cursor-not-allowed' : ''}
              ${feedback !== null && e.key === current.target.key ? '!bg-green-600/40 !border-green-500 !opacity-100' : ''}
            `}
          >
            {e.nameAr}
          </button>
        ))}
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
