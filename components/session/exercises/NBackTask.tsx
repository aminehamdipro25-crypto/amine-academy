'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props { onComplete: (r: ExerciseResult) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3 }

export default function NBackTask({ onComplete, onCancel, difficulty = 1 }: Props) {
  const n           = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3
  const totalTrials = difficulty === 1 ? 15 : difficulty === 2 ? 20 : 25
  const displayMs   = 2000
  const itiMs       = 500

  const startRef   = useRef(Date.now())
  const histRef    = useRef<number[]>([])
  const correctRef = useRef(0)
  const wrongRef   = useRef(0)
  const respondRef = useRef(false)

  const [phase, setPhase]       = useState<'intro'|'show'|'iti'|'done'>('intro')
  const [trial, setTrial]       = useState(0)
  const [current, setCurrent]   = useState<number | null>(null)
  const [history, setHistory]   = useState<number[]>([])
  const [feedback, setFeedback] = useState<'hit'|'miss'|'fa'|'cr'|null>(null)
  const [correct, setCorrect]   = useState(0)
  const [wrong, setWrong]       = useState(0)
  const [result, setResult]     = useState<ExerciseResult | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function runTrial(t: number) {
    if (t >= totalTrials) {
      const acc = Math.round((correctRef.current / Math.max(1, correctRef.current + wrongRef.current)) * 100)
      setResult({
        exerciseType: 'n-back',
        exerciseLabelAr: `ذاكرة ${n}-Back`,
        score: acc,
        accuracy: acc,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        errors: wrongRef.current,
        metadata: { n, correct: correctRef.current, wrong: wrongRef.current, totalTrials },
        completedAt: new Date().toISOString(),
      })
      setPhase('done')
      return
    }
    const pos = Math.floor(Math.random() * 9)
    respondRef.current = false
    histRef.current = [...histRef.current, pos]
    setHistory([...histRef.current])
    setCurrent(pos)
    setFeedback(null)
    setPhase('show')
    setTrial(t)
  }

  useEffect(() => {
    if (phase !== 'show') return
    const timer = setTimeout(() => {
      if (!respondRef.current) {
        const hist     = histRef.current
        const isTarget = hist.length > n && hist[hist.length - 1 - n] === hist[hist.length - 1]
        if (isTarget) { wrongRef.current++; setWrong(wrongRef.current); setFeedback('miss') }
        else          { correctRef.current++; setCorrect(correctRef.current); setFeedback('cr') }
      }
      setCurrent(null)
      setPhase('iti')
      setTimeout(() => runTrial(trial + 1), itiMs)
    }, displayMs)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trial])

  function respond(answer: boolean) {
    if (phase !== 'show' || respondRef.current) return
    respondRef.current = true
    const hist     = histRef.current
    const isTarget = hist.length > n && hist[hist.length - 1 - n] === hist[hist.length - 1]
    const isCorrect = isTarget === answer
    if (isCorrect) {
      correctRef.current++; setCorrect(correctRef.current)
      setFeedback(answer ? 'hit' : 'cr')
    } else {
      wrongRef.current++; setWrong(wrongRef.current)
      setFeedback(answer ? 'fa' : 'miss')
    }
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6" dir="rtl">
        <div className="text-7xl">🧠</div>
        <h2 className="text-white font-black text-2xl text-center">{n}-Back — ذاكرة العمل</h2>
        <div className="bg-white/5 rounded-2xl p-5 w-full max-w-xs space-y-3 text-sm text-white/70">
          <p>ستظهر مربعات مضيئة على شبكة 3×3 واحداً تلو الآخر</p>
          <p>
            <span className="text-brand-300 font-black">اضغط ✓ نعم</span> إذا كان الموضع الحالي نفس موضع{' '}
            <span className="text-2xl font-black text-brand-400">{n}</span> خطوة قبل
          </p>
          <p>اضغط ✗ لا إذا لم يكن كذلك</p>
        </div>
        <button
          onClick={() => { startRef.current = Date.now(); runTrial(0) }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all active:scale-95"
        >
          ابدأ
        </button>
        <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">← إنهاء</button>
      </div>
    )
  }

  if (phase === 'done' && result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6" dir="rtl">
        <div className="text-7xl">{result.score >= 80 ? '🏆' : result.score >= 60 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{correct}</div>
            <div className="text-xs text-white/40 mt-1">صحيح</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{wrong}</div>
            <div className="text-xs text-white/40 mt-1">خطأ</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-5xl">{result.score}%</div>
        <div className="w-full max-w-xs bg-white/10 rounded-full h-3 overflow-hidden">
          <div className="bg-brand-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${result.score}%` }} />
        </div>
        <button onClick={() => onComplete(result)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-all active:scale-95">
          متابعة →
        </button>
      </div>
    )
  }

  const acc = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 100
  const nBackPos = history.length > n ? history[history.length - 1 - n] : null

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-white">{trial + 1}/{totalTrials}</div>
          <div className="text-[10px] text-white/40">محاولة</div>
        </div>
        <h2 className="text-base font-black text-white">{n}-Back</h2>
        <div className="bg-white/10 rounded-xl px-3 py-1 text-center">
          <div className="text-sm font-black text-green-400">{acc}%</div>
          <div className="text-[10px] text-white/40">دقة</div>
        </div>
      </div>

      <p className="text-white/40 text-xs text-center">
        هل الموضع الحالي = الموضع قبل{' '}
        <span className="text-brand-300 font-black">{n}</span> خطوة؟
      </p>

      <div className="flex gap-1.5 items-center h-8">
        {history.slice(-Math.min(n + 2, history.length)).map((pos, i, arr) => {
          const isNBack = i === arr.length - 1 - n
          return (
            <div key={i}
              className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                isNBack ? 'bg-brand-400 text-white scale-110 shadow-[0_0_10px_rgba(124,92,252,0.6)]' : 'bg-white/10 text-white/40'
              }`}>
              {pos + 1}
            </div>
          )
        })}
        {history.length > 0 && (
          <>
            <div className="w-px h-5 bg-white/20 mx-0.5" />
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center shadow-[0_0_12px_rgba(124,92,252,0.5)]">
              {current !== null ? current + 1 : '?'}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 my-1">
        {Array.from({ length: 9 }, (_, i) => {
          const isActive  = current === i && phase === 'show'
          const isNBackHint = nBackPos === i && phase === 'show'
          return (
            <div key={i}
              className={`w-20 h-20 rounded-2xl border-2 transition-all duration-150 ${
                isActive
                  ? 'bg-brand-500 border-brand-300 scale-110 shadow-[0_0_24px_rgba(124,92,252,0.7)]'
                  : isNBackHint
                    ? 'bg-white/5 border-brand-900'
                    : 'bg-white/5 border-white/10'
              }`}
            />
          )
        })}
      </div>

      {feedback && (
        <div className={`text-xl font-black ${
          feedback === 'hit' ? 'text-green-400' :
          feedback === 'cr'  ? 'text-blue-400'  :
          feedback === 'fa'  ? 'text-red-400'   :
                               'text-orange-400'
        }`}>
          {feedback === 'hit'  ? '✓ ذاكرة ممتازة!' :
           feedback === 'cr'   ? '✓ صحيح!'         :
           feedback === 'fa'   ? '✗ اندفاع'         :
                                  '✗ فائتة'}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => respond(true)} disabled={phase !== 'show'}
          className="px-8 py-4 bg-green-500/20 border-2 border-green-400 text-green-400 font-black text-xl rounded-2xl hover:bg-green-500/40 disabled:opacity-30 transition-all active:scale-90">
          ✓ نعم
        </button>
        <button onClick={() => respond(false)} disabled={phase !== 'show'}
          className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white/70 font-black text-xl rounded-2xl hover:bg-white/20 disabled:opacity-30 transition-all active:scale-90">
          ✗ لا
        </button>
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors">← إنهاء التمرين</button>
    </div>
  )
}
