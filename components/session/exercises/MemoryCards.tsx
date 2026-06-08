'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const EMOJI_PAIRS = ['🦋','🌟','🐬','🌈','🎯','🍓','🦄','🎪','🌺','🏆','🎨','🎭']

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean }

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function MemoryCards({ onComplete, onCancel, studentAge: _studentAge, difficulty = 1 }: Props) {
  const pairCount = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10
  const startRef = useRef(Date.now())
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [errors, setErrors] = useState(0)
  const [matches, setMatches] = useState(0)
  const [locked, setLocked] = useState(false)
  const [phase, setPhase] = useState<'playing'|'done'>('playing')

  useEffect(() => {
    const emojis = EMOJI_PAIRS.slice(0, pairCount)
    const pairs = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    setCards(pairs)
    startRef.current = Date.now()
  }, [pairCount])

  const handleFlip = useCallback((id: number) => {
    if (locked || cards[id]?.flipped || cards[id]?.matched) return
    const newFlipped = [...flipped, id]
    setCards(c => c.map(card => card.id === id ? { ...card, flipped: true } : card))
    if (newFlipped.length === 2) {
      setLocked(true)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setCards(c => c.map(card =>
          card.id === a || card.id === b ? { ...card, matched: true } : card
        ))
        const newMatches = matches + 1
        setMatches(newMatches)
        setFlipped([])
        setLocked(false)
        if (newMatches === pairCount) {
          const dur = Math.round((Date.now() - startRef.current) / 1000)
          setPhase('done')
          const score = Math.max(0, 100 - errors * 5)
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
        }
      } else {
        setErrors(e => e + 1)
        setTimeout(() => {
          setCards(c => c.map(card =>
            card.id === a || card.id === b ? { ...card, flipped: false } : card
          ))
          setFlipped([])
          setLocked(false)
        }, 1200)
      }
    } else {
      setFlipped(newFlipped)
    }
  }, [locked, cards, flipped, matches, pairCount, errors, onComplete])

  const cols = pairCount <= 6 ? 4 : pairCount <= 8 ? 4 : 5

  if (phase === 'done') return null

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-lg">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{matches}/{pairCount}</div>
          <div className="text-xs text-white/50">أزواج</div>
        </div>
        <h2 className="text-xl font-black text-white">مطابقة البطاقات</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{errors}</div>
          <div className="text-xs text-white/50">أخطاء</div>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: 480 }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-300 font-bold
              ${card.matched
                ? 'bg-green-500/30 border-2 border-green-400 scale-95'
                : card.flipped
                  ? 'bg-brand-700 border-2 border-brand-400 scale-105'
                  : 'bg-white/10 border-2 border-white/20 hover:bg-white/20 cursor-pointer'
              }`}
            style={{ width: 80, height: 80 }}
          >
            {(card.flipped || card.matched) ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      <button onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mt-2">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
