'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randIntWithRng, type Rng } from '@/lib/seeded-random'

const TOTAL = 16

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

const COLORS = [
  { nameAr: 'أحمر',    hex: '#ef4444', bg: 'bg-red-500',    shadow: 'shadow-red-500/40'    },
  { nameAr: 'أزرق',    hex: '#3b82f6', bg: 'bg-blue-500',   shadow: 'shadow-blue-500/40'   },
  { nameAr: 'أخضر',    hex: '#22c55e', bg: 'bg-green-500',  shadow: 'shadow-green-500/40'  },
  { nameAr: 'أصفر',    hex: '#eab308', bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/40' },
  { nameAr: 'بنفسجي',  hex: '#a855f7', bg: 'bg-purple-500', shadow: 'shadow-purple-500/40' },
  { nameAr: 'برتقالي', hex: '#f97316', bg: 'bg-orange-500', shadow: 'shadow-orange-500/40' },
]

function makeTrial(rng: Rng) {
  const wordIdx = randIntWithRng(rng, 0, COLORS.length - 1)
  let inkIdx = wordIdx
  while (inkIdx === wordIdx) inkIdx = randIntWithRng(rng, 0, COLORS.length - 1)
  return { wordIdx, inkIdx }
}

export default function StroopTest({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const [started, setStarted]   = useState(false)
  const [trial, setTrial]       = useState(0)
  const [current, setCurrent]   = useState(() => makeTrial(rng))
  const [correct, setCorrect]   = useState(0)
  const [errors, setErrors]     = useState(0)
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [result, setResult]     = useState<ExerciseResult | null>(null)
  const [trialMs, setTrialMs]   = useState(0)

  const startRef    = useRef(Date.now())
  const trialStart  = useRef(Date.now())
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const correctRef  = useRef(0)
  const errRef      = useRef(0)
  const rtsRef      = useRef<number[]>([])

  const timeLimit = difficulty === 3 ? 3000 : difficulty === 2 ? 4500 : 6000

  useEffect(() => () => clearTimeout(settleTimerRef.current), [])

  useEffect(() => {
    if (!started || feedback !== null || result) return
    trialStart.current = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - trialStart.current
      setTrialMs(elapsed)
      if (elapsed >= timeLimit) {
        clearInterval(id)
        timeoutAnswer()
      }
    }, 50)
    return () => clearInterval(id)
  }, [started, feedback, result, trial]) // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    startRef.current = Date.now()
    trialStart.current = Date.now()
    setCurrent(makeTrial(rng))
    setStarted(true)
  }

  function settle(isCorrect: boolean, rt: number) {
    if (feedback !== null) return
    rtsRef.current.push(rt)
    if (isCorrect) { correctRef.current++; setCorrect(correctRef.current) }
    else           { errRef.current++;     setErrors(errRef.current) }
    onProgress?.({ answered: trial + 1, total: TOTAL, correct: correctRef.current, errors: errRef.current, lastCorrect: isCorrect })
    setFeedback(isCorrect ? 'correct' : 'wrong')
    settleTimerRef.current = setTimeout(() => {
      setFeedback(null)
      const next = trial + 1
      if (next >= TOTAL) {
        const dur   = Math.round((Date.now() - startRef.current) / 1000)
        const score = Math.round((correctRef.current / TOTAL) * 100)
        const avgRt = rtsRef.current.length
          ? Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)
          : 0
        setResult({
          exerciseType: 'stroop-test',
          exerciseLabelAr: 'اختبار ستروب',
          score, accuracy: score, duration: dur, errors: errRef.current,
          metadata: { correct: correctRef.current, total: TOTAL, difficulty, avgReactionMs: avgRt },
          completedAt: new Date().toISOString(),
        })
      } else {
        setTrial(next)
        setCurrent(makeTrial(rng))
      }
    }, difficulty === 3 ? 350 : 550)
  }

  function answer(colorIdx: number) {
    if (feedback !== null) return
    settle(colorIdx === current.inkIdx, Date.now() - trialStart.current)
  }

  function timeoutAnswer() {
    if (feedback !== null) return
    settle(false, timeLimit)
  }

  // Intro
  if (!started) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6" dir="rtl">
      <div className="text-7xl">🧠</div>
      <h2 className="text-white font-black text-2xl">اختبار ستروب</h2>
      <div className="bg-white/5 rounded-2xl p-5 w-full max-w-xs space-y-4">
        <p className="text-white/70 text-sm text-center">
          اضغط على <span className="text-brand-300 font-black">لون الحبر</span> — لا على الكلمة المكتوبة!
        </p>
        <div className="flex justify-center py-2">
          <div className="font-black text-5xl select-none" style={{ color: COLORS[2].hex }}>
            {COLORS[0].nameAr}
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          {COLORS.map((c, i) => (
            <div key={c.nameAr}
              className={`w-10 h-10 rounded-xl ${c.bg} ${i === 2 ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} />
          ))}
        </div>
        <p className="text-white/30 text-xs text-center">الكلمة مكتوبة بالأخضر → اضغط الأخضر ✓</p>
      </div>
      <button onClick={start}
        className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all active:scale-95">
        ابدأ
      </button>
      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">← إلغاء</button>
    </div>
  )

  // Result
  if (result) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6" dir="rtl">
      <div className="text-7xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
      <h2 className="text-white font-black text-2xl">انتهى!</h2>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/40 mt-1">صحيح</div>
        </div>
        <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-red-400">{errors}</div>
          <div className="text-xs text-white/40 mt-1">خطأ</div>
        </div>
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 text-center">
          <div className="text-lg font-black text-blue-400">
            {(result.metadata as { avgReactionMs?: number })?.avgReactionMs
              ? `${(((result.metadata as { avgReactionMs: number }).avgReactionMs) / 1000).toFixed(1)}ث`
              : '--'}
          </div>
          <div className="text-xs text-white/40 mt-1">متوسط</div>
        </div>
      </div>
      <div className="text-brand-400 font-black text-5xl">{result.score}%</div>
      <div className="w-full max-w-sm bg-white/10 rounded-full h-3 overflow-hidden">
        <div className="bg-brand-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${result.score}%` }} />
      </div>
      <button onClick={() => onComplete(result)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-all active:scale-95">
        متابعة →
      </button>
    </div>
  )

  const word     = COLORS[current.wordIdx]
  const inkColor = COLORS[current.inkIdx]
  const timerPct = Math.min((trialMs / timeLimit) * 100, 100)

  return (
    <div className="flex flex-col h-full select-none" dir="rtl">
      {/* Progress */}
      <div className="px-5 pt-4 pb-2 space-y-2">
        <div className="flex justify-between">
          <span className="text-white/40 text-xs">{trial + 1} / {TOTAL}</span>
          <span className="text-white/40 text-xs">صحيح: {correct}</span>
        </div>
        {/* Overall progress */}
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${(trial / TOTAL) * 100}%` }} />
        </div>
        {/* Per-trial timer bar */}
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-none ${timerPct > 80 ? 'bg-red-500' : timerPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.max(0, 100 - timerPct)}%` }}
          />
        </div>
      </div>

      {/* Word display */}
      <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-200 ${
        feedback === 'correct' ? 'bg-green-900/20' : feedback === 'wrong' ? 'bg-red-900/20' : ''
      }`}>
        {!feedback && <p className="text-white/30 text-xs mb-6">اضغط لون الحبر — ليس ما تقرأه</p>}
        {feedback === 'correct' && <p className="text-green-400 font-black text-2xl mb-6">✓ ممتاز!</p>}
        {feedback === 'wrong'   && <p className="text-red-400 font-black text-2xl mb-6">✗ خطأ!</p>}
        <div className="font-black text-8xl select-none" style={{ color: inkColor.hex }}>
          {word.nameAr}
        </div>
      </div>

      {/* Color buttons */}
      <div className="grid grid-cols-3 gap-3 px-5 pb-3">
        {COLORS.map((c, i) => (
          <button key={c.nameAr} onClick={() => answer(i)} disabled={feedback !== null}
            className={`py-5 rounded-2xl font-black text-2xl text-white shadow-lg transition-all active:scale-95 ${c.bg} ${c.shadow}
              ${feedback !== null ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110'}`}>
            {c.nameAr}
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs pb-3 text-center transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
