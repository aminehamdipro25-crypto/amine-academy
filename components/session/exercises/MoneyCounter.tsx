'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface Item {
  name:  string
  emoji: string
  price: number   // in riyals (whole numbers)
}

interface Question {
  type:   'count' | 'buy' | 'change'
  items:  Item[]
  budget: number   // money given (for 'change' questions)
  targetAmount: number
  prompt: string
  hint?:  string
}

const SHOP_ITEMS: Item[] = [
  { name:'تفاحة',   emoji:'🍎', price:2 },
  { name:'موزة',    emoji:'🍌', price:3 },
  { name:'عصير',    emoji:'🧃', price:5 },
  { name:'كتاب',    emoji:'📚', price:8 },
  { name:'قلم',     emoji:'✏️', price:1 },
  { name:'كرة',     emoji:'⚽', price:6 },
  { name:'شوكولاتة',emoji:'🍫', price:4 },
  { name:'لعبة',    emoji:'🧸', price:9 },
  { name:'دفتر',    emoji:'📓', price:3 },
  { name:'مرسم',    emoji:'🎨', price:7 },
]

const COINS = [1, 2, 5, 10]

function makeCountQ(targetAmount: number): Question {
  return {
    type: 'count',
    items: [],
    budget: 0,
    targetAmount,
    prompt: `اجمع ${targetAmount} ريال من النقود`,
    hint: 'انقر على النقود لجمع المبلغ المطلوب',
  }
}

function makeBuyQ(item: Item): Question {
  return {
    type: 'buy',
    items: [item],
    budget: 0,
    targetAmount: item.price,
    prompt: `اشترِ ${item.name} ${item.emoji} بـ ${item.price} ريال`,
    hint: 'انقر على النقود لدفع ثمن المنتج',
  }
}

function makeChangeQ(item: Item, budget: number): Question {
  return {
    type: 'change',
    items: [item],
    budget,
    targetAmount: budget - item.price,  // correct change
    prompt: `اشتريت ${item.name} ${item.emoji} بـ ${item.price} ريال ودفعت ${budget} ريال. كم الباقي؟`,
    hint: 'اختر المبلغ الصحيح للباقي',
  }
}

function buildQuestions(rng: Rng, difficulty: 1|2|3, _studentAge: number): Question[] {
  const items = shuffleWithRng(rng, SHOP_ITEMS)
  if (difficulty === 1) {
    // Easy: count coins 1–10
    return [2, 3, 5, 4, 6, 7].map(n => makeCountQ(n))
  }
  if (difficulty === 2) {
    // Medium: buy items 1–9 riyals
    return items.slice(0, 8).map(it => makeBuyQ(it))
  }
  // Hard: make change, budget 10 or 20
  return items.slice(0, 8).map(it => {
    const budget = it.price <= 5 ? 10 : 20
    return makeChangeQ(it, budget)
  })
}

