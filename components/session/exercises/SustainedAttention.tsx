'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

// All stimuli emojis (target will be picked from these)
const DISTRACTOR_POOL = [
  '🐶', '🐱', '🐸', '🦊', '🐧', '🐬', '🦋', '🌺',
  '🍎', '🍕', '🍔', '🍜', '🎸', '🎺', '🚗', '🚌',
  '🌴', '🌙', '🔴', '🔵', '📚', '✏️', '👕', '🎨',
]
const TARGET_EMOJI = '⭐'
const TARGET_RATE = 0.30  // ~30% of stimuli are targets

type Phase = 'intro' | 'playing' | 'result'

interface StimRecord {
  emoji: string
  isTarget: boolean
}

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

function buildSequence(totalStimuli: number): StimRecord[] {
  const seq: StimRecord[] = []
  // Ensure roughly TARGET_RATE targets, placed randomly but not back-to-back
  const targetCount = Math.round(totalStimuli * TARGET_RATE)
  const flags: boolean[] = Array(totalStimuli).fill(false)
  let placed = 0
  while (placed < targetCount) {
    const idx = Math.floor(Math.random() * totalStimuli)
    if (!flags[idx] && (idx === 0 || !flags[idx - 1])) {
      flags[idx] = true
      placed++
    }
  }
  for (let i = 0; i < totalStimuli; i++) {
    if (flags[i]) {
      seq.push({ emoji: TARGET_EMOJI, isTarget: true })
    } else {
      seq.push({
        emoji: DISTRACTOR_POOL[Math.floor(Math.random() * DISTRACTOR_POOL.length)],
        isTarget: false,
      })
    }
  }
  return seq
}

