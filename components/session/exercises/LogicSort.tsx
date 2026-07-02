'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Q {
  prompt:  string
  items:   { emoji: string; label: string; value: number }[]
  order:   'asc' | 'desc'
  orderAr: string
}

const ALL: Q[] = [
  {
    prompt:'رتّب من الأصغر للأكبر',
    orderAr:'الأصغر ← الأكبر',
    order:'asc',
    items:[{emoji:'🐭',label:'فأر',value:1},{emoji:'🐱',label:'قطة',value:2},{emoji:'🐶',label:'كلب',value:3},{emoji:'🦁',label:'أسد',value:4}],
  },
  {
    prompt:'رتّب من الأبطأ للأسرع',
    orderAr:'الأبطأ ← الأسرع',
    order:'asc',
    items:[{emoji:'🐢',label:'سلحفاة',value:1},{emoji:'🚶',label:'إنسان',value:2},{emoji:'🚗',label:'سيارة',value:3},{emoji:'✈️',label:'طائرة',value:4}],
  },
  {
    prompt:'رتّب من الأخف للأثقل',
    orderAr:'الأخف ← الأثقل',
    order:'asc',
    items:[{emoji:'🪶',label:'ريشة',value:1},{emoji:'🍎',label:'تفاحة',value:2},{emoji:'📚',label:'كتب',value:3},{emoji:'🪨',label:'صخرة',value:4}],
  },
  {
    prompt:'رتّب من الأكبر للأصغر',
    orderAr:'الأكبر ← الأصغر',
    order:'desc',
    items:[{emoji:'🌊',label:'محيط',value:4},{emoji:'🏊',label:'مسبح',value:3},{emoji:'🛁',label:'حوض',value:2},{emoji:'🥤',label:'كوب',value:1}],
  },
  {
    prompt:'رتّب الأرقام تصاعدياً',
    orderAr:'الأقل ← الأكثر',
    order:'asc',
    items:[{emoji:'3️⃣',label:'3',value:3},{emoji:'1️⃣',label:'1',value:1},{emoji:'4️⃣',label:'4',value:4},{emoji:'2️⃣',label:'2',value:2}],
  },
  {
    prompt:'رتّب من الأقدم للأحدث',
    orderAr:'الأقدم ← الأحدث',
    order:'asc',
    items:[{emoji:'🥚',label:'بيضة',value:1},{emoji:'🐣',label:'كتكوت',value:2},{emoji:'🐥',label:'فرخ',value:3},{emoji:'🐔',label:'دجاجة',value:4}],
  },
  {
    prompt:'رتّب من الأقصر للأطول',
    orderAr:'الأقصر ← الأطول',
    order:'asc',
    items:[{emoji:'🐛',label:'دودة',value:1},{emoji:'🐍',label:'ثعبان',value:2},{emoji:'🪜',label:'سلم',value:3},{emoji:'🚂',label:'قطار',value:4}],
  },
  {
    prompt:'رتّب من الأبرد للأسخن',
    orderAr:'الأبرد ← الأسخن',
    order:'asc',
    items:[{emoji:'🧊',label:'ثلج',value:1},{emoji:'💧',label:'ماء',value:2},{emoji:'☕',label:'شاي',value:3},{emoji:'🔥',label:'نار',value:4}],
  },
  {
    prompt:'رتّب من الأهدأ للأعلى صوتاً',
    orderAr:'الأهدأ ← الأعلى',
    order:'asc',
    items:[{emoji:'🤫',label:'صمت',value:1},{emoji:'🗣️',label:'حديث',value:2},{emoji:'📢',label:'مكبر صوت',value:3},{emoji:'🚀',label:'صاروخ',value:4}],
  },
  {
    prompt:'رتّب من الأقرب للأبعد',
    orderAr:'الأقرب ← الأبعد',
    order:'asc',
    items:[{emoji:'🏠',label:'بيت',value:1},{emoji:'🏞️',label:'حديقة',value:2},{emoji:'🏙️',label:'مدينة',value:3},{emoji:'🌕',label:'قمر',value:4}],
  },
  {
    prompt:'رتّب من الأقل سعراً للأعلى',
    orderAr:'الأقل ← الأعلى',
    order:'asc',
    items:[{emoji:'🍬',label:'حلوى',value:1},{emoji:'📕',label:'كتاب',value:2},{emoji:'📱',label:'هاتف',value:3},{emoji:'🚗',label:'سيارة',value:4}],
  },
  {
    prompt:'رتّب من الأصغر عمراً للأكبر',
    orderAr:'الأصغر ← الأكبر',
    order:'asc',
    items:[{emoji:'👶',label:'رضيع',value:1},{emoji:'🧒',label:'طفل',value:2},{emoji:'🧑',label:'شاب',value:3},{emoji:'👴',label:'كبير السن',value:4}],
  },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function LogicSort({ onComplete, onCancel, difficulty = 1 }: Props) {
  const count = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 9
  const [qs]  = useState<Q[]>(() => shuffle(ALL).slice(0, count))

  const [idx,    setIdx]    = useState(0)
  const [slots,  setSlots]  = useState<number[]>([])   // values in placed order
  const [hand,   setHand]   = useState<number[]>([])   // value indices remaining
  const [result, setResult] = useState<'correct'|'wrong'|null>(null)
  const [correct,setCorrect]= useState(0)
  const [errors, setErrors] = useState(0)
  const [startMs]           = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = qs[idx]
  const shuffled = useMemo(() => shuffle(q.items.map(i => i.value)), [idx]) // eslint-disable-line react-hooks/exhaustive-deps
  const [handItems, setHandItems] = useState<number[]>(() => shuffled)

  function handlePlace(v: number) {
    if (result) return
    const newSlots = [...slots, v]
    const newHand  = handItems.filter(x => x !== v)
    setSlots(newSlots)
    setHandItems(newHand)

    if (newHand.length === 0) {
      const sortedCorrect = q.order === 'asc'
        ? [...q.items].sort((a,b) => a.value - b.value).map(i => i.value)
        : [...q.items].sort((a,b) => b.value - a.value).map(i => i.value)
      const isCorrect = newSlots.every((v, i) => v === sortedCorrect[i])
      const nc = correct + (isCorrect ? 1 : 0)
      const ne = errors  + (isCorrect ? 0 : 1)
      setResult(isCorrect ? 'correct' : 'wrong')
      if (isCorrect) setCorrect(nc)
      else           setErrors(ne)

      timerRef.current = setTimeout(() => {
        const next = idx + 1
        if (next >= count) {
          onComplete({
            exerciseType:    'logic-sort',
            exerciseLabelAr: 'الترتيب المنطقي',
            score:    Math.round((nc / count) * 100),
            accuracy: Math.round((nc / count) * 100),
            duration: Math.round((Date.now() - startMs) / 1000),
            errors:   ne,
            metadata: { total: count, correct: nc },
            completedAt: new Date().toISOString(),
          })
        } else {
          setIdx(next)
          setSlots([])
          setResult(null)
          const ns = shuffle(qs[next].items.map(i => i.value))
          setHandItems(ns)
        }
      }, 1500)
    }
  }

  const getItem = (v: number) => q.items.find(i => i.value === v)!

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">الترتيب المنطقي</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="text-white font-black text-lg text-center">{q.prompt}</div>
      <div className="text-white/50 text-sm">{q.orderAr}</div>

      {/* Slots */}
      <div className="flex gap-3">
        {q.items.map((_, i) => {
          const v    = slots[i]
          const item = v !== undefined ? getItem(v) : null
          const sortedCorrect = q.order === 'asc'
            ? [...q.items].sort((a,b) => a.value - b.value)
            : [...q.items].sort((a,b) => b.value - a.value)
          const isCorrectSlot = result && item && item.value === sortedCorrect[i].value
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                item
                  ? result === 'correct' ? 'bg-green-500/25 border-green-400'
                  : result === 'wrong' && !isCorrectSlot ? 'bg-red-500/20 border-red-400/50'
                  : 'bg-brand-500/20 border-brand-400'
                  : 'bg-white/5 border-dashed border-white/20'
              }`}>
                {item ? (
                  <>
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[9px] text-white/70 font-bold">{item.label}</span>
                  </>
                ) : (
                  <span className="text-white/20 font-black text-lg">{i + 1}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hand */}
      <div className="flex gap-3 flex-wrap justify-center min-h-[76px]">
        {handItems.map(v => {
          const item = getItem(v)
          return (
            <button key={v} onClick={() => handlePlace(v)} disabled={!!result}
              className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2
                bg-white/10 border-white/20 hover:bg-white/20 active:scale-90 transition-all
                disabled:cursor-not-allowed">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[9px] text-white/70 font-bold">{item.label}</span>
            </button>
          )
        })}
      </div>

      {result && (
        <div className={`text-lg font-black ${result === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
          {result === 'correct' ? '✅ ترتيب ممتاز!' : '❌ الترتيب الصحيح من اليمين للشمال'}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
