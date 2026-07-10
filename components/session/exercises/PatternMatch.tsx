'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, pickWithRng, randIntWithRng, randBoolWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

// Each pattern = a 3x3 arrangement of symbols + colors
// Student picks which of 4 options matches the reference (one rotated/mirrored/wrong color)

type Cell = { shape: string; color: string } | null

const SHAPES = ['●', '■', '▲', '★', '◆', '♥']
const COLORS = ['#EF4444','#3B82F6','#22C55E','#EAB308','#A855F7','#F97316']
const BGSIZES: Record<number,number> = { 1: 3, 2: 3, 3: 4 }

function randColor(rng: Rng) { return pickWithRng(rng, COLORS) }
function randShape(rng: Rng) { return pickWithRng(rng, SHAPES) }

function makePattern(size: number, rng: Rng): Cell[] {
  const density = 0.65 + rng() * 0.25
  return Array.from({ length: size * size }, () =>
    rng() < density
      ? { shape: randShape(rng), color: randColor(rng) }
      : null
  )
}

function mutatePattern(cells: Cell[], mutations: number, rng: Rng): Cell[] {
  const copy = cells.map(c => c ? { ...c } : null)
  for (let i = 0; i < mutations; i++) {
    const idx = randIntWithRng(rng, 0, copy.length - 1)
    if (copy[idx]) {
      if (randBoolWithRng(rng)) copy[idx]!.color = randColor(rng)
      else copy[idx]!.shape = randShape(rng)
    } else {
      copy[idx] = { shape: randShape(rng), color: randColor(rng) }
    }
  }
  return copy
}

function cellsEqual(a: Cell[], b: Cell[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i]
    if (!x && !y) continue
    if (!x || !y) return false
    if (x.shape !== y.shape || x.color !== y.color) return false
  }
  return true
}

// A distractor MUST differ from the reference (and ideally from the other
// distractors) — otherwise a "wrong" choice can render pixel-identical to the
// reference, and a child picking the grid that looks exactly like it is scored
// wrong. mutatePattern can no-op (it may re-pick the same color/shape), so we
// retry until the result is genuinely distinct (capped to avoid any loop).
function distinctMutation(reference: Cell[], mutations: number, rng: Rng, avoid: Cell[][] = []): Cell[] {
  let cand = mutatePattern(reference, mutations, rng)
  for (let tries = 0; tries < 20 && (cellsEqual(cand, reference) || avoid.some(a => cellsEqual(cand, a))); tries++) {
    cand = mutatePattern(reference, mutations + (tries > 8 ? 1 : 0), rng)
  }
  return cand
}

function rotatePattern(cells: Cell[], size: number): Cell[] {
  const result: Cell[] = Array(size * size).fill(null)
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      result[c * size + (size - 1 - r)] = cells[r * size + c]
  return result
}

function shuffleArray<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Trial {
  reference: Cell[]
  choices: { cells: Cell[]; correct: boolean }[]
  size: number
}

function makeTrial(size: number, difficulty: 1|2|3, rng: Rng): Trial {
  const reference = makePattern(size, rng)
  const mutations = difficulty === 1 ? 2 : difficulty === 2 ? 1 : 1
  const wrong1 = distinctMutation(reference, mutations, rng)
  const wrong2 = distinctMutation(reference, mutations, rng, [wrong1])
  const rotated = rotatePattern(reference, size)
  const wrong3 = difficulty === 3 && !cellsEqual(rotated, reference)
    ? rotated  // a rotation of a symmetric pattern can equal the reference — only use it when it differs
    : distinctMutation(reference, mutations + 1, rng, [wrong1, wrong2])

  const choices = shuffleArray([
    { cells: reference.map(c => c ? { ...c } : null), correct: true },
    { cells: wrong1, correct: false },
    { cells: wrong2, correct: false },
    { cells: wrong3, correct: false },
  ], rng)
  return { reference, choices, size }
}

