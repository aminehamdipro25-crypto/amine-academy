'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Clock, Star, CheckCircle, Play, X, ChevronRight, ChevronLeft } from 'lucide-react'
import type { Exercise, Student } from '@/lib/types'

const CAT_LABELS: Record<string, string> = {
  motor: 'حركي',
  focus: 'تركيز',
  balance: 'توازن',
  energy: 'طاقة',
  sensory: 'حسي',
  social: 'اجتماعي',
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
  beginner:     'مبتدئ',
  intermediate: 'متوسط',
  advanced:     'متقدم',
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

  // Timer effect
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

  function startExercise() {
    setTimerActive(true)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">مكتبة التمارين</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {child ? `تمارين مختارة لـ ${child.firstName} • ${child.ageGroup} سنة • ${child.diagnosis}` : 'جميع التمارين العلمية'}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-brand-50 rounded-2xl p-4 text-center">
          <div className="font-black text-2xl text-brand-700 ltr-num">{exercises.length}</div>
          <div className="text-xs text-brand-600 mt-0.5">تمرين متاح</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="font-black text-2xl text-green-700 ltr-num">{completed.size}</div>
          <div className="text-xs text-green-600 mt-0.5">منجز اليوم</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <div className="font-black text-2xl text-amber-700 ltr-num">{completed.size * 50}</div>
          <div className="text-xs text-amber-600 mt-0.5">نقطة مكتسبة</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
              filter === cat ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
            }`}
          >
            {cat === 'all' ? 'الكل' : CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">لا توجد تمارين في هذه الفئة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(ex => {
            const done = completed.has(ex.id)
            return (
              <div
                key={ex.id}
                className={`bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer hover:shadow-md ${done ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:border-brand-200'}`}
                onClick={() => !done && openExercise(ex)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${CAT_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                      {CAT_LABELS[ex.category] || ex.category}
                    </span>
                    <span className="text-xs text-gray-400">{DIFF_LABELS[ex.difficulty]}</span>
                  </div>
                  {done ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5" />
                      {ex.points}
                    </div>
                  )}
                </div>
                <h3 className="font-black text-gray-900 mb-1 text-sm leading-tight">{ex.titleAr || ex.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{ex.descriptionAr || ex.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="ltr-num">{ex.durationMinutes} دقيقة</span>
                  </span>
                  {done ? (
                    <span className="text-xs text-green-600 font-bold">✓ تم إنجازه</span>
                  ) : (
                    <span className="text-xs text-brand-600 font-bold flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      ابدأ التمرين
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Exercise player modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-l from-brand-600 to-brand-800 rounded-t-3xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/20`}>
                  {CAT_LABELS[selected.category]}
                </span>
                <button onClick={() => { setSelected(null); setTimerActive(false) }} className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h2 className="font-black text-xl mb-1">{selected.titleAr || selected.title}</h2>
              <div className="flex items-center gap-4 text-white/70 text-xs">
                <span className="ltr-num">⏱ {selected.durationMinutes} دقيقة</span>
                <span>⭐ {selected.points} نقطة</span>
                <span>{DIFF_LABELS[selected.difficulty]}</span>
              </div>
              {/* Timer */}
              {timerActive && (
                <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="font-black text-2xl ltr-num">{fmtTime(timer)}</div>
                  <div className="text-white/70 text-xs">وقت التمرين</div>
                </div>
              )}
            </div>

            <div className="p-5">
              {/* Scientific objective */}
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-brand-700 mb-1">الهدف العلمي</p>
                <p className="text-gray-700 text-sm leading-relaxed">{selected.psychologyObjectiveAr || selected.psychologyObjective}</p>
              </div>

              {/* Steps */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500">خطوات التمرين</p>
                  <span className="text-xs text-gray-400 ltr-num">{step + 1} / {selected.instructionsAr?.length || selected.instructions.length}</span>
                </div>
                <div className="space-y-2">
                  {(selected.instructionsAr || selected.instructions).map((inst, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${i === step ? 'bg-brand-50 border-2 border-brand-200' : i < step ? 'bg-green-50 opacity-60' : 'bg-gray-50 opacity-50'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <p className={`text-sm leading-relaxed ${i === step ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{inst}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              {selected.equipment?.length > 0 && (
                <div className="mb-5 bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 mb-2">الأدوات المطلوبة</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.equipment.map(eq => (
                      <span key={eq} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{eq}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                {!timerActive ? (
                  <button onClick={startExercise} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                    <Play className="w-4 h-4" />
                    ابدأ التمرين
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setStep(s => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="w-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {step < (selected.instructionsAr || selected.instructions).length - 1 ? (
                      <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black py-3 rounded-2xl transition-colors">
                        الخطوة التالية
                      </button>
                    ) : (
                      <button onClick={completeExercise} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        إنهاء التمرين (+{selected.points} نقطة)
                      </button>
                    )}
                    <button
                      onClick={() => setStep(s => Math.min((selected.instructionsAr || selected.instructions).length - 1, s + 1))}
                      disabled={step >= (selected.instructionsAr || selected.instructions).length - 1}
                      className="w-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
