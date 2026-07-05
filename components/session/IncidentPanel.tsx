'use client'
import { useState } from 'react'

export interface IncidentEntry {
  id: string
  type: string
  severity: 1 | 2 | 3
  notes: string
  ts: string
  elapsed: string
}

const INCIDENT_TYPES = [
  { id: 'meltdown',   label: 'نوبة غضب / انهيار',      emoji: '😤' },
  { id: 'panic',      label: 'ذعر / قلق شديد',          emoji: '😨' },
  { id: 'self-harm',  label: 'إيذاء النفس',              emoji: '🚨' },
  { id: 'aggression', label: 'عدوانية / إيذاء الآخرين', emoji: '⚠️' },
  { id: 'elopement',  label: 'هروب / مغادرة مفاجئة',    emoji: '🏃' },
  { id: 'injury',     label: 'سقوط / إصابة جسدية',       emoji: '🩹' },
  { id: 'other',      label: 'أخرى',                     emoji: '📋' },
]

const SEVERITY: Record<number, { label: string; color: string }> = {
  1: { label: 'خفيف',  color: '#22C55E' },
  2: { label: 'متوسط', color: '#F59E0B' },
  3: { label: 'شديد',  color: '#EF4444' },
}

export default function IncidentPanel({
  running, chromeHidden, open, onToggle, log, elapsed, onLog,
}: {
  running: boolean
  chromeHidden: boolean
  open: boolean
  onToggle: () => void
  log: IncidentEntry[]
  elapsed: string
  onLog: (entry: Omit<IncidentEntry, 'id' | 'ts' | 'elapsed'>) => void
}) {
  if (!running) return null
  return (
    <div
      className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
      style={{ marginRight: 100 }}
      dir="rtl"
    >
      {open && <IncidentForm elapsed={elapsed} onClose={onToggle} onLog={onLog} log={log} />}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? '#DC2626' : 'linear-gradient(135deg,#DC2626,#9B1C1C)',
          boxShadow: '0 8px 24px rgba(220,38,38,0.4)',
          border: '1.5px solid rgba(255,255,255,0.15)',
        }}
      >
        🚨 حادثة
        {log.length > 0 && (
          <span className="bg-white/30 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ltr-num">
            {log.length}
          </span>
        )}
      </button>
    </div>
  )
}

function IncidentForm({
  elapsed, onClose, onLog, log,
}: {
  elapsed: string
  onClose: () => void
  onLog: (entry: Omit<IncidentEntry, 'id' | 'ts' | 'elapsed'>) => void
  log: IncidentEntry[]
}) {
  const [type, setType]         = useState('')
  const [severity, setSeverity] = useState<1|2|3>(2)
  const [notes, setNotes]       = useState('')
  const [saved, setSaved]       = useState(false)

  function submit() {
    if (!type) return
    onLog({ type, severity, notes: notes.trim() })
    setType('')
    setNotes('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div
      className="mb-2 rounded-2xl p-4 w-80"
      style={{ background: '#111827', border: '1.5px solid rgba(220,38,38,0.4)', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-red-400 font-black text-xs">🚨 تسجيل حادثة</span>
        <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
      </div>

      {saved && (
        <div className="mb-3 bg-green-900/40 border border-green-500/30 text-green-400 text-xs font-black px-3 py-2 rounded-xl">
          ✓ سُجِّلت الحادثة
        </div>
      )}

      {/* Type picker */}
      <div className="mb-3">
        <label className="text-[10px] font-black text-red-400 mb-1.5 block">نوع الحادثة</label>
        <div className="grid grid-cols-2 gap-1.5">
          {INCIDENT_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className="text-right px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all"
              style={{
                background: type === t.id ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${type === t.id ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.08)'}`,
                color: type === t.id ? '#FCA5A5' : '#9CA3AF',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="mb-3">
        <label className="text-[10px] font-black text-gray-400 mb-1.5 block">شدة الحادثة</label>
        <div className="flex gap-1.5">
          {([1, 2, 3] as const).map(s => (
            <button key={s} onClick={() => setSeverity(s)}
              className="flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all"
              style={{
                background: severity === s ? `${SEVERITY[s].color}25` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${severity === s ? SEVERITY[s].color : 'rgba(255,255,255,0.08)'}`,
                color: severity === s ? SEVERITY[s].color : '#6B7280',
              }}
            >
              {SEVERITY[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="ملاحظات إضافية (اختياري)..."
        className="w-full text-white text-xs rounded-xl p-2.5 resize-none focus:outline-none mb-3"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', minHeight: 52 }}
        rows={2}
      />

      <button onClick={submit} disabled={!type}
        className="w-full py-2 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: type ? 'linear-gradient(135deg,#DC2626,#9B1C1C)' : 'rgba(255,255,255,0.08)' }}
      >
        تسجيل الحادثة
      </button>

      {/* Recent log */}
      {log.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">سجل الحوادث ({log.length})</div>
          {log.slice(-3).reverse().map(e => (
            <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{INCIDENT_TYPES.find(t => t.id === e.type)?.emoji ?? '📋'}</span>
                <span className="text-[9px] text-gray-400 truncate max-w-[100px]">
                  {INCIDENT_TYPES.find(t => t.id === e.type)?.label ?? e.type}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black" style={{ color: SEVERITY[e.severity]?.color }}>
                  {SEVERITY[e.severity]?.label}
                </span>
                <span className="text-[9px] text-gray-600 ltr-num">{e.elapsed}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
