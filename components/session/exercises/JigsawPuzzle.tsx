'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Scene { name:string; emoji:string; svg:string; cols:number; rows:number }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── SVG Scenes (300×300 viewBox) ────────────────────────────────────────────
const S: Record<string, string> = {
rainbow: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#BFDBFE"/><rect x="0" y="240" width="300" height="60" fill="#4ADE80"/><path d="M10,260 Q150,30 290,260" fill="none" stroke="#DC2626" stroke-width="22"/><path d="M23,265 Q150,55 277,265" fill="none" stroke="#EA580C" stroke-width="19"/><path d="M36,270 Q150,80 264,270" fill="none" stroke="#CA8A04" stroke-width="16"/><path d="M49,275 Q150,105 251,275" fill="none" stroke="#16A34A" stroke-width="14"/><path d="M62,280 Q150,125 238,280" fill="none" stroke="#2563EB" stroke-width="12"/><path d="M75,285 Q150,145 225,285" fill="none" stroke="#7C3AED" stroke-width="10"/><ellipse cx="60" cy="60" rx="38" ry="24" fill="white"/><ellipse cx="240" cy="70" rx="42" ry="26" fill="white"/><ellipse cx="150" cy="40" rx="28" ry="18" fill="white"/></svg>`,

house: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#93C5FD"/><rect x="0" y="220" width="300" height="80" fill="#4ADE80"/><rect x="55" y="140" width="190" height="120" fill="#FEF3C7"/><polygon points="40,145 150,38 260,145" fill="#DC2626"/><rect x="118" y="198" width="64" height="62" fill="#92400E"/><circle cx="172" cy="229" r="5" fill="#FCD34D"/><rect x="72" y="158" width="48" height="42" fill="#93C5FD" rx="4"/><line x1="96" y1="158" x2="96" y2="200" stroke="#1E3A8A" stroke-width="2"/><line x1="72" y1="179" x2="120" y2="179" stroke="#1E3A8A" stroke-width="2"/><rect x="180" y="158" width="48" height="42" fill="#93C5FD" rx="4"/><line x1="204" y1="158" x2="204" y2="200" stroke="#1E3A8A" stroke-width="2"/><line x1="180" y1="179" x2="228" y2="179" stroke="#1E3A8A" stroke-width="2"/><circle cx="240" cy="65" r="32" fill="#FCD34D"/></svg>`,

fish: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#1D4ED8"/><polygon points="100,0 140,0 190,120 60,120" fill="#3B82F6" opacity="0.3"/><polygon points="200,0 240,0 290,150 160,150" fill="#3B82F6" opacity="0.2"/><ellipse cx="130" cy="155" rx="68" ry="42" fill="#F97316"/><polygon points="62,155 18,128 18,182" fill="#EA580C"/><circle cx="172" cy="142" r="13" fill="white"/><circle cx="175" cy="142" r="7" fill="#1E293B"/><ellipse cx="140" cy="155" rx="5" ry="38" fill="white" opacity="0.55"/><ellipse cx="118" cy="155" rx="5" ry="38" fill="white" opacity="0.38"/><ellipse cx="240" cy="95" rx="36" ry="22" fill="#60A5FA"/><polygon points="204,95 172,78 172,112" fill="#3B82F6"/><circle cx="258" cy="87" r="8" fill="white"/><circle cx="260" cy="87" r="4" fill="#1E293B"/><path d="M52,300 Q34,258 52,225 Q70,192 52,160" fill="none" stroke="#22C55E" stroke-width="7"/><path d="M262,300 Q282,265 262,235 Q242,205 262,175" fill="none" stroke="#16A34A" stroke-width="5"/><rect x="0" y="272" width="300" height="28" fill="#92400E"/><ellipse cx="80" cy="273" rx="32" ry="13" fill="#78350F"/><circle cx="130" cy="113" r="7" fill="none" stroke="#93C5FD" stroke-width="2"/><circle cx="142" cy="97" r="5" fill="none" stroke="#93C5FD" stroke-width="2"/></svg>`,

cat: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#FFF7ED"/><circle cx="150" cy="175" r="95" fill="#F59E0B"/><polygon points="78,103 55,48 125,98" fill="#F59E0B"/><polygon points="222,103 245,48 175,98" fill="#F59E0B"/><polygon points="78,103 62,58 120,98" fill="#FCD34D" opacity="0.7"/><polygon points="222,103 238,58 180,98" fill="#FCD34D" opacity="0.7"/><circle cx="118" cy="170" r="19" fill="white"/><circle cx="182" cy="170" r="19" fill="white"/><circle cx="120" cy="173" r="10" fill="#1E293B"/><circle cx="184" cy="173" r="10" fill="#1E293B"/><circle cx="122" cy="170" r="4" fill="white"/><circle cx="186" cy="170" r="4" fill="white"/><ellipse cx="150" cy="206" rx="22" ry="14" fill="#FDA4AF"/><path d="M128,205 Q150,226 172,205" fill="none" stroke="#1E293B" stroke-width="3"/><line x1="88" y1="200" x2="35" y2="188" stroke="#1E293B" stroke-width="2.5"/><line x1="88" y1="208" x2="35" y2="208" stroke="#1E293B" stroke-width="2.5"/><line x1="88" y1="216" x2="35" y2="228" stroke="#1E293B" stroke-width="2.5"/><line x1="212" y1="200" x2="265" y2="188" stroke="#1E293B" stroke-width="2.5"/><line x1="212" y1="208" x2="265" y2="208" stroke="#1E293B" stroke-width="2.5"/><line x1="212" y1="216" x2="265" y2="228" stroke="#1E293B" stroke-width="2.5"/></svg>`,

space: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#0F172A"/><circle cx="22" cy="32" r="2" fill="white"/><circle cx="65" cy="18" r="1.5" fill="white"/><circle cx="105" cy="45" r="2" fill="white"/><circle cx="185" cy="22" r="1.5" fill="white"/><circle cx="245" cy="55" r="2" fill="white"/><circle cx="282" cy="28" r="1.5" fill="white"/><circle cx="32" cy="125" r="1.5" fill="white"/><circle cx="268" cy="105" r="2" fill="white"/><circle cx="152" cy="28" r="1" fill="#FCD34D"/><circle cx="225" cy="210" r="58" fill="#F97316"/><ellipse cx="225" cy="210" rx="85" ry="22" fill="#FCD34D" opacity="0.45"/><circle cx="210" cy="196" r="8" fill="#EA580C" opacity="0.7"/><circle cx="240" cy="220" r="6" fill="#DC2626" opacity="0.6"/><path d="M122,265 L100,148 L150,95 L200,148 L178,265 Z" fill="#94A3B8"/><polygon points="150,95 128,130 172,130" fill="#EF4444"/><circle cx="150" cy="180" r="22" fill="#60A5FA"/><circle cx="150" cy="180" r="16" fill="#BFDBFE"/><path d="M100,148 L68,225 L102,225 Z" fill="#64748B"/><path d="M200,148 L232,225 L198,225 Z" fill="#64748B"/><ellipse cx="150" cy="268" rx="32" ry="17" fill="#FCD34D" opacity="0.9"/><ellipse cx="150" cy="280" rx="22" ry="22" fill="#F97316" opacity="0.7"/></svg>`,

garden: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#BAE6FD"/><rect x="0" y="215" width="300" height="85" fill="#4ADE80"/><rect x="0" y="215" width="300" height="18" fill="#16A34A"/><circle cx="90" cy="145" r="58" fill="#22C55E"/><circle cx="90" cy="105" r="42" fill="#16A34A"/><rect x="83" y="195" width="14" height="32" fill="#92400E"/><circle cx="210" cy="160" r="42" fill="#FDE68A"/><circle cx="210" cy="120" r="32" fill="#FCD34D"/><rect x="203" y="195" width="14" height="22" fill="#92400E"/><circle cx="163" cy="235" rx="18" ry="18" r="18" fill="#FCA5A5"/><circle cx="163" cy="215" r="13" fill="#F43F5E"/><circle cx="148" cy="230" r="13" fill="#F43F5E"/><circle cx="178" cy="230" r="13" fill="#F43F5E"/><circle cx="163" cy="245" r="13" fill="#F43F5E"/><circle cx="163" cy="230" r="11" fill="#FBBF24"/><circle cx="55" cy="252" r="16" fill="#A78BFA"/><circle cx="78" cy="248" r="13" fill="#8B5CF6"/><line x1="55" y1="268" x2="55" y2="288" stroke="#16A34A" stroke-width="3"/><line x1="78" y1="261" x2="78" y2="288" stroke="#16A34A" stroke-width="3"/><ellipse cx="248" cy="250" rx="14" ry="22" fill="#F97316" opacity="0.85"/></svg>`,

farm: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#FEF9C3"/><rect x="0" y="220" width="300" height="80" fill="#4ADE80"/><rect x="0" y="220" width="300" height="16" fill="#16A34A"/><circle cx="250" cy="55" r="35" fill="#FCD34D"/><rect x="20" y="135" width="90" height="100" fill="#EF4444"/><polygon points="20,135 65,75 110,135" fill="#7F1D1D"/><rect x="48" y="180" width="34" height="55" fill="#92400E"/><rect x="180" y="155" width="100" height="80" fill="#FEF3C7"/><polygon points="175,155 230,105 285,155" fill="#DC2626"/><rect x="205" y="195" width="25" height="40" fill="#92400E"/><ellipse cx="120" cy="235" rx="28" ry="22" fill="#1E293B"/><ellipse cx="110" cy="228" rx="18" ry="14" fill="#F59E0B"/><circle cx="108" cy="224" r="5" fill="#1E293B"/><ellipse cx="170" cy="240" rx="22" ry="16" fill="#F59E0B"/><circle cx="168" cy="235" r="5" fill="#1E293B"/><rect x="0" y="218" width="300" height="4" fill="#92400E" opacity="0.4"/></svg>`,

butterfly: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#ECFDF5"/><rect x="0" y="255" width="300" height="45" fill="#4ADE80"/><ellipse cx="75" cy="135" rx="68" ry="88" fill="#F97316"/><ellipse cx="75" cy="135" rx="50" ry="65" fill="#FCD34D"/><circle cx="75" cy="105" r="22" fill="#EA580C" opacity="0.6"/><ellipse cx="225" cy="135" rx="68" ry="88" fill="#A855F7"/><ellipse cx="225" cy="135" rx="50" ry="65" fill="#C084FC"/><circle cx="225" cy="105" r="22" fill="#7C3AED" opacity="0.6"/><ellipse cx="75" cy="210" rx="42" ry="52" fill="#22C55E"/><ellipse cx="225" cy="210" rx="42" ry="52" fill="#3B82F6"/><rect x="148" y="90" width="4" height="160" fill="#1E293B" rx="2"/><ellipse cx="150" cy="88" rx="10" ry="22" fill="#1E293B"/><line x1="148" y1="88" x2="120" y2="55" stroke="#1E293B" stroke-width="2.5"/><line x1="152" y1="88" x2="180" y2="55" stroke="#1E293B" stroke-width="2.5"/><circle cx="120" cy="52" r="4" fill="#1E293B"/><circle cx="180" cy="52" r="4" fill="#1E293B"/></svg>`,
}

