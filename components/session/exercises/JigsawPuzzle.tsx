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

const S: Record<string,string> = {
rainbow:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#BFDBFE"/><rect x="0" y="240" width="300" height="60" fill="#4ADE80"/><path d="M10,260 Q150,30 290,260" fill="none" stroke="#DC2626" stroke-width="22"/><path d="M23,265 Q150,55 277,265" fill="none" stroke="#EA580C" stroke-width="19"/><path d="M36,270 Q150,80 264,270" fill="none" stroke="#CA8A04" stroke-width="16"/><path d="M49,275 Q150,105 251,275" fill="none" stroke="#16A34A" stroke-width="14"/><path d="M62,280 Q150,125 238,280" fill="none" stroke="#2563EB" stroke-width="12"/><path d="M75,285 Q150,145 225,285" fill="none" stroke="#7C3AED" stroke-width="10"/><ellipse cx="60" cy="60" rx="38" ry="24" fill="white"/><ellipse cx="240" cy="70" rx="42" ry="26" fill="white"/><ellipse cx="150" cy="40" rx="28" ry="18" fill="white"/></svg>`,
house:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#93C5FD"/><rect x="0" y="220" width="300" height="80" fill="#4ADE80"/><rect x="55" y="140" width="190" height="120" fill="#FEF3C7"/><polygon points="40,145 150,38 260,145" fill="#DC2626"/><rect x="118" y="198" width="64" height="62" fill="#92400E"/><circle cx="172" cy="229" r="5" fill="#FCD34D"/><rect x="72" y="158" width="48" height="42" fill="#93C5FD" rx="4"/><line x1="96" y1="158" x2="96" y2="200" stroke="#1E3A8A" stroke-width="2"/><line x1="72" y1="179" x2="120" y2="179" stroke="#1E3A8A" stroke-width="2"/><rect x="180" y="158" width="48" height="42" fill="#93C5FD" rx="4"/><line x1="204" y1="158" x2="204" y2="200" stroke="#1E3A8A" stroke-width="2"/><line x1="180" y1="179" x2="228" y2="179" stroke="#1E3A8A" stroke-width="2"/><circle cx="240" cy="65" r="32" fill="#FCD34D"/></svg>`,
fish:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#1D4ED8"/><ellipse cx="130" cy="155" rx="68" ry="42" fill="#F97316"/><polygon points="62,155 18,128 18,182" fill="#EA580C"/><circle cx="172" cy="142" r="13" fill="white"/><circle cx="175" cy="142" r="7" fill="#1E293B"/><ellipse cx="240" cy="95" rx="36" ry="22" fill="#60A5FA"/><rect x="0" y="272" width="300" height="28" fill="#92400E"/></svg>`,
cat:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#FFF7ED"/><circle cx="150" cy="175" r="95" fill="#F59E0B"/><polygon points="78,103 55,48 125,98" fill="#F59E0B"/><polygon points="222,103 245,48 175,98" fill="#F59E0B"/><polygon points="78,103 62,58 120,98" fill="#FCD34D" opacity="0.7"/><polygon points="222,103 238,58 180,98" fill="#FCD34D" opacity="0.7"/><circle cx="118" cy="170" r="19" fill="white"/><circle cx="182" cy="170" r="19" fill="white"/><circle cx="120" cy="173" r="10" fill="#1E293B"/><circle cx="184" cy="173" r="10" fill="#1E293B"/><circle cx="122" cy="170" r="4" fill="white"/><circle cx="186" cy="170" r="4" fill="white"/><ellipse cx="150" cy="206" rx="22" ry="14" fill="#FDA4AF"/><path d="M128,205 Q150,226 172,205" fill="none" stroke="#1E293B" stroke-width="3"/></svg>`,
space:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#0F172A"/><circle cx="22" cy="32" r="2" fill="white"/><circle cx="65" cy="18" r="1.5" fill="white"/><circle cx="185" cy="22" r="1.5" fill="white"/><circle cx="245" cy="55" r="2" fill="white"/><circle cx="225" cy="210" r="58" fill="#F97316"/><ellipse cx="225" cy="210" rx="85" ry="22" fill="#FCD34D" opacity="0.45"/><path d="M122,265 L100,148 L150,95 L200,148 L178,265 Z" fill="#94A3B8"/><polygon points="150,95 128,130 172,130" fill="#EF4444"/><circle cx="150" cy="180" r="22" fill="#60A5FA"/></svg>`,
garden:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#BAE6FD"/><rect x="0" y="215" width="300" height="85" fill="#4ADE80"/><circle cx="90" cy="145" r="58" fill="#22C55E"/><circle cx="90" cy="105" r="42" fill="#16A34A"/><rect x="83" y="195" width="14" height="32" fill="#92400E"/><circle cx="210" cy="160" r="42" fill="#FDE68A"/><circle cx="210" cy="120" r="32" fill="#FCD34D"/><rect x="203" y="195" width="14" height="22" fill="#92400E"/></svg>`,
farm:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#FEF9C3"/><rect x="0" y="220" width="300" height="80" fill="#4ADE80"/><circle cx="250" cy="55" r="35" fill="#FCD34D"/><rect x="20" y="135" width="90" height="100" fill="#EF4444"/><polygon points="20,135 65,75 110,135" fill="#7F1D1D"/><rect x="48" y="180" width="34" height="55" fill="#92400E"/><rect x="180" y="155" width="100" height="80" fill="#FEF3C7"/><polygon points="175,155 230,105 285,155" fill="#DC2626"/></svg>`,
butterfly:`<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#ECFDF5"/><rect x="0" y="255" width="300" height="45" fill="#4ADE80"/><ellipse cx="75" cy="135" rx="68" ry="88" fill="#F97316"/><ellipse cx="75" cy="135" rx="50" ry="65" fill="#FCD34D"/><circle cx="75" cy="105" r="22" fill="#EA580C" opacity="0.6"/><ellipse cx="225" cy="135" rx="68" ry="88" fill="#A855F7"/><ellipse cx="225" cy="135" rx="50" ry="65" fill="#C084FC"/><circle cx="225" cy="105" r="22" fill="#7C3AED" opacity="0.6"/><ellipse cx="75" cy="210" rx="42" ry="52" fill="#22C55E"/><ellipse cx="225" cy="210" rx="42" ry="52" fill="#3B82F6"/><rect x="148" y="90" width="4" height="160" fill="#1E293B" rx="2"/></svg>`,
}

