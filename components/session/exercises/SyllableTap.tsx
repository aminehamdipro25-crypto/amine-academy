'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic, cancelSpeech } from '@/lib/speech'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface W { word: string; plain: string; emoji: string; syllables: number }

// Arabic words with their syllable count; 'plain' is diacritic-free for TTS
const ALL_WORDS: W[] = [
  // 1 syllable
  { word:'باب',  plain:'باب',  emoji:'🚪', syllables:1 },
  { word:'نار',  plain:'نار',  emoji:'🔥', syllables:1 },
  { word:'بحر',  plain:'بحر',  emoji:'🌊', syllables:1 },
  { word:'كلب',  plain:'كلب',  emoji:'🐶', syllables:1 },
  { word:'قط',   plain:'قط',   emoji:'🐱', syllables:1 },
  // 2 syllables
  { word:'قَلَم', plain:'قلم',  emoji:'✏️', syllables:2 },
  { word:'وَلَد', plain:'ولد',  emoji:'👦', syllables:2 },
  { word:'سَمَك', plain:'سمك',  emoji:'🐟', syllables:2 },
  { word:'كِتاب', plain:'كتاب', emoji:'📚', syllables:2 },
  { word:'شَجَر', plain:'شجر',  emoji:'🌲', syllables:2 },
  { word:'قَمَر', plain:'قمر',  emoji:'🌙', syllables:2 },
  { word:'زَهرة', plain:'زهرة', emoji:'🌹', syllables:2 },
  // 3 syllables
  { word:'شَجَرَة',  plain:'شجرة',  emoji:'🌳', syllables:3 },
  { word:'سَمَكَة',  plain:'سمكة',  emoji:'🐠', syllables:3 },
  { word:'تُفّاحة',  plain:'تفاحة', emoji:'🍎', syllables:3 },
  { word:'مَدرَسة',  plain:'مدرسة', emoji:'🏫', syllables:3 },
  { word:'سَيّارة',  plain:'سيارة', emoji:'🚗', syllables:3 },
  { word:'حَديقة',   plain:'حديقة', emoji:'🌿', syllables:3 },
  { word:'طَيّارة',  plain:'طيارة', emoji:'✈️', syllables:3 },
  // 4 syllables
  { word:'تِلِفزيون', plain:'تلفزيون', emoji:'📺', syllables:4 },
  { word:'مُستشفى',  plain:'مستشفى',  emoji:'🏥', syllables:4 },
]

function speak(text: string) {
  speakArabic(text, 0.65)
}

export default function SyllableTap({ onComplete, onCancel, difficulty = 1, studentAge, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const words: W[] = useMemo(() => {
    let pool: W[]
    if (difficulty === 1) pool = ALL_WORDS.filter(w => w.syllables <= 2)
    else if (difficulty === 2) pool = ALL_WORDS.filter(w => w.syllables <= 3)
    else pool = [...ALL_WORDS]
    // Under 7: cap at 2 syllables regardless
    if (studentAge < 7) pool = pool.filter(w => w.syllables <= 2)
    const count = difficulty === 1 ? 6 : difficulty === 2 ? 10 : 14
    return shuffleWithRng(rng, pool).slice(0, count)
  }, [difficulty, studentAge, rng])

  const count = words.length
  const [idx,     setIdx]     = useState(0)
  const [taps,    setTaps]    = useState(0)
  const [phase,   setPhase]   = useState<'tapping' | 'feedback'>('tapping')
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    cancelSpeech()
  }, [])

  useEffect(() => {
    setTaps(0)
    setPhase('tapping')
    // Use diacritized 'word' for TTS — guides correct pronunciation (e.g. قَلَم vs قلم)
    timerRef.current = setTimeout(() => speak(words[idx].word), 350)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [idx]) // eslint-disable-line

  function submitAnswer(tapCount: number) {
    if (phase !== 'tapping') return
    setPhase('feedback')
    const w = words[idx]
    const isCorrect = tapCount === w.syllables
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= count) {
        onComplete({
          exerciseType:    'syllable-tap',
          exerciseLabelAr: 'تقطيع المقاطع',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(i => i + 1)
      }
    }, 1800)
  }

  function handleTap() {
    if (phase !== 'tapping') return
    const newTaps = taps + 1
    setTaps(newTaps)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    // Auto-submit 1.5 s after last tap
    tapTimerRef.current = setTimeout(() => submitAnswer(newTaps), 1500)
  }

  const w = words[idx]
  const isCorrectAnswer = phase === 'feedback' && taps === w.syllables

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">كلمة</div>
        </div>
        <h2 className="text-xl font-black text-white">تقطيع المقاطع</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, ((idx + (phase === 'feedback' ? 1 : 0)) / count) * 100)}%`, background: '#7C5CFC' }} />
      </div>

      {/* Word card */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="text-8xl">{w.emoji}</div>
        <button
          onClick={() => speak(w.word)}
          className="text-4xl font-black text-white transition-all active:scale-95 px-8 py-3 rounded-3xl"
          style={{ background: 'rgba(124,92,252,0.2)', border: '3px solid rgba(124,92,252,0.6)' }}
        >
          {w.word}
        </button>
        <button onClick={() => speak(w.word)} className="text-white/40 text-xs hover:text-white/70 transition-colors">
          🔊 اسمع الكلمة مرة أخرى
        </button>
      </div>

      <p className="text-white/70 font-bold text-center text-sm">
        اضغط الزر مرة واحدة لكل مقطع
      </p>

      {/* Tap dots — show expected count as grey slots, filled with purple per tap */}
      <div className="flex gap-2 h-6 items-center">
        {Array.from({ length: Math.max(w.syllables, taps) }).map((_, i) => {
          const filled = i < taps
          const overflow = i >= w.syllables
          return (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-100"
              style={{
                background: filled
                  ? overflow ? '#EF4444' : '#7C5CFC'
                  : 'rgba(255,255,255,0.18)',
                border: filled ? 'none' : '2px solid rgba(255,255,255,0.3)',
                transform: filled ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          )
        })}
      </div>

      {/* Big tap button */}
      {phase === 'tapping' && (
        <button
          onClick={handleTap}
          className="w-36 h-36 rounded-full flex flex-col items-center justify-center text-4xl transition-all active:scale-90"
          style={{
            background: 'rgba(124,92,252,0.3)',
            border: '4px solid #7C5CFC',
            boxShadow: '0 8px 32px rgba(124,92,252,0.4)',
          }}
        >
          👋
          <span className="text-sm font-bold text-white/70 mt-1">{taps} مقطع</span>
        </button>
      )}

      {/* Feedback */}
      {phase === 'feedback' && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl font-black" style={{ color: isCorrectAnswer ? '#22c55e' : '#ef4444' }}>
            {isCorrectAnswer ? '✅ ممتاز!' : `❌ الصحيح: ${w.syllables} ${w.syllables === 1 ? 'مقطع' : 'مقاطع'}`}
          </div>
          <div className="text-white/60 text-sm">
            ضغطت {taps} {taps === 1 ? 'مرة' : 'مرات'} — الكلمة لها {w.syllables} {w.syllables === 1 ? 'مقطع' : 'مقاطع'}
          </div>
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
