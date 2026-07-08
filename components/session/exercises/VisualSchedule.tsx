'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng, pickWithRng, type Rng } from '@/lib/seeded-random'

const SCHEDULES = [
  {
    name: 'روتين الصباح',
    items: [
      { emoji: '⏰', label: 'الاستيقاظ' },
      { emoji: '🚿', label: 'الاستحمام' },
      { emoji: '🦷', label: 'غسيل الأسنان' },
      { emoji: '👕', label: 'ارتداء الملابس' },
      { emoji: '🥣', label: 'الفطور' },
      { emoji: '🎒', label: 'حقيبة المدرسة' },
    ],
  },
  {
    name: 'يوم المدرسة',
    items: [
      { emoji: '🚌', label: 'ركوب الحافلة' },
      { emoji: '📚', label: 'وقت الدراسة' },
      { emoji: '🍱', label: 'وقت الغداء' },
      { emoji: '⚽', label: 'وقت اللعب' },
      { emoji: '🏠', label: 'العودة للبيت' },
      { emoji: '📝', label: 'الواجب' },
    ],
  },
  {
    name: 'روتين الليل',
    items: [
      { emoji: '🍽️', label: 'وقت العشاء' },
      { emoji: '📺', label: 'وقت التلفاز' },
      { emoji: '🛁', label: 'الاستحمام' },
      { emoji: '🦷', label: 'تنظيف الأسنان' },
      { emoji: '📖', label: 'قصة قبل النوم' },
      { emoji: '😴', label: 'وقت النوم' },
    ],
  },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

function shuffle<T>(rng: Rng, arr: T[]): T[] {
  return shuffleWithRng(rng, arr)
}

export default function VisualSchedule({ onComplete, onCancel, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const itemCount = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (timerRef2.current) clearTimeout(timerRef2.current)
  }, [])

  const [scheduleData] = useState(() => {
    const s = pickWithRng(rng, SCHEDULES)
    const items = s.items.slice(0, itemCount)
    return { name: s.name, items, shuffled: shuffle(rng, items) }
  })
  const [placed, setPlaced]     = useState<typeof scheduleData.items[0][]>([])
  const [errors, setErrors]     = useState(0)
  const [flash, setFlash]       = useState<'ok'|'err'|null>(null)

  function handleTap(item: typeof scheduleData.items[0]) {
    if (placed.some(p => p.emoji === item.emoji)) return
    const expected = scheduleData.items[placed.length]
    if (item.emoji === expected.emoji) {
      const newPlaced = [...placed, item]
      setFlash('ok')
      setPlaced(newPlaced)
      timerRef.current = setTimeout(() => setFlash(null), 500)
      if (newPlaced.length === scheduleData.items.length) {
        const score = Math.max(0, Math.round(100 - (errors / scheduleData.items.length) * 40))
        timerRef2.current = setTimeout(() => onComplete({
          exerciseType: 'visual-schedule',
          exerciseLabelAr: 'جدولي اليومي',
          score, accuracy: score,
          duration: Math.round((Date.now() - startRef.current) / 1000),
          errors,
          metadata: { scheduleName: scheduleData.name, itemCount, difficulty },
          completedAt: new Date().toISOString(),
        }), 900)
      }
    } else {
      setErrors(e => e + 1)
      setFlash('err')
      timerRef.current = setTimeout(() => setFlash(null), 500)
    }
  }

  const { items, shuffled, name } = scheduleData
  const nextIdx = placed.length

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <h2 className="font-black text-white text-base">🗓️ {name}</h2>
        <div className="text-white/50 text-xs font-bold">{placed.length}/{items.length} ✓</div>
      </div>
      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${(placed.length / items.length) * 100}%` }} />
      </div>

      {/* Target sequence */}
      <div className="flex gap-2 w-full max-w-sm overflow-x-auto pb-1 justify-center">
        {items.map((item, i) => {
          const isPlaced = placed.some(p => p.emoji === item.emoji)
          const isNext   = i === nextIdx
          return (
            <div key={i} className={`flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${
              isPlaced ? 'bg-green-500/20 border-green-400' :
              isNext   ? 'bg-brand-600/30 border-brand-400 animate-pulse' :
                         'bg-white/5 border-white/10'
            }`}>
              {isPlaced ? item.emoji : isNext ? '❓' : ''}
            </div>
          )
        })}
      </div>

      {flash && (
        <div className={`font-black text-xl ${flash === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {flash === 'ok' ? '✓ ممتاز!' : '✗ حاول مرة أخرى'}
        </div>
      )}

      <p className="text-white/50 text-xs font-bold">اضغط على الخطوة التالية الصحيحة</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {shuffled.map((item, i) => {
          const isPlaced = placed.some(p => p.emoji === item.emoji)
          return (
            <button key={i} onClick={() => handleTap(item)} disabled={isPlaced}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                isPlaced ? 'bg-green-500/10 border-green-500/30 opacity-40' :
                           'bg-white/10 border-white/20 hover:bg-white/20'
              }`}>
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-white font-bold text-sm">{item.label}</span>
              {isPlaced && <span className="mr-auto text-green-400 font-black">✓</span>}
            </button>
          )
        })}
      </div>
      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors">← إنهاء التمرين</button>
    </div>
  )
}