// ── CoinButton ────────────────────────────────────────────────────────────────
function CoinButton({ value, onClick }: { value: number; onClick: () => void }) {
  const colors: Record<number,string> = {
    1:  'from-amber-400 to-amber-600',
    2:  'from-slate-300 to-slate-500',
    5:  'from-yellow-400 to-yellow-600',
    10: 'from-amber-300 to-yellow-500',
  }
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-full border-4 border-white/30
        shadow-lg active:scale-90 transition-transform duration-100 select-none"
      style={{
        width: value === 10 ? 72 : 60,
        height: value === 10 ? 72 : 60,
        background: `linear-gradient(135deg,var(--tw-gradient-stops))`,
      }}>
      <span className="font-black text-white text-shadow"
        style={{ fontSize: value === 10 ? 18 : 16, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>
        {value}
      </span>
      <span className="text-white/80 font-bold" style={{ fontSize: 10 }}>ريال</span>
    </button>
  )
}

export default function MoneyCounter({ onComplete, onCancel, difficulty = 1, studentAge, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const TOTAL = difficulty === 1 ? 5 : difficulty === 2 ? 6 : 6
  const qs    = useMemo(() => buildQuestions(rng, difficulty, studentAge).slice(0, TOTAL), [difficulty, studentAge]) // eslint-disable-line

  const [idx,       setIdx]       = useState(0)
  const [collected, setCollected] = useState(0)  // running sum of tapped coins / chosen option
  const [phase,     setPhase]     = useState<'input'|'feedback'>('input')
  const [correct,   setCorrect]   = useState(0)
  const [errors,    setErrors]    = useState(0)
  const [startMs]                 = useState(Date.now())
  const [history,   setHistory]   = useState<boolean[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = qs[idx]

  function reset() {
    setCollected(0)
    setPhase('input')
  }

  function advance(isCorrect: boolean) {
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else setErrors(ne)
    setHistory(h => [...h, isCorrect])
    setPhase('feedback')
    timerRef.current = setTimeout(() => {
      if (idx + 1 >= TOTAL) {
        onComplete({
          exerciseType:    'money-counter',
          exerciseLabelAr: 'عدّ النقود',
          score:    Math.round((nc / TOTAL) * 100),
          accuracy: Math.round((nc / TOTAL) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: TOTAL, correct: nc, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(i => i + 1)
        reset()
      }
    }, 1800)
  }

  function tapCoin(v: number) {
    if (phase !== 'input') return
    const next = collected + v
    setCollected(next)
    if (next === q.targetAmount) {
      advance(true)
    } else if (next > q.targetAmount) {
      advance(false)  // overshot
    }
  }

  // For 'change' questions, present multiple-choice answers
  const changeOptions = useMemo<number[]>(() => {
    if (q?.type !== 'change') return []
    const correct = q.targetAmount
    const opts = new Set<number>([correct])
    const candidates = [correct - 2, correct - 1, correct + 1, correct + 2, correct + 3]
    for (const c of candidates) { if (c >= 0 && opts.size < 4) opts.add(c) }
    return shuffleWithRng(rng, [...opts])
  }, [idx]) // eslint-disable-line

  const isCorrectFeedback = phase === 'feedback' &&
    (q.type === 'change'
      ? true   // we set result in handleChangeChoice
      : collected === q.targetAmount)

  // For change questions: explicit choice
  const [changeChosen, setChangeChosen] = useState<number | null>(null)
  useEffect(() => { setChangeChosen(null) }, [idx])

  function handleChangeChoice(v: number) {
    if (phase !== 'input') return
    setChangeChosen(v)
    advance(v === q.targetAmount)
  }

  const isYoung = studentAge < 8

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx+1}/{TOTAL}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">عدّ النقود 💰</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/TOTAL)*100}%`, background:'#7C5CFC' }} />
      </div>

      {/* History dots */}
      <div className="flex gap-1.5">
        {history.map((h,i) => (
          <span key={i} className={`w-2.5 h-2.5 rounded-full ${h ? 'bg-green-400' : 'bg-red-400'}`} />
        ))}
        {Array.from({ length: TOTAL - history.length }).map((_,i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/15" />
        ))}
      </div>

      {/* Question card */}
      <div className="w-full max-w-sm rounded-2xl p-4 text-center"
        style={{ background:'rgba(124,92,252,0.12)', border:'1px solid rgba(124,92,252,0.3)' }}>
        <p className="text-white font-bold text-base leading-relaxed">{q.prompt}</p>
        {q.hint && <p className="text-white/40 text-xs mt-1">{q.hint}</p>}
      </div>

      {/* ── count / buy mode: running total + coins ── */}
      {q.type !== 'change' && (
        <>
          {/* Running total */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={`text-5xl font-black transition-colors ${
                collected > q.targetAmount ? 'text-red-400'
                : collected === q.targetAmount ? 'text-green-400'
                : 'text-white'
              }`}>{collected}</div>
              <div className="text-white/40 text-xs">ريال جُمع</div>
            </div>
            <div className="text-white/30 text-3xl font-thin">/</div>
            <div className="text-center">
              <div className="text-5xl font-black text-amber-400">{q.targetAmount}</div>
              <div className="text-white/40 text-xs">المطلوب</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs bg-white/10 rounded-full h-3">
            <div className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((collected / q.targetAmount) * 100, 100)}%`,
                background: collected > q.targetAmount ? '#ef4444' : collected === q.targetAmount ? '#22c55e' : '#7C5CFC',
              }} />
          </div>

          {/* Reset button */}
          {collected > 0 && phase === 'input' && (
            <button onClick={() => setCollected(0)}
              className="text-white/40 hover:text-white/70 text-xs transition-colors">
              ↩️ ابدأ من جديد
            </button>
          )}

          {/* Coin buttons */}
          {phase === 'input' && (
            <div className="flex gap-4 flex-wrap justify-center mt-1">
              {COINS.map(v => (
                <CoinButton key={v} value={v} onClick={() => tapCoin(v)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── change mode: multiple choice ── */}
      {q.type === 'change' && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
          {changeOptions.map(v => {
            const isChosen  = changeChosen === v
            const isCorrect = v === q.targetAmount
            let bg = 'rgba(255,255,255,0.07)'
            let border = 'rgba(255,255,255,0.15)'
            if (phase === 'feedback') {
              if (isCorrect)             { bg = 'rgba(34,197,94,0.2)';  border = '#22c55e' }
              if (isChosen && !isCorrect){ bg = 'rgba(239,68,68,0.2)';  border = '#ef4444' }
            } else if (isChosen) {
              bg = 'rgba(124,92,252,0.2)'; border = '#7C5CFC'
            }
            return (
              <button key={v}
                onClick={() => handleChangeChoice(v)}
                disabled={phase !== 'input'}
                className="rounded-2xl p-4 flex flex-col items-center gap-1 border-2 transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{ background: bg, borderColor: border }}>
                <span className={`font-black ${isYoung ? 'text-4xl' : 'text-3xl'} text-white`}>{v}</span>
                <span className="text-white/50 text-xs">ريال</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Feedback */}
      {phase === 'feedback' && (
        <div className={`text-2xl font-black ${isCorrectFeedback ? 'text-green-400' : 'text-red-400'}`}>
          {collected === q.targetAmount || (q.type === 'change' && changeChosen === q.targetAmount)
            ? '✅ ممتاز! إجابة صحيحة!'
            : `❌ المبلغ الصحيح هو ${q.type === 'change' ? q.targetAmount : q.targetAmount} ريال`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors mt-1">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
