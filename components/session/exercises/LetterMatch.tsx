'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, pickWithRng, shuffleWithRng } from '@/lib/seeded-random'

const LETTER_GROUPS = [
  ['ب','ت','ث','ن'],
  ['ح','ج','خ'],
  ['د','ذ'],
  ['ر','ز'],
  ['س','ش'],
  ['ص','ض'],
  ['ط','ظ'],
  ['ع','غ'],
  ['ف','ق'],
  ['ك','ل'],
  ['م','ن'],
  ['و','ه','ة'],
  ['ي','ى'],
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

export default function LetterMatch({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const totalRounds = difficulty === 1 ? 10 : difficulty === 2 ? 15 : 20
  const rng = useRef(createRng(seed ?? Date.now())).current
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [target, setTarget] = useState(() => pickRound())
  const [done, setDone] = useState(false)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function pickRound() {
    const group = pickWithRng(rng, LETTER_GROUPS)
    const targetLetter = pickWithRng(rng, group)
    // Build 4 choices: target + 3 from same group or other groups
    const pool = [...group, ...LETTER_GROUPS.flat()].filter(l => l !== targetLetter)
    const distractors = shuffleWithRng(rng, Array.from(new Set(pool))).slice(0, 3)
    const choices = shuffleWithRng(rng, [targetLetter, ...distractors])
    return { targetLetter, choices }
  }

  function answer(letter: string) {
    if (feedback || done) return
    if (timerRef.current) clearTimeout(timerRef.current) // dedup same-tick double-tap → single onComplete
    const isCorrect = letter === target.targetLetter
    setFeedback(isCorrect ? 'correct' : 'wrong')
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else setErrors(ne)
    onProgress?.({ answered: round + 1, total: totalRounds, correct: nc, errors: ne, lastCorrect: isCorrect })
    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= totalRounds) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        const acc = Math.round(((isCorrect ? correct + 1 : correct) / totalRounds) * 100)
        setDone(true)
        onComplete({
          exerciseType: 'letter-match',
          exerciseLabelAr: 'مطابقة الحروف — دعم عسر القراءة',
          score: acc,
          accuracy: acc,
          duration: dur,
          errors: isCorrect ? errors : errors + 1,
          metadata: { correct: isCorrect ? correct + 1 : correct, totalRounds },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setRound(nextRound)
      setTarget(pickRound())
      setFeedback(null)
    }, 800)
  }

  return (
    <div className="flex flex-col items-center gap-8 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-xl font-black text-brand-400">{round}/{totalRounds}</div>
          <div className="text-xs text-white/50">جولة</div>
        </div>
        <h2 className="text-lg font-black text-white">مطابقة الحروف</h2>
        <div className="text-center">
          <div className="text-xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <p className="text-white/60 text-sm">اضغط على الحرف:</p>

      <div
        className={`text-9xl font-black p-8 rounded-3xl border-4 transition-all
          ${feedback === 'correct' ? 'border-green-400 bg-green-500/20' :
            feedback === 'wrong' ? 'border-red-400 bg-red-500/20' :
            'border-brand-500 bg-brand-700/30'}`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {target.targetLetter}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {target.choices.map(letter => (
          <button
            key={letter}
            onClick={() => answer(letter)}
            className={`py-6 rounded-2xl text-5xl font-black border-2 transition-all
              ${feedback && letter === target.targetLetter ? 'border-green-400 bg-green-500/20 scale-105' :
                feedback === 'wrong' ? 'border-white/10 opacity-50' :
                'border-white/20 bg-white/10 hover:bg-white/20 hover:border-brand-400 active:scale-95'
              }`}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {letter}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`text-2xl font-black ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? '✓ ممتاز!' : '✗ الحرف الصحيح: ' + target.targetLetter}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
