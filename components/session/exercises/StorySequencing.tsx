'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Story {
  title: string
  steps: string[]
}

const ALL_STORIES: Story[] = [
  { title: 'دورة الحياة',    steps: ['🥚 بيضة', '🐣 كتكوت', '🐔 دجاجة'] },
  { title: 'نمو النبات',     steps: ['🌱 بذرة', '🌿 نبتة', '🌳 شجرة', '🍎 ثمرة'] },
  { title: 'يوم دراسي',     steps: ['🌅 صباح', '🏫 مدرسة', '📚 درس', '🏠 عودة'] },
  { title: 'دورة الماء',    steps: ['💧 ماء', '☁️ سحاب', '🌧️ مطر', '🌊 نهر'] },
  { title: 'صنع كعكة',      steps: ['🥣 خلط', '🔥 طهي', '🎂 كعكة', '😋 أكل'] },
  { title: 'فصول السنة',    steps: ['🌸 ربيع', '☀️ صيف', '🍂 خريف', '❄️ شتاء'] },
  { title: 'تنظيف الأسنان', steps: ['🪥 فرشاة', '🧴 معجون', '🦷 تنظيف', '😁 ابتسامة'] },
  { title: 'رحلة المطر',    steps: ['☁️ سحاب', '⚡ رعد', '🌧️ مطر', '🌈 قوس قزح'] },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQueue(difficulty: 1|2|3): Story[] {
  if (difficulty === 1) {
    const shortSteps = ALL_STORIES.filter(s => s.steps.length <= 4)
    return shuffle(shortSteps).slice(0, 6)
  } else if (difficulty === 2) {
    const fourStep = ALL_STORIES.filter(s => s.steps.length === 4)
    return shuffle(fourStep).slice(0, 6)
  } else {
    return shuffle(ALL_STORIES).slice(0, 8)
  }
}

type SlotItem = string | null

export default function StorySequencing({ onComplete, onCancel, difficulty = 1 }: Props) {
  const [queue] = useState<Story[]>(() => buildQueue(difficulty))
  const [storyIdx, setStoryIdx] = useState(0)
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [cards, setCards] = useState<{ text: string; placed: boolean }[]>([])
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [storyResult, setStoryResult] = useState<'correct' | 'wrong' | null>(null)
  const [storyScores, setStoryScores] = useState<number[]>([])
  const [totalErrors, setTotalErrors] = useState(0)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  useEffect(() => () => clearTimer(), [])

  const initStory = useCallback((idx: number) => {
    const story = queue[idx]
    if (!story) return
    setSlots(Array(story.steps.length).fill(null))
    setCards(shuffle(story.steps).map(t => ({ text: t, placed: false })))
    setSelectedCard(null)
    setSelectedSlot(null)
    setChecking(false)
    setStoryResult(null)
  }, [queue])

  useEffect(() => { initStory(0) }, [initStory])

  const story = queue[storyIdx]
  const allFilled = slots.length > 0 && slots.every(s => s !== null)

  function handleCardTap(cardIdx: number) {
    if (checking) return
    const card = cards[cardIdx]
    if (card.placed) {
      // Return card from slot
      const slotIdx = slots.indexOf(card.text)
      if (slotIdx !== -1) {
        setSlots(prev => { const n = [...prev]; n[slotIdx] = null; return n })
        setCards(prev => prev.map((c, i) => i === cardIdx ? { ...c, placed: false } : c))
      }
      return
    }
    if (selectedCard === cardIdx) {
      setSelectedCard(null)
      return
    }
    setSelectedCard(cardIdx)
    setSelectedSlot(null)
  }

  function handleSlotTap(slotIdx: number) {
    if (checking) return
    const current = slots[slotIdx]

    if (current !== null) {
      // Slot occupied — deselect its card (return it)
      const cardIdx = cards.findIndex(c => c.text === current)
      setSlots(prev => { const n = [...prev]; n[slotIdx] = null; return n })
      if (cardIdx !== -1) setCards(prev => prev.map((c, i) => i === cardIdx ? { ...c, placed: false } : c))
      setSelectedCard(null)
      setSelectedSlot(null)
      return
    }

    if (selectedCard === null) {
      setSelectedSlot(slotIdx)
      return
    }

    // Place selected card into slot
    const card = cards[selectedCard]
    setSlots(prev => { const n = [...prev]; n[slotIdx] = card.text; return n })
    setCards(prev => prev.map((c, i) => i === selectedCard ? { ...c, placed: true } : c))
    setSelectedCard(null)
    setSelectedSlot(null)
  }

  function handleCheck() {
    if (!allFilled || checking) return
    setChecking(true)
    const correctPositions = slots.filter((s, i) => s === story.steps[i]).length
    const total = story.steps.length
    const storyScore = Math.round((correctPositions / total) * 100)
    const isCorrect = correctPositions === total

    setStoryResult(isCorrect ? 'correct' : 'wrong')
    const newScores = [...storyScores, storyScore]
    setStoryScores(newScores)
    const errors = isCorrect ? 0 : total - correctPositions
    const newErrors = totalErrors + errors
    setTotalErrors(newErrors)

    timerRef.current = setTimeout(() => {
      if (storyIdx + 1 >= queue.length) {
        const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
        onComplete({
          exerciseType: 'story-sequencing',
          exerciseLabelAr: 'ترتيب القصة',
          score: avg,
          accuracy: avg,
          duration: Math.round((Date.now() - startRef.current) / 1000),
          errors: newErrors,
          metadata: { storyScores: newScores, storiesTotal: queue.length, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        const next = storyIdx + 1
        setStoryIdx(next)
        initStory(next)
      }
    }, isCorrect ? 1500 : 2200)
  }

  if (!story || slots.length === 0) return null

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-black text-sm">{story.title}</span>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs">{storyIdx + 1} / {queue.length}</span>
            <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">✕</button>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(storyIdx / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 gap-4 overflow-hidden">
        {/* Result overlay */}
        {storyResult && (
          <div
            className={`rounded-2xl p-4 text-center font-black text-lg ${
              storyResult === 'correct'
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
            }`}
          >
            {storyResult === 'correct' ? '✅ ترتيب صحيح! أحسنت!' : '📖 الترتيب الصحيح:'}
            {storyResult === 'wrong' && (
              <div className="flex gap-2 justify-center mt-2 flex-wrap">
                {story.steps.map((step, i) => (
                  <div key={i} className="bg-white/10 rounded-xl px-3 py-1 text-sm text-white/80 font-bold">
                    {i + 1}. {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slots area */}
        {!storyResult && (
          <div>
            <p className="text-white/40 text-xs mb-2 text-center">رتّب الخطوات هنا</p>
            <div className={`grid gap-2 ${story.steps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => handleSlotTap(i)}
                  className={[
                    'flex flex-col items-center justify-center rounded-2xl border-2 min-h-[90px] transition-all duration-200',
                    slot !== null
                      ? 'border-brand-400/50 bg-brand-600/20'
                      : selectedSlot === i
                      ? 'border-yellow-400/70 bg-yellow-500/10'
                      : 'border-dashed border-white/20 bg-white/5 hover:border-white/40',
                  ].join(' ')}
                >
                  <span className="text-white/30 text-xs font-black mb-1">{i + 1}</span>
                  {slot ? (
                    <span className="text-2xl text-center leading-tight px-1">{slot}</span>
                  ) : (
                    <span className="text-white/20 text-2xl">+</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards area */}
        {!storyResult && (
          <div className="flex-1">
            <p className="text-white/40 text-xs mb-2 text-center">اختر بطاقة ثم ضعها في المكان المناسب</p>
            <div className={`grid gap-2 ${story.steps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => handleCardTap(i)}
                  disabled={checking}
                  className={[
                    'flex flex-col items-center justify-center rounded-2xl border-2 min-h-[90px] transition-all duration-200 active:scale-95',
                    card.placed
                      ? 'opacity-30 border-white/10 bg-white/5 cursor-default'
                      : selectedCard === i
                      ? 'border-yellow-400 bg-yellow-500/20 scale-105 shadow-lg shadow-yellow-500/20'
                      : 'border-white/20 bg-white/8 hover:bg-white/15 hover:border-white/40 bg-white/5',
                  ].join(' ')}
                >
                  <span className="text-2xl text-center leading-tight px-1">{card.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Check button */}
        {allFilled && !storyResult && !checking && (
          <button
            onClick={handleCheck}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl transition-colors text-lg"
          >
            تحقق ✓
          </button>
        )}
      </div>
    </div>
  )
}
