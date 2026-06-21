'use client'
import { useState, useMemo, useEffect } from 'react'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { AssessmentResult } from '@/lib/types'
import {
  Stethoscope, ArrowRight, ArrowLeft, Printer, RotateCcw,
  CheckCircle2, Sparkles, ClipboardList, Save,
} from 'lucide-react'
import ADHDScale from '@/components/session/assessments/ADHDScale'
import AttentionDomainsScale from '@/components/session/assessments/AttentionDomainsScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'
import AutismScale from '@/components/session/assessments/AutismScale'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ConcernKey = 'autism' | 'adhd' | 'attention' | 'learning'
type ScaleKey = 'autism' | 'adhd' | 'attention-domains' | 'learning-difficulties'
type Step = 'info' | 'battery' | 'running' | 'report'

const SCALE_ORDER: ScaleKey[] = ['autism', 'adhd', 'attention-domains', 'learning-difficulties']

const CONCERN_TO_SCALE: Record<ConcernKey, ScaleKey> = {
  autism: 'autism', adhd: 'adhd', attention: 'attention-domains', learning: 'learning-difficulties',
}

const SCALE_DURATION: Record<ScaleKey, number> = {
  autism: 12, adhd: 10, 'attention-domains': 12, 'learning-difficulties': 12,
}

const SCALE_COMPONENT: Record<ScaleKey, React.ComponentType<{
  studentId: string
  onComplete: (result: AssessmentResult) => void
  onCancel: () => void
}>> = {
  autism: AutismScale,
  adhd: ADHDScale,
  'attention-domains': AttentionDomainsScale,
  'learning-difficulties': LearningDifficultiesScale,
}

const SEVERITY_BADGE: Record<AssessmentResult['severity'], string> = {
  none:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  mild:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  moderate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  severe:   'bg-red-50 text-red-700 ring-1 ring-red-200',
}

const SEVERITY_BAR: Record<AssessmentResult['severity'], string> = {
  none: 'bg-emerald-500', mild: 'bg-amber-400', moderate: 'bg-orange-500', severe: 'bg-red-500',
}

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : 'fr-FR'
}

const DRAFT_KEY = 'specialist-toolkit-draft-v1'

interface Draft {
  step: Step
  name: string; age: string; gender: 'male' | 'female' | 'unspecified'; parentName: string
  concerns: ConcernKey[]; selectedScales: ScaleKey[]
  runOrder: ScaleKey[]; currentIndex: number; results: AssessmentResult[]
  therapistName: string; studentId: string
  savedAt: number
}

