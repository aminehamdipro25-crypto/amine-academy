'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

const WORD_BANK = [
  'شمس','قمر','نجم','بحر','جبل','شجرة','زهرة','طائر','سمكة','فيل',
  'أسد','قطة','كلب','حصان','أرنب','تفاحة','موزة','برتقالة','عنب','فراولة',
  'كتاب','قلم','مدرسة','بيت','سيارة','طائرة','قطار','دراجة','كرة','لعبة',
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function WordRecall({ onComplete, onCancel, studentAge: _studentAge, difficulty = 1 }: Props) {
  const wordCount = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
  const displayTime = difficulty === 1 ? 10 : difficulty === 2 ? 8 : 6
  const startRef = useRef(Date.now())
  const [phase, setPhase] = useState<'study'|'recall'|'done'>('study')
  const [targetWords, setTargetWords] = useState<string[]>([])
  const [allChoices, setAllChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [countdown, setCountdown] = useState(displayTime)

  useEffect(() => {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5)
    const targets = shuffled.slice(0, wordCount)
    const distractors = shuffled.slice(wordCount, wordCount + wordCount)
    const choices = [...targets, ...distractors].sort(() => Math.random() - 0.5)
    setTargetWords(targets)
    setAllChoices(choices)
    setCountdown(displayTime)
  }, [wordCount, displayTime])

  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) {
      setPhase('recall')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, phase])

  function toggle(word: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(word) ? n.delete(word) : n.add(word)
      return n
    })
  }

  function submit() {
    const hits = Array.from(selected).filter(w => targetWords.includes(w)).length
    const falseAlarms = Array.from(selected).filter(w => !targetWords.includes(w)).length
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const acc = Math.round((hits / wordCount) * 100)
    setPhase('done')
    onComplete({
      exerciseType: 'word-recall',
      exerciseLabelAr: 'تذكر الكلمات',
      score: Math.max(0, acc - falseAlarms * 10),
      accuracy: acc,
      duration: dur,
      errors: falseAlarms,
      metadata: { wordsRecalled: hits, totalWords: wordCount, falseAlarms },
      completedAt: new Date().toISOString(),
    })
  }

  if (phase === 'done') return null

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none max-w-lg mx-auto w-full">
      <h2 className="text-xl font-black text-white">تذكر الكلمات</h2>

      {phase === 'study' && (
        <>
          <div className={`text-5xl font-black ${countdown <= 3 ? 'text-amber-400' : 'text-amber-400'}`}>
            {countdown}
          </div>
          <p className="text-white/60 text-sm text-center">تذكر هذه الكلمات:</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {targetWords.map(w => (
              <div key={w}
                className="bg-brand-700/40 border-2 border-brand-500 rounded-2xl p-4 text-center text-2xl font-black text-white">
                {w}
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'recall' && (
        <>
          <p className="text-white/80 text-sm text-center">اختر الكلمات التي تتذكرها:</p>
          <div className="grid grid-cols-3 gap-2 w-full">
            {allChoices.map(w => (
              <button key={w}
                onClick={() => toggle(w)}
                className={`p-3 rounded-xl border-2 font-bold text-lg transition-all ${
                  selected.has(w)
                    ? 'bg-brand-500 border-brand-300 text-white scale-105'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}>
                {w}
              </button>
            ))}
          </div>
          <button onClick={submit}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl text-lg transition-colors">
            تأكيد ✓
          </button>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
