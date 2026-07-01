'use client'

export interface SessionNode {
  sessionId: string
  sessionNumber: number
  date: string
  stars: number    // 1-3 (0 = upcoming slot)
  avgScore: number
  gameCount: number
  isMilestone: boolean
}

interface Props {
  sessions: SessionNode[]
  compact?: boolean   // smaller nodes, horizontal scroll strip for dashboard
  upcomingSlots?: number
}

const STAR_STYLE: Record<number, { bg: string; border: string; shadow: string }> = {
  3: { bg: 'linear-gradient(135deg,#F59E0B,#FBBF24)', border: '#F59E0B', shadow: 'rgba(245,158,11,0.45)' },
  2: { bg: 'linear-gradient(135deg,#6366F1,#818CF8)', border: '#6366F1', shadow: 'rgba(99,102,241,0.4)' },
  1: { bg: 'linear-gradient(135deg,#06B6D4,#38BDF8)', border: '#06B6D4', shadow: 'rgba(6,182,212,0.35)' },
}

const UPCOMING_STYLE = {
  bg: 'linear-gradient(135deg,#F3F4F6,#E5E7EB)',
  border: '#D1D5DB',
  shadow: 'none',
}

export default function ProgressMap({ sessions, compact = false, upcomingSlots = 3 }: Props) {
  const nodeSize  = compact ? 48 : 60
  const mileSize  = compact ? 58 : 72

  // Merge completed sessions + upcoming placeholder slots
  const upcoming = Array.from({ length: upcomingSlots }, (_, i) => ({
    sessionId:     `upcoming-${i}`,
    sessionNumber: sessions.length + i + 1,
    date:          '',
    stars:         0,
    avgScore:      0,
    gameCount:     0,
    isMilestone:   (sessions.length + i + 1) % 4 === 0,
  }))

  const allNodes = [...sessions, ...upcoming]
  const currentIdx = sessions.length - 1   // index of the last completed session

  // Snake layout: 4 nodes per row, alternating L→R / R→L
  const COLS = 4
  const rows: typeof allNodes[number][][] = []
  for (let i = 0; i < allNodes.length; i += COLS) {
    const row = allNodes.slice(i, i + COLS)
    if (rows.length % 2 === 1) row.reverse()
    rows.push(row)
  }

  function NodeCircle({ node, idx }: { node: typeof allNodes[0]; idx: number }) {
    const isUpcoming = node.stars === 0
    const isCurrent  = idx === currentIdx
    const style      = isUpcoming ? UPCOMING_STYLE : (STAR_STYLE[node.stars] ?? STAR_STYLE[1])
    const size       = node.isMilestone ? mileSize : nodeSize

    return (
      <div className="flex flex-col items-center" style={{ minWidth: size }}>

        {/* Milestone crown above node */}
        {node.isMilestone && !isUpcoming && (
          <div className="text-base mb-0.5 animate-bounce">👑</div>
        )}
        {(!node.isMilestone || isUpcoming) && (
          <div className="mb-0.5" style={{ height: compact ? 16 : 20 }} />
        )}

        {/* Circle */}
        <div
          className="rounded-full flex items-center justify-center relative transition-transform duration-200 hover:scale-105"
          style={{
            width:  size,
            height: size,
            background:  style.bg,
            border:      `2.5px solid ${style.border}`,
            boxShadow: isCurrent
              ? `0 0 0 5px ${style.border}33, 0 6px 20px ${style.shadow}`
              : isUpcoming
              ? 'none'
              : `0 4px 14px ${style.shadow}`,
          }}
        >
          {/* Pulsing ring on current session */}
          {isCurrent && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border:    `2.5px solid ${style.border}`,
                animation: 'progress-ping 1.6s ease-in-out infinite',
                opacity:   0.5,
              }}
            />
          )}

          {/* Inner content */}
          {isUpcoming ? (
            <span style={{ fontSize: compact ? 18 : 22, color: '#9CA3AF' }}>🔒</span>
          ) : node.isMilestone ? (
            <span style={{ fontSize: compact ? 22 : 28 }}>🏆</span>
          ) : (
            <span className="font-black text-white" style={{ fontSize: compact ? 13 : 16 }}>
              {node.stars}★
            </span>
          )}
        </div>

        {/* Star row */}
        {!isUpcoming ? (
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3].map(s => (
              <span key={s} style={{ fontSize: 8, color: s <= node.stars ? '#F59E0B' : '#E5E7EB' }}>★</span>
            ))}
          </div>
        ) : (
          <div style={{ height: 14 }} />
        )}

        {/* Session number */}
        <span
          className="font-bold"
          style={{
            fontSize:  9,
            marginTop: 2,
            color: isUpcoming ? '#D1D5DB' : isCurrent ? '#6366F1' : '#9CA3AF',
          }}
        >
          {node.isMilestone && !isUpcoming
            ? '🎖️'
            : `#${node.sessionNumber}`}
        </span>
      </div>
    )
  }

  // ─── Compact mode: horizontal scrollable strip ───────────────────────────
  if (compact) {
    // Show only the window: last 6 completed + 3 upcoming
    const window = allNodes.slice(Math.max(0, sessions.length - 6))
    return (
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <style>{`
          @keyframes progress-ping {
            0%,100% { transform: scale(1); opacity: 0.4; }
            50%      { transform: scale(1.3); opacity: 0; }
          }
        `}</style>
        <div className="flex items-end gap-3 min-w-max py-2">
          {window.map((node, i) => (
            <NodeCircle
              key={node.sessionId}
              node={node}
              idx={allNodes.indexOf(node)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Full snake map ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <style>{`
        @keyframes progress-ping {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50%      { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {rows.map((row, rowIdx) => (
        <div key={rowIdx}>
          {/* Node row */}
          <div className="flex items-end justify-between gap-2">
            {row.map((node, colIdx) => (
              <div key={node.sessionId} className="flex items-center flex-1">
                <NodeCircle node={node} idx={allNodes.indexOf(node)} />

                {/* Horizontal connector */}
                {colIdx < row.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2"
                    style={{
                      borderTop:  '2px dashed',
                      borderColor: node.sessionNumber <= sessions.length
                        ? 'rgba(99,102,241,0.35)'
                        : '#E5E7EB',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Vertical connector to next row — right side on even rows, left on odd */}
          {rowIdx < rows.length - 1 && (
            <div
              className="flex"
              style={{ justifyContent: rowIdx % 2 === 0 ? 'flex-end' : 'flex-start', paddingInline: nodeSize / 2 - 1 }}
            >
              <div
                className="w-0.5 mt-1"
                style={{
                  height:      24,
                  background:  'linear-gradient(to bottom, rgba(99,102,241,0.35), rgba(99,102,241,0.1))',
                  borderLeft:  '2px dashed rgba(99,102,241,0.3)',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