function PatternGrid({ cells, size, highlight = false }: { cells: Cell[]; size: number; highlight?: boolean }) {
  const cellSize = size === 4 ? 34 : 42
  return (
    <div
      className="rounded-2xl p-2 inline-grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        background: highlight ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.06)',
        border: highlight ? '2px solid rgba(124,92,252,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className="rounded-xl flex items-center justify-center"
          style={{ width: cellSize, height: cellSize, background: 'rgba(255,255,255,0.04)' }}
        >
          {cell && (
            <span
              className="select-none leading-none"
              style={{ fontSize: cellSize * 0.52, color: cell.color, textShadow: `0 2px 6px ${cell.color}66` }}
            >
              {cell.shape}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PatternMatch({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const rng    = useRef(createRng(seed ?? Date.now())).current
  const size   = BGSIZES[difficulty] || 3
  const ROUNDS = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6

  const [started, setStarted]    = useState(false)
  const [round, setRound]        = useState(0)
  const [trial, setTrial]        = useState<Trial>(() => makeTrial(size, difficulty, rng))
  const [selected, setSelected]  = useState<number | null>(null)
  const [feedback, setFeedback]  = useState<'correct' | 'wrong' | null>(null)
  const [scores, setScores]      = useState<number[]>([])
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function pick(idx: number) {
    if (feedback !== null) return
    setSelected(idx)
    const isCorrect = trial.choices[idx].correct
    setFeedback(isCorrect ? 'correct' : 'wrong')
    const newScores = [...scores, isCorrect ? 100 : 0]
    setScores(newScores)
    const nc = newScores.filter(s => s === 100).length
    const ne = newScores.filter(s => s === 0).length
    onProgress?.({ answered: round + 1, total: ROUNDS, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      setFeedback(null)
      setSelected(null)
      if (round + 1 >= ROUNDS) {
        const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType: 'pattern-match',
          exerciseLabelAr: 'مطابقة الأنماط',
          score: avg,
          accuracy: avg,
          duration: dur,
          errors: newScores.filter(s => s === 0).length,
          metadata: { rounds: ROUNDS, scores: newScores },
          completedAt: new Date().toISOString(),
        })
      } else {
        setRound(r => r + 1)
        setTrial(makeTrial(size, difficulty, rng))
      }
    }, 700)
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-6xl">🔍</div>
        <h2 className="text-white font-black text-2xl text-center">مطابقة الأنماط</h2>
        <div className="bg-white/5 rounded-2xl p-5 max-w-xs w-full text-center">
          <p className="text-white/70 text-sm leading-relaxed">
            انظر للنمط المرجعي وابحث عن النسخة المطابقة تماماً بين 4 خيارات
          </p>
          <div className="mt-4 flex justify-center">
            <PatternGrid cells={trial.reference} size={trial.size} />
          </div>
        </div>
        <div className="text-white/40 text-xs">{ROUNDS} جولات</div>
        <button
          onClick={() => { startRef.current = Date.now(); setStarted(true) }}
          className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين 🚀
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto py-4 px-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-xs">{round + 1} / {ROUNDS}</span>
        <span className="text-white/50 text-xs">صحيح: {scores.filter(s => s === 100).length}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-5">
        <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${(round / ROUNDS) * 100}%` }} />
      </div>

      {/* Feedback flash */}
      {feedback && (
        <div className={`text-center font-black text-xl mb-3 transition-all ${
          feedback === 'correct' ? 'text-green-400' : 'text-red-400'
        }`}>
          {feedback === 'correct' ? '✓ ممتاز!' : '✗ ليست هي'}
        </div>
      )}

      {/* Reference */}
      <div className="text-center mb-5">
        <p className="text-white/50 text-xs mb-3">النمط المرجعي</p>
        <div className="flex justify-center">
          <PatternGrid cells={trial.reference} size={trial.size} highlight />
        </div>
      </div>

      {/* Choices */}
      <p className="text-white/50 text-xs text-center mb-3">أيها يطابق النمط أعلاه؟</p>
      <div className="grid grid-cols-2 gap-3">
        {trial.choices.map((choice, idx) => {
          const isSelected = selected === idx
          const showResult = feedback !== null
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              disabled={feedback !== null}
              className={`flex justify-center items-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                isSelected && feedback === 'correct' ? 'border-green-500 bg-green-900/20' :
                isSelected && feedback === 'wrong'   ? 'border-red-500 bg-red-900/20' :
                showResult && choice.correct         ? 'border-green-500/50 bg-green-900/10' :
                'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <PatternGrid cells={choice.cells} size={trial.size} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
