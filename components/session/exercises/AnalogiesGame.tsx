'use client'
import { useState, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Q { text: string; correct: string; wrong: [string, string] }

const ALL: Q[] = [
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

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function AnalogiesGame({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count          = difficulty === 1 ? 5 : difficulty === 2 ? 8 : 12
  const [questions]    = useState<Q[]>(() => shuffle(ALL).slice(0, count))

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())

  const q = questions[idx]
  const choices = useMemo(() => shuffle([q.correct, ...q.wrong]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === q.correct
    if (isCorrect) setCorrect(v => v + 1)
    else           setErrors(v => v + 1)

    setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        const nc = correct + (isCorrect ? 1 : 0)
        onComplete({
          exerciseType:    'analogies',
          exerciseLabelAr: 'العلاقات والقياسات',
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

      {/* Question */}
      <div className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: 'rgba(124,92,252,0.12)', border: '2px solid rgba(124,92,252,0.3)' }}>
        <div className="text-2xl font-black text-white leading-relaxed">{q.text}</div>
        <div className="text-5xl mt-3">🤔</div>
      </div>

      {/* Choices */}
      <div className="flex gap-3 flex-wrap justify-center w-full max-w-sm">
        {choices.map(c => {
          const isChosen  = c === chosen
          const isCorrect = c === q.correct
          let cls = 'bg-white/10 hover:bg-white/20 border-transparent'
          if (isChosen && isCorrect)  cls = 'bg-green-500/30 border-green-400'
          if (isChosen && !isCorrect) cls = 'bg-red-500/30 border-red-400'
          if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/15 border-green-400/40'
          return (
            <button key={c} onClick={() => handleChoice(c)} disabled={!!chosen}
              className={`flex-1 min-w-[100px] py-4 rounded-2xl text-lg font-black text-white border-2 transition-all
                disabled:cursor-not-allowed ${cls}`}>
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
