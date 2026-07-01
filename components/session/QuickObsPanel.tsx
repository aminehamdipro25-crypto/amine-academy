'use client'
import { QUICK_OBS, type ObsEntry } from '@/lib/session-constants'
import { formatTime } from '@/lib/session-helpers'

export default function QuickObsPanel({
  running,
  chromeHidden,
  obsOpen,
  onToggle,
  obsLog,
  onLog,
  elapsed,
}: {
  running: boolean
  chromeHidden: boolean
  obsOpen: boolean
  onToggle: () => void
  obsLog: ObsEntry[]
  onLog: (text: string, category: string, color: string) => void
  elapsed: number
}) {
  if (!running) return null
  return (
    <div
      className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
      dir="rtl"
    >
      {obsOpen && (
        <div
          className="mb-2 rounded-2xl p-3 w-72"
          style={{
            background: '#111827',
            border: '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-black text-xs">📝 ملاحظة فورية</span>
            <button
              onClick={onToggle}
              className="text-white/40 hover:text-white text-lg leading-none"
            >×</button>
          </div>
          <div className="space-y-2">
            {QUICK_OBS.map(cat => (
              <div key={cat.category}>
                <div className="text-[10px] font-black mb-1.5 px-1" style={{ color: cat.color }}>
                  {cat.category}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {cat.items.map(item => (
                    <button
                      key={item.text}
                      onClick={() => onLog(item.text, cat.category, cat.color)}
                      className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all active:scale-95 hover:ring-1"
                      style={{
                        background: cat.bg,
                        border: `1px solid ${cat.color}33`,
                      }}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>
                      <span className="text-[9px] font-bold text-white/70 leading-tight text-center">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-center">
            <span className="text-white/25 text-[9px]">الوقت الحالي في الجلسة: {formatTime(elapsed)}</span>
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
        style={obsOpen
          ? { background: '#374151', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }
          : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
        }
      >
        📝
        <span>ملاحظة</span>
        {obsLog.length > 0 && (
          <span
            className="font-black text-[10px] px-1.5 py-0.5 rounded-full ltr-num"
            style={{ background: '#7C5CFC', color: '#FFFFFF' }}
          >
            {obsLog.length}
          </span>
        )}
      </button>
    </div>
  )
}
