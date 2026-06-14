'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dumbbell, RefreshCw, Plus, Clock, Star, Target, Brain, Zap, Users, Eye, Activity, Edit2, X, Save, ChevronDown, Search } from 'lucide-react'

interface Exercise {
  id: string
  titleAr: string
  title: string
  descriptionAr: string
  description: string
  category: string
  ageGroups: string[]
  diagnoses: string[]
  difficulty: string
  durationMinutes: number
  points: number
  psychologyObjectiveAr: string
}

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; glow: string; icon: React.ComponentType<{className?: string}> }> = {
  motor:   { label: 'حركي',          bg: 'bg-blue-600',   text: 'text-blue-700',   glow: 'shadow-blue-500/20',   icon: Activity },
  focus:   { label: 'تركيز وانتباه', bg: 'bg-violet-600', text: 'text-violet-700', glow: 'shadow-violet-500/20', icon: Brain },
  balance: { label: 'توازن',         bg: 'bg-emerald-600',text: 'text-emerald-700',glow: 'shadow-emerald-500/20',icon: Target },
  energy:  { label: 'طاقة',          bg: 'bg-orange-500', text: 'text-orange-700', glow: 'shadow-orange-500/20', icon: Zap },
  sensory: { label: 'حسي',           bg: 'bg-pink-600',   text: 'text-pink-700',   glow: 'shadow-pink-500/20',   icon: Eye },
  social:  { label: 'اجتماعي',       bg: 'bg-teal-600',   text: 'text-teal-700',   glow: 'shadow-teal-500/20',   icon: Users },
}