export default function SustainedAttention({ onComplete, onCancel, difficulty = 1 }: Props) {
  const totalStimuli = difficulty === 1 ? 15 : difficulty === 2 ? 20 : 25
  const displayMs = difficulty === 1 ? 1800 : difficulty === 2 ? 1500 : 1200

  const [phase, setPhase] = useState<Phase>('intro')
  const [stimIdx, setStimIdx] = useState(0)
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null)
  const [showStimulus, setShowStimulus] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [flashFeedback, setFlashFeedback] = useState<'hit' | 'false-alarm' | null>(null)
  const [result, setResult] = useState<ExerciseResult | null>(null)

  // Counters kept in refs so async timers always see fresh values
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const falseAlarmsRef = useRef(0)
  const pressedRef = useRef(false)
  const seqRef = useRef<StimRecord[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef(Date.now())

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const finishGame = useCallback(() => {
    const hits = hitsRef.current
    const misses = missesRef.current
    const fa = falseAlarmsRef.current
    const totalTargets = seqRef.current.filter(s => s.isTarget).length
    const rawScore = totalTargets > 0 ? ((hits - fa) / totalTargets) * 100 : 0
    const score = Math.max(0, Math.round(rawScore))
    const accuracy = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const r: ExerciseResult = {
      exerciseType: 'sustained-attention',
      exerciseLabelAr: 'الانتباه المستمر',
      score,
      accuracy,
      duration: dur,
      errors: misses + fa,
      metadata: {
        hits,
        misses,
        falseAlarms: fa,
        totalTargets,
        totalStimuli,
        difficulty,
      },
      completedAt: new Date().toISOString(),
    }
    setResult(r)
    setPhase('result')
  }, [totalStimuli, difficulty])

  const runStimulus = useCallback((idx: number) => {
    if (idx >= seqRef.current.length) {
      finishGame()
      return
    }
    const stim = seqRef.current[idx]
    pressedRef.current = false
    setPressed(false)
    setFlashFeedback(null)
    setCurrentEmoji(stim.emoji)
    setStimIdx(idx)
    setShowStimulus(true)

    timerRef.current = setTimeout(() => {
      // Stimulus off
      setShowStimulus(false)
      // Check miss
      if (stim.isTarget && !pressedRef.current) {
        missesRef.current++
      }
      // Gap between stimuli (200ms blank)
      timerRef.current = setTimeout(() => {
        runStimulus(idx + 1)
      }, 200)
    }, displayMs)
  }, [displayMs, finishGame])

  function startGame() {
    seqRef.current = buildSequence(totalStimuli)
    hitsRef.current = 0
    missesRef.current = 0
    falseAlarmsRef.current = 0
    startRef.current = Date.now()
    setPhase('playing')
    setStimIdx(0)
    timerRef.current = setTimeout(() => runStimulus(0), 500)
  }

  function handlePress() {
    if (phase !== 'playing') return
    if (pressedRef.current) return
    pressedRef.current = true
    setPressed(true)
    const stim = seqRef.current[stimIdx]
    if (stim && stim.isTarget && showStimulus) {
      hitsRef.current++
      setFlashFeedback('hit')
    } else {
      falseAlarmsRef.current++
      setFlashFeedback('false-alarm')
    }
    // feedback disappears after 400ms but don't clear the stimulus timer
    setTimeout(() => setFlashFeedback(null), 400)
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center gap-6 px-6 min-h-full">
        <div className="text-7xl">{TARGET_EMOJI}</div>
        <h2 className="text-2xl font-black text-white text-center">الانتباه المستمر</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-xs space-y-3">
          <p className="text-white font-bold text-center text-base">
            اضغط فقط عند رؤية: <span className="text-3xl">{TARGET_EMOJI}</span>
          </p>
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{TARGET_EMOJI}</span>
              <span className="text-green-400 text-sm font-bold">← اضغط الزر!</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐶</span>
              <span className="text-red-400 text-sm font-bold">← لا تضغط</span>
            </div>
          </div>
          <p className="text-white/50 text-xs text-center">{totalStimuli} صورة — ركّز جيداً</p>
        </div>
        <button
          onClick={startGame}
          className="bg-brand-500 hover:bg-brand-400 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إلغاء
        </button>
      </div>
    )
  }

  // Result screen
  if (phase === 'result' && result) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center gap-5 px-6 min-h-full">
        <div className="text-6xl">{result.score >= 80 ? '🏆' : result.score >= 50 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى!</h2>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-400">{hitsRef.current}</div>
            <div className="text-xs text-white/40">إصابات</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-orange-400">{missesRef.current}</div>
            <div className="text-xs text-white/40">فائتة</div>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-red-400">{falseAlarmsRef.current}</div>
            <div className="text-xs text-white/40">ضغط خاطئ</div>
          </div>
        </div>
        <div className="text-brand-400 font-black text-5xl">{result.score}%</div>
        <button
          onClick={() => onComplete(result)}
          className="bg-brand-500 hover:bg-brand-400 text-white font-black px-8 py-3 rounded-xl transition-colors"
        >
          متابعة
        </button>
      </div>
    )
  }

  // Playing
  const totalTargets = seqRef.current.filter(s => s.isTarget).length

  return (
    <div dir="rtl" className="flex flex-col h-full select-none">
      {/* Progress */}
      <div className="px-6 py-3">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-xs">{stimIdx + 1} / {totalStimuli}</span>
          <span className="text-green-400 text-xs font-bold">{hitsRef.current} / {totalTargets} إصابات</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${((stimIdx + 1) / totalStimuli) * 100}%` }}
          />
        </div>
      </div>

      {/* Target reminder */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-white/50 text-sm">اضغط فقط عند رؤية:</span>
        <span className="text-2xl">{TARGET_EMOJI}</span>
      </div>

      {/* Stimulus arena */}
      <div
        onClick={handlePress}
        className={`relative flex-1 mx-4 mb-4 rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-colors duration-100
          ${flashFeedback === 'hit' ? 'bg-green-950/40' :
            flashFeedback === 'false-alarm' ? 'bg-red-950/40' :
            'bg-gray-900/40'}`}
        style={{ minHeight: 320 }}
      >
        {showStimulus && currentEmoji ? (
          <div
            className="text-8xl transition-all duration-100"
            style={{ filter: 'drop-shadow(0 0 20px rgba(124,92,252,0.4))' }}
          >
            {currentEmoji}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full border-4 border-white/10" />
        )}

        {/* Flash feedback overlay */}
        {flashFeedback && (
          <div className="absolute bottom-5 font-black text-lg">
            {flashFeedback === 'hit' && <span className="text-green-400">✓ ممتاز!</span>}
            {flashFeedback === 'false-alarm' && <span className="text-red-400">✗ ليس الهدف!</span>}
          </div>
        )}

        <p className="absolute bottom-14 text-white/15 font-bold text-sm pointer-events-none">
          اضغط الشاشة عند رؤية النجمة
        </p>
      </div>

      <button
        onClick={onCancel}
        className="text-white/40 hover:text-white/70 text-sm pb-4 transition-colors text-center"
      >
        ← إنهاء التمرين
      </button>
    </div>
  )
}
