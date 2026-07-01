'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const COLORS = [
  '#5b6ef2','#2dd4bf','#f59e0b','#f472b6',
  '#34d399','#a78bfa','#60a5fa','#fb923c','#4ade80',
]

interface Props { onComplete: (r: ExerciseResult) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3 }

export default function SequenceMemory({ onComplete, onCancel, difficulty = 1 }: Props) {
  const startRef = useRef(Date.now())
  const startLen = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const maxErrors = 3

  const [sequence, setSequence]   = useState<number[]>([])
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [phase, setPhase]         = useState<'watch'|'repeat'|'wrong'|'done'>('watch')
  const [active, setActive]       = useState<number|null>(null)
  const [pressed, setPressed]     = useState<number|null>(null)
  const [level, setLevel]         = useState(1)
  const [errors, setErrors]       = useState(0)
  const [maxLevel, setMaxLevel]   = useState(0)

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('watch')
    setActive(null)
    await new Promise<void>(r => setTimeout(r, 900))
    for (const idx of seq) {
      setActive(idx)
      await new Promise<void>(r => setTimeout(r, 650))
      setActive(null)
      await new Promise<void>(r => setTimeout(r, 280))
    }
    setPhase('repeat')
    setPlayerSeq([])
  }, [])

  useEffect(() => {
    const len = startLen + level - 1
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 9))
    setSequence(seq)
    const timer = setTimeout(() => playSequence(seq), 500)
    return () => clearTimeout(timer)
  }, [level, startLen, playSequence])

  function handleTap(idx: number) {
    if (phase !== 'repeat') return
    setPressed(idx)
    setTimeout(() => setPressed(null), 200)
    const newPlayer = [...playerSeq, idx]
    setPlayerSeq(newPlayer)
    const pos = newPlayer.length - 1

    if (sequence[pos] !== idx) {
      const newErrors = errors + 1
      setErrors(newErrors)
      setPhase('wrong')
      if (level > maxLevel) setMaxLevel(level)
      if (newErrors >= maxErrors) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType: 'sequence-memory',
          exerciseLabelAr: 'تذكر التسلسل',
          score: Math.min(100, Math.max(0, maxLevel * 15)),
          accuracy: Math.round(((level - 1) / Math.max(1, level - 1 + newErrors)) * 100),
          duration: dur,
          errors: newErrors,
          metadata: { maxLevel, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => playSequence(sequence), 900)
    } else if (newPlayer.length === sequence.length) {
      if (level > maxLevel) setMaxLevel(level)
      if (level >= 8) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        setPhase('done')
        onComplete({
          exerciseType: 'sequence-memory',
          exerciseLabelAr: 'تذكر التسلسل',
          score: 100,
          accuracy: Math.round((level / Math.max(1, level + errors)) * 100),
          duration: dur,
          errors,
          metadata: { maxLevel: level, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => setLevel(l => l + 1), 700)
    }
  }

  if (phase === 'done') return null

  const progress = Math.min(((level - 1) / 7) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
          <div className="text-lg font-black text-brand-400">{level}</div>
          <div className="text-[10px] text-white/40">مستوى</div>
        </div>

        <div className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
          phase === 'watch' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          phase === 'repeat' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        }`}>
          {phase === 'watch' ? '👁 شاهد' : phase === 'repeat' ? '👆 كرر' : '↩ حاول مجدداً'}
        </div>

        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
          <div className="text-lg font-black text-red-400">{errors}/{maxErrors}</div>
          <div className="text-[10px] text-white/40">أخطاء</div>
        </div>
      </div>

      {/* Level progress */}
      <div className="w-full max-w-sm bg-white/10 rounded-full h-1.5">
        <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Sequence indicator */}
      <div className="flex gap-1.5 h-5 items-center">
        {sequence.map((_, i) => (
          <div key={i}
            className={`w-2 h-2 rounded-full transition-all duration-150 ${
              i < playerSeq.length ? 'scale-125' :
              i === playerSeq.length && phase === 'repeat' ? 'bg-white/40 scale-110' : 'bg-white/15'
            }`}
            style={i < playerSeq.length ? { background: COLORS[sequence[i]] } : {}}
          />
        ))}
      </div>

      {/* 3×3 Grid */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => {
          const isActive  = active === i
          const isPressed = pressed === i
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={phase !== 'repeat'}
              className={`w-24 h-24 rounded-2xl border-2 transition-all duration-150 ${
                isActive
                  ? 'scale-115 border-white/60 shadow-lg'
                  : isPressed
                    ? 'scale-90 brightness-150 border-white/40'
                    : phase === 'repeat'
                      ? 'border-white/20 hover:scale-105 hover:border-white/35 cursor-pointer'
                      : 'border-white/10 cursor-default'
              }`}
              style={{
                backgroundColor: isActive
                  ? COLORS[i]
                  : isPressed
                    ? `${COLORS[i]}88`
                    : `${COLORS[i]}40`,
                boxShadow: isActive ? `0 0 24px ${COLORS[i]}88` : 'none',
              }}
            />
          )
        })}
      </div>

      <p className="text-white/35 text-sm text-center">
        {phase === 'watch'  ? 'شاهد التسلسل بعناية...' :
         phase === 'repeat' ? `كرر ${sequence.length} خطوة بالترتيب` :
                              'خطأ! سيُعاد التسلسل...'}
      </p>

      <button onClick={onCancel} className="text-white/25 hover:text-white/50 text-xs transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
