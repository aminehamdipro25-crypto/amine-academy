'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

// Colors: index → hex
const COLORS4 = ['#ef4444','#3b82f6','#eab308','#22c55e']  // 4×4
const COLORS6 = ['#ef4444','#3b82f6','#eab308','#22c55e','#f97316','#a855f7']  // 6×6

// ── 4×4 Puzzles ──────────────────────────────────────────────────────────────
// Each puzzle: { sol: 16-length solution, hints: pre-filled indices }
const PUZZLES_4: { sol:number[]; hints:number[] }[] = [
  { sol:[0,1,2,3, 2,3,0,1, 1,0,3,2, 3,2,1,0], hints:[0,3,5,6,9,10,12,15] },
  { sol:[1,0,3,2, 3,2,1,0, 0,1,2,3, 2,3,0,1], hints:[1,2,4,7,8,11,13,14] },
  { sol:[2,3,0,1, 0,1,2,3, 3,2,1,0, 1,0,3,2], hints:[0,1,6,7,8,9,14,15] },
  { sol:[3,2,1,0, 1,0,3,2, 2,3,0,1, 0,1,2,3], hints:[0,3,4,5,10,11,12,15] },
  { sol:[0,1,2,3, 3,2,1,0, 1,0,3,2, 2,3,0,1], hints:[0,3,5,6,9,10,12,15] },
  { sol:[1,2,3,0, 2,3,0,1, 3,0,1,2, 0,1,2,3], hints:[0,2,5,7,8,10,13,15] },
]

// ── 6×6 Puzzles ──────────────────────────────────────────────────────────────
// solution indices 0-5, hints are fewer
const PUZZLES_6: { sol:number[]; hints:number[] }[] = [
  {
    sol:[0,1,2,3,4,5, 2,3,4,5,0,1, 4,5,0,1,2,3, 1,0,3,2,5,4, 3,2,5,4,1,0, 5,4,1,0,3,2],
    hints:[0,1,5,8,9,17,18,26,27,35,29,30]
  },
  {
    sol:[1,0,3,2,5,4, 3,2,5,4,1,0, 5,4,1,0,3,2, 0,1,2,3,4,5, 2,3,4,5,0,1, 4,5,0,1,2,3],
    hints:[0,1,5,6,11,12,17,18,23,24,29,35]
  },
]

// Validate: no row or column conflict
function getConflicts(grid: (number|null)[], size: number): Set<number> {
  const bad = new Set<number>()
  for (let r=0; r<size; r++) {
    const seen = new Map<number,number>()
    for (let c=0; c<size; c++) {
      const idx = r*size+c
      const v = grid[idx]
      if (v===null) continue
      if (seen.has(v)) { bad.add(idx); bad.add(seen.get(v)!) }
      else seen.set(v, idx)
    }
  }
  for (let c=0; c<size; c++) {
    const seen = new Map<number,number>()
    for (let r=0; r<size; r++) {
      const idx = r*size+c
      const v = grid[idx]
      if (v===null) continue
      if (seen.has(v)) { bad.add(idx); bad.add(seen.get(v)!) }
      else seen.set(v, idx)
    }
  }
  return bad
}

