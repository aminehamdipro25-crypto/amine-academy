'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

const TOTAL = 16

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

const COLORS = [
  { nameAr: 'أحمر',     hex: '#ef4444', key: 'red',    bg: 'bg-red-500'    },
  { nameAr: 'أزرق',     hex: '#3b82f6', key: 'blue',   bg: 'bg-blue-500'   },
  { nameAr: 'أخضر',     hex: '#22c55e', key: 'green',  bg: 'bg-green-500'  },
  { nameAr: 'أصفر',     hex: '#eab308', key: 'yellow', bg: 'bg-yellow-500' },
]

function makeTrial() {
  const wordIdx = Math.floor(Math.random() * COLORS.length)
  let inkIdx = wordIdx
  while (inkIdx === wordIdx) inkIdx = Math.floor(Math.random() * COLORS.length)
  return { wordIdx, inkIdx }
}

export default function StroopTest({ onComplete, onCancel, difficulty = 1 }: Props) {
  const [started, setStarted]     = useState(false)
  const [trial, setTrial]         = useState(0)
  const [current, setCurrent]     = useState(() => makeTrial())
  const [correct, setCorrect]     = useState(0)
  const [errors, setErrors]       = useState(0)
  const [feedback, setFeedback]   = useState<'correct'|'wrong'|null>(null)
  const [result, setResult]       = useState<ExerciseResult | null>(null)
  const startRef  = useRef(Date.now())
  const correctRef = useRef(0)
  const errRef     = useRef(0)

  function start() {
    startRef.current = Date.now()
    setCurrent(makeTrial())
    setStarted(true)
  }

  function answer(colorKey: string) {
    if (feedback !== null) return
    const isCorrect = colorKey === COLORS[current.inkIdx].key
    if (isCorrect) { correctRef.current++; setCorrect(correctRef.current) }
    else           { errRef.current++;     setErrors(errRef.current) }
    setFeedback(isCorrect ? 'correct' : 'wrong')

    setTimeout(() => {
      setFeedback(null)
      const next = trial + 1
      if (next >= TOTAL) {
        const dur   = Math.round((Date.now() - startRef.current) / 1000)
        const score = Math.round((correctRef.current / TOTAL) * 100)
        setResult({
          exerciseType:    'stroop-test',
          exerciseLabelAr: 'اختبار ستروب — كبح الاستجابة',
          score,
          accuracy: score,
          duration: dur,
          errors:   errRef.current,
          metadata: { correct: correctRef.current, total: TOTAL, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setTrial(next)
        setCurrent(makeTrial())
      }
    }, difficulty === 3 ? 400 : 600)
  }

  // Intro screen
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-6xl">🧠</div>
        <h2 className="text-white font-black text-2xl text-center">اختبار ستروب</h2>
        <div className="bg-white/5 rounded-2xl p-5 text-center max-w-xs w-full">
          <p className="text-white/70 text-sm mb-4">اضغط على <span className="font-black text-brand-300">لون الحبر</span> لا على ما تقرأه!</p>
          <div
            className="font-black text-5xl mb-3 select-none"
            style={{ color: COLORS[2].hex }}
          >
            {COLORS[0].nameAr}
          </div>
          <div className="flex gap-2 justify-center">
            {COLORS.map(c => (
              <div key={c.key} className={`w-8 h-8 rounded-lg ${c.bg} ${c.key === 'green' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} />
            ))}
          </div>
          <p className="text-white/30 text-xs mt-3">مثال: الكلمة بالأخضر ← اضغط الأخضر</p>
        </div>
        <button
          onClick={start}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  // Result screen
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{correct}</div>
            <div className="text-xs text-white/50">صحيح</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{errors}</div>
            <div className="text-xs text-white/50">خطأ</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-4xl">{result.score}%</div>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  const word    = COLORS[current.wordIdx]
  const inkColor = COLORS[current.inkIdx]

  return (
    <div className="flex flex-col h-full select-none">
      {/* Progress */}
      <div className="px-6 py-3">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">{trial + 1} / {TOTAL}</span>
          <span className="text-white/50 text-xs">صحيح: {correct}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${(trial / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Word display */}
      <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-150 ${
        feedback === 'correct' ? 'bg-green-900/20' : feedback === 'wrong' ? 'bg-red-900/20' : ''
      }`}>
        {feedback === null && (
          <p className="text-white/40 text-sm mb-6">اضغط لون الحبر (ليس ما تقرأه)</p>
        )}
        {feedback === 'correct' && <p className="text-green-400 font-black text-xl mb-6">✓ ممتاز!</p>}
        {feedback === 'wrong'   && <p className="text-red-400 font-black text-xl mb-6">✗ خطأ!</p>}

        <div
          className="font-black text-8xl transition-all"
          style={{ color: inkColor.hex }}
        >
          {word.nameAr}
        </div>
      </div>

      {/* Color buttons */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-4">
        {COLORS.map(c => (
          <button
            key={c.key}
            onClick={() => answer(c.key)}
            disabled={feedback !== null}
            className={`py-5 rounded-2xl font-black text-2xl text-white transition-all active:scale-95
              ${c.bg} ${feedback !== null ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {c.nameAr}
          </button>
        ))}
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
