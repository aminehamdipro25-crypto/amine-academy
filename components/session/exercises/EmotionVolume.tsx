'use client'
import { useState } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const SITUATIONS = [
  { emoji:'😤', text:'عندما لا تحصل على ما تريد',        emotion:'الإحباط' },
  { emoji:'😨', text:'عندما تبدأ شيئاً جديداً',          emotion:'القلق'   },
  { emoji:'😡', text:'عندما يأخذ أحد لعبتك',            emotion:'الغضب'   },
  { emoji:'😊', text:'عندما تنجح في شيء صعب',           emotion:'الفرح'   },
  { emoji:'😢', text:'عندما يسافر شخص تحبه',            emotion:'الحزن'   },
  { emoji:'😳', text:'عندما تتكلم أمام الفصل',           emotion:'الخجل'   },
]

const LEVELS = [
  { v:1, label:'هادئ جداً',  emoji:'😌', color:'#22C55E' },
  { v:2, label:'قليل',        emoji:'🙂', color:'#84CC16' },
  { v:3, label:'متوسط',       emoji:'😐', color:'#EAB308' },
  { v:4, label:'كبير',        emoji:'😟', color:'#F97316' },
  { v:5, label:'شديد جداً',   emoji:'😡', color:'#EF4444' },
]

export default function EmotionVolume({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 3 : difficulty === 2 ? 5 : 6
  const situations = SITUATIONS.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [startMs]             = useState(Date.now())

  function handlePick(v: number) {
    if (chosen !== null) return
    setChosen(v)
    setTimeout(() => {
      const next = [...answers, v]
      if (idx + 1 >= count) {
        const avg   = next.reduce((a, b) => a + b, 0) / next.length
        onComplete({
          exerciseType:    'emotion-volume',
          exerciseLabelAr: 'حجم الانفعال',
          score: Math.round((avg / 5) * 100),
          accuracy: 100,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors: 0,
          metadata: { ratings: next },
          completedAt: new Date().toISOString(),
        })
      } else {
        setAnswers(next)
        setIdx(i => i + 1)
        setChosen(null)
      }
    }, 1600)
  }

  const sit = situations[idx]

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">موقف</div>
        </div>
        <h2 className="text-xl font-black text-white">حجم الانفعال</h2>
        <div className="w-12" />
      </div>

      {/* Situation */}
      <div className="w-full max-w-sm rounded-2xl p-5 text-center"
        style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.25)' }}>
        <div className="text-5xl mb-2">{sit.emoji}</div>
        <div className="text-white font-bold">{sit.text}</div>
        <div className="text-white/50 text-sm mt-1">كم حجم {sit.emotion}؟</div>
      </div>

      {/* Level buttons — horizontal thermometer style */}
      <div className="flex gap-2 w-full max-w-sm justify-center">
        {LEVELS.map(l => {
          const isChosen = chosen === l.v
          return (
            <button key={l.v} onClick={() => handlePick(l.v)} disabled={chosen !== null}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all active:scale-90
                disabled:cursor-not-allowed"
              style={{
                borderColor: isChosen ? l.color : 'rgba(255,255,255,0.1)',
                background:  isChosen ? `${l.color}22` : 'rgba(255,255,255,0.05)',
                transform:   isChosen ? 'scale(1.1)' : 'scale(1)',
              }}>
              <span className="text-2xl">{l.emoji}</span>
              <span className="text-[9px] font-black" style={{ color: l.color }}>{l.label}</span>
              <span className="text-lg font-black text-white">{l.v}</span>
            </button>
          )
        })}
      </div>

      {chosen !== null && (
        <div className="text-sm font-bold text-white/70">
          {LEVELS.find(l => l.v === chosen)?.label} — شكراً على صراحتك ✨
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
