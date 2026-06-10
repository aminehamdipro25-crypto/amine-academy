'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Clock, Star, CheckCircle, Play, X, ChevronRight, ChevronLeft } from 'lucide-react'
import type { Exercise, Student } from '@/lib/types'

const CAT_LABELS: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن',
  energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}

const CAT_CFG: Record<string, { bg: string; color: string }> = {
  motor:   { bg: '#EFF6FF', color: '#1D4ED8' },
  focus:   { bg: '#F3EEFF', color: '#5A32D9' },
  balance: { bg: '#F0FDFA', color: '#0F766E' },
  energy:  { bg: '#FFF7ED', color: '#C2410C' },
  sensory: { bg: '#FDF2F8', color: '#BE185D' },
  social:  { bg: '#ECFDF5', color: '#065F46' },
}

const DIFF_LABELS: Record<string, string> = {
  beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم',
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [child, setChild] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(d => {
        const c = d.children?.[0] || null
        setChild(c)
        const ageParam = c ? `age=${c.ageGroup}` : ''
        const diagParam = c ? `&diagnosis=${c.diagnosis}` : ''
        return fetch(`/api/exercises?${ageParam}${diagParam}`)
      })
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!timerActive) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [timerActive])

  function openExercise(ex: Exercise) {
    setSelected(ex)
    setStep(0)
    setTimer(0)
    setTimerActive(false)
  }

  function completeExercise() {
    if (!selected) return
    setTimerActive(false)
    setCompleted(prev => { const next = new Set(prev); next.add(selected.id); return next })
    setSelected(null)
  }

  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)
  const categories = ['all', ...Object.keys(CAT_LABELS)]
  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  void DIFF_LABELS

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-4xl animate-pulse">🏃</div>
    </div>
  )

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">التمارين</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {child ? `برنامج ${child.firstName} • ${child.ageGroup} سنة • ${child.diagnosis}` : 'جميع التمارين'}
        </p>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{ background: '#F3EEFF' }}>
          <div className="font-black text-xl ltr-num" style={{ color: '#5A32D9' }}>{exercises.length}</div>
          <div className="text-xs" style={{ color: '#6B46F0' }}>متاح</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: '#ECFDF5' }}>
          <div className="font-black text-xl text-green-700 ltr-num">{completed.size}</div>
          <div className="text-xs text-green-600">منجز اليوم</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: '#FFFBEB' }}>
          <div className="font-black text-xl text-amber-700 ltr-num">{completed.size * 50}</div>
          <div className="text-xs text-amber-600">نقطة</div>
        </div>
      </div>

      {/* ── Category filter ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
            style={
              filter === cat
                ? { background: '#6B46F0', color: '#FFFFFF' }
                : { background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }
            }
            onMouseEnter={e => { if (filter !== cat) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF'; (e.currentTarget as HTMLButtonElement).style.color = '#6B46F0' } }}
            onMouseLeave={e => { if (filter !== cat) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' } }}
          >
            {cat === 'all' ? 'الكل' : CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* ── Exercise grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">لا توجد تمارين في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(ex => {
            const done = completed.has(ex.id)
            const catCfg = CAT_CFG[ex.category] || { bg: '#F9FAFB', color: '#6B7280' }
            return (
              <button
                key={ex.id}
                onClick={() => !done && openExercise(ex)}
                disabled={done}
                className="text-right rounded-2xl p-4 transition-all"
                style={
                  done
                    ? { background: '#F0FFF4', border: '2px solid #BBF7D0', cursor: 'default' }
                    : { background: '#FFFFFF', border: '2px solid #F0E8FF' }
                }
                onMouseEnter={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(124,92,252,0.1)' } }}
                onMouseLeave={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F0E8FF'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' } }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: catCfg.bg, color: catCfg.color }}>
                    {CAT_LABELS[ex.category] || ex.category}
                  </span>
                  {done
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22C55E' }} />
                    : <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5"><Star className="w-3 h-3" />{ex.points}</span>
                  }
                </div>
                <h3 className="font-black text-gray-900 text-sm leading-tight mb-1">{ex.titleAr || ex.title}</h3>
                <p className="text-gray-500 text-xs line-clamp-2">{ex.descriptionAr || ex.description}</p>
                <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /><span className="ltr-num">{ex.durationMinutes}د</span>
                  </span>
                  {done
                    ? <span className="text-xs font-bold" style={{ color: '#16A34A' }}>✓ تم</span>
                    : <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#6B46F0' }}><Play className="w-3 h-3" />ابدأ</span>
                  }
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Exercise player modal ── */}
      {selected && (() => {
        const steps = selected.instructionsAr || selected.instructions || []
        const totalSteps = steps.length
        const isLast = step >= totalSteps - 1
        const pct = totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <div className="rounded-3xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
              {/* Top bar */}
              <div
                className="p-4 text-white flex-shrink-0"
                style={{ background: 'linear-gradient(to left, #6B46F0, #4A20C8)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {CAT_LABELS[selected.category] || selected.category}
                  </span>
                  <button
                    onClick={() => { setSelected(null); setTimerActive(false) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.35)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="font-black text-lg leading-tight mb-2">{selected.titleAr || selected.title}</h2>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: '#FFFFFF' }} />
                  </div>
                  <span className="text-white/70 text-xs ltr-num">{step + 1}/{totalSteps}</span>
                </div>
                {timerActive && (
                  <div className="mt-2 rounded-xl px-3 py-1.5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-white/70 text-xs">وقت التمرين</span>
                    <span className="font-black text-lg ltr-num">{fmtTime(timer)}</span>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto p-5">
                {!timerActive ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4" style={{ background: '#F3EEFF', border: '1px solid #E8DBFF' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#5A32D9' }}>الهدف العلمي</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{selected.psychologyObjectiveAr || selected.psychologyObjective}</p>
                    </div>
                    {selected.equipment?.length > 0 && (
                      <div className="rounded-xl p-3" style={{ background: '#FFFBEB' }}>
                        <p className="text-xs font-bold text-amber-700 mb-2">📦 الأدوات المطلوبة</p>
                        <div className="flex flex-wrap gap-2">
                          {selected.equipment.map(eq => (
                            <span key={eq} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>{eq}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-2xl p-4" style={{ background: '#F9FAFB' }}>
                      <p className="text-xs font-bold text-gray-500 mb-2">الخطوات ({totalSteps} خطوات)</p>
                      <div className="space-y-1">
                        {steps.slice(0, 3).map((s, i) => (
                          <p key={i} className="text-xs text-gray-500 truncate">
                            <span className="font-bold text-gray-700">{i + 1}.</span> {s}
                          </p>
                        ))}
                        {totalSteps > 3 && <p className="text-xs text-gray-400">+{totalSteps - 3} خطوات أخرى...</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center min-h-[200px] justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4"
                      style={{ background: '#6B46F0', boxShadow: '0 8px 24px -4px rgba(107,70,240,0.4)' }}
                    >
                      {step + 1}
                    </div>
                    <p className="text-gray-900 font-bold text-xl leading-relaxed max-w-sm">{steps[step]}</p>
                    <div className="flex gap-2 mt-6">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all"
                          style={{
                            width: i === step ? 24 : 12,
                            height: 12,
                            background: i === step ? '#6B46F0' : i < step ? '#4ADE80' : '#E5E7EB',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom nav */}
              <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #F0E8FF' }}>
                {!timerActive ? (
                  <button
                    onClick={() => setTimerActive(true)}
                    className="w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-lg"
                    style={{ background: '#6B46F0' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
                  >
                    <Play className="w-5 h-5" /> ابدأ التمرين
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(s => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="w-14 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all"
                      style={{ background: '#F3F4F6', color: '#6B7280' }}
                      onMouseEnter={e => { if (step > 0) (e.currentTarget as HTMLButtonElement).style.background = '#E5E7EB' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6' }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {!isLast ? (
                      <button
                        onClick={() => setStep(s => s + 1)}
                        className="flex-1 text-white font-black py-3.5 rounded-2xl transition-all text-base"
                        style={{ background: '#6B46F0' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5A32D9' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
                      >
                        التالي ←
                      </button>
                    ) : (
                      <button
                        onClick={completeExercise}
                        className="flex-1 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
                        style={{ background: '#16A34A' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#15803D' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16A34A' }}
                      >
                        <CheckCircle className="w-5 h-5" /> تم! +{selected.points} نقطة 🎉
                      </button>
                    )}
                    <button
                      onClick={() => setStep(s => Math.min(totalSteps - 1, s + 1))}
                      disabled={isLast}
                      className="w-14 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all"
                      style={{ background: '#F3F4F6', color: '#6B7280' }}
                      onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLButtonElement).style.background = '#E5E7EB' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6' }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
