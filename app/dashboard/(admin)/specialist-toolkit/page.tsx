'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { AssessmentResult, Exercise, Program, WeeklySchedule, AgeGroup, Diagnosis } from '@/lib/types'
import { getRecommendedCategories, findMatchingExercises } from '@/lib/domain-exercise-map'
import {
  PersonStanding, ArrowRight, ArrowLeft, Printer, RotateCcw,
  CheckCircle2, Sparkles, ClipboardList, Save, Clock, TimerReset, AlertTriangle, CalendarClock,
  Brain, Activity, Eye, BookOpen, Wand2,
} from 'lucide-react'
import ADHDScale from '@/components/session/assessments/ADHDScale'
import AttentionDomainsScale from '@/components/session/assessments/AttentionDomainsScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'
import AutismScale from '@/components/session/assessments/AutismScale'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ACountUp } from '@/components/ui'
import { staggerContainer, fadeUp, popIn, liftHover, tapOnly } from '@/lib/motion'

type ConcernKey = 'autism' | 'adhd' | 'attention' | 'learning'
type ScaleKey = 'autism' | 'adhd' | 'attention-domains' | 'learning-difficulties'
type Step = 'info' | 'battery' | 'running' | 'report'
type ScaleSource = 'observation' | 'parentReport' | 'both'

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
  initialAnswers?: Record<string, 0|1|2|3>
  onProgress?: (answers: Record<string, 0|1|2|3>) => void
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

const SCALE_ICON: Record<ScaleKey, React.ComponentType<{ className?: string }>> = {
  autism: Brain,
  adhd: Activity,
  'attention-domains': Eye,
  'learning-difficulties': BookOpen,
}

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar'
}

function isLinkedStudentId(id: string) {
  return !id.startsWith('temp-')
}

// Ad-hoc profile inference for unlinked walk-ins — there's no registered Student record to
// read ageGroup/diagnosis/severityLevel from, so derive best-effort values from what the
// toolkit already collected (declared concerns + the scales actually run) for the AI prompt.
function inferAgeGroup(ageStr: string): AgeGroup {
  const n = parseInt(ageStr, 10)
  if (!Number.isFinite(n)) return '5-11'
  if (n <= 11) return '5-11'
  if (n <= 17) return '12-17'
  return '18-22'
}

function inferDiagnosis(concerns: Set<ConcernKey>): Diagnosis {
  const hasAutism = concerns.has('autism')
  const hasAdhd = concerns.has('adhd')
  if (hasAutism && hasAdhd) return 'ADHD+AUTISM'
  if (hasAutism) return 'AUTISM'
  if (hasAdhd) return 'ADHD'
  return 'OTHER'
}

function inferSeverityLevel(results: AssessmentResult[]): 1 | 2 | 3 {
  if (results.some(r => r.severity === 'severe')) return 3
  if (results.some(r => r.severity === 'moderate')) return 2
  return 1
}

// Normalizes common Arabic spelling variants (hamza forms, alef maksura, taa marbuta)
// so a search for "احمد" still matches a name stored as "أحمد".
function normalizeArabic(text: string) {
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
}

function ageFromBirthDate(birthDate: string): string {
  const d = new Date(birthDate)
  if (isNaN(d.getTime())) return ''
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
  return years >= 0 ? String(years) : ''
}

interface ClientListStudent { id: string; firstName: string; lastName: string; birthDate: string }
interface ClientListItem { id: string; firstName: string; lastName: string; students: ClientListStudent[] }

const DRAFT_KEY = 'specialist-toolkit-draft-v1'

