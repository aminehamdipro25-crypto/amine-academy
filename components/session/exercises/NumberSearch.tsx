'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randIntWithRng, randBoolWithRng, pickWithRng, type Rng } from '@/lib/seeded-random'

const TOTAL_ROUNDS = 4

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface RoundConfig {
  cols: number
  rows: number
  twoDigit: boolean
  targetCount: number
  timeLimitSec: number
}

interface Cell {
  value: number
  isTarget: boolean
}

type Phase = 'intro' | 'playing' | 'roundEnd' | 'done'

// digits that look alike at a glance — raises real scanning difficulty without changing the rule
const CONFUSABLE: Record<number, number[]> = {
  6: [9, 8], 9: [6, 8], 1: [7], 7: [1], 3: [8], 8: [3, 6], 2: [5], 5: [2],
}

function getRoundConfig(difficulty: 1 | 2 | 3): RoundConfig {
  if (difficulty === 1) return { cols: 5, rows: 5, twoDigit: false, targetCount: 5, timeLimitSec: 35 }
  if (difficulty === 2) return { cols: 6, rows: 6, twoDigit: false, targetCount: 7, timeLimitSec: 32 }
  return { cols: 7, rows: 6, twoDigit: true, targetCount: 9, timeLimitSec: 38 }
}

