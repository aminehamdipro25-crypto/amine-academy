'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Calendar, Video, Save } from 'lucide-react'
import type { Parent, Student } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

interface ParentWithStudents extends Parent { students: Student[] }

const TIME_SLOTS = [
  '08:00-08:45', '09:00-09:45', '10:00-10:45', '11:00-11:45',
  '12:00-12:45', '14:00-14:45', '15:00-15:45', '16:00-16:45',
  '17:00-17:45', '18:00-18:45', '19:00-19:45', '20:00-20:45',
]

export default function NewAppointmentPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = tr[lang].adminNewAppointment
  const apptT = tr[lang].adminAppointments
  const [clients, setClients] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [parentId, setParentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [timeSlot, setTimeSlot] = useState('10:00-10:45')
  const [type, setType] = useState<'assessment' | 'followup' | 'emergency'>('followup')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(d => {
        setClients(d.clients || [])
        if (d.clients?.length > 0) {
          setParentId(d.clients[0].id)
          if (d.clients[0].students?.length) setStudentId(d.clients[0].students[0].id)
        }
      })
      .catch(() => setError(t.loadClientsError))
      .finally(() => setLoading(false))
  }, [])

  const selectedParent = clients.find(c => c.id === parentId)

  function handleParentChange(pid: string) {
    setParentId(pid)
    const p = clients.find(c => c.id === pid)
    if (p?.students?.length) setStudentId(p.students[0].id)
    else setStudentId('')
  }

  async function submit() {
    if (!parentId || !studentId || !date || !timeSlot) {
      setError(t.requiredFieldsError)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, studentId, date, timeSlot, type, notes }),
      })
      if (res.ok) {
        const d = await res.json()
        setSuccess(t.successMessage(d.appointment?.meetingUrl))
        setTimeout(() => router.push('/dashboard/appointments'), 3000)
      } else {
        const d = await res.json()
        setError(d.error || t.genericError)
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
      <button onClick={() => router.push('/dashboard/appointments')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
        <ArrowRight className="w-4 h-4" />
        {t.backButton}
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.pageSubtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-bold">{success}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Parent & student */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.parentLabel}</label>
            <select value={parentId} onChange={e => handleParentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {clients.length === 0 && <option value="">{t.noClientsOption}</option>}
              {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.childLabel}</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {!selectedParent?.students?.length && <option value="">{t.noChildrenOption}</option>}
              {selectedParent?.students?.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">{t.sessionTypeLabel}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: 'followup',   label: apptT.type.followup,   color: 'border-brand-400 bg-brand-50 text-brand-700' },
              { val: 'assessment', label: apptT.type.assessment, color: 'border-purple-400 bg-purple-50 text-purple-700' },
              { val: 'emergency',  label: apptT.type.emergency,  color: 'border-red-400 bg-red-50 text-red-700' },
            ].map(({ val, label, color }) => (
              <button key={val} type="button"
                onClick={() => setType(val as typeof type)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  type === val ? color : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline ml-1" />
              {t.dateLabel}
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.timeLabel}</label>
            <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num">
              {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
        </div>

        {/* Jitsi info */}
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <Video className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-700">
            <span className="font-bold">{t.jitsiAutoTitle}</span> {t.jitsiAutoDesc}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.notesLabel}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder={t.notesPlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none" />
        </div>
      </div>

      <button onClick={submit} disabled={saving || !parentId || !studentId}
        className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors text-lg">
        {saving
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Save className="w-5 h-5" />}
        {t.scheduleButton}
      </button>
    </div>
  )
}
