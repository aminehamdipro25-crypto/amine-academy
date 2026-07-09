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

interface Pattern { name:string; size:3|4|5; ref:(string|null)[] }

// null = empty (no dot), string = color hex
const R='#ef4444',B='#3b82f6',Y='#eab308',G='#22c55e',O='#f97316',P='#a855f7',K='#ec4899',N='#0f172a'

const EASY: Pattern[] = [
  { name:'القطر',     size:3, ref:[R,null,null, null,B,null, null,null,G] },
  { name:'الزاوية',   size:3, ref:[R,Y,null, B,null,null, null,null,null] },
  { name:'المثلث',    size:3, ref:[null,P,null, P,null,P, P,P,P] },
  { name:'الصف الأول',size:3, ref:[R,B,Y, null,null,null, null,null,null] },
  { name:'حرف L',     size:3, ref:[R,null,null, R,null,null, R,G,G] },
  { name:'التناظر',   size:3, ref:[O,null,O, null,Y,null, O,null,O] },
  { name:'الأعمدة',   size:3, ref:[R,B,G, R,B,G, null,null,null] },
  { name:'القطر المعكوس',size:3,ref:[null,null,B, null,G,null, Y,null,null] },
]

const MEDIUM: Pattern[] = [
  { name:'الإطار',    size:4, ref:[R,R,R,R, R,null,null,R, R,null,null,R, R,R,R,R] },
  { name:'رقعة الشطرنج',size:4, ref:[R,B,R,B, B,R,B,R, R,B,R,B, B,R,B,R] },
  { name:'القطر الرباعي',size:4,ref:[R,null,null,null, null,B,null,null, null,null,G,null, null,null,null,Y] },
  { name:'الأسطر',    size:4, ref:[R,R,R,R, B,B,B,B, G,G,G,G, Y,Y,Y,Y] },
  { name:'الصليب',    size:4, ref:[null,R,R,null, R,R,R,R, R,R,R,R, null,R,R,null] },
  { name:'الأركان الملونة',size:4,ref:[R,null,null,B, null,G,Y,null, null,Y,G,null, B,null,null,R] },
  { name:'الخطوط المتناوبة',size:4,ref:[R,null,R,null, null,B,null,B, G,null,G,null, null,Y,null,Y] },
]

const HARD: Pattern[] = [
  { name:'الأعمدة الملونة',size:5,ref:[R,B,Y,G,O, R,B,Y,G,O, R,B,Y,G,O, null,null,null,null,null, null,null,null,null,null] },
  { name:'التناظر الكامل', size:5,ref:[R,null,B,null,R, null,G,null,G,null, Y,null,O,null,Y, null,G,null,G,null, R,null,B,null,R] },
  { name:'النجمة',         size:5,ref:[null,Y,null,Y,null, Y,Y,Y,Y,Y, null,Y,Y,Y,null, null,null,Y,null,null, null,null,Y,null,null] },
  { name:'قوس قزح',        size:5,ref:[R,R,R,R,R, O,O,O,O,O, Y,Y,Y,Y,Y, G,G,G,G,G, B,B,B,B,B] },
  { name:'الفراشة',        size:5,ref:[P,P,null,K,K, P,null,null,null,K, null,null,Y,null,null, B,null,null,null,G, B,B,null,G,G] },
  { name:'الحرف X',        size:5,ref:[R,null,null,null,R, null,B,null,B,null, null,null,G,null,null, null,B,null,B,null, R,null,null,null,R] },
]

function shuffle<T>(arr:T[], rng: Rng):T[] { return shuffleWithRng(rng, arr) }