const EASY_SCENES: Scene[] = [
  { name:'قوس قزح', emoji:'🌈', cols:2, rows:2, svg:S.rainbow  },
  { name:'البيت',   emoji:'🏠', cols:2, rows:2, svg:S.house     },
  { name:'السمكة',  emoji:'🐟', cols:2, rows:2, svg:S.fish      },
  { name:'القطة',   emoji:'🐱', cols:2, rows:2, svg:S.cat       },
  { name:'الحديقة', emoji:'🌸', cols:2, rows:2, svg:S.garden    },
  { name:'الفراشة', emoji:'🦋', cols:2, rows:2, svg:S.butterfly },
]
const MEDIUM_SCENES: Scene[] = [
  { name:'الفضاء',  emoji:'🚀', cols:3, rows:2, svg:S.space  },
  { name:'الحديقة', emoji:'🌸', cols:3, rows:2, svg:S.garden },
  { name:'المزرعة', emoji:'🐄', cols:3, rows:2, svg:S.farm   },
  { name:'السمكة',  emoji:'🐟', cols:3, rows:2, svg:S.fish   },
]
const HARD_SCENES: Scene[] = [
  { name:'الفضاء',  emoji:'🚀', cols:3, rows:3, svg:S.space     },
  { name:'الفراشة', emoji:'🦋', cols:3, rows:3, svg:S.butterfly },
  { name:'البيت',   emoji:'🏠', cols:3, rows:3, svg:S.house     },
  { name:'المزرعة', emoji:'🐄', cols:3, rows:3, svg:S.farm      },
]

// ── Jigsaw shape helpers ─────────────────────────────────────────────────────

// [N, E, S, W]: +1=tab out, -1=blank in, 0=flat edge
function pieceTabs(r: number, c: number, rows: number, cols: number): [number,number,number,number] {
  return [
    r === 0        ? 0 : -1,
    c === cols - 1 ? 0 :  1,
    r === rows - 1 ? 0 :  1,
    c === 0        ? 0 : -1,
  ]
}

