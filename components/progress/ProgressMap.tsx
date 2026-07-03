'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

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
  sessions:       SessionNode[]
  compact?:       boolean
  upcomingSlots?: number
}

const STAR_CFG = {
  3: { bg: 'linear-gradient(135deg,#F59E0B,#FBBF24)', border: '#F59E0B', glow: 'rgba(245,158,11,0.6)',  label: 'ممتاز' },
  2: { bg: 'linear-gradient(135deg,#6B46F0,#9B79FF)', border: '#6B46F0', glow: 'rgba(107,70,240,0.55)', label: 'جيد جداً' },
  1: { bg: 'linear-gradient(135deg,#06B6D4,#38BDF8)', border: '#06B6D4', glow: 'rgba(6,182,212,0.5)',   label: 'بداية موفقة' },
} as const

const BURST_DIRS = [0, 60, 120, 180, 240, 300]
const FLOAT_DIRS = [45, 135, 225, 315]

function fmtDate(iso: string) {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat('ar-TN', { day:'numeric', month:'short', year:'numeric' }).format(new Date(iso)) }
  catch { return iso }
}

interface TooltipData { node: SessionNode; isUp: boolean; vx: number; vy: number }

function NodeTooltip({ data }: { data: TooltipData }) {
  const { node, isUp } = data
  const cfg   = (!isUp && node.stars) ? STAR_CFG[node.stars as 1|2|3] : null
  const above = data.vy > 120
  return (
    <motion.div
      initial={{ opacity:0, scale:0.88, y: above?6:-6 }}
      animate={{ opacity:1, scale:1, y:0 }}
      exit={{ opacity:0, scale:0.88 }}
      transition={{ duration:0.14 }}
      className="fixed z-[9999] pointer-events-none"
      style={{ left:data.vx, ...(above?{top:data.vy-8}:{top:data.vy+72}),
        transform: above?'translateX(-50%) translateY(-100%)':'translateX(-50%)', minWidth:152 }}
    >
      <div className="rounded-2xl px-3 py-2.5 text-white shadow-2xl"
        style={{ background: isUp ? 'linear-gradient(135deg,#6B46F0,#7C5CFC)' : (cfg?.bg ?? '#374151'), fontSize:11 }}>
        {isUp ? (
          <div className="font-bold text-white/90 text-center">
            🌟 جلسة #{node.sessionNumber} قادمة<br/>
            <span className="font-normal text-white/70 text-[10px]">أكمل الجلسة الحالية لتفتح</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-1.5">
              {node.isMilestone && <span>🏆</span>}
              <span className="font-black">جلسة #{node.sessionNumber}</span>
            </div>
            <div className="flex gap-0.5 mb-1.5">
              {[1,2,3].map(s => <span key={s} style={{ fontSize:11, opacity: s<=node.stars?1:0.3 }}>★</span>)}
              <span className="mr-1 opacity-80 text-[10px]">{cfg?.label}</span>
            </div>
            <div className="space-y-0.5 text-white/75 text-[10px]">
              <div>متوسط النتيجة: <span className="font-black text-white">{node.avgScore}%</span></div>
              <div>عدد التمارين: <span className="font-black text-white">{node.gameCount}</span></div>
              {node.date && <div className="text-white/55">{fmtDate(node.date)}</div>}
            </div>
          </>
        )}
        <div className="absolute left-1/2 -translate-x-1/2"
          style={{ [above?'bottom':'top']:-5, width:0, height:0,
            borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
            ...(above
              ? { borderTop:`5px solid ${isUp?'#6B46F0':(cfg?.border??'#374151')}` }
              : { borderBottom:`5px solid ${isUp?'#6B46F0':(cfg?.border??'#374151')}` }) }} />
      </div>
    </motion.div>
  )
}

