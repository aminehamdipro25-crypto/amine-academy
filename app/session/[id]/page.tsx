'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, X, Save, Video, Star, ClipboardList, PenLine, ChevronDown, User } from 'lucide-react'
import type { ExerciseResult, AssessmentResult, SessionObservations } from '@/lib/types'
import { rankGamesForStudent, getTopGames, DIFFICULTY_LABELS_AR } from '@/lib/game-mapping'
import type { StudentAssessmentProfile } from '@/lib/types'

import MemoryCards     from '@/components/session/exercises/MemoryCards'
import SequenceMemory  from '@/components/session/exercises/SequenceMemory'
import NBackTask       from '@/components/session/exercises/NBackTask'
import WordRecall      from '@/components/session/exercises/WordRecall'
import BreathingGuide  from '@/components/session/exercises/BreathingGuide'
import TapTarget       from '@/components/session/exercises/TapTarget'
import SimonSays       from '@/components/session/exercises/SimonSays'
import LetterMatch     from '@/components/session/exercises/LetterMatch'
import ReactionGame    from '@/components/session/exercises/ReactionGame'
import StroopTest      from '@/components/session/exercises/StroopTest'
import StopSignal      from '@/components/session/exercises/StopSignal'
import EmotionCards    from '@/components/session/exercises/EmotionCards'
import TokenBoard      from '@/components/session/exercises/TokenBoard'
import SelfRating      from '@/components/session/exercises/SelfRating'
import VerbalFluency   from '@/components/session/exercises/VerbalFluency'
import SocialScenarios from '@/components/session/exercises/SocialScenarios'
import BehaviorContract from '@/components/session/exercises/BehaviorContract'
import ColorGrid        from '@/components/session/exercises/ColorGrid'
import PatternMatch     from '@/components/session/exercises/PatternMatch'
import WordBuilder      from '@/components/session/exercises/WordBuilder'
import Whiteboard      from '@/components/session/Whiteboard'
import ADHDScale       from '@/components/session/assessments/ADHDScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'
import AttentionDomainsScale from '@/components/session/assessments/AttentionDomainsScale'

type ActiveView =
  | { type: 'exercise'; id: string }
  | { type: 'assessment'; id: string }
  | null

interface ObsEntry {
  text: string
  category: string
  color: string
  elapsed: number   // seconds since session start
  ts: string        // HH:MM
}

const QUICK_OBS: { category: string; color: string; bg: string; items: { text: string; icon: string }[] }[] = [
  {
    category: 'انتباه',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
    items: [
      { text: 'فقد التركيز',        icon: '😵' },
      { text: 'عاد للتركيز',        icon: '🎯' },
      { text: 'تشتت متكرر',         icon: '🌀' },
    ],
  },
  {
    category: 'سلوك',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    items: [
      { text: 'أكمل بدون مساعدة',   icon: '✅' },
      { text: 'طلب مساعدة',         icon: '🙋' },
      { text: 'رفض النشاط',         icon: '🚫' },
    ],
  },
  {
    category: 'مزاج',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.15)',
    items: [
      { text: 'مزاج ممتاز',          icon: '😄' },
      { text: 'توتر / قلق',          icon: '😟' },
      { text: 'طلب استراحة',         icon: '⏸️' },
    ],
  },
  {
    category: 'أداء',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.15)',
    items: [
      { text: 'تحسن ملحوظ',          icon: '📈' },
      { text: 'صعوبة واضحة',         icon: '⚠️' },
      { text: 'أداء استثنائي',        icon: '🏆' },
    ],
  },
]

interface SessionPhase {
  id: string
  label: string
  icon: string
  defaultMin: number
  color: string
}

const SESSION_PHASES: SessionPhase[] = [
  { id: 'warmup',   label: 'تحية ودفء',    icon: '👋', defaultMin: 5,  color: '#3B82F6' },
  { id: 'main',     label: 'نشاط رئيسي',   icon: '🎯', defaultMin: 30, color: '#7C5CFC' },
  { id: 'assess',   label: 'تقييم',         icon: '📊', defaultMin: 15, color: '#F59E0B' },
  { id: 'wrap',     label: 'تلخيص',         icon: '✅', defaultMin: 5,  color: '#22C55E' },
]

const EXERCISES = [
  { id:'memory-cards',      labelAr:'مطابقة البطاقات',         icon:'🃏', category:'ذاكرة',          color:'bg-purple-900/40 border-purple-500',  ageMin:5,  ageMax:22 },
  { id:'sequence-memory',   labelAr:'تذكر التسلسل',            icon:'🔢', category:'ذاكرة',          color:'bg-blue-900/40 border-blue-500',       ageMin:6,  ageMax:17 },
  { id:'n-back',            labelAr:'ذاكرة N-Back',             icon:'🧩', category:'ذاكرة',          color:'bg-indigo-900/40 border-indigo-500',   ageMin:8,  ageMax:22 },
  { id:'word-recall',       labelAr:'تذكر الكلمات',             icon:'📝', category:'ذاكرة',          color:'bg-violet-900/40 border-violet-500',   ageMin:6,  ageMax:17 },
  { id:'breathing',         labelAr:'تمارين التنفس',            icon:'🌬️', category:'تنظيم',          color:'bg-cyan-900/40 border-cyan-500',        ageMin:5,  ageMax:22 },
  { id:'tap-target',        labelAr:'التناسق الحركي',           icon:'🎯', category:'حركي',           color:'bg-orange-900/40 border-orange-500',   ageMin:5,  ageMax:22 },
  { id:'simon-says',        labelAr:'سايمون يقول',              icon:'🎨', category:'إدراكي',         color:'bg-green-900/40 border-green-500',     ageMin:5,  ageMax:17 },
  { id:'letter-match',      labelAr:'مطابقة الحروف',            icon:'🔤', category:'تعلّم',           color:'bg-amber-900/40 border-amber-500',     ageMin:5,  ageMax:11 },
  { id:'reaction-game',     labelAr:'سرعة رد الفعل',            icon:'⚡', category:'حركي',           color:'bg-yellow-900/40 border-yellow-500',   ageMin:5,  ageMax:22 },
  { id:'stroop-test',       labelAr:'ستروب — كبح الاستجابة',   icon:'🔵', category:'انتباه',          color:'bg-rose-900/40 border-rose-500',       ageMin:10, ageMax:22 },
  { id:'stop-signal',       labelAr:'توقف أو اكمل',             icon:'🛑', category:'اندفاعية',       color:'bg-red-900/40 border-red-500',         ageMin:8,  ageMax:22 },
  { id:'emotion-cards',     labelAr:'التعرف على المشاعر',       icon:'🎭', category:'اجتماعي',        color:'bg-pink-900/40 border-pink-500',       ageMin:5,  ageMax:17 },
  { id:'token-board',       labelAr:'لوح التعزيز',              icon:'🏅', category:'تعديل السلوك',   color:'bg-emerald-900/40 border-emerald-500', ageMin:5,  ageMax:22 },
  { id:'self-rating',       labelAr:'تقييم الذات',              icon:'🪞', category:'تعديل السلوك',   color:'bg-teal-900/40 border-teal-500',       ageMin:7,  ageMax:22 },
  { id:'verbal-fluency',    labelAr:'الطلاقة اللفظية',          icon:'🗣️', category:'معرفي',          color:'bg-sky-900/40 border-sky-500',         ageMin:5,  ageMax:22 },
  { id:'social-scenarios',  labelAr:'المواقف الاجتماعية',       icon:'🤝', category:'اجتماعي',        color:'bg-fuchsia-900/40 border-fuchsia-500', ageMin:5,  ageMax:22 },
  { id:'behavior-contract', labelAr:'عقد الجلسة',               icon:'📋', category:'تعديل السلوك',   color:'bg-lime-900/40 border-lime-500',       ageMin:7,  ageMax:22 },
  { id:'color-grid',        labelAr:'لوحة الألوان',             icon:'🎨', category:'إدراكي',          color:'bg-pink-900/40 border-pink-500',       ageMin:5,  ageMax:14 },
  { id:'pattern-match',     labelAr:'مطابقة الأنماط',           icon:'🔍', category:'إدراكي',          color:'bg-violet-900/40 border-violet-500',   ageMin:5,  ageMax:16 },
  { id:'word-builder',      labelAr:'بناء الكلمة',              icon:'🔤', category:'تعلّم',            color:'bg-emerald-900/40 border-emerald-400', ageMin:5,  ageMax:14 },
]

