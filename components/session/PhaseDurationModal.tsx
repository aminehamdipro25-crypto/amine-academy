'use client'
import type { SessionPhase } from '@/lib/session-constants'

export default function PhaseDurationModal({
  show,
  onClose,
  phases,
  phaseDurations,
  onChangeDurations,
}: {
  show: boolean
  onClose: () => void
  phases: SessionPhase[]
  phaseDurations: number[]
  onChangeDurations: (next: number[]) => void
}) {
  if (!show) return null
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        style={{ background: '#0F172A', border: '1.5px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-base">⚙ ضبط مراحل الجلسة</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          {phases.map((ph, i) => (
            <div
              key={ph.id}
              className="flex items-center gap-4 rounded-2xl px-4 py-3"
              style={{ background: `${ph.color}14`, border: `1px solid ${ph.color}35` }}
            >
              <span className="text-2xl flex-shrink-0">{ph.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm mb-2" style={{ color: ph.color }}>{ph.label}</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onChangeDurations(phaseDurations.map((d, idx) => idx === i ? Math.max(1, d - 1) : d))}
                    className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-90 select-none"
                    style={{ background: `${ph.color}25`, color: ph.color }}
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="font-black text-3xl text-white ltr-num">{phaseDurations[i]}</span>
                    <span className="text-white/40 text-sm mr-1.5">د</span>
                  </div>
                  <button
                    onClick={() => onChangeDurations(phaseDurations.map((d, idx) => idx === i ? Math.min(60, d + 1) : d))}
                    className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-90 select-none"
                    style={{ background: `${ph.color}25`, color: ph.color }}
                  >+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-white/40 text-sm">
            المجموع: <span className="text-white font-black ltr-num">{phaseDurations.reduce((a, b) => a + b, 0)}</span> دقيقة
          </div>
          <button
            onClick={onClose}
            className="bg-brand-600 hover:bg-brand-500 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            تأكيد ✓
          </button>
        </div>
      </div>
    </div>
  )
}
