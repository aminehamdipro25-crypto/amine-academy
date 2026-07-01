'use client'
import { motion } from 'framer-motion'

export interface SessionNode {
  sessionId:     string
  sessionNumber: number
  date:          string
  stars:         number   // 1-3 (0 = upcoming/locked)
  avgScore:      number
  gameCount:     number
  isMilestone:   boolean
}

interface Props {
  sessions:      SessionNode[]
  compact?:      boolean
  upcomingSlots?: number
}

// ─── Visual config per star count ────────────────────────────────────────────
const STAR_CFG = {
  3: { bg: 'linear-gradient(135deg,#F59E0B,#FBBF24)', border: '#F59E0B', glow: 'rgba(245,158,11,0.55)', label: 'ممتاز' },
  2: { bg: 'linear-gradient(135deg,#6366F1,#818CF8)', border: '#6366F1', glow: 'rgba(99,102,241,0.55)', label: 'جيد' },
  1: { bg: 'linear-gradient(135deg,#06B6D4,#38BDF8)', border: '#06B6D4', glow: 'rgba(6,182,212,0.45)', label: 'بداية' },
} as const

// ─── Compact horizontal strip (celebration + parent dashboard) ────────────────
function CompactStrip({ sessions, upcomingSlots }: { sessions: SessionNode[]; upcomingSlots: number }) {
  const upcoming = Array.from({ length: upcomingSlots }, (_, i) => ({
    sessionId: `up-${i}`, sessionNumber: sessions.length + i + 1,
    date: '', stars: 0, avgScore: 0, gameCount: 0,
    isMilestone: (sessions.length + i + 1) % 4 === 0,
  }))
  const window  = [...sessions.slice(-6), ...upcoming]
  const currIdx = sessions.length - 1   // last completed = current

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <style>{`@keyframes pm-ping{0%,100%{transform:scale(1);opacity:.45}50%{transform:scale(1.5);opacity:0}}`}</style>
      <div className="flex items-end gap-3 min-w-max py-2">
        {window.map((node, wi) => {
          const absIdx   = wi - (window.length - sessions.length - upcomingSlots)
          const isUp     = node.stars === 0
          const isCurr   = absIdx === currIdx && sessions.length > 0
          const cfg      = (!isUp && node.stars) ? STAR_CFG[node.stars as 1|2|3] : null
          const sz       = node.isMilestone ? 58 : 48

          return (
            <motion.div
              key={node.sessionId}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: wi * 0.06, stiffness: 280, damping: 22 }}
            >
              {node.isMilestone && !isUp
                ? <motion.span animate={{ rotate: [0,-10,10,0] }} transition={{ duration: 2.4, repeat: Infinity }}>👑</motion.span>
                : <div style={{ height: 20 }} />
              }

              <motion.div
                className="rounded-full flex items-center justify-center relative"
                style={{
                  width: sz, height: sz,
                  background: isUp ? 'linear-gradient(135deg,#F3F4F6,#E5E7EB)' : cfg!.bg,
                  border:     `2.5px solid ${isUp ? '#D1D5DB' : cfg!.border}`,
                  boxShadow:  !isUp && !isCurr ? `0 3px 12px ${cfg!.glow}` : 'none',
                }}
                whileHover={{ scale: 1.1 }}
              >
                {isCurr && cfg && (
                  <span className="absolute inset-0 rounded-full"
                    style={{ border: `2.5px solid ${cfg.border}`, animation: 'pm-ping 1.8s ease-in-out infinite', boxShadow: `0 0 0 5px ${cfg.glow}` }} />
                )}
                {isUp
                  ? <span style={{ fontSize: 20 }}>🔒</span>
                  : node.isMilestone
                  ? <span style={{ fontSize: 24 }}>🏆</span>
                  : <span className="font-black text-white select-none" style={{ fontSize: 14 }}>{node.stars}★</span>}
              </motion.div>

              {!isUp && (
                <div className="flex gap-0.5">
                  {[1,2,3].map(s => <span key={s} style={{ fontSize: 7, color: s <= node.stars ? '#F59E0B' : '#E5E7EB' }}>★</span>)}
                </div>
              )}
              <span style={{ fontSize: 9, fontWeight: 700, color: isUp ? '#D1D5DB' : isCurr ? '#6366F1' : '#9CA3AF' }}>
                {node.isMilestone && !isUp ? '🎖️' : `#${node.sessionNumber}`}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Full vertical Duolingo-style snake map ───────────────────────────────────
const W       = 264   // sidebar content width (w-72 minus p-3 × 2)
const L_CX    = 56    // left column center x
const R_CX    = W - 56  // 208 — right column center x
const MID_CX  = W / 2   // 132 — milestone center x
const NODE_D  = 56
const MILE_D  = 68
const ROW_H   = 96    // px between node centres vertically

function nodeX(i: number, isMilestone: boolean) {
  if (isMilestone) return MID_CX
  return i % 2 === 0 ? R_CX : L_CX
}

function SnakeMap({ sessions, upcomingSlots }: { sessions: SessionNode[]; upcomingSlots: number }) {
  const upcoming = Array.from({ length: upcomingSlots }, (_, i) => ({
    sessionId: `up-${i}`, sessionNumber: sessions.length + i + 1,
    date: '', stars: 0, avgScore: 0, gameCount: 0,
    isMilestone: (sessions.length + i + 1) % 4 === 0,
  }))

  // Layout: upcoming (top) → current → older sessions (bottom)
  // newest upcoming first so highest session# is at top
  const all = [
    ...upcoming.slice().reverse(),
    ...sessions.slice().reverse(),
  ]

  const currentIdx = sessions.length > 0 ? upcomingSlots : -1
  const totalH = all.length * ROW_H + 48

  // Centre coordinates for each node
  const centres = all.map((node, i) => ({
    x: nodeX(i, node.isMilestone),
    y: i * ROW_H + ROW_H / 2 + 24,   // +24 to leave room for "أنت هنا" badge at top
  }))

  // SVG bezier path between consecutive nodes
  function curvePath(a: { x: number; y: number }, b: { x: number; y: number }) {
    const midY = (a.y + b.y) / 2
    return `M ${a.x} ${a.y} C ${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`
  }

  return (
    <div className="relative select-none" dir="ltr" style={{ height: totalH }}>
      <style>{`
        @keyframes pm-ping  { 0%,100%{transform:scale(1);opacity:.45} 50%{transform:scale(1.55);opacity:0} }
        @keyframes pm-float { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} }
      `}</style>

      {/* SVG path layer */}
      <svg className="absolute inset-0 pointer-events-none overflow-visible" width={W} height={totalH}>
        <defs>
          <linearGradient id="pm-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#818CF8" />
            <stop offset="50%"  stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {centres.slice(0, -1).map((c, i) => {
          const d           = curvePath(c, centres[i + 1])
          const isCompleted = i >= upcomingSlots   // both nodes are completed sessions

          return (
            <g key={i}>
              {/* Dashed background track */}
              <path d={d} fill="none" stroke="#E5E7EB" strokeWidth={3} strokeDasharray="8 6" strokeLinecap="round" />

              {/* Animated completed segment */}
              {isCompleted && (
                <motion.path
                  d={d} fill="none" stroke="url(#pm-grad)" strokeWidth={4} strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: (all.length - 2 - i) * 0.07, ease: 'easeOut' }}
                />
              )}

              {/* Glowing dot travelling the completed path (current → prev connector only) */}
              {isCompleted && i === upcomingSlots && (
                <motion.circle r={4} fill="#6366F1"
                  filter="url(#pm-blur)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: 1 }}
                >
                  <animateMotion dur="2.4s" repeatCount="indefinite" begin="1s">
                    <mpath href={`#pm-path-${i}`} />
                  </animateMotion>
                </motion.circle>
              )}
            </g>
          )
        })}

        {/* Glow filter for travelling dot */}
        <defs>
          <filter id="pm-blur"><feGaussianBlur stdDeviation="2" /></filter>
          {centres.slice(0, -1).map((c, i) => (
            <path key={i} id={`pm-path-${i}`} d={curvePath(c, centres[i + 1])} fill="none" />
          ))}
        </defs>
      </svg>

      {/* Node layer */}
      {all.map((node, i) => {
        const { x, y }  = centres[i]
        const isUp      = i < upcomingSlots
        const isCurr    = i === currentIdx
        const d         = node.isMilestone ? MILE_D : NODE_D
        const r         = d / 2
        const cfg       = (!isUp && node.stars) ? STAR_CFG[node.stars as 1|2|3] : null

        return (
          <motion.div
            key={node.sessionId}
            className="absolute flex flex-col items-center"
            style={{ left: x - r, top: y - r, width: d, zIndex: isCurr ? 20 : 10 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: (all.length - 1 - i) * 0.07 }}
          >
            {/* "أنت هنا" floating badge — current node only */}
            {isCurr && (
              <motion.div
                className="absolute whitespace-nowrap text-[9px] font-black text-white rounded-full px-2 py-0.5 shadow-lg z-30"
                style={{
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  top: -26, left: '50%',
                  animation: 'pm-float 1.8s ease-in-out infinite',
                }}
              >
                ✨ أنت هنا
              </motion.div>
            )}

            {/* Milestone crown */}
            {node.isMilestone && !isUp && (
              <motion.div
                className="absolute text-lg z-30"
                style={{ top: -22, left: '50%', transform: 'translateX(-50%)' }}
                animate={{ rotate: [-8, 8, -8] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                👑
              </motion.div>
            )}

            {/* Circle */}
            <motion.div
              className="rounded-full flex items-center justify-center relative"
              style={{
                width: d, height: d,
                background: isUp ? 'linear-gradient(135deg,#F9FAFB,#F3F4F6)' : (cfg?.bg ?? '#E5E7EB'),
                border:     `3px solid ${isUp ? '#E5E7EB' : (cfg?.border ?? '#D1D5DB')}`,
                boxShadow:  cfg && !isCurr ? `0 4px 16px ${cfg.glow}` : 'none',
              }}
              whileHover={{ scale: 1.1, zIndex: 30 }}
            >
              {/* Pulsing ring — current node */}
              {isCurr && cfg && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    border:    `3px solid ${cfg.border}`,
                    animation: 'pm-ping 1.9s ease-in-out infinite',
                    boxShadow: `0 0 0 6px ${cfg.glow}`,
                  }}
                />
              )}

              {/* Icon */}
              {isUp
                ? <span style={{ fontSize: d * 0.38 }}>🔒</span>
                : node.isMilestone
                ? <span style={{ fontSize: d * 0.42 }}>🏆</span>
                : <span className="font-black text-white" style={{ fontSize: d * 0.29 }}>{node.stars}★</span>
              }
            </motion.div>

            {/* Mini star row */}
            {!isUp && node.stars > 0 && (
              <div className="flex gap-0.5 mt-1">
                {[1,2,3].map(s => <span key={s} style={{ fontSize: 8, color: s <= node.stars ? '#F59E0B' : '#E5E7EB' }}>★</span>)}
              </div>
            )}

            {/* Session label */}
            <span style={{
              fontSize: 9, fontWeight: 700, marginTop: 2,
              color: isUp ? '#D1D5DB' : isCurr ? '#6366F1' : '#9CA3AF',
            }}>
              {node.isMilestone && !isUp ? '🎖️' : `#${node.sessionNumber}`}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────
export default function ProgressMap({ sessions, compact = false, upcomingSlots = 3 }: Props) {
  if (compact) return <CompactStrip sessions={sessions} upcomingSlots={upcomingSlots} />
  return <SnakeMap sessions={sessions} upcomingSlots={upcomingSlots} />
}
