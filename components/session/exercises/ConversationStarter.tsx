'use client'
import { useState, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Scenario {
  emoji: string
  situation: string
  correct: string
  wrong: [string, string]
}

const SCENARIOS: Scenario[] = [
  { emoji:'👋', situation:'رأيت صديقاً جديداً في الفناء', correct:'مرحبا، أنا سالم، ما اسمك؟', wrong:['ابتعد عني','أنت غريب'] },
  { emoji:'⚽', situation:'تريد اللعب مع مجموعة', correct:'هل يمكنني اللعب معكم؟', wrong:['هذه اللعبة مملة','لعبتي أفضل'] },
  { emoji:'🎒', situation:'معلمك يشرح ولم تفهم', correct:'عذراً، لم أفهم، هل تشرح مرة أخرى؟', wrong:['لا أريد أن أتعلم','هذا صعب جداً'] },
  { emoji:'😔', situation:'صديقك يبدو حزيناً', correct:'هل أنت بخير؟ هل تحتاج مساعدة؟', wrong:['اضحك!','تجاهله'] },
  { emoji:'🍱', situation:'تريد تبادل وجبة الغداء', correct:'هل تريد أن نتبادل؟', wrong:['أعطني طعامك','طعامك يبدو سيئاً'] },
  { emoji:'🏆', situation:'خسرت في لعبة', correct:'لعبتم جيداً! اللعب مرة أخرى؟', wrong:['اللعبة غير عادلة','لا أريد أن ألعب'] },
  { emoji:'🤝', situation:'شخص يحتاج مساعدة', correct:'هل أستطيع مساعدتك؟', wrong:['افعل ذلك بنفسك','هذه مشكلتك'] },
  { emoji:'😬', situation:'أخطأت وأزعجت شخصاً', correct:'آسف، لم أقصد، هل أنت بخير؟', wrong:['لم أفعل شيئاً','هذا خطأك أنت'] },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function ConversationStarter({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count    = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
  const questions = SCENARIOS.slice(0, count)

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
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors + (isCorrect ? 0 : 1)
    setCorrect(nc)
    setErrors(ne)

    setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        const score = Math.round((nc / count) * 100)
        onComplete({
          exerciseType:    'conversation-starter',
          exerciseLabelAr: 'كيف أبدأ الحديث؟',
          score, accuracy: score,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setChosen(null)
      }
    }, 1800)
  }

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">موقف</div>
        </div>
        <h2 className="text-lg font-black text-white">كيف أبدأ الحديث؟</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Situation */}
      <div className="w-full max-w-md rounded-2xl p-5 text-center"
        style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.3)' }}>
        <div className="text-5xl mb-3">{q.emoji}</div>
        <div className="text-white font-bold text-lg">{q.situation}</div>
        <div className="text-white/50 text-sm mt-1">ماذا تقول؟</div>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {choices.map((c, i) => {
          const isCorrectChoice = c === q.correct
          const isChosen        = c === chosen
          let cls = 'bg-white/10 hover:bg-white/20 border-transparent'
          if (isChosen && isCorrectChoice)  cls = 'bg-green-500/30 border-green-400'
          if (isChosen && !isCorrectChoice) cls = 'bg-red-500/30 border-red-400'
          if (chosen && !isChosen && isCorrectChoice) cls = 'bg-green-500/15 border-green-400/40'
          return (
            <button key={i} onClick={() => handleChoice(c)} disabled={!!chosen}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold text-right text-white border-2 transition-all
                disabled:cursor-not-allowed ${cls}`}>
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className={`text-sm font-bold ${chosen === q.correct ? 'text-green-400' : 'text-amber-400'}`}>
          {chosen === q.correct ? '✅ ممتاز! هذا هو الأسلوب الصح' : `💡 الأفضل: "${q.correct}"`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
