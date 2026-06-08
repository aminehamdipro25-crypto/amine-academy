'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const COLORS = ['#5b6ef2','#2dd4bf','#f59e0b','#f472b6','#34d399','#a78bfa','#60a5fa','#fb923c','#4ade80']

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function SequenceMemory({ onComplete, onCancel, studentAge: _studentAge, difficulty = 1 }: Props) {
  const startRef = useRef(Date.now())
  const startLen = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [phase, setPhase] = useState<'watch'|'repeat'|'wrong'|'done'>('watch')
  const [active, setActive] = useState<number|null>(null)
  const [level, setLevel] = useState(1)
  const [errors, setErrors] = useState(0)
  const [maxLevel, setMaxLevel] = useState(0)

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('watch')
    setActive(null)
    await new Promise<void>(r => setTimeout(r, 800))
    for (const idx of seq) {
      setActive(idx)
      await new Promise<void>(r => setTimeout(r, 700))
      setActive(null)
      await new Promise<void>(r => setTimeout(r, 300))
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
    const newPlayer = [...playerSeq, idx]
    setPlayerSeq(newPlayer)
    const pos = newPlayer.length - 1
    if (sequence[pos] !== idx) {
      setErrors(e => e + 1)
      setPhase('wrong')
      if (level > maxLevel) setMaxLevel(level)
      if (errors >= 2) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType: 'sequence-memory',
          exerciseLabelAr: 'تذكر التسلسل',
          score: Math.min(100, maxLevel * 15),
          accuracy: Math.round(((level - 1) / (level - 1 + errors + 1)) * 100),
          duration: dur,
          errors,
          metadata: { maxLevel, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => {
        playSequence(sequence)
      }, 1000)
    } else if (newPlayer.length === sequence.length) {
      if (level > maxLevel) setMaxLevel(level)
      if (level >= 8) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        setPhase('done')
        onComplete({
          exerciseType: 'sequence-memory',
          exerciseLabelAr: 'تذكر التسلسل',
          score: 100,
          accuracy: Math.round(((level) / (level + errors)) * 100),
          duration: dur,
          errors,
          metadata: { maxLevel: level, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => setLevel(l => l + 1), 600)
    }
  }

  if (phase === 'done') return null

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{level}</div>
          <div className="text-xs text-white/50">مستوى</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold px-4 py-1.5 rounded-full ${
            phase === 'watch' ? 'bg-amber-500/20 text-amber-400' :
            phase === 'repeat' ? 'bg-green-500/20 text-green-400' :
            'bg-orange-500/20 text-orange-400'
          }`}>
            {phase === 'watch' ? '👁 شاهد' : phase === 'repeat' ? '👆 كرر' : '↩ أعد المحاولة'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-orange-400">{errors}/3</div>
          <div className="text-xs text-white/50">أخطاء</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            className={`w-24 h-24 rounded-2xl transition-all duration-200 border-2
              ${active === i
                ? 'scale-110 border-white shadow-lg shadow-white/30'
                : phase === 'repeat'
                  ? 'border-white/20 hover:scale-105 cursor-pointer'
                  : 'border-white/10 cursor-default'
              }`}
            style={{
              backgroundColor: active === i ? COLORS[i] : `${COLORS[i]}33`,
            }}
          />
        ))}
      </div>

      <p className="text-white/40 text-sm text-center">
        {phase === 'watch' ? 'شاهد التسلسل بعناية...' : phase === 'repeat' ? 'الآن كرر نفس التسلسل' : 'حاول مرة أخرى!'}
      </p>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
