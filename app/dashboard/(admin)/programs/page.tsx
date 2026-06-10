'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Dumbbell, Save, ChevronDown, ChevronUp, Plus, X, Sparkles, Loader2 } from 'lucide-react'
import type { Parent, Student, Exercise } from '@/lib/types'

interface ParentWithStudents extends Parent { students: Student[] }

const DAYS_AR: Record<string, string> = {
  monday:    'الاثنين',
  tuesday:   'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday:  'الخميس',
  friday:    'الجمعة',
  saturday:  'السبت',
  sunday:    'الأحد',
}
const DAYS = Object.keys(DAYS_AR)

export default function ProgramsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ParentWithStudents[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [parentId, setParentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('برنامج التطوير الشهري')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
  const [schedule, setSchedule] = useState<Record<string, string[]>>(
    Object.fromEntries(DAYS.map(d => [d, []]))
  )
  const [expandedDay, setExpandedDay] = useState<string | null>('monday')
  const [filterCat, setFilterCat] = useState('all')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRationale, setAiRationale] = useState('')

  async function generateWithAI() {
    if (!studentId) { setError('اختر الطالب أولاً'); return }
    setAiLoading(true)
    setError('')
    setAiRationale('')
    try {
      const res = await fetch('/api/admin/ai-generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSchedule(data.schedule)
        setTitle(data.title)
        setAiRationale(data.rationale)
        setSuccess('✓ تم توليد البرنامج بالذكاء الاصطناعي — راجعه وعدّله ثم احفظه')
      } else {
        setError(data.error || 'فشل التوليد')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/clients-list').then(r => r.json()),
      fetch('/api/exercises').then(r => r.json()),
    ]).then(([cd, ed]) => {
      setClients(cd.clients || [])
      setExercises(ed.exercises || [])
      if (cd.clients?.length > 0) {
        setParentId(cd.clients[0].id)
        if (cd.clients[0].students?.length) setStudentId(cd.clients[0].students[0].id)
      }
    }).catch(() => setError('تعذر التحميل'))
    .finally(() => setLoading(false))
  }, [])

  const selectedParent = clients.find(c => c.id === parentId)
  const selectedStudent = selectedParent?.students?.find(s => s.id === studentId)

  function handleParentChange(pid: string) {
    setParentId(pid)
    const p = clients.find(c => c.id === pid)
    if (p?.students?.length) setStudentId(p.students[0].id)
    else setStudentId('')
  }

  function toggleExercise(day: string, exId: string) {
    setSchedule(prev => {
      const current = prev[day] || []
      const has = current.includes(exId)
      return { ...prev, [day]: has ? current.filter(id => id !== exId) : [...current, exId] }
    })
  }

  function clearDay(day: string) {
    setSchedule(prev => ({ ...prev, [day]: [] }))
  }

  const totalAssigned = Object.values(schedule).flat().length
  const filteredExercises = filterCat === 'all' ? exercises : exercises.filter(e => e.category === filterCat)
  const cats = ['all', ...Array.from(new Set(exercises.map(e => e.category)))]

  const CAT_LABELS: Record<string, string> = {
    motor: 'حركي', focus: 'تركيز', balance: 'توازن',
    energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
  }

  async function submit() {
    if (!studentId) { setError('اختر الطالب'); return }
    if (totalAssigned === 0) { setError('أضف تمريناً واحداً على الأقل'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, title, startDate, endDate, weeklySchedule: schedule }),
      })
      if (res.ok) {
        setSuccess('✅ تم إنشاء البرنامج بنجاح! يمكنك الآن رؤيته في صفحة المشترك.')
        const clientPage = selectedParent ? `/dashboard/clients/${selectedParent.id}` : '/dashboard/clients'
        setTimeout(() => router.push(clientPage), 2000)
      } else {
        const d = await res.json()
        setError(d.error || 'حدث خطأ')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">إنشاء برنامج أسبوعي</h1>
        <p className="text-gray-500 text-sm mt-1">خصص جدولاً أسبوعياً من التمارين لكل طفل</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-bold">{success}</div>}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-black text-gray-900">معلومات البرنامج</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">ولي الأمر</label>
            <select value={parentId} onChange={e => handleParentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">الطفل</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {selectedParent?.students?.map(s => <option key={s.id} value={s.id}>{s.firstName} — {s.diagnosis}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم البرنامج</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">من</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">إلى</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
            </div>
          </div>
        </div>

        {selectedStudent && (
          <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-700">
            <span className="font-bold">{selectedStudent.firstName}</span> — {selectedStudent.ageGroup} سنة • {selectedStudent.diagnosis} • المستوى {selectedStudent.severityLevel}
          </div>
        )}

        {/* AI Generator */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gray-700">توليد ذكي بالـ AI</p>
              <p className="text-xs text-gray-400 mt-0.5">يحلل Claude حالة الطفل ويختار التمارين المناسبة تلقائياً</p>
            </div>
            <button
              onClick={generateWithAI}
              disabled={!studentId || aiLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white font-black px-5 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-md whitespace-nowrap">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'جارٍ التوليد...' : 'توليد بالذكاء الاصطناعي'}
            </button>
          </div>
          {aiRationale && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-xs text-purple-800 font-medium">
              🧠 {aiRationale}
            </div>
          )}
        </div>
      </div>

      {/* Weekly schedule builder */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" />
            الجدول الأسبوعي
          </h2>
          <span className="text-xs text-gray-500 bg-brand-50 text-brand-600 font-bold px-2 py-1 rounded-full ltr-num">
            {totalAssigned} تمرين محدد
          </span>
        </div>

        {/* Exercise category filter */}
        <div className="px-6 py-3 border-b border-gray-50 flex gap-2 overflow-x-auto">
          {cats.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filterCat === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat === 'all' ? 'الكل' : CAT_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {DAYS.map(day => {
            const dayExs = schedule[day] || []
            const isExpanded = expandedDay === day
            return (
              <div key={day}>
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-sm">{DAYS_AR[day]}</span>
                    {dayExs.length > 0 && (
                      <span className="text-xs bg-brand-100 text-brand-700 font-black px-2 py-0.5 rounded-full ltr-num">
                        {dayExs.length} تمارين
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {dayExs.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); clearDay(day) }}
                        className="text-xs text-red-500 font-bold hover:underline">
                        مسح
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredExercises.map(ex => {
                        const isSelected = dayExs.includes(ex.id)
                        return (
                          <button
                            key={ex.id}
                            onClick={() => toggleExercise(day, ex.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${
                              isSelected ? 'border-brand-400 bg-brand-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-brand-600' : 'bg-gray-200'
                            }`}>
                              {isSelected
                                ? <X className="w-3 h-3 text-white" />
                                : <Plus className="w-3 h-3 text-gray-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{ex.titleAr || ex.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 ltr-num">{ex.durationMinutes}د</span>
                                <span className="text-[10px] text-amber-500">⭐ {ex.points}</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={submit} disabled={saving || !studentId}
        className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors text-lg">
        {saving
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Save className="w-5 h-5" />{' '}حفظ البرنامج</>
        }
      </button>
    </div>
  )
}
