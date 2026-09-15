'use client'
// Creates a portal account for a child the specialist already treats in person.
//
// The public /register flow asks for a password, a plan and a payment method —
// none of which apply here. This asks only for what the specialist actually
// knows from the clinic, and the account is created without a plan or expiry.
//
// The email is typed twice on purpose: it is the address that will open a
// child's clinical file, and a single mistyped character would hand that file
// to a stranger.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, X, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'
import { ageYearsFromBirthDate } from '@/lib/age'
import type { Diagnosis } from '@/lib/types'

// 'OTHER' leads deliberately: this is filled in before any scale has been run,
// so "not determined yet" must be the path of least resistance, not a diagnosis.
const DIAGNOSES: Diagnosis[] = ['OTHER', 'ADHD', 'AUTISM', 'ADHD+AUTISM']

interface Created { parentId: string; childName: string }

/** What the caller already knows about the child, so it is not typed twice. */
export interface InPersonPrefill {
  childFirstName?: string
  parentLastName?: string
  /** Age in years as already entered elsewhere — cross-checked against the birth date. */
  childAgeYears?: number
  /** Already entered during the assessment — carried over so it is typed once. */
  childBirthDate?: string
  diagnosis?: Diagnosis
}

export default function AddInPersonClientForm({ onClose, onCreated, prefill, onLinked }: {
  onClose: () => void
  /** Lets the clients page refresh its list without a full reload. */
  onCreated?: () => void
  prefill?: InPersonPrefill
  /**
   * When present the form is being used to attach a child to work already in
   * progress (an assessment), so it hands the new records back and closes
   * instead of offering to navigate away from that work.
   */
  onLinked?: (
    parent: { id: string; firstName: string; lastName: string },
    student: { id: string; firstName: string; lastName: string; birthDate: string },
  ) => void
}) {
  const router = useRouter()
  const { lang } = useLang()
  const t = tr[lang].adminClients.inPerson

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState(prefill?.parentLastName ?? '')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [childFirstName, setChildFirstName] = useState(prefill?.childFirstName ?? '')
  const [childLastName, setChildLastName] = useState('')
  const [birthDate, setBirthDate] = useState(prefill?.childBirthDate ?? '')
  // Defaults to OTHER — "not determined yet". Anything else would be a claim the
  // specialist has not made, recorded before a single scale has been run.
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(prefill?.diagnosis ?? 'OTHER')
  const [severity, setSeverity] = useState<1 | 2 | 3>(1)
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Created | null>(null)

  const emailsMatch = email.trim().toLowerCase() === emailConfirm.trim().toLowerCase()

  // The birth date is deliberately not prefilled from the age entered during the
  // assessment — a guessed 1 January would silently put the child in the wrong
  // age band later. Instead the two are cross-checked and a mismatch is flagged.
  const ageFromBirth = ageYearsFromBirthDate(birthDate)
  const ageMismatch =
    prefill?.childAgeYears != null && ageFromBirth != null &&
    Math.abs(ageFromBirth - prefill.childAgeYears) > 1
  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && emailsMatch &&
    childFirstName.trim() && birthDate && !saving

  function reset() {
    setFirstName(''); setLastName(''); setEmail(''); setEmailConfirm(''); setPhone('')
    setChildFirstName(''); setChildLastName(''); setBirthDate('')
    setDiagnosis('OTHER'); setSeverity(1); setNotes('')
    setError(''); setCreated(null)
  }

  async function submit() {
    if (!canSubmit) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: { firstName, lastName, email, phone },
          child: { firstName: childFirstName, lastName: childLastName, birthDate, diagnosis, severityLevel: severity },
          notes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'تعذّر إنشاء الحساب')
        return
      }
      onCreated?.()
      if (onLinked) {
        // Attaching to work already open — hand the records back and get out of
        // the way rather than inviting the specialist to navigate elsewhere.
        onLinked(data.parent, data.student)
        onClose()
        return
      }
      setCreated({ parentId: data.parent.id, childName: data.student.firstName })
      router.refresh()
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent'
  const label = 'block text-xs font-bold text-gray-500 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">

        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-500" />
              {t.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">{t.subtitle}</p>
          </div>
          <button onClick={onClose} aria-label={t.cancel}
            className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {created ? (
          <div className="p-6">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-emerald-900 text-sm">{t.successTitle} — {created.childName}</p>
                <p className="text-emerald-800 text-sm mt-1 leading-relaxed">{t.successBody}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">{t.noPaymentNote}</p>
            <div className="flex gap-2 flex-wrap">
              <a href={`/dashboard/clients/${created.parentId}`}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                {t.openClient}
              </a>
              <button onClick={reset}
                className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                {t.addAnother}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">

            <section>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.parentSection}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className={label} htmlFor="ip-first">{t.firstName}</label>
                  <input id="ip-first" className={field} value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ip-last">{t.lastName}</label>
                  <input id="ip-last" className={field} value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ip-email">{t.email}</label>
                  <input id="ip-email" type="email" dir="ltr" className={field} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ip-email2">{t.emailConfirm}</label>
                  <input id="ip-email2" type="email" dir="ltr"
                    className={`${field} ${emailConfirm && !emailsMatch ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                    value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)} />
                  {emailConfirm && !emailsMatch && (
                    <p className="text-[11px] text-red-600 font-bold mt-1">{t.emailMismatch}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={label} htmlFor="ip-phone">{t.phone}</label>
                  <input id="ip-phone" dir="ltr" className={field} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed">{t.emailHint}</p>
              </div>
            </section>

            <section>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.childSection}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className={label} htmlFor="ip-cfirst">{t.childFirstName}</label>
                  <input id="ip-cfirst" className={field} value={childFirstName} onChange={e => setChildFirstName(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ip-clast">{t.childLastName}</label>
                  <input id="ip-clast" className={field} value={childLastName} onChange={e => setChildLastName(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ip-birth">{t.birthDate}</label>
                  <input id="ip-birth" type="date"
                    className={`${field} ${ageMismatch ? 'border-amber-300 ring-1 ring-amber-200' : ''}`}
                    value={birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => setBirthDate(e.target.value)} />
                  {prefill?.childAgeYears != null && (
                    <p className={`text-[11px] mt-1 ${ageMismatch ? 'text-amber-700 font-bold' : 'text-gray-400'}`}>
                      {ageMismatch
                        ? t.ageMismatch(prefill.childAgeYears, ageFromBirth ?? 0)
                        : t.ageFromAssessment(prefill.childAgeYears)}
                    </p>
                  )}
                </div>
                <div>
                  <label className={label} htmlFor="ip-diag">{t.diagnosis}</label>
                  <select id="ip-diag" className={field} value={diagnosis} onChange={e => setDiagnosis(e.target.value as Diagnosis)}>
                    {DIAGNOSES.map(d => (
                      <option key={d} value={d}>{t.diagnosisOptions[d as keyof typeof t.diagnosisOptions] ?? d}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{t.diagnosisHint}</p>
                </div>
                <div className="md:col-span-2">
                  <label className={label}>{t.severity}</label>
                  <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{t.severityHint}</p>
                  <div className="flex gap-2">
                    {([1, 2, 3] as const).map(n => (
                      <button key={n} type="button" onClick={() => setSeverity(n)}
                        aria-pressed={severity === n}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                          severity === n
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}>
                        {t.severityLabels[n]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div>
              <label className={label} htmlFor="ip-notes">{t.notes}</label>
              <textarea id="ip-notes" rows={2} className={field} value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 2000))} />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">{t.noPaymentNote}</p>

            {error && (
              <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} type="button"
                className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                {t.cancel}
              </button>
              <button onClick={submit} type="button" disabled={!canSubmit}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {saving ? t.creating : t.submit}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
