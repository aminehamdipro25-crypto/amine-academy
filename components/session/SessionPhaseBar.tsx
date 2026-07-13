'use client'
// Session phase progress bar shown below the toolbar (app/session/[id]/page.tsx)
// while a session is running: per-phase progress, click-to-jump, and the
// trigger for the phase-duration edit modal (which stays in page.tsx since
// it's also opened from the pre-session readiness screen). Extracted out of
// page.tsx to keep that file focused on session state/behavior.
import type { SessionPhase } from '@/lib/session-constants'
import { formatTime } from '@/lib/session-helpers'

export default function SessionPhaseBar({
  phaseBarRef,
  running,
  chromeHidden,
  phases,
  phaseIdx,
  phaseDurations,
  elapsed,
  onSelectPhase,
  onToggleShowPhaseEdit,
}: {
  phaseBarRef: React.RefObject<HTMLDivElement | null>
  running: boolean
  chromeHidden: boolean
  phases: SessionPhase[]
  phaseIdx: number
  phaseDurations: number[]
  elapsed: number
  onSelectPhase: (i: number) => void
  onToggleShowPhaseEdit: () => void
}) {
  if (!running || chromeHidden) return null

  return (
    /* ── Session Phase Progress Bar ── */
    <div ref={phaseBarRef} className="bg-white border-b border-brand-100 px-4 py-2 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200" dir="rtl">
      <span className="text-gray-400 text-[10px] font-black flex-shrink-0">مراحل</span>
      <div className="flex items-center gap-2 flex-1">
        {phases.map((ph, i) => {
          const isActive = i === phaseIdx
          const isDone   = i < phaseIdx
          const phaseStartSec = phaseDurations.slice(0, i).reduce((a, b) => a + b, 0) * 60
          const phaseTotalSec = phaseDurations[i] * 60
          const phaseElapsed  = isActive ? Math.max(0, elapsed - phaseStartSec) : 0
          const progress = isActive
            ? Math.min(100, (phaseElapsed / phaseTotalSec) * 100)
            : isDone ? 100 : 0
          return (
            <button
              key={ph.id}
              onClick={() => onSelectPhase(i)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition-all ${isActive ? 'animate-pop' : ''}`}
              style={{
                background: isActive ? `${ph.color}16` : 'transparent',
                border: isActive ? `1px solid ${ph.color}55` : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-1 w-full">
                <span className="text-[11px]">{ph.icon}</span>
                <span
                  className="text-[10px] font-black truncate"
                  style={{ color: isActive ? ph.color : isDone ? '#9CA3AF' : '#D1D5DB' }}
                >
                  {ph.label}
                </span>
                {isActive && (
                  <span className="text-[9px] mr-auto ltr-num" style={{ color: `${ph.color}99` }}>
                    {formatTime(phaseElapsed)}/{phaseDurations[i]}د
                  </span>
                )}
                {isDone && <span className="text-[9px] mr-auto text-calm-teal">✓</span>}
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden bg-surface-page">
                <div
                  className="h-full w-full rounded-full transition-all duration-1000"
                  style={{
                    background: ph.color,
                    opacity: isDone ? 0.4 : 1,
                    transform: `scaleX(${progress / 100})`,
                    transformOrigin: 'right center',
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>
      {/* Phase duration edit — simple inline inputs */}
      <button
        onClick={onToggleShowPhaseEdit}
        className="text-gray-300 hover:text-brand-600 text-[10px] font-bold flex-shrink-0 transition-colors px-1"
        title="تعديل مدة المراحل"
      >
        ⚙
      </button>
    </div>
  )
}
