'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Mail, Phone, MapPin, Calendar, CheckCircle, Clock, XCircle,
  AlertCircle, Video, User, Brain, Star, Edit2, Save, X, Key, Copy,
  PauseCircle, Trash2, LogIn, RotateCcw, ExternalLink, Eye, EyeOff, Lock,
  ChevronDown, ChevronUp, ClipboardList,
} from 'lucide-react'
import type { Parent, Student, Appointment, SessionLog, StudentAssessmentProfile, DifficultyLevel, Program, AssessmentResult } from '@/lib/types'
import { DIFFICULTY_LABELS_AR } from '@/lib/game-mapping'
import AIPatternAnalysis from '@/components/dashboard/AIPatternAnalysis'
import { useLang, tr, type Lang } from '@/lib/i18n'

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar'
}

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700 border-green-200',
  pending:   'bg-orange-100 text-orange-700 border-orange-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  expired:   'bg-yellow-100 text-yellow-700 border-yellow-200',
}

interface ClientData {
  parent: Parent
  students: Student[]
  appointments: Appointment[]
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLang()
  const t = tr[lang].adminClientDetail
  const tToolkit = tr[lang].adminSpecialistToolkit
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
  const [suspending, setSuspending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const [resetLinkState, setResetLinkState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [resetLinkData, setResetLinkData] = useState<{ url: string; whatsapp: string; phone: string } | null>(null)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [sessionLogs, setSessionLogs] = useState<Record<string, SessionLog>>({})
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Record<string, StudentAssessmentProfile>>({})
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<Partial<StudentAssessmentProfile['diagnosedDifficulties']>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [programs, setPrograms] = useState<Record<string, Program | null>>({})
  const [programsLoading, setProgramsLoading] = useState(false)
  const [walkInAssessments, setWalkInAssessments] = useState<Record<string, AssessmentResult[]>>({})
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.role === 'owner') setIsOwner(true) }).catch(() => {})
  }, [])

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

  useEffect(() => {
    if (!data || !id) return
    fetch(`/api/admin/clients/${id}/sessions`)
      .then(r => r.json())
      .then(d => setSessionLogs(d.sessions || {}))
      .catch(() => {})
  }, [data, id])

  useEffect(() => {
    if (!data) return
    const students = data.students || []
    Promise.all(
      students.map(s =>
        fetch(`/api/admin/assessment-profile/${s.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => d?.profile ? { id: s.id, profile: d.profile } : null)
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<string, StudentAssessmentProfile> = {}
      results.forEach(r => { if (r) map[r.id] = r.profile })
      setProfiles(map)
    })

    // Fetch current program for each student
    setProgramsLoading(true)
    Promise.all(
      students.map(s =>
        fetch(`/api/admin/students/${s.id}/program`)
          .then(r => r.ok ? r.json() : null)
          .then(d => ({ id: s.id, program: d?.program ?? null }))
          .catch(() => ({ id: s.id, program: null }))
      )
    ).then(results => {
      const map: Record<string, Program | null> = {}
      results.forEach(r => { map[r.id] = r.program })
      setPrograms(map)
    }).finally(() => setProgramsLoading(false))

    // Fetch specialist-toolkit quick assessments for each student
    Promise.all(
      students.map(s =>
        fetch(`/api/assessments?studentId=${encodeURIComponent(s.id)}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => ({ id: s.id, results: (d?.results ?? []) as AssessmentResult[] }))
          .catch(() => ({ id: s.id, results: [] as AssessmentResult[] }))
      )
    ).then(results => {
      const map: Record<string, AssessmentResult[]> = {}
      results.forEach(r => { map[r.id] = r.results })
      setWalkInAssessments(map)
    })
  }, [data])

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
        setMsg({ type: 'ok', text: t.messages.saveSuccess })
        setEditingNotes(false)
        await load()
      } else {
        const d = await res.json()
        setMsg({ type: 'err', text: d.error || t.messages.genericError })
      }
    } finally {
      setSaving(false)
    }
  }

  async function suspendAccount() {
    setSuspending(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: status === 'suspended' ? 'active' : 'suspended' }),
      })
      if (res.ok) {
        setMsg({ type: 'ok', text: status === 'suspended' ? t.messages.accountActivated : t.messages.accountSuspended })
        await load()
      } else {
        setMsg({ type: 'err', text: t.messages.statusChangeFailed })
      }
    } finally {
      setSuspending(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/clients')
      } else {
        setMsg({ type: 'err', text: t.messages.deleteFailed })
        setDeleting(false)
        setConfirmDelete(false)
      }
    } catch {
      setMsg({ type: 'err', text: t.messages.genericError })
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function saveNewPassword() {
    if (newPwd.length < 8) {
      setMsg({ type: 'err', text: t.messages.pwdTooShort })
      return
    }
    setPwdSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPwd }),
      })
      if (res.ok) {
        setMsg({ type: 'ok', text: t.messages.pwdChangeSuccess })
        setNewPwd('')
        setShowPwdForm(false)
      } else {
        const d = await res.json()
        setMsg({ type: 'err', text: d.error || t.messages.pwdChangeFailed })
      }
    } catch {
      setMsg({ type: 'err', text: t.messages.connectionError })
    } finally {
      setPwdSaving(false)
    }
  }

  async function enterAsParent() {
    setImpersonating(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/impersonate/${id}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        window.open('/parent/dashboard', '_blank', 'noopener')
      } else {
        const d = await res.json()
        setMsg({ type: 'err', text: d.error || t.messages.enterFailed })
      }
    } catch {
      setMsg({ type: 'err', text: t.messages.connectionError })
    } finally {
      setImpersonating(false)
    }
  }

  async function generateResetLink() {
    setResetLinkState('loading')
    try {
      const res = await fetch(`/api/admin/reset-parent-link/${id}`, { method: 'POST' })
      const d = await res.json()
      if (res.ok && d.ok) {
        const waText = encodeURIComponent(t.resetLinkWaMessage(d.parentName, d.resetUrl))
        const phone = d.whatsappPhone || ''
        setResetLinkData({
          url: d.resetUrl,
          whatsapp: `https://wa.me/${phone}?text=${waText}`,
          phone,
        })
        setResetLinkState('done')
      } else {
        setMsg({ type: 'err', text: d.error || t.messages.resetLinkFailed })
        setResetLinkState('idle')
      }
    } catch {
      setMsg({ type: 'err', text: t.messages.connectionError })
      setResetLinkState('idle')
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

  async function saveProfile(studentId: string) {
    setProfileSaving(true)
    try {
      const res = await fetch(`/api/admin/assessment-profile/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosedDifficulties: profileDraft }),
      })
      if (res.ok) {
        const { profile } = await res.json()
        setProfiles(prev => ({ ...prev, [studentId]: profile }))
        setEditingProfile(null)
      }
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">{t.notFound}</p>
    </div>
  )

  const { parent, students, appointments } = data
  const statusColor = STATUS_COLORS[parent.subscriptionStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending
  const statusLabel = t.statusOptions[parent.subscriptionStatus as keyof typeof t.statusOptions] ?? t.statusOptions.pending
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
        {t.backButton}
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
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                {statusLabel}
              </span>
              <span className="text-xs bg-brand-50 text-brand-700 font-bold px-2.5 py-1 rounded-full">
                {t.planOptions[parent.subscriptionPlan as keyof typeof t.planOptions] || parent.subscriptionPlan}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{parent.email}</span>
              {parent.phone && <span className="flex items-center gap-1 ltr-num"><Phone className="w-3.5 h-3.5" />{parent.phone}</span>}
              {parent.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{parent.country}</span>}
              <span className="flex items-center gap-1 ltr-num"><Calendar className="w-3.5 h-3.5" />{new Date(parent.createdAt).toLocaleDateString(localeFor(lang))}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {parent.phone && (
              <a href={`https://wa.me/${parent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-50 text-green-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-green-100 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                {t.whatsappButton}
              </a>
            )}
            <a href={`mailto:${parent.email}`}
              className="flex items-center gap-1.5 bg-brand-50 text-brand-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {t.emailButton}
            </a>
            <button
              onClick={enterAsParent}
              disabled={impersonating}
              title={t.enterAsParentTitle}
              className="flex items-center gap-1.5 bg-purple-50 text-purple-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50">
              {impersonating
                ? <div className="w-3.5 h-3.5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                : <LogIn className="w-3.5 h-3.5" />}
              {t.enterAsParentButton}
            </button>
            <button
              onClick={generateResetLink}
              disabled={resetLinkState === 'loading'}
              title={t.resetLinkTitle}
              className="flex items-center gap-1.5 bg-orange-50 text-orange-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50">
              {resetLinkState === 'loading'
                ? <div className="w-3.5 h-3.5 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                : <RotateCcw className="w-3.5 h-3.5" />}
              {t.resetLinkButton}
            </button>
          </div>
        </div>
      </div>

      {/* Reset password link panel */}
      {resetLinkState === 'done' && resetLinkData && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-black text-orange-800 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              {t.resetLinkPanelTitle}
            </p>
            <button onClick={() => { setResetLinkState('idle'); setResetLinkData(null) }}
              className="text-orange-400 hover:text-orange-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-600 break-all flex-1 ltr-num select-all">{resetLinkData.url}</span>
            <button
              onClick={() => navigator.clipboard.writeText(resetLinkData.url)}
              className="text-orange-500 hover:text-orange-700 flex-shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {resetLinkData.phone && (
              <a
                href={resetLinkData.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                <Phone className="w-4 h-4" />
                {t.sendViaWhatsappButton}
              </a>
            )}
            <a
              href={resetLinkData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
              <ExternalLink className="w-4 h-4" />
              {t.openLinkButton}
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-500" />
            {t.subscriptionMgmtTitle}
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.statusLabel}</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              {Object.entries(t.statusOptions).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.planLabel}</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none">
              <option value="session">{t.planOptions.session}</option>
              <option value="weekly">{t.planOptions.weekly}</option>
              <option value="monthly">{t.planOptions.monthly}</option>
              <option value="basic">{t.planOptions.basic}</option>
              <option value="standard">{t.planOptions.standard}</option>
              <option value="premium">{t.planOptions.premium}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.expiryLabel}</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500">{t.notesLabel}</label>
              <button onClick={() => setEditingNotes(!editingNotes)} className="text-xs text-brand-600 font-bold flex items-center gap-1">
                {editingNotes ? <X className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                {editingNotes ? t.cancelButton : t.editButton}
              </button>
            </div>
            {editingNotes ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none"
                placeholder={t.notesPlaceholder} />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 min-h-[80px] whitespace-pre-wrap">
                {notes || <span className="text-gray-400 italic">{t.noNotesYet}</span>}
              </p>
            )}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full bg-brand-600 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {t.saveChangesButton}
          </button>

          {/* Direct password reset */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => { setShowPwdForm(p => !p); setNewPwd('') }}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t.changePwdDirectlyButton}</span>
              <span>{showPwdForm ? '▲' : '▼'}</span>
            </button>
            {showPwdForm && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder={t.newPwdPlaceholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm pr-3 pl-9 focus:ring-2 focus:ring-brand-300 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowNewPwd(p => !p)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={saveNewPassword}
                  disabled={pwdSaving || newPwd.length < 8}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {pwdSaving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Lock className="w-4 h-4" />}
                  {t.setPwdButton}
                </button>
              </div>
            )}
          </div>

          {/* Suspend / Delete */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <button onClick={suspendAccount} disabled={suspending}
              className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                parent.subscriptionStatus === 'suspended'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}>
              {suspending ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <PauseCircle className="w-4 h-4" />}
              {parent.subscriptionStatus === 'suspended' ? t.reactivateButton : t.suspendButton}
            </button>

            {isOwner && (!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full bg-red-50 text-red-700 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" />
                {t.deletePermanentlyButton}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-red-700 text-center">{t.confirmDeleteText}</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-2 rounded-lg text-xs">
                    {t.cancelButton}
                  </button>
                  <button onClick={deleteAccount} disabled={deleting}
                    className="flex-1 bg-red-600 text-white font-black py-2 rounded-lg text-xs flex items-center justify-center gap-1">
                    {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                    {t.confirmDeleteButton}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 ltr-num text-center">ID: {parent.id}</p>
        </div>

        {/* Children */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                {t.childrenTitle(students.length)}
              </h2>
            </div>
            {students.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">{t.noChildren}</div>
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
                            <span className="ltr-num">{s.ageGroup} {t.yearsUnit}</span>
                            <span>•</span>
                            <span>{t.diagnosisLabels[s.diagnosis as keyof typeof t.diagnosisLabels] || s.diagnosis}</span>
                            <span>•</span>
                            <span>{t.severityLabels[s.severityLevel as keyof typeof t.severityLabels] || s.severityLevel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left text-xs text-gray-400 ltr-num flex-shrink-0">
                        <div>🌟 {s.totalPoints} {t.pointsUnit}</div>
                        <div>🔥 {s.streak} {t.streakUnit}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {[
                        [t.sensoryLabels.visual, s.sensoryProfile.visualSensitivity],
                        [t.sensoryLabels.audio, s.sensoryProfile.audioSensitivity],
                        [t.sensoryLabels.touch, s.sensoryProfile.touchSensitivity],
                      ].map(([label, val]) => {
                        const color = val === 'high' ? 'bg-red-50 text-red-600' : val === 'low' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                        return (
                          <div key={label} className={`rounded-lg px-2 py-1 text-center font-medium ${color}`}>
                            {label}: {val === 'high' ? t.sensitivityHigh : val === 'low' ? t.sensitivityLow : t.sensitivityMedium}
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
                          {t.generateCodeButton}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Programs */}
          {(data.students || []).some(s => programs[s.id]) && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  {t.currentProgramTitle}
                </h2>
                <a
                  href="/dashboard/programs"
                  className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  {t.createEditProgramLink}
                </a>
              </div>
              <div className="divide-y divide-gray-50">
                {(data.students || []).map(s => {
                  const prog = programs[s.id]
                  if (!prog) return null
                  return (
                    <div key={s.id} className="px-6 py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-black text-gray-900 text-sm">{prog.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {s.firstName} {s.lastName} • {prog.startDate} → {prog.endDate}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          prog.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {prog.status === 'active' ? t.programActiveStatus : prog.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Object.entries(t.days).map(([key, label]) => {
                          const exercises = prog.weeklySchedule?.[key as keyof typeof prog.weeklySchedule] || []
                          const count = exercises.length
                          return (
                            <div key={key} className="text-center">
                              <div
                                className="rounded-lg py-1.5 text-xs font-black mb-1"
                                style={count > 0
                                  ? { background: '#F3EEFF', color: '#6B46F0' }
                                  : { background: '#F9FAFB', color: '#D1D5DB' }
                                }
                              >
                                {count > 0 ? count : '—'}
                              </div>
                              <div className="text-[9px] text-gray-400 leading-none">{label.slice(0, 4)}</div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {t.totalWeeklyExercisesPrefix} <strong className="text-gray-700">{Object.values(prog.weeklySchedule || {}).flat().length}</strong> {t.exerciseUnit}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No program banner */}
          {!programsLoading && (data.students || []).length > 0 && (data.students || []).every(s => !programs[s.id]) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-black text-amber-800 text-sm">{t.noProgramTitle}</p>
                <p className="text-xs text-amber-600 mt-0.5">{t.noProgramSubtitle}</p>
              </div>
              <a
                href="/dashboard/programs"
                className="flex-shrink-0 text-sm font-black bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
              >
                {t.createProgramButton}
              </a>
            </div>
          )}

          {/* Assessment Profiles */}
          {(data.students || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  {t.assessmentProfileTitle}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(data.students || []).map(student => {
                  const prof = profiles[student.id]
                  const isEditing = editingProfile === student.id
                  const difficulties = prof?.diagnosedDifficulties
                  const hasDifficulties = difficulties && Object.values(difficulties).some(v => v !== 'none')
                  return (
                    <div key={student.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-gray-800 text-sm">{student.firstName} {student.lastName}</span>
                        <button
                          onClick={() => {
                            if (isEditing) { setEditingProfile(null) }
                            else {
                              setEditingProfile(student.id)
                              setProfileDraft(difficulties ?? {})
                            }
                          }}
                          className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          {isEditing ? t.cancelButton : t.editButton}
                        </button>
                      </div>

                      {!isEditing && (
                        <div className="flex gap-1.5 flex-wrap">
                          {hasDifficulties
                            ? Object.entries(difficulties!).filter(([, v]) => v !== 'none').map(([k, v]) => (
                                <span key={k} className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                  v === 'severe'   ? 'bg-red-50 text-red-700 border-red-200' :
                                  v === 'moderate' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                     'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                  {DIFFICULTY_LABELS_AR[k as keyof typeof DIFFICULTY_LABELS_AR]}
                                  {' '}
                                  {t.severitySuffix[v as keyof typeof t.severitySuffix]}
                                </span>
                              ))
                            : <span className="text-gray-400 text-xs">{t.noProfileYet}</span>
                          }
                        </div>
                      )}

                      {isEditing && (
                        <div className="space-y-2">
                          {(Object.keys(DIFFICULTY_LABELS_AR) as (keyof typeof DIFFICULTY_LABELS_AR)[]).map(domain => (
                            <div key={domain} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 font-bold">{DIFFICULTY_LABELS_AR[domain]}</span>
                              <div className="flex gap-1">
                                {(['none', 'mild', 'moderate', 'severe'] as DifficultyLevel[]).map(level => (
                                  <button
                                    key={level}
                                    onClick={() => setProfileDraft(prev => ({ ...prev, [domain]: level }))}
                                    className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-colors ${
                                      (profileDraft[domain] ?? 'none') === level
                                        ? level === 'none'     ? 'bg-gray-600 text-white'
                                          : level === 'mild'   ? 'bg-yellow-500 text-white'
                                          : level === 'moderate' ? 'bg-orange-500 text-white'
                                          : 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {t.difficultyLevelOptions[level]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => saveProfile(student.id)}
                            disabled={profileSaving}
                            className="mt-2 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {profileSaving ? t.savingText : t.saveProfileButton}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Specialist toolkit quick assessments */}
          {(data.students || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-500" />
                  {t.walkInAssessmentsTitle}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(data.students || []).map(student => {
                  const studentResults = walkInAssessments[student.id] || []
                  return (
                    <div key={student.id} className="px-6 py-4">
                      <span className="font-black text-gray-800 text-sm">{student.firstName} {student.lastName}</span>
                      {studentResults.length === 0 ? (
                        <p className="text-gray-400 text-xs mt-1.5">{t.walkInAssessmentsEmpty}</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {studentResults.map(r => (
                            <li key={r.id} className="flex items-center justify-between gap-2 text-xs flex-wrap">
                              <span className="font-bold text-gray-700">{tToolkit.scaleNames[r.type as keyof typeof tToolkit.scaleNames] ?? r.type}</span>
                              <span className="text-gray-400 ltr-num">{new Date(r.completedAt).toLocaleDateString(localeFor(lang))}</span>
                              {r.assessedByName && <span className="text-gray-400">{t.assessedByLabel}: {r.assessedByName}</span>}
                              <span className={`px-2 py-0.5 rounded-full font-black ${
                                r.severity === 'severe'   ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                                r.severity === 'moderate' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                r.severity === 'mild'     ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                                             'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              }`}>
                                {tToolkit.severityLabels[r.severity]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Pattern Analysis */}
          {students.length > 0 && students.map(s => (
            <AIPatternAnalysis
              key={s.id}
              studentId={s.id}
              studentName={`${s.firstName} ${s.lastName}`}
              diagnosis={s.diagnosis}
            />
          ))}

          {/* Upcoming appointments */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {t.upcomingApptsTitle(upcoming.length)}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.map(a => (
                  <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800 ltr-num">
                        {new Date(a.date).toLocaleDateString(localeFor(lang), { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' '}{a.timeSlot}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.notes || '—'}</div>
                    </div>
                    {a.meetingUrl && (
                      <a href={a.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                        <Video className="w-3 h-3" />
                        {t.joinLabel}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past appointments / session logs */}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gray-500" />
                  {t.sessionLogTitle(past.length)}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {past.slice(0, 15).map(a => {
                  const log = sessionLogs[a.id]
                  const isCompleted = a.status === 'completed'
                  const isCancelled = a.status === 'cancelled' || a.status === 'no-show'
                  const isExpanded = expandedSession === a.id
                  const avgScore = log?.exercises?.length
                    ? Math.round(log.exercises.reduce((s, e) => s + e.score, 0) / log.exercises.length)
                    : null

                  return (
                    <div key={a.id}>
                      <button
                        onClick={() => log && setExpandedSession(isExpanded ? null : a.id)}
                        className={`w-full px-6 py-4 text-right transition-colors ${log ? 'hover:bg-gray-50' : 'cursor-default'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-800 ltr-num">
                                {new Date(a.date).toLocaleDateString(localeFor(lang), { weekday: 'short', day: 'numeric', month: 'short' })}
                                {' '}{a.timeSlot}
                              </span>
                              {log?.durationSeconds > 0 && (
                                <span className="text-xs text-gray-400 ltr-num">
                                  ⏱ {Math.round(log.durationSeconds / 60)} {t.durationMinutesSuffix}
                                </span>
                              )}
                            </div>

                            {log && (log.exercises?.length > 0 || log.therapistNotes) && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {log.exercises?.length > 0 && (
                                  <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full ltr-num">
                                    {log.exercises.length} {t.exerciseUnit}
                                  </span>
                                )}
                                {avgScore !== null && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ltr-num ${
                                    avgScore >= 80 ? 'bg-green-100 text-green-700' :
                                    avgScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {t.avgScorePrefix} {avgScore}٪
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  {(['attention', 'mood', 'energy'] as const).map(obs => (
                                    <div key={obs} className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                                          i <= log.observations[obs] ? 'bg-brand-500' : 'bg-gray-200'
                                        }`} />
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {log?.therapistNotes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{log.therapistNotes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isCompleted ? t.apptStatusCompleted : isCancelled ? (a.status === 'no-show' ? t.apptStatusNoShow : t.apptStatusCancelled) : a.status}
                            </span>
                            {log && (isExpanded
                              ? <ChevronUp className="w-4 h-4 text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && log && (
                        <div className="px-6 pb-5 space-y-3">
                          {/* Behavioral observations */}
                          <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-xs font-bold text-gray-500 mb-2">{t.behavioralObservationsTitle}</p>
                            <div className="grid grid-cols-5 gap-2">
                              {([
                                ['attention',   t.observationLabels.attention],
                                ['cooperation', t.observationLabels.cooperation],
                                ['energy',      t.observationLabels.energy],
                                ['mood',        t.observationLabels.mood],
                                ['anxiety',     t.observationLabels.anxiety],
                              ] as [keyof typeof log.observations, string][]).map(([key, label]) => (
                                <div key={key} className="text-center">
                                  <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                                  <div className="flex justify-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <div key={i} className={`w-2 h-2 rounded-full ${
                                        i <= log.observations[key] ? 'bg-brand-500' : 'bg-gray-200'
                                      }`} />
                                    ))}
                                  </div>
                                  <div className="text-xs font-bold text-gray-600 mt-1 ltr-num">{log.observations[key]}/5</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Exercise results */}
                          {log.exercises?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-500">{t.exerciseResultsTitle}</p>
                              {log.exercises.map((ex, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-gray-800">{ex.exerciseLabelAr}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full transition-all ${
                                            ex.score >= 80 ? 'bg-green-500' : ex.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                          }`}
                                          style={{ width: `${ex.score}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className={`text-sm font-black ltr-num ${
                                      ex.score >= 80 ? 'text-green-600' : ex.score >= 60 ? 'text-yellow-600' : 'text-red-500'
                                    }`}>{ex.score}٪</div>
                                    <div className="text-[10px] text-gray-400 ltr-num">{Math.round(ex.duration / 60)}{t.minuteAbbrev}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Therapist notes */}
                          {log.therapistNotes && (
                            <div className="bg-blue-50 rounded-xl px-4 py-3">
                              <p className="text-xs font-bold text-blue-600 mb-1">{t.notesLabel}</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.therapistNotes}</p>
                            </div>
                          )}

                          {/* Session highlights */}
                          {log.highlights?.length > 0 && (
                            <div className="bg-yellow-50 rounded-xl px-4 py-3">
                              <p className="text-xs font-bold text-yellow-700 mb-1.5">{t.highlightsTitle}</p>
                              <ul className="space-y-0.5">
                                {log.highlights.map((h, i) => (
                                  <li key={i} className="text-xs text-gray-700">• {h}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
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
