'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface Item {
  emoji: string
  label: string
  category: string
}

interface CategorySet {
  categories: { key: string; label: string; emoji: string }[]
  items: Item[]
}

const SETS: Record<1 | 2 | 3, CategorySet> = {
  1: {
    categories: [
      { key: 'ف', label: 'فواكه', emoji: '🍎' },
      { key: 'ح', label: 'حيوانات', emoji: '🐶' },
    ],
    items: [
      { emoji: '🍎', label: 'تفاحة', category: 'ف' },
      { emoji: '🍊', label: 'برتقال', category: 'ف' },
      { emoji: '🍌', label: 'موز', category: 'ف' },
      { emoji: '🐶', label: 'كلب', category: 'ح' },
      { emoji: '🐱', label: 'قطة', category: 'ح' },
      { emoji: '🐦', label: 'طائر', category: 'ح' },
      { emoji: '🍇', label: 'عنب', category: 'ف' },
      { emoji: '🐟', label: 'سمكة', category: 'ح' },
      { emoji: '🍓', label: 'فراولة', category: 'ف' },
      { emoji: '🍉', label: 'بطيخ', category: 'ف' },
      { emoji: '🐴', label: 'حصان', category: 'ح' },
      { emoji: '🐰', label: 'أرنب', category: 'ح' },
    ],
  },
  2: {
    categories: [
      { key: 'م', label: 'ملابس', emoji: '👕' },
      { key: 'ر', label: 'مركبات', emoji: '🚗' },
    ],
    items: [
      { emoji: '👕', label: 'قميص', category: 'م' },
      { emoji: '🚗', label: 'سيارة', category: 'ر' },
      { emoji: '👗', label: 'فستان', category: 'م' },
      { emoji: '✈️', label: 'طيارة', category: 'ر' },
      { emoji: '🧢', label: 'قبعة', category: 'م' },
      { emoji: '🚌', label: 'حافلة', category: 'ر' },
      { emoji: '👟', label: 'حذاء', category: 'م' },
      { emoji: '🛸', label: 'مركبة', category: 'ر' },
      { emoji: '🧥', label: 'جاكيت', category: 'م' },
      { emoji: '🧦', label: 'جورب', category: 'م' },
      { emoji: '🚲', label: 'دراجة', category: 'ر' },
      { emoji: '🚂', label: 'قطار', category: 'ر' },
    ],
  },
  3: {
    categories: [
      { key: 'ط', label: 'طعام', emoji: '🍕' },
      { key: 'ن', label: 'طبيعة', emoji: '🌿' },
      { key: 'أ', label: 'أدوات', emoji: '🔧' },
    ],
    items: [
      { emoji: '🍕', label: 'بيتزا', category: 'ط' },
      { emoji: '🌳', label: 'شجرة', category: 'ن' },
      { emoji: '🔧', label: 'مفتاح', category: 'أ' },
      { emoji: '🍎', label: 'تفاحة', category: 'ط' },
      { emoji: '🌻', label: 'زهرة', category: 'ن' },
      { emoji: '✂️', label: 'مقص', category: 'أ' },
      { emoji: '🍔', label: 'برغر', category: 'ط' },
      { emoji: '🌊', label: 'موجة', category: 'ن' },
      { emoji: '🔨', label: 'مطرقة', category: 'أ' },
      { emoji: '🍩', label: 'دونات', category: 'ط' },
      { emoji: '🍃', label: 'ورقة', category: 'ن' },
      { emoji: '🪛', label: 'مفك', category: 'أ' },
      { emoji: '🍦', label: 'آيس كريم', category: 'ط' },
      { emoji: '🌵', label: 'صبار', category: 'ن' },
      { emoji: '🪚', label: 'منشار', category: 'أ' },
    ],
  },
}

type Feedback = 'correct' | 'wrong' | null

export default function CategorySort({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const set = SETS[difficulty]
  const startRef = useRef(Date.now())
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [items] = useState<Item[]>(() => shuffleWithRng(rng, set.items))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    startRef.current = Date.now()
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
    }
  }, [])

  const handlePick = useCallback(
    (categoryKey: string) => {
      if (feedback !== null || done) return
      const item = items[currentIndex]
      const isCorrect = item.category === categoryKey

      if (isCorrect) {
        setFeedback('correct')
        setCorrect(c => c + 1)
      } else {
        setFeedback('wrong')
        setErrors(e => e + 1)
      }

      shakeTimerRef.current = setTimeout(() => {
        setFeedback(null)
        const next = currentIndex + 1
        if (next >= items.length) {
          setDone(true)
          const totalCorrect = isCorrect ? correct + 1 : correct
          const total = items.length
          const totalErrors = isCorrect ? errors : errors + 1
          const score = Math.round((totalCorrect / total) * 100)
          const duration = Math.round((Date.now() - startRef.current) / 1000)
          onComplete({
            exerciseType: 'category-sort',
            exerciseLabelAr: 'تصنيف الأشياء',
            score,
            accuracy: score,
            duration,
            errors: totalErrors,
            metadata: { correct: totalCorrect, total, difficulty },
            completedAt: new Date().toISOString(),
          })
        } else {
          setCurrentIndex(next)
        }
      }, 700)
    },
    [feedback, done, items, currentIndex, correct, errors, onComplete, difficulty]
  )

  if (done) return null

  const item = items[currentIndex]
  const total = items.length

  return (
    <div dir="rtl" className="flex flex-col items-center gap-8 p-6 select-none min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{currentIndex + 1}/{total}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">تصنيف الأشياء</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      {/* Current item */}
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-150
          ${feedback === 'correct' ? 'scale-110' : ''}
          ${feedback === 'wrong' ? 'animate-[shake_0.4s_ease-in-out]' : ''}
        `}
      >
        <div
          className={`w-36 h-36 rounded-3xl flex items-center justify-center text-7xl border-4 transition-colors duration-300
            ${feedback === 'correct' ? 'bg-green-500/30 border-green-400' : ''}
            ${feedback === 'wrong' ? 'bg-red-500/30 border-red-400' : ''}
            ${feedback === null ? 'bg-white/10 border-white/20' : ''}
          `}
        >
          {item.emoji}
        </div>
        <span className="text-2xl font-bold text-white">{item.label}</span>
        <span className="text-sm text-white/40">اختر الفئة الصحيحة</span>
      </div>

      {/* Category buttons */}
      <div className={`flex gap-4 flex-wrap justify-center ${set.categories.length === 3 ? 'max-w-sm' : 'max-w-xs'}`}>
        {set.categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => handlePick(cat.key)}
            disabled={feedback !== null}
            className={`flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2 font-bold text-lg
              transition-all duration-150 active:scale-95
              ${feedback !== null ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
              bg-white/10 border-white/20 hover:bg-brand-500/20 hover:border-brand-400 text-white
            `}
          >
            <span className="text-4xl">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Feedback label */}
      <div className="h-8 flex items-center justify-center">
        {feedback === 'correct' && (
          <span className="text-green-400 font-bold text-lg animate-pulse">أحسنت! ✓</span>
        )}
        {feedback === 'wrong' && (
          <span className="text-red-400 font-bold text-lg">حاول مرة أخرى ✗</span>
        )}
      </div>

      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mt-auto"
      >
        ← إنهاء التمرين
      </button>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
