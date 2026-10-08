'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, randIntWithRng } from '@/lib/seeded-random'

const COLORS = [
  { id: 0, label: 'أحمر', emoji: '🔴', base: '#EF4444', lite: '#FCA5A5' },
  { id: 1, label: 'أزرق', emoji: '🔵', base: '#3B82F6', lite: '#93C5FD' },
  { id: 2, label: 'أخضر', emoji: '🟢', base: '#22C55E', lite: '#86EFAC' },
  { id: 3, label: 'أصفر', emoji: '🟡', base: '#EAB308', lite: '#FDE047' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

export default function SimonSays({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const startLen = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const [sequence, setSequence] = useState<number[]>([])
  const [activeBtn, setActiveBtn] = useState<number | null>(null)
  const [phase, setPhase] = useState<'watch'|'input'|'wrong'|'done'>('watch')
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [level, setLevel] = useState(1)
  const [errors, setErrors] = useState(0)
  const startRef = useRef(Date.now())
  const errRef = useRef(0)
  const maxLevelRef = useRef(0)
  const correctTapsRef = useRef(0)
  // Track every setTimeout and mark the component dead on unmount, so neither
  // the tracked timers nor the async flashSequence loop call setState after the
  // exercise is torn down (was firing setActiveBtn/setPhase/setLevel post-unmount).
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const deadRef = useRef(false)
  const track = (t: ReturnType<typeof setTimeout>) => { timersRef.current.push(t); return t }
  useEffect(() => () => { deadRef.current = true; timersRef.current.forEach(clearTimeout) }, [])

  const flashSequence = useCallback(async (seq: number[]) => {
    setPhase('watch')
    await new Promise(r => setTimeout(r, 800))
    if (deadRef.current) return
    for (const c of seq) {
      setActiveBtn(c)
      await new Promise(r => setTimeout(r, 700))
      if (deadRef.current) return
      setActiveBtn(null)
      await new Promise(r => setTimeout(r, 350))
      if (deadRef.current) return
    }
    setPhase('input')
    setPlayerSeq([])
  }, [])

  useEffect(() => {
    const len = startLen + level - 1
    const seq = Array.from({ length: len }, () => randIntWithRng(rng, 0, 3))
    setSequence(seq)
    const t = setTimeout(() => flashSequence(seq), 500)
    return () => clearTimeout(t)
  }, [level, startLen, flashSequence])

  function finish() {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const totalTaps = correctTapsRef.current + errRef.current
    const accuracy = totalTaps > 0 ? Math.round((correctTapsRef.current / totalTaps) * 100) : 0
    const score = Math.max(0, Math.min(100, maxLevelRef.current * 10 - errRef.current * 5))
    setPhase('done')
    onComplete({
      exerciseType: 'simon-says',
      exerciseLabelAr: 'سايمون يقول — تسلسل الألوان',
      score,
      accuracy,
      duration: dur,
      errors: errRef.current,
      metadata: { maxLevel: maxLevelRef.current, difficulty },
      completedAt: new Date().toISOString(),
    })
  }

  function press(id: number) {
    if (phase !== 'input') return
    setActiveBtn(id)
    track(setTimeout(() => setActiveBtn(null), 300))
    const newSeq = [...playerSeq, id]
    setPlayerSeq(newSeq)
    const pos = newSeq.length - 1
    if (sequence[pos] !== id) {
      errRef.current++
      setErrors(errRef.current)
      onProgress?.({ answered: correctTapsRef.current + errRef.current, total: 0, correct: correctTapsRef.current, errors: errRef.current, lastCorrect: false })
      setPhase('wrong')
      if (level > maxLevelRef.current) maxLevelRef.current = level
      if (errRef.current >= 3) {
        finish()
        return
      }
      track(setTimeout(() => flashSequence(sequence), 1200))
    } else {
      correctTapsRef.current++
      onProgress?.({ answered: correctTapsRef.current + errRef.current, total: 0, correct: correctTapsRef.current, errors: errRef.current, lastCorrect: true })
      if (newSeq.length === sequence.length) {
        if (level > maxLevelRef.current) maxLevelRef.current = level
        if (level >= 10) {
          finish()
          return
        }
        // Lock the grid between levels — 'watch' disables buttons (disabled={phase !== 'input'})
        // so a stray tap in the 800ms window can't run press() with pos===sequence.length.
        setPhase('watch')
        track(setTimeout(() => setLevel(l => l + 1), 800))
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{level}</div>
          <div className="text-xs text-white/50">مستوى</div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
          phase === 'watch' ? 'bg-amber-500/20 text-amber-400' :
          phase === 'input' ? 'bg-green-500/20 text-green-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {phase === 'watch' ? '👁 شاهد' : phase === 'input' ? '👆 كرر' : '❌ خطأ'}
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{errors}/3</div>
          <div className="text-xs text-white/50">أخطاء</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {COLORS.map(c => {
          const lit = activeBtn === c.id
          return (
            <button
              key={c.id}
              onClick={() => press(c.id)}
              disabled={phase !== 'input'}
              className={`w-36 h-36 rounded-3xl text-4xl flex items-center justify-center transition-all duration-150 border border-white/20
                ${phase === 'input' ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              style={{
                background: lit
                  ? `radial-gradient(circle at 35% 28%, ${c.lite}, ${c.base})`
                  : `linear-gradient(145deg, ${c.base}, ${c.base}CC)`,
                boxShadow: lit
                  ? `0 0 32px 7px ${c.base}99, inset 0 2px 10px rgba(255,255,255,0.45)`
                  : 'inset 0 2px 6px rgba(255,255,255,0.22), 0 8px 18px rgba(0,0,0,0.30)',
                transform: lit ? 'scale(1.08)' : 'scale(1)',
                opacity: lit ? 1 : phase === 'input' ? 0.94 : 0.72,
              }}
            >
              <span style={{ filter: lit ? 'drop-shadow(0 0 8px rgba(255,255,255,0.7))' : 'none' }}>{c.emoji}</span>
            </button>
          )
        })}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
