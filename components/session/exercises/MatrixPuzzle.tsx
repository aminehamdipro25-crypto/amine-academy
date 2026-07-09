'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

// 3×3 grid — the last cell (index 8) is always "?" and holds the answer
interface MP {
  grid:    [string,string,string,string,string,string,string,string,string]
  answer:  string
  choices: [string,string,string,string]
}

// ── EASY: repeating columns (same emoji in each column) ───────────────────────
const EASY: MP[] = [
  { grid:['🐱','🐶','🐰', '🐱','🐶','🐰', '🐱','🐶','?'], answer:'🐰', choices:['🐰','🐸','🦊','🐻'] },
  { grid:['🔴','🔵','🟡', '🔴','🔵','🟡', '🔴','🔵','?'], answer:'🟡', choices:['🟡','🟢','🟠','🟣'] },
  { grid:['⭐','🌙','☀️', '⭐','🌙','☀️', '⭐','🌙','?'], answer:'☀️', choices:['☀️','🌟','💫','✨'] },
  { grid:['🍎','🍊','🍋', '🍎','🍊','🍋', '🍎','🍊','?'], answer:'🍋', choices:['🍋','🍇','🍓','🍑'] },
  { grid:['🏠','🚗','✈️', '🏠','🚗','✈️', '🏠','🚗','?'], answer:'✈️', choices:['✈️','🚂','🚢','🚀'] },
  { grid:['😊','😢','😡', '😊','😢','😡', '😊','😢','?'], answer:'😡', choices:['😡','😮','😴','🤔'] },
  { grid:['🌱','🌿','🌳', '🌱','🌿','🌳', '🌱','🌿','?'], answer:'🌳', choices:['🌳','🌲','🌴','🌾'] },
  { grid:['1️⃣','2️⃣','3️⃣', '1️⃣','2️⃣','3️⃣', '1️⃣','2️⃣','?'], answer:'3️⃣', choices:['3️⃣','4️⃣','5️⃣','6️⃣'] },
]

// ── MEDIUM: Latin-square — each row & each column contains all 3 emojis once ──
const MEDIUM: MP[] = [
  { grid:['🍎','🍊','🍋', '🍊','🍋','🍎', '🍋','🍎','?'], answer:'🍊', choices:['🍊','🍎','🍋','🍇'] },
  { grid:['🐱','🐶','🐰', '🐰','🐱','🐶', '🐶','🐰','?'], answer:'🐱', choices:['🐱','🐶','🐰','🐸'] },
  { grid:['🔴','🔵','🟡', '🟡','🔴','🔵', '🔵','🟡','?'], answer:'🔴', choices:['🔴','🔵','🟡','🟢'] },
  { grid:['⭐','🌙','☀️', '☀️','⭐','🌙', '🌙','☀️','?'], answer:'⭐', choices:['⭐','🌙','☀️','💫'] },
  { grid:['🎵','🎨','📚', '📚','🎵','🎨', '🎨','📚','?'], answer:'🎵', choices:['🎵','🎨','📚','🎮'] },
  { grid:['🐶','🐱','🐸', '🐸','🐶','🐱', '🐱','🐸','?'], answer:'🐶', choices:['🐶','🐱','🐸','🐰'] },
  { grid:['🌞','🌧️','❄️', '❄️','🌞','🌧️', '🌧️','❄️','?'], answer:'🌞', choices:['🌞','🌧️','❄️','🌈'] },
  { grid:['🏃','🤸','🧘', '🧘','🏃','🤸', '🤸','🧘','?'], answer:'🏃', choices:['🏃','🤸','🧘','🏊'] },
]

