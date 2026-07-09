'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

// Each puzzle: a 2×2 or 3×3 grid of emoji pieces
// The pieces are scrambled — the student taps in the correct order (1→2→3…)
interface Puzzle {
  name:    string
  emoji:   string      // the big preview emoji
  grid:    string[]    // pieces in CORRECT order (top-left to bottom-right)
  size:    2 | 3       // 2=2×2 (4 pieces), 3=3×3 (9 pieces)
  hint:    string
}

// ── EASY — 2×2 grids (4 pieces) ──────────────────────────────────────────────
const EASY: Puzzle[] = [
  {
    name:'وجه سعيد', emoji:'😊', size:2,
    grid:['👁️','👁️','👃','😁'],
    hint:'رتّب قطع الوجه السعيد من اليسار لليمين'
  },
  {
    name:'منزل', emoji:'🏠', size:2,
    grid:['🔺','🔺','🟦','🚪'],
    hint:'رتّب قطع البيت — السقف أولاً'
  },
  {
    name:'شمس وسحاب', emoji:'⛅', size:2,
    grid:['☁️','☀️','🌱','🌿'],
    hint:'السماء فوق، الأرض تحت'
  },
  {
    name:'قطة', emoji:'🐱', size:2,
    grid:['👂','👂','😺','🐾'],
    hint:'الأذنان فوق، الوجه تحت'
  },
  {
    name:'شجرة', emoji:'🌳', size:2,
    grid:['🍃','🍃','🟤','🌿'],
    hint:'الأوراق فوق، الجذع تحت'
  },
  {
    name:'كعكة عيد', emoji:'🎂', size:2,
    grid:['🕯️','🕯️','🎂','🍰'],
    hint:'الشمعتان فوق، الكعكة تحت'
  },
]

// ── MEDIUM — 3×3 grids (9 pieces) ────────────────────────────────────────────
const MEDIUM: Puzzle[] = [
  {
    name:'الفصول الأربعة', emoji:'🌍', size:3,
    grid:['🌸','🌞','🍂','💐','🌴','🍁','❄️','☃️','🌱'],
    hint:'ربيع — صيف — خريف — شتاء'
  },
  {
    name:'المزرعة', emoji:'🐄', size:3,
    grid:['☀️','🌤️','🌈','🐄','🐑','🐓','🌾','🌾','🌾'],
    hint:'السماء فوق، الحيوانات في الوسط، المحصول تحت'
  },
  {
    name:'البحر', emoji:'🌊', size:3,
    grid:['⛵','☀️','🐦','🐠','🌊','🦀','🐚','🐙','🪸'],
    hint:'فوق الماء — داخل الماء — قاع البحر'
  },
  {
    name:'المدينة', emoji:'🏙️', size:3,
    grid:['☁️','🌤️','☁️','🏢','🏦','🏪','🚗','🚌','🚶'],
    hint:'السماء — المباني — الشارع'
  },
  {
    name:'حديقة الحيوانات', emoji:'🦁', size:3,
    grid:['🦁','🐘','🦒','🐒','🦓','🦏','🐊','🦅','🦋'],
    hint:'حيوانات كبيرة — متوسطة — صغيرة'
  },
  {
    name:'الفضاء', emoji:'🚀', size:3,
    grid:['⭐','🌟','✨','🌙','🚀','🛸','🌍','☄️','🪐'],
    hint:'النجوم — المركبات — الكواكب'
  },
]

// ── HARD — 3×3 with abstract/logic patterns ───────────────────────────────────
const HARD: Puzzle[] = [
  {
    name:'الألوان بالترتيب', emoji:'🎨', size:3,
    grid:['🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪'],
    hint:'ألوان قوس قزح من الأحمر للبنفسجي'
  },
  {
    name:'الأرقام من 1 إلى 9', emoji:'🔢', size:3,
    grid:['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'],
    hint:'من الأصغر للأكبر — كل صف ثلاثة أرقام'
  },
  {
    name:'الحيوانات بالحجم', emoji:'🐘', size:3,
    grid:['🐘','🦛','🦏','🐄','🐖','🐑','🐰','🐹','🐜'],
    hint:'من الأكبر للأصغر — ثلاث فئات'
  },
  {
    name:'النباتات بالنمو', emoji:'🌱', size:3,
    grid:['🌱','🌿','🌾','🌸','🌳','🌲','🍂','🍁','🍃'],
    hint:'مراحل النمو — بداية، وسط، نهاية'
  },
]

function shuffle<T>(arr: T[], rng: Rng): T[] { return shuffleWithRng(rng, arr) }

