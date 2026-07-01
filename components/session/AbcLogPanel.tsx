'use client'
import type { ABCEntry } from '@/lib/session-constants'

export interface AbcFormState {
  antecedent: string
  behavior: string
  consequence: string
  intensity: 1|2|3
}

export default function AbcLogPanel({
  running,
  chromeHidden,
  abcOpen,
  onToggle,
  abcForm,
  onChangeForm,
  abcLog,
  onLog,
}: {
  running: boolean
  chromeHidden: boolean
  abcOpen: boolean
  onToggle: () => void
  abcForm: AbcFormState
  onChangeForm: (updater: (prev: AbcFormState) => AbcFormState) => void
  abcLog: ABCEntry[]
  onLog: () => void
}) {
  if (!running) return null
  const canLog = !!(abcForm.antecedent || abcForm.behavior)
  return (
    <div
      className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
      style={{ marginRight: 190 }}
      dir="rtl"
    >
      {abcOpen && (
        <div
          className="mb-2 rounded-2xl p-4 w-80"
          style={{ background: '#111827', border: '1.5px solid rgba(245,158,11,0.3)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-400 font-black text-xs">🔗 تحليل ABC</span>
            <button onClick={onToggle} className="text-white/40 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-black text-blue-400 mb-1 block">A — السابق (ما حدث قبل)</label>
              <input
                value={abcForm.antecedent}
                onChange={e => onChangeForm(f => ({ ...f, antecedent: e.target.value }))}
                placeholder="ما الذي سبق السلوك؟"
                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(96,165,250,0.4)' }}
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-amber-400 mb-1 block">B — السلوك (ما حدث)</label>
              <input
                value={abcForm.behavior}
                onChange={e => onChangeForm(f => ({ ...f, behavior: e.target.value }))}
                placeholder="صِف السلوك بدقة..."
                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.4)' }}
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-green-400 mb-1 block">C — النتيجة (ردة الفعل)</label>
              <input
                value={abcForm.consequence}
                onChange={e => onChangeForm(f => ({ ...f, consequence: e.target.value }))}
                placeholder="ما الذي تلا السلوك؟"
                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(74,222,128,0.4)' }}
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 mb-1 block">الحدة</label>
              <div className="flex gap-1.5">
                {([1,2,3] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => onChangeForm(f => ({ ...f, intensity: v }))}
                    className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: abcForm.intensity === v
                        ? v === 1 ? '#22C55E' : v === 2 ? '#F59E0B' : '#EF4444'
                        : 'rgba(255,255,255,0.08)',
                      color: abcForm.intensity === v ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {v === 1 ? 'خفيف' : v === 2 ? 'متوسط' : 'شديد'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onLog}
            disabled={!canLog}
            className="mt-3 w-full py-2.5 rounded-xl font-black text-sm transition-all"
            style={{
              background: canLog ? '#F59E0B' : 'rgba(255,255,255,0.06)',
              color: canLog ? '#000000' : 'rgba(255,255,255,0.2)',
            }}
          >
            حفظ السجل ✓
          </button>
        </div>
      )}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
        style={abcOpen
          ? { background: '#F59E0B', color: '#000000', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }
          : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
        }
      >
        🔗 ABC
        {abcLog.length > 0 && (
          <span className="font-black text-[10px] px-1.5 py-0.5 rounded-full ltr-num bg-amber-500 text-black">
            {abcLog.length}
          </span>
        )}
      </button>
    </div>
  )
}
