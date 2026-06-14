'use client'
import { useState } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const MOODS = [
  { level: 1, emoji: '😡', label: 'غاضب جداً',   color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  { level: 2, emoji: '😤', label: 'متوتر',        color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  { level: 3, emoji: '😟', label: 'قلق',          color: '#EAB308', bg: 'rgba(234,179,8,0.15)'  },
  { level: 4, emoji: '😐', label: 'عادي',         color: '#94A3B8', bg: 'rgba(148,163,184,0.15)'},
  { level: 5, emoji: '🙂', label: 'بخير',         color: '#22C55E', bg: 'rgba(34,197,94,0.15)'  },
  { level: 6, emoji: '😊', label: 'سعيد',         color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  { level: 7, emoji: '😁', label: 'سعيد جداً',   color: '#7C5CFC', bg: 'rgba(124,92,252,0.15)' },
]

const PROMPTS = [
  'كيف تشعر الآن؟',
  'كيف كان شعورك قبل الجلسة؟',
  'كيف تشعر بعد التمرين؟',
  'كيف تشعر عند البدء بالواجب؟',
]

export default function MoodMeter({ onComplete, onCancel, difficulty = 1 }: Props) {
  const rounds  = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<number | null>(null)
  const [results, setResults] = useState<number[]>([])
  const [startMs]             = useState(Date.now())

  function handlePick(level: number) {
    if (chosen !== null) return
    setChosen(level)
    setTimeout(() => {
      const newResults = [...results, level]
      if (idx + 1 >= rounds) {
        const avg   = newResults.reduce((a, b) => a + b, 0) / newResults.length
        const score = Math.round((avg / 7) * 100)
        onComplete({
          exerciseType:    'mood-meter',
          exerciseLabelAr: 'مقياس المزاج',
          score, accuracy: score,
          duration: Math.round((Date.now() - startMs) / 1000),
          errors: 0,
          metadata: { ratings: newResults, avgLevel: avg.toFixed(1) },
          completedAt: new Date().toISOString(),
        })
      } else {
        setResults(newResults)
        setIdx(i => i + 1)
        setChosen(null)
      }
    }, 1500)
  }

  const mood = chosen !== null ? MOODS.find(m => m.level === chosen) : null

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{idx + 1}/{rounds}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">مقياس المزاج</h2>
        <div className="w-12" />
      </div>

      <div className="text-lg text-white/80 font-bold text-center">
        {PROMPTS[idx % PROMPTS.length]}
      </div>

      {/* Mood grid */}
      <div className="flex gap-2 flex-wrap justify-center">
        {MOODS.map(m => (
          <button key={m.level} onClick={() => handlePick(m.level)}
            disabled={chosen !== null}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all active:scale-90
              disabled:cursor-not-allowed"
            style={{
              background: chosen === m.level ? m.bg : 'rgba(255,255,255,0.05)',
              borderColor: chosen === m.level ? m.color : 'rgba(255,255,255,0.1)',
              transform: chosen === m.level ? 'scale(1.15)' : 'scale(1)',
            }}>
            <span className="text-4xl">{m.emoji}</span>
            <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.label}</span>
          </button>
        ))}
      </div>

      {mood && (
        <div className="text-lg font-black" style={{ color: mood.color }}>
          اخترت: {mood.emoji} {mood.label}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
