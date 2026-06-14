'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const STEPS = [
  { zone: 'القدمان',  emoji: '🦶', instruction: 'شدّ أصابع قدميك بقوة... ثم أرخِها' },
  { zone: 'البطن',   emoji: '🫁', instruction: 'اشدّ عضلات بطنك... ثم أرخِها' },
  { zone: 'اليدان',  emoji: '🤲', instruction: 'اقبض يديك بقوة... ثم افتحهما ببطء' },
  { zone: 'الكتفان', emoji: '💪', instruction: 'ارفع كتفيك نحو أذنيك... ثم أنزلهما' },
  { zone: 'الوجه',   emoji: '😐', instruction: 'قطّب وجهك... ثم أرخِ كل عضلاته' },
]

export default function BodyScan({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count   = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const steps   = STEPS.slice(0, count)
  const HOLD_MS = difficulty === 1 ? 4000 : difficulty === 2 ? 5000 : 6000

  const [idx,     setIdx]     = useState(0)
  const [phase,   setPhase]   = useState<'tense'|'relax'>('tense')
  const [progress,setProgress]= useState(0)
  const [done,    setDone]    = useState(false)
  const [startMs]             = useState(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!)
          if (phase === 'tense') {
            setPhase('relax')
          } else {
            const next = idx + 1
            if (next >= count) {
              setDone(true)
              onComplete({
                exerciseType:    'body-scan',
                exerciseLabelAr: 'فحص الجسم',
                score: 100, accuracy: 100,
                duration: Math.round((Date.now() - startMs) / 1000),
                errors: 0,
                metadata: { steps: count },
                completedAt: new Date().toISOString(),
              })
            } else {
              setIdx(next)
              setPhase('tense')
            }
          }
          return 100
        }
        return p + (100 / (HOLD_MS / 100))
      })
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [idx, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[idx]

  if (done) return null

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">منطقة</div>
        </div>
        <h2 className="text-xl font-black text-white">فحص الجسم</h2>
        <div className="w-12" />
      </div>

      {/* Zone */}
      <div className="text-8xl">{step.emoji}</div>
      <div className="text-2xl font-black text-white">{step.zone}</div>

      {/* Phase indicator */}
      <div className={`text-xl font-black px-6 py-3 rounded-2xl ${
        phase === 'tense' ? 'text-orange-400 bg-orange-400/10' : 'text-green-400 bg-green-400/10'
      }`}>
        {phase === 'tense' ? '💪 شدّ!' : '😌 أرخِ...'}
      </div>

      <div className="text-white/70 text-center text-lg leading-relaxed max-w-xs">
        {step.instruction}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ height: 12, background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-none"
          style={{ width: `${progress}%`, background: phase === 'tense' ? '#F97316' : '#22C55E' }} />
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
