'use client'
import { useState, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Puzzle {
  sequence: string[]   // pattern with last item as '?'
  answer:   string
  choices:  string[]
}

const ALL_PUZZLES: Puzzle[] = [
  { sequence:['🔴','🔵','🔴','🔵','?'], answer:'🔴', choices:['🔴','🟡','🟢'] },
  { sequence:['🌟','🌙','🌟','🌙','?'], answer:'🌟', choices:['🌟','☀️','⭐'] },
  { sequence:['🐶','🐱','🐶','🐱','?'], answer:'🐶', choices:['🐶','🐸','🐦'] },
  { sequence:['🍎','🍊','🍋','🍎','🍊','?'], answer:'🍋', choices:['🍋','🍇','🍓'] },
  { sequence:['⬆️','➡️','⬇️','⬆️','➡️','?'], answer:'⬇️', choices:['⬇️','⬅️','↩️'] },
  { sequence:['1️⃣','2️⃣','3️⃣','1️⃣','2️⃣','?'], answer:'3️⃣', choices:['3️⃣','4️⃣','5️⃣'] },
  { sequence:['🔺','🔷','🔺','🔷','🔺','?'], answer:'🔷', choices:['🔷','🔶','🔻'] },
  { sequence:['😊','😊','😢','😊','😊','?'], answer:'😢', choices:['😢','😡','😮'] },
  { sequence:['🌱','🌿','🌳','🌱','🌿','?'], answer:'🌳', choices:['🌳','🌲','🌴'] },
  { sequence:['🐣','🐥','🐔','🐣','🐥','?'], answer:'🐔', choices:['🐔','🦆','🦅'] },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function PatternPuzzle({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 4 : difficulty === 2 ? 7 : 10
  const puzzles = useMemo(() => ALL_PUZZLES.slice(0, count), [count])

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())

  const p = puzzles[idx]
  const shuffledChoices = useMemo(() => shuffle(p.choices), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === p.answer
    if (isCorrect) setCorrect(v => v + 1)
    else           setErrors(v => v + 1)

    setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        const nc = correct + (isCorrect ? 1 : 0)
        onComplete({
          exerciseType:    'pattern-puzzle',
          exerciseLabelAr: 'أكمل النمط',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   errors + (isCorrect ? 0 : 1),
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setChosen(null)
      }
    }, 1400)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">نمط</div>
        </div>
        <h2 className="text-xl font-black text-white">أكمل النمط</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Pattern */}
      <div className="flex gap-2 flex-wrap justify-center">
        {p.sequence.map((s, i) => (
          <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 ${
            s === '?' ? 'border-brand-400 bg-brand-400/15 text-brand-400 text-2xl font-black' : 'border-white/20 bg-white/5'
          }`}>
            {s === '?' ? '؟' : s}
          </div>
        ))}
      </div>

      {/* Choices */}
      <div className="flex gap-4 justify-center">
        {shuffledChoices.map(c => {
          const isChosen  = c === chosen
          const isCorrect = c === p.answer
          let cls = 'border-white/20 bg-white/5 hover:bg-white/15'
          if (isChosen && isCorrect)  cls = 'border-green-400 bg-green-400/20'
          if (isChosen && !isCorrect) cls = 'border-red-400 bg-red-400/20'
          if (chosen && !isChosen && isCorrect) cls = 'border-green-400/50 bg-green-400/10'
          return (
            <button key={c} onClick={() => handleChoice(c)} disabled={!!chosen}
              className={`w-20 h-20 rounded-2xl text-4xl border-2 flex items-center justify-center
                transition-all active:scale-90 disabled:cursor-not-allowed ${cls}`}>
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
