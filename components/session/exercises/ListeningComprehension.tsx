'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

interface Question {
  sentence: string
  q: string
  choices: string[]
  ans: number
}

const ALL_QUESTIONS: Question[] = [
  { sentence: 'القطة تشرب الحليب في البيت', q: 'ماذا تشرب القطة؟', choices: ['🥛 حليب', '💧 ماء', '🍵 شاي'], ans: 0 },
  { sentence: 'الطفل يلعب بالكرة في الحديقة', q: 'أين يلعب الطفل؟', choices: ['🏠 بيت', '🌳 حديقة', '🏫 مدرسة'], ans: 1 },
  { sentence: 'الكلب يجري بسرعة كبيرة', q: 'كيف يجري الكلب؟', choices: ['🐢 ببطء', '🏃 بسرعة', '⏸ لا يجري'], ans: 1 },
  { sentence: 'الأم تطبخ الطعام في المطبخ', q: 'أين تطبخ الأم؟', choices: ['🛁 حمام', '🍳 مطبخ', '🛏 غرفة'], ans: 1 },
  { sentence: 'الطير الأزرق يطير عالياً في السماء', q: 'ما لون الطير؟', choices: ['🔴 أحمر', '🔵 أزرق', '🟢 أخضر'], ans: 1 },
  { sentence: 'أحمد يأكل التفاحة في الفصل', q: 'ماذا يأكل أحمد؟', choices: ['🍊 برتقالة', '🍌 موزة', '🍎 تفاحة'], ans: 2 },
  { sentence: 'الفيل الكبير يشرب الماء من النهر', q: 'من أين يشرب الفيل؟', choices: ['🌊 بحر', '🏞 نهر', '🚿 صنبور'], ans: 1 },
  { sentence: 'الطفلة سارة ترتدي فستاناً أصفر', q: 'ما لون فستان سارة؟', choices: ['🟡 أصفر', '🔴 أحمر', '💜 بنفسجي'], ans: 0 },
  { sentence: 'الباص يوصل الأطفال إلى المدرسة صباحاً', q: 'متى يوصل الباص الأطفال؟', choices: ['🌙 مساءً', '🌅 صباحاً', '🌤 ظهراً'], ans: 1 },
  { sentence: 'النجوم تظهر في السماء ليلاً', q: 'متى تظهر النجوم؟', choices: ['🌞 نهاراً', '🌙 ليلاً', '🌅 صباحاً'], ans: 1 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ar-SA'
      u.rate = 0.8
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    } catch {
      resolve()
    }
  })
}

type Phase = 'question' | 'feedback' | 'done'