export default function SpecialistToolkitPage() {
  const { lang } = useLang()
  const t = tr[lang].adminSpecialistToolkit

  const [step, setStep] = useState<Step>('info')
  const [error, setError] = useState('')

  // Step 1 — child info
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'unspecified'>('unspecified')
  const [parentName, setParentName] = useState('')
  const [concerns, setConcerns] = useState<Set<ConcernKey>>(new Set())

  // Step 2 — battery
  const [selectedScales, setSelectedScales] = useState<Set<ScaleKey>>(new Set())

  // Step 3 — running
  const [runOrder, setRunOrder] = useState<ScaleKey[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [studentId, setStudentId] = useState(() => `temp-${Date.now().toString(36)}`)

  // Step 4 — report
  const [therapistName, setTherapistName] = useState('')

  // Local draft recovery — protects an in-progress walk-in assessment from tab refresh/crash
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft: Draft = JSON.parse(raw)
      if (draft.name?.trim() || (draft.results?.length ?? 0) > 0) {
        setPendingDraft(draft)
      } else {
        localStorage.removeItem(DRAFT_KEY)
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (pendingDraft) return // don't overwrite the saved draft until the user decides
    if (!name.trim() && results.length === 0) return // nothing worth saving yet
    const draft: Draft = {
      step, name, age, gender, parentName,
      concerns: [...concerns], selectedScales: [...selectedScales],
      runOrder, currentIndex, results, therapistName, studentId,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setLastSavedAt(draft.savedAt)
    } catch { /* storage unavailable — printing/report still works without autosave */ }
  }, [pendingDraft, step, name, age, gender, parentName, concerns, selectedScales, runOrder, currentIndex, results, therapistName, studentId])

  function restoreDraft() {
    if (!pendingDraft) return
    setStep(pendingDraft.step)
    setName(pendingDraft.name); setAge(pendingDraft.age); setGender(pendingDraft.gender); setParentName(pendingDraft.parentName)
    setConcerns(new Set(pendingDraft.concerns)); setSelectedScales(new Set(pendingDraft.selectedScales))
    setRunOrder(pendingDraft.runOrder); setCurrentIndex(pendingDraft.currentIndex); setResults(pendingDraft.results)
    setTherapistName(pendingDraft.therapistName); setStudentId(pendingDraft.studentId)
    setLastSavedAt(pendingDraft.savedAt)
    setPendingDraft(null)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setPendingDraft(null)
  }

  function toggleConcern(c: ConcernKey) {
    setConcerns(prev => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  function toggleScale(s: ScaleKey) {
    setSelectedScales(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  function goToBattery() {
    if (!name.trim() || !age.trim() || concerns.size === 0) {
      setError(t.missingFieldsError)
      return
    }
    setError('')
    setSelectedScales(new Set([...concerns].map(c => CONCERN_TO_SCALE[c])))
    setStep('battery')
  }

  function startRun() {
    if (selectedScales.size === 0) {
      setError(t.noScalesSelectedError)
      return
    }
    setError('')
    const order = SCALE_ORDER.filter(s => selectedScales.has(s))
    setRunOrder(order)
    setCurrentIndex(0)
    setResults([])
    setStep('running')
  }

  function advance() {
    if (currentIndex + 1 < runOrder.length) setCurrentIndex(i => i + 1)
    else setStep('report')
  }

  function handleScaleComplete(result: AssessmentResult) {
    setResults(prev => [...prev, result])
    advance()
  }

  function handleScaleSkip() {
    advance()
  }

  function resetAll() {
    localStorage.removeItem(DRAFT_KEY)
    setLastSavedAt(null)
    setStep('info')
    setName(''); setAge(''); setGender('unspecified'); setParentName('')
    setConcerns(new Set()); setSelectedScales(new Set())
    setRunOrder([]); setCurrentIndex(0); setResults([]); setTherapistName('')
    setStudentId(`temp-${Date.now().toString(36)}`)
    setError('')
  }

  const totalMinutes = useMemo(
    () => [...selectedScales].reduce((sum, s) => sum + SCALE_DURATION[s], 0),
    [selectedScales]
  )

  const actionPlan = useMemo(() => {
    const all = results.flatMap(r => r.recommendations)
    return [...new Set(all)]
  }, [results])

  const today = new Date().toLocaleDateString(localeFor(lang), { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header — hidden when printing the report */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t.pageTitle}</h1>
            <p className="text-gray-500 text-sm">{t.pageSubtitle}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-5 text-xs font-bold">
          {(['info', 'battery', 'running', 'report'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ltr-num ${
                step === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{i + 1}</span>
              <span className={step === s ? 'text-teal-700' : 'text-gray-400'}>{t.steps[s]}</span>
              {i < 3 && <span className="w-4 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {lastSavedAt && step !== 'info' && (
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-3">
            <Save className="w-3 h-3" />
            {t.autosavedLabel(new Date(lastSavedAt).toLocaleTimeString(localeFor(lang), { hour: '2-digit', minute: '2-digit' }))}
          </p>
        )}
      </div>

      {pendingDraft && (
        <div className="print:hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Save className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-amber-900 text-sm">{t.draftFoundTitle}</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">{t.draftFoundMessage(pendingDraft.name)}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={restoreDraft}
                className="bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors">
                {t.restoreDraftButton}
              </button>
              <button onClick={discardDraft}
                className="border border-amber-300 text-amber-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
                {t.discardDraftButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="print:hidden bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">{error}</div>
      )}

      {/* ── Step 1: child info ── */}
      {step === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-black text-gray-900">{t.childInfoTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.nameLabel}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.ageLabel}</label>
              <input value={age} onChange={e => setAge(e.target.value.replace(/[^\d]/g, ''))} placeholder={t.agePlaceholder} inputMode="numeric"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">{t.genderLabel}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'unspecified'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      gender === g ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}>
                    {t.genderOptions[g]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.parentNameLabel}</label>
              <input value={parentName} onChange={e => setParentName(e.target.value)} placeholder={t.parentNamePlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">{t.concernsLabel}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['autism', 'adhd', 'attention', 'learning'] as ConcernKey[]).map(c => (
                <button key={c} type="button" onClick={() => toggleConcern(c)}
                  className={`text-right p-3.5 rounded-xl border-2 transition-all ${
                    concerns.has(c) ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    {concerns.has(c)
                      ? <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      : <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                    <span className="font-bold text-sm text-gray-900">{t.concernsOptions[c].label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 mr-6">{t.concernsOptions[c].desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={goToBattery}
            className="w-full bg-teal-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors">
            {t.continueButton}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Step 2: battery selection ── */}
      {step === 'battery' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-black text-gray-900">{t.batteryTitle}</h2>
            <p className="text-gray-500 text-sm mt-1">{t.batterySubtitle}</p>
          </div>

          <div className="space-y-2.5">
            {SCALE_ORDER.map(s => (
              <button key={s} type="button" onClick={() => toggleScale(s)}
                className={`w-full text-right flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedScales.has(s) ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                {selectedScales.has(s)
                  ? <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  : <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                <span className="flex-1 font-bold text-sm text-gray-900">{t.scaleNames[s]}</span>
                <span className="text-xs text-gray-400 ltr-num">~{SCALE_DURATION[s]} {t.minuteUnit}</span>
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-gray-600 ltr-num">{t.estimatedDuration(totalMinutes)}</p>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <ArrowRight className="w-4 h-4" />
              {t.backButton}
            </button>
            <button onClick={startRun}
              className="flex-1 bg-teal-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors">
              <Sparkles className="w-4 h-4" />
              {t.startButton}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: running ── */}
      {step === 'running' && runOrder.length > 0 && (() => {
        const currentScaleKey = runOrder[currentIndex]
        const CurrentScale = SCALE_COMPONENT[currentScaleKey]
        return (
          <div>
            <p className="text-sm font-bold text-teal-700 mb-3 ltr-num">
              {t.progressLabel(currentIndex + 1, runOrder.length, t.scaleNames[currentScaleKey])}
            </p>
            <div className="bg-gray-900 rounded-3xl overflow-hidden">
              <CurrentScale studentId={studentId} onComplete={handleScaleComplete} onCancel={handleScaleSkip} />
            </div>
          </div>
        )
      })()}

      {/* ── Step 4: report ── */}
      {step === 'report' && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm">{t.noScalesSelectedError}</p>
              <button onClick={() => setStep('battery')}
                className="bg-teal-600 text-white font-black px-6 py-3 rounded-2xl hover:bg-teal-700 transition-colors">
                {t.backButton}
              </button>
            </div>
          ) : (
            <>
              <div className="print:hidden flex gap-3">
                <input value={therapistName} onChange={e => setTherapistName(e.target.value)} placeholder={t.therapistNamePlaceholder}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none" />
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm flex-shrink-0">
                  <Printer className="w-4 h-4" />
                  {t.printButton}
                </button>
                <button onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm flex-shrink-0">
                  <RotateCcw className="w-4 h-4" />
                  {t.newAssessmentButton}
                </button>
              </div>

              {/* Printable report */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 print:border-0 print:p-10 print:rounded-none space-y-7">

                {/* Letterhead */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{t.reportBrand}</p>
                      <p className="text-xs text-gray-400">{t.reportTitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 ltr-num">{t.generatedOnLabel}: {today}</p>
                </div>

                {/* Child info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">{t.childLabel}</p>
                    <p className="font-black text-gray-900">{name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">{t.ageLabel.replace(' *', '')}</p>
                    <p className="font-black text-gray-900 ltr-num">{t.ageValueLabel(age)}</p>
                  </div>
                  {parentName && (
                    <div>
                      <p className="text-xs text-gray-400 font-bold">{t.parentLabel}</p>
                      <p className="font-black text-gray-900">{parentName}</p>
                    </div>
                  )}
                  {therapistName && (
                    <div>
                      <p className="text-xs text-gray-400 font-bold">{t.therapistNameLabel}</p>
                      <p className="font-black text-gray-900">{therapistName}</p>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed bg-teal-50/60 border border-teal-100 rounded-xl p-4">
                  {t.narrativeIntro(name)}
                </p>

                {/* Per-assessment sections */}
                {results.map(result => (
                  <div key={result.id} className="space-y-3 break-inside-avoid">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-gray-900">{t.scaleNames[result.type as ScaleKey]}</h3>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${SEVERITY_BADGE[result.severity]}`}>
                        {t.severityLabels[result.severity]}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(result.domainScores).map(([domain, score]) => (
                        <div key={domain}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 font-medium">
                              {(t.domainLabels as Record<string, string>)[domain] ?? domain}
                            </span>
                            <span className="font-black text-gray-800 ltr-num">{score}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${SEVERITY_BAR[result.severity]}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.recommendations.length > 0 ? (
                      <ul className="text-sm text-gray-600 space-y-1 mr-1">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-teal-500 mt-1">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">{t.noRecommendations}</p>
                    )}
                  </div>
                ))}

                {/* Action plan */}
                {actionPlan.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-2 break-inside-avoid">
                    <h3 className="font-black text-gray-900">{t.actionPlanTitle}</h3>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {actionPlan.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-4">{t.disclaimerText}</p>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title={t.resetConfirmTitle}
        message={t.resetConfirmMessage}
        confirmLabel={t.resetConfirmButton}
        cancelLabel={t.cancelButton}
        confirmClass="bg-teal-600 hover:bg-teal-700"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onConfirm={() => { setConfirmReset(false); resetAll() }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
