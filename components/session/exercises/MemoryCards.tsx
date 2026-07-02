'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const EMOJI_SETS = [
  ['🦋','🌟','🐬','🌈','🎯','🍓','🦄','🎪','🌺','🏆','🎨','🎭'],
  ['🚀','🦊','🐙','🌙','⚡','🦁','🎸','🌊','🔮','🦅','💎','🌻'],
]

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean }
interface Props { onComplete: (r: ExerciseResult) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3 }

export default function MemoryCards({ onComplete, onCancel, difficulty = 1 }: Props) {
  const pairCount  = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10
  const emojiSet        = useRef(EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]).current
  const startRef        = useRef(Date.now())
  const matchTimerRef   = useRef<ReturnType<typeof setTimeout>>()
  const completeTimerRef= useRef<ReturnType<typeof setTimeout>>()
  const mismatchTimerRef= useRef<ReturnType<typeof setTimeout>>()

  const [cards, setCards]         = useState<Card[]>([])
  const [flipped, setFlipped]     = useState<number[]>([])
  const [errors, setErrors]       = useState(0)
  const [matches, setMatches]     = useState(0)
  const [locked, setLocked]       = useState(false)
  const [done, setDone]           = useState(false)
  const [elapsed, setElapsed]     = useState(0)
  const [celebrating, setCelebrating] = useState(false)
  const [previewing, setPreviewing]   = useState(true)
  const [speedMult, setSpeedMult]     = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const saved = Number(localStorage.getItem('mc-preview-speed'))
    return saved === 0.6 || saved === 1 || saved === 1.6 ? saved : 1
  })

  useEffect(() => () => {
    clearTimeout(matchTimerRef.current)
    clearTimeout(completeTimerRef.current)
    clearTimeout(mismatchTimerRef.current)
  }, [])

  useEffect(() => {
    const emojis = emojiSet.slice(0, pairCount)
    const pairs  = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: true, matched: false }))
    setCards(pairs)
    setPreviewing(true)
  }, [pairCount, emojiSet])

  useEffect(() => {
    if (!previewing) return
    const revealMs = Math.round((2200 + pairCount * 350) * speedMult)
    const t = setTimeout(() => {
      setCards(c => c.map(card => ({ ...card, flipped: false })))
      setPreviewing(false)
      startRef.current = Date.now()
    }, revealMs)
    return () => clearTimeout(t)
  }, [previewing, pairCount, speedMult])

  function setPreviewSpeed(m: number) {
    setSpeedMult(m)
    localStorage.setItem('mc-preview-speed', String(m))
  }

  useEffect(() => {
    if (done || previewing) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [done, previewing])

  const handleFlip = useCallback((id: number) => {
    if (previewing || locked || cards[id]?.flipped || cards[id]?.matched) return
    const newFlipped = [...flipped, id]
    setCards(c => c.map(card => card.id === id ? { ...card, flipped: true } : card))
    if (newFlipped.length === 2) {
      setLocked(true)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        matchTimerRef.current = setTimeout(() => {
          setCards(c => c.map(card => card.id === a || card.id === b ? { ...card, matched: true } : card))
          const nm = matches + 1
          setMatches(nm)
          setFlipped([])
          setLocked(false)
          if (nm === pairCount) {
            const dur = Math.round((Date.now() - startRef.current) / 1000)
            setDone(true)
            setCelebrating(true)
            const score = Math.max(10, 100 - errors * 5)
            completeTimerRef.current = setTimeout(() => {
              onComplete({
                exerciseType: 'memory-cards',
                exerciseLabelAr: 'مطابقة البطاقات',
                score,
                accuracy: Math.round((pairCount / (pairCount + errors)) * 100),
                duration: dur,
                errors,
                metadata: { pairsFound: pairCount, totalCards: pairCount * 2 },
                completedAt: new Date().toISOString(),
              })
            }, 1800)
          }
        }, 350)
      } else {
        setErrors(e => e + 1)
        mismatchTimerRef.current = setTimeout(() => {
          setCards(c => c.map(card => card.id === a || card.id === b ? { ...card, flipped: false } : card))
          setFlipped([])
          setLocked(false)
        }, 1100)
      }
    } else {
      setFlipped(newFlipped)
    }
  }, [previewing, locked, cards, flipped, matches, pairCount, errors, onComplete])

  const cols = pairCount <= 6 ? 3 : pairCount <= 8 ? 4 : 5
  const fmt  = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (celebrating) {
    const score = Math.max(10, 100 - errors * 5)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center" dir="rtl">
        <div className="text-8xl animate-bounce">{score >= 90 ? '🏆' : score >= 70 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-3xl">أحسنت!</h2>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <div className="bg-green-900/40 border border-green-500/40 rounded-2xl p-4">
            <div className="text-2xl font-black text-green-400">{pairCount}</div>
            <div className="text-xs text-white/50 mt-1">أزواج</div>
          </div>
          <div className="bg-blue-900/40 border border-blue-500/40 rounded-2xl p-4">
            <div className="text-xl font-black text-blue-400">{fmt(elapsed)}</div>
            <div className="text-xs text-white/50 mt-1">الوقت</div>
          </div>
          <div className="bg-red-900/40 border border-red-500/40 rounded-2xl p-4">
            <div className="text-2xl font-black text-red-400">{errors}</div>
            <div className="text-xs text-white/50 mt-1">أخطاء</div>
          </div>
        </div>
        <div className="text-5xl font-black text-brand-400">{score}%</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none" dir="rtl">
      <style>{`
        .mc-inner{transition:transform .45s cubic-bezier(.4,2,.6,1);transform-style:preserve-3d;position:relative;width:100%;height:100%}
        .mc-inner.mc-flipped{transform:rotateY(180deg)}
        .mc-front,.mc-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:14px;display:flex;align-items:center;justify-content:center}
        .mc-back{transform:rotateY(180deg)}
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
          <div className="text-base font-black text-blue-400 font-mono">{fmt(elapsed)}</div>
          <div className="text-[10px] text-white/40">الوقت</div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-black text-white">مطابقة البطاقات</h2>
          {previewing && (
            <>
              <span className="block text-xs font-bold text-amber-400 mt-0.5">احفظ الأماكن! 👀</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[{ m: 1.6, l: '🐢 أبطأ' }, { m: 1, l: '⏱ عادي' }, { m: 0.6, l: '🐇 أسرع' }].map(opt => (
                  <button
                    key={opt.m}
                    onClick={() => setPreviewSpeed(opt.m)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                      speedMult === opt.m ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-lg font-black text-green-400">{matches}</div>
            <div className="text-[10px] text-white/40">أزواج</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-red-400">{errors}</div>
            <div className="text-[10px] text-white/40">خطأ</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg bg-white/10 rounded-full h-1.5">
        <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${(matches / pairCount) * 100}%` }} />
      </div>

      {/* Card grid */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, maxWidth: 440 }}>
        {cards.map(card => (
          <div key={card.id}
            onClick={() => handleFlip(card.id)}
            style={{ width: 76, height: 76, perspective: '600px', cursor: previewing || card.matched || card.flipped ? 'default' : 'pointer' }}
          >
            <div className={`mc-inner ${card.flipped || card.matched ? 'mc-flipped' : ''}`}>
              {/* Front */}
              <div className="mc-front bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-colors">
                <span className="text-3xl">❓</span>
              </div>
              {/* Back */}
              <div
                className={`mc-back border-2 text-4xl ${card.matched ? 'bg-green-500/30 border-green-400' : 'bg-brand-700 border-brand-400'}`}
                style={card.matched ? { boxShadow: '0 0 22px rgba(74,222,128,0.45)' } : {}}
              >
                {card.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-1">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