const EASY_SCENES: Scene[] = [
  { name:'قوس قزح',  emoji:'🌈', cols:2, rows:2, svg: S.rainbow   },
  { name:'البيت',    emoji:'🏠', cols:2, rows:2, svg: S.house      },
  { name:'السمكة',   emoji:'🐟', cols:2, rows:2, svg: S.fish       },
  { name:'القطة',    emoji:'🐱', cols:2, rows:2, svg: S.cat        },
  { name:'الحديقة',  emoji:'🌸', cols:2, rows:2, svg: S.garden     },
  { name:'الفراشة',  emoji:'🦋', cols:2, rows:2, svg: S.butterfly  },
]
const MEDIUM_SCENES: Scene[] = [
  { name:'الفضاء',   emoji:'🚀', cols:3, rows:2, svg: S.space  },
  { name:'الحديقة',  emoji:'🌸', cols:3, rows:2, svg: S.garden },
  { name:'المزرعة',  emoji:'🐄', cols:3, rows:2, svg: S.farm   },
  { name:'السمكة',   emoji:'🐟', cols:3, rows:2, svg: S.fish   },
]
const HARD_SCENES: Scene[] = [
  { name:'الفضاء',   emoji:'🚀', cols:3, rows:3, svg: S.space      },
  { name:'الفراشة',  emoji:'🦋', cols:3, rows:3, svg: S.butterfly  },
  { name:'البيت',    emoji:'🏠', cols:3, rows:3, svg: S.house      },
  { name:'المزرعة',  emoji:'🐄', cols:3, rows:3, svg: S.farm       },
]

