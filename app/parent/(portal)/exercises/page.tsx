'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Clock, Star, CheckCircle, Play, X, ChevronRight, ChevronLeft } from 'lucide-react'
import type { Exercise, Student } from '@/lib/types'

const CAT_LABELS: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن',
  energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}
const CAT_COLORS: Record<string, string> = {
  motor:   'bg-blue-100 text-blue-700',
  focus:   'bg-purple-100 text-purple-700',
  balance: 'bg-teal-100 text-teal-700',
  energy:  'bg-orange-100 text-orange-700',
  sensory: 'bg-pink-100 text-pink-700',
  social:  'bg-emerald-100 text-emerald-700',
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-brand-600 text-4xl animate-pulse">🏃</div>
    </div>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">التمارين</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {child ? `برنامج ${child.firstName} • ${child.ageGroup} سنة • ${child.diagnosis}` : 'جميع التمارين'}
        </p>
      </div>

      {/* ── Physical exercises library ── */}
      <div>
        <h2 className="font-black text-gray-900 mb-1">مكتبة التمارين الجسدية</h2>
        <p className="text-gray-400 text-xs mb-4">تمارين يومية مع الطفل في المنزل</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-brand-50 rounded-2xl p-3 text-center">
            <div className="font-black text-xl text-brand-700 ltr-num">{exercises.length}</div>
            <div className="text-xs text-brand-600">متاح</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <div className="font-black text-xl text-green-700 ltr-num">{completed.size}</div>
            <div className="text-xs text-green-600">منجز اليوم</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <div className="font-black text-xl text-amber-700 ltr-num">{completed.size * 50}</div>
            <div className="text-xs text-amber-600">نقطة</div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === cat ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
              }`}>
              {cat === 'all' ? 'الكل' : CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Exercise grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لا توجد تمارين في هذه الفئة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(ex => {
              const done = completed.has(ex.id)
              return (
                <button key={ex.id} onClick={() => !done && openExercise(ex)} disabled={done}
                  className={`text-right bg-white rounded-2xl border-2 p-4 transition-all ${
                    done ? 'border-green-200 bg-green-50 cursor-default' : 'border-gray-100 hover:border-brand-200 hover:shadow-sm cursor-pointer'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${CAT_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                      {CAT_LABELS[ex.category] || ex.category}
                    </span>
                    {done
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5"><Star className="w-3 h-3" />{ex.points}</span>
                    }
                  </div>
                  <h3 className="font-black text-gray-900 text-sm leading-tight mb-1">{ex.titleAr || ex.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2">{ex.descriptionAr || ex.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /><span className="ltr-num">{ex.durationMinutes}د</span>
                    </span>
                    {done
                      ? <span className="text-xs text-green-600 font-bold">✓ تم</span>
                      : <span className="text-xs text-brand-600 font-bold flex items-center gap-1"><Play className="w-3 h-3" />ابدأ</span>
                    }
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Exercise player modal ── */}
      {selected && (() => {
        const steps = selected.instructionsAr || selected.instructions || []
        const totalSteps = steps.length
        const isLast = step >= totalSteps - 1
        const pct = totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className={`bg-gradient-to-l from-brand-600 to-brand-800 p-4 text-white flex-shrink-0`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/20`}>
                    {CAT_LABELS[selected.category] || selected.category}
                  </span>
                  <button onClick={() => { setSelected(null); setTimerActive(false) }}
                    className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="font-black text-lg leading-tight mb-2">{selected.titleAr || selected.title}</h2>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white/70 text-xs ltr-num">{step + 1}/{totalSteps}</span>
                </div>

                {/* Timer */}
                {timerActive && (
                  <div className="mt-2 bg-white/15 rounded-xl px-3 py-1.5 flex items-center justify-between">
                    <span className="text-white/70 text-xs">وقت التمرين</span>
                    <span className="font-black text-lg ltr-num">{fmtTime(timer)}</span>
                  </div>
                )}
              </div>

              {/* Step content — ONE step big and prominent */}
              <div className="flex-1 overflow-y-auto p-5">
                {!timerActive ? (
                  /* Pre-start: show goal + equipment */
                  <div className="space-y-4">
                    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-brand-700 mb-1">الهدف العلمي</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{selected.psychologyObjectiveAr || selected.psychologyObjective}</p>
                    </div>
                    {selected.equipment?.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-700 mb-2">📦 الأدوات المطلوبة</p>
                        <div className="flex flex-wrap gap-2">
                          {selected.equipment.map(eq => (
                            <span key={eq} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{eq}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-2xl p-4">
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
                  /* Active: ONE big step card */
                  <div className="flex flex-col items-center text-center min-h-[200px] justify-center">
                    {/* Big step number */}
                    <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg">
                      {step + 1}
                    </div>
                    {/* Step text — large and readable */}
                    <p className="text-gray-900 font-bold text-xl leading-relaxed max-w-sm">
                      {steps[step]}
                    </p>
                    {/* Dots progress */}
                    <div className="flex gap-2 mt-6">
                      {steps.map((_, i) => (
                        <div key={i} className={`rounded-full transition-all ${
                          i === step ? 'w-6 h-3 bg-brand-600' : i < step ? 'w-3 h-3 bg-green-400' : 'w-3 h-3 bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom nav */}
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                {!timerActive ? (
                  <button onClick={() => setTimerActive(true)}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-lg">
                    <Play className="w-5 h-5" />
                    ابدأ التمرين
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                      className="w-14 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {!isLast ? (
                      <button onClick={() => setStep(s => s + 1)}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 rounded-2xl transition-colors text-base">
                        التالي ←
                      </button>
                    ) : (
                      <button onClick={completeExercise}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle className="w-5 h-5" />
                        تم! +{selected.points} نقطة 🎉
                      </button>
                    )}
                    <button onClick={() => setStep(s => Math.min(totalSteps - 1, s + 1))} disabled={isLast}
                      className="w-14 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-colors">
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
