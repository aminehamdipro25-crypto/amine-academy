'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, pickWithRng } from '@/lib/seeded-random'
import { readStorage, writeStorage } from '@/lib/safe-storage'

const EMOJI_SETS = [
  ['🦋','🌟','🐬','🌈','🎯','🍓','🦄','🎪','🌺','🏆','🎨','🎭'],
  ['🚀','🦊','🐙','🌙','⚡','🦁','🎸','🌊','🔮','🦅','💎','🌻'],
]

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean }
interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  /** Shared with the other party's screen over the `live` channel so both
   *  sides deal the exact same card layout — see lib/seeded-random.ts. */
  seed?: number
  /** Emits live per-answer progress to the specialist — see ExerciseProgressUpdate. */
  onProgress?: (p: ExerciseProgressUpdate) => void
}

export default function MemoryCards({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const pairCount  = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10
  const rng             = useRef(createRng(seed ?? Date.now())).current
  const emojiSet        = useRef(pickWithRng(rng, EMOJI_SETS)).current
  const startRef        = useRef(Date.now())
  const matchTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completeTimerRef= useRef<ReturnType<typeof setTimeout> | null>(null)
  const mismatchTimerRef= useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const saved = Number(readStorage('mc-preview-speed'))
    return saved === 0.6 || saved === 1 || saved === 1.6 ? saved : 1
  })

  useEffect(() => () => {
    clearTimeout(matchTimerRef.current ?? undefined)
    clearTimeout(completeTimerRef.current ?? undefined)
    clearTimeout(mismatchTimerRef.current ?? undefined)
  }, [])

  useEffect(() => {
    const emojis = emojiSet.slice(0, pairCount)
    const pairs  = shuffleWithRng(rng, [...emojis, ...emojis])
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
    writeStorage('mc-preview-speed', String(m))
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
          onProgress?.({ answered: nm, total: pairCount, correct: nm, errors, lastCorrect: true })
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
        const ne = errors + 1
        setErrors(ne)
        onProgress?.({ answered: matches, total: pairCount, correct: matches, errors: ne, lastCorrect: false })
        mismatchTimerRef.current = setTimeout(() => {
          setCards(c => c.map(card => card.id === a || card.id === b ? { ...card, flipped: false } : card))
          setFlipped([])
          setLocked(false)
        }, 1100)
      }
    } else {
      setFlipped(newFlipped)
    }
  }, [previewing, locked, cards, flipped, matches, pairCount, errors, onComplete, onProgress])

  const cols = pairCount <= 6 ? 3 : pairCount <= 8 ? 4 : 5
  const fmt  = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (celebrating) {
    const score = Math.max(10, 100 - errors * 5)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center" dir="rtl">
        <div className="text-8xl">{score >= 90 ? '🏆' : score >= 70 ? '⭐' : '💪'}</div>
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
        .mc-inner{transition:transform .5s cubic-bezier(0.16,1,0.3,1);transform-style:preserve-3d;position:relative;width:100%;height:100%}
        .mc-inner.mc-flipped{transform:rotateY(180deg)}
        .mc-front,.mc-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .mc-back{transform:rotateY(180deg)}
        .mc-cell{animation:mcIn .4s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes mcIn{from{opacity:0;transform:translateY(10px) scale(.85)}to{opacity:1;transform:none}}
        @keyframes mcMatch{0%{transform:scale(1)}45%{transform:scale(1.09)}100%{transform:scale(1)}}
        .mc-matched{animation:mcMatch .5s cubic-bezier(0.34,1.56,0.64,1)}
        /* Face-down card back: layered guilloché-style pattern, not a flat "?" */
        .mc-facedown{
          background:
            radial-gradient(circle at 28% 24%, rgba(255,255,255,0.18), transparent 42%),
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 7px, transparent 7px 14px),
            repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0 7px, transparent 7px 14px),
            linear-gradient(150deg, #6366F1 0%, #4F46E5 55%, #4338CA 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -3px 8px rgba(0,0,0,0.22);
          border:1px solid rgba(255,255,255,0.18);
        }
        .mc-revealed{
          background:linear-gradient(150deg,#FFFFFF 0%,#EEF2FF 100%);
          box-shadow:inset 0 1px 3px rgba(79,70,229,0.08), 0 2px 6px rgba(79,70,229,0.10);
          border:2px solid #C7D2FE;
        }
        .mc-done{
          background:linear-gradient(150deg,#ECFDF5 0%,#D1FAE5 100%);
          border:2px solid #34D399;
          box-shadow:0 0 0 3px rgba(52,211,153,0.28), 0 6px 20px rgba(16,185,129,0.28);
        }
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
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, maxWidth: 460 }}>
        {cards.map((card, i) => {
          const revealed = card.flipped || card.matched
          const tappable = !(previewing || card.matched || card.flipped)
          return (
            <div key={card.id}
              className="mc-cell"
              onClick={() => handleFlip(card.id)}
              style={{
                width: 80, height: 80, perspective: '700px',
                animationDelay: `${Math.min(i * 28, 340)}ms`,
                cursor: tappable ? 'pointer' : 'default',
              }}
            >
              <div className={`mc-inner ${revealed ? 'mc-flipped' : ''}`}>
                {/* Front — elegant patterned card back */}
                <div className="mc-front mc-facedown">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55 }}>
                    <path d="M12 2.5l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.3 20.8 8 14.2 2.8 9.8l6.8-.5z"
                          fill="rgba(255,255,255,0.9)" />
                  </svg>
                </div>
                {/* Back — polished tile showing the symbol */}
                <div
                  className={`mc-back ${card.matched ? 'mc-done' : 'mc-revealed'}`}
                  style={{ fontSize: 40, lineHeight: 1 }}
                >
                  <span className={card.matched ? 'mc-matched' : ''} style={{ display: 'inline-block', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.12))' }}>
                    {card.emoji}
                  </span>
                  {card.matched && (
                    <span style={{
                      position: 'absolute', top: 4, insetInlineEnd: 4,
                      width: 18, height: 18, borderRadius: 9,
                      background: '#10B981', color: '#fff',
                      fontSize: 11, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}>✓</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-1">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