// ─── Compact strip ─────────────────────────────────────────────────────────────
function CompactStrip({ sessions, upcomingSlots }: { sessions: SessionNode[]; upcomingSlots: number }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const upcoming = Array.from({ length:upcomingSlots }, (_,i) => ({
    sessionId:`up-${i}`, sessionNumber:sessions.length+i+1,
    date:'', stars:0, avgScore:0, gameCount:0,
    isMilestone:(sessions.length+i+1)%4===0,
  }))
  const all     = [...sessions.slice(-6), ...upcoming]
  const currIdx = sessions.length - 1

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <style>{`
        @keyframes pm-ping  { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.55);opacity:0} }
        @keyframes pm-upbeat{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
      <div className="relative flex items-end gap-3 min-w-max py-2">
        <AnimatePresence>{tooltip && <NodeTooltip data={tooltip} />}</AnimatePresence>
        {all.map((node, wi) => {
          const absIdx = wi - (all.length - sessions.length - upcomingSlots)
          const isUp   = node.stars === 0
          const isCurr = absIdx === currIdx && sessions.length > 0
          const cfg    = (!isUp && node.stars) ? STAR_CFG[node.stars as 1|2|3] : null
          const sz     = node.isMilestone ? 58 : 48
          const r      = sz / 2
          return (
            <motion.div key={node.sessionId}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
              transition={{ type:'spring', delay:wi*0.06, stiffness:280, damping:22 }}
              onHoverStart={e => {
                const el = (e.target as HTMLElement).closest('[data-node]') as HTMLElement
                const rect = el?.getBoundingClientRect()
                if (!rect) return
                setTooltip({ node, isUp, vx: rect.left+rect.width/2, vy: rect.top })
              }}
              onHoverEnd={() => setTooltip(null)} data-node
            >
              {node.isMilestone && !isUp
                ? <motion.span animate={{ rotate:[0,-10,10,0], y:[0,-2,0] }} transition={{ duration:2.4, repeat:Infinity }}>👑</motion.span>
                : <div style={{ height:20 }} />}
              <motion.div className="rounded-full flex items-center justify-center relative"
                style={{
                  width:sz, height:sz,
                  background: isUp
                    ? 'linear-gradient(135deg,rgba(107,70,240,0.08),rgba(149,117,255,0.18))'
                    : cfg!.bg,
                  border: isUp ? '2px dashed rgba(107,70,240,0.4)' : `2.5px solid ${cfg!.border}`,
                  boxShadow: !isUp
                    ? isCurr ? `0 4px 22px ${cfg!.glow}, 0 0 0 3px ${cfg!.glow}` : `0 3px 12px ${cfg!.glow}`
                    : 'none',
                  animation: isUp ? 'pm-upbeat 3s ease-in-out infinite' : undefined,
                }}
                whileHover={{ scale:1.12 }}
              >
                {isCurr && cfg && (
                  <span className="absolute inset-0 rounded-full"
                    style={{ border:`2.5px solid ${cfg.border}`, animation:'pm-ping 1.8s ease-in-out infinite', boxShadow:`0 0 0 5px ${cfg.glow}` }} />
                )}
                {!isUp && node.stars===3 && BURST_DIRS.map((deg,pi) => (
                  <motion.span key={pi} className="absolute pointer-events-none select-none"
                    style={{ left:'50%', top:'50%', marginLeft:-4, marginTop:-4, fontSize:8, color:'#F59E0B' }}
                    animate={{ x:[0,Math.cos(deg*Math.PI/180)*(r+8)], y:[0,Math.sin(deg*Math.PI/180)*(r+8)], opacity:[0,1,0], scale:[0,1.3,0] }}
                    transition={{ duration:1.7, repeat:Infinity, delay:pi*0.28, ease:'easeOut' }}
                  >✦</motion.span>
                ))}
                {isUp
                  ? <div className="flex flex-col items-center gap-0">
                      <span style={{ fontSize:16, filter:'saturate(0.5) brightness(1.3)' }}>🔒</span>
                      <span style={{ fontSize:8, color:'rgba(107,70,240,0.7)', fontWeight:800 }}>#{node.sessionNumber}</span>
                    </div>
                  : node.isMilestone ? <span style={{ fontSize:24 }}>🏆</span>
                  : <span className="font-black text-white select-none" style={{ fontSize:14 }}>{node.stars}★</span>}
              </motion.div>
              {!isUp && (
                <div className="flex gap-0.5">
                  {[1,2,3].map(s => <span key={s} style={{ fontSize:7, color: s<=node.stars?'#F59E0B':'#E5E7EB' }}>★</span>)}
                </div>
              )}
              <span style={{ fontSize:9, fontWeight:700, color: isUp?'rgba(107,70,240,0.5)':isCurr?'#6B46F0':'#9CA3AF' }}>
                {node.isMilestone && !isUp ? '🎖️' : `#${node.sessionNumber}`}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Full snake map ────────────────────────────────────────────────────────────
const W      = 264
const L_CX   = 58
const R_CX   = W - 58
const MID_CX = W / 2
const NODE_D = 58
const CURR_D = 72   // current node is bigger
const MILE_D = 70
const ROW_H  = 100

function nodeX(i: number, isMilestone: boolean) {
  if (isMilestone) return MID_CX
  return i % 2 === 0 ? R_CX : L_CX
}

function SnakeMap({ sessions, upcomingSlots }: { sessions: SessionNode[]; upcomingSlots: number }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const upcoming = Array.from({ length:upcomingSlots }, (_,i) => ({
    sessionId:`up-${i}`, sessionNumber:sessions.length+i+1,
    date:'', stars:0, avgScore:0, gameCount:0,
    isMilestone:(sessions.length+i+1)%4===0,
  }))

  const all        = [...upcoming.slice().reverse(), ...sessions.slice().reverse()]
  const currentIdx = sessions.length > 0 ? upcomingSlots : -1
  const totalH     = all.length * ROW_H + 56

  const centres = all.map((node, i) => {
    const isCurr = i === currentIdx
    const d      = isCurr ? CURR_D : node.isMilestone ? MILE_D : NODE_D
    return {
      x: nodeX(i, node.isMilestone),
      y: i * ROW_H + ROW_H / 2 + 28,
      r: d / 2,
    }
  })

  function curvePath(a: { x:number; y:number; r:number }, b: { x:number; y:number; r:number }) {
    const midY = (a.y + b.y) / 2
    return `M ${a.x} ${a.y} C ${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`
  }

  return (
    <div className="relative select-none" dir="ltr" style={{ height:totalH }}>
      <style>{`
        @keyframes pm-ping      { 0%,100%{transform:scale(1);opacity:.4}  50%{transform:scale(1.6);opacity:0} }
        @keyframes pm-float     { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
        @keyframes pm-shimmer   { from{stroke-dashoffset:0} to{stroke-dashoffset:-72} }
        @keyframes pm-sparkle   { from{stroke-dashoffset:0} to{stroke-dashoffset:-48} }
        @keyframes pm-nodebeat  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes pm-halo      { 0%,100%{opacity:.18} 50%{opacity:.06} }
      `}</style>
      <AnimatePresence>{tooltip && <NodeTooltip data={tooltip} />}</AnimatePresence>

      {/* SVG paths */}
      <svg className="absolute inset-0 pointer-events-none overflow-visible" width={W} height={totalH}>
        <defs>
          <linearGradient id="pm-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6B46F0" />
            <stop offset="50%"  stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="pm-upcoming-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#9B79FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.4" />
          </linearGradient>
          <filter id="pm-blur"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id="pm-glow"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          {centres.slice(0,-1).map((c,i) => (
            <path key={i} id={`pm-path-${i}`} d={curvePath(c, centres[i+1])} fill="none" />
          ))}
        </defs>

        {centres.slice(0,-1).map((c,i) => {
          const d           = curvePath(c, centres[i+1])
          const isCompleted = i >= upcomingSlots
          const isNext      = i === upcomingSlots - 1  // path immediately above current node

          return (
            <g key={i}>
              {/* Base track */}
              {isCompleted
                ? <path d={d} fill="none" stroke="#E5E7EB" strokeWidth={3} strokeDasharray="8 6" strokeLinecap="round" />
                : <path d={d} fill="none" stroke="rgba(107,70,240,0.15)" strokeWidth={4} strokeLinecap="round" />
              }

              {/* Upcoming path — colored dashes */}
              {!isCompleted && (
                <path d={d} fill="none" stroke="url(#pm-upcoming-grad)"
                  strokeWidth={3} strokeDasharray="7 7" strokeLinecap="round"
                  style={{ animation:`pm-sparkle ${1.6+i*0.15}s linear infinite` }}
                />
              )}

              {/* Completed glow halo */}
              {isCompleted && (
                <path d={d} fill="none" stroke="url(#pm-grad)" strokeWidth={10}
                  strokeLinecap="round" style={{ animation:'pm-halo 2.5s ease-in-out infinite' }} />
              )}

              {/* Completed main stroke */}
              {isCompleted && (
                <motion.path d={d} fill="none" stroke="url(#pm-grad)" strokeWidth={4.5} strokeLinecap="round"
                  initial={{ pathLength:0, opacity:0 }}
                  animate={{ pathLength:1, opacity:1 }}
                  transition={{ duration:0.65, delay:(all.length-2-i)*0.08, ease:'easeOut' }}
                />
              )}

              {/* Shimmer — completed */}
              {isCompleted && (
                <path d={d} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5}
                  strokeLinecap="round" strokeDasharray="10 62"
                  style={{ animation:'pm-shimmer 1.4s linear infinite' }}
                />
              )}

              {/* Flying sparkle — upcoming paths */}
              {!isCompleted && (
                <motion.circle r={isNext ? 5 : 3.5}
                  fill={isNext ? '#9B79FF' : 'rgba(149,117,255,0.7)'}
                  filter={isNext ? 'url(#pm-glow)' : undefined}
                  animate={{ opacity:[0, isNext?1:0.7, 0] }}
                  transition={{ duration: isNext?2:2.5, repeat:Infinity, delay:i*0.45 }}
                >
                  <animateMotion dur={isNext?'2s':'2.5s'} repeatCount="indefinite" begin={`${i*0.45}s`}>
                    <mpath href={`#pm-path-${i}`} />
                  </animateMotion>
                </motion.circle>
              )}

              {/* Travelling dot — completed current→prev */}
              {isCompleted && i === upcomingSlots && (
                <motion.circle r={5} fill="#6B46F0" filter="url(#pm-blur)"
                  animate={{ opacity:[0,1,0] }}
                  transition={{ duration:2.5, repeat:Infinity, delay:1.2 }}
                >
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.2s">
                    <mpath href={`#pm-path-${i}`} />
                  </animateMotion>
                </motion.circle>
              )}
            </g>
          )
        })}
      </svg>

      {/* Nodes */}
      {all.map((node, i) => {
        const { x, y }  = centres[i]
        const isUp       = i < upcomingSlots
        const isCurr     = i === currentIdx
        const d          = isCurr ? CURR_D : node.isMilestone ? MILE_D : NODE_D
        const r          = d / 2
        const cfg        = (!isUp && node.stars) ? STAR_CFG[node.stars as 1|2|3] : null
        const nextThr    = node.stars === 1 ? 60 : 80
        const progFrac   = node.stars < 3 ? Math.min(1, node.avgScore / nextThr) : 1

        return (
          <motion.div key={node.sessionId}
            className="absolute flex flex-col items-center"
            style={{ left:x-r, top:y-r, width:d, zIndex: isCurr?20:10 }}
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ type:'spring', stiffness: isCurr?520:300, damping: isCurr?18:22, mass: isCurr?0.7:1, delay:(all.length-1-i)*0.07 }}
            onHoverStart={e => {
              const el = (e.target as HTMLElement).closest('.absolute') as HTMLElement
              const rect = el?.getBoundingClientRect()
              if (!rect) return
              setTooltip({ node, isUp, vx:rect.left+rect.width/2, vy:rect.top })
            }}
            onHoverEnd={() => setTooltip(null)}
          >
            {/* "أنت هنا" badge */}
            {isCurr && (
              <motion.div
                className="absolute whitespace-nowrap text-[10px] font-black text-white rounded-full px-2.5 py-1 shadow-lg z-30"
                style={{ background:'linear-gradient(135deg,#6B46F0,#9B79FF)', top:-32, left:'50%',
                  animation:'pm-float 1.8s ease-in-out infinite', boxShadow:'0 4px 16px rgba(107,70,240,0.45)' }}
              >
                ✨ أنت هنا
              </motion.div>
            )}

            {/* Milestone crown */}
            {node.isMilestone && !isUp && (
              <motion.div className="absolute text-xl z-30" style={{ top:-26, left:'50%', transform:'translateX(-50%)' }}
                animate={{ rotate:[-8,8,-8], y:[0,-3,0] }} transition={{ duration:2, repeat:Infinity }}>
                👑
              </motion.div>
            )}

            {/* Node circle */}
            <motion.div
              key={isCurr ? `curr-${node.stars}` : undefined}
              className="rounded-full flex items-center justify-center relative"
              style={{
                width:d, height:d,
                background: isUp
                  ? 'linear-gradient(135deg,rgba(107,70,240,0.07),rgba(149,117,255,0.18))'
                  : (cfg?.bg ?? '#E5E7EB'),
                border: isUp
                  ? '2.5px dashed rgba(107,70,240,0.45)'
                  : `3px solid ${cfg?.border ?? '#D1D5DB'}`,
                boxShadow: cfg && !isUp
                  ? isCurr
                    ? `0 8px 32px ${cfg.glow}, 0 0 0 5px rgba(107,70,240,0.12)`
                    : node.stars===3
                    ? `0 4px 22px ${cfg.glow}, 0 0 0 2px ${cfg.glow}`
                    : `0 4px 18px ${cfg.glow}`
                  : isUp ? '0 2px 12px rgba(107,70,240,0.12)' : 'none',
                overflow:'visible',
                animation: isUp ? 'pm-nodebeat 3s ease-in-out infinite' : undefined,
              }}
              initial={isCurr ? { scale:0.5, opacity:0 } : undefined}
              animate={isCurr ? { scale:1, opacity:1 } : undefined}
              transition={isCurr ? { type:'spring', stiffness:520, damping:17, mass:0.75 } : undefined}
              whileHover={{ scale:1.1, zIndex:30 }}
            >
              {/* Pulsing ring — current */}
              {isCurr && cfg && (
                <span className="absolute inset-0 rounded-full"
                  style={{ border:`3px solid ${cfg.border}`, animation:'pm-ping 2s ease-in-out infinite', boxShadow:`0 0 0 8px ${cfg.glow}` }} />
              )}

              {/* Upcoming pulse ring */}
              {isUp && (
                <motion.span className="absolute inset-0 rounded-full"
                  style={{ border:'2px solid rgba(107,70,240,0.35)' }}
                  animate={{ scale:[1,1.18,1], opacity:[0.6,0.15,0.6] }}
                  transition={{ duration:2.8, repeat:Infinity, delay:i*0.35 }}
                />
              )}

              {/* Star burst — 3-star */}
              {!isUp && node.stars===3 && BURST_DIRS.map((deg,pi) => (
                <motion.span key={pi} className="absolute pointer-events-none select-none"
                  style={{ left:'50%', top:'50%', marginLeft:-4, marginTop:-4, fontSize:9, color:'#F59E0B' }}
                  animate={{ x:[0,Math.cos(deg*Math.PI/180)*(r+13)], y:[0,Math.sin(deg*Math.PI/180)*(r+13)], opacity:[0,1,0], scale:[0,1.6,0] }}
                  transition={{ duration:2, repeat:Infinity, delay:pi*0.33, ease:'easeOut' }}
                >✦</motion.span>
              ))}

              {/* Floating particles — current node */}
              {isCurr && cfg && FLOAT_DIRS.map((deg,fi) => (
                <motion.span key={fi} className="absolute pointer-events-none select-none"
                  style={{ left:'50%', top:'50%', marginLeft:-3, marginTop:-3, fontSize:7, color:'rgba(255,255,255,0.9)' }}
                  animate={{ x:[0,Math.cos(deg*Math.PI/180)*(r+16)], y:[0,Math.sin(deg*Math.PI/180)*(r+16)], opacity:[0,0.9,0], scale:[0.5,1.2,0] }}
                  transition={{ duration:2.2, repeat:Infinity, delay:fi*0.55, ease:'easeOut' }}
                >✦</motion.span>
              ))}

              {/* Icon */}
              {isUp
                ? (
                  <div className="flex flex-col items-center gap-0">
                    <span style={{ fontSize:d*0.36, filter:'saturate(0.3) brightness(1.5)' }}>🔒</span>
                    <span className="font-black" style={{ fontSize:d*0.17, color:'rgba(107,70,240,0.65)', lineHeight:1.2 }}>#{node.sessionNumber}</span>
                  </div>
                )
                : node.isMilestone ? <span style={{ fontSize:d*0.42 }}>🏆</span>
                : isCurr ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-black text-white leading-none" style={{ fontSize:d*0.23 }}>{node.avgScore}%</span>
                    <span className="font-bold text-white/75 leading-none" style={{ fontSize:d*0.17 }}>{node.stars}★</span>
                  </div>
                )
                : <span className="font-black text-white" style={{ fontSize:d*0.29 }}>{node.stars}★</span>
              }
            </motion.div>

            {/* Star row */}
            {!isUp && node.stars > 0 && (
              <div className="flex gap-0.5 mt-1.5">
                {[1,2,3].map(s => (
                  <motion.span key={s}
                    initial={s<=node.stars?{scale:0}:undefined}
                    animate={s<=node.stars?{scale:1}:undefined}
                    transition={{ type:'spring', delay:(s-1)*0.08+(all.length-1-i)*0.07+0.12 }}
                    style={{ fontSize:9, color: s<=node.stars?'#F59E0B':'#E5E7EB', display:'block' }}
                  >★</motion.span>
                ))}
              </div>
            )}

            {/* Progress bar — current */}
            {isCurr && !isUp && node.stars < 3 && (
              <div style={{ width:d-8, marginTop:4 }}>
                <div className="rounded-full overflow-hidden" style={{ height:4, background:'rgba(107,70,240,0.15)' }}>
                  <motion.div className="rounded-full h-full"
                    style={{ background: cfg?.bg ?? 'linear-gradient(90deg,#6B46F0,#9B79FF)', transformOrigin:'left center' }}
                    initial={{ scaleX:0 }} animate={{ scaleX:progFrac }}
                    transition={{ duration:1, ease:'easeOut', delay:0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Exercise count */}
            {isCurr && !isUp && node.gameCount > 0 && (
              <span style={{ fontSize:8, color:'#6B46F0', fontWeight:700, marginTop:1 }}>
                {node.gameCount} تمرين
              </span>
            )}

            {/* Label */}
            <span style={{ fontSize:9, fontWeight:800, marginTop:2,
              color: isUp ? 'rgba(107,70,240,0.55)' : isCurr ? '#6B46F0' : '#9CA3AF' }}>
              {node.isMilestone && !isUp ? '🎖️' : `#${node.sessionNumber}`}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function ProgressMap({ sessions, compact=false, upcomingSlots=3 }: Props) {
  if (compact) return <CompactStrip sessions={sessions} upcomingSlots={upcomingSlots} />
  return <SnakeMap sessions={sessions} upcomingSlots={upcomingSlots} />
}
