'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Dimension {
  key: string
  labelAr: string
  icon: string
  low: string
  high: string
  youngEmojis: [string, string, string, string, string]
}

const DIMENSIONS: Dimension[] = [
  {
    key: 'focus',
    labelAr: 'التركيز',
    icon: '🎯',
    low: 'مشتت جداً',
    high: 'مركز جداً',
    youngEmojis: ['😵', '😕', '😐', '🙂', '😄'],
  },
  {
    key: 'calm',
    labelAr: 'الهدوء',
    icon: '🌊',
    low: 'متوتر جداً',
    high: 'هادئ جداً',
    youngEmojis: ['😤', '😟', '😐', '😌', '😇'],
  },
  {
    key: 'energy',
    labelAr: 'الطاقة',
    icon: '⚡',
    low: 'تعبان جداً',
    high: 'نشيط جداً',
    youngEmojis: ['😴', '🥱', '😐', '😀', '🤩'],
  },
  {
    key: 'mood',
    labelAr: 'المزاج',
    icon: '❤️',
    low: 'سيء جداً',
    high: 'ممتاز',
    youngEmojis: ['😭', '😢', '😐', '😊', '😁'],
  },
  {
    key: 'control',
    labelAr: 'ضبط النفس',
    icon: '🛡️',
    low: 'صعب جداً',
    high: 'سهل جداً',
    youngEmojis: ['🤬', '😠', '😐', '😊', '🤝'],
  },
]

export default function SelfRating({ onComplete, onCancel, studentAge }: Props) {
  const isYoung = studentAge <= 10
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [phase, setPhase] = useState<'before' | 'after'>('before')
  const [beforeRatings, setBeforeRatings] = useState<Record<string, number>>({})
  const [mode, setMode] = useState<'before-only' | 'before-after'>('before-only')
  const [setup, setSetup] = useState(true)
  const startRef = useRef(Date.now())

  const allRated = DIMENSIONS.every(d => ratings[d.key] !== undefined)

  function startRating(m: 'before-only' | 'before-after') {
    setMode(m)
    setSetup(false)
    startRef.current = Date.now()
  }

  function rate(key: string, value: number) {
    setRatings(prev => ({ ...prev, [key]: value }))
  }

  function submitBefore() {
    setBeforeRatings(ratings)
    setRatings({})
    setPhase('after')
  }

  function submitFinal() {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const finalRatings = mode === 'before-only' ? ratings : ratings
    const avg = Math.round(
      Object.values(finalRatings).reduce((s, v) => s + v, 0) / DIMENSIONS.length * 20
    )
    const delta = mode === 'before-after'
      ? DIMENSIONS.reduce((acc, d) => {
          acc[d.key] = (finalRatings[d.key] || 0) - (beforeRatings[d.key] || 0)
          return acc
        }, {} as Record<string, number>)
      : undefined

    onComplete({
      exerciseType: 'self-rating',
      exerciseLabelAr: 'تقييم الذات',
      score: avg,
      accuracy: avg,
      duration: dur,
      errors: 0,
      metadata: {
        mode,
        before: mode === 'before-after' ? beforeRatings : undefined,
        after: mode === 'before-after' ? finalRatings : finalRatings,
        delta,
      },
      completedAt: new Date().toISOString(),
    })
  }

  if (setup) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 h-full overflow-y-auto" dir="rtl">
        <div className="text-6xl">🪞</div>
        <h2 className="text-white font-black text-2xl text-center">تقييم الذات</h2>
        <p className="text-white/60 text-sm text-center max-w-xs">
          الطالب يقيّم نفسه على 5 أبعاد — يمكن إجراؤه في البداية فقط أو مقارنة قبل/بعد الجلسة
        </p>
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => startRating('before-only')}
            className="w-full p-4 bg-white/10 hover:bg-brand-600/40 border border-white/20 hover:border-brand-400/50 rounded-2xl text-right transition-all"
          >
            <div className="font-black text-white">تقييم واحد</div>
            <div className="text-white/50 text-sm mt-1">الطالب يقيّم حالته الآن</div>
          </button>
          <button
            onClick={() => startRating('before-after')}
            className="w-full p-4 bg-white/10 hover:bg-brand-600/40 border border-white/20 hover:border-brand-400/50 rounded-2xl text-right transition-all"
          >
            <div className="font-black text-white">قبل وبعد الجلسة</div>
            <div className="text-white/50 text-sm mt-1">مقارنة حالته قبل وبعد لقياس التغير</div>
          </button>
        </div>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  const title = mode === 'before-after'
    ? (phase === 'before' ? 'كيف حالك الآن؟ (قبل الجلسة)' : 'كيف حالك الآن؟ (بعد الجلسة)')
    : 'كيف حالك الآن؟'

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-white font-black text-xl text-center">{title}</h2>
        {mode === 'before-after' && (
          <div className="flex justify-center gap-2 mt-2">
            <div className={`text-xs px-3 py-1 rounded-full ${phase === 'before' ? 'bg-brand-600 text-white' : 'bg-green-600 text-white'}`}>قبل</div>
            <div className={`text-xs px-3 py-1 rounded-full ${phase === 'after' ? 'bg-brand-600 text-white' : 'bg-white/10 text-white/40'}`}>بعد</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
        {DIMENSIONS.map(dim => (
          <div key={dim.key} className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{dim.icon}</span>
              <span className="text-white font-black">{dim.labelAr}</span>
            </div>
            {isYoung ? (
              <div className="flex justify-between gap-1">
                {dim.youngEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => rate(dim.key, i + 1)}
                    className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                      ratings[dim.key] === i + 1
                        ? 'bg-brand-600 ring-2 ring-brand-400 scale-110'
                        : 'bg-white/10 hover:bg-white/20 active:scale-95'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex justify-between gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => rate(dim.key, v)}
                      className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                        ratings[dim.key] === v
                          ? 'bg-brand-600 text-white ring-2 ring-brand-400 scale-105'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 active:scale-95'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-white/40 text-xs px-1">
                  <span>{dim.low}</span>
                  <span>{dim.high}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 py-3">
        {mode === 'before-after' && phase === 'before' ? (
          <button
            onClick={submitBefore}
            disabled={!allRated}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            حفظ تقييم ما قبل الجلسة ←
          </button>
        ) : (
          <button
            onClick={submitFinal}
            disabled={!allRated}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            إنهاء وحفظ النتائج
          </button>
        )}
      </div>
    </div>
  )
}