interface Draft {
  step: Step
  name: string; age: string; gender: 'male' | 'female' | 'unspecified'; parentName: string
  concerns: ConcernKey[]; selectedScales: ScaleKey[]
  runOrder: ScaleKey[]; currentIndex: number; results: AssessmentResult[]
  clinicalNotes: Partial<Record<ScaleKey, string>>
  scaleSource: Partial<Record<ScaleKey, ScaleSource>>
  partialAnswers: Partial<Record<ScaleKey, Record<string, 0|1|2|3>>>
  therapistName: string; studentId: string
  savedResultIds: string[]
  savedAt: number
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function playChime() {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.65)
    osc.onended = () => ctx.close()
  } catch { /* Web Audio unavailable — the visual countdown still works */ }
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

  // Linking to an already-registered child — lets the assessment persist to that child's permanent record
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [childQuery, setChildQuery] = useState('')
  const [childPickerOpen, setChildPickerOpen] = useState(false)
  const [pastAssessments, setPastAssessments] = useState<AssessmentResult[]>([])
  const [pastAssessmentsLoading, setPastAssessmentsLoading] = useState(false)
  const [clientsLoadError, setClientsLoadError] = useState(false)

  // Step 2 — battery
  const [selectedScales, setSelectedScales] = useState<Set<ScaleKey>>(new Set())
  const [warmupOpen, setWarmupOpen] = useState(true)

  // Step 3 — running
  const [runOrder, setRunOrder] = useState<ScaleKey[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [clinicalNotes, setClinicalNotes] = useState<Partial<Record<ScaleKey, string>>>({})
  const [scaleSource, setScaleSource] = useState<Partial<Record<ScaleKey, ScaleSource>>>({})
  const [partialAnswers, setPartialAnswers] = useState<Partial<Record<ScaleKey, Record<string, 0|1|2|3>>>>({})
  const [studentId, setStudentId] = useState(() => `temp-${Date.now().toString(36)}`)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerResetNonce, setTimerResetNonce] = useState(0)

  // Step 4 — report
  const [therapistName, setTherapistName] = useState('')
  const [savedResultIds, setSavedResultIds] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [retryNonce, setRetryNonce] = useState(0)

  // Closes the loop between a completed walk-in assessment and a real, schedulable program —
  // reuses the existing AI generator + program-persistence endpoints rather than duplicating them
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [programGenerating, setProgramGenerating] = useState(false)
  const [programError, setProgramError] = useState('')
  const [generatedProgram, setGeneratedProgram] = useState<{ title: string; rationale: string; schedule: WeeklySchedule } | null>(null)
  const [programSaving, setProgramSaving] = useState(false)
  const [programSaved, setProgramSaved] = useState(false)

  // The linked child's current real program — lets the report flag which action-plan
  // exercises are already scheduled instead of just suggesting them blindly
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null)

  // Default the therapist field to the logged-in dashboard user's name — still editable,
  // and never overwrites a name already set (e.g. restored from a draft)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.name) setTherapistName(prev => prev || d.name) })
      .catch(() => {})
  }, [])

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
      runOrder, currentIndex, results, clinicalNotes, scaleSource, partialAnswers, therapistName, studentId,
      savedResultIds: [...savedResultIds],
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setLastSavedAt(draft.savedAt)
    } catch { /* storage unavailable — printing/report still works without autosave */ }
  }, [pendingDraft, step, name, age, gender, parentName, concerns, selectedScales, runOrder, currentIndex, results, clinicalNotes, scaleSource, partialAnswers, therapistName, studentId, savedResultIds])

  function restoreDraft() {
    if (!pendingDraft) return
    setStep(pendingDraft.step)
    setName(pendingDraft.name); setAge(pendingDraft.age); setGender(pendingDraft.gender); setParentName(pendingDraft.parentName)
    setConcerns(new Set(pendingDraft.concerns)); setSelectedScales(new Set(pendingDraft.selectedScales))
    setRunOrder(pendingDraft.runOrder); setCurrentIndex(pendingDraft.currentIndex); setResults(pendingDraft.results)
    setClinicalNotes(pendingDraft.clinicalNotes ?? {})
    setScaleSource(pendingDraft.scaleSource ?? {})
    setPartialAnswers(pendingDraft.partialAnswers ?? {})
    setTherapistName(pendingDraft.therapistName); setStudentId(pendingDraft.studentId)
    setSavedResultIds(new Set(pendingDraft.savedResultIds ?? []))
    setLastSavedAt(pendingDraft.savedAt)
    setPendingDraft(null)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setPendingDraft(null)
  }

  // Fetch registered clients once, to power the "link to existing child" search
  function loadClients() {
    setClientsLoadError(false)
    fetch('/api/admin/clients-list')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => { if (data?.clients) setClients(data.clients); else setClientsLoadError(true) })
      .catch(() => setClientsLoadError(true))
  }
  useEffect(() => { loadClients() }, [])

  // Powers both the "matched exercises" hints on the report and the program-generation preview
  useEffect(() => {
    fetch('/api/exercises')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.exercises) setAllExercises(d.exercises) })
      .catch(() => {})
  }, [])

  async function generateProgram() {
    setProgramGenerating(true)
    setProgramError('')
    setGeneratedProgram(null)
    setProgramSaved(false)
    try {
      // Linked: the API re-derives the full profile + history from the real student record.
      // Unlinked walk-in: there's no record to read, so send the best-effort profile + the
      // in-memory results from this session instead — the program just won't be persisted.
      const body = isLinkedStudentId(studentId)
        ? { studentId }
        : {
            profile: {
              name: name.trim() || undefined,
              ageGroup: inferAgeGroup(age),
              diagnosis: inferDiagnosis(concerns),
              severityLevel: inferSeverityLevel(results),
            },
            assessments: results,
          }
      const res = await fetch('/api/admin/ai-generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) setGeneratedProgram({ title: data.title, rationale: data.rationale, schedule: data.schedule })
      else setProgramError(data.error || t.programGenerateError)
    } catch {
      setProgramError(t.programGenerateError)
    } finally {
      setProgramGenerating(false)
    }
  }

  async function saveProgram() {
    if (!generatedProgram || !isLinkedStudentId(studentId)) return
    setProgramSaving(true)
    setProgramError('')
    try {
      const startDate = new Date().toISOString().slice(0, 10)
      const endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, title: generatedProgram.title, startDate, endDate, weeklySchedule: generatedProgram.schedule }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.program) setCurrentProgram(data.program)
        setProgramSaved(true)
      } else {
        const d = await res.json().catch(() => ({}))
        setProgramError(d.error || t.programSaveError)
      }
    } catch {
      setProgramError(t.programSaveError)
    } finally {
      setProgramSaving(false)
    }
  }

  const childMatches = useMemo(() => {
    const q = normalizeArabic(childQuery.trim())
    if (!q) return []
    const all = clients.flatMap(c => c.students.map(s => ({ student: s, parent: c })))
    return all
      .filter(({ student, parent }) =>
        normalizeArabic(`${student.firstName} ${student.lastName}`).includes(q) ||
        normalizeArabic(`${parent.firstName} ${parent.lastName}`).includes(q)
      )
      .slice(0, 8)
  }, [clients, childQuery])

  function linkChild(student: ClientListStudent, parent: ClientListItem) {
    setStudentId(student.id)
    setName(`${student.firstName} ${student.lastName}`.trim())
    setAge(ageFromBirthDate(student.birthDate))
    setParentName(`${parent.firstName} ${parent.lastName}`.trim())
    setChildQuery('')
    setChildPickerOpen(false)
  }

  function unlinkChild() {
    setStudentId(`temp-${Date.now().toString(36)}`)
    setPastAssessments([])
    setCurrentProgram(null)
  }

  // Same-type assessments already on this linked child's record within the last 24h —
  // surfaced as a non-blocking heads-up, not a hard block (a re-assessment can be intentional)
  const recentDuplicateTypes = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600 * 1000
    const types = new Set<ScaleKey>()
    for (const r of pastAssessments) {
      if (new Date(r.completedAt).getTime() >= cutoff) types.add(r.type as ScaleKey)
    }
    return types
  }, [pastAssessments])

  // Pull this child's previously saved assessments once linked, for context before running new scales
  useEffect(() => {
    if (!isLinkedStudentId(studentId)) { setPastAssessments([]); return }
    setPastAssessmentsLoading(true)
    fetch(`/api/assessments?studentId=${encodeURIComponent(studentId)}`)
      .then(r => (r.ok ? r.json() : { results: [] }))
      .then(data => setPastAssessments(data.results ?? []))
      .catch(() => setPastAssessments([]))
      .finally(() => setPastAssessmentsLoading(false))
  }, [studentId])

  // Pull this child's current real program — powers the "already scheduled" badges on the report
  useEffect(() => {
    if (!isLinkedStudentId(studentId)) { setCurrentProgram(null); return }
    fetch(`/api/admin/programs?studentId=${encodeURIComponent(studentId)}`)
      .then(r => (r.ok ? r.json() : { program: null }))
      .then(data => setCurrentProgram(data.program ?? null))
      .catch(() => setCurrentProgram(null))
  }, [studentId])

  // Persist newly completed results to the linked child's permanent record
  useEffect(() => {
    if (step !== 'report' || !isLinkedStudentId(studentId)) return
    const unsaved = results.filter(r => !savedResultIds.has(r.id))
    if (unsaved.length === 0) {
      if (results.length > 0) setSaveStatus('saved')
      return
    }
    let cancelled = false
    setSaveStatus('saving')
    Promise.all(unsaved.map(async r => {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          type: r.type,
          subtype: r.subtype,
          domainScores: r.domainScores,
          totalScore: r.totalScore,
          severity: r.severity,
          recommendations: r.recommendations,
          answers: r.answers,
          assessedByName: therapistName,
          clinicalNotes: clinicalNotes[r.type as ScaleKey],
        }),
      })
      return { id: r.id, ok: res.ok }
    })).then(outcomes => {
      if (cancelled) return
      const newlySaved = outcomes.filter(o => o.ok).map(o => o.id)
      if (newlySaved.length > 0) setSavedResultIds(prev => new Set([...prev, ...newlySaved]))
      setSaveStatus(outcomes.every(o => o.ok) ? 'saved' : 'error')
    }).catch(() => { if (!cancelled) setSaveStatus('error') })
    return () => { cancelled = true }
  }, [step, results, studentId, savedResultIds, therapistName, clinicalNotes, retryNonce])

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

  function clearPartialAnswers(scaleKey: ScaleKey) {
    setPartialAnswers(prev => {
      const next = { ...prev }
      delete next[scaleKey]
      return next
    })
  }

  function handleScaleComplete(result: AssessmentResult) {
    setResults(prev => [...prev, result])
    clearPartialAnswers(result.type as ScaleKey)
    advance()
  }

  function handleScaleSkip() {
    clearPartialAnswers(runOrder[currentIndex])
    advance()
  }

  function resetAll() {
    localStorage.removeItem(DRAFT_KEY)
    setLastSavedAt(null)
    setStep('info')
    setName(''); setAge(''); setGender('unspecified'); setParentName('')
    setConcerns(new Set()); setSelectedScales(new Set()); setWarmupOpen(true)
    setRunOrder([]); setCurrentIndex(0); setResults([]); setClinicalNotes({}); setScaleSource({}); setPartialAnswers({}); setTherapistName('')
    setStudentId(`temp-${Date.now().toString(36)}`)
    setSavedResultIds(new Set()); setSaveStatus('idle')
    setChildQuery(''); setChildPickerOpen(false); setPastAssessments([])
    setProgramError(''); setGeneratedProgram(null); setProgramSaved(false)
    setError('')
  }

  function resetTimer() {
    setTimerResetNonce(n => n + 1)
  }

  // Per-scale countdown timer — resets whenever a new scale starts, chimes once at zero
  useEffect(() => {
    if (step !== 'running' || runOrder.length === 0) return
    const scaleKey = runOrder[currentIndex]
    setSecondsLeft(SCALE_DURATION[scaleKey] * 60)
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          playChime()
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [step, currentIndex, runOrder, timerResetNonce])

  const totalMinutes = useMemo(
    () => [...selectedScales].reduce((sum, s) => sum + SCALE_DURATION[s], 0),
    [selectedScales]
  )

  const actionPlan = useMemo(() => {
    const all = results.flatMap(r => r.recommendations)
    return [...new Set(all)]
  }, [results])

  // Conservative, deterministic cross-domain pattern detection — phrased as "needs attention", not a diagnosis
  const redFlags = useMemo(() => {
    const flags: string[] = []
    const byType = new Map(results.map(r => [r.type, r] as const))
    const autism = byType.get('autism')
    const adhd = byType.get('adhd')
    const attention = byType.get('attention-domains')
    const learning = byType.get('learning-difficulties')
    const isElevated = (r?: AssessmentResult) => !!r && r.severity !== 'none'

    if (isElevated(autism) && isElevated(adhd)) flags.push(t.redFlags.autismAdhd)

    if (autism && (autism.domainScores.selfRegulation ?? 0) >= 45 && (autism.domainScores.flexibility ?? 0) >= 45) {
      flags.push(t.redFlags.selfRegFlex)
    }

    if (autism && attention && (autism.domainScores.sensory ?? 0) >= 45 && (attention.domainScores.inhibition ?? 0) >= 50) {
      flags.push(t.redFlags.sensoryInhibition)
    }

    if (isElevated(learning) && (
      (adhd?.domainScores.attention ?? 0) >= 50 ||
      (attention?.domainScores.sustained ?? 0) >= 50 ||
      (attention?.domainScores.selective ?? 0) >= 50
    )) {
      flags.push(t.redFlags.learningAttention)
    }

    if (results.filter(r => r.severity === 'moderate' || r.severity === 'severe').length >= 2) {
      flags.push(t.redFlags.multiModerate)
    }

    return flags
  }, [results, t])

  const recommendedFrequency = useMemo((): 'low' | 'medium' | 'high' | null => {
    if (results.length === 0) return null
    if (results.some(r => r.severity === 'severe') || redFlags.length > 0) return 'high'
    if (results.some(r => r.severity === 'moderate')) return 'medium'
    if (results.some(r => r.severity === 'mild')) return 'low'
    return null
  }, [results, redFlags])

  const today = new Date().toLocaleDateString(localeFor(lang), { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <motion.div className="max-w-3xl space-y-6" variants={staggerContainer} initial="hidden" animate="show">

      {/* Header — hidden when printing the report */}
      <motion.div variants={fadeUp} className="print:hidden">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <PersonStanding className="w-5 h-5 text-white" />
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
              <motion.span layout transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center ltr-num ${
                step === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-white'
              }`}>{i + 1}</motion.span>
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
      </motion.div>

      {pendingDraft && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
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
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">{error}</motion.div>
      )}

      <AnimatePresence mode="wait">
      {/* ── Step 1: child info ── */}
      {step === 'info' && (
        <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-black text-gray-900">{t.childInfoTitle}</h2>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.linkChildLabel}</label>
            {isLinkedStudentId(studentId) ? (
              <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex items-center justify-between gap-3 bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5">
                <p className="text-sm font-bold text-teal-700">{t.linkChildLinkedBadge(name)}</p>
                <button type="button" onClick={unlinkChild}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 flex-shrink-0 transition-colors">
                  {t.unlinkChildButton}
                </button>
              </motion.div>
            ) : (
              <div className="relative">
                <input value={childQuery}
                  onChange={e => { setChildQuery(e.target.value); setChildPickerOpen(true) }}
                  onFocus={() => setChildPickerOpen(true)}
                  onBlur={() => setTimeout(() => setChildPickerOpen(false), 150)}
                  placeholder={t.linkChildSearchPlaceholder}
                  role="combobox" aria-expanded={childPickerOpen && !!childQuery.trim()} aria-controls="child-picker-listbox" aria-autocomplete="list"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none" />
                <AnimatePresence>
                {childPickerOpen && childQuery.trim() && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    id="child-picker-listbox" role="listbox" aria-label={t.linkChildLabel}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {childMatches.length === 0 ? (
                      <p className="px-3.5 py-2.5 text-xs text-gray-400">{t.linkChildNoResults}</p>
                    ) : (
                      <motion.div variants={staggerContainer} initial="hidden" animate="show">
                        {childMatches.map(({ student, parent }) => (
                          <motion.button key={student.id} variants={fadeUp} type="button" role="option" aria-selected={false}
                            onMouseDown={() => linkChild(student, parent)}
                            className="w-full text-right px-3.5 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                            <p className="text-sm font-bold text-gray-800">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{parent.firstName} {parent.lastName}</p>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            )}
            {clientsLoadError && (
              <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {t.clientsLoadErrorLabel}
                </span>
                <button type="button" onClick={loadClients} className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
                  {t.retryLabel}
                </button>
              </div>
            )}
          </div>

          {isLinkedStudentId(studentId) && (
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-gray-500">{t.pastAssessmentsTitle}</p>
              {pastAssessmentsLoading ? (
                <p className="text-xs text-gray-400">{t.pastAssessmentsLoading}</p>
              ) : pastAssessments.length === 0 ? (
                <p className="text-xs text-gray-400">{t.pastAssessmentsEmpty}</p>
              ) : (
                <motion.ul className="space-y-1.5" variants={staggerContainer} initial="hidden" animate="show">
                  {pastAssessments.map(r => (
                    <motion.li key={r.id} variants={fadeUp} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-700 flex-1">{t.scaleNames[r.type as ScaleKey] ?? r.type}</span>
                        <span className="text-gray-400 ltr-num flex-shrink-0">{new Date(r.completedAt).toLocaleDateString(localeFor(lang))}</span>
                        <span className={`px-2 py-0.5 rounded-full font-black flex-shrink-0 ${SEVERITY_BADGE[r.severity]}`}>{t.severityLabels[r.severity]}</span>
                      </div>
                      {r.clinicalNotes && (
                        <p className="text-gray-400 mt-0.5 truncate" title={r.clinicalNotes}>{r.clinicalNotes}</p>
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          )}

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
                      gender === g ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-teal-700 hover:border-gray-300'
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
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={staggerContainer} initial="hidden" animate="show">
              {(['autism', 'adhd', 'attention', 'learning'] as ConcernKey[]).map(c => (
                <motion.button key={c} variants={popIn} {...liftHover} type="button" onClick={() => toggleConcern(c)}
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
                </motion.button>
              ))}
            </motion.div>
          </div>

          <button onClick={goToBattery}
            className="w-full bg-teal-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors">
            {t.continueButton}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ── Step 2: battery selection ── */}
      {step === 'battery' && (
        <motion.div key="battery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-black text-gray-900">{t.batteryTitle}</h2>
            <p className="text-gray-500 text-sm mt-1">{t.batterySubtitle}</p>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setWarmupOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-right">
              <span className="font-bold text-sm text-gray-800">{t.warmupTitle}</span>
              <span className="text-xs font-bold text-teal-600 flex-shrink-0">
                {warmupOpen ? t.warmupCollapseLabel : t.warmupExpandLabel}
              </span>
            </button>
            {warmupOpen && (
              <div className="p-4 space-y-4 bg-white">
                <ul className="text-sm text-gray-600 space-y-1.5">
                  {t.warmupGeneral.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-teal-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {[...concerns].map(c => (
                  <div key={c} className="space-y-1.5">
                    <p className="text-xs font-bold text-gray-400">{t.concernsOptions[c].label}</p>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {t.warmupByConcern[c].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-teal-500 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.div className="space-y-2.5" variants={staggerContainer} initial="hidden" animate="show">
            {SCALE_ORDER.map(s => (
              <motion.div key={s} variants={popIn}>
                <motion.button {...liftHover} type="button" onClick={() => toggleScale(s)}
                  className={`w-full text-right flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedScales.has(s) ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                  {selectedScales.has(s)
                    ? <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    : <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                  <span className="flex-1 font-bold text-sm text-gray-900">{t.scaleNames[s]}</span>
                  <span className="text-xs text-gray-400 ltr-num">~{SCALE_DURATION[s]} {t.minuteUnit}</span>
                </motion.button>
                {recentDuplicateTypes.has(s) && (
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 mt-1 mr-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {t.duplicateRecentWarning}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>

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
        </motion.div>
      )}

      {/* ── Step 3: running ── */}
      {step === 'running' && runOrder.length > 0 && (() => {
        const currentScaleKey = runOrder[currentIndex]
        const CurrentScale = SCALE_COMPONENT[currentScaleKey]
        return (
          <motion.div key={`running-${currentIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <p className="text-sm font-bold text-teal-700 ltr-num">
                {t.progressLabel(currentIndex + 1, runOrder.length, t.scaleNames[currentScaleKey])}
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-bold text-gray-400">{t.timerLabel}</span>
                <span className={`text-sm font-black ltr-num ${secondsLeft === 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {formatTime(secondsLeft)}
                </span>
                <button type="button" onClick={resetTimer} title={t.resetTimerLabel}
                  className="text-gray-400 hover:text-teal-600 transition-colors">
                  <TimerReset className="w-4 h-4" />
                </button>
              </div>
            </div>
            {secondsLeft === 0 && (
              <p className="text-xs font-bold text-amber-600 mb-3">{t.timeUpLabel}</p>
            )}
            <div className="bg-gray-900 rounded-3xl overflow-hidden">
              <CurrentScale
                studentId={studentId}
                onComplete={handleScaleComplete}
                onCancel={handleScaleSkip}
                initialAnswers={partialAnswers[currentScaleKey]}
                onProgress={answers => setPartialAnswers(prev => ({ ...prev, [currentScaleKey]: answers }))}
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.sourceLabel}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['observation', 'parentReport', 'both'] as ScaleSource[]).map(src => (
                  <button key={src} type="button" onClick={() => setScaleSource(prev => ({ ...prev, [currentScaleKey]: src }))}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      scaleSource[currentScaleKey] === src ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-teal-700 hover:border-gray-300'
                    }`}>
                    {t.sourceOptions[src]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500">{t.clinicalNotesLabel}</label>
                <span className={`text-[11px] font-bold ltr-num ${
                  (clinicalNotes[currentScaleKey]?.length ?? 0) >= 2000
                    ? 'text-red-500'
                    : (clinicalNotes[currentScaleKey]?.length ?? 0) >= 1800
                      ? 'text-amber-500'
                      : 'text-gray-400'
                }`}>
                  {t.clinicalNotesCharCount(clinicalNotes[currentScaleKey]?.length ?? 0, 2000)}
                </span>
              </div>
              <textarea
                value={clinicalNotes[currentScaleKey] ?? ''}
                onChange={e => setClinicalNotes(prev => ({ ...prev, [currentScaleKey]: e.target.value.slice(0, 2000) }))}
                placeholder={t.clinicalNotesPlaceholder}
                rows={3}
                maxLength={2000}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none"
              />
            </div>
          </motion.div>
        )
      })()}

      {/* ── Step 4: report ── */}
      {step === 'report' && (
        <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4">
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
                <motion.button {...tapOnly} onClick={() => window.print()}
                  className="flex items-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm flex-shrink-0">
                  <Printer className="w-4 h-4" />
                  {t.printButton}
                </motion.button>
                <motion.button {...tapOnly} onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm flex-shrink-0">
                  <RotateCcw className="w-4 h-4" />
                  {t.newAssessmentButton}
                </motion.button>
              </div>

              {isLinkedStudentId(studentId) ? (
                <motion.p key={saveStatus} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className={`print:hidden flex items-center gap-1.5 text-xs font-bold ${
                  saveStatus === 'error' ? 'text-red-600' : saveStatus === 'saved' ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {saveStatus === 'error'
                    ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                  {saveStatus === 'saving' && t.savingToRecordLabel}
                  {saveStatus === 'saved' && t.savedToRecordLabel(name)}
                  {saveStatus === 'error' && t.saveFailedLabel}
                  {saveStatus === 'error' && (
                    <button type="button" onClick={() => setRetryNonce(n => n + 1)}
                      className="text-teal-600 font-black hover:text-teal-700 transition-colors underline">
                      {t.retryLabel}
                    </button>
                  )}
                </motion.p>
              ) : (
                <p className="print:hidden flex items-center gap-1.5 text-xs font-bold text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {t.notLinkedNotice}
                </p>
              )}

              {(() => {
                const linked = isLinkedStudentId(studentId)
                const canGenerate = linked ? saveStatus === 'saved' : results.length > 0
                return (
                <div className="print:hidden bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-black text-gray-900 text-sm flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        {t.programGenerateTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{linked ? t.programGenerateSubtitle : t.programGenerateSubtitleUnlinked}</p>
                    </div>
                    <button type="button" onClick={generateProgram} disabled={programGenerating || !canGenerate}
                      className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 text-white font-black px-5 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition-all whitespace-nowrap flex-shrink-0">
                      {programGenerating
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Sparkles className="w-4 h-4" />}
                      {programGenerating ? t.programGenerating : t.programGenerateButton}
                    </button>
                  </div>

                  {linked && saveStatus !== 'saved' && (
                    <p className="text-[11px] font-bold text-amber-600">{t.programNeedsSavedNotice}</p>
                  )}
                  {programError && <p className="text-xs font-bold text-red-600">{programError}</p>}

                  {generatedProgram && (
                    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="font-black text-gray-900 text-sm">{generatedProgram.title}</p>
                      {generatedProgram.rationale && (
                        <p className="text-xs text-gray-500 leading-relaxed">{generatedProgram.rationale}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map(day => (
                          <div key={day} className="bg-white rounded-lg p-2 border border-gray-100 min-w-0">
                            <p className="text-xs font-bold text-gray-600 mb-1">{t.dayLabels[day]}</p>
                            {(generatedProgram.schedule[day] ?? []).map(exId => {
                              const ex = allExercises.find(e => e.id === exId)
                              return (
                                <p key={exId} className="text-[11px] text-gray-500 truncate" title={ex?.titleAr || ex?.title || exId}>
                                  {ex?.titleAr || ex?.title || exId}
                                </p>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      {linked ? (
                        <button type="button" onClick={saveProgram} disabled={programSaving || programSaved}
                          className="w-full bg-teal-600 text-white font-black py-2.5 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                          {programSaving
                            ? t.programSaving
                            : programSaved
                              ? <><CheckCircle2 className="w-4 h-4" />{t.programSavedLabel}</>
                              : t.programSaveButton}
                        </button>
                      ) : (
                        <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {t.programUnlinkedPrintNotice}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
                )
              })()}

              {/* Printable report */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:border-0 print:rounded-none">

                {/* Hero letterhead */}
                <div
                  className="px-8 py-7 print:px-10 print:py-8 text-white"
                  style={{ background: 'linear-gradient(135deg,#0f3a3c 0%,#0d9488 55%,#2dd4bf 100%)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                        <PersonStanding className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-lg leading-tight">{t.reportBrand}</p>
                        <p className="text-[11px] text-white/55 mt-0.5">{t.reportTagline}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-white/15 rounded-full px-3.5 py-1 text-xs font-bold">{t.reportTypeBadge}</span>
                      <p className="text-[11px] text-white/50 mt-1.5 ltr-num">{t.generatedOnLabel}: {today}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 print:p-10 space-y-7">

                {/* Child info card */}
                <div className="flex items-center gap-4 flex-wrap bg-gray-50 rounded-2xl p-5 print:rounded-none">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-black text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500 ltr-num">{t.ageValueLabel(age)}</p>
                  </div>
                  {parentName && (
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold">{t.parentLabel}</p>
                      <p className="text-sm font-bold text-gray-700">{parentName}</p>
                    </div>
                  )}
                  {therapistName && (
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold">{t.therapistNameLabel}</p>
                      <p className="text-sm font-bold text-gray-700">{therapistName}</p>
                    </div>
                  )}
                </div>

                {parentName && (
                  <p className="text-sm text-amber-800 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-4">
                    {t.parentSalutation(name)}
                  </p>
                )}

                <p className="text-sm text-teal-700 leading-relaxed bg-teal-50/60 border border-teal-100 rounded-xl p-4">
                  {t.narrativeIntro(name)}
                </p>

                {/* Per-assessment sections */}
                {results.map((result, resultIndex) => {
                  const ScaleIcon = SCALE_ICON[result.type as ScaleKey]
                  return (
                  <motion.div key={result.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: resultIndex * 0.08 }}
                    className="space-y-3 break-inside-avoid">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <ScaleIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">{t.scaleNames[result.type as ScaleKey]}</h3>
                          {scaleSource[result.type as ScaleKey] && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {t.sourceReportLabel}: {t.sourceOptions[scaleSource[result.type as ScaleKey] as ScaleSource]}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ${SEVERITY_BADGE[result.severity]}`}>
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
                            <span className="font-black text-gray-800 ltr-num"><ACountUp value={score} suffix="%" /></span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full rounded-full ${SEVERITY_BAR[result.severity]}`} />
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

                    {(() => {
                      const categories = getRecommendedCategories(result)
                      if (categories.length === 0) return null
                      const matched = findMatchingExercises(categories, allExercises)
                      return (
                        <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 print:rounded-none">
                          <p className="text-xs font-bold text-teal-700 mb-1.5">{t.matchedExercisesTitle}</p>
                          {matched.length > 0 ? (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {matched.map(ex => {
                                const scheduled = currentProgram?.exerciseIds.includes(ex.id) ?? false
                                return (
                                  <li key={ex.id} className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-teal-500">•</span>
                                    <span>{ex.titleAr || ex.title}</span>
                                    <span className="text-gray-400 ltr-num flex-shrink-0">({ex.durationMinutes}{t.minuteUnit})</span>
                                    {isLinkedStudentId(studentId) && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                        scheduled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'
                                      }`}>
                                        {scheduled ? t.alreadyScheduledBadge : t.notScheduledYetBadge}
                                      </span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <p className="text-xs font-bold text-amber-600">{t.noMatchedExercisesNotice}</p>
                          )}
                        </div>
                      )
                    })()}

                    {clinicalNotes[result.type as ScaleKey]?.trim() && (
                      <div className="bg-gray-50 rounded-xl p-3 print:rounded-none">
                        <p className="text-xs font-bold text-gray-500 mb-1">{t.clinicalNotesReportTitle}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {clinicalNotes[result.type as ScaleKey]}
                        </p>
                      </div>
                    )}
                  </motion.div>
                  )
                })}

                {/* Cross-domain red flags */}
                {redFlags.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-2 break-inside-avoid print:rounded-none">
                    <h3 className="font-black text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {t.redFlagsTitle}
                    </h3>
                    <ul className="text-sm text-red-700/90 space-y-1.5">
                      {redFlags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Recommended session frequency */}
                {recommendedFrequency && (
                  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-teal-50 border border-teal-100 rounded-2xl p-5 space-y-2 break-inside-avoid print:rounded-none">
                    <h3 className="font-black text-teal-800 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4" />
                      {t.frequencyPlanTitle}
                    </h3>
                    <p className="text-sm text-teal-700/90">{t.frequencyPlanOptions[recommendedFrequency]}</p>
                  </motion.div>
                )}

                {/* Action plan */}
                {actionPlan.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-gray-50 rounded-2xl p-5 space-y-2 print:rounded-none">
                    <h3 className="font-black text-gray-900 break-inside-avoid">{t.actionPlanTitle}</h3>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {actionPlan.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 break-inside-avoid">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* AI-generated weekly program — rendered here (not print:hidden) so an unlinked
                    walk-in's program survives in the PDF even though it has nowhere to be saved */}
                {generatedProgram && (
                  <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="bg-purple-50 border border-purple-100 rounded-2xl p-5 space-y-3 break-inside-avoid print:rounded-none">
                    <h3 className="font-black text-brand-800 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      {generatedProgram.title}
                    </h3>
                    {generatedProgram.rationale && (
                      <p className="text-sm text-purple-700/90">{generatedProgram.rationale}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map(day => (
                        <div key={day} className="bg-white rounded-lg p-2 border border-purple-100 min-w-0 break-inside-avoid">
                          <p className="text-xs font-bold text-gray-600 mb-1">{t.dayLabels[day]}</p>
                          {(generatedProgram.schedule[day] ?? []).map(exId => {
                            const ex = allExercises.find(e => e.id === exId)
                            return (
                              <p key={exId} className="text-[11px] text-gray-500" title={ex?.titleAr || ex?.title || exId}>
                                {ex?.titleAr || ex?.title || exId}
                              </p>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Footer signature + disclaimer (kept together so print pagination can't split or drop them) */}
                <div className="break-inside-avoid space-y-4">
                  <div className="flex items-center justify-between border-t border-gray-100 pt-5 flex-wrap gap-3">
                    <div>
                      <p className="text-xs font-black text-gray-700">{t.reportBrand}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t.footerConfidentialLabel}</p>
                    </div>
                    {therapistName && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">{t.footerSignatureLabel}</p>
                        <p className="text-sm font-bold text-gray-700 mt-3">{therapistName}</p>
                      </div>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-4">{t.disclaimerText}</p>
                </div>
                {/* Trailing print buffer: avoids the browser clipping the disclaimer when it misjudges the last page's content height */}
                <div className="hidden print:block print:h-48" aria-hidden="true" />
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        title={t.resetConfirmTitle}
        message={isLinkedStudentId(studentId) ? t.resetConfirmMessage : t.resetConfirmMessageUnlinked}
        confirmLabel={t.resetConfirmButton}
        cancelLabel={t.cancelButton}
        confirmClass="bg-teal-600 hover:bg-teal-700"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onConfirm={() => { setConfirmReset(false); resetAll() }}
        onCancel={() => setConfirmReset(false)}
      />
    </motion.div>
  )
}