const ASSESSMENTS = [
  { id:'adhd',               labelAr:'مقياس ADHD',              icon:'⚡', color:'bg-blue-900/40 border-blue-500'    },
  { id:'attention-domains',  labelAr:'أنماط الانتباه — SNAP-IV', icon:'🧠', color:'bg-purple-900/40 border-purple-500' },
  { id:'learning-difficulties', labelAr:'صعوبات التعلم',        icon:'📚', color:'bg-amber-900/40 border-amber-500'  },
]

const SESSION_TYPE_CFG: Record<string, { label: string; color: string; isAssessment?: boolean }> = {
  assessment:   { label: 'جلسة تقييمية',       color: 'bg-amber-500/20 text-amber-200 border-amber-500/50',  isAssessment: true },
  followup:     { label: 'جلسة متابعة',         color: 'bg-blue-500/20 text-blue-200 border-blue-500/50' },
  emergency:    { label: 'استشارة طارئة',       color: 'bg-red-500/20 text-red-200 border-red-500/50' },
  consultation: { label: 'استشارة الوالدين',   color: 'bg-purple-500/20 text-purple-200 border-purple-500/50' },
  training:     { label: 'جلسة تدريبية مكثفة', color: 'bg-green-500/20 text-green-200 border-green-500/50' },
  review:       { label: 'مراجعة البرنامج',     color: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50' },
}

const DIAG_LABELS: Record<string, string> = {
  ADHD: 'ADHD', AUTISM: 'توحد', 'ADHD+AUTISM': 'ADHD+توحد', OTHER: 'أخرى',
}
const SEVERITY_LABELS: Record<number, string> = { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' }

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function playSound(type: 'success' | 'complete' | 'start') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const g = ctx.createGain()
    g.connect(ctx.destination)

    if (type === 'success') {
      // Short happy ding
      const o = ctx.createOscillator()
      o.connect(g)
      o.type = 'sine'
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.frequency.setValueAtTime(523, ctx.currentTime)
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      o.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      o.start(ctx.currentTime)
      o.stop(ctx.currentTime + 0.4)
    } else if (type === 'complete') {
      // Fanfare for session complete
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        o.connect(g)
        o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
        o.start(ctx.currentTime + i * 0.12)
        o.stop(ctx.currentTime + i * 0.12 + 0.3)
      })
    } else if (type === 'start') {
      // Subtle start beep
      const o = ctx.createOscillator()
      o.connect(g)
      o.type = 'sine'
      o.frequency.value = 440
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime)
      o.stop(ctx.currentTime + 0.2)
    }
  } catch { /* AudioContext blocked */ }
}

