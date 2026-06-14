'use client'
import { useState, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Card { emoji: string; word: string; sentence: string; question: string; correct: string; wrong: [string,string] }

const CARDS: Card[] = [
  { emoji:'🐱', word:'القطة', sentence:'القطة تشرب الحليب في البيت.', question:'ماذا تشرب القطة؟', correct:'الحليب', wrong:['الماء','العصير'] },
  { emoji:'🌞', word:'الشمس', sentence:'الشمس تشرق في الصباح وتغرب في المساء.', question:'متى تشرق الشمس؟', correct:'في الصباح', wrong:['في الليل','في المساء'] },
  { emoji:'🐟', word:'السمكة', sentence:'السمكة تعيش في الماء وتسبح بسرعة.', question:'أين تعيش السمكة؟', correct:'في الماء', wrong:['في الهواء','في التراب'] },
  { emoji:'🌹', word:'الوردة', sentence:'الوردة الحمراء تنمو في الحديقة وتفوح رائحتها.', question:'أين تنمو الوردة؟', correct:'في الحديقة', wrong:['في البيت','في البحر'] },
  { emoji:'🐦', word:'العصفور', sentence:'العصفور يغني على فرع الشجرة كل صباح.', question:'أين يغني العصفور؟', correct:'على فرع الشجرة', wrong:['على الأرض','في البيت'] },
  { emoji:'🌧️', word:'المطر', sentence:'المطر يسقط في الشتاء ويسقي النباتات.', question:'متى يسقط المطر؟', correct:'في الشتاء', wrong:['في الصيف','في الربيع'] },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function ReadingCards({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 3 : difficulty === 2 ? 5 : 6
  const cards = CARDS.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [phase,   setPhase]   = useState<'read'|'answer'>('read')
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ar-SA'; u.rate = 0.8
    window.speechSynthesis.speak(u)
  }, [])

  const c = cards[idx]
  const choices = shuffle([c.correct, ...c.wrong])

  function handleChoice(ch: string) {
    if (chosen) return
    setChosen(ch)
    const isCorrect = ch === c.correct
    if (isCorrect) setCorrect(v => v + 1)
    else           setErrors(v => v + 1)

    setTimeout(() => {
      const next = idx + 1
      if (next >= count) {
        const nc = correct + (isCorrect ? 1 : 0)
        onComplete({
          exerciseType:    'reading-cards',
          exerciseLabelAr: 'بطاقات القراءة',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   errors + (isCorrect ? 0 : 1),
          metadata: { total: count, correct: nc },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(next)
        setPhase('read')
        setChosen(null)
      }
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">بطاقة</div>
        </div>
        <h2 className="text-xl font-black text-white">بطاقات القراءة</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {phase === 'read' ? (
        <>
          <div className="text-8xl">{c.emoji}</div>
          <div className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-2xl font-black text-brand-400 mb-3 text-center">{c.word}</div>
            <div className="text-white text-lg font-bold text-center leading-relaxed">{c.sentence}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => speak(c.sentence)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all active:scale-95">
              🔊 استمع
            </button>
            <button onClick={() => setPhase('answer')}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-sm transition-all active:scale-95">
              أجب الآن ←
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-white/70 font-bold text-center text-lg">{c.question}</div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {choices.map(ch => {
              const isChosen  = ch === chosen
              const isCorrect = ch === c.correct
              let cls = 'bg-white/5 border-white/15 hover:bg-white/15'
              if (isChosen && isCorrect)  cls = 'bg-green-500/25 border-green-400'
              if (isChosen && !isCorrect) cls = 'bg-red-500/25 border-red-400'
              if (chosen && !isChosen && isCorrect) cls = 'bg-green-500/10 border-green-400/40'
              return (
                <button key={ch} onClick={() => handleChoice(ch)} disabled={!!chosen}
                  className={`w-full py-4 rounded-2xl text-lg font-black text-white border-2
                    transition-all disabled:cursor-not-allowed ${cls}`}>
                  {ch}
                </button>
              )
            })}
          </div>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
