'use client'
// Corrects a child's NAME, area of concern and severity after an assessment.
//
// The name was refused by the API on the principle that it is identity rather
// than a finding. In practice that made a typo permanent — and it is the name
// printed on the report handed to the family and shown at the child's school.
//
// Both are recorded when the child is first added — necessarily before any
// scale has been run, since the record is what the assessment is filed against.
// Without this the first, provisional answer was permanent, which is backwards
// for a platform whose whole position is that its scales screen rather than
// diagnose.
import { useState } from 'react'
import { Loader2, Check, Pencil } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'
import type { Diagnosis } from '@/lib/types'

const DIAGNOSES: Diagnosis[] = ['OTHER', 'ADHD', 'AUTISM', 'ADHD+AUTISM']

export default function StudentProfileEditor({
  studentId, diagnosis, severityLevel, firstName, lastName, onSaved,
}: {
  studentId: string
  diagnosis: Diagnosis
  severityLevel: 1 | 2 | 3
  firstName?: string
  lastName?: string
  onSaved?: (next: {
    diagnosis: Diagnosis; severityLevel: 1 | 2 | 3
    firstName?: string; lastName?: string
  }) => void
}) {
  const { lang } = useLang()
  const t = tr[lang].adminClients.inPerson

  const [open, setOpen] = useState(false)
  const [diag, setDiag] = useState<Diagnosis>(diagnosis)
  const [sev, setSev] = useState<1 | 2 | 3>(severityLevel)
  const [first, setFirst] = useState(firstName ?? '')
  const [last, setLast] = useState(lastName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const nameChanged = first.trim() !== (firstName ?? '').trim()
    || last.trim() !== (lastName ?? '').trim()
  const dirty = diag !== diagnosis || sev !== severityLevel || nameChanged

  async function save() {
    if (!dirty || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: diag,
          severityLevel: sev,
          // Only sent when actually edited, so an untouched field is never
          // rewritten — and the audit entry stays meaningful.
          ...(nameChanged ? { firstName: first.trim(), lastName: last.trim() } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || t.updateFailed); return }
      onSaved?.({
        diagnosis: diag,
        severityLevel: sev,
        ...(nameChanged ? { firstName: first.trim(), lastName: last.trim() } : {}),
      })
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
      setOpen(false)
    } catch {
      setError(t.updateFailed)
    } finally {
      setSaving(false)
    }
  }

  const sel = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white'

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors">
        {savedFlash ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
        {savedFlash ? t.updateSaved : t.updateAfterAssessment}
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">{t.updateAfterAssessmentHint}</p>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <label className="text-[11px] font-bold text-gray-500" htmlFor={`sp-first-${studentId}`}>{t.childFirstName}</label>
        <input id={`sp-first-${studentId}`} className={sel} value={first}
          onChange={e => setFirst(e.target.value)} />
        <label className="text-[11px] font-bold text-gray-500" htmlFor={`sp-last-${studentId}`}>{t.childLastName}</label>
        <input id={`sp-last-${studentId}`} className={sel} value={last}
          onChange={e => setLast(e.target.value)} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select className={sel} value={diag} onChange={e => setDiag(e.target.value as Diagnosis)}
          aria-label={t.diagnosis}>
          {DIAGNOSES.map(d => (
            <option key={d} value={d}>{t.diagnosisOptions[d as keyof typeof t.diagnosisOptions] ?? d}</option>
          ))}
        </select>
        <select className={sel} value={sev} onChange={e => setSev(Number(e.target.value) as 1 | 2 | 3)}
          aria-label={t.severity}>
          {([1, 2, 3] as const).map(n => <option key={n} value={n}>{t.severityLabels[n]}</option>)}
        </select>
        <button type="button" onClick={save} disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {t.updateSave}
        </button>
        <button type="button" onClick={() => {
          setDiag(diagnosis); setSev(severityLevel)
          setFirst(firstName ?? ''); setLast(lastName ?? '')
          setOpen(false); setError('')
        }}
          className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
          {t.cancel}
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-red-600 mt-2">{error}</p>}
    </div>
  )
}
