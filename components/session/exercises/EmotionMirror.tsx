'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
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

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function EmotionMirror({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count           = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 16
  const [questions]     = useState<Emotion[]>(() => shuffle(ALL_EMOTIONS).slice(0, count))

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<string | null>(null)
  const [correct,  setCorrect]  = useState(0)
  const [errors,   setErrors]   = useState(0)
  const [startMs]               = useState(Date.now())

  const q = questions[idx]
  const choices = useMemo(() => shuffle([q.label, ...q.distractors]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps
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

      <div className="text-sm text-white/50">ما هذا الشعور؟</div>

      {/* Big emoji */}
      <div className="flex items-center justify-center rounded-3xl"
        style={{ fontSize: 120, width: 180, height: 180,
          background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
        {q.emoji}
      </div>

      {/* After answer: show label */}
      {chosen && (
        <div className={`text-xl font-black ${chosen === q.label ? 'text-green-400' : 'text-red-400'}`}>
          {chosen === q.label ? `✅ ${q.label}` : `❌ الإجابة: ${q.label}`}
        </div>
      )}

      {/* Choices */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {choices.map(c => {
          const isCorrectChoice = c === q.label
          const isChosen        = c === chosen
          let bg = 'bg-white/10 hover:bg-white/20'
          if (isChosen && isCorrectChoice) bg = 'bg-green-500/30 border-green-400'
          if (isChosen && !isCorrectChoice) bg = 'bg-red-500/30 border-red-400'
          if (chosen && !isChosen && isCorrectChoice) bg = 'bg-green-500/20 border-green-400/50'
          return (
            <button key={c} onClick={() => handleChoice(c)}
              disabled={!!chosen}
              className={`w-full py-4 rounded-2xl text-xl font-black text-white border-2 transition-all
                disabled:cursor-not-allowed border-transparent ${bg}`}>
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
