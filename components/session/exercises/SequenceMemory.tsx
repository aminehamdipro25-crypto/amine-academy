'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randIntWithRng } from '@/lib/seeded-random'

// 9 vivid, clearly distinct colours — one per grid position
const COLORS = [
  '#EF4444', // 0 red
  '#3B82F6', // 1 blue
  '#22C55E', // 2 green
  '#EAB308', // 3 yellow
  '#A855F7', // 4 purple
  '#F97316', // 5 orange
  '#EC4899', // 6 pink
  '#14B8A6', // 7 teal
  '#6366F1', // 8 indigo
]

interface Props { onComplete: (r: ExerciseResult) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3; seed?: number /* shared seed for identical content on both screens — see lib/seeded-random.ts */; onProgress?: (p: ExerciseProgressUpdate) => void /* live per-answer feedback to the specialist */ }

export default function SequenceMemory({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng         = useRef(createRng(seed ?? Date.now())).current
  const startRef    = useRef(Date.now())
  const maxLvlRef   = useRef(0)     // ref — avoids stale closure on setState
  const errRef      = useRef(0)
  const correctRef  = useRef(0)
  const endedRef    = useRef(false)   // guard — onComplete fires at most once; blocks stray taps after end
  const timerIds    = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => { timerIds.current.forEach(clearTimeout); timerIds.current = [] }, [])

  const startLen  = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const MAX_ERR   = 3
  const MAX_LEVEL = 8

  const [sequence,  setSequence]  = useState<number[]>([])
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [phase,     setPhase]     = useState<'watch'|'repeat'|'wrong'>('watch')
  const [active,    setActive]    = useState<number|null>(null)
  const [tapFlash,  setTapFlash]  = useState<{idx:number; ok:boolean}|null>(null)
  const [wrongAnim, setWrongAnim] = useState(false)
  const [level,     setLevel]     = useState(1)
  const [errors,    setErrors]    = useState(0)

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('watch')
    setActive(null)
    setPlayerSeq([])
    await new Promise<void>(r => setTimeout(r, 800))
    for (const idx of seq) {
      setActive(idx)
      await new Promise<void>(r => setTimeout(r, 700))
      setActive(null)
      await new Promise<void>(r => setTimeout(r, 300))
    }
    setPhase('repeat')
  }, [])

  useEffect(() => {
    const len = startLen + level - 1
    const seq = Array.from({ length: len }, () => randIntWithRng(rng, 0, 8))
    setSequence(seq)
    const t = setTimeout(() => playSequence(seq), 600)
    return () => clearTimeout(t)
  }, [level, startLen, playSequence])

  function endGame(reachedLevel: number, totalErr: number) {
    if (endedRef.current) return
    endedRef.current = true
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const total = correctRef.current + totalErr
    const acc   = total > 0 ? Math.round((correctRef.current / total) * 100) : 0
    const score = Math.min(100, Math.round((reachedLevel / MAX_LEVEL) * 100))
    onComplete({
      exerciseType:    'sequence-memory',
      exerciseLabelAr: 'تذكر التسلسل',
      score,
      accuracy: acc,
      duration: dur,
      errors: totalErr,
      metadata: { maxLevel: reachedLevel, difficulty },
      completedAt: new Date().toISOString(),
    })
  }

  function handleTap(idx: number) {
    if (endedRef.current) return
    if (phase !== 'repeat') return

    const newPlayer = [...playerSeq, idx]
    const pos = newPlayer.length - 1

    if (sequence[pos] !== idx) {
      // ── Wrong tap ──
      setTapFlash({ idx, ok: false })
      setWrongAnim(true)
      timerIds.current.push(setTimeout(() => { setTapFlash(null); setWrongAnim(false) }, 600))

      const newErr = errRef.current + 1
      errRef.current = newErr
      setErrors(newErr)
      onProgress?.({ answered: correctRef.current + newErr, total: 0, correct: correctRef.current, errors: newErr, lastCorrect: false })

      // Update max level reached
      if (level > maxLvlRef.current) maxLvlRef.current = level

      if (newErr >= MAX_ERR) {
        endGame(maxLvlRef.current, newErr)
        return
      }
      setPhase('wrong')
      setPlayerSeq([])
      timerIds.current.push(setTimeout(() => playSequence(sequence), 1200))
    } else {
      // ── Correct tap ──
      correctRef.current++
      onProgress?.({ answered: correctRef.current + errRef.current, total: 0, correct: correctRef.current, errors: errRef.current, lastCorrect: true })
      setTapFlash({ idx, ok: true })
      timerIds.current.push(setTimeout(() => setTapFlash(null), 280))
      setPlayerSeq(newPlayer)

      if (newPlayer.length === sequence.length) {
        // Level complete
        if (level > maxLvlRef.current) maxLvlRef.current = level

        if (level >= MAX_LEVEL) {
          endGame(MAX_LEVEL, errRef.current)
          return
        }
        // Lock the grid between levels — 'watch' disables buttons (disabled={phase !== 'repeat'})
        // so a stray tap in the 700ms window can't run handleTap with pos===sequence.length.
        setPhase('watch')
        timerIds.current.push(setTimeout(() => setLevel(l => l + 1), 700))
      }
    }
  }

  const progress = Math.min(((level - 1) / (MAX_LEVEL - 1)) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
          <div className="text-lg font-black text-brand-400">{level}</div>
          <div className="text-[10px] text-white/40">مستوى</div>
        </div>

        <div className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
          phase === 'watch'  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
          phase === 'repeat' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                               'bg-red-500/20 text-red-300 border border-red-500/40'
        }`}>
          {phase === 'watch'  ? '👁 شاهد' :
           phase === 'repeat' ? '👆 كرر'  : '❌ خطأ!'}
        </div>

        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
          <div className="text-lg font-black text-red-400">{errors}/{MAX_ERR}</div>
          <div className="text-[10px] text-white/40">أخطاء</div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="w-full max-w-sm bg-white/10 rounded-full h-1.5">
        <div
          className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Sequence step dots ── */}
      <div className="flex gap-1 flex-wrap justify-center max-w-[280px] min-h-[22px]">
        {sequence.map((_, i) => {
          const done = i < playerSeq.length
          const curr = i === playerSeq.length && phase === 'repeat'
          return (
            <div
              key={i}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-200 ${curr ? 'scale-125' : ''}`}
              style={{
                background: done
                  ? COLORS[sequence[i]]
                  : curr ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
                color: 'white',
              }}
            >
              {i + 1}
            </div>
          )
        })}
      </div>

      {/* ── 3×3 Grid ── */}
      <div className={`grid grid-cols-3 gap-3 transition-all duration-150 ${wrongAnim ? 'brightness-50 scale-95' : ''}`}>
        {Array.from({ length: 9 }, (_, i) => {
          const isActive   = active === i
          const isOkFlash  = tapFlash?.idx === i && tapFlash.ok
          const isBadFlash = tapFlash?.idx === i && !tapFlash.ok

          const bg = isActive
            ? COLORS[i]
            : isBadFlash
              ? '#EF4444'
              : isOkFlash
                ? COLORS[i]
                : phase === 'repeat'
                  ? `${COLORS[i]}CC`   // 80% opacity — clearly visible
                  : `${COLORS[i]}44`   // 27% opacity — dimmed during watch

          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={phase !== 'repeat'}
              className={`w-24 h-24 rounded-2xl border-2 transition-all duration-150 flex items-center justify-center font-black text-2xl text-white/60 ${
                isActive
                  ? 'scale-110 border-white/80'
                  : isBadFlash
                    ? 'scale-95 border-red-300'
                    : isOkFlash
                      ? 'scale-105 border-white/70'
                      : phase === 'repeat'
                        ? 'border-white/25 hover:scale-105 hover:border-white/50 cursor-pointer'
                        : 'border-transparent cursor-default'
              }`}
              style={{
                backgroundColor: bg,
                boxShadow: isActive
                  ? `0 0 36px ${COLORS[i]}BB, 0 0 12px ${COLORS[i]}66`
                  : isOkFlash
                    ? `0 0 20px ${COLORS[i]}99`
                    : 'none',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* ── Instruction ── */}
      <p className="text-white/50 text-sm text-center">
        {phase === 'watch'  ? 'شاهد التسلسل بعناية...' :
         phase === 'repeat' ? `كرر التسلسل: ${sequence.length} خطوات` :
                              'خطأ! سيُعاد التسلسل...'}
      </p>

      <button onClick={onCancel} className="text-white/25 hover:text-white/55 text-xs transition-colors mt-auto">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
