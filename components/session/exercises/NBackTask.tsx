'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function NBackTask({ onComplete, onCancel, studentAge: _studentAge, difficulty = 1 }: Props) {
  const n = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3
  const startRef = useRef(Date.now())
  const [history, setHistory] = useState<number[]>([])
  const [current, setCurrent] = useState<number | null>(null)
  const [trial, setTrial] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [responded, setResponded] = useState(false)
  const totalTrials = 20

  // Use refs to access latest state values inside the setTimeout callback
  const respondedRef = useRef(responded)
  respondedRef.current = responded
  const historyRef = useRef(history)
  historyRef.current = history
  const currentRef = useRef(current)
  currentRef.current = current

  useEffect(() => {
    if (trial >= totalTrials) {
      const dur = Math.round((Date.now() - startRef.current) / 1000)
      const acc = Math.round((correct / Math.max(1, correct + wrong)) * 100)
      onComplete({
        exerciseType: 'n-back',
        exerciseLabelAr: `ذاكرة N-Back (${n}-Back)`,
        score: acc,
        accuracy: acc,
        duration: dur,
        errors: wrong,
        metadata: { n, correct, wrong, totalTrials },
        completedAt: new Date().toISOString(),
      })
      return
    }
    const pos = Math.floor(Math.random() * 9)
    setCurrent(pos)
    setHistory(h => [...h, pos])
    setResponded(false)
    setFeedback(null)
    setWaiting(true)
    const timer = setTimeout(() => {
      if (!respondedRef.current) {
        // Miss — target but no response
        const hist = historyRef.current
        const cur = currentRef.current
        const isTarget = hist.length >= n && cur !== null && hist[hist.length - 1 - n] === cur
        if (isTarget) setWrong(w => w + 1)
      }
      setWaiting(false)
      setCurrent(null)
      setTimeout(() => setTrial(t => t + 1), 400)
    }, 2500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial])

  function respond(answer: boolean) {
    if (!waiting || responded) return
    setResponded(true)
    const hist = historyRef.current
    const cur = currentRef.current
    const isTarget = hist.length > n && cur !== null && hist[hist.length - 1 - n] === cur
    const correct_answer = isTarget === answer
    if (correct_answer) {
      setCorrect(c => c + 1)
      setFeedback('correct')
    } else {
      setWrong(w => w + 1)
      setFeedback('wrong')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-center">
          <div className="text-xl font-black text-brand-400">{trial}/{totalTrials}</div>
          <div className="text-xs text-white/50">محاولة</div>
        </div>
        <h2 className="text-lg font-black text-white">{n}-Back ذاكرة</h2>
        <div className="text-center">
          <div className="text-xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <p className="text-white/60 text-sm text-center max-w-xs">
        هل الموضع الحالي هو نفس الموضع الذي ظهر قبل <span className="text-brand-400 font-black">{n}</span> خطوات؟
      </p>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className={`w-20 h-20 rounded-xl border-2 transition-all duration-200 ${
              current === i && waiting
                ? 'bg-brand-500 border-brand-300 scale-110'
                : 'bg-white/5 border-white/10'
            }`}
          />
        ))}
      </div>

      {feedback && (
        <div className={`text-2xl font-black ${feedback === 'correct' ? 'text-green-400' : 'text-orange-400'}`}>
          {feedback === 'correct' ? '✓ ممتاز!' : '↩ حاول مرة أخرى'}
        </div>
      )}

      <div className="flex gap-4 mt-2">
        <button
          onClick={() => respond(true)}
          disabled={!waiting || responded}
          className="px-10 py-5 bg-green-500/20 border-2 border-green-400 text-green-400 font-black text-xl rounded-2xl hover:bg-green-500/40 disabled:opacity-30 transition-all active:scale-95"
        >
          ✓ نعم
        </button>
        <button
          onClick={() => respond(false)}
          disabled={!waiting || responded}
          className="px-10 py-5 bg-white/10 border-2 border-white/30 text-white/70 font-black text-xl rounded-2xl hover:bg-white/20 disabled:opacity-30 transition-all active:scale-95"
        >
          ✗ لا
        </button>
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
