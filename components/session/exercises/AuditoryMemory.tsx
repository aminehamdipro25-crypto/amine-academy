'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { speakArabic } from '@/lib/speech'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

const WORD_POOLS = {
  easy:   ['قمر','بيت','ماء','نار','سمك','باب','أسد','نهر','شمس','قلم','ورد','باب'],
  medium: ['طاولة','سيارة','كتاب','مدرسة','فراشة','ثلاجة','حديقة','طائرة','مطبخ','غرفة','مروحية','مسبح'],
  hard:   ['مستشفى','حاسوب','برتقالة','مكتبة','أستاذ','سعادة','مروحية','أسنان','بركان','محيط','متحف','مسرح'],
}

function getPool(difficulty: 1 | 2 | 3) {
  if (difficulty === 1) return WORD_POOLS.easy
  if (difficulty === 2) return WORD_POOLS.medium
  return WORD_POOLS.hard
}

function getSeqLen(difficulty: 1 | 2 | 3) {
  if (difficulty === 1) return 3
  if (difficulty === 2) return 5
  return 7
}

function speak(text: string, rate = 0.8): Promise<void> {
  return speakArabic(text, rate)
}

type Phase = 'intro' | 'listen' | 'recall' | 'feedback' | 'done'

interface RoundState {
  sequence: string[]
  choices: string[]
  activeIdx: number | null // which card is currently speaking
  selected: (string | null)[]
}

