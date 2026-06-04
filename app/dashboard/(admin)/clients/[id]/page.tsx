'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Mail, Phone, MapPin, Calendar, CheckCircle, Clock, XCircle,
  AlertCircle, Video, User, Brain, Star, Edit2, Save, X, Key, Copy
} from 'lucide-react'
import type { Parent, Student, Appointment } from '@/lib/types'

const STATUS_CONFIG = {
  active:    { label: 'نشط',             color: 'bg-green-100 text-green-700 border-green-200' },
  pending:   { label: 'في الانتظار',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  suspended: { label: 'موقوف',           color: 'bg-red-100 text-red-700 border-red-200' },
  cancelled: { label: 'ملغى',            color: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired:   { label: 'منتهي الصلاحية',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

const PLAN_LABELS = { basic: 'أساسي', standard: 'قياسي', premium: 'مميز' }
const DIAG_LABELS: Record<string, string> = { ADHD: 'ADHD', AUTISM: 'توحد', 'ADHD+AUTISM': 'ADHD + توحد', OTHER: 'أخرى' }
const SEVERITY_LABELS = { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' }

interface ClientData {
  parent: Parent
  students: Student[]
  appointments: Appointment[]
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [expiry, setExpiry] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [studentCodes, setStudentCodes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}`)
      if (!res.ok) { router.push('/dashboard/clients'); return }
      const json = await res.json()
      setData(json)
      setNotes(json.parent.notes || '')
      setStatus(json.parent.subscriptionStatus)
      setPlan(json.parent.subscriptionPlan)
      setExpiry(json.parent.subscriptionExpiry?.slice(0, 10) || '')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionStatus: status,
          subscriptionPlan: plan,
          subscriptionExpiry: expiry || null,
          notes,
        }),
      })
      if (res.ok) {
        setMsg({ type: 'ok', text: 'تم الحفظ بنجاح ✓' })
        setEditingNotes(false)
        await load()
      } else {
        const d = await res.json()
        setMsg({ type: 'err', text: d.error || 'حدث خطأ' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function generateStudentCode(studentId: string) {
    try {
      const res = await fetch('/api/auth/student-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const d = await res.json()
      if (d.ok) {
        setStudentCodes(prev => ({ ...prev, [studentId]: d.code }))
      }
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">المشترك غير موجود</p>
    </div>
  )

  const { parent, students, appointments } = data
  const statusCfg = STATUS_CONFIG[parent.subscriptionStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const upcoming = appointments.filter(a => a.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const past = appointments.filter(a => a.status !== 'scheduled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/clients')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
        <ArrowRight className="w-4 h-4" />
        العودة للمشتركين
      </button>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border ${
          msg.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-700 font-black text-2xl flex-shrink-0">
            {parent.firstName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="font-black text-xl text-gray-900">{parent.firstName} {parent.lastName}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs bg-brand-50 text-brand-700 font-bold px-2.5 py-1 rounded-full">
                {PLAN_LABELS[parent.subscriptionPlan as keyof typeof PLAN_LABELS] || parent.subscriptionPlan}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{parent.email}</span>
              {parent.phone && <span className="flex items-center gap-1 ltr-num"><Phone className="w-3.5 h-3.5" />{parent.phone}</span>}
              {parent.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{parent.country}</span>}
              <span className="flex items-center gap-1 ltr-num"><Calendar className="w-3.5 h-3.5" />{new Date(parent.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {parent.phone && (
              <a href={`https://wa.me/${parent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-50 text-green-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-green-100 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                واتساب
              </a>
            )}
            <a href={`mailto:${parent.email}`}
              className="flex items-center gap-1.5 bg-brand-50 text-brand-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              بريد
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-500" />
            إدارة الاشتراك
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">الحالة</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">الباقة</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              <option value="basic">أساسي</option>
              <option value="standard">قياسي</option>
              <option value="premium">مميز</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">تاريخ انتهاء الاشتراك</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500">ملاحظات الأستاذ</label>
              <button onClick={() => setEditingNotes(!editingNotes)} className="text-xs text-brand-600 font-bold flex items-center gap-1">
                {editingNotes ? <X className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                {editingNotes ? 'إلغاء' : 'تعديل'}
              </button>
            </div>
            {editingNotes ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none"
                placeholder="أدخل ملاحظاتك هنا..." />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 min-h-[80px] whitespace-pre-wrap">
                {notes || <span className="text-gray-400 italic">لا توجد ملاحظات بعد</span>}
              </p>
            )}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full bg-brand-600 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </button>

          <p className="text-xs text-gray-400 ltr-num text-center">ID: {parent.id}</p>
        </div>

        {/* Children */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                الأطفال ({students.length})
              </h2>
            </div>
            {students.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">لا يوجد أطفال مسجلون</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map(s => (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 font-black text-sm flex-shrink-0">
                          {s.firstName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{s.firstName} {s.lastName}</div>
                          <div className="text-gray-500 text-xs mt-0.5 flex flex-wrap gap-2">
                            <span className="ltr-num">{s.ageGroup} سنة</span>
                            <span>•</span>
                            <span>{DIAG_LABELS[s.diagnosis] || s.diagnosis}</span>
                            <span>•</span>
                            <span>{SEVERITY_LABELS[s.severityLevel] || s.severityLevel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left text-xs text-gray-400 ltr-num flex-shrink-0">
                        <div>🌟 {s.totalPoints} نقطة</div>
                        <div>🔥 {s.streak} يوم</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {[
                        ['بصري', s.sensoryProfile.visualSensitivity],
                        ['سمعي', s.sensoryProfile.audioSensitivity],
                        ['لمسي', s.sensoryProfile.touchSensitivity],
                      ].map(([label, val]) => {
                        const color = val === 'high' ? 'bg-red-50 text-red-600' : val === 'low' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                        return (
                          <div key={label} className={`rounded-lg px-2 py-1 text-center font-medium ${color}`}>
                            {label}: {val === 'high' ? 'عالي' : val === 'low' ? 'منخفض' : 'متوسط'}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {studentCodes[s.id] ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex-1">
                          <Key className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span className="font-black text-green-700 tracking-widest ltr-num text-sm">{studentCodes[s.id]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(studentCodes[s.id])}
                            className="ml-auto text-green-500 hover:text-green-700">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateStudentCode(s.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors">
                          <Key className="w-3.5 h-3.5" />
                          إنشاء رمز دخول
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  المواعيد القادمة ({upcoming.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.map(a => (
                  <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800 ltr-num">
                        {new Date(a.date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' '}{a.timeSlot}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.notes || '—'}</div>
                    </div>
                    {a.meetingUrl && (
                      <a href={a.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                        <Video className="w-3 h-3" />
                        انضمام
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past appointments */}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gray-500" />
                  سجل الجلسات ({past.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {past.slice(0, 10).map(a => {
                  const isCompleted = a.status === 'completed'
                  const isCancelled = a.status === 'cancelled' || a.status === 'no-show'
                  return (
                    <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="text-sm text-gray-700 ltr-num">
                        {new Date(a.date).toLocaleDateString('ar-SA')} {a.timeSlot}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isCompleted ? 'bg-green-100 text-green-700' :
                        isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />مكتمل</span> :
                         isCancelled ? <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />{a.status === 'no-show' ? 'لم يحضر' : 'ملغى'}</span> :
                         a.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
