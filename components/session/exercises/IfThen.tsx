'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface Q { cause: string; emoji: string; correct: string; wrong: [string, string] }

const ALL: Q[] = [
  // طبيعة وعلوم
  { cause:'إذا سقط الكوب على الأرض',        emoji:'🥛', correct:'ينكسر ويتسكب',                  wrong:['يطير','يكبر'] },
  { cause:'إذا زرعنا بذرة وسقيناها',         emoji:'🌱', correct:'تنمو وتصبح نباتاً',             wrong:['تذوب','تطير'] },
  { cause:'إذا تركنا الثلج خارجاً في الشمس', emoji:'🧊', correct:'يذوب ويصبح ماء',               wrong:['يكبر','يتلون'] },
  { cause:'إذا شربنا الماء يومياً',           emoji:'💧', correct:'نبقى بصحة جيدة',               wrong:['نمرض','نطير'] },
  { cause:'إذا أكلنا الكثير من الحلوى',       emoji:'🍬', correct:'قد يتألم بطننا وتتسوس أسنانا', wrong:['نصبح أذكياء','نطول'] },
  { cause:'إذا تركنا الطعام في الشمس كثيراً', emoji:'🍞', correct:'يفسد ولا يصلح للأكل',           wrong:['يصبح أحلى','يكبر'] },
  // مدرسة ودراسة
  { cause:'إذا لم نذاكر قبل الاختبار',        emoji:'📝', correct:'النتيجة ستكون سيئة',            wrong:['نحصل على جائزة','لا شيء يتغير'] },
  { cause:'إذا صرخنا في الفصل',               emoji:'📢', correct:'يزعج المعلم والطلاب',           wrong:['الجميع سيضحك','نحصل على تصفيق'] },
  { cause:'إذا أكملنا واجبنا في وقته',         emoji:'✅', correct:'نشعر بالراحة ويمدحنا المعلم',  wrong:['نتعب أكثر','لا فائدة منه'] },
  { cause:'إذا ساعدنا صديقنا في الدرس',        emoji:'🤝', correct:'يشعر بالامتنان ونصبح أصدقاء أفضل', wrong:['يغضب منا','يتركنا'] },
  // مشاعر وتصرفات اجتماعية
  { cause:'إذا ابتسمنا للناس',                 emoji:'😊', correct:'يبتسمون لنا ويشعرون بسعادة',  wrong:['يغضبون','يبكون'] },
  { cause:'إذا شعرنا بالغضب وضربنا شيئاً',    emoji:'😡', correct:'قد نؤذي أنفسنا أو الآخرين',   wrong:['نشعر بتحسن دائم','الجميع سيصفق'] },
  { cause:'إذا اعتذرنا حين نخطئ',              emoji:'🙏', correct:'يشعر المتضرر بتحسن ونحافظ على الصداقة', wrong:['يزيد الموقف سوءاً','لا يغير شيئاً'] },
  { cause:'إذا شاركنا لعبتنا مع الآخرين',      emoji:'🎮', correct:'يفرح أصدقاؤنا ويشاركوننا أشياءهم', wrong:['يغضبون','يتجنبوننا'] },
  // سلامة وأمان
  { cause:'إذا مشينا بالقرب من الطريق وحدنا',  emoji:'🚗', correct:'قد يكون ذلك خطراً يجب البقاء مع بالغ', wrong:['لا بأس إذا أسرعنا','نستطيع اللعب هناك'] },
  { cause:'إذا وجدنا شيئاً غير معروف ولمسناه', emoji:'⚠️', correct:'قد يكون خطيراً نخبر كبيراً أولاً', wrong:['نأكله','نعطيه لصديق'] },
  // رعاية النفس
  { cause:'إذا نمنا مبكراً كل ليلة',            emoji:'😴', correct:'نستيقظ نشيطين وركّزنا بشكل أفضل', wrong:['نتعب أكثر','لا فرق'] },
  { cause:'إذا غسلنا أيدينا قبل الأكل',          emoji:'🧼', correct:'نحمي أنفسنا من الجراثيم والأمراض', wrong:['نضيع الوقت','يصبح الطعام أقل لذة'] },
  // تسبب وأثر إبداعي
  { cause:'إذا مارسنا الرياضة يومياً',            emoji:'⚽', correct:'نصبح أقوى وأكثر صحة وسعادة',     wrong:['نمرض','نتعب ولا فائدة'] },
  { cause:'إذا قرأنا كتاباً جديداً',              emoji:'📚', correct:'نتعلم أشياء جديدة وتزداد مفرداتنا', wrong:['نضيع الوقت','نصبح خائفين'] },
]

export default function IfThen({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng   = useRef(createRng(seed ?? Date.now())).current
  const count = difficulty === 1 ? 6 : difficulty === 2 ? 12 : 20
  const qs    = ALL.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = qs[idx]
  const choices = useMemo(() => shuffleWithRng(rng, [q.correct, ...q.wrong]), [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === q.correct
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)

    timerRef.current = setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        onComplete({
          exerciseType:    'if-then',
          exerciseLabelAr: 'ماذا سيحدث؟',
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