export default function AuditoryMemory({
  onComplete,
  onCancel,
  studentAge: _studentAge,
  difficulty = 1,
  seed,
  onProgress,
}: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const seqLen = getSeqLen(difficulty)
  const pool = getPool(difficulty)
  const ROUNDS = 3

  const startRef = useRef(Date.now())
  const completeTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0) // 0-indexed
  const [ttsSupported, setTtsSupported] = useState(true)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [totalErrors, setTotalErrors] = useState(0)

  // Per-round state
  const [roundState, setRoundState] = useState<RoundState>({
    sequence: [],
    choices: [],
    activeIdx: null,
    selected: [],
  })
  const [feedbackCorrect, setFeedbackCorrect] = useState(0)
  const playingRef = useRef(false)

  // Build a new round's data
  const buildRound = useCallback(() => {
    const seq = shuffleWithRng(rng, pool).slice(0, seqLen)
    // choices: all seq words + 2-3 extras from pool not in seq, max 10
    const extras = shuffleWithRng(rng, pool.filter(w => !seq.includes(w))).slice(0, Math.min(3, 10 - seqLen))
    const choices = shuffleWithRng(rng, [...seq, ...extras]).slice(0, 10)
    return { sequence: seq, choices, activeIdx: null, selected: Array(seqLen).fill(null) }
  }, [pool, seqLen])

  // Round-specific stable shuffle (recalculated each round start via useEffect)
  const [currentRoundData, setCurrentRoundData] = useState<{ sequence: string[]; choices: string[] }>({
    sequence: [],
    choices: [],
  })

  useEffect(() => () => clearTimeout(completeTimerRef.current), [])

  useEffect(() => {
    if (phase === 'intro') {
      startRef.current = Date.now()
    }
  }, [phase])

  // Start a new round
  const startRound = useCallback((roundIdx: number) => {
    const { sequence, choices } = buildRound()
    setCurrentRoundData({ sequence, choices })
    setRoundState({ sequence, choices, activeIdx: null, selected: Array(seqLen).fill(null) })
    setRound(roundIdx)
    setPhase('listen')
  }, [buildRound, seqLen])

  // Play the listen sequence
  useEffect(() => {
    if (phase !== 'listen') return
    if (playingRef.current) return
    if (!roundState.sequence.length) return

    playingRef.current = true
    let cancelled = false

    async function playSequence() {
      for (let i = 0; i < roundState.sequence.length; i++) {
        if (cancelled) break
        setRoundState(rs => ({ ...rs, activeIdx: i }))
        try {
          await speak(roundState.sequence[i])
        } catch {
          setTtsSupported(false)
        }
        if (cancelled) break
        // gap between words
        await new Promise(r => setTimeout(r, 400))
      }
      if (!cancelled) {
        setRoundState(rs => ({ ...rs, activeIdx: null }))
        setPhase('recall')
      }
      playingRef.current = false
    }

    playSequence()

    return () => {
      cancelled = true
      try { window.speechSynthesis?.cancel?.() } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundState.sequence])

  // Recall: tap a word button to fill next empty slot
  function handleWordTap(word: string) {
    setRoundState(rs => {
      const nextEmpty = rs.selected.indexOf(null)
      if (nextEmpty === -1) return rs
      const newSelected = [...rs.selected]
      newSelected[nextEmpty] = word
      return { ...rs, selected: newSelected }
    })
  }

  // Remove a filled slot on tap
  function handleSlotTap(idx: number) {
    setRoundState(rs => {
      const newSelected = [...rs.selected]
      newSelected[idx] = null
      return { ...rs, selected: newSelected }
    })
  }

  // Submit recall for current round
  function submitRecall() {
    const { sequence, selected } = roundState
    let correct = 0
    let errors = 0
    for (let i = 0; i < sequence.length; i++) {
      if (selected[i] === sequence[i]) correct++
      else if (selected[i] !== null) errors++
    }
    const roundScore = Math.round((correct / sequence.length) * 100)
    const newScores = [...roundScores, roundScore]
    const newErrors = totalErrors + errors
    setRoundScores(newScores)
    setTotalErrors(newErrors)
    setFeedbackCorrect(correct)
    setPhase('feedback')

    // Each round fills all seqLen slots, so counts are word-level and cumulative
    const answeredWords = newScores.length * seqLen
    onProgress?.({
      answered: answeredWords,
      total: ROUNDS * seqLen,
      correct: answeredWords - newErrors,
      errors: newErrors,
      lastCorrect: correct === sequence.length,
    })

    if (newScores.length >= ROUNDS) {
      const avgScore = Math.round(newScores.reduce((a, b) => a + b, 0) / ROUNDS)
      const accuracy = Math.max(0, 100 - (newErrors / (ROUNDS * seqLen)) * 100)
      const dur = Math.round((Date.now() - startRef.current) / 1000)
      completeTimerRef.current = setTimeout(() => {
        setPhase('done')
        onComplete({
          exerciseType: 'auditory-memory',
          exerciseLabelAr: 'الذاكرة السمعية',
          score: avgScore,
          accuracy: Math.round(accuracy),
          duration: dur,
          errors: newErrors,
          metadata: { seqLen, rounds: ROUNDS },
          completedAt: new Date().toISOString(),
        })
      }, 2200)
    }
  }

  function nextRound() {
    startRound(round + 1)
  }

  const isLastRound = round >= ROUNDS - 1
  const filledCount = roundState.selected.filter(s => s !== null).length
  const allFilled = filledCount === seqLen

  function getStars(correct: number, total: number) {
    const pct = correct / total
    if (pct === 1) return '⭐⭐⭐'
    if (pct >= 0.66) return '⭐⭐'
    if (pct >= 0.33) return '⭐'
    return ''
  }

  // ─── INTRO ────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div dir="rtl" className="flex flex-col items-center gap-8 p-6 select-none max-w-lg mx-auto w-full">
        <div className="text-6xl">👂</div>
        <h2 className="text-2xl font-black text-white text-center">الذاكرة السمعية</h2>
        <p className="text-white/70 text-center leading-relaxed">
          ستسمع {seqLen} كلمات واحدة تلو الأخرى.<br />
          بعد الاستماع، اختر الكلمات بنفس الترتيب!
        </p>
        {!ttsSupported && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-2 text-amber-300 text-sm text-center">
            ⚠️ التحدث الصوتي غير مدعوم — ستظهر الكلمات على الشاشة
          </div>
        )}
        <div className="flex gap-3 text-sm text-white/50">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <span>جولة {i + 1}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => startRound(0)}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl text-xl transition-colors"
        >
          ابدأ ▶
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إلغاء
        </button>
      </div>
    )
  }

  // ─── LISTEN ───────────────────────────────────────────────────
  if (phase === 'listen') {
    return (
      <div dir="rtl" className="flex flex-col items-center gap-6 p-6 select-none max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <span className="text-white/50 text-sm">جولة {round + 1} / {ROUNDS}</span>
          <h2 className="text-lg font-black text-white">الذاكرة السمعية</h2>
          <div className="w-16" />
        </div>

        <p className="text-white/60 text-sm">استمع جيداً…</p>

        <div className="flex flex-wrap justify-center gap-3 w-full">
          {roundState.sequence.map((word, i) => {
            const isActive = roundState.activeIdx === i
            return (
              <div
                key={i}
                className="flex items-center justify-center rounded-2xl border-2 font-black text-xl transition-all duration-300 select-none"
                style={{
                  width: 88,
                  height: 88,
                  background: isActive ? '#7C5CFC' : 'rgba(255,255,255,0.06)',
                  borderColor: isActive ? '#a78bfa' : 'rgba(255,255,255,0.15)',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isActive ? '0 0 24px #7C5CFC88' : 'none',
                  color: 'white',
                }}
              >
                {!ttsSupported ? word : (isActive ? word : '؟')}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1 mt-4">
          {roundState.sequence.map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{
                background: roundState.activeIdx === i ? '#7C5CFC' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── RECALL ───────────────────────────────────────────────────
  if (phase === 'recall') {
    return (
      <div dir="rtl" className="flex flex-col items-center gap-5 p-6 select-none max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <span className="text-white/50 text-sm">جولة {round + 1} / {ROUNDS}</span>
          <h2 className="text-lg font-black text-white">رتّب الكلمات</h2>
          <div className="w-16" />
        </div>

        <p className="text-white/60 text-sm text-center">اضغط الكلمات بنفس الترتيب الذي سمعته</p>

        {/* Answer slots */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {roundState.selected.map((val, i) => {
            let borderColor = 'rgba(255,255,255,0.2)'
            let bg = 'rgba(255,255,255,0.05)'
            if (val !== null) {
              // show color only after submit — keep neutral during recall
              borderColor = 'rgba(124,92,252,0.7)'
              bg = 'rgba(124,92,252,0.15)'
            }
            return (
              <button
                key={i}
                onClick={() => val !== null && handleSlotTap(i)}
                className="flex items-center justify-center rounded-2xl border-2 font-black text-lg transition-all duration-200"
                style={{
                  width: 80,
                  height: 80,
                  background: bg,
                  borderColor,
                  color: 'white',
                  cursor: val !== null ? 'pointer' : 'default',
                }}
              >
                {val ?? <span className="text-white/20 text-2xl">{i + 1}</span>}
              </button>
            )
          })}
        </div>

        {/* Word choice buttons */}
        <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
          {roundState.choices.map(word => {
            const usedCount = roundState.selected.filter(s => s === word).length
            const poolCount = roundState.sequence.filter(s => s === word).length
            const isExhausted = usedCount >= poolCount && roundState.sequence.includes(word)
            const isDistractor = !roundState.sequence.includes(word) && usedCount > 0

            return (
              <button
                key={word}
                onClick={() => !isExhausted && !isDistractor && handleWordTap(word)}
                disabled={isExhausted || isDistractor}
                className="px-4 py-2 rounded-xl border-2 font-bold text-base transition-all duration-200"
                style={{
                  background: isExhausted || isDistractor ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                  borderColor: isExhausted || isDistractor ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                  color: isExhausted || isDistractor ? 'rgba(255,255,255,0.3)' : 'white',
                  cursor: isExhausted || isDistractor ? 'not-allowed' : 'pointer',
                }}
              >
                {word}
              </button>
            )
          })}
        </div>

        <button
          onClick={submitRecall}
          disabled={!allFilled}
          className="w-full font-black py-4 rounded-2xl text-lg transition-all duration-200"
          style={{
            background: allFilled ? '#16a34a' : 'rgba(255,255,255,0.08)',
            color: allFilled ? 'white' : 'rgba(255,255,255,0.3)',
            cursor: allFilled ? 'pointer' : 'not-allowed',
          }}
        >
          {allFilled ? 'تحقق ✓' : `اختر ${seqLen - filledCount} كلمة${seqLen - filledCount !== 1 ? '' : ''} بعد`}
        </button>

        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إنهاء التمرين
        </button>
      </div>
    )
  }

  // ─── FEEDBACK ─────────────────────────────────────────────────
  if (phase === 'feedback') {
    const stars = getStars(feedbackCorrect, seqLen)
    return (
      <div dir="rtl" className="flex flex-col items-center gap-6 p-6 select-none max-w-lg mx-auto w-full">
        <div className="text-5xl">{stars || '💪'}</div>
        <h2 className="text-2xl font-black text-white text-center">
          {feedbackCorrect === seqLen ? 'رائع!' : feedbackCorrect >= Math.ceil(seqLen / 2) ? 'جيد!' : 'حاول مرة أخرى!'}
        </h2>
        <p className="text-white/70 text-lg">
          أجبت صح: <span className="text-green-400 font-black">{feedbackCorrect}</span> / {seqLen}
        </p>

        {/* Show correct sequence */}
        <div className="flex flex-wrap justify-center gap-2">
          {roundState.sequence.map((word, i) => {
            const wasCorrect = roundState.selected[i] === word
            return (
              <div
                key={i}
                className="px-3 py-2 rounded-xl font-bold text-base border-2"
                style={{
                  background: wasCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  borderColor: wasCorrect ? '#22c55e' : '#ef4444',
                  color: 'white',
                }}
              >
                {word}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                background: i < roundScores.length ? '#7C5CFC' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {!isLastRound ? (
          <button
            onClick={nextRound}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl text-xl transition-colors"
          >
            الجولة التالية ←
          </button>
        ) : (
          <div className="text-white/50 text-sm">انتظر… جارٍ حساب النتيجة</div>
        )}

        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← إنهاء التمرين
        </button>
      </div>
    )
  }

  // phase === 'done' — onComplete already called
  return null
}