export default function PicturePuzzle({ onComplete, onCancel, difficulty = 1, studentAge, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const puzzles = useMemo<Puzzle[]>(() => {
    if (difficulty === 1) return shuffle(EASY, rng)
    if (difficulty === 2) return shuffle([...EASY.slice(0,2), ...MEDIUM], rng)
    return shuffle([...MEDIUM, ...HARD], rng)
  }, [difficulty])

  const isYoung = studentAge < 8
  const count   = difficulty === 1 ? (isYoung ? 3 : 5) : difficulty === 2 ? 6 : 8
  const subset  = puzzles.slice(0, count)

  const [idx,       setIdx]     = useState(0)
  const [scrambled, setScrambled] = useState<string[]>([])
  const [placed,    setPlaced]  = useState<(string|null)[]>([])
  const [selected,  setSelected] = useState<number | null>(null) // index in scrambled
  const [phase,     setPhase]   = useState<'puzzle'|'done'>('puzzle')
  const [correct,   setCorrect] = useState(0)
  const [startMs]               = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const p = subset[idx]

  // Reset puzzle when idx changes
  useEffect(() => {
    const s = shuffle([...p.grid], rng)
    setScrambled(s)
    setPlaced(Array(p.grid.length).fill(null))
    setSelected(null)
    setPhase('puzzle')
  }, [idx]) // eslint-disable-line

  function tapScrambled(i: number) {
    if (scrambled[i] === '') return   // already used
    setSelected(i)
  }

  function tapSlot(slotIdx: number) {
    if (selected === null) return
    if (placed[slotIdx] !== null) return  // slot taken

    const piece = scrambled[selected]
    const newPlaced = [...placed]
    newPlaced[slotIdx] = piece

    const newScrambled = [...scrambled]
    newScrambled[selected] = ''   // mark as used

    setPlaced(newPlaced)
    setScrambled(newScrambled)
    setSelected(null)

    // Check complete
    if (newPlaced.every(v => v !== null)) {
      const isCorrect = newPlaced.every((v, i) => v === p.grid[i])
      const nc = correct + (isCorrect ? 1 : 0)
      if (isCorrect) setCorrect(nc)
      setPhase('done')
      onProgress?.({ answered: idx + 1, total: count, correct: nc, errors: (idx + 1) - nc, lastCorrect: isCorrect })

      timerRef.current = setTimeout(() => {
        if (idx + 1 >= count) {
          onComplete({
            exerciseType:    'picture-puzzle',
            exerciseLabelAr: 'أكمل الأحجية',
            score:    Math.round((nc / count) * 100),
            accuracy: Math.round((nc / count) * 100),
            duration: Math.round((Date.now() - startMs) / 1000),
            errors:   count - nc,
            metadata: { total: count, correct: nc, difficulty },
            completedAt: new Date().toISOString(),
          })
        } else {
          setIdx(i => i + 1)
        }
      }, 1600)
    }
  }

  const cols    = p.size
  const cellPx  = isYoung ? 70 : 60
  const emojipx = isYoung ? 30 : 26
  const isComplete = placed.every(v => v !== null)
  const isCorrect  = isComplete && placed.every((v, i) => v === p.grid[i])

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx+1}/{count}</div>
          <div className="text-xs text-white/50">أحجية</div>
        </div>
        <h2 className="text-xl font-black text-white">أكمل الأحجية</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/count)*100}%`, background:'#7C5CFC' }} />
      </div>

      {/* Puzzle name */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">{p.emoji}</span>
        <span className="text-white font-black text-lg">{p.name}</span>
      </div>
      <p className="text-white/50 text-xs text-center">{p.hint}</p>

      {/* ── GRID (drop slots) ── */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
        {placed.map((piece, si) => (
          <button
            key={si}
            onClick={() => phase === 'puzzle' && tapSlot(si)}
            disabled={piece !== null || phase !== 'puzzle'}
            className="rounded-xl flex items-center justify-center border-2 transition-all duration-150"
            style={{
              width:   cellPx, height: cellPx,
              background: piece
                ? isComplete
                  ? (piece === p.grid[si] ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)')
                  : 'rgba(107,70,240,0.2)'
                : 'rgba(255,255,255,0.06)',
              borderColor: piece
                ? isComplete
                  ? (piece === p.grid[si] ? '#22c55e' : '#ef4444')
                  : 'rgba(107,70,240,0.6)'
                : (selected !== null ? 'rgba(107,70,240,0.5)' : 'rgba(255,255,255,0.12)'),
              borderStyle: piece ? 'solid' : 'dashed',
              fontSize: emojipx,
            }}
          >
            {piece ?? <span className="text-white/20 text-lg">{si+1}</span>}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {phase === 'done' && (
        <div className="text-2xl font-black" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
          {isCorrect ? '✅ رائع! رتّبتها بشكل صحيح!' : '❌ ليس تماماً — حاول مرة أخرى'}
        </div>
      )}

      {/* ── SCRAMBLED PIECES ── */}
      {phase === 'puzzle' && (
        <>
          <p className="text-white/60 text-xs">اختر قطعة ثم انقر على المكان المناسب:</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {scrambled.map((piece, pi) => (
              <button
                key={pi}
                onClick={() => piece && tapScrambled(pi)}
                disabled={!piece}
                className="rounded-xl border-2 flex items-center justify-center transition-all duration-150 active:scale-95"
                style={{
                  width: cellPx, height: cellPx,
                  fontSize: emojipx,
                  background: !piece
                    ? 'transparent'
                    : selected === pi
                    ? 'rgba(107,70,240,0.4)'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: !piece
                    ? 'transparent'
                    : selected === pi
                    ? '#7C5CFC'
                    : 'rgba(255,255,255,0.2)',
                  opacity: piece ? 1 : 0,
                }}
              >
                {piece}
              </button>
            ))}
          </div>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
