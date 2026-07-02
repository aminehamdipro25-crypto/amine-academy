'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

const ACTIONS = [
  { emoji: '👋', label: 'لوّح بيدك' },
  { emoji: '👏', label: 'صفّق' },
  { emoji: '🤲', label: 'افتح كلتا يديك' },
  { emoji: '☝️', label: 'أشر بإصبع للأعلى' },
  { emoji: '🙌', label: 'ارفع يديك' },
  { emoji: '✌️', label: 'أشكال V بالأصابع' },
  { emoji: '👍', label: 'إبهام للأعلى' },
  { emoji: '🙏', label: 'ضع يديك معاً' },
  { emoji: '💪', label: 'أظهر عضلاتك' },
  { emoji: '🤗', label: 'افتح ذراعيك للعناق' },
  { emoji: '🫀', label: 'ضع يدك على قلبك' },
  { emoji: '🤜', label: 'أبرز قبضتك' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function ImitationMirror({ onComplete, onCancel, difficulty = 1 }: Props) {
  const perRound  = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const ROUNDS    = 3
  const startRef  = useRef(Date.now())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const [actions] = useState(() => shuffle(ACTIONS).slice(0, perRound * ROUNDS))
  const [round,   setRound]   = useState(0)
  const [step,    setStep]    = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong,   setWrong]   = useState(0)
  const [flash,   setFlash]   = useState<'ok'|'err'|null>(null)

  const roundActions = actions.slice(round * perRound, (round + 1) * perRound)
  const current      = roundActions[step]

  function score(ok: boolean) {
    setFlash(ok ? 'ok' : 'err')
    const c = correct + (ok ? 1 : 0)
    const w = wrong   + (ok ? 0 : 1)
    if (ok) setCorrect(c); else setWrong(w)

    timerRef.current = setTimeout(() => {
      setFlash(null)
      const nextStep = step + 1
      if (nextStep >= roundActions.length) {
        const nextRound = round + 1
        if (nextRound >= ROUNDS) {
          const total = c + w
          const pct   = total > 0 ? Math.round((c / total) * 100) : 100
          onComplete({
            exerciseType:    'imitation-mirror',
            exerciseLabelAr: 'التقليد الحركي',
            score:    pct,
            accuracy: pct,
            duration: Math.round((Date.now() - startRef.current) / 1000),
            errors:   w,
            metadata: { rounds: ROUNDS, actionsPerRound: perRound, difficulty },
            completedAt: new Date().toISOString(),
          })
        } else {
          setRound(nextRound)
          setStep(0)
        }
      } else {
        setStep(nextStep)
      }
    }, 700)
  }

  const progress = ((round * perRound + step) / (ROUNDS * perRound)) * 100

  return (
    <div className="flex flex-col items-center gap-5 p-5 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-white">{step + 1}/{perRound}</div>
          <div className="text-[10px] text-white/40">حركة</div>
        </div>
        <h2 className="font-black text-white text-base">🪞 التقليد الحركي</h2>
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-green-400">{correct}</div>
          <div className="text-[10px] text-white/40">✓ قلّد</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-white/50 text-xs text-center font-bold">الأخصائي: قم بالحركة وانتظر تقليد الطفل</p>

      <div className={`w-52 h-52 rounded-3xl flex flex-col items-center justify-center gap-4 border-2 transition-all duration-300 ${
        flash === 'ok'  ? 'bg-green-500/20 border-green-400 scale-105' :
        flash === 'err' ? 'bg-red-500/20 border-red-400' :
        'bg-brand-600/20 border-brand-400/60'
      }`}>
        <span className="text-9xl">{current?.emoji}</span>
        <span className="text-white font-black text-lg text-center px-2">{current?.label}</span>
      </div>

      {flash ? (
        <div className={`font-black text-2xl transition-all ${flash === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {flash === 'ok' ? '✓ ممتاز!' : '✗ لم يقلّد'}
        </div>
      ) : (
        <div className="flex gap-4 w-full max-w-sm">
          <button onClick={() => score(true)}
            className="flex-1 bg-green-500/20 border-2 border-green-400 text-green-400 font-black text-xl py-5 rounded-2xl active:scale-95 transition-all shadow-lg shadow-green-500/10">
            ✓ قلّد
          </button>
          <button onClick={() => score(false)}
            className="flex-1 bg-red-500/10 border-2 border-red-400/40 text-red-400/80 font-black text-xl py-5 rounded-2xl active:scale-95 transition-all">
            ✗ لم يقلّد
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
            i < round ? 'bg-green-500/40 text-green-400' :
            i === round ? 'bg-brand-500 text-white scale-110' :
            'bg-white/10 text-white/30'
          }`}>{i + 1}</div>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors">← إنهاء التمرين</button>
    </div>
  )
}
