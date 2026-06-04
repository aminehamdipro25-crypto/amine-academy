'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Minus, Save } from 'lucide-react'
import type { Parent, Student } from '@/lib/types'

const METRICS = [
  { key: 'attention',           label: 'الانتباه والتركيز' },
  { key: 'impulse_control',     label: 'كبح الاندفاعية' },
  { key: 'social_interaction',  label: 'التفاعل الاجتماعي' },
  { key: 'motor_coordination',  label: 'التنسيق الحركي' },
  { key: 'emotional_regulation',label: 'تنظيم المشاعر' },
]

interface ParentWithStudents extends Parent { students: Student[] }

export default function NewReportPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [type, setType] = useState<'session' | 'weekly' | 'monthly'>('session')
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(5)
  const [points, setPoints] = useState(0)
  const [professorNotes, setProfessorNotes] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(METRICS.map(m => [m.key, 3]))
  )

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(d => {
        setClients(d.clients || [])
        if (d.clients?.length > 0) {
          setSelectedParentId(d.clients[0].id)
          if (d.clients[0].students?.length > 0) {
            setSelectedStudentId(d.clients[0].students[0].id)
          }
        }
      })
      .catch(() => setError('تعذر تحميل قائمة المشتركين'))
      .finally(() => setLoading(false))
  }, [])

  const selectedParent = clients.find(c => c.id === selectedParentId)

  function handleParentChange(pid: string) {
    setSelectedParentId(pid)
    const p = clients.find(c => c.id === pid)
    if (p?.students?.length) setSelectedStudentId(p.students[0].id)
    else setSelectedStudentId('')
  }

  async function submit() {
    if (!selectedStudentId || !selectedParentId) {
      setError('يرجى اختيار المشترك والطفل')
      return
    }
    setSaving(true)
    setError('')
    try {
      const behaviorRatings = METRICS.map(m => ({
        metric: m.key,
        score: ratings[m.key] || 3,
        ratedBy: 'professor',
        date: new Date().toISOString(),
      }))

      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          parentId: selectedParentId,
          type,
          periodStart,
          periodEnd,
          completedExercises: completed,
          totalExercises: total,
          pointsEarned: points,
          behaviorRatings,
          professorNotes,
        }),
      })
      if (res.ok) {
        router.push('/dashboard/reports')
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
    <div className="max-w-2xl space-y-6">
      <button onClick={() => router.push('/dashboard/reports')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
        <ArrowRight className="w-4 h-4" />
        العودة للتقارير
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">تقرير تقدم جديد</h1>
        <p className="text-gray-500 text-sm mt-1">أدخل بيانات الجلسة والتقييم السلوكي</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Parent & student selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">ولي الأمر</label>
            <select value={selectedParentId} onChange={e => handleParentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {clients.length === 0 && <option value="">لا يوجد مشتركون</option>}
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">الطفل</label>
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {!selectedParent?.students?.length && <option value="">لا يوجد أطفال</option>}
              {selectedParent?.students?.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Report type & period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">نوع التقرير</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              <option value="session">جلسة</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">من تاريخ</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">إلى تاريخ</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
          </div>
        </div>

        {/* Exercises & points */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'تمارين مكتملة', val: completed, set: setCompleted },
            { label: 'إجمالي التمارين', val: total, set: setTotal },
            { label: 'نقاط مكتسبة', val: points, set: setPoints },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => set(Math.max(0, val - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center font-black text-gray-900 ltr-num">{val}</span>
                <button type="button" onClick={() => set(val + 1)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Behavior ratings */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-3">التقييم السلوكي (1 = ضعيف، 5 = ممتاز)</label>
          <div className="space-y-3">
            {METRICS.map(m => (
              <div key={m.key} className="flex items-center gap-4">
                <span className="text-sm text-gray-700 flex-1">{m.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRatings(r => ({ ...r, [m.key]: v }))}
                      className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${
                        ratings[m.key] === v
                          ? 'bg-brand-600 text-white scale-110'
                          : 'bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Professor notes */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">ملاحظات الأستاذ</label>
          <textarea
            value={professorNotes}
            onChange={e => setProfessorNotes(e.target.value)}
            rows={5}
            placeholder="اكتب ملاحظاتك حول الجلسة، ملاحظات التحسن، توصيات للأسرة..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-left ltr-num">{professorNotes.length}/3000</p>
        </div>
      </div>

      <button onClick={submit} disabled={saving || !selectedStudentId}
        className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors text-lg">
        {saving
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Save className="w-5 h-5" />
        }
        حفظ التقرير
      </button>
    </div>
  )
}
