'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng } from '@/lib/seeded-random'

// ABA First-Then visual schedule — the child completes a short on-screen
// tapping task (أولاً) then receives an animated reward (ثم).
// This creates genuine interaction + the contingency reinforcement that
// makes First-Then boards effective in autism therapy.

const TASKS = [
  { emoji: '⭐', label: 'اجمع النجوم', color: '#F59E0B', count: 4 },
  { emoji: '🔵', label: 'اضغط الدوائر', color: '#3B82F6', count: 4 },
  { emoji: '🍎', label: 'اجمع الفواكه',  color: '#EF4444', count: 4 },
  { emoji: '🌸', label: 'اجمع الزهور',   color: '#EC4899', count: 4 },
  { emoji: '⚡', label: 'اجمع البرق',    color: '#8B5CF6', count: 4 },
]

const REWARDS = [
  { emoji: '🎉', label: 'احتفال!',          color: '#F59E0B' },
  { emoji: '🎮', label: 'وقت اللعب!',      color: '#6366F1' },
  { emoji: '🎨', label: 'وقت الرسم!',      color: '#EC4899' },
  { emoji: '🎵', label: 'أغنية مفضّلة!',   color: '#10B981' },
  { emoji: '🍪', label: 'حلوى مفضّلة!',   color: '#F97316' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

type Phase = 'intro' | 'task' | 'reward'

export default function FirstThenBoard({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const startRef  = useRef(Date.now())
  const rng       = useRef(createRng(seed ?? Date.now())).current
  const TOTAL     = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const [round,   setRound]   = useState(0)
  const [correct, setCorrect] = useState(0)
  const [phase,   setPhase]   = useState<Phase>('intro')

  const [pairs] = useState(() =>
    Array.from({ length: TOTAL }, (_, i) => ({
      task:   TASKS[i % TASKS.length],
      reward: REWARDS[i % REWARDS.length],
    }))
  )

  const pair = pairs[round]

  // Tapping game state
  const [targets,  setTargets]  = useState<{ id: number; x: number; y: number; collected: boolean }[]>([])
  const [tapped,   setTapped]   = useState(0)

  // Spawn targets sequentially when task phase starts
  useEffect(() => {
    if (phase !== 'task') return
    setTargets([])
    setTapped(0)
    const COUNT = pair.task.count
    const spawned: { id: number; x: number; y: number; collected: boolean }[] = []
    const ids: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < COUNT; i++) {
      ids.push(setTimeout(() => {
        spawned.push({
          id: i,
          x: 15 + rng() * 68, // % within container
          y: 15 + rng() * 65,
          collected: false,
        })
        setTargets([...spawned])
      }, i * 500))
    }
    return () => ids.forEach(clearTimeout)
  }, [phase, round]) // eslint-disable-line react-hooks/exhaustive-deps

  function collectTarget(id: number) {
    setTargets(prev => {
      const next = prev.map(t => t.id === id ? { ...t, collected: true } : t)
      const newTapped = next.filter(t => t.collected).length
      setTapped(newTapped)
      if (newTapped >= pair.task.count) {
        // All collected — show reward
        setTimeout(() => {
          setCorrect(c => c + 1)
          setPhase('reward')
        }, 400)
      }
      return next
    })
  }

  function nextRound() {
    const next = round + 1
    if (next >= TOTAL) {
      onComplete({
        exerciseType:    'first-then-board',
        exerciseLabelAr: 'أولاً ثم',
        score:    Math.round((correct / TOTAL) * 100),
        accuracy: 100,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        errors:   0,
        metadata: { rounds: TOTAL, completed: correct },
        completedAt: new Date().toISOString(),
      })
    } else {
      setRound(next)
      setPhase('intro')
    }
  }

  // ── INTRO phase: show the First-Then board, child taps "ابدأ"
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-5 p-6 select-none min-h-full" dir="rtl">
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

        <p className="text-white/50 text-sm text-center -mt-1">اقرأ البطاقتين ← ثم ابدأ</p>

        <div className="flex gap-4 w-full max-w-sm items-stretch">
          {/* أولاً card */}
          <div
            className="flex-1 rounded-3xl p-5 flex flex-col items-center gap-3 relative"
            style={{
              background: `${pair.task.color}18`,
              border: `2.5px solid ${pair.task.color}CC`,
              boxShadow: `0 0 24px ${pair.task.color}30`,
            }}
          >
            <div
              className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-base shadow-lg"
              style={{ background: pair.task.color }}
            >1</div>
            <span className="text-white/50 text-[10px] font-black tracking-widest">أولاً</span>
            <span className="text-6xl">{pair.task.emoji}</span>
            <span className="text-white font-black text-sm text-center">{pair.task.label}</span>
          </div>

          <div className="flex items-center text-white/20 text-2xl font-black">←</div>

          {/* ثم card — dimmed */}
          <div
            className="flex-1 rounded-3xl p-5 flex flex-col items-center gap-3 relative"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '2px solid rgba(255,255,255,0.12)',
              opacity: 0.65,
            }}
          >
            <div
              className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full flex items-center justify-center font-black text-base shadow-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', border: '2px solid rgba(255,255,255,0.2)' }}
            >2</div>
            <span className="text-white/40 text-[10px] font-black tracking-widest">ثم</span>
            <span className="text-6xl grayscale opacity-60">{pair.reward.emoji}</span>
            <span className="text-white/50 font-black text-sm text-center">{pair.reward.label}</span>
          </div>
        </div>

        <button
          onClick={() => setPhase('task')}
          className="w-full max-w-sm text-white font-black text-xl py-5 rounded-3xl transition-all active:scale-95 shadow-lg mt-2"
          style={{ background: `linear-gradient(135deg,${pair.task.color},${pair.task.color}CC)`, boxShadow: `0 8px 28px ${pair.task.color}50` }}
        >
          ابدأ المهمة! 🚀
        </button>

        <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">← إنهاء التمرين</button>
      </div>
    )
  }

  // ── TASK phase: tap all the items
  if (phase === 'task') {
    const remaining = pair.task.count - tapped
    return (
      <div className="flex flex-col items-center gap-4 p-6 select-none min-h-full" dir="rtl">
        <div className="flex items-center justify-between w-full max-w-sm">
          <h2 className="font-black text-white text-lg">{pair.task.label}</h2>
          <span className="font-black text-2xl" style={{ color: pair.task.color }}>{tapped}/{pair.task.count}</span>
        </div>

        <p className="text-white/50 text-sm">اضغط على كل {pair.task.emoji} تراه!</p>

        {/* Tapping arena */}
        <div
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            height: 260,
            background: `${pair.task.color}10`,
            border: `2px solid ${pair.task.color}40`,
          }}
        >
          {targets.map(t => !t.collected && (
            <button
              key={t.id}
              onClick={() => collectTarget(t.id)}
              className="absolute flex items-center justify-center rounded-full transition-transform active:scale-75"
              style={{
                left:   `${t.x}%`,
                top:    `${t.y}%`,
                width:  56, height: 56,
                transform: 'translate(-50%,-50%)',
                background: `${pair.task.color}25`,
                border: `3px solid ${pair.task.color}`,
                fontSize: 28,
                animation: 'ftb-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {pair.task.emoji}
            </button>
          ))}

          {/* Collected sparkles */}
          {targets.filter(t => t.collected).map(t => (
            <div
              key={`c${t.id}`}
              className="absolute pointer-events-none text-3xl"
              style={{
                left: `${t.x}%`, top: `${t.y}%`,
                transform: 'translate(-50%,-50%)',
                animation: 'ftb-collect 0.5s ease-out forwards',
              }}
            >
              ✨
            </div>
          ))}

          {remaining === 0 && targets.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{ width: `${(tapped / pair.task.count) * 100}%`, background: pair.task.color }}
          />
        </div>

        <style>{`
          @keyframes ftb-appear  { from{transform:translate(-50%,-50%) scale(0)} to{transform:translate(-50%,-50%) scale(1)} }
          @keyframes ftb-collect { from{opacity:1;transform:translate(-50%,-50%) scale(1)} to{opacity:0;transform:translate(-50%,-120%) scale(1.5)} }
        `}</style>

        <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">← إنهاء التمرين</button>
      </div>
    )
  }

  // ── REWARD phase: celebrate and show the ثم reward
  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none min-h-full" dir="rtl">
      <h2 className="font-black text-white text-xl">أحسنت! 🏆</h2>

      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4"
        style={{
          background: `${pair.reward.color}18`,
          border: `3px solid ${pair.reward.color}`,
          boxShadow: `0 0 40px ${pair.reward.color}40`,
          animation: 'ftb-rewardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <span className="text-white/60 font-black tracking-widest text-sm">مكافأتك ✨</span>
        <span className="text-8xl" style={{ animation: 'ftb-bigFloat 1.5s ease-in-out infinite' }}>
          {pair.reward.emoji}
        </span>
        <span className="text-white font-black text-2xl text-center">{pair.reward.label}</span>
      </div>

      <style>{`
        @keyframes ftb-rewardIn  { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes ftb-bigFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      <button
        onClick={nextRound}
        className="w-full max-w-sm text-white font-black text-xl py-5 rounded-3xl transition-all active:scale-95"
        style={{
          background: `linear-gradient(135deg,${pair.reward.color},${pair.reward.color}CC)`,
          boxShadow: `0 8px 28px ${pair.reward.color}50`,
        }}
      >
        {round + 1 >= TOTAL ? 'إنهاء التمرين 🎊' : 'التالي →'}
      </button>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">← إنهاء التمرين</button>
    </div>
  )
}
