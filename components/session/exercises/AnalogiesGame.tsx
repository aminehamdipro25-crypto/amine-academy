'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'
import { QuizProgress, PromptCard, choiceStyle, staggerDelay, type ChoiceState } from './quiz-ui'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface Q { text: string; correct: string; wrong: [string, string] }

export const ALL: Q[] = [
  { text:'القلم للكتابة مثل السكين لـ',     correct:'القطع',    wrong:['النوم',   'الطيران'] },
  { text:'السمكة في الماء مثل الطائر في',    correct:'الهواء',   wrong:['الأرض',   'النار']   },
  { text:'الليل مظلم مثل النهار',             correct:'مضيء',     wrong:['بارد',    'هادئ']    },
  { text:'الطبيب يعالج مثل المعلم',          correct:'يُعلّم',   wrong:['يطبخ',    'يبني']    },
  { text:'الحذاء للقدم مثل القفاز لـ',       correct:'اليد',     wrong:['الرأس',   'الأنف']   },
  { text:'العسل حلو مثل الليمون',             correct:'حامض',     wrong:['مالح',    'مرّ']     },
  { text:'السيارة تسير مثل الطائرة',          correct:'تطير',     wrong:['تسبح',    'تحفر']    },
  { text:'الأسد ملك الغابة مثل الصقر ملك',  correct:'السماء',   wrong:['البحر',   'الأرض']   },
  { text:'الفرن للخبز مثل الثلاجة لـ',       correct:'التبريد',  wrong:['الغسل',   'القراءة'] },
  { text:'الأذن للسمع مثل العين لـ',         correct:'الرؤية',   wrong:['الشم',    'اللمس']   },
  { text:'النحلة تصنع العسل مثل العنكبوت يصنع', correct:'الشبكة', wrong:['الحليب',  'الصوف']   },
  { text:'المفتاح يفتح الباب مثل كلمة السر تفتح', correct:'الحاسوب', wrong:['النافذة', 'الكتاب']  },
  { text:'الشتاء بارد مثل الصيف',            correct:'حار',      wrong:['ممل',     'قصير']    },
  { text:'السمكة تسبح مثل الضفدع',           correct:'يسبح',     wrong:['يطير',    'يحفر']    },
  { text:'القاموس للكلمات مثل الخريطة لـ',  correct:'الأماكن',  wrong:['الأرقام', 'الألوان'] },
  { text:'المظلة تحمي من المطر مثل النظارة الشمسية تحمي من', correct:'الشمس', wrong:['البرد', 'الرياح'] },
]

export default function AnalogiesGame({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng             = useRef(createRng(seed ?? Date.now())).current
  const count          = difficulty === 1 ? 5 : difficulty === 2 ? 8 : 12
  const [questions]    = useState<Q[]>(() => shuffleWithRng(rng, ALL).slice(0, count))

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = questions[idx]
  const choices = useMemo(() => shuffleWithRng(rng, [q.correct, ...q.wrong]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(c: string) {
    if (chosen) return
    if (timerRef.current) clearTimeout(timerRef.current) // dedup same-tick double-tap → single onComplete
    setChosen(c)
    const isCorrect = c === q.correct
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors + (isCorrect ? 0 : 1)
    setCorrect(nc)
    setErrors(ne)
    onProgress?.({ answered: idx + 1, total: count, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        onComplete({
          exerciseType:    'analogies',
          exerciseLabelAr: 'العلاقات والقياسات',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setChosen(null)
      }
    }, 1600)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">العلاقات والقياسات</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <QuizProgress value={(idx / count) * 100} />

      {/* Question */}
      <PromptCard emoji="🤔">
        <div className="text-2xl font-black text-white leading-relaxed">{q.text}</div>
      </PromptCard>

      {/* Choices */}
      <div className="flex gap-3 flex-wrap justify-center w-full max-w-sm">
        {choices.map((c, i) => {
          const isChosen  = c === chosen
          const isCorrect = c === q.correct
          let state: ChoiceState = 'idle'
          if (isChosen && isCorrect)  state = 'correct'
          else if (isChosen)          state = 'wrong'
          else if (chosen && isCorrect) state = 'reveal'
          return (
            <button key={`${idx}-${c}`} onClick={() => handleChoice(c)} disabled={!!chosen}
              className="flex-1 min-w-[100px] py-4 rounded-2xl text-lg font-black text-white border-2 transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[.97] disabled:cursor-not-allowed quiz-choice-in"
              style={{ ...choiceStyle(state), ...staggerDelay(i) }}>
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className={`text-sm font-bold ${chosen === q.correct ? 'text-green-400' : 'text-amber-400'}`}>
          {chosen === q.correct ? '✅ أحسنت! فهمت العلاقة' : `💡 الإجابة الصحيحة: ${q.correct}`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