// Generates an SVG path string for a jigsaw piece of size cell×cell
function jigsawPath(cell: number, N: number, E: number, S: number, W: number): string {
  const m  = cell / 2
  const d  = cell * 0.22   // tab depth
  const hw = cell * 0.17   // half tab width

  let p = `M 0 0`

  // Top (→): N=+1 tab goes UP, N=-1 blank dips DOWN into piece
  if (N === 0) { p += ` L ${cell} 0` }
  else {
    const yd = -N * d
    p += ` L ${m-hw} 0 C ${m-hw} ${yd*0.5} ${m-hw/2} ${yd} ${m} ${yd}`
    p += ` C ${m+hw/2} ${yd} ${m+hw} ${yd*0.5} ${m+hw} 0 L ${cell} 0`
  }

  // Right (↓): E=+1 tab goes RIGHT, E=-1 blank dips LEFT
  if (E === 0) { p += ` L ${cell} ${cell}` }
  else {
    const xd = cell + E * d
    p += ` L ${cell} ${m-hw} C ${cell+E*d*0.5} ${m-hw} ${xd} ${m-hw/2} ${xd} ${m}`
    p += ` C ${xd} ${m+hw/2} ${cell+E*d*0.5} ${m+hw} ${cell} ${m+hw} L ${cell} ${cell}`
  }

  // Bottom (←): S=+1 tab goes DOWN, S=-1 blank dips UP
  if (S === 0) { p += ` L 0 ${cell}` }
  else {
    const yd = cell + S * d
    p += ` L ${m+hw} ${cell} C ${m+hw} ${cell+S*d*0.5} ${m+hw/2} ${yd} ${m} ${yd}`
    p += ` C ${m-hw/2} ${yd} ${m-hw} ${cell+S*d*0.5} ${m-hw} ${cell} L 0 ${cell}`
  }

  // Left (↑): W=+1 tab goes LEFT, W=-1 blank dips RIGHT
  if (W === 0) { p += ` L 0 0` }
  else {
    const xd = -W * d
    p += ` L 0 ${m+hw} C ${xd*0.5} ${m+hw} ${xd} ${m+hw/2} ${xd} ${m}`
    p += ` C ${xd} ${m-hw/2} ${xd*0.5} ${m-hw} 0 ${m-hw} L 0 0`
  }

  return p + ` Z`
}

// ── Piece SVG component ──────────────────────────────────────────────────────

interface PieceProps {
  pieceIdx: number; cols: number; rows: number; cell: number
  encoded: string; clipId: string
  stroke: string; strokeW?: number; glow?: boolean
  onClick?: () => void
}

function Piece({ pieceIdx, cols, rows, cell, encoded, clipId, stroke, strokeW=2, glow, onClick }: PieceProps) {
  const r = Math.floor(pieceIdx / cols)
  const c = pieceIdx % cols
  const [N,E,S,W] = pieceTabs(r, c, rows, cols)
  const path = jigsawPath(cell, N, E, S, W)
  return (
    <svg width={cell} height={cell}
      style={{ overflow:'visible', display:'block', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}>
      <defs><clipPath id={clipId}><path d={path}/></clipPath></defs>
      {glow && <path d={path} fill="rgba(124,92,252,0.28)" filter="url(#gf)"/>}
      <image
        href={`data:image/svg+xml,${encoded}`}
        x={-c*cell} y={-r*cell}
        width={cols*cell} height={rows*cell}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="none"/>
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeW}
        style={{ filter: glow ? 'drop-shadow(0 0 6px #7C5CFC)' : undefined }}/>
    </svg>
  )
}

