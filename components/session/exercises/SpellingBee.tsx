'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Q { word: string; emoji: string; choices: string[] }

const ALL: Q[] = [
  { word:'قلم',  emoji:'✏️', choices:['قلم','قلن','كلم']   },
  { word:'كتاب', emoji:'📚', choices:['كتاب','كتاج','ختاب'] },
  { word:'شمس',  emoji:'☀️', choices:['شمس','شمص','سمش']   },
  { word:'بيت',  emoji:'🏠', choices:['بيت','بيث','بيد']   },
  { word:'ماء',  emoji:'💧', choices:['ماء','ماأ','مآء']    },
  { word:'حصان', emoji:'🐴', choices:['حصان','حصون','حسان'] },
  { word:'تفاحة',emoji:'🍎', choices:['تفاحة','تفاجة','تقاحة']},
  { word:'سيارة',emoji:'🚗', choices:['سيارة','سياره','صيارة']},
  { word:'مدرسة',emoji:'🏫', choices:['مدرسة','مدرسه','مدرصة']},
  { word:'طيارة',emoji:'✈️', choices:['طيارة','طياره','طيارا']},
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function SpellingBee({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 5 : difficulty === 2 ? 8 : 10
  const qs    = ALL.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ar-SA'; u.rate = 0.8
    window.speechSynthesis.speak(u)
  }, [])

  const q = qs[idx]
  const shuffledChoices = shuffle(q.choices)

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === q.word
    if (isCorrect) { setCorrect(v => v + 1); speak('ممتاز') }
    else           { setErrors(v => v + 1);  speak('حاول مرة أخرى') }

    timerRef.current = setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        const nc = correct + (isCorrect ? 1 : 0)
        onComplete({
          exerciseType:    'spelling-bee',
          exerciseLabelAr: 'الإملاء',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   errors + (isCorrect ? 0 : 1),
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setChosen(null)
      }
    }, 1400)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">كلمة</div>
        </div>
        <h2 className="text-xl font-black text-white">الإملاء</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Word display */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-8xl">{q.emoji}</div>
        <button onClick={() => speak(q.word)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black transition-all active:scale-95">
          🔊 استمع للكلمة
        </button>
        <div className="text-white/40 text-sm">اختر الكتابة الصحيحة</div>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {shuffledChoices.map(c => {
          const isChosen  = c === chosen
          const isCorrect = c === q.word
          let cls = 'bg-white/5 border-white/15 hover:bg-white/15'
          if (isChosen && isCorrect)  cls = 'bg-green-500/25 border-green-400'
          if (isChosen && !isCorrect) cls = 'bg-red-500/25 border-red-400'
          if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/10 border-green-400/40'
          return (
            <button key={c} onClick={() => handleChoice(c)} disabled={!!chosen}
              className={`w-full py-4 rounded-2xl text-2xl font-black text-white border-2
                transition-all disabled:cursor-not-allowed ${cls}`}>
              {c}
            </button>
          )
        })}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