// ── HARD: Latin square with less familiar symbols — stronger reasoning needed ──
const HARD: MP[] = [
  { grid:['1️⃣','2️⃣','3️⃣', '2️⃣','3️⃣','1️⃣', '3️⃣','1️⃣','?'], answer:'2️⃣', choices:['2️⃣','1️⃣','3️⃣','4️⃣'] },
  { grid:['🌱','🌿','🌳', '🌿','🌳','🌱', '🌳','🌱','?'], answer:'🌿', choices:['🌿','🌱','🌳','🌲'] },
  { grid:['🐣','🐥','🐔', '🐥','🐔','🐣', '🐔','🐣','?'], answer:'🐥', choices:['🐥','🐣','🐔','🦆'] },
  { grid:['🔺','🔷','⚫', '🔷','⚫','🔺', '⚫','🔺','?'], answer:'🔷', choices:['🔷','🔺','⚫','🟡'] },
  { grid:['🍁','❄️','🌸', '❄️','🌸','🍁', '🌸','🍁','?'], answer:'❄️', choices:['❄️','🍁','🌸','☀️'] },
  { grid:['😊','😮','😴', '😮','😴','😊', '😴','😊','?'], answer:'😮', choices:['😮','😊','😴','😡'] },
  { grid:['🔵','🟣','🟠', '🟣','🟠','🔵', '🟠','🔵','?'], answer:'🟣', choices:['🟣','🔵','🟠','🟢'] },
  { grid:['🎯','🎲','🎸', '🎲','🎸','🎯', '🎸','🎯','?'], answer:'🎲', choices:['🎲','🎯','🎸','🎮'] },
]

export default function MatrixPuzzle({ onComplete, onCancel, difficulty = 1, studentAge, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const puzzles = useMemo(() => {
    if (difficulty === 1) return shuffleWithRng(rng, EASY)
    if (difficulty === 2) return shuffleWithRng(rng, [...EASY.slice(0, 4), ...MEDIUM])
    return shuffleWithRng(rng, [...MEDIUM, ...HARD])
  }, [difficulty, rng])

  const count = difficulty === 1 ? 6 : difficulty === 2 ? 10 : 14
  const subset = puzzles.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const p = subset[idx]
  const choices = useMemo(() => shuffleWithRng(rng, p.choices), [idx]) // eslint-disable-line

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === p.answer
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)
    onProgress?.({ answered: idx + 1, total: count, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= count) {
        onComplete({
          exerciseType:    'matrix-puzzle',
          exerciseLabelAr: 'أحجية المصفوفة',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(i => i + 1)
        setChosen(null)
      }
    }, 1400)
  }

  const cellSize = studentAge < 9 ? 80 : 72
  const emoji    = studentAge < 9 ? 30 : 26

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">أحجية المصفوفة</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${(idx / count) * 100}%`, background: '#7C5CFC' }} />
      </div>

      <p className="text-white/60 text-sm font-bold">ما الذي يكمل النمط؟</p>

      {/* 3×3 Matrix */}
      <div
        className="grid grid-cols-3 gap-2"
        style={{ direction: 'ltr' }}
      >
        {p.grid.map((cell, i) => (
          <div
            key={i}
            className="rounded-2xl flex items-center justify-center font-black"
            style={{
              width: cellSize, height: cellSize,
              background: cell === '?' ? 'rgba(124,92,252,0.22)' : 'rgba(255,255,255,0.07)',
              border: `2px solid ${cell === '?' ? '#7C5CFC' : 'rgba(255,255,255,0.12)'}`,
              fontSize: emoji,
            }}
          >
            {cell === '?' ? <span className="text-2xl text-[#7C5CFC] font-black">?</span> : cell}
          </div>
        ))}
      </div>

      {/* Choices — 4 options */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-1">
        {choices.map(c => {
          const isChosen  = c === chosen
          const isCor     = c === p.answer
          let bg = 'rgba(255,255,255,0.07)'; let bdr = 'rgba(255,255,255,0.15)'
          if (isChosen && isCor)            { bg = 'rgba(34,197,94,0.25)';  bdr = '#22c55e' }
          if (isChosen && !isCor)           { bg = 'rgba(239,68,68,0.25)';  bdr = '#ef4444' }
          if (chosen && !isChosen && isCor) { bg = 'rgba(34,197,94,0.12)';  bdr = 'rgba(34,197,94,0.4)' }
          return (
            <button
              key={c}
              onClick={() => handleChoice(c)}
              disabled={!!chosen}
              className="rounded-2xl border-2 flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              style={{ background: bg, borderColor: bdr, height: 72, fontSize: emoji + 4 }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="text-2xl font-black" style={{ color: chosen === p.answer ? '#22c55e' : '#ef4444' }}>
          {chosen === p.answer ? '✅ ممتاز!' : `❌ الصحيح: ${p.answer}`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