export default function JigsawPuzzle({ onComplete, onCancel, difficulty = 1, studentAge }: Props) {
  const scenes = useMemo(() => {
    if (difficulty === 1) return shuffle(EASY_SCENES)
    if (difficulty === 2) return shuffle(MEDIUM_SCENES)
    return shuffle(HARD_SCENES)
  }, [difficulty])

  const COUNT = difficulty === 1 ? (studentAge < 8 ? 3 : 5) : difficulty === 2 ? 4 : 5
  const subset = scenes.slice(0, COUNT)

  const [idx,       setIdx]       = useState(0)
  const [placed,    setPlaced]    = useState<(number|null)[]>([])
  const [scrambled, setScrambled] = useState<(number|null)[]>([])
  const [selected,  setSelected]  = useState<number|null>(null)
  const [phase,     setPhase]     = useState<'puzzle'|'done'>('puzzle')
  const [correct,   setCorrect]   = useState(0)
  const [startMs]                 = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const scene = subset[idx]
  const TOTAL  = scene.cols * scene.rows

  useEffect(() => {
    const ids = Array.from({ length: TOTAL }, (_, i) => i)
    setScrambled(shuffle(ids))
    setPlaced(Array(TOTAL).fill(null))
    setSelected(null)
    setPhase('puzzle')
  }, [idx, TOTAL])

  const isYoung = studentAge < 8
  const CELL = scene.cols === 3
    ? (isYoung ? 86 : 78)
    : (isYoung ? 118 : 106)

  const encoded = useMemo(() => encodeURIComponent(scene.svg), [scene])
  const bgW     = scene.cols * CELL
  const bgH     = scene.rows * CELL

  function pieceStyle(pieceIdx: number, size: number): React.CSSProperties {
    const c = pieceIdx % scene.cols
    const r = Math.floor(pieceIdx / scene.cols)
    return {
      backgroundImage:    `url("data:image/svg+xml,${encoded}")`,
      backgroundSize:     `${scene.cols * size}px ${scene.rows * size}px`,
      backgroundPosition: `${-c * size}px ${-r * size}px`,
    }
  }

  function tapBank(bi: number) {
    if (scrambled[bi] === null) return
    setSelected(bi)
  }

  function tapSlot(si: number) {
    if (selected === null || placed[si] !== null || phase !== 'puzzle') return
    const pieceIdx = scrambled[selected]!
    const np = [...placed];  np[si] = pieceIdx
    const ns = [...scrambled]; ns[selected] = null
    setPlaced(np); setScrambled(ns); setSelected(null)
    if (np.every(v => v !== null)) {
      const ok = np.every((v, i) => v === i)
      const nc = correct + (ok ? 1 : 0)
      if (ok) setCorrect(nc)
      setPhase('done')
      timerRef.current = setTimeout(() => {
        if (idx + 1 >= COUNT) {
          onComplete({
            exerciseType:'jigsaw-puzzle', exerciseLabelAr:'أكمل الصورة',
            score: Math.round((nc/COUNT)*100), accuracy: Math.round((nc/COUNT)*100),
            duration: Math.round((Date.now()-startMs)/1000), errors: COUNT-nc,
            metadata:{ total:COUNT, correct:nc, difficulty }, completedAt: new Date().toISOString(),
          })
        } else { setIdx(i => i+1) }
      }, 1800)
    }
  }

  const isComplete = placed.every(v => v !== null)
  const isCorrect  = isComplete && placed.every((v,i) => v === i)

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx+1}/{COUNT}</div>
          <div className="text-xs text-white/50">صورة</div>
        </div>
        <h2 className="text-xl font-black text-white">أكمل الصورة 🧩</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/COUNT)*100}%`, background:'#7C5CFC' }} />
      </div>

      {/* Row: mini preview + grid */}
      <div className="flex gap-5 items-start">
        {/* Complete image preview */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white/40 text-xs">النموذج</span>
          <div style={{
            width: 76, height: 76 * scene.rows / scene.cols,
            backgroundImage: `url("data:image/svg+xml,${encoded}")`,
            backgroundSize: '100% 100%',
            borderRadius: 8,
            border: '2px solid rgba(124,92,252,0.5)',
          }} />
          <span className="text-white/60 text-xs font-bold">{scene.emoji} {scene.name}</span>
        </div>

        {/* Target grid */}
        <div>
          <span className="text-white/40 text-xs block mb-1 text-center">اسحب القطع هنا</span>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${scene.cols},${CELL}px)`, gap:3 }}>
            {placed.map((pieceIdx, si) => {
              const filled = pieceIdx !== null
              const correct_slot = filled && pieceIdx === si
              return (
                <div key={si}
                  onClick={() => phase === 'puzzle' && tapSlot(si)}
                  className="flex items-center justify-center"
                  style={{
                    width: CELL, height: CELL, borderRadius: 8, overflow:'hidden',
                    border: `2.5px ${filled ? 'solid' : 'dashed'} ${
                      filled
                        ? isComplete ? (correct_slot ? '#22c55e' : '#ef4444') : 'rgba(107,70,240,0.7)'
                        : selected !== null ? 'rgba(107,70,240,0.5)' : 'rgba(255,255,255,0.15)'
                    }`,
                    background: filled ? undefined : 'rgba(255,255,255,0.04)',
                    cursor: !filled && phase==='puzzle' ? 'pointer' : 'default',
                    boxShadow: !filled && selected !== null ? '0 0 12px rgba(124,92,252,0.3)' : undefined,
                  }}>
                  {filled
                    ? <div style={{ width:CELL, height:CELL, ...pieceStyle(pieceIdx!, CELL) }} />
                    : <span className="text-white/20 text-lg font-black">{si+1}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {phase === 'done' && (
        <div className={`text-xl font-black ${isCorrect ? 'text-green-400' : 'text-amber-400'}`}>
          {isCorrect ? '✅ رائع! أكملت الصورة!' : '❌ ليس تماماً — حاول مرة أخرى'}
        </div>
      )}

      {/* Scrambled piece bank */}
      {phase === 'puzzle' && (
        <>
          <p className="text-white/50 text-xs">اختر قطعة ثم انقر على مكانها:</p>
          <div className="flex flex-wrap gap-2 justify-center" style={{ maxWidth: bgW + 40 }}>
            {scrambled.map((pieceIdx, bi) =>
              pieceIdx === null
                ? <div key={bi} style={{ width:CELL, height:CELL, opacity:0 }} />
                : (
                  <div key={bi}
                    onClick={() => tapBank(bi)}
                    style={{
                      width: CELL, height: CELL, borderRadius: 8, overflow:'hidden',
                      border: `3px solid ${selected === bi ? '#7C5CFC' : 'rgba(255,255,255,0.2)'}`,
                      boxShadow: selected === bi ? '0 0 18px rgba(124,92,252,0.7)' : 'none',
                      transform: selected === bi ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      ...pieceStyle(pieceIdx, CELL),
                    }}
                  />
                )
            )}
          </div>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
