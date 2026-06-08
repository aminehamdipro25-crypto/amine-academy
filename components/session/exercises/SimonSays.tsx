'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

const COLORS = [
  { id: 0, bg: 'bg-red-500',    active: 'bg-red-300',    label: 'أحمر',   emoji: '🔴' },
  { id: 1, bg: 'bg-blue-500',   active: 'bg-blue-300',   label: 'أزرق',   emoji: '🔵' },
  { id: 2, bg: 'bg-green-500',  active: 'bg-green-300',  label: 'أخضر',   emoji: '🟢' },
  { id: 3, bg: 'bg-yellow-400', active: 'bg-yellow-200', label: 'أصفر',   emoji: '🟡' },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function SimonSays({ onComplete, onCancel, studentAge, difficulty = 1 }: Props) {
  const startLen = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const [sequence, setSequence] = useState<number[]>([])
  const [activeBtn, setActiveBtn] = useState<number | null>(null)
  const [phase, setPhase] = useState<'watch'|'input'|'wrong'|'done'>('watch')
  const [playerSeq, setPlayerSeq] = useState<number[]>([])
  const [level, setLevel] = useState(1)
  const [errors, setErrors] = useState(0)
  const [maxLevel, setMaxLevel] = useState(0)
  const startRef = useRef(Date.now())

  const flashSequence = useCallback(async (seq: number[]) => {
    setPhase('watch')
    await new Promise(r => setTimeout(r, 800))
    for (const c of seq) {
      setActiveBtn(c)
      await new Promise(r => setTimeout(r, 700))
      setActiveBtn(null)
      await new Promise(r => setTimeout(r, 350))
    }
    setPhase('input')
    setPlayerSeq([])
  }, [])

  useEffect(() => {
    const len = startLen + level - 1
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4))
    setSequence(seq)
    setTimeout(() => flashSequence(seq), 500)
  }, [level, startLen, flashSequence])

  function press(id: number) {
    if (phase !== 'input') return
    setActiveBtn(id)
    setTimeout(() => setActiveBtn(null), 300)
    const newSeq = [...playerSeq, id]
    setPlayerSeq(newSeq)
    const pos = newSeq.length - 1
    if (sequence[pos] !== id) {
      setErrors(e => e + 1)
      setPhase('wrong')
      if (level > maxLevel) setMaxLevel(level)
      if (errors >= 2) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType: 'simon-says',
          exerciseLabelAr: 'سايمون يقول — تسلسل الألوان',
          score: Math.min(100, maxLevel * 12),
          accuracy: Math.round(((level - 1) / (level - 1 + errors + 1)) * 100),
          duration: dur,
          errors,
          metadata: { maxLevel, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => flashSequence(sequence), 1200)
    } else if (newSeq.length === sequence.length) {
      if (level > maxLevel) setMaxLevel(level)
      if (level >= 10) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        setPhase('done')
        onComplete({
          exerciseType: 'simon-says',
          exerciseLabelAr: 'سايمون يقول — تسلسل الألوان',
          score: 100,
          accuracy: Math.round((level / (level + errors)) * 100),
          duration: dur,
          errors,
          metadata: { maxLevel: level, difficulty },
          completedAt: new Date().toISOString(),
        })
        return
      }
      setTimeout(() => setLevel(l => l + 1), 800)
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
        {COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => press(c.id)}
            disabled={phase !== 'input'}
            className={`w-36 h-36 rounded-3xl text-4xl font-black flex items-center justify-center transition-all duration-150
              ${activeBtn === c.id ? c.active + ' scale-110 shadow-2xl' : c.bg + ' opacity-70'}
              ${phase === 'input' ? 'cursor-pointer hover:opacity-100 active:scale-95' : 'cursor-default'}
            `}
          >
            {c.emoji}
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