const CARD_GRADIENTS: Record<string, string> = {
  motor:   'from-blue-50 to-cyan-50 border-blue-100',
  focus:   'from-violet-50 to-purple-50 border-violet-100',
  balance: 'from-emerald-50 to-teal-50 border-emerald-100',
  energy:  'from-orange-50 to-amber-50 border-orange-100',
  sensory: 'from-pink-50 to-rose-50 border-pink-100',
  social:  'from-teal-50 to-cyan-50 border-teal-100',
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'مبتدئ',   color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  intermediate: { label: 'متوسط',   color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  advanced:     { label: 'متقدم',   color: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
}

const AGE_OPTIONS  = ['5-11', '12-17', '18-22']
const DIAG_OPTIONS = ['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER']

type EditForm = Partial<Exercise>

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [seedMsg, setSeedMsg] = useState('')
  const [editEx, setEditEx] = useState<Exercise | null>(null)
  const [form, setForm] = useState<EditForm>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [search, setSearch] = useState('')

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
    setSeeding(true); setSeedMsg('')
    try {
      const res = await fetch('/api/admin/seed-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      setSeedMsg(data.message || (data.ok ? 'تم التحميل' : 'خطأ'))
      if (data.ok) load()
    } catch { setSeedMsg('حدث خطأ في الاتصال') }
    finally { setSeeding(false) }
  }

  function openEdit(ex: Exercise) {
    setEditEx(ex)
    setForm({ ...ex })
    setSaveMsg('')
  }

  async function saveEdit() {
    if (!editEx) return
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch(`/api/exercises/${editEx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setExercises(prev => prev.map(e => e.id === editEx.id ? data.exercise : e))
        setSaveMsg('✓ تم الحفظ')
        setTimeout(() => { setEditEx(null); setSaveMsg('') }, 900)
      } else {
        setSaveMsg('حدث خطأ')
      }
    } catch { setSaveMsg('حدث خطأ في الاتصال') }
    finally { setSaving(false) }
  }

  function toggleAgeGroup(g: string) {
    const current = form.ageGroups ?? []
    setForm(f => ({ ...f, ageGroups: current.includes(g) ? current.filter(x => x !== g) : [...current, g] }))
  }

  function toggleDiagnosis(d: string) {
    const current = form.diagnoses ?? []
    setForm(f => ({ ...f, diagnoses: current.includes(d) ? current.filter(x => x !== d) : [...current, d] }))
  }

  const filtered = exercises.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (search && !e.titleAr.includes(search) && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categoryStats = Object.keys(CATEGORY_CONFIG).map(k => ({
    key: k, count: exercises.filter(e => e.category === k).length, ...CATEGORY_CONFIG[k],
  }))

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-brand-500" />
            التمارين
          </h1>
          <p className="text-gray-400 text-sm mt-1">مكتبة التمارين العلمية — {exercises.length} تمرين</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          {exercises.length === 0 ? (
            <button onClick={() => handleSeed(false)} disabled={seeding}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 disabled:opacity-60">
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              تحميل التمارين
            </button>
          ) : (
            <button onClick={() => handleSeed(true)} disabled={seeding}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-60">
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              إعادة التحميل
            </button>
          )}
        </div>
      </div>

      {seedMsg && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-2xl px-5 py-3 text-sm font-bold">{seedMsg}</div>
      )}

      {/* ── Category stats ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categoryStats.map(({ key, label, count, bg, glow, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
            className={`bg-white rounded-2xl p-4 border text-right transition-all hover:shadow-md ${
              filterCategory === key ? 'border-brand-300 ring-2 ring-brand-200 shadow-md' : 'border-gray-100 shadow-sm'
            }`}
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-2 mx-auto`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-xl font-black text-gray-900 text-center ltr-num">{count}</div>
            <div className="text-[10px] text-gray-400 text-center mt-0.5 font-medium">{label}</div>
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث عن تمرين..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCategory === 'all' ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}
          >
            الكل ({exercises.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
            <button key={key}
              onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCategory === key ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-full" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded w-full mb-2" />
              <div className="h-2 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
          <div className="text-6xl mb-4">🏃</div>
          <p className="text-gray-900 font-black text-lg">لا توجد تمارين</p>
          {exercises.length === 0 ? (
            <>
              <p className="text-gray-400 text-sm mt-1 mb-6">اضغط لتحميل مكتبة التمارين العلمية</p>
              <button onClick={() => handleSeed(false)} disabled={seeding}
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60">
                {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                تحميل 35 تمرين علمي
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm mt-1">جرّب تغيير الفلتر أو البحث</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => {
            const cat = CATEGORY_CONFIG[ex.category]
            const diff = DIFFICULTY_CONFIG[ex.difficulty]
            const cardGrad = CARD_GRADIENTS[ex.category] ?? 'from-gray-50 to-gray-50 border-gray-100'
            const CatIcon = cat?.icon ?? Dumbbell
            return (
              <div
                key={ex.id}
                className={`group relative bg-gradient-to-br ${cardGrad} rounded-3xl border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
              >
                {/* Edit button */}
                <button
                  onClick={() => openEdit(ex)}
                  className="absolute top-4 left-4 p-2 rounded-xl bg-white/80 hover:bg-white text-gray-400 hover:text-brand-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                  title="تعديل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Category icon + difficulty */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 ${cat?.bg ?? 'bg-gray-500'} rounded-2xl flex items-center justify-center shadow-lg ${cat?.glow ?? ''} flex-shrink-0`}>
                    <CatIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${diff?.color ?? 'bg-gray-100 text-gray-500'}`}>
                    {diff?.label}
                  </span>
                </div>

                {/* Title + desc */}
                <h3 className="font-black text-gray-900 text-sm mb-1.5">{ex.titleAr}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">{ex.descriptionAr}</p>

                {/* Stats */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 bg-white/70 rounded-xl px-2.5 py-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-black text-gray-700 ltr-num">{ex.durationMinutes}</span>
                    <span className="text-[10px] text-gray-400">د</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/70 rounded-xl px-2.5 py-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-black text-gray-700 ltr-num">{ex.points}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {ex.ageGroups?.map(a => (
                    <span key={a} className="bg-white/80 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white">
                      {a}س
                    </span>
                  ))}
                  {ex.diagnoses?.map(d => (
                    <span key={d} className="bg-gray-800/10 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editEx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditEx(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-xl my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-black text-lg text-gray-900">تعديل التمرين</h2>
                <p className="text-gray-400 text-xs mt-0.5">{editEx.title}</p>
              </div>
              <button onClick={() => setEditEx(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم بالعربية</label>
                <input
                  value={form.titleAr ?? ''}
                  onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
                <textarea
                  value={form.descriptionAr ?? ''}
                  onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline ml-1 text-brand-500" />
                    المدة (دقيقة)
                  </label>
                  <input
                    type="number" min={1} max={60}
                    value={form.durationMinutes ?? 10}
                    onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    <Star className="w-3.5 h-3.5 inline ml-1 text-yellow-500" />
                    النقاط
                  </label>
                  <input
                    type="number" min={5} max={500} step={5}
                    value={form.points ?? 30}
                    onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">الفئة</label>
                  <div className="relative">
                    <select
                      value={form.category ?? 'focus'}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 appearance-none bg-white"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([k, { label }]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">مستوى الصعوبة</label>
                  <div className="relative">
                    <select
                      value={form.difficulty ?? 'beginner'}
                      onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 appearance-none bg-white"
                    >
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفئات العمرية</label>
                <div className="flex gap-2">
                  {AGE_OPTIONS.map(g => (
                    <button key={g} type="button" onClick={() => toggleAgeGroup(g)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        (form.ageGroups ?? []).includes(g)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      }`}>
                      {g} سنة
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">مناسب لـ</label>
                <div className="flex gap-2 flex-wrap">
                  {DIAG_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDiagnosis(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        (form.diagnoses ?? []).includes(d)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الهدف النفسي</label>
                <textarea
                  value={form.psychologyObjectiveAr ?? ''}
                  onChange={e => setForm(f => ({ ...f, psychologyObjectiveAr: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              {saveMsg ? (
                <span className={`text-sm font-bold ${saveMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</span>
              ) : <span />}
              <div className="flex gap-3">
                <button onClick={() => setEditEx(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
                  إلغاء
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
