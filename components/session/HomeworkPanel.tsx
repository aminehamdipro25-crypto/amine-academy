'use client'
import { EXERCISES } from '@/lib/session-constants'

export default function HomeworkPanel({
  running,
  currentStudentId,
  chromeHidden,
  hwOpen,
  onToggle,
  hwSelected,
  setHwSelected,
  hwNote,
  setHwNote,
  hwSent,
  hwSending,
  studentAge,
  onSend,
}: {
  running: boolean
  currentStudentId: string
  chromeHidden: boolean
  hwOpen: boolean
  onToggle: () => void
  hwSelected: string[]
  setHwSelected: React.Dispatch<React.SetStateAction<string[]>>
  hwNote: string
  setHwNote: React.Dispatch<React.SetStateAction<string>>
  hwSent: boolean
  hwSending: boolean
  studentAge: number
  onSend: () => void
}) {
  if (!running || !currentStudentId) return null
  const ageFiltered = EXERCISES.filter(e => studentAge >= (e.ageMin ?? 5) && studentAge <= (e.ageMax ?? 22))
  return (
    <div
      className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
      style={{ marginRight: 96 }}
      dir="rtl"
    >
      {hwOpen && (
        <div
          className="mb-2 rounded-2xl p-4 w-80"
          style={{ background: '#111827', border: '1.5px solid rgba(34,197,94,0.3)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-400 font-black text-xs">🏠 الواجب المنزلي</span>
            <button onClick={onToggle} className="text-white/40 hover:text-white text-lg leading-none">×</button>
          </div>
          {hwSent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-400 font-black">تم الإرسال للطالب!</p>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-[10px] mb-3">اختر حتى 3 تمارين للواجب المنزلي</p>
              <div className="space-y-1 max-h-52 overflow-y-auto mb-3">
                {ageFiltered.map(ex => {
                  const sel = hwSelected.includes(ex.id)
                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        if (sel) {
                          setHwSelected(prev => prev.filter(id => id !== ex.id))
                        } else if (hwSelected.length < 3) {
                          setHwSelected(prev => [...prev, ex.id])
                        }
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl transition-all text-right"
                      style={{
                        background: sel ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                        border: sel ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
                        opacity: !sel && hwSelected.length >= 3 ? 0.4 : 1,
                      }}
                    >
                      <span className="text-lg">{ex.icon}</span>
                      <span className="text-white text-xs font-bold flex-1 text-right">{ex.labelAr}</span>
                      {sel && <span className="text-green-400 text-xs">✓</span>}
                    </button>
                  )
                })}
              </div>
              <textarea
                value={hwNote}
                onChange={e => setHwNote(e.target.value)}
                placeholder="ملاحظة للطالب (اختياري)..."
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-green-400 mb-3 resize-none"
                rows={2}
                dir="rtl"
              />
              <button
                onClick={onSend}
                disabled={hwSelected.length === 0 || hwSending}
                className="w-full py-2.5 rounded-xl font-black text-sm transition-all"
                style={{
                  background: hwSelected.length > 0 ? '#22C55E' : 'rgba(255,255,255,0.06)',
                  color: hwSelected.length > 0 ? '#000000' : 'rgba(255,255,255,0.2)',
                }}
              >
                {hwSending ? '...' : `إرسال (${hwSelected.length}/3) →`}
              </button>
            </>
          )}
        </div>
      )}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
        style={hwOpen
          ? { background: '#22C55E', color: '#000000', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }
          : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
        }
      >
        🏠 واجب
        {hwSent && <span className="text-green-400 text-[10px]">✓</span>}
      </button>
    </div>
  )
}
