'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

const TASKS = [
  { emoji: '📚', label: 'الواجب' },
  { emoji: '🦷', label: 'تنظيف الأسنان' },
  { emoji: '🍽️', label: 'الغداء' },
  { emoji: '👕', label: 'ارتداء الملابس' },
  { emoji: '🚿', label: 'الاستحمام' },
  { emoji: '🎒', label: 'ترتيب الحقيبة' },
  { emoji: '🛏️', label: 'ترتيب السرير' },
  { emoji: '🌱', label: 'سقي الزرع' },
]

const REWARDS = [
  { emoji: '📱', label: 'وقت الشاشة' },
  { emoji: '🎮', label: 'الألعاب' },
  { emoji: '🍪', label: 'حلوى' },
  { emoji: '⚽', label: 'اللعب بالكرة' },
  { emoji: '🎨', label: 'وقت الرسم' },
  { emoji: '🎧', label: 'الموسيقى' },
  { emoji: '📖', label: 'قراءة قصة' },
  { emoji: '🧩', label: 'ألعاب التركيب' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function FirstThenBoard({ onComplete, onCancel }: Props) {
  const startRef   = useRef(Date.now())
  const [round, setRound]       = useState(0)
  const [successes, setSuccesses] = useState(0)
  const [celebrating, setCelebrating] = useState(false)
  const TOTAL = 3

  const [pairs] = useState(() =>
    Array.from({ length: TOTAL }, () => ({
      task:   TASKS[Math.floor(Math.random() * TASKS.length)],
      reward: REWARDS[Math.floor(Math.random() * REWARDS.length)],
    }))
  )

  const current = pairs[round]

  function handleDone() {
    setCelebrating(true)
    setSuccesses(s => s + 1)
    setTimeout(() => {
      setCelebrating(false)
      const next = round + 1
      if (next >= TOTAL) {
        onComplete({
          exerciseType:    'first-then-board',
          exerciseLabelAr: 'أولاً ثم',
          score:    Math.round((successes + 1) / TOTAL * 100),
          accuracy: 100,
          duration: Math.round((Date.now() - startRef.current) / 1000),
          errors:   0,
          metadata: { rounds: TOTAL },
          completedAt: new Date().toISOString(),
        })
      } else {
        setRound(next)
      }
    }, 1800)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none min-h-full" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <h2 className="font-black text-white text-xl">أولاً ← ثم</h2>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < round ? 'bg-green-400' : i === round ? 'bg-brand-400' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <div className="flex-1 bg-orange-500/20 border-2 border-orange-400/70 rounded-3xl p-5 flex flex-col items-center gap-3">
          <span className="text-white/60 text-xs font-black tracking-widest uppercase">أولاً</span>
          <span className="text-7xl">{current.task.emoji}</span>
          <span className="text-white font-black text-base text-center">{current.task.label}</span>
        </div>
        <div className="flex items-center text-white/30 text-3xl font-black">←</div>
        <div className="flex-1 bg-green-500/20 border-2 border-green-400/70 rounded-3xl p-5 flex flex-col items-center gap-3">
          <span className="text-white/60 text-xs font-black tracking-widest uppercase">ثم</span>
          <span className="text-7xl">{current.reward.emoji}</span>
          <span className="text-white font-black text-base text-center">{current.reward.label}</span>
        </div>
      </div>

      {celebrating ? (
        <div className="flex flex-col items-center gap-3">
          <span className="text-7xl animate-bounce">🎉</span>
          <span className="text-green-400 font-black text-2xl">أحسنت! استحققت المكافأة!</span>
        </div>
      ) : (
        <button onClick={handleDone}
          className="w-full max-w-sm bg-green-500 hover:bg-green-400 text-white font-black text-2xl py-5 rounded-3xl transition-all active:scale-95 shadow-lg shadow-green-500/30">
          ✓ انتهيت من {current.task.label}!
        </button>
      )}

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">← إنهاء التمرين</button>
    </div>
  )
}
