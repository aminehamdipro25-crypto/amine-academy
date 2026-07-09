'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, pickWithRng, randIntWithRng, randBoolWithRng } from '@/lib/seeded-random'

const DISPLAY_EMOJIS = ['⭐', '🎯', '🦋', '🌟', '🍎', '🐬']
const TOTAL_ROUNDS = 6
const FLASH_DURATION_MS = 1500

interface EmojiPos {
  x: number  // percent 10-85
  y: number  // percent 10-80
}

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

type Phase = 'intro' | 'flash' | 'answer' | 'feedback' | 'result'

function randomPositions(rng: ReturnType<typeof createRng>, count: number): EmojiPos[] {
  const positions: EmojiPos[] = []
  const MIN_DIST = 18  // minimum % distance between centers
  let attempts = 0
  while (positions.length < count && attempts < 500) {
    attempts++
    const x = 8 + rng() * 76
    const y = 8 + rng() * 72
    const tooClose = positions.some(p =>
      Math.hypot(p.x - x, p.y - y) < MIN_DIST
    )
    if (!tooClose) positions.push({ x, y })
  }
  // Fallback: just place them if spacing failed
  while (positions.length < count) {
    positions.push({
      x: 10 + rng() * 78,
      y: 10 + rng() * 78,
    })
  }
  return positions
}

function getCountRange(difficulty: 1 | 2 | 3): [number, number] {
  if (difficulty === 1) return [3, 5]
  if (difficulty === 2) return [4, 7]
  return [5, 9]
}

function buildOptions(rng: ReturnType<typeof createRng>, correct: number): number[] {
  const opts = new Set<number>([correct])
  while (opts.size < 3) {
    const delta = randIntWithRng(rng, 1, 3)
    const candidate = randBoolWithRng(rng) ? correct + delta : correct - delta
    if (candidate >= 1 && candidate !== correct) opts.add(candidate)
  }
  return Array.from(opts).sort((a, b) => a - b)
}

export default function FlashCount({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const [minCount, maxCount] = getCountRange(difficulty)

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [currentCount, setCurrentCount] = useState(0)
  const [positions, setPositions] = useState<EmojiPos[]>([])
  const [emoji, setEmoji] = useState('⭐')
  const [options, setOptions] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const finishGame = useCallback((finalCorrect: number, finalErrors: number) => {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const score = Math.round((finalCorrect / TOTAL_ROUNDS) * 100)
    onComplete({
      exerciseType: 'flash-count',
      exerciseLabelAr: 'عدّ السريع',
      score,
      accuracy: score,
      duration: dur,
      errors: finalErrors,
      metadata: {
        correctRounds: finalCorrect,
        totalRounds: TOTAL_ROUNDS,
        difficulty,
        minCount,
        maxCount,
      },
      completedAt: new Date().toISOString(),
    })
  }, [difficulty, minCount, maxCount, onComplete])

  const startRound = useCallback((roundNum: number) => {
    const count = randIntWithRng(rng, minCount, maxCount)
    const pos = randomPositions(rng, count)
    const e = pickWithRng(rng, DISPLAY_EMOJIS)
    const opts = buildOptions(rng, count)
    setCurrentCount(count)
    setPositions(pos)
    setEmoji(e)
    setOptions(opts)
    setSelectedOption(null)
    setLastCorrect(null)
    setRound(roundNum)
    setPhase('flash')

    timerRef.current = setTimeout(() => {
      setPhase('answer')
    }, FLASH_DURATION_MS)
  }, [minCount, maxCount, rng])

  function handleStart() {
    startRef.current = Date.now()
    startRound(0)
  }

  const handleAnswer = useCallback((val: number) => {
    if (phase !== 'answer') return
    setSelectedOption(val)
    const isCorrect = val === currentCount
    setLastCorrect(isCorrect)
    setPhase('feedback')

    const nc = isCorrect ? correct + 1 : correct
    const ne = isCorrect ? errors : errors + 1
    if (isCorrect) setCorrect(nc)
    else setErrors(ne)
    onProgress?.({ answered: round + 1, total: TOTAL_ROUNDS, correct: nc, errors: ne, lastCorrect: isCorrect })

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        finishGame(nc, ne)
      } else {
        startRound(nextRound)
      }
    }, 900)
  }, [phase, currentCount, round, errors, correct, finishGame, startRound, onProgress])

  // Intro
  if (phase === 'intro') {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center gap-6 px-6 min-h-full">
        <div className="text-7xl">🔢</div>
        <h2 className="text-2xl font-black text-white text-center">عدّ السريع</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-xs space-y-3 text-center">
          <p className="text-white/80 font-bold">
            ستظهر مجموعة من الرموز لثانية ونصف
          </p>
          <p className="text-white/60 text-sm">
            عُدّها بسرعة، ثم اختر العدد الصحيح!
          </p>
          <p className="text-brand-400 font-bold text-sm">
            {TOTAL_ROUNDS} جولات — من {minCount} إلى {maxCount} رموز
          </p>
        </div>
        <button
          onClick={handleStart}
          className="bg-brand-500 hover:bg-brand-400 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إلغاء
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round}/{TOTAL_ROUNDS}</div>
          <div className="text-xs text-white/50">جولات</div>
        </div>
        <h2 className="text-lg font-black text-white">عدّ السريع</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-3">
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Flash arena */}
      <div
        className="relative flex-1 mx-4 rounded-2xl overflow-hidden bg-gray-900/50"
        style={{ minHeight: 280 }}
      >
        {/* Instruction label */}
        {phase === 'flash' && (
          <p className="absolute top-3 inset-x-0 text-center text-white/40 text-xs pointer-events-none font-bold">
            عُدّها!
          </p>
        )}

        {/* Emojis scattered */}
        {phase === 'flash' && positions.map((pos, i) => (
          <div
            key={i}
            className="absolute text-5xl pointer-events-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 0 8px rgba(124,92,252,0.5))',
            }}
          >
            {emoji}
          </div>
        ))}

        {/* Answer phase */}
        {(phase === 'answer' || phase === 'feedback') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <p className="text-white font-black text-xl">كم عددها؟</p>
            <div className="flex gap-4">
              {options.map(opt => {
                const isSelected = selectedOption === opt
                const isCorrectOpt = opt === currentCount
                let cls = 'bg-white/10 border-2 border-white/20 hover:bg-brand-500/20 hover:border-brand-400 text-white'
                if (phase === 'feedback') {
                  if (isCorrectOpt) {
                    cls = 'bg-green-500/30 border-2 border-green-400 text-green-300 scale-110 shadow-lg shadow-green-500/30'
                  } else if (isSelected) {
                    cls = 'bg-red-500/30 border-2 border-red-400 text-red-300'
                  } else {
                    cls = 'bg-white/5 border-2 border-white/10 text-white/30'
                  }
                }
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={phase === 'feedback'}
                    className={`w-20 h-20 rounded-2xl text-3xl font-black transition-all duration-200 active:scale-90 ${cls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Inline feedback text */}
            {phase === 'feedback' && lastCorrect !== null && (
              <div className={`font-black text-lg ${lastCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {lastCorrect ? '✓ أحسنت!' : `✗ الصحيح: ${currentCount}`}
              </div>
            )}
          </div>
        )}

        {/* Blank during transition */}
        {phase !== 'flash' && phase !== 'answer' && phase !== 'feedback' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-white/10" />
          </div>
        )}
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