export default function PatternBoard({ onComplete, onCancel, difficulty=1, studentAge, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const patterns = useMemo(()=>{
    if (difficulty===1) return shuffle(EASY, rng)
    if (difficulty===2) return shuffle(MEDIUM, rng)
    return shuffle(HARD, rng)
  },[difficulty])

  const COUNT  = difficulty===1 ? (studentAge<7 ? 4 : 6) : difficulty===2 ? 5 : 6
  const subset = patterns.slice(0, COUNT)

  const [idx,      setIdx]     = useState(0)
  const [userGrid, setUser]    = useState<(string|null)[]>([])
  const [selColor, setSel]     = useState<string>(R)
  const [phase,    setPhase]   = useState<'fill'|'check'>('fill')
  const [correct,  setCorrect] = useState(0)
  const [startMs]              = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>()=>{ if(timerRef.current) clearTimeout(timerRef.current) },[])

  const p = subset[idx]

  useEffect(()=>{
    setUser(Array(p.ref.length).fill(null))
    setSel(R)
    setPhase('fill')
  },[idx, p.ref.length])

  // colors used in this pattern
  const palette = useMemo(()=>[...new Set(p.ref.filter(Boolean) as string[])],[p])

  const cellSize = p.size===3 ? 68 : p.size===4 ? 56 : 44
  const dotR     = p.size===3 ? 26 : p.size===4 ? 20 : 16

  function tapCell(i:number) {
    if (phase!=='fill') return
    const next = [...userGrid]
    if (selColor==='__erase') { next[i]=null }
    else { next[i] = next[i]===selColor ? null : selColor }
    setUser(next)
  }

  function submit() {
    const ok = p.ref.every((refCell,i) => refCell === userGrid[i])
    const nc = correct + (ok ? 1 : 0)
    if (ok) setCorrect(nc)
    onProgress?.({ answered: idx + 1, total: COUNT, correct: nc, errors: (idx + 1) - nc, lastCorrect: ok })
    setPhase('check')
    timerRef.current = setTimeout(()=>{
      if (idx+1 >= COUNT) {
        onComplete({
          exerciseType:'pattern-board', exerciseLabelAr:'انسخ النمط',
          score: Math.round((nc/COUNT)*100), accuracy: Math.round((nc/COUNT)*100),
          duration: Math.round((Date.now()-startMs)/1000), errors: COUNT-nc,
          metadata:{ total:COUNT, correct:nc, difficulty }, completedAt: new Date().toISOString(),
        })
      } else { setIdx(i=>i+1) }
    }, 2000)
  }

  const isCorrect = phase==='check' && p.ref.every((c,i)=>c===userGrid[i])

  return (
    <div className="flex flex-col items-center gap-4 p-5 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx+1}/{COUNT}</div>
          <div className="text-xs text-white/50">نمط</div>
        </div>
        <h2 className="text-xl font-black text-white">انسخ النمط 🎯</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/COUNT)*100}%`, background:'#7C5CFC' }} />
      </div>

      <p className="text-white font-bold text-sm">{p.name}</p>

      {/* Side-by-side reference + working grid */}
      <div className="flex gap-5 items-start">
        {/* Reference card */}
        <div>
          <p className="text-white/40 text-xs text-center mb-1.5">👆 النموذج</p>
          <div className="rounded-2xl p-2.5" style={{ background:'rgba(255,255,255,0.06)', border:'2px solid rgba(124,92,252,0.4)' }}>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${p.size},${cellSize}px)`, gap:4 }}>
              {p.ref.map((cell,i)=>(
                <div key={i} style={{ width:cellSize, height:cellSize, borderRadius:8,
                  background:'rgba(255,255,255,0.04)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {cell && <div style={{ width:dotR*2, height:dotR*2, borderRadius:'50%', background:cell, boxShadow:`0 2px 10px ${cell}99` }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Working grid */}
        <div>
          <p className="text-white/40 text-xs text-center mb-1.5">🖐️ ارسم هنا</p>
          <div className="rounded-2xl p-2.5" style={{ background:'rgba(255,255,255,0.03)', border:'2px dashed rgba(255,255,255,0.15)' }}>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${p.size},${cellSize}px)`, gap:4 }}>
              {userGrid.map((cell,i)=>{
                const refCell = p.ref[i]
                let borderColor = 'rgba(255,255,255,0.1)'
                if (phase==='check') {
                  if (refCell===null && cell===null) borderColor='rgba(255,255,255,0.1)'
                  else if (refCell===cell) borderColor='#22c55e'
                  else borderColor='#ef4444'
                }
                return (
                  <button key={i}
                    onClick={()=>tapCell(i)}
                    disabled={phase!=='fill'}
                    style={{ width:cellSize, height:cellSize, borderRadius:8,
                      background:'rgba(255,255,255,0.05)', border:`2px solid ${borderColor}`,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    {cell && <div style={{ width:dotR*2, height:dotR*2, borderRadius:'50%', background:cell, boxShadow:`0 2px 10px ${cell}99` }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Palette */}
      {phase==='fill' && (
        <div className="flex gap-2 flex-wrap justify-center mt-1">
          {palette.map(color=>(
            <button key={color}
              onClick={()=>setSel(color)}
              className="rounded-full transition-all active:scale-90"
              style={{ width:44, height:44,
                background:color,
                border:`4px solid ${selColor===color ? 'white' : 'transparent'}`,
                boxShadow: selColor===color ? `0 0 18px ${color}` : 'none',
                transform: selColor===color ? 'scale(1.25)' : 'scale(1)',
              }} />
          ))}
          {/* Eraser */}
          <button
            onClick={()=>setSel('__erase')}
            className="rounded-full border-4 text-white/70 font-black text-xl transition-all active:scale-90 flex items-center justify-center"
            style={{ width:44, height:44,
              background:'rgba(255,255,255,0.1)',
              borderColor: selColor==='__erase' ? 'white' : 'rgba(255,255,255,0.2)',
              transform: selColor==='__erase' ? 'scale(1.25)' : 'scale(1)',
            }}>✕</button>
        </div>
      )}

      {/* Submit */}
      {phase==='fill' && (
        <button onClick={submit}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 mt-1"
          style={{ background:'linear-gradient(135deg,#7C5CFC,#5B3FD4)' }}>
          تحقق ✓
        </button>
      )}

      {/* Result */}
      {phase==='check' && (
        <div className={`text-xl font-black ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {isCorrect ? '✅ ممتاز! نسخت النمط بشكل صحيح!' : '❌ ليس تماماً — انظر الخلايا الحمراء'}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
