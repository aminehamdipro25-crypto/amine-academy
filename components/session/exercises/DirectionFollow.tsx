'use client'
import { useState, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

type Dir = 'up'|'down'|'left'|'right'
const DIR_EMOJI: Record<Dir, string> = { up:'⬆️', down:'⬇️', left:'⬅️', right:'➡️' }
const DIR_AR:    Record<Dir, string> = { up:'فوق', down:'تحت', left:'يسار', right:'يمين' }
const DIRS: Dir[] = ['up','down','left','right']

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

interface Q { grid: Dir[][]; row: number; col: number; answer: Dir }

function genGrid(size: number): Q {
  const grid: Dir[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => DIRS[Math.floor(Math.random() * 4)])
  )
  const row = Math.floor(Math.random() * size)
  const col = Math.floor(Math.random() * size)
  const answer = grid[row][col]
  return { grid, row, col, answer }
}

export default function DirectionFollow({ onComplete, onCancel, difficulty = 1 }: Props) {
  const SIZE  = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const TOTAL = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10

  const [idx,     setIdx]     = useState(0)
  const [q,       setQ]       = useState<Q>(() => genGrid(SIZE))
  const [chosen,  setChosen]  = useState<Dir | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())

  const choices = useMemo(() => shuffle([...DIRS]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(d: Dir) {
    if (chosen) return
    setChosen(d)
    const isCorrect = d === q.answer
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors + (isCorrect ? 0 : 1)
    setCorrect(nc)
    setErrors(ne)

    setTimeout(() => {
      const next = idx + 1
      if (next >= TOTAL) {
        onComplete({
          exerciseType:    'direction-follow',
          exerciseLabelAr: 'اتباع الاتجاهات',
          score:    Math.round((nc / TOTAL) * 100),
          accuracy: Math.round((nc / TOTAL) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: TOTAL, correct: nc, gridSize: SIZE },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setQ(genGrid(SIZE))
        setChosen(null)
      }
    }, 1300)
  }

  const CELL = SIZE <= 3 ? 72 : SIZE === 4 ? 58 : 48

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{TOTAL}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">اتباع الاتجاهات</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="text-white/60 text-sm">ما اتجاه السهم في المربع المضيء؟</div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${SIZE}, ${CELL}px)`, gap: 4 }}>
        {q.grid.map((row, r) =>
          row.map((dir, c) => {
            const isTarget = r === q.row && c === q.col
            return (
              <div key={`${r}-${c}`}
                style={{
                  width: CELL, height: CELL,
                  borderRadius: 12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: CELL * 0.45,
                  background: isTarget ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isTarget ? '#7C5CFC' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isTarget ? '0 0 20px rgba(124,92,252,0.5)' : 'none',
                  filter: isTarget ? 'none' : 'opacity(0.5)',
                }}>
                {DIR_EMOJI[dir]}
              </div>
            )
          })
        )}
      </div>

      {/* Answer choices */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
        {choices.map(d => {
          const isChosen  = d === chosen
          const isCorrect = d === q.answer
          let cls = 'bg-white/8 border-white/15 hover:bg-white/15'
          if (isChosen && isCorrect)  cls = 'bg-green-500/25 border-green-400'
          if (isChosen && !isCorrect) cls = 'bg-red-500/25 border-red-400'
          if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/10 border-green-400/40'
          return (
            <button key={d} onClick={() => handleChoice(d)} disabled={!!chosen}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all
                disabled:cursor-not-allowed ${cls}`}>
              <span className="text-2xl">{DIR_EMOJI[d]}</span>
              <span className="text-white font-black text-sm">{DIR_AR[d]}</span>
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
