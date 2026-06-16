'use client'
import { useEffect, useState, useCallback } from 'react'
import { Clock, Star, CheckCircle, Play, X, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import type { Exercise, Student } from '@/lib/types'

// ── Category config ───────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن',
  energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}
const CAT_CFG: Record<string, { gradient: string; icon: string; light: string; shadow: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#E05A2A)', icon: '🏃', light: '#FFF5F0', shadow: 'rgba(255,107,53,0.30)' },
  focus:   { gradient: 'linear-gradient(135deg,#7C5CFC,#5A32D9)', icon: '🎯', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.30)' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#0D9488)', icon: '⚖️', light: '#F0FDFA', shadow: 'rgba(42,191,163,0.30)' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#E07B00)', icon: '⚡', light: '#FFFBEB', shadow: 'rgba(255,186,68,0.30)' },
  sensory: { gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', icon: '🌈', light: '#FDF2F8', shadow: 'rgba(236,72,153,0.30)' },
  social:  { gradient: 'linear-gradient(135deg,#10B981,#047857)', icon: '🤝', light: '#ECFDF5', shadow: 'rgba(16,185,129,0.30)' },
}
const DEFAULT_CFG = { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '⭐', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.25)' }

// ── Per-step emoji detector ───────────────────────────────────
function stepEmoji(text: string, cat: string): string {
  if (text.includes('تنفس') || text.includes('نفساً') || text.includes('زفير') || text.includes('شهيق')) return '💨'
  if (text.includes('فقاعة') || text.includes('نفخ')) return '🫧'
  if (text.includes('دب')) return '🐻'
  if (text.includes('ضفدع') || text.includes('اقفز') || text.includes('قفز')) return '🐸'
  if (text.includes('أفعى') || text.includes('ازحف') || text.includes('زحف')) return '🐍'
  if (text.includes('حصان') || text.includes('اركض') || text.includes('اجرِ')) return '🐴'
  if (text.includes('بالون')) return '🎈'
  if (text.includes('كرة')) return '⚽'
  if (text.includes('موسيقى') || text.includes('إيقاع') || text.includes('ميترونوم')) return '🎵'
  if (text.includes('استمع') || text.includes('اسمع') || text.includes('صوت')) return '👂'
  if (text.includes('انظر') || text.includes('عين') || text.includes('بصر') || text.includes('ترى') || text.includes('تراها')) return '👁️'
  if (text.includes('لمس') || text.includes('الملس') || text.includes('تلمس')) return '🤚'
  if (text.includes('شمّ') || text.includes('تشمه') || text.includes('رائحة')) return '👃'
  if (text.includes('تذوق') || text.includes('طعم')) return '👅'
  if (text.includes('امشِ') || text.includes('مشي') || text.includes('خطوة') || text.includes('خطوات')) return '🚶'
  if (text.includes('تصفيق') || text.includes('صفق') || text.includes('ضرب')) return '👏'
  if (text.includes('قف') || text.includes('تجمّد') || text.includes('اثبت') || text.includes('لا تتحرك')) return '🧍'
  if (text.includes('جلس') || text.includes('اجلس')) return '🧘'
  if (text.includes('ارفع') || text.includes('رفع')) return '💪'
  if (text.includes('ارمِ') || text.includes('رمي') || text.includes('قذف')) return '🎯'
  if (text.includes('ذراع') || text.includes('يد')) return '🙌'
  if (text.includes('استرح') || text.includes('راحة')) return '😮‍💨'
  if (text.includes('ابدأ') || text.includes('استعد') || text.includes('جهّز')) return '🚀'
  if (text.includes('كرر') || text.includes('تكرار')) return '🔄'
  if (text.includes('خط') || text.includes('توازن')) return '⚖️'
  if (text.includes('سيمون')) return '🎮'
  if (text.includes('هدف') || text.includes('رقم')) return '🎯'
  if (text.includes('تأمل') || text.includes('يقظ')) return '🌟'
  if (text.includes('ماء') || text.includes('سباح')) return '🌊'
  if (text.includes('كتاب') || text.includes('اقرأ')) return '📖'
  return { motor: '🏃', focus: '🎯', balance: '⚖️', energy: '⚡', sensory: '🌈', social: '🤝' }[cat] || '⭐'
}

// Shorten a step to a punchy 3-6 word title for the child
function shortStep(text: string): string {
  // Strip parentheticals like (4 دقائق)
  const clean = text.replace(/\([^)]*\)/g, '').trim()
  // Take text before first em-dash, colon, or Arabic comma
  const parts = clean.split(/[—:؛،]/)
  const first = parts[0].trim()
  if (first.length <= 30) return first
  return first.split(' ').slice(0, 5).join(' ')
}

