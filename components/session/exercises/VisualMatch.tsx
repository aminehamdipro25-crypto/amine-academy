'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

const ITEMS = [
  { emoji: '🐱', label: 'قطة' },
  { emoji: '🐶', label: 'كلب' },
  { emoji: '🐸', label: 'ضفدع' },
  { emoji: '🐘', label: 'فيل' },
  { emoji: '🦁', label: 'أسد' },
  { emoji: '🐻', label: 'دب' },
  { emoji: '🐧', label: 'بطريق' },
  { emoji: '🦋', label: 'فراشة' },
  { emoji: '🌸', label: 'وردة' },
  { emoji: '🍎', label: 'تفاحة' },
  { emoji: '🍌', label: 'موزة' },
  { emoji: '⭐', label: 'نجمة' },
  { emoji: '🌙', label: 'قمر' },
  { emoji: '☀️', label: 'شمس' },
  { emoji: '🌈', label: 'قوس قزح' },
  { emoji: '🚗', label: 'سيارة' },
  { emoji: '✈️', label: 'طيارة' },
  { emoji: '🏠', label: 'بيت' },
  { emoji: '📚', label: 'كتاب' },
  { emoji: '⚽', label: 'كرة' },
]

const TOTAL_ROUNDS = 10

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildRound(optionCount: number) {
  const shuffled = shuffle(ITEMS)
  const target = shuffled[0]
  const options = shuffle(shuffled.slice(0, optionCount))
  return { target, options }
}

export default function VisualMatch({ onComplete, onCancel, difficulty = 1 }: Props) {
  const optionCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 6
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'play'|'feedback'>('play')
  const [roundData, setRoundData] = useState(() => buildRound(optionCount))

  const handleSelect = useCallback((idx: number) => {
    if (phase !== 'play') return
    const isCorrect = roundData.options[idx].emoji === roundData.target.emoji
    const cIdx = roundData.options.findIndex(o => o.emoji === roundData.target.emoji)
    setSelected(idx)
    setCorrectIdx(cIdx)
    setPhase('feedback')
    const newCorrect = correct + (isCorrect ? 1 : 0)
    const newErrors  = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(newCorrect)
    else setErrors(newErrors)
    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        onComplete({
          exerciseType:    'visual-match',
          exerciseLabelAr: 'مطابقة الصور',
          score:     Math.round((newCorrect / TOTAL_ROUNDS) * 100),
          accuracy:  Math.round((newCorrect / TOTAL_ROUNDS) * 100),
          duration:  Math.round((Date.now() - startRef.current) / 1000),
          errors:    newErrors,
          metadata:  { rounds: TOTAL_ROUNDS, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setRound(nextRound)
      setRoundData(buildRound(optionCount))
      setSelected(null)
      setCorrectIdx(null)
      setPhase('play')
    }, 800)
  }, [phase, roundData, correct, errors, round, optionCount, onComplete, difficulty])

  const { target, options } = roundData
  const progress = (round / TOTAL_ROUNDS) * 100

  return (
    <div className="flex flex-col items-center gap-5 p-5 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-white">{round + 1}/{TOTAL_ROUNDS}</div>
          <div className="text-[10px] text-white/40">جولة</div>
        </div>
        <h2 className="font-black text-white text-base">مطابقة الصور</h2>
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-green-400">{correct}</div>
          <div className="text-[10px] text-white/40">صحيح</div>
        </div>
      </div>
      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/50 text-xs font-bold">أوجد الصورة المطابقة</p>
        <div className="w-32 h-32 rounded-3xl bg-brand-600/30 border-2 border-brand-400/60 flex items-center justify-center shadow-lg">
          <span className="text-8xl">{target.emoji}</span>
        </div>
        <p className="text-white/70 text-sm font-bold">{target.label}</p>
      </div>
      <div className={`grid gap-3 w-full max-w-sm ${optionCount <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {options.map((opt, idx) => {
          let cls = 'bg-white/10 border-2 border-white/20 active:scale-90'
          if (phase === 'feedback') {
            if (idx === correctIdx)                          cls = 'bg-green-500/30 border-2 border-green-400 scale-105'
            else if (idx === selected && idx !== correctIdx) cls = 'bg-red-500/30 border-2 border-red-400'
            else                                             cls = 'bg-white/5 border-2 border-white/10 opacity-40'
          }
          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={phase !== 'play'}
              className={`rounded-2xl flex flex-col items-center justify-center gap-1 py-4 transition-all duration-200 ${cls}`}>
              <span className="text-5xl">{opt.emoji}</span>
              <span className="text-white/60 text-xs font-bold">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-2">← إنهاء التمرين</button>
    </div>
  )
}
