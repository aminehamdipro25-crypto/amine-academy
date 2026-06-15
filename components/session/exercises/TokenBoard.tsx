'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

const GOALS = [5, 10, 15, 20]
const BEHAVIORS = [
  'جلست بهدوء',
  'أكملت المهمة',
  'تحدثت بأدب',
  'انتظرت دوري',
  'تعاونت مع الآخرين',
  'استمعت جيداً',
  'حاولت مجدداً بعد الخطأ',
  'ضبطت نفسي',
]

const YOUNG_TOKENS = ['⭐', '🌟', '💫', '✨']
const OLDER_TOKENS = ['🏅', '💎', '🎯', '🏆']

export default function TokenBoard({ onComplete, onCancel, studentAge, difficulty = 2 }: Props) {
  const isYoung = studentAge <= 10
  const tokenEmoji = isYoung ? YOUNG_TOKENS : OLDER_TOKENS

  const defaultGoal = difficulty === 1 ? 5 : difficulty === 2 ? 10 : 15
  const [goal, setGoal] = useState(defaultGoal)
  const [tokens, setTokens] = useState(0)
  const [log, setLog] = useState<{ behavior: string; time: string }[]>([])
  const [setup, setSetup] = useState(true)
  const [customBehavior, setCustomBehavior] = useState('')
  const [celebration, setCelebration] = useState(false)
  const startRef = useRef(Date.now())

  function startBoard() {
    setSetup(false)
    startRef.current = Date.now()
  }

  function awardToken(behavior: string) {
    const newTokens = tokens + 1
    setTokens(newTokens)
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    setLog(prev => [...prev, { behavior, time }])
    if (newTokens >= goal) {
      setCelebration(true)
    }
  }

  function finish() {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const pct = Math.min(100, Math.round((tokens / goal) * 100))
    onComplete({
      exerciseType: 'token-board',
      exerciseLabelAr: 'لوح التعزيز',
      score: pct,
      accuracy: pct,
      duration: dur,
      errors: 0,
      metadata: { tokens, goal, log, reached: tokens >= goal },
      completedAt: new Date().toISOString(),
    })
  }

  if (setup) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 h-full overflow-y-auto" dir="rtl">
        <div className="text-6xl">🏅</div>
        <h2 className="text-white font-black text-2xl text-center">لوح التعزيز</h2>
        <p className="text-white/60 text-sm text-center max-w-xs">
          الأستاذ يمنح الطالب رمزاً عند كل سلوك إيجابي — عندما يجمع الهدف يحصل على المكافأة
        </p>
        <div className="w-full max-w-xs">
          <p className="text-white/70 text-sm font-bold mb-3">اختر الهدف (عدد الرموز)</p>
          <div className="grid grid-cols-4 gap-2">
            {GOALS.map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`py-3 rounded-xl font-black text-lg transition-all ${
                  goal === g
                    ? 'bg-brand-600 text-white ring-2 ring-brand-400'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={startBoard}
          className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ الجلسة
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  if (celebration) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6" dir="rtl">
        <div className="text-8xl animate-bounce">🎉</div>
        <h2 className="text-white font-black text-3xl text-center">أحسنت! وصلت للهدف!</h2>
        <div className="flex gap-2 flex-wrap justify-center text-4xl">
          {Array.from({ length: Math.min(tokens, 20) }).map((_, i) => (
            <span key={i}>{tokenEmoji[i % tokenEmoji.length]}</span>
          ))}
        </div>
        <div className="text-brand-400 font-black text-5xl">{tokens} / {goal}</div>
        <p className="text-white/60 text-sm text-center">جمعت {tokens} رمزاً من {goal}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setTokens(0); setLog([]); setCelebration(false) }}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            جولة جديدة
          </button>
          <button
            onClick={finish}
            className="bg-brand-600 hover:bg-brand-700 text-white font-black px-6 py-3 rounded-xl transition-colors"
          >
            إنهاء وحفظ
          </button>
        </div>
      </div>
    )
  }

  const pct = Math.min(100, (tokens / goal) * 100)

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="text-3xl font-black text-brand-400">{tokens}</div>
            <div className="text-white/50 text-xs">رموز</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-white/60">{goal}</div>
            <div className="text-white/50 text-xs">الهدف</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-3 mb-1">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
            }}
          />
        </div>
        {/* Token display */}
        <div className="flex flex-wrap gap-1 min-h-[32px] py-1">
          {Array.from({ length: Math.min(tokens, 20) }).map((_, i) => (
            <span key={i} className="text-xl">{tokenEmoji[i % tokenEmoji.length]}</span>
          ))}
          {tokens > 20 && <span className="text-white/50 text-sm self-center">+{tokens - 20}</span>}
        </div>
      </div>

      {/* Behavior buttons */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <p className="text-white/50 text-xs mb-2">انقر على السلوك لمنح رمز تعزيز</p>
        <div className="grid grid-cols-2 gap-2">
          {BEHAVIORS.map(b => (
            <button
              key={b}
              onClick={() => awardToken(b)}
              className="p-3 rounded-xl bg-white/10 hover:bg-brand-600/40 border border-white/10 hover:border-brand-400/50 text-white text-sm font-bold text-right transition-all active:scale-95"
            >
              {b}
            </button>
          ))}
        </div>
        {/* Custom behavior */}
        <div className="mt-3 flex gap-2">
          <input
            value={customBehavior}
            onChange={e => setCustomBehavior(e.target.value)}
            placeholder="سلوك آخر..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-brand-400"
            onKeyDown={e => {
              if (e.key === 'Enter' && customBehavior.trim()) {
                awardToken(customBehavior.trim())
                setCustomBehavior('')
              }
            }}
          />
          <button
            onClick={() => { if (customBehavior.trim()) { awardToken(customBehavior.trim()); setCustomBehavior('') } }}
            className="bg-brand-600 hover:bg-brand-700 text-white font-black px-4 rounded-xl transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex gap-3">
        <button
          onClick={finish}
          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black py-3 rounded-xl transition-colors"
        >
          إنهاء وحفظ ({tokens} رمز)
        </button>
        <button
          onClick={onCancel}
          className="text-white/40 hover:text-white/70 px-4 py-3 text-sm transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}
