'use client'
import { useState, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Q { cause: string; emoji: string; correct: string; wrong: [string, string] }

const ALL: Q[] = [
  { cause:'إذا سقط الكوب على الأرض', emoji:'🥛', correct:'ينكسر ويتسكب', wrong:['يطير','يكبر'] },
  { cause:'إذا زرعنا بذرة وسقيناها', emoji:'🌱', correct:'تنمو وتصبح نباتاً', wrong:['تذوب','تطير'] },
  { cause:'إذا تركنا الثلج خارجاً',  emoji:'🧊', correct:'يذوب ويصبح ماء', wrong:['يكبر','يتلون'] },
  { cause:'إذا لم نذاكر قبل الاختبار',emoji:'📝', correct:'النتيجة ستكون سيئة', wrong:['نحصل على جائزة','لا شيء يتغير'] },
  { cause:'إذا صرخنا في الفصل',       emoji:'📢', correct:'يزعج المعلم والطلاب', wrong:['الجميع سيضحك','نحصل على تصفيق'] },
  { cause:'إذا شربنا الماء كثيراً',   emoji:'💧', correct:'نبقى بصحة جيدة', wrong:['نمرض','نطير'] },
  { cause:'إذا أكلنا الكثير من الحلوى',emoji:'🍬', correct:'قد يتألم بطننا', wrong:['نصبح أذكياء','نطول'] },
  { cause:'إذا ابتسمنا للناس',        emoji:'😊', correct:'يبتسمون لنا ويشعرون بسعادة', wrong:['يغضبون','يبكون'] },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function IfThen({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
  const qs    = ALL.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())

  const q = qs[idx]
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
          exerciseType:    'if-then',
          exerciseLabelAr: 'ماذا سيحدث؟',
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
        <h2 className="text-xl font-black text-white">ماذا سيحدث؟</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Cause */}
      <div className="w-full max-w-sm rounded-2xl p-5 text-center"
        style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.25)' }}>
        <div className="text-5xl mb-3">{q.emoji}</div>
        <div className="text-white font-black text-lg">{q.cause}</div>
        <div className="text-white/50 text-sm mt-1">ماذا سيحدث؟</div>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {choices.map(c => {
          const isChosen  = c === chosen
          const isCorrect = c === q.correct
          let cls = 'bg-white/5 border-white/15 hover:bg-white/15'
          if (isChosen && isCorrect)  cls = 'bg-green-500/25 border-green-400'
          if (isChosen && !isCorrect) cls = 'bg-red-500/25 border-red-400'
          if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/10 border-green-400/40'
          return (
            <button key={c} onClick={() => handleChoice(c)} disabled={!!chosen}
              className={`w-full py-3 px-4 rounded-2xl text-right text-sm font-bold text-white border-2
                transition-all disabled:cursor-not-allowed ${cls}`}>
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className={`text-sm font-bold ${chosen === q.correct ? 'text-green-400' : 'text-amber-400'}`}>
          {chosen === q.correct ? '✅ تفكير ممتاز!' : `💡 الصحيح: "${q.correct}"`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