function buildRound(cfg: RoundConfig, rng: Rng): { grid: Cell[]; target: number } {
  const total = cfg.cols * cfg.rows
  const target = cfg.twoDigit ? randIntWithRng(rng, 10, 99) : randIntWithRng(rng, 1, 9)

  const cells: Cell[] = []
  for (let i = 0; i < cfg.targetCount; i++) cells.push({ value: target, isTarget: true })

  while (cells.length < total) {
    let v: number
    if (cfg.twoDigit) {
      v = randIntWithRng(rng, 10, 99)
    } else if (CONFUSABLE[target] && randBoolWithRng(rng, 0.35)) {
      const opts = CONFUSABLE[target]
      v = pickWithRng(rng, opts)
    } else {
      v = randIntWithRng(rng, 1, 9)
    }
    if (v !== target) cells.push({ value: v, isTarget: false })
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return { grid: cells, target }
}

export default function NumberSearch({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const cfg = getRoundConfig(difficulty)

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [grid, setGrid] = useState<Cell[]>([])
  const [target, setTarget] = useState(0)
  const [foundIdx, setFoundIdx] = useState<Set<number>>(new Set())
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [roundWrong, setRoundWrong] = useState(0)
  const [roundMissed, setRoundMissed] = useState(0)
  const [timeLeft, setTimeLeft] = useState(cfg.timeLimitSec)

  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalWrong, setTotalWrong] = useState(0)
  const [totalMissed, setTotalMissed] = useState(0)
  const [roundTimesMs, setRoundTimesMs] = useState<number[]>([])

  const startRef = useRef(Date.now())
  const roundStartRef = useRef(Date.now())
  const wrongFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    return () => {
      if (wrongFlashRef.current) clearTimeout(wrongFlashRef.current)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [])

  function startRound(roundNum: number) {
    const { grid: g, target: t } = buildRound(cfg, rng)
    setGrid(g)
    setTarget(t)
    setFoundIdx(new Set())
    setWrongIdx(null)
    setRoundWrong(0)
    setRoundMissed(0)
    setTimeLeft(cfg.timeLimitSec)
    setRound(roundNum)
    roundStartRef.current = Date.now()
    setPhase('playing')
  }

  function handleStart() {
    startRef.current = Date.now()
    startRound(0)
  }

  const finishGame = useCallback((corr: number, wrong: number, missed: number, times: number[]) => {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    const speedPenalty = Math.min(15, Math.max(0, Math.round((avgTime - 12000) / 1500)))
    const score = Math.max(0, 100 - wrong * 4 - missed * 8 - speedPenalty)
    const attempted = corr + wrong + missed
    const accuracy = attempted > 0 ? Math.round((corr / attempted) * 100) : 0
    setPhase('done')
    onComplete({
      exerciseType: 'number-search',
      exerciseLabelAr: 'البحث عن الأرقام',
      score,
      accuracy,
      duration: dur,
      errors: wrong + missed,
      metadata: {
        rounds: TOTAL_ROUNDS,
        gridSize: `${cfg.cols}x${cfg.rows}`,
        correctTaps: corr,
        wrongTaps: wrong,
        missedTargets: missed,
        avgRoundTimeMs: Math.round(avgTime),
        difficulty,
      },
      completedAt: new Date().toISOString(),
    })
  }, [cfg.cols, cfg.rows, difficulty, onComplete])

  const endRound = useCallback((foundCount: number, wrongCount: number) => {
    const missed = cfg.targetCount - foundCount
    const elapsed = Date.now() - roundStartRef.current
    const newTimes = [...roundTimesMs, elapsed]
    setRoundMissed(missed)
    setRoundTimesMs(newTimes)
    setPhase('roundEnd')

    const newTotalCorrect = totalCorrect + foundCount
    const newTotalWrong = totalWrong + wrongCount
    const newTotalMissed = totalMissed + missed
    setTotalCorrect(newTotalCorrect)
    setTotalWrong(newTotalWrong)
    setTotalMissed(newTotalMissed)

    advanceTimerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        finishGame(newTotalCorrect, newTotalWrong, newTotalMissed, newTimes)
      } else {
        startRound(nextRound)
      }
    }, 1400)
  }, [cfg.targetCount, round, roundTimesMs, totalCorrect, totalWrong, totalMissed, finishGame])

  // countdown — ends the round on timeout, crediting whatever was found so far
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      endRound(foundIdx.size, roundWrong)
      return
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, foundIdx.size, roundWrong, endRound])

  const handleTap = useCallback((idx: number) => {
    if (phase !== 'playing') return
    const cell = grid[idx]
    if (!cell || foundIdx.has(idx)) return

    if (cell.isTarget) {
      const next = new Set(foundIdx)
      next.add(idx)
      setFoundIdx(next)
      const cumCorrect = totalCorrect + next.size
      onProgress?.({ answered: cumCorrect, total: cfg.targetCount * TOTAL_ROUNDS, correct: cumCorrect, errors: totalWrong + roundWrong, lastCorrect: true })
      if (next.size >= cfg.targetCount) {
        endRound(next.size, roundWrong)
      }
    } else {
      const cumCorrect = totalCorrect + foundIdx.size
      onProgress?.({ answered: cumCorrect, total: cfg.targetCount * TOTAL_ROUNDS, correct: cumCorrect, errors: totalWrong + roundWrong + 1, lastCorrect: false })
      setRoundWrong(w => w + 1)
      setWrongIdx(idx)
      if (wrongFlashRef.current) clearTimeout(wrongFlashRef.current)
      wrongFlashRef.current = setTimeout(() => setWrongIdx(null), 350)
    }
  }, [phase, grid, foundIdx, roundWrong, cfg.targetCount, endRound, totalCorrect, totalWrong, onProgress])

  if (phase === 'done') return null

  if (phase === 'intro') {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center gap-6 px-6 min-h-full">
        <div className="text-7xl">🔍</div>
        <h2 className="text-2xl font-black text-white text-center">البحث عن الأرقام</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-xs space-y-3 text-center">
          <p className="text-white/80 font-bold">ستظهر شبكة أرقام مع رقم هدف</p>
          <p className="text-white/60 text-sm">اضغط على كل خلية تحمل نفس الرقم بأسرع ما يمكن، وتجنّب الأرقام الأخرى</p>
          <p className="text-brand-400 font-bold text-sm">{TOTAL_ROUNDS} جولات — شبكة {cfg.cols}×{cfg.rows}</p>
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

  const cellPx = cfg.cols >= 7 ? 42 : cfg.cols >= 6 ? 48 : 56

  return (
    <div dir="rtl" className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{TOTAL_ROUNDS}</div>
          <div className="text-xs text-white/50">جولات</div>
        </div>
        <h2 className="text-lg font-black text-white">البحث عن الأرقام</h2>
        <div className="text-center">
          <div className={`text-2xl font-black ltr-num ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</div>
          <div className="text-xs text-white/50">ثانية</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-3">
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} />
        </div>
      </div>

      {phase === 'playing' && (
        <>
          {/* Target + found counter */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-white/70 font-bold text-sm">ابحث عن:</span>
            <span className="flex items-center justify-center bg-brand-500/20 border-2 border-brand-400 rounded-2xl px-5 py-1.5 text-2xl font-black text-brand-300 ltr-num">
              {target}
            </span>
            <span className="text-white/50 text-sm ltr-num">{foundIdx.size}/{cfg.targetCount}</span>
          </div>

          {/* Grid */}
          <div className="flex-1 flex items-center justify-center px-3">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}>
              {grid.map((cell, idx) => {
                const isFound = foundIdx.has(idx)
                const isWrong = wrongIdx === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleTap(idx)}
                    disabled={isFound}
                    className={`rounded-xl flex items-center justify-center font-black ltr-num transition-all duration-150 active:scale-90
                      ${isFound
                        ? 'bg-green-500/30 border-2 border-green-400 text-green-300'
                        : isWrong
                          ? 'bg-red-500/40 border-2 border-red-400 text-red-200'
                          : 'bg-white/10 border-2 border-white/20 hover:bg-white/20 text-white'}`}
                    style={{ width: cellPx, height: cellPx, fontSize: cellPx * 0.4 }}
                  >
                    {cell.value}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {phase === 'roundEnd' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-5xl mb-2">{roundMissed === 0 ? '🎯' : '⏱️'}</div>
          <p className="text-white font-black text-lg">
            {roundMissed === 0 ? 'وجدت كل الأرقام!' : `فاتك ${roundMissed} من ${cfg.targetCount}`}
          </p>
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm pb-4 pt-2 transition-colors text-center">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