// Empty slot with dashed jigsaw outline
function SlotGhost({ slotIdx, cols, rows, cell, active, onClick }: {
  slotIdx:number; cols:number; rows:number; cell:number; active:boolean; onClick:()=>void
}) {
  const r = Math.floor(slotIdx / cols)
  const c = slotIdx % cols
  const [N,E,S,W] = pieceTabs(r, c, rows, cols)
  const path = jigsawPath(cell, N, E, S, W)
  return (
    <svg width={cell} height={cell}
      style={{ overflow:'visible', display:'block', cursor: active ? 'pointer' : 'default' }}
      onClick={onClick}>
      <path d={path}
        fill={active ? 'rgba(124,92,252,0.1)' : 'rgba(255,255,255,0.03)'}
        stroke={active ? 'rgba(124,92,252,0.55)' : 'rgba(255,255,255,0.15)'}
        strokeWidth="1.5" strokeDasharray="5 3"/>
      <text x={cell/2} y={cell/2+5} textAnchor="middle"
        fontSize={cell*0.26} fill="rgba(255,255,255,0.18)"
        fontWeight="bold" fontFamily="sans-serif">{slotIdx+1}</text>
    </svg>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function JigsawPuzzle({ onComplete, onCancel, difficulty=1, studentAge }: Props) {
  const scenes = useMemo(() => {
    if (difficulty===1) return shuffle(EASY_SCENES)
    if (difficulty===2) return shuffle(MEDIUM_SCENES)
    return shuffle(HARD_SCENES)
  }, [difficulty])

  const COUNT  = difficulty===1 ? (studentAge<8 ? 3 : 5) : difficulty===2 ? 4 : 5
  const subset = scenes.slice(0, COUNT)

  const [idx,       setIdx]      = useState(0)
  const [placed,    setPlaced]   = useState<(number|null)[]>([])
  const [scrambled, setScrambled]= useState<(number|null)[]>([])
  const [selected,  setSelected] = useState<number|null>(null)
  const [phase,     setPhase]    = useState<'puzzle'|'done'>('puzzle')
  const [correct,   setCorrect]  = useState(0)
  const [startMs]                = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const scene = subset[idx]
  const TOTAL = scene.cols * scene.rows

  useEffect(() => {
    const ids = Array.from({ length: TOTAL }, (_, i) => i)
    setScrambled(shuffle(ids))
    setPlaced(Array(TOTAL).fill(null))
    setSelected(null)
    setPhase('puzzle')
  }, [idx, TOTAL])

  const isYoung = studentAge < 8
  const CELL = scene.cols === 3
    ? (isYoung ? 84 : 74)
    : (isYoung ? 112 : 98)

  const encoded = useMemo(() => encodeURIComponent(scene.svg), [scene])
  // Deterministic UID per scene to avoid clipPath ID conflicts
  const uid = `${idx}c${scene.cols}r${scene.rows}`

  function tapBank(bi: number) {
    if (scrambled[bi] === null || phase !== 'puzzle') return
    setSelected(selected === bi ? null : bi)
  }

  function tapSlot(si: number) {
    if (selected === null || placed[si] !== null || phase !== 'puzzle') return
    const pieceIdx = scrambled[selected]!
    const np = [...placed];  np[si] = pieceIdx
    const ns = [...scrambled]; ns[selected] = null
    setPlaced(np); setScrambled(ns); setSelected(null)

    if (np.every(v => v !== null)) {
      // Use np (local var) not placed (stale state) to check correctness
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
      }, 2200)
    }
  }

  const isCorrect = phase==='done' && placed.every((v,i) => v===i)
  const GAP = 4

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

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width:`${(idx/COUNT)*100}%`, background:'#7C5CFC' }}/>
      </div>

      {/* Preview + target grid */}
      <div className="flex gap-5 items-start justify-center">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-white/40 text-xs">النموذج</span>
          <div style={{
            width:70, height: Math.round(70 * scene.rows / scene.cols),
            backgroundImage:`url("data:image/svg+xml,${encoded}")`,
            backgroundSize:'100% 100%', borderRadius:8,
            border:'2px solid rgba(124,92,252,0.5)',
          }}/>
          <span className="text-white/60 text-xs font-bold">{scene.emoji} {scene.name}</span>
        </div>

        {/* Target grid — direction:ltr prevents RTL from reversing column order */}
        <div>
          <p className="text-white/40 text-xs text-center mb-2">ضع القطع هنا</p>
          <div style={{
            direction:'ltr',
            display:'grid',
            gridTemplateColumns:`repeat(${scene.cols}, ${CELL}px)`,
            gap: GAP,
          }}>
            {placed.map((pieceIdx, si) => (
              <div key={si}>
                {pieceIdx !== null
                  ? <Piece
                      pieceIdx={pieceIdx}
                      cols={scene.cols} rows={scene.rows} cell={CELL}
                      encoded={encoded}
                      clipId={`jt-${uid}-${si}`}
                      stroke={
                        phase==='done'
                          ? (pieceIdx===si ? '#22c55e' : '#ef4444')
                          : 'rgba(124,92,252,0.75)'
                      }
                      strokeW={phase==='done' ? 3 : 2}
                    />
                  : <SlotGhost
                      slotIdx={si} cols={scene.cols} rows={scene.rows}
                      cell={CELL} active={selected !== null}
                      onClick={() => tapSlot(si)}
                    />
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      {phase==='done' && (
        <div className={`text-xl font-black ${isCorrect ? 'text-green-400' : 'text-amber-400'}`}>
          {isCorrect ? '✅ رائع! أكملت الصورة!' : '❌ ليس تماماً — الإطارات الحمراء تحتاج تصحيح'}
        </div>
      )}

      {/* Bank of pieces — direction:ltr so pieces ordered left-to-right */}
      {phase==='puzzle' && (
        <>
          <p className="text-white/50 text-xs">
            {selected !== null ? 'الآن انقر على مكانها في الإطار ⬆️' : 'انقر على قطعة لاختيارها'}
          </p>
          <div style={{
            direction:'ltr',
            display:'flex', flexWrap:'wrap',
            gap: Math.round(CELL * 0.14),
            justifyContent:'center',
            maxWidth: scene.cols * CELL * 1.8,
          }}>
            {scrambled.map((pieceIdx, bi) =>
              pieceIdx === null
                ? <div key={bi} style={{ width:CELL, height:CELL, opacity:0 }}/>
                : <Piece
                    key={`${bi}-${pieceIdx}`}
                    pieceIdx={pieceIdx}
                    cols={scene.cols} rows={scene.rows} cell={CELL}
                    encoded={encoded}
                    clipId={`jb-${uid}-${bi}`}
                    stroke={selected===bi ? '#7C5CFC' : 'rgba(255,255,255,0.38)'}
                    strokeW={selected===bi ? 3 : 1.5}
                    glow={selected===bi}
                    onClick={() => tapBank(bi)}
                  />
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
