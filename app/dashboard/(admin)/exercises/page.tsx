'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dumbbell, RefreshCw, Plus, Filter, Clock, Star, Target, Brain, Zap, Users, Eye, Activity } from 'lucide-react'

interface Exercise {
  id: string
  titleAr: string
  title: string
  descriptionAr: string
  category: string
  ageGroups: string[]
  diagnoses: string[]
  difficulty: string
  durationMinutes: number
  points: number
  psychologyObjectiveAr: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  motor:   { label: 'حركي',          color: 'bg-blue-100 text-blue-700',   icon: Activity },
  focus:   { label: 'تركيز وانتباه', color: 'bg-purple-100 text-purple-700', icon: Brain },
  balance: { label: 'توازن',         color: 'bg-green-100 text-green-700', icon: Target },
  energy:  { label: 'طاقة',          color: 'bg-orange-100 text-orange-700', icon: Zap },
  sensory: { label: 'حسي',           color: 'bg-pink-100 text-pink-700',   icon: Eye },
  social:  { label: 'اجتماعي',       color: 'bg-teal-100 text-teal-700',   icon: Users },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'مبتدئ',   color: 'bg-green-50 text-green-600' },
  intermediate: { label: 'متوسط',   color: 'bg-yellow-50 text-yellow-600' },
  advanced:     { label: 'متقدم',   color: 'bg-red-50 text-red-600' },
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [seedMsg, setSeedMsg] = useState('')
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exercises')
      const data = await res.json()
      setExercises(data.exercises ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSeed(force = false) {
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await fetch('/api/admin/seed-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      setSeedMsg(data.message || (data.ok ? 'تم التحميل' : 'خطأ'))
      if (data.ok) load()
    } catch {
      setSeedMsg('حدث خطأ في الاتصال')
    } finally {
      setSeeding(false)
    }
  }

  const filtered = filterCategory === 'all'
    ? exercises
    : exercises.filter(e => e.category === filterCategory)

  const categoryStats = Object.keys(CATEGORY_CONFIG).map(k => ({
    key: k,
    count: exercises.filter(e => e.category === k).length,
    ...CATEGORY_CONFIG[k],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة التمارين</h1>
          <p className="text-gray-500 text-sm mt-1">مكتبة التمارين العلمية المعتمدة (APA + CBT + ABA)</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          {exercises.length === 0 ? (
            <button onClick={() => handleSeed(false)} disabled={seeding}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60">
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              تحميل التمارين الافتراضية
            </button>
          ) : (
            <button onClick={() => handleSeed(true)} disabled={seeding}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60">
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة مجدداً
            </button>
          )}
        </div>
      </div>

      {seedMsg && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-xl px-4 py-3 text-sm font-medium">
          {seedMsg}
        </div>
      )}

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryStats.map(({ key, label, count, color, icon: Icon }) => (
          <button key={key}
            onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
            className={`bg-white rounded-2xl p-4 border text-right transition-all hover:shadow-sm ${
              filterCategory === key ? 'border-brand-400 ring-2 ring-brand-200' : 'border-gray-100'
            }`}>
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-gray-900 ltr-num">{count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <button onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterCategory === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          الكل ({exercises.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
          <button key={key} onClick={() => setFilterCategory(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterCategory === key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <div className="text-5xl mb-3">🏃</div>
          <p className="text-gray-400 font-bold text-lg">لا توجد تمارين بعد</p>
          <p className="text-gray-300 text-sm mt-2 mb-6">اضغط "تحميل التمارين الافتراضية" لإضافة المكتبة الكاملة</p>
          <button onClick={() => handleSeed(false)} disabled={seeding}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60">
            {seeding ? 'جارٍ التحميل...' : '🚀 تحميل 25+ تمرين علمي'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => {
            const cat = CATEGORY_CONFIG[ex.category]
            const diff = DIFFICULTY_CONFIG[ex.difficulty]
            const CatIcon = cat?.icon ?? Dumbbell
            return (
              <button key={ex.id} onClick={() => setSelectedEx(ex)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-right hover:shadow-md hover:border-brand-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cat?.color ?? 'bg-gray-100 text-gray-500'}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff?.color ?? 'bg-gray-100 text-gray-500'}`}>
                    {diff?.label}
                  </span>
                </div>
                <h3 className="font-black text-gray-900 text-sm mb-1 group-hover:text-brand-700 transition-colors">
                  {ex.titleAr}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{ex.descriptionAr}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ex.durationMinutes} دقيقة</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{ex.points} نقطة</span>
                  <span className="flex items-center gap-1">
                    {ex.ageGroups?.map(a => <span key={a} className="bg-gray-100 px-1 rounded">{a}</span>)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedEx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEx(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-black text-xl text-gray-900">{selectedEx.titleAr}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{selectedEx.title}</p>
              </div>
              <button onClick={() => setSelectedEx(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${CATEGORY_CONFIG[selectedEx.category]?.color}`}>
                الفئة: {CATEGORY_CONFIG[selectedEx.category]?.label}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-1">الوصف</p>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedEx.descriptionAr}</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-4">
                <p className="text-xs font-bold text-brand-700 mb-1">الهدف النفسي العلمي</p>
                <p className="text-brand-800 text-sm">{selectedEx.psychologyObjectiveAr}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-lg font-black text-gray-900 ltr-num">{selectedEx.durationMinutes}</div>
                  <div className="text-xs text-gray-500">دقيقة</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <div className="text-lg font-black text-yellow-600 ltr-num">{selectedEx.points}</div>
                  <div className="text-xs text-gray-500">نقطة</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="text-sm font-black text-purple-600">{DIFFICULTY_CONFIG[selectedEx.difficulty]?.label}</div>
                  <div className="text-xs text-gray-500">المستوى</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">الفئات العمرية</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedEx.ageGroups?.map(a => (
                    <span key={a} className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold">{a} سنة</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">مناسب لـ</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedEx.diagnoses?.map(d => (
                    <span key={d} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