function ScoreBar({ score, color = 'bg-brand-500' }: { score: number; color?: string }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const startRef = useRef(Date.now())

  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>(null)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [notes, setNotes] = useState('')
  const [difficulty, setDifficulty] = useState<1|2|3>(1)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [studentAge, setStudentAge] = useState(8)
  const [studentName, setStudentName] = useState('')
  const [observations, setObservations] = useState<SessionObservations>({
    attention:3, cooperation:3, energy:3, mood:3, anxiety:3,
  })
  const [tab, setTab] = useState<'exercises'|'assessments'|'log'>('exercises')
  const [categoryFilter, setCategoryFilter] = useState<string>('الكل')
  const [obsLog, setObsLog] = useState<ObsEntry[]>([])
  const [obsOpen, setObsOpen] = useState(false)
  const [obsToast, setObsToast] = useState<ObsEntry | null>(null)
  const [profile, setProfile] = useState<StudentAssessmentProfile | null>(null)
  const [kidMode, setKidMode] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementToast, setAchievementToast] = useState<{ icon: string; message: string } | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null)
  const [currentStudentId, setCurrentStudentId] = useState<string>('')
  const [appointmentType, setAppointmentType] = useState<string>('')
  const [studentDiagnosis, setStudentDiagnosis] = useState<string>('')
  const [studentSeverity, setStudentSeverity] = useState<number>(1)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [gameUsageCounts, setGameUsageCounts] = useState<Record<string, number>>({})

  // Session phases
  const [phaseIdx, setPhaseIdx]         = useState(0)
  const [phaseToast, setPhaseToast]     = useState<SessionPhase | null>(null)
  const [phaseDurations, setPhaseDurations] = useState<number[]>(SESSION_PHASES.map(p => p.defaultMin))
  const [showPhaseEdit, setShowPhaseEdit] = useState(false)

  // Profile card
  const [profileOpen, setProfileOpen]   = useState(false)
  const [pastSessions, setPastSessions] = useState<{ score: number; date: string; count: number }[]>([])

  // Whiteboard
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  // Load appointment/student info + assessment profile + session history
  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then(r => r.json())
      .then(({ appointment }) => {
        if (appointment?.meetingUrl) setJitsiUrl(appointment.meetingUrl)
        if (appointment?.type) {
          setAppointmentType(appointment.type)
          if (appointment.type === 'assessment') setTab('assessments')
        }
        if (appointment?.studentId) {
          const sid = appointment.studentId
          setCurrentStudentId(sid)

          fetch(`/api/students/${sid}`)
            .then(r => r.json())
            .then(({ student }) => {
              if (student) {
                setStudentName(`${student.firstName} ${student.lastName}`)
                setStudentDiagnosis(student.diagnosis || '')
                setStudentSeverity(student.severityLevel || 1)
                const age = Math.floor((Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 3600000))
                setStudentAge(age)
                setDifficulty(student.severityLevel as 1|2|3)
              }
            }).catch(() => {})

          fetch(`/api/admin/assessment-profile/${sid}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.profile) setProfile(d.profile) })
            .catch(() => {})

          // Load session history → compute game usage counts
          fetch(`/api/admin/sessions/student/${sid}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (!d?.sessions?.length) return
              const counts: Record<string, number> = {}
              ;(d.sessions as Array<{ exercises?: Array<{ exerciseType: string }> }>).forEach(log => {
                log.exercises?.forEach(ex => {
                  counts[ex.exerciseType] = (counts[ex.exerciseType] || 0) + 1
                })
              })
              setGameUsageCounts(counts)
              setSessionCount(d.count || 0)
            })
            .catch(() => {})
        }
      }).catch(() => {})
  }, [id])

  const [jitsiEmbedded, setJitsiEmbedded] = useState(false)

  // Jitsi embed URL — disables prejoin screen and sets display name automatically
  const jitsiEmbedUrl = jitsiUrl
    ? `${jitsiUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent('الأستاذ أمين')}`
    : null


  // Timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  // Phase auto-advance based on elapsed seconds
  useEffect(() => {
    if (!running) return
    const thresholds = phaseDurations.reduce<number[]>((acc, d, i) => {
      acc.push((acc[i - 1] ?? 0) + d * 60)
      return acc
    }, [])
    const newPhase = thresholds.findIndex(t => elapsed < t)
    const clamped  = newPhase === -1 ? SESSION_PHASES.length - 1 : newPhase
    if (clamped !== phaseIdx) {
      setPhaseIdx(clamped)
      const phase = SESSION_PHASES[clamped]
      setPhaseToast(phase)
      setTimeout(() => setPhaseToast(null), 3000)
    }
  }, [elapsed, running, phaseDurations, phaseIdx])

  // Load past sessions for profile card
  useEffect(() => {
    if (!currentStudentId) return
    fetch(`/api/admin/sessions/student/${currentStudentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.sessions?.length) return
        const recent = (d.sessions as Array<{ exercises?: Array<{ score: number }>; createdAt?: string }>)
          .slice(0, 3)
          .map(s => ({
            score: s.exercises?.length
              ? Math.round(s.exercises.reduce((sum, e) => sum + e.score, 0) / s.exercises.length)
              : 0,
            date: s.createdAt?.slice(0, 10) ?? '',
            count: s.exercises?.length ?? 0,
          }))
        setPastSessions(recent)
      })
      .catch(() => {})
  }, [currentStudentId])

  function startSession() {
    setRunning(true)
    startRef.current = Date.now()
    playSound('start')
  }

  function showAchievement(icon: string, message: string) {
    setAchievementToast({ icon, message })
    setTimeout(() => setAchievementToast(null), 3500)
  }

  function logObs(text: string, category: string, color: string) {
    const now = new Date()
    const ts = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    const entry: ObsEntry = { text, category, color, elapsed, ts }
    setObsLog(prev => [...prev, entry])
    setObsOpen(false)
    setObsToast(entry)
    setTimeout(() => setObsToast(null), 2500)
  }

  function handleExerciseComplete(result: ExerciseResult) {
    setResults(r => {
      const newResults = [...r, result]
      // Kid Mode completion check — trigger celebration once all top games are done
      if (kidMode && topGames.length > 0) {
        const playedIds = new Set(newResults.map(res => res.exerciseType))
        if (topGames.every(g => playedIds.has(g))) {
          setTimeout(() => {
            setShowCelebration(true)
            playSound('complete')
          }, 800)
        }
      }
      return newResults
    })
    setActiveView(null)
    playSound('success')

    // Save game result for longitudinal tracking
    if (currentStudentId) {
      fetch('/api/game-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId:          result.exerciseType,
          gameLabelAr:     result.exerciseLabelAr,
          sessionId:       id,
          studentId:       currentStudentId,
          score:           result.score,
          accuracy:        result.accuracy,
          reactionTimeMs:  typeof result.metadata?.reactionTimeMs === 'number' ? result.metadata.reactionTimeMs : 0,
          level:           difficulty,
          durationSeconds: result.duration,
          completed:       result.score > 0,
        }),
      }).catch(() => {})
      // Update local usage count
      setGameUsageCounts(prev => ({ ...prev, [result.exerciseType]: (prev[result.exerciseType] || 0) + 1 }))
    }

    // Achievement toasts
    if (result.score >= 95) showAchievement('🏆', `أداء مثالي! ${result.score}%`)
    else if (result.score >= 80) showAchievement('⭐', `أداء ممتاز! ${result.score}%`)
    else if (result.score >= 60) showAchievement('👍', `أداء جيد! ${result.score}%`)
  }

  function handleAssessmentComplete(result: AssessmentResult) {
    setAssessments(a => [...a, result])
    setActiveView(null)
    // Save assessment to API
    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }).catch(() => {})
  }

  async function saveSession() {
    setSaving(true)
    try {
      await fetch(`/api/sessions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          therapistNotes: notes,
          observations,
          exercises: results,
          durationSeconds: elapsed,
          highlights: results.filter(r => r.score >= 80).map(r => `${r.exerciseLabelAr}: ${r.score}%`),
          observationLog: obsLog,
        }),
      })
      setSaved(true)
      playSound('complete')
    } finally {
      setSaving(false)
    }
  }

  const topGames = profile ? getTopGames(profile, 3) : []
  const sortedExercises = profile
    ? (() => {
        const ranked = rankGamesForStudent(profile)
        return [...EXERCISES].sort((a, b) => {
          const ai = ranked.indexOf(a.id)
          const bi = ranked.indexOf(b.id)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
      })()
    : EXERCISES

  // Avg score
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0

  const observationLabels: Record<keyof SessionObservations, string> = {
    attention: 'الانتباه', cooperation: 'التعاون', energy: 'الطاقة', mood: 'المزاج', anxiety: 'القلق',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center gap-4">
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-1.5 font-black text-white text-sm hover:text-brand-300 transition-colors"
              >
                <h1>{studentName || 'جلسة تفاعلية'}</h1>
                <ChevronDown className={`w-3 h-3 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {studentDiagnosis && (
                <span className="text-[10px] bg-brand-900/60 text-brand-300 border border-brand-500/40 px-1.5 py-0.5 rounded-full font-bold">
                  {DIAG_LABELS[studentDiagnosis] || studentDiagnosis}
                </span>
              )}
              {studentSeverity > 0 && (
                <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full font-bold">
                  {SEVERITY_LABELS[studentSeverity]}
                </span>
              )}
              {sessionCount > 0 && (
                <span className="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full font-bold">
                  ج.{sessionCount} سابقة
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {appointmentType && SESSION_TYPE_CFG[appointmentType] && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${SESSION_TYPE_CFG[appointmentType].color}`}>
                  {SESSION_TYPE_CFG[appointmentType].isAssessment && <ClipboardList className="w-2.5 h-2.5" />}
                  {SESSION_TYPE_CFG[appointmentType].label}
                </span>
              )}
              {profile && Object.entries(profile.diagnosedDifficulties)
                .filter(([, v]) => v !== 'none')
                .map(([k, v]) => (
                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    v === 'severe'   ? 'bg-red-900/60 text-red-300' :
                    v === 'moderate' ? 'bg-orange-900/60 text-orange-300' :
                                       'bg-yellow-900/60 text-yellow-300'
                  }`}>
                    {DIFFICULTY_LABELS_AR[k as keyof typeof DIFFICULTY_LABELS_AR]}
                  </span>
                ))
              }
            </div>

            {/* ── Quick Profile Card ── */}
            {profileOpen && (
              <div
                className="absolute top-full mt-2 right-0 z-[70] rounded-2xl p-4 w-72 shadow-2xl"
                style={{
                  background: '#111827',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                }}
                dir="rtl"
              >
                {/* Identity row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-900/60 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm truncate">{studentName || '—'}</div>
                    <div className="text-white/50 text-xs mt-0.5">
                      {studentAge} سنة • {DIAG_LABELS[studentDiagnosis] || studentDiagnosis || 'لا يوجد تشخيص'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {studentSeverity > 0 && (
                        <span className="text-[10px] bg-brand-900/60 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded-full font-bold">
                          {SEVERITY_LABELS[studentSeverity]}
                        </span>
                      )}
                      {sessionCount > 0 && (
                        <span className="text-[10px] text-white/35 font-medium">{sessionCount} جلسة سابقة</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Past 3 sessions */}
                {pastSessions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-white/35 text-[10px] font-black mb-2 uppercase tracking-wider">آخر 3 جلسات</div>
                    <div className="space-y-1.5">
                      {pastSessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${s.score}%`,
                                background: s.score >= 80 ? '#22C55E' : s.score >= 60 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-white/60 text-[10px] font-black ltr-num w-8 text-left">{s.score}%</span>
                          <span className="text-white/25 text-[9px] ltr-num flex-shrink-0">{s.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment difficulties */}
                {profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none') && (
                  <div className="border-t border-white/10 pt-3 mb-3">
                    <div className="text-white/35 text-[10px] font-black mb-2 uppercase tracking-wider">صعوبات موثقة</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(profile.diagnosedDifficulties)
                        .filter(([, v]) => v !== 'none')
                        .map(([k, v]) => (
                          <span key={k} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            v === 'severe'   ? 'bg-red-900/50 text-red-300 border-red-500/30' :
                            v === 'moderate' ? 'bg-orange-900/50 text-orange-300 border-orange-500/30' :
                                               'bg-yellow-900/50 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {DIFFICULTY_LABELS_AR[k as keyof typeof DIFFICULTY_LABELS_AR]}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Pinned notes placeholder */}
                <div className={`${(profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none')) || pastSessions.length > 0 ? 'border-t border-white/10 pt-3' : ''}`}>
                  <div className="text-white/35 text-[10px] font-black mb-1 uppercase tracking-wider">ملاحظات</div>
                  {notes ? (
                    <p className="text-white/50 text-[10px] leading-relaxed line-clamp-3">{notes}</p>
                  ) : (
                    <p className="text-white/25 text-[10px] italic">لا توجد ملاحظات بعد</p>
                  )}
                </div>

                <button
                  onClick={() => setProfileOpen(false)}
                  className="mt-3 w-full text-white/30 hover:text-white/60 text-[10px] font-bold transition-colors pt-2 border-t border-white/10"
                >
                  إغلاق ✕
                </button>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            running ? 'bg-green-900/40 border border-green-500/40' : 'bg-white/5 border border-white/10'
          }`}>
            <Clock className="w-4 h-4 text-green-400" />
            <span className="font-black text-lg ltr-num">{formatTime(elapsed)}</span>
          </div>

          {/* Whiteboard button */}
          <button
            onClick={() => setShowWhiteboard(w => !w)}
            className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
              showWhiteboard
                ? 'bg-amber-500 text-white ring-2 ring-amber-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
            title="السبورة التفاعلية"
          >
            <PenLine className="w-3.5 h-3.5" />
            سبورة
          </button>

          {jitsiUrl && (
            <button
              onClick={() => setJitsiEmbedded(e => !e)}
              className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
                jitsiEmbedded
                  ? 'bg-green-500 text-white ring-2 ring-green-400/50'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
              title="تضمين كاميرا الطالب في الصفحة"
            >
              <Video className="w-3.5 h-3.5" />
              {jitsiEmbedded ? 'المقابلة مفتوحة ●' : 'فتح المقابلة'}
            </button>
          )}
          {!running && (
            <button onClick={startSession}
              className="bg-green-600 hover:bg-green-500 text-white font-black px-4 py-1.5 rounded-lg text-sm transition-colors">
              ▶ ابدأ الجلسة
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Difficulty */}
          <div className="flex items-center gap-1">
            {([1,2,3] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  difficulty === d ? 'bg-brand-600 text-white' : 'bg-white/10 text-white/50'
                }`}>
                {d === 1 ? 'سهل' : d === 2 ? 'متوسط' : 'صعب'}
              </button>
            ))}
          </div>

          {/* Score */}
          {results.length > 0 && (
            <div className="text-center">
              <div className="font-black text-brand-400 text-lg">{avgScore}%</div>
              <div className="text-white/40 text-xs">متوسط</div>
            </div>
          )}

          <button
            onClick={() => setKidMode(m => !m)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-sm transition-all ${
              kidMode
                ? 'bg-gradient-to-r from-[#7C5CFC] to-[#9A7BFD] text-white shadow-[0_4px_12px_-2px_rgba(124,92,252,0.4)]'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
            title="وضع الطفل — شبكة ألعاب كبيرة للطالب"
          >
            🎮 {kidMode ? 'وضع الأستاذ' : 'وضع الطفل'}
          </button>

          <button
            onClick={() => setFocusMode(m => !m)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-sm transition-all ${
              focusMode
                ? 'bg-gradient-to-r from-[#FF8C65] to-[#FFBA44] text-white shadow-[0_4px_12px_-2px_rgba(255,140,101,0.4)]'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
            title="وضع التركيز — يخفي عناصر التشتيت"
          >
            🎯 {focusMode ? 'تركيز فعّال' : 'تركيز'}
          </button>

          <button onClick={saveSession} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg hover:-translate-y-0.5 ${
              saved
                ? 'bg-green-600 text-white shadow-green-900/40'
                : saving
                ? 'bg-brand-700 text-white/80 cursor-wait'
                : 'bg-gradient-to-r from-brand-500 to-[#9A7BFD] text-white shadow-brand hover:shadow-[0_6px_20px_-4px_rgba(124,92,252,0.5)]'
            }`}>
            <Save className="w-4 h-4" />
            {saving ? 'جار الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ الجلسة'}
          </button>
        </div>
      </header>

      {/* Jitsi active indicator */}
      {jitsiEmbedded && (
        <div className="bg-green-900/30 border-b border-green-500/20 px-4 py-1.5 flex items-center justify-between gap-4">
          <p className="text-green-300 text-xs font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            المقابلة المرئية مفعّلة — الطالب يظهر في المنطقة الرئيسية، وعند اختيار تمرين يتقلص إلى الزاوية
          </p>
          <button onClick={() => setJitsiEmbedded(false)}
            className="text-green-400/60 text-xs hover:text-green-300 transition-colors">
            إغلاق
          </button>
        </div>
      )}

      {/* ── Session Phase Progress Bar ── */}
      {running && (
        <div className="bg-gray-900 border-b border-white/10 px-4 py-2 flex items-center gap-3" dir="rtl">
          <span className="text-white/30 text-[10px] font-black flex-shrink-0">مراحل</span>
          <div className="flex items-center gap-2 flex-1">
            {SESSION_PHASES.map((ph, i) => {
              const isActive = i === phaseIdx
              const isDone   = i < phaseIdx
              const phaseStartSec = phaseDurations.slice(0, i).reduce((a, b) => a + b, 0) * 60
              const phaseTotalSec = phaseDurations[i] * 60
              const phaseElapsed  = isActive ? Math.max(0, elapsed - phaseStartSec) : 0
              const progress = isActive
                ? Math.min(100, (phaseElapsed / phaseTotalSec) * 100)
                : isDone ? 100 : 0
              return (
                <button
                  key={ph.id}
                  onClick={() => { setPhaseIdx(i); setPhaseToast(null) }}
                  className="flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition-all"
                  style={{
                    background: isActive ? `${ph.color}18` : 'transparent',
                    border: isActive ? `1px solid ${ph.color}40` : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-[11px]">{ph.icon}</span>
                    <span
                      className="text-[10px] font-black truncate"
                      style={{ color: isActive ? ph.color : isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
                    >
                      {ph.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] mr-auto ltr-num" style={{ color: `${ph.color}99` }}>
                        {formatTime(phaseElapsed)}/{phaseDurations[i]}د
                      </span>
                    )}
                    {isDone && <span className="text-[9px] mr-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>✓</span>}
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%`, background: ph.color, opacity: isDone ? 0.4 : 1 }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
          {/* Phase duration edit — simple inline inputs */}
          <button
            onClick={() => setShowPhaseEdit(e => !e)}
            className="text-white/25 hover:text-white/50 text-[10px] font-bold flex-shrink-0 transition-colors px-1"
            title="تعديل مدة المراحل"
          >
            ⚙
          </button>
          {showPhaseEdit && (
            <div
              className="absolute top-full left-0 right-0 z-[60] flex items-center gap-2 px-4 py-2 flex-wrap"
              style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              dir="rtl"
            >
              {SESSION_PHASES.map((ph, i) => (
                <label key={ph.id} className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span>{ph.icon} {ph.label}</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={phaseDurations[i]}
                    onChange={e => {
                      const v = Math.max(1, Math.min(60, Number(e.target.value)))
                      setPhaseDurations(prev => prev.map((d, idx) => idx === i ? v : d))
                    }}
                    className="w-12 bg-white/10 border border-white/15 rounded-lg px-1.5 py-0.5 text-white text-center text-[10px] font-bold"
                  />
                  <span className="text-white/30">د</span>
                </label>
              ))}
              <button onClick={() => setShowPhaseEdit(false)} className="text-white/30 hover:text-white/60 text-[10px] mr-auto">✕ إغلاق</button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* Sidebar */}
        {!focusMode && <aside className="w-72 bg-gray-900 border-l border-white/10 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['exercises','assessments','log'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                  tab === t ? 'text-white border-b-2 border-brand-500' : 'text-white/40 hover:text-white/70'
                }`}>
                {t === 'exercises' ? '🎮 تمارين' : t === 'assessments' ? '📊 تقييم' : '📝 سجل'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tab === 'exercises' && (() => {
              const allCategories = ['الكل', ...Array.from(new Set(EXERCISES.map(e => e.category)))]
              const filtered = categoryFilter === 'الكل'
                ? sortedExercises
                : sortedExercises.filter(e => e.category === categoryFilter)
              return (
                <>
                  {/* Category filter chips */}
                  <div className="flex flex-wrap gap-1 pb-1">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                          categoryFilter === cat
                            ? 'bg-brand-600 text-white'
                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {filtered.map((ex, idx) => {
                    const isTop = topGames.includes(ex.id)
                    const isActive = activeView?.type === 'exercise' && activeView.id === ex.id
                    const isFirst = categoryFilter === 'الكل' && topGames.length > 0 && idx === 0
                    const ageOk = studentAge >= (ex.ageMin ?? 5) && studentAge <= (ex.ageMax ?? 22)
                    return (
                      <div key={ex.id}>
                        {isFirst && (
                          <div className="text-[10px] font-black text-brand-400 px-1 pb-1 flex items-center gap-1">
                            <Star className="w-3 h-3" /> موصى بها لهذا الطالب
                          </div>
                        )}
                        {categoryFilter === 'الكل' && !isTop && idx === topGames.length && topGames.length > 0 && (
                          <div className="border-t border-white/10 my-1" />
                        )}
                        <button
                          onClick={() => {
                            if (!running) startSession()
                            setActiveView({ type: 'exercise', id: ex.id })
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all
                            ${ex.color} hover:scale-[1.02]
                            ${isActive ? 'scale-[1.02] ring-1 ring-white/30' : ''}
                            ${isTop ? 'ring-1 ring-brand-400/50' : ''}
                            ${!ageOk ? 'opacity-40' : ''}
                          `}>
                          <span className="text-xl">{ex.icon}</span>
                          <div className="text-right flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="text-white font-bold text-xs truncate">{ex.labelAr}</div>
                              {isTop && <Star className="w-3 h-3 text-brand-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-white/40 text-[10px]">{ex.category}</span>
                              <span className="text-white/25 text-[9px] ltr-num">{ex.ageMin}-{ex.ageMax}س</span>
                              {(gameUsageCounts[ex.id] ?? 0) > 0 && (
                                <span className="text-[9px] bg-white/10 text-white/40 px-1 py-0.5 rounded-full font-bold ltr-num">
                                  ×{gameUsageCounts[ex.id]} مرة
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </>
              )
            })()}

            {tab === 'assessments' && (
              <div className="space-y-2">
                {SESSION_TYPE_CFG[appointmentType]?.isAssessment && (
                  <div className="bg-amber-900/30 border border-amber-500/40 rounded-xl p-3">
                    <p className="text-amber-300 text-xs font-black flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> جلسة تقييمية
                    </p>
                    <p className="text-amber-300/70 text-[10px] mt-1 leading-relaxed">
                      ابدأ بتطبيق المقاييس أدناه لتوثيق الحالة، ثم انتقل للتمارين بعد الانتهاء.
                    </p>
                  </div>
                )}
                {ASSESSMENTS.map(as => (
                  <button key={as.id}
                    onClick={() => setActiveView({ type: 'assessment', id: as.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${as.color} hover:scale-[1.02]`}>
                    <span className="text-2xl">{as.icon}</span>
                    <div className="text-white font-bold text-sm">{as.labelAr}</div>
                  </button>
                ))}

                {/* Observation ratings */}
                <div className="mt-4 bg-white/5 rounded-xl p-3">
                  <h3 className="font-black text-white/70 text-xs mb-3">ملاحظات الجلسة</h3>
                  {(Object.keys(observations) as (keyof SessionObservations)[]).map(key => (
                    <div key={key} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex gap-1">
                          {([1,2,3,4,5] as const).map(v => (
                            <button key={v}
                              onClick={() => setObservations(o => ({ ...o, [key]: v }))}
                              className={`w-5 h-5 rounded text-xs font-bold transition-colors ${
                                observations[key] >= v ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/30'
                              }`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        <span className="text-white/50 text-xs">{observationLabels[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'log' && (
              <div className="space-y-2">
                {results.length === 0 && assessments.length === 0 && obsLog.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">لم تبدأ أي نشاط بعد</p>
                )}

                {/* Observation log entries */}
                {obsLog.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-wider">ملاحظات فورية</span>
                      <span className="text-white/30 text-[10px]">{obsLog.length} ملاحظة</span>
                    </div>
                    <div className="space-y-1.5">
                      {obsLog.map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          <span className="text-white/80 text-xs flex-1">{e.text}</span>
                          <span className="text-white/30 text-[10px] font-mono ltr-num flex-shrink-0">{e.ts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session summary header when results exist */}
                {results.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 mb-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-wider">ملخص الجلسة</span>
                      <span className="text-white/40 text-[10px]">{results.length} تمارين</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 text-center">
                        <div className={`font-black text-lg ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {avgScore}%
                        </div>
                        <div className="text-white/30 text-[10px]">متوسط</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-black text-lg text-brand-400">
                          {results.filter(r => r.score >= 80).length}
                        </div>
                        <div className="text-white/30 text-[10px]">ممتاز</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-black text-lg text-amber-400">{formatTime(elapsed)}</div>
                        <div className="text-white/30 text-[10px]">المدة</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per-game results — enhanced */}
                {results.map((r, i) => {
                  const exInfo = EXERCISES.find(e => e.id === r.exerciseType)
                  return (
                    <div key={i} className="bg-white/5 hover:bg-white/8 rounded-xl p-3 transition-colors">
                      {/* Game name + icon row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{exInfo?.icon ?? '🎮'}</span>
                          <span className="text-white/80 text-xs font-bold truncate">{r.exerciseLabelAr}</span>
                        </div>
                        {/* Colored score pill */}
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                          r.score >= 80
                            ? 'bg-[#ECFDF5] text-emerald-700'
                            : r.score >= 60
                            ? 'bg-[#FFFBEB] text-amber-700'
                            : 'bg-[#FEF2F2] text-red-600'
                        }`}>
                          {r.score}%
                        </span>
                      </div>
                      {/* Score bar */}
                      <ScoreBar
                        score={r.score}
                        color={r.score >= 80 ? 'bg-emerald-500' : r.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}
                      />
                      {/* Accuracy + duration */}
                      <div className="flex justify-between mt-1.5">
                        <span className="text-white/30 text-[10px]">{r.duration}ث</span>
                        <span className="text-white/30 text-[10px]">دقة: {r.accuracy}%</span>
                      </div>
                    </div>
                  )
                })}

                {assessments.map((a, i) => (
                  <div key={i} className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        a.severity === 'none' ? 'bg-green-900/50 text-green-400' :
                        a.severity === 'mild' ? 'bg-amber-900/50 text-amber-400' :
                        a.severity === 'moderate' ? 'bg-orange-900/50 text-orange-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {a.severity === 'none' ? 'طبيعي' : a.severity === 'mild' ? 'خفيف' : a.severity === 'moderate' ? 'متوسط' : 'شديد'}
                      </span>
                      <span className="text-white/70 text-xs font-bold">
                        {a.type === 'adhd' ? 'تقييم ADHD' : 'صعوبات التعلم'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-3 border-t border-white/10">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات المعالج..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-500"
              rows={3}
              dir="rtl"
            />
          </div>
        </aside>}

        {/* Kid Mode — full-screen friendly game grid */}
        {kidMode && (
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: 'linear-gradient(160deg, #FFF0FA 0%, #EEF0FF 35%, #F0FFF8 70%, #FFFBF0 100%)',
            }}
          >
            <div className="max-w-2xl mx-auto px-4 py-6">

              {/* ── Greeting header ── */}
              <div className="text-center mb-7">
                <div className="relative inline-block">
                  <div
                    className="text-8xl leading-none select-none"
                    style={{ filter: 'drop-shadow(0 6px 12px rgba(124,92,252,0.25))' }}
                  >
                    {studentName ? '😊' : '🌟'}
                  </div>
                  {/* Floating sparkles */}
                  <div className="absolute -top-2 -right-3 text-2xl animate-bounce" style={{animationDelay:'0.1s'}}>✨</div>
                  <div className="absolute -top-1 -left-4 text-xl animate-bounce" style={{animationDelay:'0.4s'}}>⭐</div>
                </div>
                <h1 className="font-black text-4xl text-gray-800 mt-3 leading-tight">
                  {studentName
                    ? `مرحباً ${studentName.split(' ')[0]}! 👋`
                    : 'مرحباً بك! 👋'}
                </h1>
                <p className="text-gray-400 text-lg mt-1 font-medium">اختر لعبتك اليوم</p>

                {/* Mini progress strip */}
                {results.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {results.map((r, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full shadow-sm ${
                          r.score >= 80 ? 'bg-emerald-400' :
                          r.score >= 60 ? 'bg-amber-400' : 'bg-red-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Top 3 recommended games — large hero cards ── */}
              {topGames.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-base">⭐</span>
                    <p className="text-gray-400 text-xs font-black tracking-widest uppercase">الألعاب المناسبة لك</p>
                    <span className="text-base">⭐</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {sortedExercises.slice(0, 3).map((ex, idx) => {
                      const CARD_GRADIENTS = [
                        'from-[#7C5CFC] to-[#9A7BFD]',
                        'from-[#FF8C65] to-[#FFBA44]',
                        'from-[#2ABFA3] to-[#3B9EFF]',
                      ]
                      const CARD_SHADOWS = [
                        '0 12px 32px -4px rgba(124,92,252,0.35)',
                        '0 12px 32px -4px rgba(255,140,101,0.35)',
                        '0 12px 32px -4px rgba(42,191,163,0.35)',
                      ]
                      return (
                        <button
                          key={ex.id}
                          onClick={() => {
                            if (!running) startSession()
                            setActiveView({ type: 'exercise', id: ex.id })
                            setKidMode(false)
                          }}
                          className={`bg-gradient-to-l ${CARD_GRADIENTS[idx]} rounded-3xl p-5 flex items-center gap-5 text-right
                            active:scale-[0.97] transition-all duration-200 w-full select-none`}
                          style={{ boxShadow: CARD_SHADOWS[idx] }}
                        >
                          <div
                            className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0"
                            style={{ fontSize: '3rem' }}
                          >
                            {ex.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-black text-2xl leading-tight">{ex.labelAr}</div>
                            <div className="text-white/70 text-sm mt-1">{ex.category}</div>
                            {(gameUsageCounts[ex.id] ?? 0) > 0 && (
                              <div className="text-white/60 text-xs mt-1 font-medium ltr-num">
                                لعبتها {gameUsageCounts[ex.id]} مرة ✓
                              </div>
                            )}
                          </div>
                          <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-2xl font-black">←</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── All other games — 2-column colorful grid ── */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs font-black text-center mb-3 tracking-widest uppercase">
                  كل الألعاب
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {sortedExercises.slice(topGames.length > 0 ? 3 : 0).map((ex, idx) => {
                    const GRID_COLORS = [
                      { bg: '#FFF0FA', border: '#F0BBFF', text: '#7C5CFC' },
                      { bg: '#FFF5EC', border: '#FFCFAC', text: '#E8702A' },
                      { bg: '#F0FDFA', border: '#99F0E6', text: '#0EA58A' },
                      { bg: '#FFFBF0', border: '#FFE5A0', text: '#C47F00' },
                      { bg: '#F0F4FF', border: '#B5C6FF', text: '#3B5EDB' },
                      { bg: '#FFF0F0', border: '#FFBBBB', text: '#D03A3A' },
                      { bg: '#F5FFF0', border: '#BBFFCC', text: '#1D9B3E' },
                      { bg: '#FFF8F0', border: '#FFD4A8', text: '#C45C00' },
                      { bg: '#F0FAFF', border: '#A8DEFF', text: '#0070B0' },
                    ]
                    const c = GRID_COLORS[idx % GRID_COLORS.length]
                    return (
                      <button
                        key={ex.id}
                        onClick={() => {
                          if (!running) startSession()
                          setActiveView({ type: 'exercise', id: ex.id })
                          setKidMode(false)
                        }}
                        className="rounded-3xl p-4 text-center active:scale-95 transition-all duration-150 select-none w-full"
                        style={{
                          background: c.bg,
                          border: `2px solid ${c.border}`,
                          boxShadow: `0 4px 16px -4px ${c.border}`,
                        }}
                      >
                        <div className="text-5xl mb-2 leading-none">{ex.icon}</div>
                        <div className="font-black text-sm leading-tight" style={{ color: c.text }}>
                          {ex.labelAr}
                        </div>
                        {(gameUsageCounts[ex.id] ?? 0) > 0 && (
                          <div className="text-[10px] mt-1 font-medium opacity-60 ltr-num" style={{ color: c.text }}>
                            ×{gameUsageCounts[ex.id]}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Exit button ── */}
              <div className="text-center py-4">
                <button
                  onClick={() => { setKidMode(false); setShowCelebration(false) }}
                  className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors px-4 py-2 rounded-xl hover:bg-white/50"
                >
                  ← وضع الأستاذ
                </button>
              </div>

            </div>

            {/* ── Celebration overlay — shown when all top games are completed ── */}
            {showCelebration && (
              <div
                className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #FFF0FA 0%, #EEF0FF 35%, #F0FFF8 70%, #FFFBF0 100%)' }}
              >
                {/* CSS Confetti — 20 colored dots */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full animate-bounce"
                      style={{
                        width: `${8 + (i % 4) * 4}px`,
                        height: `${8 + (i % 4) * 4}px`,
                        left: `${(i * 5.3) % 100}%`,
                        top: `-20px`,
                        backgroundColor: ['#7C5CFC', '#FF8C65', '#2ABFA3', '#FFBA44', '#FF6B6B', '#3B9EFF'][i % 6],
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Trophy emoji */}
                <div
                  className="text-8xl mb-4"
                  style={{ filter: 'drop-shadow(0 8px 16px rgba(124,92,252,0.3))', animation: 'bounce 1s ease-in-out infinite' }}
                >
                  🏆
                </div>

                {/* Congratulations text */}
                <h1 className="font-black text-4xl text-gray-800 mb-2">أحسنت! 🎉</h1>
                <p className="text-gray-500 text-lg mb-8">أنهيت جلسة اليوم بنجاح</p>

                {/* Per-game score cards */}
                <div className="flex gap-3 mb-8 flex-wrap justify-center px-4">
                  {results.slice(-topGames.length).map((r, i) => {
                    const colors = [
                      { bg: 'from-[#7C5CFC] to-[#9A7BFD]' },
                      { bg: 'from-[#FF8C65] to-[#FFBA44]' },
                      { bg: 'from-[#2ABFA3] to-[#3B9EFF]' },
                    ]
                    return (
                      <div
                        key={i}
                        className={`bg-gradient-to-br ${colors[i % 3].bg} rounded-2xl p-4 text-white text-center w-28 shadow-lg`}
                      >
                        <div className="text-2xl mb-1">
                          {r.score >= 80 ? '⭐' : r.score >= 60 ? '👍' : '💪'}
                        </div>
                        <div className="font-black text-2xl ltr-num">{r.score}%</div>
                        <div className="text-white/80 text-xs mt-0.5 truncate">{r.exerciseLabelAr}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Stars earned based on average score */}
                <div className="flex gap-1 mb-8">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const avgScoreCelebration = results.length
                      ? results.reduce((s, r) => s + r.score, 0) / results.length
                      : 0
                    const filled = i < (avgScoreCelebration >= 80 ? 3 : avgScoreCelebration >= 60 ? 2 : 1)
                    return (
                      <span key={i} className={`text-4xl transition-all ${filled ? 'text-amber-400' : 'text-gray-200'}`}>
                        ★
                      </span>
                    )
                  })}
                </div>

                {/* Exit to professor mode */}
                <button
                  onClick={() => { setShowCelebration(false); setKidMode(false) }}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-black px-8 py-3 rounded-2xl text-lg transition-all hover:-translate-y-1 shadow-brand"
                >
                  ← وضع الأستاذ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main exercise area */}

        <main className={`flex-1 flex items-center justify-center bg-gray-950 relative overflow-auto ${kidMode ? 'hidden' : ''}`}>

          {/* ── Embedded Jitsi iframe ── */}
          {jitsiEmbedded && jitsiEmbedUrl && (
            <div
              className="rounded-2xl overflow-hidden"
              style={
                activeView
                  ? {
                      position: 'fixed',
                      bottom: 20,
                      left: 20,
                      width: 280,
                      height: 210,
                      zIndex: 60,
                      boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
                      border: '2px solid rgba(255,255,255,0.15)',
                      borderRadius: 16,
                    }
                  : {
                      position: 'absolute',
                      inset: 0,
                      zIndex: 10,
                      borderRadius: 0,
                    }
              }
            >
              <iframe
                src={jitsiEmbedUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                allow="camera *; microphone *; display-capture *; fullscreen *"
                allowFullScreen
              />
              {activeView && (
                <button
                  onClick={() => setJitsiEmbedded(false)}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white font-bold text-xs px-2 py-1 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Start screen — hidden when Jitsi is embedded */}
          {!jitsiEmbedded && !activeView && !running && (
            <div className="text-center">
              <div className="text-8xl mb-6">🎯</div>
              <h2 className="text-2xl font-black text-white mb-3">جاهز للجلسة؟</h2>
              <p className="text-white/40 mb-8">اضغط &quot;ابدأ الجلسة&quot; لتفعيل التمارين</p>
              <button onClick={startSession}
                className="bg-green-600 hover:bg-green-500 text-white font-black px-10 py-4 rounded-2xl text-lg transition-colors">
                ▶ ابدأ الجلسة
              </button>
            </div>
          )}

          {/* Idle screen — hidden when Jitsi is embedded */}
          {!jitsiEmbedded && !activeView && running && (
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-white/40">اختر تمريناً من القائمة الجانبية</p>
              {results.length > 0 && (
                <div className="mt-8 bg-white/5 rounded-2xl p-6 max-w-sm mx-auto">
                  <h3 className="font-black text-white mb-4">ملخص الجلسة</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-black text-brand-400">{results.length}</div>
                      <div className="text-xs text-white/40">تمارين</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-green-400">{avgScore}%</div>
                      <div className="text-xs text-white/40">متوسط</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400">{formatTime(elapsed)}</div>
                      <div className="text-xs text-white/40">مدة</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView?.type === 'exercise' && (
            <div className="w-full max-w-2xl mx-auto py-6">
              {activeView.id === 'memory-cards'    && <MemoryCards onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'sequence-memory' && <SequenceMemory onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'n-back'          && <NBackTask onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'word-recall'     && <WordRecall onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'breathing'       && <BreathingGuide onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'tap-target'      && <TapTarget onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'simon-says'      && <SimonSays onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'letter-match'    && <LetterMatch    onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'reaction-game'  && <ReactionGame   onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'stroop-test'    && <StroopTest     onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'stop-signal'    && <StopSignal     onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'emotion-cards'     && <EmotionCards      onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'token-board'       && <TokenBoard        onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'self-rating'       && <SelfRating        onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'verbal-fluency'    && <VerbalFluency     onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'social-scenarios'  && <SocialScenarios   onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'behavior-contract' && <BehaviorContract  onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'color-grid'       && <ColorGrid         onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'pattern-match'    && <PatternMatch      onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
              {activeView.id === 'word-builder'     && <WordBuilder       onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
            </div>
          )}

          {/* ── Whiteboard ── */}
          {showWhiteboard && !activeView && (
            <div className="absolute inset-0 z-20 flex flex-col">
              <Whiteboard onClose={() => setShowWhiteboard(false)} />
            </div>
          )}

          {activeView?.type === 'assessment' && (
            <div className="w-full max-w-2xl mx-auto py-6 px-4">
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                {activeView.id === 'adhd' && (
                  <ADHDScale
                    studentId={currentStudentId || id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={() => setActiveView(null)}
                  />
                )}
                {activeView.id === 'attention-domains' && (
                  <AttentionDomainsScale
                    studentId={currentStudentId || id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={() => setActiveView(null)}
                  />
                )}
                {activeView.id === 'learning-difficulties' && (
                  <LearningDifficultiesScale
                    studentId={currentStudentId || id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={() => setActiveView(null)}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Focus Mode floating quick-launch panel */}
      {focusMode && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
          <div className="bg-gray-900/95 rounded-2xl p-3 border border-white/10 shadow-2xl max-h-64 overflow-y-auto w-56">
            <p className="text-white/40 text-[10px] font-black mb-2 text-center">اختر لعبة</p>
            {sortedExercises.slice(0, 6).map(ex => (
              <button key={ex.id}
                onClick={() => { if (!running) startSession(); setActiveView({ type: 'exercise', id: ex.id }) }}
                className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors text-right">
                <span className="text-lg">{ex.icon}</span>
                <span className="text-white text-xs font-bold truncate">{ex.labelAr}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setFocusMode(false)}
            className="bg-gray-800 text-white/50 text-xs py-2 rounded-xl hover:bg-gray-700 transition-colors">
            خروج من وضع التركيز
          </button>
        </div>
      )}

      {/* ── Quick Observation Panel ── */}
      {running && (
        <div
          className="fixed z-[80]"
          style={{ bottom: 24, right: focusMode ? 24 : 288, transition: 'right 0.3s' }}
          dir="rtl"
        >
          {/* Expanded panel */}
          {obsOpen && (
            <div
              className="mb-2 rounded-2xl p-3 w-72"
              style={{
                background: '#111827',
                border: '1.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-black text-xs">📝 ملاحظة فورية</span>
                <button
                  onClick={() => setObsOpen(false)}
                  className="text-white/40 hover:text-white text-lg leading-none"
                >×</button>
              </div>
              <div className="space-y-2">
                {QUICK_OBS.map(cat => (
                  <div key={cat.category}>
                    <div className="text-[10px] font-black mb-1.5 px-1" style={{ color: cat.color }}>
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {cat.items.map(item => (
                        <button
                          key={item.text}
                          onClick={() => logObs(item.text, cat.category, cat.color)}
                          className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all active:scale-95 hover:ring-1"
                          style={{
                            background: cat.bg,
                            border: `1px solid ${cat.color}33`,
                          }}
                        >
                          <span className="text-lg leading-none">{item.icon}</span>
                          <span className="text-[9px] font-bold text-white/70 leading-tight text-center">{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 text-center">
                <span className="text-white/25 text-[9px]">الوقت الحالي في الجلسة: {formatTime(elapsed)}</span>
              </div>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setObsOpen(o => !o)}
            className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
            style={obsOpen
              ? { background: '#374151', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }
              : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
            }
          >
            📝
            <span>ملاحظة</span>
            {obsLog.length > 0 && (
              <span
                className="font-black text-[10px] px-1.5 py-0.5 rounded-full ltr-num"
                style={{ background: '#7C5CFC', color: '#FFFFFF' }}
              >
                {obsLog.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Observation Toast */}
      {obsToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-none" dir="rtl">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{
              background: '#1F2937',
              border: `1.5px solid ${obsToast.color}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${obsToast.color}22`,
            }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: obsToast.color }} />
            <span className="text-white font-bold text-sm">{obsToast.text}</span>
            <span className="text-white/40 text-xs font-mono ltr-num">{obsToast.ts}</span>
          </div>
        </div>
      )}

      {/* Phase Transition Toast */}
      {phaseToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none" dir="rtl">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{
              background: '#1F2937',
              border: `1.5px solid ${phaseToast.color}50`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${phaseToast.color}20`,
            }}
          >
            <span className="text-2xl">{phaseToast.icon}</span>
            <div>
              <div className="text-white font-black text-sm">مرحلة جديدة: {phaseToast.label}</div>
              <div className="text-white/50 text-xs ltr-num">{phaseDurations[phaseIdx]} دقيقة</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Toast */}
      {achievementToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="bg-gray-900 border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl animate-[slideInDown_0.3s_ease-out]">
            <span className="text-3xl animate-bounce">{achievementToast.icon}</span>
            <div>
              <p className="text-white font-black text-base">{achievementToast.message}</p>
              <p className="text-white/50 text-xs">إنجاز رائع!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
