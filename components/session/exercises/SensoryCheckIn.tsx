'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

// Sensory Check-In — a pre-session regulatory awareness tool for autism.
// The child taps how each sense/area feels right now. The specialist uses
// the result to calibrate the session intensity before starting exercises.
// Based on the Zones of Regulation + sensory processing frameworks.

const AREAS = [
  { emoji: '👂', label: 'الأصوات',   question: 'الأصوات حولي...',     hint: 'هل هناك أصوات تزعجني؟' },
  { emoji: '💡', label: 'الإضاءة',   question: 'الضوء الآن...',        hint: 'هل الضوء قوي على عيني؟' },
  { emoji: '👕', label: 'الملابس',   question: 'ملابسي تشعرني...',     hint: 'هل هناك شيء يضغط أو يؤلم؟' },
  { emoji: '🌀', label: 'جسمي',      question: 'جسمي الآن...',         hint: 'هل أريد أن أتحرك أو أهدأ؟' },
  { emoji: '👥', label: 'التحدث',    question: 'التحدث الآن...',        hint: 'هل أريد أن أتحدث مع أحد؟' },
  { emoji: '💓', label: 'مشاعري',   question: 'أشعر الآن...',          hint: 'كيف حال قلبي الآن؟' },
]

const STATES = [
  { emoji: '😊', label: 'مرتاح',  value: 2, color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.6)' },
  { emoji: '😐', label: 'عادي',   value: 1, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)' },
  { emoji: '😣', label: 'صعب',    value: 0, color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.5)' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function SensoryCheckIn({ onComplete, onCancel }: Props) {
  const startRef  = useRef(Date.now())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState<number[]>([]) // values 0/1/2
  const [chosen,  setChosen]  = useState<number | null>(null)
  const [done,    setDone]    = useState(false)

  const area = AREAS[step]

  function pick(value: number) {
    if (chosen !== null) return
    setChosen(value)
    timerRef.current = setTimeout(() => {
      const next = [...answers, value]
      setAnswers(next)
      if (step + 1 >= AREAS.length) {
        setDone(true)
      } else {
        setStep(s => s + 1)
        setChosen(null)
      }
    }, 600)
  }

  function finish() {
    const total   = AREAS.length * 2
    const earned  = answers.reduce((s, v) => s + v, 0)
    const score   = Math.round((earned / total) * 100)
    const profile = Object.fromEntries(AREAS.map((a, i) => [a.label, answers[i]]))
    const difficult = AREAS.filter((_, i) => answers[i] === 0).map(a => a.label)

    onComplete({
      exerciseType:    'sensory-checkin',
      exerciseLabelAr: 'فحص الحواس',
      score,
      accuracy: 100,
      duration: Math.round((Date.now() - startRef.current) / 1000),
      errors:   0,
      metadata: { profile, difficult, comfortable: AREAS.length - difficult.length },
      completedAt: new Date().toISOString(),
    })
  }

  // ── Summary screen
  if (done) {
    const difficult = AREAS.filter((_, i) => answers[i] === 0)
    const ok        = AREAS.filter((_, i) => answers[i] > 0)
    const allGood   = difficult.length === 0

    return (
      <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
        <h2 className="font-black text-white text-xl">نتيجة الفحص 📊</h2>

        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          {AREAS.map((a, i) => {
            const st = STATES.find(s => s.value === answers[i])!
            return (
              <div
                key={a.label}
                className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
                style={{ background: st.bg, border: `1.5px solid ${st.border}` }}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-xs text-white/70 font-bold">{a.label}</span>
                <span className="text-lg">{st.emoji}</span>
              </div>
            )
          })}
        </div>

        {difficult.length > 0 ? (
          <div
            className="w-full max-w-sm rounded-2xl p-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)' }}
          >
            <p className="text-white font-black text-sm mb-1">⚠️ يحتاج دعماً:</p>
            <p className="text-white/70 text-sm">{difficult.map(a => a.emoji + ' ' + a.label).join('  •  ')}</p>
            <p className="text-white/50 text-xs mt-2">ابدأ بنشاط تهدئة قبل التمارين</p>
          </div>
        ) : (
          <div
            className="w-full max-w-sm rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)' }}
          >
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-white font-black text-sm">جاهز للجلسة!</p>
              <p className="text-white/60 text-xs">الطفل في حالة جيدة — ابدأ التمارين</p>
            </div>
          </div>
        )}

        <button
          onClick={finish}
          className="w-full max-w-sm text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95"
          style={{
            background: allGood
              ? 'linear-gradient(135deg,#10B981,#34D399)'
              : 'linear-gradient(135deg,#F59E0B,#FBBF24)',
            boxShadow: allGood
              ? '0 6px 24px rgba(16,185,129,0.35)'
              : '0 6px 24px rgba(245,158,11,0.35)',
          }}
        >
          {allGood ? 'ابدأ الجلسة 🚀' : 'شكراً — سنبدأ بهدوء 🌿'}
        </button>

        <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors">← إنهاء</button>
      </div>
    )
  }

  // ── Question screen
  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none min-h-full" dir="rtl">

      {/* Progress dots */}
      <div className="flex gap-2">
        {AREAS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i < step ? 8 : i === step ? 20 : 8,
              height: 8,
              background: i < step ? '#10B981' : i === step ? '#818CF8' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Sense icon */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-6xl"
        style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.12)' }}
      >
        {area.emoji}
      </div>

      {/* Question */}
      <div className="text-center">
        <h2 className="font-black text-white text-2xl mb-1">{area.question}</h2>
        <p className="text-white/40 text-sm">{area.hint}</p>
      </div>

      {/* State buttons */}
      <div className="flex gap-4 w-full max-w-xs justify-center">
        {STATES.map(st => (
          <button
            key={st.value}
            onClick={() => pick(st.value)}
            disabled={chosen !== null}
            className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-4 transition-all active:scale-95"
            style={{
              background: chosen === st.value ? st.bg : 'rgba(255,255,255,0.05)',
              border: `2px solid ${chosen === st.value ? st.border : 'rgba(255,255,255,0.12)'}`,
              transform: chosen === st.value ? 'scale(1.08)' : 'scale(1)',
              boxShadow: chosen === st.value ? `0 0 20px ${st.color}40` : 'none',
            }}
          >
            <span className="text-4xl">{st.emoji}</span>
            <span className="text-xs text-white/70 font-bold">{st.label}</span>
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-auto">← إنهاء التمرين</button>
    </div>
  )
}
