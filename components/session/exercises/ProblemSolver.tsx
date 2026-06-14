'use client'
import { useState } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Problem {
  emoji:    string
  title:    string
  steps:    string[]
  question: string
}

const PROBLEMS: Problem[] = [
  {
    emoji: '🤝', title: 'خلاف مع صديق',
    steps: ['هدّئ نفسك أولاً','اسمع جانبه','تكلم بهدوء','ابحثا عن حل مناسب لكليكما'],
    question: 'ما هي خطوات حل الخلاف بشكل صحيح؟',
  },
  {
    emoji: '📚', title: 'واجب صعب',
    steps: ['اقرأ السؤال مرتين','قسّمه لأجزاء صغيرة','ابدأ بأسهل جزء','اطلب المساعدة عند الحاجة'],
    question: 'كيف تتعامل مع واجب صعب؟',
  },
  {
    emoji: '😤', title: 'شعرت بالغضب',
    steps: ['خذ نفساً عميقاً','ابتعد لحظة','فكّر لماذا غضبت','تكلم عن مشاعرك بهدوء'],
    question: 'ما الخطوات الصحيحة عند الشعور بالغضب؟',
  },
  {
    emoji: '🆘', title: 'لا تفهم الشرح',
    steps: ['انتبه مرة أخرى','دوّن ما لم تفهمه','اسأل المعلم بأدب','راجع الكتاب في البيت'],
    question: 'ماذا تفعل حين لا تفهم شرح المعلم؟',
  },
]

export default function ProblemSolver({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count    = difficulty === 1 ? 1 : difficulty === 2 ? 2 : PROBLEMS.length
  const problems = PROBLEMS.slice(0, count)

  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState<number[]>([])
  const [done,     setDone]     = useState(false)
  const [startMs]               = useState(Date.now())

  const prob = problems[idx]
  const allRevealed = revealed.length === prob.steps.length

  function revealNext() {
    if (revealed.length < prob.steps.length) {
      setRevealed(r => [...r, r.length])
    }
  }

  function handleNext() {
    const nextIdx = idx + 1
    if (nextIdx >= count) {
      setDone(true)
      onComplete({
        exerciseType:    'problem-solver',
        exerciseLabelAr: 'حل المشكلة',
        score: 100, accuracy: 100,
        duration: Math.round((Date.now() - startMs) / 1000),
        errors: 0,
        metadata: { problems: count },
        completedAt: new Date().toISOString(),
      })
    } else {
      setIdx(nextIdx)
      setRevealed([])
    }
  }

  if (done) return null

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">مشكلة</div>
        </div>
        <h2 className="text-xl font-black text-white">حل المشكلة</h2>
        <div className="w-12" />
      </div>

      {/* Problem */}
      <div className="w-full max-w-sm rounded-2xl p-4 text-center"
        style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.25)' }}>
        <div className="text-5xl mb-2">{prob.emoji}</div>
        <div className="text-white font-black">{prob.title}</div>
        <div className="text-white/50 text-sm mt-1">{prob.question}</div>
      </div>

      {/* Steps — revealed one by one */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {prob.steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-400 ${
            revealed.includes(i)
              ? 'border-brand-400/60 bg-brand-400/10 opacity-100'
              : 'border-transparent bg-transparent opacity-0 pointer-events-none'
          }`}
            style={{ transform: revealed.includes(i) ? 'translateX(0)' : 'translateX(20px)' }}>
            <div className="w-7 h-7 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <span className="text-white font-bold text-sm">{s}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {!allRevealed ? (
          <button onClick={revealNext}
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black transition-all active:scale-95">
            الخطوة التالية →
          </button>
        ) : (
          <button onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black transition-all active:scale-95">
            {idx + 1 >= count ? '✅ انتهينا!' : 'مشكلة أخرى →'}
          </button>
        )}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