// Equipment emoji mapper
function equipEmoji(eq: string): string {
  if (eq.includes('بالون') || eq.includes('balloon')) return '🎈'
  if (eq.includes('كرة') || eq.includes('ball')) return '⚽'
  if (eq.includes('ماء') || eq.includes('water') || eq.includes('pool')) return '🌊'
  if (eq.includes('حصير') || eq.includes('mat') || eq.includes('yoga')) return '🟣'
  if (eq.includes('موسيق') || eq.includes('music') || eq.includes('metro')) return '🎵'
  if (eq.includes('ورق') || eq.includes('paper') || eq.includes('worksheet')) return '📄'
  if (eq.includes('شريط') || eq.includes('tape')) return '🖊️'
  if (eq.includes('كرسي') || eq.includes('chair')) return '🪑'
  if (eq.includes('لعبة') || eq.includes('game') || eq.includes('tablet')) return '📱'
  if (eq.includes('فرش') || eq.includes('brush')) return '🖌️'
  return '📦'
}

export default function ExercisesPage() {
  const [exercises, setExercises]   = useState<Exercise[]>([])
  const [child, setChild]           = useState<Student | null>(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [selected, setSelected]     = useState<Exercise | null>(null)
  const [step, setStep]             = useState(0)
  const [started, setStarted]       = useState(false)
  const [completed, setCompleted]   = useState<Set<string>>(new Set())
  const [timer, setTimer]           = useState(0)
  const [showInfo, setShowInfo]     = useState(false)

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(d => {
        const c = d.children?.[0] || null
        setChild(c)
        const q = c ? `age=${c.ageGroup}&diagnosis=${c.diagnosis}` : ''
        return fetch(`/api/exercises?${q}`)
      })
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [started])

  const openExercise = useCallback((ex: Exercise) => {
    setSelected(ex); setStep(0); setTimer(0); setStarted(false); setShowInfo(false)
  }, [])

  function close() { setSelected(null); setStarted(false) }

  function finish() {
    if (!selected) return
    setCompleted(prev => { const n = new Set(prev); n.add(selected.id); return n })
    close()
  }

  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)
  const cats = ['all', ...Object.keys(CAT_LABELS)]
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-6xl" style={{ animation: 'spin 1s linear infinite' }}>🎮</div>
    </div>
  )

  return (
    <div dir="rtl" className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">التمارين 🎮</h1>
        {child && (
          <p className="text-gray-400 text-sm mt-0.5">
            {child.firstName} • {child.ageGroup} سنة • {child.diagnosis}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'متاح',    value: exercises.length, bg: '#F3EEFF', color: '#5A32D9' },
          { label: 'أنجزت',  value: completed.size,   bg: '#ECFDF5', color: '#059669' },
          { label: 'نقاط',   value: [...completed].reduce((s,id) => s + (exercises.find(e=>e.id===id)?.points||0), 0), bg: '#FFFBEB', color: '#B45309' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
            <div className="font-black text-xl" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {cats.map(cat => {
          const active = filter === cat
          const cfg    = CAT_CFG[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-full text-xs font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={active
                ? { background: cfg?.gradient || '#6B46F0', color: '#FFF', boxShadow: `0 2px 8px ${cfg?.shadow || 'rgba(124,92,252,0.3)'}` }
                : { background: '#FFF', color: '#9CA3AF', border: '1.5px solid #E5E7EB' }}
            >
              {cat === 'all' ? '✨ الكل' : `${cfg?.icon} ${CAT_LABELS[cat]}`}
            </button>
          )
        })}
      </div>

      {/* Exercise grid — game cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p>لا توجد تمارين في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map(ex => {
            const done = completed.has(ex.id)
            const cfg  = CAT_CFG[ex.category] || DEFAULT_CFG
            return (
              <button
                key={ex.id}
                onClick={() => !done && openExercise(ex)}
                disabled={done}
                className="relative rounded-3xl overflow-hidden text-right transition-all duration-200 active:scale-95"
                style={{
                  boxShadow: done ? 'none' : `0 6px 20px ${cfg.shadow}`,
                  opacity: done ? 0.75 : 1,
                  border: done ? '2px solid #D1FAE5' : 'none',
                }}
              >
                <div
                  className="p-4 h-44 flex flex-col justify-between"
                  style={{ background: done ? '#F0FFF4' : cfg.gradient }}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.25)', color: done ? '#065F46' : '#FFF' }}
                    >
                      {CAT_LABELS[ex.category]}
                    </span>
                    <span style={{ fontSize: 38, lineHeight: 1 }}>
                      {done ? '✅' : cfg.icon}
                    </span>
                  </div>

                  {/* Bottom */}
                  <div>
                    <p
                      className="font-black text-sm leading-snug line-clamp-2 mb-1"
                      style={{ color: done ? '#065F46' : '#FFF' }}
                    >
                      {ex.titleAr}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold flex items-center gap-0.5"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        <Clock style={{ width: 10, height: 10 }} /> {ex.durationMinutes}د
                      </span>
                      <span className="text-xs font-bold flex items-center gap-0.5"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        ⭐ {ex.points}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════════ EXERCISE MODAL ══════════ */}
      {selected && (() => {
        const steps   = selected.instructionsAr || selected.instructions || []
        const total   = steps.length
        const isLast  = step >= total - 1
        const cfg     = CAT_CFG[selected.category] || DEFAULT_CFG
        const equip   = (selected.equipment || []).filter(e => e && e !== 'none')

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) close() }}
          >
            <div
              className="w-full sm:max-w-md flex flex-col overflow-hidden"
              style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '95vh' }}
            >
              {/* Gradient header */}
              <div className="px-5 pt-6 pb-5 flex-shrink-0" style={{ background: cfg.gradient }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-6xl leading-none">{cfg.icon}</span>
                  <div className="flex items-center gap-2">
                    {/* Info button — reveals academic content for parent */}
                    <button
                      onClick={() => setShowInfo(v => !v)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{ background: 'rgba(255,255,255,0.22)' }}
                      title="الهدف العلمي"
                    >
                      <Info className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={close}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.22)' }}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <h2 className="text-white font-black text-xl leading-snug mb-2">{selected.titleAr}</h2>
                <div className="flex items-center gap-4 text-white/80 text-xs font-bold">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.durationMinutes} دقيقة</span>
                  <span>⭐ {selected.points} نقطة</span>
                  {started && <span className="font-black text-base text-white">{fmt(timer)}</span>}
                </div>
                {/* Step progress bar — visible only during exercise */}
                {started && (
                  <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${((step + 1) / total) * 100}%`, background: '#FFF' }}
                    />
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">

                {/* ── PRE-START VIEW ── */}
                {!started && (
                  <div className="p-5 space-y-4">

                    {/* Scientific info panel (hidden by default, parent can toggle) */}
                    {showInfo && (
                      <div className="rounded-2xl p-4" style={{ background: '#F3EEFF', border: '1px solid #E8DBFF' }}>
                        <p className="text-xs font-black mb-1" style={{ color: '#5A32D9' }}>🔬 الهدف العلمي (للأهل)</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{selected.psychologyObjectiveAr || selected.psychologyObjective}</p>
                      </div>
                    )}

                    {/* Simple child-friendly description */}
                    <div
                      className="rounded-3xl p-5 text-center"
                      style={{ background: cfg.light, border: `2px solid ${cfg.shadow.replace('0.30','0.15')}` }}
                    >
                      <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>{cfg.icon}</div>
                      <p className="font-bold text-gray-700 text-sm leading-relaxed">
                        {selected.descriptionAr?.split(/[—–]/)[0].trim() || selected.titleAr}
                      </p>
                    </div>

                    {/* Equipment — child-friendly chips */}
                    {equip.length > 0 && (
                      <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <p className="text-xs font-black text-amber-700 mb-3">📦 ستحتاج إلى:</p>
                        <div className="flex flex-wrap gap-2">
                          {equip.map((eq, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl"
                              style={{ background: '#FEF3C7', color: '#92400E' }}
                            >
                              {equipEmoji(eq)} {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step preview — big numbers, short text, NO description */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0E8FF' }}>
                      <div className="px-4 py-2.5" style={{ background: '#F3EEFF' }}>
                        <p className="text-xs font-black" style={{ color: '#5A32D9' }}>📋 الخطوات ({total})</p>
                      </div>
                      {steps.slice(0, 4).map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-3"
                          style={{ borderTop: i > 0 ? '1px solid #F0E8FF' : 'none' }}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                            style={{ background: '#7C5CFC', color: '#FFF' }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-sm text-gray-700 font-bold line-clamp-1">{shortStep(s)}</p>
                        </div>
                      ))}
                      {total > 4 && (
                        <div className="px-4 py-3 text-center text-xs text-gray-400 font-bold"
                          style={{ borderTop: '1px solid #F0E8FF' }}>
                          + {total - 4} خطوات أخرى...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── ACTIVE STEP VIEW ── */}
                {started && (
                  <div className="flex flex-col items-center text-center px-6 py-8" style={{ minHeight: 320 }}>

                    {/* Giant step emoji */}
                    <div style={{
                      fontSize: 108,
                      lineHeight: 1,
                      marginBottom: 20,
                      filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))',
                      animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                    }}>
                      {stepEmoji(steps[step], selected.category)}
                    </div>

                    {/* Short punchy title — child reads this */}
                    <p className="font-black leading-tight mb-3"
                      style={{ fontSize: 26, color: '#1e293b', maxWidth: 260 }}>
                      {shortStep(steps[step])}
                    </p>

                    {/* Step dots */}
                    <div className="flex gap-2 mb-6">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: i === step ? 28 : 10, height: 10,
                            background: i === step ? cfg.gradient.split(',')[1]?.replace(')','').trim() || '#7C5CFC'
                              : i < step ? '#4ADE80' : '#E5E7EB',
                          }}
                        />
                      ))}
                    </div>

                    {/* Full instruction — for the supervising adult, subtle */}
                    <div
                      className="w-full rounded-2xl p-4 text-right"
                      style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', maxWidth: 340 }}
                    >
                      <p className="text-xs font-black mb-1" style={{ color: '#94A3B8' }}>💡 للأهل والمشرف</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{steps[step]}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action */}
              <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #F0E8FF' }}>
                {!started ? (
                  <button
                    onClick={() => setStarted(true)}
                    className="w-full text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    style={{ background: cfg.gradient, boxShadow: `0 6px 18px ${cfg.shadow}` }}
                  >
                    <Play className="w-6 h-6 fill-white" /> ابدأ! 🚀
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(s => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                      style={{ background: '#F3F4F6' }}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>

                    {!isLast ? (
                      <button
                        onClick={() => setStep(s => s + 1)}
                        className="flex-1 text-white font-black py-3.5 rounded-2xl text-lg transition-all active:scale-95"
                        style={{ background: cfg.gradient, boxShadow: `0 4px 14px ${cfg.shadow}` }}
                      >
                        التالي ←
                      </button>
                    ) : (
                      <button
                        onClick={finish}
                        className="flex-1 text-white font-black py-3.5 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
                      >
                        <CheckCircle className="w-5 h-5" /> انتهيت! 🎉
                      </button>
                    )}

                    <button
                      onClick={() => setStep(s => Math.min(total - 1, s + 1))}
                      disabled={isLast}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                      style={{ background: '#F3F4F6' }}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <style jsx global>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0 }
          70% { transform: scale(1.1) }
          100% { transform: scale(1); opacity: 1 }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