export default function ColorSudoku({ onComplete, onCancel, difficulty=1, studentAge, seed }: Props) {
  const rng    = useRef(createRng(seed ?? Date.now())).current
  const isYoung = studentAge < 9
  const size   = (difficulty===3 && !isYoung) ? 6 : 4
  const colors = size===6 ? COLORS6 : COLORS4
  const puzzles= useMemo(()=>shuffleWithRng(rng, size===6 ? PUZZLES_6 : PUZZLES_4),[size])
  const COUNT  = difficulty===1 ? 3 : difficulty===2 ? 4 : 5

  const [idx,      setIdx]    = useState(0)
  const [grid,     setGrid]   = useState<(number|null)[]>([])
  const [hints,    setHints]  = useState<Set<number>>(new Set())
  const [selCell,  setSelCell]= useState<number|null>(null)
  const [solution, setSol]    = useState<number[]>([])
  const [phase,    setPhase]  = useState<'play'|'done'>('play')
  const [correct,  setCorrect]= useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>()=>{ if(timerRef.current) clearTimeout(timerRef.current) },[])

  useEffect(()=>{
    const p = puzzles[idx % puzzles.length]
    const hset = new Set(p.hints)
    const g: (number|null)[] = p.sol.map((v,i)=> hset.has(i) ? v : null)
    setGrid(g)
    setHints(hset)
    setSol(p.sol)
    setSelCell(null)
    setPhase('play')
  },[idx, puzzles])

  const conflicts = useMemo(()=>getConflicts(grid, size),[grid, size])
  const CELL = size===6 ? (isYoung?56:48) : (isYoung?72:62)

  function tapCell(i:number) {
    if (hints.has(i)) return
    setSelCell(selCell===i ? null : i)
  }

  function pickColor(ci:number) {
    if (selCell===null) return
    const next = [...grid]
    next[selCell] = next[selCell]===ci ? null : ci
    setGrid(next)
    // Auto advance to next empty
    const nextEmpty = next.findIndex((v,i)=>v===null && !hints.has(i) && i>selCell)
    setSelCell(nextEmpty>=0 ? nextEmpty : null)
    // Auto-check if complete
    if (next.every(v=>v!==null)) {
      const ok = next.every((v,i)=>v===solution[i])
      const nc = correct + (ok?1:0)
      if (ok) setCorrect(nc)
      setPhase('done')
      timerRef.current = setTimeout(()=>{
        if (idx+1>=COUNT) {
          onComplete({
            exerciseType:'color-sudoku', exerciseLabelAr:'سودوكو الألوان',
            score: Math.round((nc/COUNT)*100), accuracy: Math.round((nc/COUNT)*100),
            duration: Math.round((Date.now()-startMs)/1000), errors: COUNT-nc,
            metadata:{ total:COUNT, correct:nc, difficulty, gridSize:size }, completedAt: new Date().toISOString(),
          })
        } else { setIdx(i=>i+1) }
      }, 2200)
    }
  }

  const isCorrect = phase==='done' && grid.every((v,i)=>v===solution[i])

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx+1}/{COUNT}</div>
          <div className="text-xs text-white/50">لغز</div>
        </div>
        <h2 className="text-xl font-black text-white">سودوكو الألوان 🎨</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/COUNT)*100}%`, background:'#7C5CFC' }} />
      </div>

      <p className="text-white/60 text-xs text-center">
        كل صف وعمود يجب أن يحتوي على كل الألوان مرة واحدة فقط
      </p>

      {/* Sudoku Grid */}
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(${size},${CELL}px)`,
        gap:3,
        padding:6,
        borderRadius:16,
        background:'rgba(255,255,255,0.05)',
        border:'2px solid rgba(255,255,255,0.12)',
      }}>
        {grid.map((v,i)=>{
          const isHint     = hints.has(i)
          const isSel      = selCell===i
          const isConflict = conflicts.has(i)
          let border = 'rgba(255,255,255,0.12)'
          if (isSel)      border = '#7C5CFC'
          if (isConflict) border = '#ef4444'
          const bg = v!==null ? colors[v] : isHint ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'
          return (
            <div key={i}
              onClick={()=>phase==='play' && tapCell(i)}
              style={{
                width:CELL, height:CELL, borderRadius:8,
                background: bg,
                border:`2.5px solid ${border}`,
                cursor: isHint ? 'default' : 'pointer',
                boxShadow: isSel ? '0 0 14px rgba(124,92,252,0.7)' : isConflict ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                transform: isSel ? 'scale(1.08)' : 'scale(1)',
                transition:'all 0.1s',
              }}>
              {v!==null && (
                <div style={{
                  width:CELL*0.6, height:CELL*0.6, borderRadius:'50%',
                  background:'rgba(255,255,255,0.35)',
                  boxShadow:'inset 0 2px 4px rgba(0,0,0,0.2)',
                }}/>
              )}
            </div>
          )
        })}
      </div>

      {/* Color palette */}
      {phase==='play' && selCell!==null && (
        <div>
          <p className="text-white/40 text-xs text-center mb-2">اختر لوناً للخلية المحددة</p>
          <div className="flex gap-3 justify-center">
            {colors.map((color,ci)=>(
              <button key={ci}
                onClick={()=>pickColor(ci)}
                className="rounded-full transition-all active:scale-90"
                style={{
                  width:52, height:52,
                  background: color,
                  border:`4px solid ${grid[selCell]===ci ? 'white' : 'rgba(255,255,255,0.2)'}`,
                  boxShadow: grid[selCell]===ci ? `0 0 18px ${color}` : 'none',
                  transform: grid[selCell]===ci ? 'scale(1.2)' : 'scale(1)',
                }}>
                <div style={{ width:'50%', height:'50%', borderRadius:'50%', background:'rgba(255,255,255,0.35)', margin:'auto' }}/>
              </button>
            ))}
            {/* Erase */}
            <button onClick={()=>{ if(selCell!==null){ const n=[...grid];n[selCell]=null;setGrid(n) }}}
              className="rounded-full border-4 text-white/60 font-black text-xl flex items-center justify-center transition-all active:scale-90"
              style={{ width:52, height:52, background:'rgba(255,255,255,0.08)', borderColor:'rgba(255,255,255,0.2)' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {phase==='play' && selCell===null && (
        <p className="text-white/40 text-xs text-center">انقر على خلية فارغة لاختيار لونها</p>
      )}

      {/* Conflict hint */}
      {phase==='play' && conflicts.size>0 && (
        <p className="text-red-400 text-xs text-center">⚠️ توجد ألوان متكررة في نفس الصف أو العمود</p>
      )}

      {/* Result */}
      {phase==='done' && (
        <div className={`text-xl font-black ${isCorrect ? 'text-green-400' : 'text-amber-400'}`}>
          {isCorrect ? '✅ ممتاز! حللت السودوكو!' : '❌ هناك أخطاء — حاول مرة أخرى'}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
