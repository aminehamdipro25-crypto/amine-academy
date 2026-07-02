'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

// Tasks relevant to an online therapy session context
const TASKS = [
  { emoji: '🎯', label: 'تمرين التركيز' },
  { emoji: '🧩', label: 'لعبة الفرز' },
  { emoji: '🔢', label: 'تمرين الأرقام' },
  { emoji: '👁️', label: 'تمرين الانتباه' },
  { emoji: '💭', label: 'تمرين التفكير' },
  { emoji: '🔤', label: 'تمرين الحروف' },
  { emoji: '🎨', label: 'تمرين الإبداع' },
  { emoji: '🧠', label: 'لعبة الذاكرة' },
]

const REWARDS = [
  { emoji: '📱', label: 'وقت الشاشة' },
  { emoji: '🎮', label: 'الألعاب' },
  { emoji: '🍪', label: 'حلوى مفضّلة' },
  { emoji: '⚽', label: 'وقت اللعب' },
  { emoji: '🎨', label: 'الرسم الحر' },
  { emoji: '🎧', label: 'أغنية مفضّلة' },
  { emoji: '📖', label: 'قصة مشوّقة' },
  { emoji: '🧩', label: 'لعبة تركيب' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function FirstThenBoard({ onComplete, onCancel }: Props) {
  const startRef   = useRef(Date.now())
  const [round, setRound]             = useState(0)
  const [successes, setSuccesses]     = useState(0)
  const [celebrating, setCelebrating] = useState(false)
  const TOTAL = 3

  const [pairs] = useState(() =>
    Array.from({ length: TOTAL }, (_, i) => ({
      task:   TASKS[(i * 3) % TASKS.length],
      reward: REWARDS[(i * 2 + 1) % REWARDS.length],
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
    <div className="flex flex-col items-center gap-5 p-6 select-none min-h-full" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <h2 className="font-black text-white text-xl">أولاً ← ثم</h2>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${
              i < round ? 'bg-green-400' : i === round ? 'bg-brand-400' : 'bg-white/20'
            }`} />
          ))}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-white/50 text-sm text-center -mt-2">
        أكمل المهمة أولاً ← ثم تحصل على المكافأة ✨
      </p>

      {/* Cards */}
      <div className="flex gap-4 w-full max-w-sm items-stretch">

        {/* أولاً — active task */}
        <div
          className="flex-1 rounded-3xl p-5 flex flex-col items-center gap-3 relative"
          style={{
            background: 'rgba(249,115,22,0.15)',
            border: '2.5px solid rgba(249,115,22,0.8)',
            boxShadow: '0 0 24px rgba(249,115,22,0.25), inset 0 0 16px rgba(249,115,22,0.06)',
            animation: 'ftb-pulse 2s ease-in-out infinite',
          }}
        >
          {/* Number badge */}
          <div
            className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#F97316,#FB923C)' }}
          >1</div>
          <span className="text-white/50 text-[10px] font-black tracking-widest uppercase">أولاً</span>
          <span className="text-6xl">{current.task.emoji}</span>
          <span className="text-white font-black text-sm text-center leading-tight">{current.task.label}</span>
        </div>

        {/* Arrow connector */}
        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
          <div className="text-white/20 font-black text-2xl leading-none">←</div>
        </div>

        {/* ثم — reward (dimmed until task is done) */}
        <div
          className="flex-1 rounded-3xl p-5 flex flex-col items-center gap-3 relative"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '2px solid rgba(34,197,94,0.3)',
            opacity: 0.75,
            transform: 'scale(0.96)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Number badge */}
          <div
            className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg"
            style={{ background: 'rgba(34,197,94,0.5)', border: '2px solid rgba(34,197,94,0.6)' }}
          >2</div>
          <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">ثم</span>
          <span className="text-6xl" style={{ filter: 'grayscale(40%)' }}>{current.reward.emoji}</span>
          <span className="text-white/60 font-black text-sm text-center leading-tight">{current.reward.label}</span>
        </div>
      </div>

      {/* Action area */}
      {celebrating ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <span className="text-7xl animate-bounce">🎉</span>
          <span className="text-green-400 font-black text-xl">أحسنت! استحققت المكافأة!</span>
        </div>
      ) : (
        <button
          onClick={handleDone}
          className="w-full max-w-sm text-white font-black text-xl py-5 rounded-3xl transition-all active:scale-95 shadow-lg"
          style={{
            background: 'linear-gradient(135deg,#F97316,#FB923C)',
            boxShadow: '0 8px 28px rgba(249,115,22,0.4)',
          }}
        >
          ✓ انتهيت من {current.task.label}!
        </button>
      )}

      <style>{`
        @keyframes ftb-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(249,115,22,0.25), inset 0 0 16px rgba(249,115,22,0.06); }
          50%       { box-shadow: 0 0 40px rgba(249,115,22,0.45), inset 0 0 20px rgba(249,115,22,0.10); }
        }
      `}</style>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
