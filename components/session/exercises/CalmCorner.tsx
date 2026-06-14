'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const STRATEGIES = [
  { title: 'تنفس الصندوق',  emoji: '🔲', steps: ['استنشق 4 ثوانٍ','احبس 4 ثوانٍ','أخرج 4 ثوانٍ','احبس 4 ثوانٍ'], duration: 4 },
  { title: 'عدّ تنازلياً',  emoji: '🔢', steps: ['عدّ من 10 إلى 1','ببطء وهدوء','ركّز على الأرقام فقط','استمر حتى 1'], duration: 3 },
  { title: 'المشاعر الخمسة',emoji: '👁️', steps: ['5 أشياء تراها','4 أشياء تلمسها','3 أشياء تسمعها','2 شيء تشمّهما'], duration: 5 },
  { title: 'تمرين الليمون', emoji: '🍋', steps: ['تخيل ليمونة في يدك','اعصرها ببطء','أخرج كل الماء','أرخِ يدك تماماً'], duration: 4 },
]

export default function CalmCorner({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count      = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const strategies = STRATEGIES.slice(0, count)

  const [idx,      setIdx]      = useState(0)
  const [stepIdx,  setStepIdx]  = useState(0)
  const [progress, setProgress] = useState(0)
  const [startMs]               = useState(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const STEP_MS = 3000

  const strat = strategies[idx]

  useEffect(() => {
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!)
          const nextStep = stepIdx + 1
          if (nextStep >= strat.steps.length) {
            const nextIdx = idx + 1
            if (nextIdx >= count) {
              onComplete({
                exerciseType:    'calm-corner',
                exerciseLabelAr: 'ركن الهدوء',
                score: 100, accuracy: 100,
                duration: Math.round((Date.now() - startMs) / 1000),
                errors: 0,
                metadata: { strategies: count },
                completedAt: new Date().toISOString(),
              })
            } else {
              setIdx(nextIdx)
              setStepIdx(0)
            }
          } else {
            setStepIdx(nextStep)
          }
          return 0
        }
        return p + (100 / (STEP_MS / 100))
      })
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [idx, stepIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">أسلوب</div>
        </div>
        <h2 className="text-xl font-black text-white">ركن الهدوء</h2>
        <div className="w-12" />
      </div>

      <div className="text-7xl">{strat.emoji}</div>
      <div className="text-xl font-black text-brand-300">{strat.title}</div>

      {/* Steps */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {strat.steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            i < stepIdx  ? 'border-green-400/40 bg-green-400/10 opacity-60'
          : i === stepIdx ? 'border-brand-400 bg-brand-400/15'
          : 'border-white/10 opacity-30'
          }`}>
            <span className={`text-sm font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < stepIdx ? 'bg-green-500 text-white' : i === stepIdx ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/40'
            }`}>{i < stepIdx ? '✓' : i + 1}</span>
            <span className="text-sm text-white font-bold">{s}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full bg-brand-500 transition-none"
          style={{ width: `${progress}%` }} />
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
