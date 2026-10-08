'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'
import { QuizProgress, choiceStyle, staggerDelay, type ChoiceState } from './quiz-ui'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface Emotion { emoji: string; label: string; distractors: string[] }

const ALL_EMOTIONS: Emotion[] = [
  { emoji: '😊', label: 'سعيد',     distractors: ['حزين', 'غاضب'] },
  { emoji: '😢', label: 'حزين',     distractors: ['سعيد', 'خائف'] },
  { emoji: '😡', label: 'غاضب',     distractors: ['سعيد', 'محبط'] },
  { emoji: '😨', label: 'خائف',     distractors: ['حزين', 'مندهش'] },
  { emoji: '😮', label: 'مندهش',    distractors: ['خائف', 'سعيد'] },
  { emoji: '😴', label: 'متعب',     distractors: ['هادئ', 'حزين'] },
  { emoji: '🤢', label: 'متضايق',   distractors: ['غاضب', 'خائف'] },
  { emoji: '😤', label: 'محبط',     distractors: ['غاضب', 'حزين'] },
  { emoji: '😌', label: 'هادئ',     distractors: ['سعيد', 'متعب'] },
  { emoji: '🥳', label: 'متحمس',    distractors: ['سعيد', 'مندهش'] },
  { emoji: '😕', label: 'محتار',    distractors: ['حزين', 'هادئ'] },
  { emoji: '🤩', label: 'منبهر',    distractors: ['سعيد', 'مندهش'] },
  { emoji: '😳', label: 'محرج',     distractors: ['خائف', 'محبط'] },
  { emoji: '🥱', label: 'ضجران',    distractors: ['متعب', 'هادئ'] },
  { emoji: '😱', label: 'مرعوب',    distractors: ['خائف', 'مندهش'] },
  { emoji: '🤗', label: 'ودود',     distractors: ['سعيد', 'هادئ'] },
]

export default function EmotionMirror({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng             = useRef(createRng(seed ?? Date.now())).current
  const count           = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 16
  const [questions]     = useState<Emotion[]>(() => shuffleWithRng(rng, ALL_EMOTIONS).slice(0, count))

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<string | null>(null)
  const [correct,  setCorrect]  = useState(0)
  const [errors,   setErrors]   = useState(0)
  const [startMs]               = useState(Date.now())

  const q = questions[idx]
  const choices = useMemo(() => shuffleWithRng(rng, [q.label, ...q.distractors]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleChoice(label: string) {
    if (chosen) return
    setChosen(label)
    const isCorrect = label === q.label
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors + (isCorrect ? 0 : 1)
    setCorrect(nc)
    setErrors(ne)
    onProgress?.({ answered: idx + 1, total: count, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      const nextIdx = idx + 1
      if (nextIdx >= count) {
        const score = Math.round((nc / count) * 100)
        onComplete({
          exerciseType:    'emotion-mirror',
          exerciseLabelAr: 'مرآة المشاعر',
          score,
          accuracy: score,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(nextIdx)
        setChosen(null)
      }
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">مرآة المشاعر</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <QuizProgress value={(idx / count) * 100} />

      <div className="text-sm text-white/50">ما هذا الشعور؟</div>

      {/* Big emoji — spotlight tile that re-animates on each new face */}
      <div key={idx} className="flex items-center justify-center rounded-[2rem] quiz-choice-in"
        style={{ fontSize: 120, width: 180, height: 180,
          background: 'radial-gradient(circle at 42% 35%, rgba(139,92,246,0.38), rgba(139,92,246,0.06) 72%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 0 42px rgba(139,92,246,0.35), inset 0 2px 12px rgba(255,255,255,0.10)' }}>
        <span style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.30))' }}>{q.emoji}</span>
      </div>

      {/* After answer: show label */}
      {chosen && (
        <div className={`text-xl font-black ${chosen === q.label ? 'text-green-400' : 'text-red-400'}`}>
          {chosen === q.label ? `✅ ${q.label}` : `❌ الإجابة: ${q.label}`}
        </div>
      )}

      {/* Choices */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {choices.map((c, i) => {
          const isCorrectChoice = c === q.label
          const isChosen        = c === chosen
          let state: ChoiceState = 'idle'
          if (isChosen && isCorrectChoice) state = 'correct'
          else if (isChosen)               state = 'wrong'
          else if (chosen && isCorrectChoice) state = 'reveal'
          return (
            <button key={`${idx}-${c}`} onClick={() => handleChoice(c)}
              disabled={!!chosen}
              className="w-full py-4 rounded-2xl text-xl font-black text-white border-2 transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[.97] disabled:cursor-not-allowed quiz-choice-in"
              style={{ ...choiceStyle(state), ...staggerDelay(i) }}>
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
