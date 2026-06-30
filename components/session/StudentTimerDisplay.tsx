'use client'
// Floating large-digit countdown shown to the student (toolbar timer feature #9).
// Extracted out of app/session/[id]/page.tsx — see lib/session-helpers.tsx for
// the formatTime() it relies on.
import { formatTime } from '@/lib/session-helpers'

export default function StudentTimerDisplay({
  left,
  total,
  running,
  onToggleRunning,
  onReset,
  onClose,
}: {
  left: number
  total: number
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed z-[150] flex flex-col items-center justify-center pointer-events-none select-none"
      style={{
        bottom: 80, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        borderRadius: 24,
        padding: '16px 32px',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${left <= total * 0.1 ? '#EF4444' : left <= total * 0.25 ? '#F59E0B' : '#22C55E'}55`,
        boxShadow: `0 0 40px ${left <= total * 0.1 ? '#EF444420' : left <= total * 0.25 ? '#F59E0B20' : '#22C55E20'}`,
        minWidth: 200,
      }}
    >
      <div
        className="font-black ltr-num"
        style={{
          fontSize: '3.5rem',
          color: left <= total * 0.1 ? '#EF4444'
               : left <= total * 0.25 ? '#F59E0B'
               : '#22C55E',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.05em',
        }}
      >
        {formatTime(left)}
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(left / total) * 100}%`,
            background: left <= total * 0.1 ? '#EF4444'
                       : left <= total * 0.25 ? '#F59E0B'
                       : '#22C55E',
          }}
        />
      </div>
      {left === 0 && (
        <div className="text-white font-black text-sm mt-1">انتهى الوقت! ⏰</div>
      )}
      {/* Clickable to pause/resume */}
      <div className="pointer-events-auto mt-2 flex gap-2">
        <button
          onClick={onToggleRunning}
          className="text-white/50 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {running ? '⏸ إيقاف مؤقت' : '▶ استئناف'}
        </button>
        <button
          onClick={onReset}
          className="text-white/50 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          ↺ إعادة
        </button>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white text-xs px-2 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
