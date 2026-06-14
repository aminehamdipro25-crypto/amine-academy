'use client'
import { useState } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const GOAL_OPTIONS = [
  { id:'listen',   emoji:'👂', label:'أستمع جيداً'        },
  { id:'hand',     emoji:'✋', label:'أرفع يدي قبل الكلام' },
  { id:'sit',      emoji:'🪑', label:'أجلس بهدوء'          },
  { id:'wait',     emoji:'⏳', label:'أنتظر دوري'          },
  { id:'focus',    emoji:'👁️', label:'أركّز على المهمة'   },
  { id:'kind',     emoji:'💛', label:'أكون لطيفاً'         },
  { id:'homework', emoji:'📚', label:'أكمل واجبي'          },
  { id:'control',  emoji:'😤', label:'أتحكم في انفعالاتي' },
]

export default function DailyGoals({ onComplete, onCancel, difficulty = 1 }: Props) {
  const maxGoals = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const [selected, setSelected] = useState<string[]>([])
  const [ratings,  setRatings]  = useState<Record<string, number>>({})
  const [phase,    setPhase]    = useState<'pick'|'rate'>('pick')
  const [startMs]               = useState(Date.now())

  function toggleGoal(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < maxGoals ? [...s, id] : s)
  }

  function startRating() {
    if (selected.length === 0) return
    setPhase('rate')
  }

  function handleRating(id: string, val: number) {
    const next = { ...ratings, [id]: val }
    setRatings(next)
    if (Object.keys(next).length === selected.length) {
      const avg   = Object.values(next).reduce((a, b) => a + b, 0) / selected.length
      const score = Math.round((avg / 3) * 100)
      onComplete({
        exerciseType:    'daily-goals',
        exerciseLabelAr: 'أهدافي اليوم',
        score, accuracy: score,
        duration: Math.round((Date.now() - startMs) / 1000),
        errors: 0,
        metadata: { goals: selected, ratings: next },
        completedAt: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <h2 className="text-xl font-black text-white">أهدافي اليوم</h2>

      {phase === 'pick' ? (
        <>
          <div className="text-white/60 text-sm text-center">
            اختر {maxGoals} أهداف تريد تحقيقها اليوم
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {GOAL_OPTIONS.map(g => {
              const isSelected = selected.includes(g.id)
              return (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  disabled={!isSelected && selected.length >= maxGoals}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 text-right transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: isSelected ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                    background:  isSelected ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.05)',
                  }}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-sm font-bold text-white">{g.label}</span>
                  {isSelected && <span className="mr-auto text-brand-400 text-lg">✓</span>}
                </button>
              )
            })}
          </div>
          <button onClick={startRating} disabled={selected.length === 0}
            className="px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-lg
              transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            التالي ←
          </button>
        </>
      ) : (
        <>
          <div className="text-white/60 text-sm">كيف أديت هذا الهدف اليوم؟</div>
          {selected.filter(id => !(id in ratings)).slice(0, 1).map(id => {
            const g = GOAL_OPTIONS.find(x => x.id === id)!
            return (
              <div key={id} className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="text-5xl">{g.emoji}</div>
                <div className="text-white font-black text-lg">{g.label}</div>
                <div className="flex gap-3">
                  {[{v:1,label:'لم أحقق',emoji:'😟'},{v:2,label:'تقريباً',emoji:'🙂'},{v:3,label:'ممتاز',emoji:'🌟'}].map(r => (
                    <button key={r.v} onClick={() => handleRating(id, r.v)}
                      className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2
                        border-white/20 bg-white/5 hover:bg-white/15 active:scale-90 transition-all">
                      <span className="text-3xl">{r.emoji}</span>
                      <span className="text-xs text-white/70 font-bold">{r.label}</span>
                    </button>
                  ))}
                </div>
                <div className="text-white/40 text-xs">
                  {selected.length - Object.keys(ratings).length} هدف متبقي
                </div>
              </div>
            )
          })}
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
