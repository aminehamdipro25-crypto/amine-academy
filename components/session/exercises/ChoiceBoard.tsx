'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const ALL_ACTIVITIES = [
  { id:'draw',    emoji:'🎨', label:'الرسم'    },
  { id:'puzzle',  emoji:'🧩', label:'الأحجية' },
  { id:'read',    emoji:'📖', label:'القراءة' },
  { id:'build',   emoji:'🏗️', label:'البناء'  },
  { id:'move',    emoji:'🏃', label:'الحركة'  },
  { id:'music',   emoji:'🎵', label:'الموسيقى'},
  { id:'write',   emoji:'✏️', label:'الكتابة' },
  { id:'math',    emoji:'🔢', label:'الأرقام' },
  { id:'nature',  emoji:'🌿', label:'الطبيعة' },
  { id:'cook',    emoji:'🍳', label:'الطبخ'   },
  { id:'story',   emoji:'📝', label:'القصص'   },
  { id:'science', emoji:'🔬', label:'العلوم'  },
  { id:'sing',    emoji:'🎤', label:'الغناء'  },
  { id:'dance',   emoji:'💃', label:'الرقص'   },
  { id:'color',   emoji:'🖍️', label:'التلوين' },
  { id:'lego',    emoji:'🧱', label:'ليگو'    },
  { id:'sport',   emoji:'⚽', label:'الرياضة' },
  { id:'photo',   emoji:'📸', label:'التصوير' },
]

const ROUNDS = [
  { prompt: 'اختر نشاطاً تحب أن تبدأ به الجلسة',    count: 3 },
  { prompt: 'اختر نشاطاً للاسترخاء بعد التعب',       count: 4 },
  { prompt: 'اختر ما تريد تعلمه اليوم',               count: 3 },
  { prompt: 'اختر نشاطاً تفعله مع صديق',              count: 3 },
  { prompt: 'اختر كيف تكافئ نفسك بعد الإنجاز',       count: 4 },
  { prompt: 'اختر نشاطاً لوقت الفراغ',                count: 4 },
  { prompt: 'اختر ما يساعدك عندما تشعر بالتوتر',      count: 3 },
  { prompt: 'اختر نشاطاً إبداعياً تفعله الآن',        count: 4 },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function ChoiceBoard({ onComplete, onCancel, difficulty = 1 }: Props) {
  const totalRounds = difficulty === 1 ? 2 : difficulty === 2 ? 4 : 6
  const [idx,     setIdx]     = useState(0)
  const [picks,   setPicks]   = useState<string[]>([])
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const round       = ROUNDS[idx % ROUNDS.length]
  const optionCount = round.count
  const options     = useMemo(() => shuffle(ALL_ACTIVITIES).slice(0, optionCount), [idx, optionCount])

  function handlePick(id: string) {
    if (chosen) return
    setChosen(id)
    timerRef.current = setTimeout(() => {
      const next = [...picks, id]
      if (idx + 1 >= totalRounds) {
        onComplete({
          exerciseType:    'choice-board',
          exerciseLabelAr: 'لوح الاختيارات',
          score: 100, accuracy: 100,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors: 0,
          metadata: { picks: next },
          completedAt: new Date().toISOString(),
        })
      } else {
        setPicks(next)
        setIdx(i => i + 1)
        setChosen(null)
      }
    }, 1500)
  }

  const label = options.find(o => o.id === chosen)?.label

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{totalRounds}</div>
          <div className="text-xs text-white/50">اختيار</div>
        </div>
        <h2 className="text-xl font-black text-white">لوح الاختيارات</h2>
        <div className="w-12" />
      </div>

      <div className="text-white/70 text-center font-bold text-lg">{round.prompt}</div>

      <div className={`grid gap-4 w-full max-w-sm`}
        style={{ gridTemplateColumns: `repeat(${Math.min(optionCount, 3)}, 1fr)` }}>
        {options.map(o => {
          const isChosen = chosen === o.id
          return (
            <button key={o.id} onClick={() => handlePick(o.id)} disabled={!!chosen}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-90
                disabled:cursor-not-allowed"
              style={{
                borderColor: isChosen ? '#7C5CFC' : 'rgba(255,255,255,0.15)',
                background:  isChosen ? 'rgba(124,92,252,0.25)' : 'rgba(255,255,255,0.05)',
                transform:   isChosen ? 'scale(1.08)' : 'scale(1)',
                boxShadow:   isChosen ? '0 0 20px rgba(124,92,252,0.4)' : 'none',
              }}>
              <span className="text-4xl">{o.emoji}</span>
              <span className="text-xs font-black text-white">{o.label}</span>
            </button>
          )
        })}
      </div>

      {label && (
        <div className="text-brand-400 font-black text-lg">✅ اخترت: {label}</div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
