'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface NumberItem {
  value: number
  x: number
  y: number
  state: 'idle' | 'correct' | 'wrong' | 'done'
}

const ROUNDS = 3
const CONTAINER_W = 380
const CONTAINER_H = 320
const BTN = 64 // w-16 h-16

function generatePositions(count: number, rng: Rng): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const maxX = CONTAINER_W - BTN - 8
  const maxY = CONTAINER_H - BTN - 8
  let attempts = 0
  while (positions.length < count && attempts < 3000) {
    attempts++
    const x = 8 + rng() * maxX
    const y = 8 + rng() * maxY
    const ok = positions.every(p => Math.hypot(p.x - x, p.y - y) > BTN + 8)
    if (ok) positions.push({ x, y })
  }
  return positions
}

function buildRound(max: number, rng: Rng): NumberItem[] {
  const positions = generatePositions(max, rng)
  return Array.from({ length: max }, (_, i) => ({
    value: i + 1,
    x: positions[i]?.x ?? 8 + (i % 5) * 70,
    y: positions[i]?.y ?? 8 + Math.floor(i / 5) * 70,
    state: 'idle' as const,
  }))
}

export default function NumberSequence({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const maxNumber = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 9

  const [phase, setPhase] = useState<'playing' | 'between' | 'done'>('playing')
  const [round, setRound] = useState(1)
  const [nextExpected, setNextExpected] = useState(1)
  const [items, setItems] = useState<NumberItem[]>(() => buildRound(maxNumber, rng))
  const [roundErrors, setRoundErrors] = useState(0)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [totalErrors, setTotalErrors] = useState(0)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  useEffect(() => () => clearTimer(), [])

  const startNextRound = useCallback((nextRound: number) => {
    setItems(buildRound(maxNumber, rng))
    setNextExpected(1)
    setRoundErrors(0)
    setRound(nextRound)
    setPhase('playing')
  }, [maxNumber])

  function handleTap(item: NumberItem) {
    if (phase !== 'playing' || item.state !== 'idle') return

    if (item.value === nextExpected) {
      setItems(prev => prev.map(n => n.value === item.value ? { ...n, state: 'correct' } : n))
      const newNext = nextExpected + 1
      const cumCorrect = (round - 1) * maxNumber + (newNext - 1)
      onProgress?.({ answered: cumCorrect, total: maxNumber * ROUNDS, correct: cumCorrect, errors: totalErrors + roundErrors, lastCorrect: true })

      if (newNext > maxNumber) {
        // Round complete
        const score = Math.max(0, 100 - roundErrors * 10)
        const newScores = [...roundScores, score]
        setRoundScores(newScores)
        setTotalErrors(prev => prev + roundErrors)

        if (round >= ROUNDS) {
          // All rounds done — small delay then finish
          timerRef.current = setTimeout(() => {
            const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
            const totalNums = maxNumber * ROUNDS
            const allErrors = totalErrors + roundErrors
            const accuracy = Math.max(0, Math.round(100 - (allErrors / totalNums) * 100))
            onComplete({
              exerciseType: 'number-sequence',
              exerciseLabelAr: 'تسلسل الأرقام',
              score: avg,
              accuracy,
              duration: Math.round((Date.now() - startRef.current) / 1000),
              errors: allErrors,
              metadata: { roundScores: newScores, maxNumber, rounds: ROUNDS, difficulty },
              completedAt: new Date().toISOString(),
            })
          }, 800)
        } else {
          setPhase('between')
          timerRef.current = setTimeout(() => startNextRound(round + 1), 1200)
        }
      } else {
        setNextExpected(newNext)
      }
    } else {
      // Wrong tap
      const cumCorrect = (round - 1) * maxNumber + (nextExpected - 1)
      onProgress?.({ answered: cumCorrect, total: maxNumber * ROUNDS, correct: cumCorrect, errors: totalErrors + roundErrors + 1, lastCorrect: false })
      setRoundErrors(prev => prev + 1)
      setItems(prev => prev.map(n => n.value === item.value ? { ...n, state: 'wrong' } : n))
      timerRef.current = setTimeout(() => {
        setItems(prev => prev.map(n => n.value === item.value ? { ...n, state: 'idle' } : n))
      }, 500)
    }
  }

  return (
    <div className="flex flex-col h-full select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="text-center">
          <div className="text-xs text-white/40 mb-0.5">الجولة</div>
          <div className="text-xl font-black text-brand-400">{round} / {ROUNDS}</div>
        </div>
        <div className="text-center">
          <p className="text-white/60 text-sm font-bold">اضغط: 1 ثم 2 ثم 3...</p>
          <p className="text-white/30 text-xs">التالي: <span className="text-white/60 font-black">{nextExpected}</span></p>
        </div>
        <button
          onClick={onCancel}
          className="text-white/30 hover:text-white/60 text-sm transition-colors px-2 py-1"
        >
          ✕
        </button>
      </div>

      {/* Arena */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ width: CONTAINER_W, height: CONTAINER_H, background: '#111827' }}
        >
          {/* Between-rounds overlay */}
          {phase === 'between' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-gray-950/80">
              <div className="text-5xl">🌟</div>
              <p className="text-white font-black text-xl">أحسنت!</p>
              <p className="text-white/60 text-sm">جولة {round} من {ROUNDS}</p>
            </div>
          )}

          {items.map(item => {
            const isDone = item.state === 'done'
            const isCorrect = item.state === 'correct'
            const isWrong = item.state === 'wrong'
            const isNext = item.value === nextExpected && item.state === 'idle' && phase === 'playing'

            return (
              <button
                key={item.value}
                onClick={() => handleTap(item)}
                className={[
                  'absolute flex items-center justify-center font-black text-xl rounded-full transition-all duration-300',
                  isCorrect
                    ? 'scale-0 opacity-0 shadow-lg shadow-green-500/60'
                    : isWrong
                    ? 'scale-110 shadow-red-500/70 shadow-lg'
                    : isDone
                    ? 'opacity-0 scale-0'
                    : isNext
                    ? 'ring-4 ring-purple-400/80 ring-offset-2 ring-offset-gray-950 animate-pulse scale-105 shadow-lg shadow-purple-500/50'
                    : 'hover:scale-105 shadow-md shadow-purple-900/40',
                ].join(' ')}
                style={{
                  width: BTN,
                  height: BTN,
                  left: item.x,
                  top: item.y,
                  background: isCorrect
                    ? '#22C55E'
                    : isWrong
                    ? '#EF4444'
                    : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  color: '#fff',
                }}
              >
                {item.state === 'idle' || item.state === 'wrong' ? item.value : item.state === 'correct' ? '✓' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="text-center">
          <div className="text-xs text-white/40">أخطاء</div>
          <div className="text-xl font-black text-red-400">{roundErrors}</div>
        </div>
        <div className="w-48 bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${((nextExpected - 1) / maxNumber) * 100}%` }}
          />
        </div>
        <div className="text-center">
          <div className="text-xs text-white/40">تقدم</div>
          <div className="text-xl font-black text-white/60">{nextExpected - 1}/{maxNumber}</div>
        </div>
      </div>
    </div>
  )
}
