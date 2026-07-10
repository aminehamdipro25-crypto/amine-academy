'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, randIntWithRng, type Rng } from '@/lib/seeded-random'

const EMOJI_POOL = [
  '🌟','🍎','🐶','🚗','🌈','🎯','🐬','🦋','🍓','🎪',
  '🌺','🏆','🎨','🎭','🐸','🌙','⭐','🍕','🎸','🐠',
  '🌴','🦄','🍔','🚌','✈️','🔴','🔵','🟡','⚽','🏀',
  '📚','👕','🌞','🎺','🍜','🐱','🐭','🚀','🦊','🐧',
]

const TOTAL_ROUNDS = 5

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface RoundData {
  target: string
  grid: string[]
  targetIndex: number
}

type Phase = 'playing' | 'feedback' | 'done'

function buildRound(rng: Rng, gridSize: number): RoundData {
  const pool = [...EMOJI_POOL]
  const shuffled = shuffleWithRng(rng, pool)
  const total = gridSize * gridSize
  const targetIndex = randIntWithRng(rng, 0, total - 1)
  const target = shuffled[0]
  const distractors = shuffled.slice(1, total)
  // Ensure distractors fill the grid — if not enough unique, repeat with different ones
  const grid: string[] = []
  for (let i = 0; i < total; i++) {
    if (i === targetIndex) {
      grid.push(target)
    } else {
      grid.push(distractors[(i < targetIndex ? i : i - 1) % distractors.length])
    }
  }
  return { target, grid, targetIndex }
}

export default function VisualSearch({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const gridSize = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5

  const [round, setRound] = useState(0)
  const [roundData, setRoundData] = useState<RoundData>(() => buildRound(rng, gridSize))
  const [errors, setErrors] = useState(0)
  const [roundErrors, setRoundErrors] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [roundStart, setRoundStart] = useState(Date.now())
  const [roundTimes, setRoundTimes] = useState<number[]>([])
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false)   // guard — onComplete fires at most once

  useEffect(() => {
    startRef.current = Date.now()
    setRoundStart(Date.now())
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const finishGame = useCallback((finalErrors: number, times: number[]) => {
    if (doneRef.current) return
    doneRef.current = true
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    // Slowness penalty: if avg > 5s, subtract up to 20 points
    const slownessPenalty = Math.min(20, Math.max(0, Math.round((avgTime - 5000) / 500)))
    const score = Math.max(0, 100 - finalErrors * 5 - slownessPenalty)
    const accuracy = Math.round(Math.max(0, (TOTAL_ROUNDS / (TOTAL_ROUNDS + finalErrors)) * 100))
    setPhase('done')
    onComplete({
      exerciseType: 'visual-search',
      exerciseLabelAr: 'البحث البصري',
      score,
      accuracy,
      duration: dur,
      errors: finalErrors,
      metadata: {
        rounds: TOTAL_ROUNDS,
        gridSize,
        avgFindTimeMs: Math.round(avgTime),
        difficulty,
      },
      completedAt: new Date().toISOString(),
    })
  }, [gridSize, difficulty, onComplete])

  const handleTap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    if (idx === roundData.targetIndex) {
      // Correct
      const elapsed = Date.now() - roundStart
      const newTimes = [...roundTimes, elapsed]
      // Lock the round immediately — the top-of-handler `phase !== 'playing'` guard now
      // blocks a stray tap during the 600ms window, so it can't re-run this branch
      // (double finishGame / an extra buildRound that would desync the seeded RNG).
      setPhase('feedback')
      setFeedback('correct')
      setRoundTimes(newTimes)
      setTotalTime(t => t + elapsed)
      onProgress?.({ answered: round + 1, total: TOTAL_ROUNDS, correct: round + 1, errors, lastCorrect: true })
      const nextRound = round + 1
      timerRef.current = setTimeout(() => {
        setFeedback(null)
        if (nextRound >= TOTAL_ROUNDS) {
          finishGame(errors + roundErrors, newTimes)
        } else {
          setRound(nextRound)
          setRoundData(buildRound(rng, gridSize))
          setRoundErrors(0)
          setRoundStart(Date.now())
          setPhase('playing')
        }
      }, 600)
    } else {
      // Wrong
      setErrors(e => e + 1)
      setRoundErrors(e => e + 1)
      setShakeIdx(idx)
      setFeedback('wrong')
      onProgress?.({ answered: round + 1, total: TOTAL_ROUNDS, correct: round, errors: errors + 1, lastCorrect: false })
      timerRef.current = setTimeout(() => {
        setShakeIdx(null)
        setFeedback(null)
      }, 500)
    }
  }, [phase, roundData.targetIndex, round, roundTimes, roundStart, errors, roundErrors, gridSize, finishGame, onProgress])

  if (phase === 'done') return null

  const cols = gridSize

  return (
    <div dir="rtl" className="flex flex-col items-center gap-5 p-5 select-none min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{TOTAL_ROUNDS}</div>
          <div className="text-xs text-white/50">جولات</div>
        </div>
        <h2 className="text-xl font-black text-white">البحث البصري</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{errors}</div>
          <div className="text-xs text-white/50">أخطاء</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md bg-white/10 rounded-full h-2">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Target display */}
      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-200
        ${feedback === 'correct' ? 'bg-green-500/20 border-green-400' :
          feedback === 'wrong' ? 'bg-red-500/10 border-red-400/50' :
          'bg-white/10 border-brand-400'}`}
      >
        <span className="text-white/70 font-bold text-sm">ابحث عن:</span>
        <span className="text-4xl">{roundData.target}</span>
        {feedback === 'correct' && <span className="text-green-400 font-black text-lg">✓</span>}
        {feedback === 'wrong' && <span className="text-red-400 font-black text-lg">✗</span>}
      </div>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: 440 }}
      >
        {roundData.grid.map((emoji, idx) => (
          <button
            key={`${round}-${idx}`}
            onClick={() => handleTap(idx)}
            className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
              ${shakeIdx === idx
                ? 'bg-red-500/30 border-2 border-red-400'
                : feedback === 'correct' && idx === roundData.targetIndex
                  ? 'bg-green-500/30 border-2 border-green-400 scale-110'
                  : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
              }`}
            style={{
              width: difficulty === 3 ? 64 : 76,
              height: difficulty === 3 ? 64 : 76,
              fontSize: difficulty === 3 ? 28 : 34,
              animation: shakeIdx === idx ? 'shake 0.4s ease-in-out' : undefined,
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mt-auto"
      >
        ← إنهاء التمرين
      </button>
    </div>
  )
}
