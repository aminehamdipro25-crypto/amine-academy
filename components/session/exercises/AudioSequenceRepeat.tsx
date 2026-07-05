'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic, cancelSpeech } from '@/lib/speech'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

const ANIMALS = [
  { emoji: '🐶', name: 'كلب'  },
  { emoji: '🐱', name: 'قطة'  },
  { emoji: '🐄', name: 'بقرة' },
  { emoji: '🐑', name: 'خروف' },
  { emoji: '🐸', name: 'ضفدع' },
  { emoji: '🐥', name: 'كتكوت'},
  { emoji: '🦆', name: 'بطة'  },
  { emoji: '🐴', name: 'حصان' },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function AudioSequenceRepeat({ onComplete, onCancel, difficulty = 1 }: Props) {
  const SEQ_LEN = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const ROUNDS  = 4

  const [round,     setRound]     = useState(0)
  const [sequence,  setSequence]  = useState<number[]>([]) // indices into ANIMALS
  const [tapped,    setTapped]    = useState<number[]>([])
  const [phase,     setPhase]     = useState<'listening' | 'recall' | 'feedback'>('listening')
  const [feedback,  setFeedback]  = useState<'correct'|'wrong'|null>(null)
  const [totalScore,setTotalScore]= useState(0)
  const [errors,    setErrors]    = useState(0)
  const [startMs]                 = useState(Date.now())
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearAll = () => { timerIds.current.forEach(clearTimeout); timerIds.current = [] }

  const speak = useCallback((text: string) => {
    speakArabic(text, 0.85)
  }, [])

  const playSequence = useCallback((seq: number[]) => {
    clearAll()
    setPhase('listening')
    seq.forEach((animalIdx, i) => {
      timerIds.current.push(setTimeout(() => {
        speak(ANIMALS[animalIdx].name)
        if (i === seq.length - 1) {
          timerIds.current.push(setTimeout(() => {
            setPhase('recall')
          }, 800))
        }
      }, i * 900))
    })
  }, [speak]) // eslint-disable-line react-hooks/exhaustive-deps

  const startRound = useCallback(() => {
    const used = shuffle(Array.from({length: ANIMALS.length}, (_, i) => i)).slice(0, SEQ_LEN)
    setSequence(used)
    setTapped([])
    playSequence(used)
  }, [SEQ_LEN, playSequence])

  useEffect(() => {
    startRound()
    return () => { cancelSpeech(); clearAll() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTap(animalIdx: number) {
    if (phase !== 'recall') return
    const pos      = tapped.length
    const expected = sequence[pos]
    const newTapped = [...tapped, animalIdx]
    setTapped(newTapped)

    if (animalIdx !== expected) {
      // Wrong — end recall
      const newErrors = errors + 1
      setErrors(newErrors)
      setFeedback('wrong')
      setPhase('feedback')
      speak('خطأ')
      timerIds.current.push(setTimeout(() => advanceRound(0, newErrors), 1400))
    } else if (newTapped.length === sequence.length) {
      // All correct
      setFeedback('correct')
      setPhase('feedback')
      setTotalScore(s => s + 100)
      speak('ممتاز')
      timerIds.current.push(setTimeout(() => advanceRound(100), 1400))
    }
    // else: partial match, keep going
  }

  function advanceRound(roundScore: number, finalErrors?: number) {
    setFeedback(null)
    const next = round + 1
    if (next >= ROUNDS) {
      const finalScore = Math.round((totalScore + roundScore) / ROUNDS)
      onComplete({
        exerciseType:    'audio-sequence',
        exerciseLabelAr: 'تسلسل الأصوات',
        score:     finalScore,
        accuracy:  finalScore,
        duration:  Math.round((Date.now() - startMs) / 1000),
        errors:    finalErrors !== undefined ? finalErrors : errors,
        metadata:  { rounds: ROUNDS, seqLength: SEQ_LEN },
        completedAt: new Date().toISOString(),
      })
    } else {
      setRound(next)
      setTapped([])
      const used = shuffle(Array.from({length: ANIMALS.length}, (_, i) => i)).slice(0, SEQ_LEN)
      setSequence(used)
      playSequence(used)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{round + 1}/{ROUNDS}</div>
          <div className="text-xs text-white/50">جولة</div>
        </div>
        <h2 className="text-xl font-black text-white">تسلسل الأصوات</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{Math.min(100, Math.round(totalScore / ROUNDS))}%</div>
          <div className="text-xs text-white/50">دقة</div>
        </div>
      </div>

      {/* Status */}
      <div className={`text-lg font-black px-5 py-2.5 rounded-xl ${
        phase === 'listening' ? 'text-amber-400 bg-amber-400/10' : 'text-brand-400 bg-brand-400/10'
      }`}>
        {phase === 'listening' ? '🎧 استمع جيداً...' : phase === 'recall' ? '🔁 كرر الترتيب' : ''}
        {feedback === 'correct' && '✅ ممتاز!'}
        {feedback === 'wrong'   && '❌ حاول مرة أخرى'}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {sequence.map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full transition-all"
            style={{ background: i < tapped.length ? '#22C55E' : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>

      {/* Animal buttons */}
      <div className="grid grid-cols-4 gap-3">
        {ANIMALS.map((a, i) => (
          <button key={i} onClick={() => handleTap(i)}
            disabled={phase !== 'recall'}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-white/10 border-white/20 hover:bg-white/20 active:scale-95">
            <span className="text-3xl">{a.emoji}</span>
            <span className="text-[10px] text-white/70 font-bold">{a.name}</span>
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