export default function ListeningComprehension({
  onComplete,
  onCancel,
  studentAge: _studentAge,
  difficulty = 1,
}: Props) {
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const [ttsSupported, setTtsSupported] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Build question list based on difficulty
  useEffect(() => {
    if (difficulty === 3) {
      setQuestions(shuffle([...ALL_QUESTIONS]))
    } else if (difficulty === 1) {
      setQuestions(ALL_QUESTIONS.slice(0, 6))
    } else {
      setQuestions([...ALL_QUESTIONS])
    }
    setCurrentIdx(0)
    setPhase('question')
    setSelectedChoice(null)
    setCorrect(0)
    setErrors(0)
    startRef.current = Date.now()
  }, [difficulty])

  // Check TTS support
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setTtsSupported(false)
    }
  }, [])

  const currentQ = questions[currentIdx]
  const total = questions.length

  const handleSpeak = useCallback(async () => {
    if (!currentQ || playing) return
    setPlaying(true)
    try {
      await speakText(currentQ.sentence)
    } catch {
      setTtsSupported(false)
    }
    setPlaying(false)
  }, [currentQ, playing])

  function handleChoice(idx: number) {
    if (phase !== 'question' || selectedChoice !== null) return
    setSelectedChoice(idx)
    const isCorrect = idx === currentQ.ans
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else setErrors(ne)
    setPhase('feedback')

    timerRef.current = setTimeout(() => {
      const nextIdx = currentIdx + 1
      if (nextIdx >= total) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        const score = Math.round((nc / total) * 100)
        setPhase('done')
        onComplete({
          exerciseType: 'listening-comprehension',
          exerciseLabelAr: 'فهم الاستماع',
          score,
          accuracy: score,
          duration: dur,
          errors: ne,
          metadata: { correct: nc, total },
          completedAt: new Date().toISOString(),
        })
      } else {
        setCurrentIdx(nextIdx)
        setSelectedChoice(null)
        setPhase('question')
      }
    }, 1000)
  }

  if (phase === 'done' || !currentQ) return null

  const progressPct = Math.round((currentIdx / total) * 100)

  function getChoiceBg(idx: number): string {
    if (phase !== 'feedback' || selectedChoice === null) {
      return 'rgba(255,255,255,0.07)'
    }
    if (idx === currentQ.ans) return 'rgba(34,197,94,0.25)'
    if (idx === selectedChoice && idx !== currentQ.ans) return 'rgba(239,68,68,0.25)'
    return 'rgba(255,255,255,0.04)'
  }

  function getChoiceBorder(idx: number): string {
    if (phase !== 'feedback' || selectedChoice === null) {
      return 'rgba(255,255,255,0.15)'
    }
    if (idx === currentQ.ans) return '#22c55e'
    if (idx === selectedChoice && idx !== currentQ.ans) return '#ef4444'
    return 'rgba(255,255,255,0.08)'
  }

  function getOverlayIcon(idx: number): string | null {
    if (phase !== 'feedback' || selectedChoice === null) return null
    if (idx === currentQ.ans) return '✓'
    if (idx === selectedChoice && idx !== currentQ.ans) return '✗'
    return null
  }

  return (
    <div dir="rtl" className="flex flex-col gap-5 p-5 select-none max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">فهم الاستماع</h2>
        <span className="text-white/50 text-sm">{currentIdx + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, background: '#7C5CFC' }}
        />
      </div>

      {!ttsSupported && (
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-2 text-amber-300 text-sm text-center">
          ⚠️ التحدث الصوتي غير مدعوم في هذا المتصفح
        </div>
      )}

      {/* Sentence card */}
      <div className="bg-gray-900 rounded-3xl p-5 border border-white/10 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-white/50 text-xs mb-2">الجملة:</p>
          <p className="text-white text-base font-bold leading-relaxed">{currentQ.sentence}</p>
        </div>
        <button
          onClick={handleSpeak}
          disabled={playing}
          className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-200"
          style={{
            background: playing ? '#7C5CFC' : 'rgba(124,92,252,0.2)',
            borderColor: playing ? '#a78bfa' : 'rgba(124,92,252,0.4)',
          }}
          title="استمع"
        >
          {playing ? (
            <span className="text-white animate-pulse text-lg">🔊</span>
          ) : (
            <span className="text-purple-300 text-lg">🔊</span>
          )}
        </button>
      </div>

      {/* Listen button (large, first-tap) — always visible */}
      {phase === 'question' && selectedChoice === null && (
        <button
          onClick={handleSpeak}
          disabled={playing}
          className="w-full py-3 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: playing ? 'rgba(124,92,252,0.3)' : 'rgba(124,92,252,0.15)',
            border: '2px solid rgba(124,92,252,0.4)',
            color: '#c4b5fd',
          }}
        >
          <span>{playing ? 'جارٍ التشغيل…' : '🔊 اضغط للاستماع'}</span>
        </button>
      )}

      {/* Question */}
      <p className="text-white font-black text-xl text-center mt-1">{currentQ.q}</p>

      {/* Choices */}
      <div className="flex flex-col gap-3">
        {currentQ.choices.map((choice, idx) => {
          const overlay = getOverlayIcon(idx)
          return (
            <button
              key={idx}
              onClick={() => handleChoice(idx)}
              disabled={phase === 'feedback'}
              className="relative flex items-center gap-3 px-5 rounded-2xl font-bold text-lg text-white transition-all duration-200 border-2"
              style={{
                minHeight: 60,
                background: getChoiceBg(idx),
                borderColor: getChoiceBorder(idx),
                cursor: phase === 'feedback' ? 'default' : 'pointer',
              }}
            >
              <span className="flex-1 text-right">{choice}</span>
              {overlay && (
                <span
                  className="flex-shrink-0 text-xl font-black"
                  style={{ color: overlay === '✓' ? '#22c55e' : '#ef4444' }}
                >
                  {overlay}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Score tracker */}
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-400 font-bold">{correct} ✓</span>
          <span className="text-white/30">|</span>
          <span className="text-red-400 font-bold">{errors} ✗</span>
        </div>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إنهاء
        </button>
      </div>
    </div>
  )
}
