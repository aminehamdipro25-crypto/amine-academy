'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, Star, ClipboardList, Gamepad2, BarChart3, BookOpen, Play, Youtube, ExternalLink, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import type { ExerciseResult, AssessmentResult, SessionObservations } from '@/lib/types'
import { rankGamesForStudent, getTopGames, DIFFICULTY_LABELS_AR } from '@/lib/game-mapping'
import type { StudentAssessmentProfile } from '@/lib/types'
import ProgressMap from '@/components/progress/ProgressMap'
import type { SessionNode } from '@/components/progress/ProgressMap'

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
import AuditoryMemory        from '@/components/session/exercises/AuditoryMemory'
import ListeningComprehension from '@/components/session/exercises/ListeningComprehension'
import PictureWordCards       from '@/components/session/exercises/PictureWordCards'
import NumberSequence         from '@/components/session/exercises/NumberSequence'
import ShadowMatch            from '@/components/session/exercises/ShadowMatch'
import StorySequencing        from '@/components/session/exercises/StorySequencing'
import WaitingGame            from '@/components/session/exercises/WaitingGame'
import SocialProblemSolving   from '@/components/session/exercises/SocialProblemSolving'
import VisualSearch          from '@/components/session/exercises/VisualSearch'
import OddOneOut             from '@/components/session/exercises/OddOneOut'
import SustainedAttention    from '@/components/session/exercises/SustainedAttention'
import FlashCount            from '@/components/session/exercises/FlashCount'
import NumberSearch          from '@/components/session/exercises/NumberSearch'
import GoNoGo                from '@/components/session/exercises/GoNoGo'
import BalloonControl        from '@/components/session/exercises/BalloonControl'
import TrafficLight          from '@/components/session/exercises/TrafficLight'
import EmotionMirror         from '@/components/session/exercises/EmotionMirror'
import ConversationStarter   from '@/components/session/exercises/ConversationStarter'
import SoundDiscrimination   from '@/components/session/exercises/SoundDiscrimination'
import RhymeDetection        from '@/components/session/exercises/RhymeDetection'
import AudioSequenceRepeat   from '@/components/session/exercises/AudioSequenceRepeat'
import SequenceTap           from '@/components/session/exercises/SequenceTap'
import TargetTracking        from '@/components/session/exercises/TargetTracking'
import FingerGym             from '@/components/session/exercises/FingerGym'
import CategorySort          from '@/components/session/exercises/CategorySort'
import MathFlash             from '@/components/session/exercises/MathFlash'
import AnalogiesGame         from '@/components/session/exercises/AnalogiesGame'
import BodyScan             from '@/components/session/exercises/BodyScan'
import MoodMeter            from '@/components/session/exercises/MoodMeter'
import CalmCorner           from '@/components/session/exercises/CalmCorner'
import EmotionVolume        from '@/components/session/exercises/EmotionVolume'
import DailyGoals           from '@/components/session/exercises/DailyGoals'
import ChoiceBoard          from '@/components/session/exercises/ChoiceBoard'
import PatternPuzzle        from '@/components/session/exercises/PatternPuzzle'
import IfThen               from '@/components/session/exercises/IfThen'
import ProblemSolver        from '@/components/session/exercises/ProblemSolver'
import SpellingBee          from '@/components/session/exercises/SpellingBee'
import ReadingCards         from '@/components/session/exercises/ReadingCards'
import SpanExtension        from '@/components/session/exercises/SpanExtension'
import DirectionFollow      from '@/components/session/exercises/DirectionFollow'
import LogicSort            from '@/components/session/exercises/LogicSort'
import PhysicalExercise from '@/components/session/exercises/PhysicalExercise'
import VisualMatch      from '@/components/session/exercises/VisualMatch'
import VisualSchedule   from '@/components/session/exercises/VisualSchedule'
import FirstThenBoard   from '@/components/session/exercises/FirstThenBoard'
import ImitationMirror  from '@/components/session/exercises/ImitationMirror'
import SensoryCheckIn   from '@/components/session/exercises/SensoryCheckIn'
import Whiteboard      from '@/components/session/Whiteboard'
import StudentTimerDisplay from '@/components/session/StudentTimerDisplay'
import SessionHeader   from '@/components/session/SessionHeader'
import SessionToolbar   from '@/components/session/SessionToolbar'
import SessionPhaseBar  from '@/components/session/SessionPhaseBar'
import PhaseDurationModal from '@/components/session/PhaseDurationModal'
import ExerciseConfigModal from '@/components/session/ExerciseConfigModal'
import VideoLibraryModal from '@/components/session/VideoLibraryModal'
import AbcLogPanel from '@/components/session/AbcLogPanel'
import HomeworkPanel from '@/components/session/HomeworkPanel'
import QuickObsPanel from '@/components/session/QuickObsPanel'
import LiveSessionCard from '@/components/session/LiveSessionCard'
import SessionStarCounter from '@/components/session/SessionStarCounter'
import { computeAdaptiveDecision } from '@/lib/session-adaptive'
import ADHDScale       from '@/components/session/assessments/ADHDScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'
import AttentionDomainsScale from '@/components/session/assessments/AttentionDomainsScale'
import {
  CHROME_PREF_KEY,
  type ActiveView,
  type ObsEntry,
  type ABCEntry,
  PROMPT_CARDS,
  type SessionPhase,
  SESSION_PHASES,
  EXERCISES,
  SELF_CLOSING_RESULTS,
  VIDEO_LIBRARY,
  ASSESSMENTS,
  SESSION_TYPE_CFG,
  DIAG_LABELS,
  SEVERITY_LABELS,
} from '@/lib/session-constants'
import {
  extractYoutubeId,
  formatTime,
  type SoundType,
  playSound,
  ScoreBar,
} from '@/lib/session-helpers'

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
  const [saveFailed, setSaveFailed] = useState(false)
  const [assessmentSaveFailed, setAssessmentSaveFailed] = useState(false)
  const [studentAge, setStudentAge] = useState(8)
  const [studentName, setStudentName] = useState('')
  const [observations, setObservations] = useState<SessionObservations>({
    attention:3, cooperation:3, energy:3, mood:3, anxiety:3,
  })
  const [tab, setTab] = useState<'exercises'|'assessments'|'log'|'videos'|'map'>('exercises')
  const [sidebarMapSessions, setSidebarMapSessions] = useState<SessionNode[] | null>(null)
  const [sidebarMapLoading, setSidebarMapLoading] = useState(false)
  const [mapTabFlash, setMapTabFlash] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [videoModal, setVideoModal] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  // Friendly loading state for the video embed — true from the moment a video
  // ID is chosen until the YouTube iframe actually fires its load event, so
  // the modal shows a spinner instead of an abrupt black/blank frame.
  const [videoIframeLoading, setVideoIframeLoading] = useState(false)
  useEffect(() => { if (videoModal) setVideoIframeLoading(true) }, [videoModal])
  const [categoryFilter, setCategoryFilter] = useState<string>('الكل')
  const [obsLog, setObsLog] = useState<ObsEntry[]>([])
  const [obsOpen, setObsOpen] = useState(false)
  const [obsToast, setObsToast] = useState<ObsEntry | null>(null)
  const obsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [profile, setProfile] = useState<StudentAssessmentProfile | null>(null)
  const [kidMode, setKidMode] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMap, setCelebrationMap] = useState<SessionNode[] | null>(null)
  // Light, ~1s star-burst shown between exercises (distinct from the big
  // showCelebration overlay, which only fires once all Kid Mode games are
  // done). pointer-events-none so it never blocks the next interaction.
  const [miniCelebrate, setMiniCelebrate] = useState(false)
  const miniCelebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [achievementToast, setAchievementToast] = useState<{ icon: string; message: string } | null>(null)
  const achievementToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Adaptive difficulty toast — shown when engine auto-adjusts a level
  const [adaptiveToast, setAdaptiveToast] = useState<{
    label: string; oldLevel: 1|2|3; newLevel: 1|2|3; reason: 'excellent'|'struggling'; exerciseId: string
  } | null>(null)
  const adaptiveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const phaseBarRef = useRef<HTMLDivElement>(null)
  const [toastTop, setToastTop] = useState(96)
  const [focusMode, setFocusMode] = useState(false)
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null)
  const [currentStudentId, setCurrentStudentId] = useState<string>('')
  const [appointmentType, setAppointmentType] = useState<string>('')
  const [studentDiagnosis, setStudentDiagnosis] = useState<string>('')
  const [studentSeverity, setStudentSeverity] = useState<number>(1)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [gameUsageCounts, setGameUsageCounts] = useState<Record<string, number>>({})
  const [gameHistoryByGame, setGameHistoryByGame] = useState<Record<string, { plays: number; avgScore: number }>>({})

  // Session phases
  const [phaseIdx, setPhaseIdx]         = useState(0)
  const [phaseToast, setPhaseToast]     = useState<SessionPhase | null>(null)
  const phaseToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phaseDurations, setPhaseDurations] = useState<number[]>(SESSION_PHASES.map(p => p.defaultMin))
  const [showPhaseEdit, setShowPhaseEdit] = useState(false)
  const [exerciseConfigId, setExerciseConfigId] = useState<string | null>(null)
  const [exerciseDiffOverrides, setExerciseDiffOverrides] = useState<Partial<Record<string, 1|2|3>>>({})

  // Profile card
  const [profileOpen, setProfileOpen]   = useState(false)
  const [pastSessions, setPastSessions] = useState<{ score: number; date: string; count: number }[]>([])

  // Whiteboard
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  // ABC Behavior Log
  const [abcLog, setAbcLog]   = useState<ABCEntry[]>([])
  const [abcOpen, setAbcOpen] = useState(false)
  const [abcForm, setAbcForm] = useState<{ antecedent: string; behavior: string; consequence: string; intensity: 1|2|3 }>({
    antecedent: '', behavior: '', consequence: '', intensity: 2,
  })

  // Prompt Cards
  const [promptCard, setPromptCard]               = useState<typeof PROMPT_CARDS[0] | null>(null)
  const [promptPickerOpen, setPromptPickerOpen]   = useState(false)

  // Homework Builder
  const [hwOpen, setHwOpen]       = useState(false)
  const [hwSelected, setHwSelected] = useState<string[]>([])
  const [hwNote, setHwNote]       = useState('')
  const [hwSent, setHwSent]       = useState(false)
  const [hwSending, setHwSending] = useState(false)

  // Student Timer (#9)
  const [studentTimerTotal, setStudentTimerTotal]     = useState(120)
  const [studentTimerLeft, setStudentTimerLeft]       = useState(120)
  const [studentTimerRunning, setStudentTimerRunning] = useState(false)
  const [showStudentTimer, setShowStudentTimer]       = useState(false)
  const [timerPickerOpen, setTimerPickerOpen]         = useState(false)

  // Before/After comparison (#10)
  const [compareToast, setCompareToast] = useState<{ prev: ExerciseResult; curr: ExerciseResult } | null>(null)
  const compareToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Session Report (#8)
  const [showReport, setShowReport] = useState(false)

  // Child session lock — hides all chrome, keeps exercise + Jitsi PiP intact
  const [sessionLocked, setSessionLocked] = useState(false)
  const [unlockTaps, setUnlockTaps]       = useState(0)
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual "bigger screen" override — lets the specialist hide/show the chrome
  // (header/toolbar/sidebar) on demand on any screen, not just during exercises.
  // null = follow the automatic rule below; true/false = specialist's explicit choice.
  const [manualChromeOverride, setManualChromeOverride] = useState<boolean | null>(null)
  // The specialist's remembered "I prefer the bigger screen" choice, made when toggling
  // chrome on a plain idle screen (no exercise/whiteboard/focus-mode forcing it either
  // way already). Persisted per-browser so every new session opens already collapsed if
  // that's what they last chose, instead of asking them to re-toggle it every time.
  const [idleChromePreferHidden, setIdleChromePreferHidden] = useState(false)
  useEffect(() => {
    setIdleChromePreferHidden(window.localStorage.getItem(CHROME_PREF_KEY) === '1')
  }, [])
  // Forces a full remount of the active exercise component to restart it mid-game.
  const [exerciseRestartNonce, setExerciseRestartNonce] = useState(0)

  // White noise / focus music
  const [showNoisePanel, setShowNoisePanel] = useState(false)
  const [noiseMode, setNoiseMode]           = useState<'white' | 'rain' | 'focus' | 'calm' | 'theta'>('calm')
  const [noiseRunning, setNoiseRunning]     = useState(false)
  const [noiseSecsLeft, setNoiseSecsLeft]   = useState(5 * 60)
  const noiseCtxRef   = useRef<AudioContext | null>(null)
  const noiseSrcRef   = useRef<AudioBufferSourceNode | null>(null)
  const noiseEnvRef   = useRef<GainNode | null>(null)
  const noiseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Toolbar dropdown anchors (positions for portal-rendered popovers)
  const promptBtnRef = useRef<HTMLDivElement>(null)
  const timerBtnRef  = useRef<HTMLDivElement>(null)
  const noiseBtnRef  = useRef<HTMLDivElement>(null)

  // Pre-session readiness check
  const [readyDone, setReadyDone]     = useState(false)
  const [readySleep, setReadySleep]   = useState(0)
  const [readyEnergy, setReadyEnergy] = useState(0)
  const [readyMood, setReadyMood]     = useState(0)

  // Kiosk exercise queue
  const [exerciseQueue, setExerciseQueue] = useState<string[]>([])
  const [queueActive, setQueueActive]     = useState(false)
  const [queueIndex, setQueueIndex]       = useState(0)
  const [showMobilePanel, setShowMobilePanel] = useState(false)

  // ── Session draft persistence — restore on refresh ──────────
  const draftRestoredRef = useRef(false)

  useEffect(() => {
    const key = `session_draft_${id}`
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return
      const d = JSON.parse(raw) as {
        savedAt: number; elapsed: number; running: boolean
        results: ExerciseResult[]; assessments: AssessmentResult[]
        notes: string; difficulty: 1|2|3; obsLog: ObsEntry[]
        abcLog: ABCEntry[]; phaseIdx: number; phaseDurations: number[]
      }
      if (Date.now() - d.savedAt > 3 * 3600 * 1000) { sessionStorage.removeItem(key); return }
      draftRestoredRef.current = true
      // Resume exactly where the timer was left, never add the real-world
      // wall-clock gap since the last save — otherwise closing the session
      // (or just leaving the tab) and coming back later makes the timer
      // silently jump forward by however long it was closed, instead of
      // reflecting actual time spent in the session.
      setElapsed(d.elapsed || 0)
      setRunning(false)
      setResults(d.results || [])
      setAssessments(d.assessments || [])
      setNotes(d.notes || '')
      setDifficulty(d.difficulty || 1)
      setObsLog(d.obsLog || [])
      setAbcLog(d.abcLog || [])
      setPhaseIdx(d.phaseIdx || 0)
      if (Array.isArray(d.phaseDurations)) setPhaseDurations(d.phaseDurations)
    } catch { /* ignore */ }
  }, [id])

  // Auto-save draft to sessionStorage.
  const [savedFlash, setSavedFlash] = useState(false)
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function persistDraft() {
    const key = `session_draft_${id}`
    const draft = { elapsed, running, results, assessments, notes, difficulty, obsLog, abcLog, phaseIdx, phaseDurations, savedAt: Date.now() }
    try {
      sessionStorage.setItem(key, JSON.stringify(draft))
      setSavedFlash(true)
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current)
      savedFlashTimerRef.current = setTimeout(() => setSavedFlash(false), 1800)
    } catch { /* storage full */ }
  }
  const persistDraftRef = useRef(persistDraft)
  persistDraftRef.current = persistDraft

  // Debounced save (2s of inactivity) — covers edits made while the timer
  // isn't running, e.g. notes/observations logged on a paused session.
  // Deliberately excludes `elapsed` from the deps: while running it ticks
  // every 1s, which is shorter than this 2s debounce, so including it would
  // cancel-and-reschedule the timeout forever and the draft would never
  // actually persist during an active session — exactly the silent-failure
  // this auto-save exists to prevent.
  useEffect(() => {
    if (elapsed === 0 && results.length === 0 && notes === '' && obsLog.length === 0 && abcLog.length === 0) return
    const tid = setTimeout(() => persistDraftRef.current(), 2000)
    return () => clearTimeout(tid)
  }, [running, results, assessments, notes, difficulty, obsLog, abcLog, phaseIdx, phaseDurations, id])

  // Periodic heartbeat save while the timer is running, so progress is never
  // more than a few seconds stale if the tab is closed mid-session.
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => persistDraftRef.current(), 5000)
    return () => clearInterval(iv)
  }, [running, id])

  // Track header + toolbar + phase-bar height so top toasts never overlap them, regardless of how many rows they take
  useEffect(() => {
    const update = () => {
      const h = (headerRef.current?.offsetHeight ?? 0) + (toolbarRef.current?.offsetHeight ?? 0) + (phaseBarRef.current?.offsetHeight ?? 0)
      setToastTop(h > 0 ? h + 16 : 64)
    }
    update()
    const ro = new ResizeObserver(update)
    if (headerRef.current) ro.observe(headerRef.current)
    if (toolbarRef.current) ro.observe(toolbarRef.current)
    if (phaseBarRef.current) ro.observe(phaseBarRef.current)
    return () => ro.disconnect()
  }, [running, sessionLocked])

  // Load appointment/student info + assessment profile + session history
  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then(r => r.json())
      .then(({ appointment }) => {
        if (appointment?.meetingUrl) setJitsiUrl(appointment.meetingUrl)
        if (appointment?.type) {
          setAppointmentType(appointment.type)
          if (appointment.type === 'assessment' && !draftRestoredRef.current) setTab('assessments')
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
                if (!draftRestoredRef.current) setDifficulty(student.severityLevel as 1|2|3)
              }
            }).catch(() => {})

          fetch(`/api/admin/assessment-profile/${sid}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.profile) setProfile(d.profile) })
            .catch(() => {})

          fetch(`/api/admin/game-progress/${sid}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.history?.byGame) setGameHistoryByGame(d.history.byGame) })
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
      playSound('phase')
      if (phaseToastTimerRef.current) clearTimeout(phaseToastTimerRef.current)
      phaseToastTimerRef.current = setTimeout(() => setPhaseToast(null), 3000)
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

  // Student Timer countdown with audio ticks
  useEffect(() => {
    if (!studentTimerRunning || studentTimerLeft <= 0) return
    const t = setTimeout(() => {
      setStudentTimerLeft(l => {
        const next = l - 1
        if (next > 0 && next <= 5) playSound('tick')
        if (next === 0) { playSound('ding'); setStudentTimerRunning(false) }
        return next
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [studentTimerRunning, studentTimerLeft])

  function startSession() {
    setRunning(true)
    startRef.current = Date.now()
    playSound('start')
  }

  const showAchievement = useCallback((icon: string, message: string) => {
    setAchievementToast({ icon, message })
    if (achievementToastTimerRef.current) clearTimeout(achievementToastTimerRef.current)
    achievementToastTimerRef.current = setTimeout(() => setAchievementToast(null), 3500)
  }, [])

  // Fetch the student's progress map when the end-of-session celebration opens
  // so the child sees their real journey, not a placeholder.
  useEffect(() => {
    if (!showCelebration || !currentStudentId) return
    fetch(`/api/admin/students/${currentStudentId}/progress-map`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.sessions) setCelebrationMap(d.sessions) })
      .catch(() => {})
  }, [showCelebration, currentStudentId])

  // useMemo — getTopGames returns a new array every call; without memoizing it,
  // handleExerciseComplete (which depends on topGames) gets recreated every
  // render, which re-triggers every exercise component's onComplete-dependent
  // effects (e.g. BreathingGuide's countdown) on every tick of the page's
  // 1-second elapsed-time timer, freezing them.
  const topGames = useMemo(() => (profile ? getTopGames(profile, 3) : []), [profile])

  function logObs(text: string, category: string, color: string) {
    const now = new Date()
    const ts = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const entry: ObsEntry = { text, category, color, elapsed, ts }
    setObsLog(prev => [...prev, entry])
    setObsOpen(false)
    setObsToast(entry)
    if (obsToastTimerRef.current) clearTimeout(obsToastTimerRef.current)
    obsToastTimerRef.current = setTimeout(() => setObsToast(null), 2500)
  }

  function startStudentTimer(seconds: number) {
    setStudentTimerTotal(seconds)
    setStudentTimerLeft(seconds)
    setStudentTimerRunning(true)
    setShowStudentTimer(true)
    setTimerPickerOpen(false)
  }

  function startNoise() {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      noiseCtxRef.current = ctx

      const masterGain = ctx.createGain()
      // Fade the whole output in from silence instead of jumping straight to
      // the target level — an instant gain step is a broadband click, the
      // main source of "dirty"/harsh sound on start.
      const envGain = ctx.createGain()
      envGain.gain.value = 0
      envGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6)
      masterGain.connect(envGain)
      envGain.connect(ctx.destination)
      noiseEnvRef.current = envGain

      if (noiseMode === 'focus' || noiseMode === 'theta') {
        // Clean binaural beat: two pure sine tones, no noise floor at all,
        // panned hard left/right so the interaural frequency difference is
        // perceived as a single pulsing beat. Needs stereo headphones —
        // amplitude-modulated broadband noise (the old approach) is the
        // harsher, "impure"-sounding way to do this.
        masterGain.gain.value = 0.05
        const beatHz  = noiseMode === 'focus' ? 40 : 6 // gamma vs theta range
        const carrier = 200
        for (const pan of [-1, 1]) {
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = carrier + (pan * beatHz) / 2
          const panner = ctx.createStereoPanner()
          panner.pan.value = pan
          osc.connect(panner)
          panner.connect(masterGain)
          osc.start()
        }
      } else {
        masterGain.gain.value = noiseMode === 'calm' ? 0.045 : 0.09

        const rate = ctx.sampleRate
        const buf  = ctx.createBuffer(1, rate * 3, rate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

        const src = ctx.createBufferSource()
        src.buffer = buf
        src.loop = true
        noiseSrcRef.current = src

        if (noiseMode === 'rain') {
          const lp = ctx.createBiquadFilter()
          lp.type = 'lowpass'
          lp.frequency.value = 800
          src.connect(lp)
          lp.connect(masterGain)
        } else if (noiseMode === 'calm') {
          // Quiet, heavily-filtered noise bed under a slow consonant pad —
          // gentle ambient texture (no sudden hits, no melody) shown to lower
          // heart rate/anxiety in slow ambient-music research.
          const lp = ctx.createBiquadFilter()
          lp.type = 'lowpass'
          lp.frequency.value = 400
          src.connect(lp)
          lp.connect(masterGain)

          // Sustained open chord (A2-E3-A3-C#4), each voice breathing in and
          // out at ~0.1Hz — about 6 cycles/min, matching a relaxed breathing rate.
          const padFreqs = [110, 164.81, 220, 277.18]
          padFreqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            osc.type = 'sine'
            osc.frequency.value = freq
            const oscGain = ctx.createGain()
            const baseLevel = 0.05 / (idx + 1)
            oscGain.gain.value = baseLevel
            osc.connect(oscGain)
            oscGain.connect(masterGain)
            osc.start()

            const breathe = ctx.createOscillator()
            breathe.type = 'sine'
            breathe.frequency.value = 0.1
            const breatheGain = ctx.createGain()
            breatheGain.gain.value = baseLevel * 0.6
            breathe.connect(breatheGain)
            breatheGain.connect(oscGain.gain)
            breathe.start()
          })
        } else {
          src.connect(masterGain)
        }
        src.start()
      }

      setNoiseRunning(true)
      setNoiseSecsLeft(5 * 60)
      const interval = setInterval(() => {
        setNoiseSecsLeft(s => {
          if (s <= 1) { stopNoise(); return 5 * 60 }
          return s - 1
        })
      }, 1000)
      noiseTimerRef.current = interval
    } catch { /* silently ignore if Web Audio unavailable */ }
  }

  function stopNoise() {
    // Capture the live nodes before clearing the refs — a fade-out is
    // scheduled async below, and if the therapist hits start again before
    // it finishes, the refs will already point at a brand-new context.
    // Closing/stopping must act on what THIS call started, not on
    // whatever the refs hold by the time the timeout fires.
    const ctx = noiseCtxRef.current
    const env = noiseEnvRef.current
    const src = noiseSrcRef.current
    if (ctx && env) {
      const now = ctx.currentTime
      env.gain.cancelScheduledValues(now)
      env.gain.setValueAtTime(env.gain.value, now)
      env.gain.linearRampToValueAtTime(0, now + 0.3) // fade-out avoids a stop click
    }
    setTimeout(() => {
      if (src) { try { src.stop() } catch { /* already stopped */ } }
      if (ctx) { ctx.close().catch(() => {}) }
    }, ctx ? 320 : 0)
    noiseSrcRef.current = null
    noiseCtxRef.current = null
    noiseEnvRef.current = null
    if (noiseTimerRef.current) {
      clearInterval(noiseTimerRef.current)
      noiseTimerRef.current = null
    }
    setNoiseRunning(false)
  }

  // Stop the noise/binaural audio engine if the specialist navigates away
  // mid-session — AudioContext playback isn't tied to the component being
  // mounted, so without this the sound keeps playing audibly after leaving
  // the page. Acts on the refs directly (no setState) since this only runs
  // during unmount.
  useEffect(() => {
    return () => {
      if (noiseSrcRef.current) { try { noiseSrcRef.current.stop() } catch { /* already stopped */ } }
      if (noiseCtxRef.current) { noiseCtxRef.current.close().catch(() => {}) }
      if (noiseTimerRef.current) clearInterval(noiseTimerRef.current)
      if (phaseToastTimerRef.current) clearTimeout(phaseToastTimerRef.current)
      if (achievementToastTimerRef.current) clearTimeout(achievementToastTimerRef.current)
      if (obsToastTimerRef.current) clearTimeout(obsToastTimerRef.current)
      if (compareToastTimerRef.current) clearTimeout(compareToastTimerRef.current)
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current)
      if (miniCelebrateTimerRef.current) clearTimeout(miniCelebrateTimerRef.current)
      if (adaptiveToastTimerRef.current) clearTimeout(adaptiveToastTimerRef.current)
    }
  }, [])

  function printSessionReport() {
    const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    const avgScoreVal = results.length
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0

    // ── Per-exercise clinical reference ──
    const EXERCISE_CLINICAL: Record<string, string> = {
      'memory-cards':      'الذاكرة البصرية العاملة والتعرف على الأنماط',
      'sequence-memory':   'ذاكرة التسلسل — Phonological Loop',
      'n-back':            'تحديث المعلومات في الذاكرة العاملة — N-Back paradigm',
      'word-recall':       'استرجاع المفردات والذاكرة الدلالية',
      'auditory-memory':   'الذاكرة السمعية قصيرة المدى',
      'span-extension':    'امتداد الذاكرة — Digit/Word Span',
      'stroop-test':       'الكبح المعرفي وتجاوز الاستجابة الأوتوماتيكية — Stroop Effect',
      'stop-signal':       'زمن ردّ الفعل الكابح — Stop-Signal Reaction Time (SSRT)',
      'simon-says':        'الانتباه الانتقائي والكبح الحركي',
      'tap-target':        'التناسق البصري-الحركي وسرعة المعالجة الحركية',
      'reaction-game':     'زمن ردّ الفعل البسيط — Simple Reaction Time',
      'emotion-cards':     'التعرف على التعبيرات العاطفية — Theory of Mind (أساسي)',
      'emotion-mirror':    'الوعي العاطفي الذاتي ومطابقة التعبيرات — الأساس الأول للتعاطف',
      'social-scenarios':  'التفكير الاجتماعي وحلّ المواقف التفاعلية',
      'conversation-starter': 'بدء الحوار وإدارة الأدوار الاجتماعية',
      'token-board':       'التعزيز الرمزي — Token Economy (تعزيز عملياتي ABA)',
      'behavior-contract': 'التعاقد السلوكي وتحديد الأهداف الوظيفية',
      'self-rating':       'تقييم الذات والوعي الميتامعرفي',
      'breathing':         'تنظيم الجهاز العصبي اللاإرادي عبر التنفس الواعي',
      'body-scan':         'الوعي الجسدي والتنظيم الذاتي الحسي',
      'mood-meter':        'تصنيف شدة المشاعر والوعي الانفعالي — Zones of Regulation',
      'calm-corner':       'استراتيجيات التهدئة الذاتية — Self-Calming Toolkit',
      'verbal-fluency':    'الطلاقة المعجمية وسرعة استرجاع الكلمات',
      'word-builder':      'الوعي الصرفي وبنية الكلمة',
      'letter-match':      'التعرف على الحروف والمطابقة البصرية',
      'spelling-bee':      'الذاكرة الأورثوغرافية والوعي الصوتي المنتج',
      'picture-word-cards':'الربط بين الصورة والمفهوم اللغوي',
      'number-search':     'الانتباه المنتشر والمسح البصري الانتقائي — Cancellation Task',
      'visual-search':     'الانتباه المنتشر وسرعة البحث البصري',
      'sustained-attention': 'الانتباه المستمر — Sustained Vigilance',
      'flash-count':       'الانتباه السريع والإدراك العددي الآني',
      'odd-one-out':       'الاستدلال التصنيفي والمرونة الإدراكية',
      'logic-sort':        'التفكير الاستنتاجي والترتيب المنطقي',
      'category-sort':     'التصنيف المفاهيمي والمرونة المعرفية',
      'pattern-match':     'الاستدلال على الأنماط — Visual-Spatial Reasoning',
      'story-sequencing':  'فهم التسلسل السببي والزمني للأحداث',
      'if-then':           'التفكير الشرطي — Conditional Reasoning',
      'pattern-puzzle':    'الإكمال البصري والتفكير الاستقرائي',
      'math-flash':        'الاسترجاع الحسابي والذاكرة الإجرائية',
      'analogies':         'التفكير القياسي — Analogical Reasoning',
      'number-sequence':   'إدراك الأنماط العددية والتفكير الرياضي',
      'color-grid':        'الانتباه الانتقائي والتصنيف البصري',
      'shadow-match':      'إدراك الشكل والمطابقة الفضائية',
      'direction-follow':  'تنفيذ التعليمات المتعددة والانتباه التنفيذي',
      'sound-discrimination': 'التمييز السمعي الدقيق — Phonemic Awareness',
      'rhyme-detection':   'الوعي الصوتي والقافية — Phonological Awareness',
      'audio-sequence':    'ذاكرة التسلسل السمعي — Auditory Sequential Memory',
      'listening-comprehension': 'الفهم الاستماعي ومعالجة اللغة',
      'sequence-tap':      'التناسق الحركي التسلسلي والتخطيط الحركي',
      'target-tracking':   'التتبع البصري والتنسيق العين-اليد',
      'finger-gym':        'مهارات اليد الدقيقة — Fine Motor Skills',
      'go-no-go':          'الكبح الحركي الثنائي — Go/No-Go Paradigm',
      'balloon-control':   'ضبط الاندفاعية وتنظيم الاستجابة الحركية',
      'waiting-game':      'تأجيل المكافأة وضبط الاندفاعية — Delay of Gratification',
      'traffic-light':     'التنظيم الذاتي بنموذج الإشارة الثلاثية — Self-Regulation',
      'social-problem-solving': 'التفكير في حلول المشكلات الاجتماعية',
      // Autism-specific
      'sensory-checkin':   'مسح الجاهزية الحسية قبل الجلسة — Zones of Regulation',
      'first-then-board':  'التعزيز المشروط ABA — التسلسل السببي والامتثال للمهام',
      'visual-schedule':   'الجدول البصري — التنبؤية والانتقال الروتيني للتوحد',
      'visual-match':      'التمييز البصري والمطابقة غير اللفظية',
      'imitation-mirror':  'التقليد الحركي — التعلم بالملاحظة والتوافق الحسي-حركي',
      'choice-board':      'استقلالية القرار وتقليل سلوك المطالبة غير اللفظية',
    }

    // ── Per-exercise evidence-based recommendations ──
    const EXERCISE_RECS: Record<string, { threshold: number; low: string; mid?: string }> = {
      'sensory-checkin':   { threshold: 75, low: 'أشار الفحص الحسي لتحديات تنظيمية. يُوصى بإدراج 3-5 دقائق تنظيم حسي (تنفس عميق + ضغط عضلي مفاصل) في بداية كل جلسة قادمة قبل أي مهمة معرفية.', mid: 'جاهزية حسية متوسطة. راقب إشارات الإجهاد الحسي خلال الجلسة وأتح فترات استراحة حركية قصيرة.' },
      'first-then-board':  { threshold: 75, low: 'صعوبة في التسلسل الشرطي. قلّص مهمة "أولاً" لخطوة واحدة فقط وطبّق التسلسل الأمامي (Forward Chaining) مع تعزيز فوري لكل خطوة مكتملة.', mid: 'أداء مقبول في بنية ABA. زد تعقيد مهمة "أولاً" تدريجياً وانتقل لبطاقات ثنائية المرحلة.' },
      'visual-schedule':   { threshold: 75, low: 'صعوبة في قراءة الجدول البصري. استخدم صور فوتوغرافية حقيقية بدلاً من الرسوم التوضيحية، وعلّق الجدول في مستوى نظر الطفل طوال اليوم.' },
      'visual-match':      { threshold: 70, low: 'ضعف في التمييز البصري. قلّص عدد البدائل إلى 3 بطاقات فقط، وكبّر حجم الصور مع تقليل الفوضى البصرية في بيئة الجلسة.' },
      'imitation-mirror':  { threshold: 70, low: 'صعوبة في التقليد الحركي. ابدأ بحركات جسدية كبرى (رفع اليدين، الوقوف/الجلوس) قبل الانتقال للحركات الدقيقة أو تعبيرات الوجه.' },
      'waiting-game':      { threshold: 75, low: 'عجز في تأجيل المكافأة. قلّص مدة الانتظار إلى 10 ثوانٍ فقط، عزّز كل انتظار ناجح فوراً ومحسوساً، وزد المدة تدريجياً بخطوات 5 ثوانٍ.' },
      'emotion-cards':     { threshold: 75, low: 'صعوبة في التعرف على المشاعر. ابدأ بأربع مشاعر أساسية فقط (سعيد، حزين، غاضب، خائف) مع صور وجوه فوتوغرافية حقيقية بدلاً من الكرتون.', mid: 'تعرف جيد على المشاعر الأساسية. انتقل تدريجياً للمشاعر الثانوية (قلق، فخور، خجول).' },
      'choice-board':      { threshold: 70, low: 'صعوبة في الاختيار من اللوح. قلّص الخيارات إلى اثنتين فقط مع صور كبيرة وواضحة، وعلّم الإشارة بالإصبع قبل الاختيار اللفظي.' },
      'traffic-light':     { threshold: 70, low: 'صعوبة في نموذج الإشارة الثلاثية. مارس الثلاث حالات بإشارات جسدية حقيقية خارج الشاشة أولاً قبل العودة للتمرين الرقمي.' },
      'emotion-mirror':    { threshold: 70, low: 'صعوبة في مطابقة التعبيرات العاطفية. تدرّب أمام مرآة حقيقية على 3 مشاعر أساسية قبل استخدام الشاشة.' },
      'stroop-test':       { threshold: 70, low: 'ارتفاع تأثير Stroop يشير لضعف في الكبح المعرفي. طبّق استراتيجية التوقف المتعمد (1-2 ثانية) قبل كل إجابة، وقلّص مشتتات البيئة خلال المهام اللاحقة.' },
      'stop-signal':       { threshold: 70, low: 'ضعف في الكبح الحركي (SSRT مرتفع). مارس تمارين "تجمّد" (freeze games) خارج الجلسة لتعزيز دائرة الكبح قبل العودة للتمرين.' },
      'token-board':       { threshold: 70, low: 'صعوبة في نظام التعزيز الرمزي. قلّص عدد الرموز المطلوبة للمكافأة إلى 3 فقط وقصّر الفترة الزمنية بين المحاولة والمكافأة.' },
      'number-search':     { threshold: 70, low: 'ضعف في المسح البصري الانتقائي. استخدم شبكة 4×4 مع أرقام بحجم أكبر وزمن أطول، وأزل المشتتات البيئية البصرية.' },
      'verbal-fluency':    { threshold: 70, low: 'ضعف في الطلاقة المعجمية. استخدم إشارات دلالية مصورة (صورة الحيوان/الطعام) كمحفّز أولي، وطبّق العصف الذهني المصور.' },
      'logic-sort':        { threshold: 70, low: 'صعوبة في الترتيب المنطقي. ابدأ بتسلسلات ثلاثية فقط (3 خطوات) مع صور توضيحية واضحة لكل خطوة.' },
      'spelling-bee':      { threshold: 70, low: 'ضعف في الإملاء والوعي الصوتي. طبّق التجزئة الصوتية (tap-and-say: اطرق على الطاولة مع كل مقطع) مع بطاقات الكلمات المصوّرة.' },
      'breathing':         { threshold: 70, low: 'صعوبة في التنفس المنتظم. جرّب "تنفس الفانوس" بحركات يدوية مرئية (افتح يدك عند الشهيق، اقبضها عند الزفير) بدلاً من العدّ الصوتي المجرد.' },
      'memory-cards':      { threshold: 70, low: 'ضعف في الذاكرة البصرية. ابدأ بثلاثة أزواج فقط وزد عند الوصول لـ 90% دقة.' },
      'sequence-memory':   { threshold: 70, low: 'ضعف في ذاكرة التسلسل. استخدم تسلسلات من 3 عناصر مع إشارة سمعية مصاحبة (صوت قصير) لكل عنصر.' },
      'social-scenarios':  { threshold: 70, low: 'صعوبة في التفكير الاجتماعي. استخدم سيناريوهات من واقع الطالب اليومي وطبّق لعب الأدوار مباشرةً بعد كل موقف.' },
      'category-sort':     { threshold: 70, low: 'صعوبة في التصنيف المفاهيمي. ابدأ بفئتين متباينتين تماماً (حيوانات/طعام) مع أشياء حقيقية قبل الانتقال للبطاقات.' },
      'tap-target':        { threshold: 70, low: 'ضعف في التناسق البصري-الحركي. قلّص سرعة ظهور الأهداف وكبّر حجمها. فكّر في الإحالة لمعالج وظيفي (OT) إذا استمر الضعف.' },
      'word-recall':       { threshold: 70, low: 'ضعف في استرجاع الكلمات. طبّق التكرار التباعدي (Spaced Repetition) مع وقفات 5 ثوانٍ بين المحاولات.' },
      'body-scan':         { threshold: 70, low: 'صعوبة في الوعي الجسدي. قلّل نقاط الفحص لأربعة مناطق كبرى فقط (رأس/يدان/بطن/قدمان) مع إشارة لونية مرئية.' },
    }

    // ── Category-level analysis ──
    type CategoryData = { label: string; scores: number[]; color: string }
    const catMap: Record<string, CategoryData> = {
      memory:    { label: 'الذاكرة العاملة',       scores: [], color: '#7C5CFC' },
      attention: { label: 'الانتباه والتنفيذ',      scores: [], color: '#3B82F6' },
      language:  { label: 'اللغة والتواصل',         scores: [], color: '#10B981' },
      social:    { label: 'المهارات الاجتماعية',    scores: [], color: '#F59E0B' },
      motor:     { label: 'التنظيم الحركي',          scores: [], color: '#EF4444' },
      auditory:  { label: 'المعالجة السمعية',        scores: [], color: '#8B5CF6' },
      behavior:  { label: 'التنظيم السلوكي',         scores: [], color: '#EC4899' },
      autism:    { label: 'مهارات التوحد',           scores: [], color: '#14B8A6' },
    }
    const exCat: Record<string, keyof typeof catMap> = {
      'memory-cards':'memory','sequence-memory':'memory','n-back':'memory','word-recall':'memory','auditory-memory':'auditory','span-extension':'memory',
      'stroop-test':'attention','stop-signal':'attention','simon-says':'attention','color-grid':'attention','pattern-match':'attention',
      'visual-search':'attention','number-search':'attention','flash-count':'attention','sustained-attention':'attention','odd-one-out':'attention',
      'number-sequence':'attention','logic-sort':'attention','category-sort':'attention','analogies':'attention','if-then':'attention',
      'problem-solver':'attention','pattern-puzzle':'attention','story-sequencing':'attention','direction-follow':'attention','math-flash':'attention',
      'shadow-match':'attention',
      'tap-target':'motor','reaction-game':'motor','sequence-tap':'motor','target-tracking':'motor','finger-gym':'motor',
      'breathing':'behavior','token-board':'behavior','self-rating':'behavior','behavior-contract':'behavior',
      'body-scan':'behavior','mood-meter':'behavior','calm-corner':'behavior','emotion-volume':'behavior',
      'emotion-cards':'social','social-scenarios':'social','emotion-mirror':'social','conversation-starter':'social',
      'social-problem-solving':'social','waiting-game':'social','go-no-go':'social','balloon-control':'social','traffic-light':'social',
      'verbal-fluency':'language','word-builder':'language','letter-match':'language','picture-word-cards':'language',
      'spelling-bee':'language','reading-cards':'language',
      'listening-comprehension':'auditory','sound-discrimination':'auditory','rhyme-detection':'auditory','audio-sequence':'auditory',
      'visual-match':'autism','visual-schedule':'autism','first-then-board':'autism','imitation-mirror':'autism',
      'sensory-checkin':'autism','choice-board':'autism',
    }
    results.forEach(r => {
      const cat = exCat[r.exerciseType]
      if (cat && catMap[cat]) catMap[cat].scores.push(r.score)
    })
    const activeCats = Object.entries(catMap).filter(([, v]) => v.scores.length > 0)
    const catBars = activeCats.map(([, v]) => {
      const avg = Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length)
      const barColor = avg>=80?'#16a34a':avg>=60?'#d97706':'#dc2626'
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:12px;font-weight:700;color:#1a1a2e">${v.label}</span>
            <span style="font-size:12px;font-weight:900;color:${barColor}">${avg}%</span>
          </div>
          <div style="height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${avg}%;background:${barColor};border-radius:4px"></div>
          </div>
          <div style="font-size:10px;color:#999;margin-top:2px">${v.scores.length} تمرين</div>
        </div>`
    }).join('')

    // ── Sensory check-in profile block ──
    const sensoryResult = results.find(r => r.exerciseType === 'sensory-checkin')
    const sensoryProfileHtml = sensoryResult?.metadata?.profile
      ? `<div class="section">
          <h2>🫁 ملف الجاهزية الحسية</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
            ${Object.entries(sensoryResult.metadata.profile as Record<string,number>).map(([label, val]) => {
              const c = val===2?'#16a34a':val===1?'#d97706':'#dc2626'
              const txt = val===2?'مرتاح ✓':val===1?'عادي —':'صعب ⚠'
              return `<div style="background:${c}12;border:1.5px solid ${c}50;border-radius:8px;padding:8px 10px;text-align:center">
                <div style="font-size:11px;font-weight:700;color:#333;margin-bottom:3px">${label}</div>
                <div style="font-size:11px;color:${c};font-weight:900">${txt}</div>
              </div>`
            }).join('')}
          </div>
          ${(sensoryResult.metadata.difficult as string[]).length > 0
            ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:11px;color:#991b1b">
                ⚠️ مجالات حسية صعبة: <strong>${(sensoryResult.metadata.difficult as string[]).join(' • ')}</strong><br>
                <span style="color:#b91c1c;font-size:10px">يُنصح ببدء الجلسة القادمة بنشاط تنظيمي حسي (3-5 دقائق) قبل أي مهمة معرفية.</span>
               </div>`
            : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:11px;color:#166534">
                ✅ لا مجالات حسية صعبة — الطفل في حالة تنظيمية جيدة للتعلم.
               </div>`}
        </div>`
      : ''

    // ── Per-exercise evidence-based recommendations ──
    const recs: string[] = []
    results.forEach(r => {
      const rec = EXERCISE_RECS[r.exerciseType]
      if (!rec) return
      if (r.score < rec.threshold) recs.push(`${r.exerciseLabelAr} (${r.score}%): ${rec.low}`)
      else if (rec.mid && r.score < 85) recs.push(`${r.exerciseLabelAr} (${r.score}%): ${rec.mid}`)
    })
    if (abcLog.filter(e=>e.intensity===3).length > 0) {
      recs.push(`تحليل ABC: سُجِّل ${abcLog.filter(e=>e.intensity===3).length} حادث(ة) بحدة شديدة. يُقترح وضع خطة تدخل سلوكي وقائي (Proactive BIP) ومراجعتها مع الفريق متعدد التخصصات.`)
    }
    if (recs.length === 0) {
      recs.push(avgScoreVal >= 80
        ? 'الأداء العام ممتاز في جميع التمارين. يُوصى بالاستمرار في البرنامج الحالي مع رفع مستوى الصعوبة تدريجياً.'
        : avgScoreVal >= 60
        ? 'الأداء العام مقبول. يُوصى بمواصلة التدريب مع التركيز على التمارين التي سجّل فيها الطالب أقل من 70%.'
        : 'يُوصى بمراجعة شاملة للبروتوكول العلاجي وتكثيف التدخل مع الأسرة.')
    }
    const recsHtml = recs.map((r,i) => `<li style="margin-bottom:10px;padding:10px 14px;background:#f8fafc;border-right:3px solid #7C5CFC;border-radius:4px;font-size:12px;line-height:1.8">${i+1}. ${r}</li>`).join('')

    // ── Exercise rows with clinical context ──
    const exerciseRows = results.map(r => {
      const grade = r.score>=80?'ممتاز':r.score>=60?'جيد':r.score>=40?'متوسط':'يحتاج دعم'
      const gradeColor = r.score>=80?'#16a34a':r.score>=60?'#d97706':r.score>=40?'#ea580c':'#dc2626'
      const clinicalNote = EXERCISE_CLINICAL[r.exerciseType] || ''
      const sensoryInterp = r.exerciseType === 'sensory-checkin'
        ? (r.score >= 80 ? 'جاهزية حسية جيدة' : r.score >= 60 ? 'جاهزية حسية متوسطة' : 'تحديات حسية — انظر الملف أعلاه')
        : ''
      return `<tr>
        <td>
          <div style="font-weight:700;font-size:12px;color:#1a1a2e">${r.exerciseLabelAr}</div>
          ${clinicalNote ? `<div style="font-size:10px;color:#888;margin-top:2px;line-height:1.4">${clinicalNote}</div>` : ''}
        </td>
        <td style="text-align:center;font-weight:900;font-size:15px;color:${gradeColor}">${r.score}%</td>
        <td style="text-align:center;color:#888;font-size:11px">${r.duration}ث</td>
        <td style="text-align:center">
          <span style="background:${gradeColor}20;color:${gradeColor};padding:2px 9px;border-radius:12px;font-size:11px;font-weight:700">${grade}</span>
          ${sensoryInterp ? `<div style="font-size:10px;color:#888;margin-top:3px">${sensoryInterp}</div>` : ''}
        </td>
      </tr>`
    }).join('')

    const abcRows = abcLog.map(e => {
      const lvlColor = e.intensity===3?'#dc2626':e.intensity===2?'#d97706':'#16a34a'
      return `<tr>
        <td style="color:#666;font-size:11px">${e.ts}</td>
        <td>${e.antecedent||'—'}</td>
        <td style="font-weight:700">${e.behavior||'—'}</td>
        <td>${e.consequence||'—'}</td>
        <td style="text-align:center"><span style="background:${lvlColor}20;color:${lvlColor};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${e.intensity===1?'خفيف':e.intensity===2?'متوسط':'شديد'}</span></td>
      </tr>`
    }).join('')

    const obsRows = obsLog.map(e =>
      `<li style="margin-bottom:4px;padding:4px 8px;border-right:2px solid ${e.color};border-radius:2px"><strong style="color:#444">${e.ts}</strong> <span style="color:#888;font-size:11px">${e.category}</span> — ${e.text}</li>`
    ).join('')

    const phasesInfo = SESSION_PHASES.map((ph, i) => `<span style="margin-left:16px">${ph.icon} ${ph.label}: <strong>${phaseDurations[i]} د</strong></span>`).join('')

    const diagLabel = DIAG_LABELS[studentDiagnosis] || studentDiagnosis || 'غير محدد'
    const sevLabel  = SEVERITY_LABELS[studentSeverity] || '—'
    const diffLabel = difficulty===1?'سهل (مستوى 1)':difficulty===2?'متوسط (مستوى 2)':'صعب (مستوى 3)'

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير جلسة علاجية — ${studentName || 'الطالب'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0 }
  body { font-family:'Noto Sans Arabic','Arial',sans-serif; font-size:13px; color:#1a1a2e; background:#fff; direction:rtl }
  .ltr-num { direction:ltr; unicode-bidi:embed; display:inline-block }
  .page { max-width:820px; margin:0 auto; padding:32px }
  /* Header */
  .report-header { background:linear-gradient(135deg,#4c1d95,#7C5CFC); color:white; border-radius:16px; padding:24px 28px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-start }
  .report-header h1 { font-size:20px; font-weight:900; margin-bottom:6px }
  .report-header .sub { font-size:12px; opacity:0.8; line-height:1.8 }
  .header-badge { background:rgba(255,255,255,0.2); border-radius:8px; padding:8px 16px; text-align:center; min-width:90px }
  .header-badge .val { font-size:28px; font-weight:900 }
  .header-badge .lbl { font-size:10px; opacity:0.8 }
  /* Stats row */
  .stats { display:flex; gap:12px; margin-bottom:24px }
  .stat { flex:1; background:#faf5ff; border-radius:12px; padding:14px; text-align:center; border:1.5px solid #ede9fe }
  .stat .val { font-size:26px; font-weight:900; color:#4c1d95 }
  .stat .lbl { font-size:10px; color:#888; margin-top:2px }
  /* Sections */
  .section { margin-bottom:24px }
  h2 { font-size:13px; font-weight:900; color:#4c1d95; border-bottom:2px solid #ede9fe; padding-bottom:6px; margin-bottom:12px; display:flex; align-items:center; gap:8px }
  /* Table */
  table { width:100%; border-collapse:collapse; margin-bottom:8px }
  th { background:#4c1d95; color:white; padding:8px 10px; font-size:11px; text-align:right; font-weight:700 }
  td { padding:7px 10px; border-bottom:1px solid #f0f0f0; font-size:12px }
  tr:nth-child(even) td { background:#fdfbff }
  /* Info grid */
  .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px }
  .info-item { background:#faf5ff; border-radius:10px; padding:10px 14px; border:1px solid #ede9fe }
  .info-item .key { font-size:10px; color:#888; margin-bottom:2px }
  .info-item .val { font-size:13px; font-weight:700; color:#1a1a2e }
  /* Phases bar */
  .phases { background:#faf5ff; border-radius:10px; padding:10px 14px; font-size:11px; color:#555; margin-bottom:20px; border:1px solid #ede9fe }
  /* Notes */
  .notes-box { background:#fffbf0; border:1px solid #fde68a; border-radius:10px; padding:12px 16px; font-size:12px; line-height:1.7; color:#44372b }
  /* Recs */
  .recs { list-style:none; padding:0 }
  /* Print */
  .print-btn { background:#4c1d95; color:white; border:none; padding:10px 24px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; display:block; margin:0 auto 24px }
  @media print { .print-btn { display:none } body { font-size:11px } .page { padding:16px } }
  .watermark { text-align:center; color:#ccc; font-size:10px; margin-top:32px; padding-top:16px; border-top:1px solid #eee }
</style>
</head>
<body>
<div class="page">

<button class="print-btn" onclick="window.print()">🖨 طباعة / حفظ PDF</button>

<!-- Header -->
<div class="report-header">
  <div>
    <h1>تقرير الجلسة العلاجية</h1>
    <div class="sub">
      الطالب: <strong>${studentName || 'غير محدد'}</strong><br>
      التشخيص: ${diagLabel} • الشدة: ${sevLabel}<br>
      التاريخ: <span class="ltr-num">${date}</span> • الوقت: <span class="ltr-num">${time}</span><br>
      مدة الجلسة: <strong>${formatTime(elapsed)}</strong> • المستوى: ${diffLabel}
    </div>
  </div>
  <div class="header-badge">
    <div class="val">${avgScoreVal}%</div>
    <div class="lbl">الأداء العام</div>
  </div>
</div>

<!-- Key stats -->
<div class="stats">
  <div class="stat">
    <div class="val">${results.length}</div>
    <div class="lbl">تمارين مُنجزة</div>
  </div>
  <div class="stat">
    <div class="val" style="color:${avgScoreVal>=80?'#16a34a':avgScoreVal>=60?'#d97706':'#dc2626'}">${avgScoreVal>=80?'ممتاز':avgScoreVal>=60?'جيد':avgScoreVal>=40?'متوسط':'يحتاج دعم'}</div>
    <div class="lbl">مستوى الأداء</div>
  </div>
  <div class="stat">
    <div class="val">${results.filter(r=>r.score>=80).length}</div>
    <div class="lbl">تمارين ممتازة</div>
  </div>
  <div class="stat">
    <div class="val" style="color:${abcLog.some(e=>e.intensity===3)?'#dc2626':'#16a34a'}">${abcLog.length}</div>
    <div class="lbl">حوادث سلوكية</div>
  </div>
</div>

<!-- Phases timeline -->
<div class="phases">⏱ مراحل الجلسة: ${phasesInfo}</div>

${activeCats.length > 0 ? `
<!-- Domain performance -->
<div class="section">
  <h2>📊 الأداء حسب المجال المعرفي</h2>
  ${catBars}
</div>` : ''}

${sensoryProfileHtml}

${results.length > 0 ? `
<!-- Exercise table -->
<div class="section">
  <h2>📋 نتائج التمارين التفصيلية</h2>
  <table>
    <thead><tr>
      <th>التمرين والأساس العلمي</th>
      <th style="text-align:center;width:70px">الدرجة</th>
      <th style="text-align:center;width:60px">المدة</th>
      <th style="text-align:center;width:90px">التقدير</th>
    </tr></thead>
    <tbody>${exerciseRows}</tbody>
  </table>
</div>` : ''}

${abcLog.length > 0 ? `
<!-- ABC log -->
<div class="section">
  <h2>🔗 تحليل السلوك (نموذج ABC)</h2>
  <table>
    <thead><tr>
      <th style="width:50px">الوقت</th>
      <th>المثير السابق (Antecedent)</th>
      <th>السلوك (Behavior)</th>
      <th>النتيجة (Consequence)</th>
      <th style="text-align:center;width:70px">حدة السلوك</th>
    </tr></thead>
    <tbody>${abcRows}</tbody>
  </table>
</div>` : ''}

${obsLog.length > 0 ? `
<!-- Observations -->
<div class="section">
  <h2>📝 الملاحظات الفورية</h2>
  <ul style="padding-right:8px">${obsRows}</ul>
</div>` : ''}

${notes ? `
<!-- Therapist notes -->
<div class="section">
  <h2>💬 ملاحظات الأستاذ</h2>
  <div class="notes-box">${notes.replace(/\n/g,'<br>')}</div>
</div>` : ''}

<!-- Recommendations -->
<div class="section">
  <h2>✅ التوصيات العلاجية المبنية على الأدلة</h2>
  <ul class="recs">${recsHtml}</ul>
</div>

<div class="watermark">
  أُعِدَّ هذا التقرير بواسطة نظام أمين أكاديمي للإدارة العلاجية المتكاملة •
  هذا المستند سري وموجّه حصراً للأستاذ المختص
</div>

</div>
</body></html>`

    const w = window.open('', '_blank', 'width=960,height=800')
    if (w) { w.document.write(html); w.document.close() }
  }

  function logABC() {
    if (!abcForm.antecedent && !abcForm.behavior) return
    const now = new Date()
    const ts = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setAbcLog(prev => [...prev, { ...abcForm, ts, elapsed }])
    setAbcForm({ antecedent: '', behavior: '', consequence: '', intensity: 2 })
    setAbcOpen(false)
    playSound('abc')
  }

  // Cancel exercise — blocked when session is locked (child can't exit)
  const handleCancel = useCallback(() => { if (!sessionLocked) setActiveView(null) }, [sessionLocked])

  // Unlock: requires 3 quick taps within 2 s
  function handleUnlockTap() {
    const next = unlockTaps + 1
    setUnlockTaps(next)
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    if (next >= 3) {
      setSessionLocked(false)
      setUnlockTaps(0)
    } else {
      unlockTimerRef.current = setTimeout(() => setUnlockTaps(0), 2000)
    }
  }

  function lockSession() { setSessionLocked(true); setUnlockTaps(0) }

  async function sendHomework() {
    if (!currentStudentId || hwSelected.length === 0) return
    setHwSending(true)
    const exercises = hwSelected
      .map(eid => EXERCISES.find(e => e.id === eid))
      .filter(Boolean)
      .map(e => ({ id: e!.id, labelAr: e!.labelAr, icon: e!.icon, category: e!.category }))
    try {
      await fetch(`/api/students/${currentStudentId}/homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises, note: hwNote, sessionId: id, difficulty }),
      })
      setHwSent(true)
      setTimeout(() => { setHwOpen(false); setHwSent(false); setHwSelected([]); setHwNote('') }, 1800)
    } finally {
      setHwSending(false)
    }
  }

  const handleExerciseComplete = useCallback((result: ExerciseResult) => {
    setResults(r => {
      // Before/After comparison: detect if same exercise was played before in this session
      const prev = r.find(x => x.exerciseType === result.exerciseType)
      if (prev) {
        if (compareToastTimerRef.current) clearTimeout(compareToastTimerRef.current)
        compareToastTimerRef.current = setTimeout(() => {
          setCompareToast({ prev, curr: result })
          if (result.score > prev.score) playSound('compare')
          compareToastTimerRef.current = setTimeout(() => setCompareToast(null), 5000)
        }, 500)
      }

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
    // Exercises with their own results screen (score/feedback + "play again"/"finish"
    // buttons) stay mounted so the child/specialist actually sees it; they call
    // onCancel themselves when dismissed. Everything else keeps the old instant-close
    // behavior. Kiosk queue mode always auto-advances regardless.
    if (queueActive || !SELF_CLOSING_RESULTS.has(result.exerciseType)) {
      setActiveView(null)
    }
    playSound('success')

    // Light celebratory burst between exercises — most noticeable in Kid Mode,
    // kept brief so it never blocks the next action.
    setMiniCelebrate(true)
    if (miniCelebrateTimerRef.current) clearTimeout(miniCelebrateTimerRef.current)
    miniCelebrateTimerRef.current = setTimeout(() => setMiniCelebrate(false), 900)

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
      }).then(() => {
        // Refresh the sidebar map so stars/score update live after each exercise
        setTimeout(() => {
          fetch(`/api/admin/students/${currentStudentId}/progress-map`)
            .then(r => r.json())
            .then(d => {
              if (!d?.sessions) return
              const newSessions: SessionNode[] = d.sessions
              setSidebarMapSessions(prev => {
                // Detect star upgrade on the current session
                const prevCurr = prev?.find(s => s.sessionId === id)
                const newCurr  = newSessions.find(s => s.sessionId === id)
                if (prevCurr && newCurr && newCurr.stars > prevCurr.stars) {
                  playSound(newCurr.stars === 3 ? 'star-up-max' : 'star-up')
                  setMapTabFlash(true)
                  setTimeout(() => setMapTabFlash(false), 2000)
                }
                return newSessions
              })
            })
            .catch(() => {})
        }, 800)
      }).catch(() => {})
      // Update local usage count
      setGameUsageCounts(prev => ({ ...prev, [result.exerciseType]: (prev[result.exerciseType] || 0) + 1 }))
    }

    // Achievement toasts
    if (result.score >= 95) showAchievement('🏆', `أداء مثالي! ${result.score}%`)
    else if (result.score >= 80) showAchievement('⭐', `أداء ممتاز! ${result.score}%`)
    else if (result.score >= 60) showAchievement('👍', `أداء جيد! ${result.score}%`)

    // Adaptive difficulty engine — runs after achievement toast so toasts don't stack
    setTimeout(() => {
      setResults(currentResults => {
        const effectiveLevel: 1|2|3 = (exerciseDiffOverrides[result.exerciseType] ?? difficulty) as 1|2|3
        const decision = computeAdaptiveDecision(result, currentResults, effectiveLevel)
        if (decision) {
          setExerciseDiffOverrides(prev => ({ ...prev, [decision.exerciseId]: decision.newLevel }))
          if (adaptiveToastTimerRef.current) clearTimeout(adaptiveToastTimerRef.current)
          setAdaptiveToast({
            label: decision.exerciseLabel,
            oldLevel: decision.oldLevel,
            newLevel: decision.newLevel,
            reason: decision.reason,
            exerciseId: decision.exerciseId,
          })
          adaptiveToastTimerRef.current = setTimeout(() => setAdaptiveToast(null), 6000)
        }
        return currentResults
      })
    }, 4000)

    // Kiosk queue auto-advance
    if (queueActive) {
      setQueueIndex(qi => {
        const next = qi + 1
        if (next < exerciseQueue.length) {
          setTimeout(() => setActiveView({ type: 'exercise', id: exerciseQueue[next] }), 1200)
          return next
        } else {
          setQueueActive(false)
          setTimeout(() => { setShowCelebration(true); playSound('complete') }, 800)
          return qi
        }
      })
    }
  }, [kidMode, topGames, currentStudentId, id, difficulty, exerciseDiffOverrides, queueActive, exerciseQueue, showAchievement])

  const handleAssessmentComplete = useCallback((result: AssessmentResult) => {
    setAssessments(a => [...a, result])
    setActiveView(null)
    // Save assessment to API, linked to this session
    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, sessionId: id }),
    }).then(res => {
      if (!res.ok) throw new Error(String(res.status))
    }).catch(() => {
      setAssessmentSaveFailed(true)
      setTimeout(() => setAssessmentSaveFailed(false), 5000)
    })
  }, [id])

  async function saveSession() {
    setSaving(true)
    setSaveFailed(false)
    try {
      const res = await fetch(`/api/sessions/${id}`, {
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
          abcLog,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSaved(true)
      sessionStorage.removeItem(`session_draft_${id}`)
      playSound('complete')
    } catch (err) {
      console.error('[saveSession] failed to save session log', err)
      setSaved(false)
      setSaveFailed(true)
      setTimeout(() => setSaveFailed(false), 5000)
    } finally {
      setSaving(false)
    }
  }

  const suggestedDifficulty = (exId: string, base: 1|2|3): 1|2|3 => {
    const stats = gameHistoryByGame[exId]
    if (!stats || stats.plays < 2) return base
    if (stats.avgScore >= 85) return Math.min(3, base + 1) as 1|2|3
    if (stats.avgScore <= 40) return Math.max(1, base - 1) as 1|2|3
    return base
  }

  const activeDifficulty: 1|2|3 = (activeView?.type === 'exercise' && exerciseDiffOverrides[activeView.id])
    ? exerciseDiffOverrides[activeView.id]!
    : activeView?.type === 'exercise'
      ? suggestedDifficulty(activeView.id, difficulty)
      : difficulty
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

  // Exercises and the whiteboard are child-facing: as soon as one is open, all
  // specialist chrome (top header, toolbar, phase bar, exercises panel) should
  // collapse on its own — the same compact layout focusMode gives manually — so
  // the activity gets the full screen. The specialist can still override this in
  // either direction at any time via the persistent corner toggle below; the lock
  // (sessionLocked) is the one exception that always wins, since its whole point
  // is to keep the controls out of the child's reach.
  const activeExerciseId = activeView?.type === 'exercise' ? activeView.id : null
  const exerciseActive = activeExerciseId !== null
  const autoChromeHidden = focusMode || exerciseActive || showWhiteboard || idleChromePreferHidden
  const chromeHidden = sessionLocked || (manualChromeOverride !== null ? manualChromeOverride : autoChromeHidden)

  // Forget the specialist's manual choice once the context changes (exercise
  // started/ended, whiteboard opened/closed) so each new screen starts in its
  // sensible default state instead of carrying over a stale override.
  useEffect(() => {
    setManualChromeOverride(null)
  }, [exerciseActive, showWhiteboard])

  // The prompt-card / timer / music popovers are portaled to document.body and
  // anchored to their toolbar button's on-screen position — they don't live
  // inside the header DOM, so hiding the header doesn't hide them. Without this,
  // opening one then having chrome auto-hide (exercise starts, or the specialist
  // re-hides it manually) leaves it floating disconnected from its now-invisible
  // button. Closing them whenever chrome hides keeps "popover open" in sync with
  // "its button is actually on screen" — they can still be opened and used freely
  // any time chrome is visible, including manually shown mid-exercise.
  useEffect(() => {
    if (chromeHidden) {
      setPromptPickerOpen(false)
      setTimerPickerOpen(false)
      setShowNoisePanel(false)
    }
  }, [chromeHidden])

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Student Timer Large Display (#9) ── */}
      {showStudentTimer && (
        <StudentTimerDisplay
          left={studentTimerLeft}
          total={studentTimerTotal}
          running={studentTimerRunning}
          onToggleRunning={() => setStudentTimerRunning(r => !r)}
          onReset={() => { setStudentTimerLeft(studentTimerTotal); setStudentTimerRunning(true) }}
          onClose={() => { setShowStudentTimer(false); setStudentTimerRunning(false) }}
        />
      )}

      {/* ── Prompt Card Full-Screen Overlay ── */}
      {promptCard && (
        <div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center cursor-pointer select-none"
          style={{ background: promptCard.bg }}
          onClick={() => setPromptCard(null)}
          dir="rtl"
        >
          <div className="text-center">
            <div
              className="leading-none mb-8"
              style={{ fontSize: '10rem', filter: `drop-shadow(0 0 40px ${promptCard.glow}88)` }}
            >
              {promptCard.emoji}
            </div>
            <div
              className="text-white font-black"
              style={{ fontSize: '4.5rem', textShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 60px ${promptCard.glow}66` }}
            >
              {promptCard.text}
            </div>
          </div>
          <div className="absolute bottom-10 text-white/40 font-bold text-sm">
            اضغط في أي مكان للإغلاق
          </div>
        </div>
      )}

      {/* ── Persistent screen-size toggle — always reachable, even while the rest of the
          chrome is hidden, so the specialist can give the child a bigger screen on any
          screen (whiteboard, idle, exercises) without hunting for a buried button. Pinned
          to the vertical mid-left edge rather than a corner: every other floating control
          (header save/timer, whiteboard's own toolbar, the restart button, the focus-mode
          panel, the ABC/note buttons) lives at the top or bottom edge, so this is the one
          spot guaranteed clear in every screen state. The session lock takes priority and
          hides this too — that's the point of locking. Toggling on the plain idle screen
          (no exercise/whiteboard/focus forcing chrome either way already) is remembered in
          localStorage, so the next session opens with the same screen size by default —
          this only sets the idle baseline; it never skips the automatic auto-hide the
          moment a new exercise starts, since exerciseActive still always forces it. ── */}
      {!sessionLocked && (
        <button
          onClick={() => {
            const next = !chromeHidden
            setManualChromeOverride(next)
            if (!focusMode && !exerciseActive && !showWhiteboard) {
              setIdleChromePreferHidden(next)
              window.localStorage.setItem(CHROME_PREF_KEY, next ? '1' : '0')
            }
          }}
          className="fixed left-3 z-[490] flex items-center justify-center w-11 h-11 rounded-full shadow-lg transition-all duration-200 active:scale-90 hover:scale-105 select-none"
          style={{ top: 'calc(50% - 26px)', transform: 'translateY(-50%)', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#FFFFFF', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 16px rgba(79,70,229,0.45)' }}
          title={chromeHidden ? 'إظهار أدوات الجلسة' : 'تكبير الشاشة — إخفاء الأدوات'}
        >
          {chromeHidden ? <Maximize2 className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <Minimize2 className="w-[18px] h-[18px]" strokeWidth={2.5} />}
        </button>
      )}

      {/* ── Child Lock Overlay — floating indicator when session is locked ── */}
      {sessionLocked && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[490] flex items-center gap-3 rounded-full px-4 py-2 shadow-2xl select-none"
          style={{ background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
          dir="rtl"
        >
          <span className="text-white/70 text-xs font-black">{studentName || 'الجلسة مفعّلة'}</span>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{ background: i < unlockTaps ? '#7C5CFC' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
          <button
            onClick={handleUnlockTap}
            className="text-white/40 hover:text-white/80 text-xs font-black transition-colors px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            title="اضغط 3 مرات لفتح القفل"
          >
            🔒 {unlockTaps > 0 ? `${3 - unlockTaps}...` : 'فتح'}
          </button>
        </div>
      )}

      {/* ── Header row ── */}
      <SessionHeader
        headerRef={headerRef}
        chromeHidden={chromeHidden}
        onClose={() => { setRunning(false); router.back() }}
        studentName={studentName}
        studentAge={studentAge}
        studentDiagnosis={studentDiagnosis}
        studentSeverity={studentSeverity}
        sessionCount={sessionCount}
        appointmentType={appointmentType}
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen(o => !o)}
        onCloseProfile={() => setProfileOpen(false)}
        pastSessions={pastSessions}
        profile={profile}
        notes={notes}
        running={running}
        elapsed={elapsed}
        results={results}
        avgScore={avgScore}
        savedFlash={savedFlash}
        onStart={startSession}
        onSave={saveSession}
        saving={saving}
        saved={saved}
        saveFailed={saveFailed}
      />

      <SessionToolbar
        toolbarRef={toolbarRef}
        chromeHidden={chromeHidden}
        jitsiUrl={jitsiUrl}
        jitsiEmbedded={jitsiEmbedded}
        onToggleJitsiEmbedded={() => setJitsiEmbedded(e => !e)}
        showWhiteboard={showWhiteboard}
        onToggleWhiteboard={() => setShowWhiteboard(w => !w)}
        promptBtnRef={promptBtnRef}
        promptPickerOpen={promptPickerOpen}
        onTogglePromptPicker={() => setPromptPickerOpen(p => !p)}
        onClosePromptPicker={() => setPromptPickerOpen(false)}
        promptCards={PROMPT_CARDS}
        onSelectPromptCard={(card) => { setPromptCard(card); setPromptPickerOpen(false) }}
        timerBtnRef={timerBtnRef}
        timerPickerOpen={timerPickerOpen}
        onToggleTimerPicker={() => setTimerPickerOpen(p => !p)}
        onCloseTimerPicker={() => setTimerPickerOpen(false)}
        showStudentTimer={showStudentTimer}
        studentTimerLeft={studentTimerLeft}
        onStartStudentTimer={startStudentTimer}
        onStopStudentTimer={() => { setShowStudentTimer(false); setStudentTimerRunning(false); setTimerPickerOpen(false) }}
        noiseBtnRef={noiseBtnRef}
        showNoisePanel={showNoisePanel}
        onToggleNoisePanel={() => setShowNoisePanel(p => !p)}
        onCloseNoisePanel={() => setShowNoisePanel(false)}
        noiseRunning={noiseRunning}
        noiseSecsLeft={noiseSecsLeft}
        noiseMode={noiseMode}
        onSetNoiseMode={setNoiseMode}
        onStartNoise={startNoise}
        onStopNoise={stopNoise}
        kidMode={kidMode}
        onToggleKidMode={() => setKidMode(m => !m)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(m => !m)}
        difficulty={difficulty}
        onSetDifficulty={setDifficulty}
        hasResults={results.length > 0}
        onPrintReport={printSessionReport}
        onLockSession={lockSession}
      />

      <SessionPhaseBar
        phaseBarRef={phaseBarRef}
        running={running}
        chromeHidden={chromeHidden}
        phases={SESSION_PHASES}
        phaseIdx={phaseIdx}
        phaseDurations={phaseDurations}
        elapsed={elapsed}
        onSelectPhase={(i) => { setPhaseIdx(i); setPhaseToast(null) }}
        onToggleShowPhaseEdit={() => setShowPhaseEdit(e => !e)}
      />

      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* Sidebar — already conditionally mounted (not just display-toggled), so
            it gets a fresh entrance animation every time chrome is shown again. */}
        {!chromeHidden && <aside className="hidden lg:flex w-72 bg-white border-l border-brand-100 flex-col animate-in fade-in slide-in-from-left-2 duration-200">
          {/* Tabs */}
          <div className="flex border-b border-brand-100">
            {([
              { key: 'exercises',   icon: '🎮', label: 'تمارين' },
              { key: 'assessments', icon: '📊', label: 'تقييم'  },
              { key: 'log',         icon: '📝', label: 'سجل'    },
              { key: 'videos',      icon: '📹', label: 'فيديو'  },
              { key: 'map',         icon: '🗺️', label: 'خارطة'  },
            ] as const).map(({ key: t, icon, label }) => (
              <button key={t} onClick={() => {
                setTab(t)
                // Fetch progress map on first open
                if (t === 'map' && !sidebarMapSessions && !sidebarMapLoading && currentStudentId) {
                  setSidebarMapLoading(true)
                  fetch(`/api/admin/students/${currentStudentId}/progress-map`)
                    .then(r => r.ok ? r.json() : null)
                    .then(d => { if (d?.sessions) setSidebarMapSessions(d.sessions) })
                    .catch(() => {})
                    .finally(() => setSidebarMapLoading(false))
                }
              }}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors relative ${
                  tab === t ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <span className="text-sm leading-none relative">
                  {icon}
                  {/* Star-upgrade flash badge on 🗺️ tab */}
                  {t === 'map' && mapTabFlash && tab !== 'map' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white animate-ping" />
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tab === 'exercises' && (() => {
              const allCategories = ['الكل', ...Array.from(new Set(EXERCISES.map(e => e.category)))]
              const filtered = categoryFilter === 'الكل'
                ? sortedExercises
                : sortedExercises.filter(e => e.category === categoryFilter || (categoryFilter === 'توحد' && (e as any).tags?.includes('توحد')))
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
                            : 'bg-surface-page text-gray-500 hover:bg-brand-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {filtered.map((ex, idx) => {
                    const isTop = topGames.includes(ex.id)
                    const isActive = activeExerciseId === ex.id
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
                          <div className="border-t border-brand-100 my-1" />
                        )}
                        <div className="relative group">
                          <button
                            onClick={() => {
                              if (!running) startSession()
                              setActiveView({ type: 'exercise', id: ex.id })
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all
                              ${ex.color} hover:scale-[1.02]
                              ${isActive ? 'scale-[1.02] ring-1 ring-brand-300' : ''}
                              ${isTop ? 'ring-1 ring-brand-400/50' : ''}
                              ${!ageOk ? 'opacity-40' : ''}
                            `}>
                            <span className="text-xl">{ex.icon}</span>
                            <div className="text-right flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="text-gray-900 font-bold text-xs truncate">{ex.labelAr}</div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {exerciseDiffOverrides[ex.id] && exerciseDiffOverrides[ex.id] !== difficulty && (
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-brand-100 text-brand-700">
                                      {exerciseDiffOverrides[ex.id] === 1 ? 'سهل' : exerciseDiffOverrides[ex.id] === 2 ? 'وسط' : 'صعب'}
                                    </span>
                                  )}
                                  {!exerciseDiffOverrides[ex.id] && suggestedDifficulty(ex.id, difficulty) !== difficulty && (
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-100 text-emerald-700" title="مقترح تلقائياً حسب الأداء السابق">
                                      🤖 {suggestedDifficulty(ex.id, difficulty) === 1 ? 'سهل' : suggestedDifficulty(ex.id, difficulty) === 2 ? 'وسط' : 'صعب'}
                                    </span>
                                  )}
                                  {isTop && <Star className="w-3 h-3 text-brand-500 flex-shrink-0" />}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-gray-400 text-[10px]">{ex.category}</span>
                                <span className="text-gray-300 text-[9px] ltr-num">{ex.ageMin}-{ex.ageMax}س</span>
                                {(gameUsageCounts[ex.id] ?? 0) > 0 && (
                                  <span className="text-[9px] bg-surface-page text-gray-400 px-1 py-0.5 rounded-full font-bold ltr-num">
                                    ×{gameUsageCounts[ex.id]} مرة
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setExerciseConfigId(ex.id) }}
                            className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-700 hover:bg-white/70 transition-all opacity-0 group-hover:opacity-100 text-[11px] z-10"
                            title={`إعدادات ${ex.labelAr}`}
                          >
                            ⚙
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )
            })()}

            {tab === 'assessments' && (
              <div className="space-y-2">
                {SESSION_TYPE_CFG[appointmentType]?.isAssessment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-amber-700 text-xs font-black flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> جلسة تقييمية
                    </p>
                    <p className="text-amber-600/80 text-[10px] mt-1 leading-relaxed">
                      ابدأ بتطبيق المقاييس أدناه لتوثيق الحالة، ثم انتقل للتمارين بعد الانتهاء.
                    </p>
                  </div>
                )}
                {ASSESSMENTS.map(as => (
                  <button key={as.id}
                    onClick={() => setActiveView({ type: 'assessment', id: as.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${as.color} hover:scale-[1.02]`}>
                    <span className="text-2xl">{as.icon}</span>
                    <div className="text-gray-900 font-bold text-sm">{as.labelAr}</div>
                  </button>
                ))}

                {/* Observation ratings */}
                <div className="mt-4 bg-surface-page rounded-xl p-3">
                  <h3 className="font-black text-gray-600 text-xs mb-3">ملاحظات الجلسة</h3>
                  {(Object.keys(observations) as (keyof SessionObservations)[]).map(key => (
                    <div key={key} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex gap-1">
                          {([1,2,3,4,5] as const).map(v => (
                            <button key={v}
                              onClick={() => setObservations(o => ({ ...o, [key]: v }))}
                              className={`w-5 h-5 rounded text-xs font-bold transition-colors ${
                                observations[key] >= v ? 'bg-brand-500 text-white' : 'bg-white text-gray-300'
                              }`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        <span className="text-gray-500 text-xs">{observationLabels[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'log' && (
              <div className="space-y-2">
                {/* Live session intelligence card — appears once first result is in */}
                <LiveSessionCard
                  results={results}
                  elapsed={elapsed}
                  gameHistoryByGame={gameHistoryByGame}
                />

                {results.length === 0 && assessments.length === 0 && obsLog.length === 0 && (
                  <p className="text-gray-300 text-sm text-center py-4">لم تبدأ أي نشاط بعد</p>
                )}

                {/* Observation log entries */}
                {obsLog.length > 0 && (
                  <div className="bg-surface-page rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">ملاحظات فورية</span>
                      <span className="text-gray-300 text-[10px]">{obsLog.length} ملاحظة</span>
                    </div>
                    <div className="space-y-1.5">
                      {obsLog.map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          <span className="text-gray-700 text-xs flex-1">{e.text}</span>
                          <span className="text-gray-300 text-[10px] font-mono ltr-num flex-shrink-0">{e.ts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ABC Behavior Log entries */}
                {abcLog.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-amber-700 text-[10px] font-black uppercase tracking-wider">🔗 سجل ABC</span>
                      <span className="text-amber-600/70 text-[10px]">{abcLog.length} حوادث</span>
                    </div>
                    <div className="space-y-3">
                      {abcLog.map((e, i) => (
                        <div key={i} className="bg-white rounded-xl p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-gray-300 text-[9px] ltr-num font-mono">{e.ts}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              e.intensity === 1 ? 'bg-green-50 text-green-700' :
                              e.intensity === 2 ? 'bg-amber-50 text-amber-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {e.intensity === 1 ? 'خفيف' : e.intensity === 2 ? 'متوسط' : 'شديد'}
                            </span>
                          </div>
                          {e.antecedent && (
                            <div className="flex gap-1.5 mb-1">
                              <span className="text-blue-600 text-[9px] font-black flex-shrink-0">A:</span>
                              <span className="text-gray-600 text-[10px]">{e.antecedent}</span>
                            </div>
                          )}
                          {e.behavior && (
                            <div className="flex gap-1.5 mb-1">
                              <span className="text-amber-600 text-[9px] font-black flex-shrink-0">B:</span>
                              <span className="text-gray-600 text-[10px]">{e.behavior}</span>
                            </div>
                          )}
                          {e.consequence && (
                            <div className="flex gap-1.5">
                              <span className="text-green-600 text-[9px] font-black flex-shrink-0">C:</span>
                              <span className="text-gray-600 text-[10px]">{e.consequence}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session summary header when results exist */}
                {results.length > 0 && (
                  <div className="bg-surface-page rounded-xl p-3 mb-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">ملخص الجلسة</span>
                      <span className="text-gray-400 text-[10px]">{results.length} تمارين</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 text-center">
                        <div className={`font-black text-lg ${avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {avgScore}%
                        </div>
                        <div className="text-gray-400 text-[10px]">متوسط</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-black text-lg text-brand-600">
                          {results.filter(r => r.score >= 80).length}
                        </div>
                        <div className="text-gray-400 text-[10px]">ممتاز</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-black text-lg text-amber-600">{formatTime(elapsed)}</div>
                        <div className="text-gray-400 text-[10px]">المدة</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per-game results — enhanced */}
                {results.map((r, i) => {
                  const exInfo = EXERCISES.find(e => e.id === r.exerciseType)
                  return (
                    <div key={i} className="bg-surface-page hover:bg-brand-50 rounded-xl p-3 transition-colors">
                      {/* Game name + icon row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{exInfo?.icon ?? '🎮'}</span>
                          <span className="text-gray-700 text-xs font-bold truncate">{r.exerciseLabelAr}</span>
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
                        <span className="text-gray-400 text-[10px]">{r.duration}ث</span>
                        <span className="text-gray-400 text-[10px]">دقة: {r.accuracy}%</span>
                      </div>
                    </div>
                  )
                })}

                {assessments.map((a, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        a.severity === 'none' ? 'bg-green-50 text-green-700' :
                        a.severity === 'mild' ? 'bg-amber-50 text-amber-700' :
                        a.severity === 'moderate' ? 'bg-orange-50 text-orange-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {a.severity === 'none' ? 'طبيعي' : a.severity === 'mild' ? 'خفيف' : a.severity === 'moderate' ? 'متوسط' : 'شديد'}
                      </span>
                      <span className="text-gray-600 text-xs font-bold">
                        {a.type === 'adhd' ? 'تقييم ADHD' : 'صعوبات التعلم'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'videos' && (
              <div className="space-y-2" dir="rtl">
                <p className="text-gray-400 text-[10px] px-1 pb-1">انقر على أي تمرين لعرض وصفه وطريقة تطبيقه والبحث عن فيديو تعليمي</p>
                {EXERCISES.filter(ex => VIDEO_LIBRARY[ex.id]).map(ex => {
                  const entry = VIDEO_LIBRARY[ex.id]
                  const hasUrl = !!videoUrls[ex.id]
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setVideoModal(ex.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all hover:scale-[1.01] ${ex.color}`}
                    >
                      <span className="text-xl flex-shrink-0">{ex.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 font-bold text-xs">{ex.labelAr}</div>
                        <div className="text-gray-400 text-[10px] truncate">{entry.desc.slice(0, 50)}…</div>
                      </div>
                      {hasUrl
                        ? <Play className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        : <Youtube className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      }
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Map tab ── */}
            {tab === 'map' && (
              <div className="space-y-4" dir="rtl">

                {/* Streak detection */}
                {(() => {
                  if (!sidebarMapSessions?.length) return null
                  let streak = 0
                  for (let i = sidebarMapSessions.length - 1; i >= 0; i--) {
                    if (sidebarMapSessions[i].stars === 3) streak++
                    else break
                  }
                  if (streak < 3) return null
                  return (
                    <div className="flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-sm font-black"
                      style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', border: '1.5px solid #F59E0B', color: '#92400E' }}>
                      🔥 سلسلة ممتازة × {streak} جلسة!
                    </div>
                  )
                })()}

                {/* Header */}
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ background: 'linear-gradient(135deg,#F5F0FF,#EEF0FF)', border: '1.5px solid #E0D5FF' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span />
                    <span className="text-3xl">🗺️</span>
                    <button
                      onClick={() => setShowMapDialog(true)}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-indigo-50"
                      title="عرض الخارطة كاملة"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                    </button>
                  </div>
                  <p className="font-black text-gray-800 text-sm">خارطة رحلة الطفل</p>
                  {sidebarMapSessions && sidebarMapSessions.length > 0 && (
                    <p className="text-indigo-500 text-xs mt-1 font-bold">
                      {sidebarMapSessions.length} جلسة • {sidebarMapSessions.reduce((s,n) => s + n.stars, 0)} ⭐
                    </p>
                  )}
                </div>

                {/* Map content */}
                {sidebarMapLoading ? (
                  <div className="flex flex-col gap-3 px-1">
                    {[52, 44, 52, 44, 56].map((sz, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="rounded-full animate-pulse bg-indigo-100 flex-shrink-0"
                          style={{ width: sz, height: sz, animationDelay: `${i * 0.1}s` }} />
                        {i < 4 && <div className="h-px flex-1 border-t-2 border-dashed border-gray-200" />}
                      </div>
                    ))}
                  </div>
                ) : sidebarMapSessions && sidebarMapSessions.length > 0 ? (
                  <div className="space-y-3">
                    <ProgressMap sessions={sidebarMapSessions} upcomingSlots={2} />
                    {/* Previous session comparison */}
                    {(() => {
                      const currIdx = sidebarMapSessions.findIndex(s => s.sessionId === id)
                      if (currIdx <= 0) return null
                      const curr = sidebarMapSessions[currIdx]
                      const prev = sidebarMapSessions[currIdx - 1]
                      const diff = curr.avgScore - prev.avgScore
                      if (diff === 0) return null
                      const improved = diff > 0
                      return (
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
                          style={{
                            background: improved ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)',
                            border: `1px solid ${improved ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                            color: improved ? '#065F46' : '#991B1B',
                          }}>
                          <span style={{ fontSize: 16 }}>{improved ? '📈' : '📉'}</span>
                          <span>
                            {improved ? 'تحسن' : 'انخفاض'} {improved ? '+' : ''}{diff}%
                            <span className="font-normal opacity-70"> مقارنة بالجلسة السابقة ({prev.avgScore}%)</span>
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="font-black text-gray-600 text-sm mb-1">لم تبدأ الرحلة بعد</p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      ستظهر هنا خارطة الجلسات بعد أول تمرين مكتمل في وضع الطفل
                    </p>
                  </div>
                )}

                {/* Tip for specialist */}
                {sidebarMapSessions && sidebarMapSessions.length > 0 && (
                  <div
                    className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
                    style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', color: '#4338CA' }}
                  >
                    💡 <strong>نصيحة:</strong> أظهر هذه الخارطة للطفل وقل له "انظر كم أنجزت!" قبل بدء التمارين.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-3 border-t border-brand-100">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات الأستاذ..."
              className="w-full bg-surface-page border border-brand-100 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-brand-500"
              rows={3}
              dir="rtl"
            />
          </div>
        </aside>}

        {/* ── Mobile nav + slide-up panel (hidden on lg+) ── */}
        {!chromeHidden && !kidMode && (
          <>
            {/* Backdrop */}
            {showMobilePanel && (
              <div
                className="lg:hidden fixed inset-0 bg-black/60 z-[78] backdrop-blur-sm"
                onClick={() => setShowMobilePanel(false)}
              />
            )}

            {/* Slide-up panel */}
            <div
              className={`lg:hidden fixed inset-x-0 z-[79] rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${showMobilePanel ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
              style={{
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                maxHeight: '72vh',
                background: 'rgba(255,255,255,0.98)',
                border: '1px solid rgba(124,92,252,0.15)',
                borderBottom: 'none',
                backdropFilter: 'blur(24px)',
              }}
              dir="rtl"
            >
              {/* Handle */}
              <button onClick={() => setShowMobilePanel(false)} className="w-full flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 rounded-full bg-brand-100" />
              </button>

              {/* Tabs */}
              <div className="flex border-b border-brand-100 mx-3 mb-1">
                {([
                  { key: 'exercises',   labelAr: 'تمارين', Icon: Gamepad2    },
                  { key: 'assessments', labelAr: 'تقييم',  Icon: BarChart3   },
                  { key: 'log',         labelAr: 'سجل',    Icon: BookOpen    },
                  { key: 'videos',      labelAr: 'فيديو',  Icon: Play        },
                ] as const).map(({ key: t, labelAr, Icon }) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1 text-[11px] font-bold transition-all relative ${
                      tab === t ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab === t && (
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#7C5CFC,#C084FC)' }} />
                    )}
                    <Icon className="w-3 h-3" />
                    {labelAr}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(70vh - 130px)' }}>
                {tab === 'exercises' && (() => {
                  const allCats = ['الكل', ...Array.from(new Set(EXERCISES.map(e => e.category)))]
                  const filteredEx = categoryFilter === 'الكل' ? sortedExercises : sortedExercises.filter(e => e.category === categoryFilter || (categoryFilter === 'توحد' && (e as any).tags?.includes('توحد')))
                  return (
                    <>
                      <div className="flex flex-wrap gap-1 pb-1">
                        {allCats.map(cat => (
                          <button key={cat} onClick={() => setCategoryFilter(cat)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-surface-page text-gray-500 hover:bg-brand-50'}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                      {filteredEx.map(ex => {
                        const isActive = activeExerciseId === ex.id
                        const ageOk = studentAge >= (ex.ageMin ?? 5) && studentAge <= (ex.ageMax ?? 22)
                        return (
                          <button key={ex.id}
                            onClick={() => { if (!running) startSession(); setActiveView({ type: 'exercise', id: ex.id }); setShowMobilePanel(false) }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${ex.color} hover:scale-[1.02] ${isActive ? 'ring-1 ring-brand-300' : ''} ${!ageOk ? 'opacity-40' : ''}`}>
                            <span className="text-xl">{ex.icon}</span>
                            <div className="flex-1 text-right">
                              <div className="text-gray-900 font-bold text-xs">{ex.labelAr}</div>
                              <div className="text-gray-400 text-[10px]">{ex.category}</div>
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )
                })()}

                {tab === 'assessments' && (
                  <div className="space-y-2">
                    {ASSESSMENTS.map(as => (
                      <button key={as.id}
                        onClick={() => { setActiveView({ type: 'assessment', id: as.id }); setShowMobilePanel(false) }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${as.color}`}>
                        <span className="text-2xl">{as.icon}</span>
                        <div className="text-gray-900 font-bold text-sm">{as.labelAr}</div>
                      </button>
                    ))}
                  </div>
                )}

                {tab === 'log' && (
                  <div className="space-y-2">
                    <LiveSessionCard
                      results={results}
                      elapsed={elapsed}
                      gameHistoryByGame={gameHistoryByGame}
                    />
                    {results.length === 0 && <p className="text-gray-300 text-sm text-center py-4">لم تبدأ أي نشاط بعد</p>}
                    {results.map((r, i) => {
                      const exInfo = EXERCISES.find(e => e.id === r.exerciseType)
                      return (
                        <div key={i} className="bg-surface-page rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.score >= 80 ? 'bg-emerald-50 text-emerald-700' : r.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{r.score}%</span>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{exInfo?.icon ?? '🎮'}</span>
                              <span className="text-gray-700 text-xs">{r.exerciseLabelAr}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab === 'videos' && (
                  <div className="space-y-2" dir="rtl">
                    <p className="text-gray-400 text-[10px] px-1 pb-1">انقر على أي تمرين للاطلاع على طريقة التطبيق وفتح فيديو تعليمي</p>
                    {EXERCISES.filter(ex => VIDEO_LIBRARY[ex.id]).map(ex => {
                      const entry = VIDEO_LIBRARY[ex.id]
                      const hasUrl = !!videoUrls[ex.id]
                      return (
                        <button
                          key={ex.id}
                          onClick={() => { setVideoModal(ex.id); setShowMobilePanel(false) }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${ex.color}`}
                        >
                          <span className="text-xl flex-shrink-0">{ex.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 font-bold text-xs">{ex.labelAr}</div>
                            <div className="text-gray-400 text-[10px] truncate">{entry.desc.slice(0, 48)}…</div>
                          </div>
                          {hasUrl
                            ? <Play className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            : <ExternalLink className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          }
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes textarea */}
              <div className="p-3 border-t border-brand-100">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات الأستاذ..."
                  className="w-full bg-surface-page border border-brand-100 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-brand-500"
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Mobile bottom tab bar */}
            <div
              className="lg:hidden fixed bottom-0 inset-x-0 z-[80] px-3 pt-1.5"
              style={{
                background: 'rgba(255,255,255,0.97)',
                borderTop: '1px solid rgba(124,92,252,0.12)',
                backdropFilter: 'blur(28px)',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
              }}
              dir="rtl"
            >
              <div className="flex gap-2">
                {([
                  { key: 'exercises',   labelAr: 'التمارين', Icon: Gamepad2  },
                  { key: 'assessments', labelAr: 'التقييم',  Icon: ClipboardList },
                  { key: 'log',         labelAr: 'السجل',    Icon: BookOpen  },
                ] as const).map(({ key: t, labelAr, Icon }) => {
                  const isActive = tab === t && showMobilePanel
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        if (tab === t && showMobilePanel) setShowMobilePanel(false)
                        else { setTab(t); setShowMobilePanel(true) }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all duration-200 active:scale-95 relative overflow-hidden"
                      style={isActive ? {
                        background: 'rgba(124,92,252,0.1)',
                        border: '1px solid rgba(124,92,252,0.3)',
                        boxShadow: '0 4px 16px rgba(124,92,252,0.1)',
                      } : {
                        background: '#FFF8F0',
                        border: '1px solid rgba(124,92,252,0.08)',
                      }}
                    >
                      <Icon
                        style={{
                          width: 16,
                          height: 16,
                          color: isActive ? '#7C5CFC' : '#9CA3AF',
                          transition: 'color 0.2s',
                        }}
                      />
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: isActive ? '#7C5CFC' : '#9CA3AF',
                          transition: 'color 0.2s',
                        }}
                      >
                        {labelAr}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Kid Mode — full-screen friendly game grid */}
        {kidMode && (
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: 'linear-gradient(160deg, #FFF0FA 0%, #EEF0FF 35%, #F0FFF8 70%, #FFFBF0 100%)',
            }}
          >
            <div className="max-w-2xl mx-auto px-4 py-6">

              {/* ── Exercise queue builder ── */}
              {exerciseQueue.length > 0 && !queueActive && (
                <div className="mb-5 bg-white/90 rounded-3xl p-4 shadow-lg border-2 border-brand-200" dir="rtl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-brand-700 text-sm">قائمة الجلسة <span className="text-brand-400">({exerciseQueue.length})</span></h3>
                    <button onClick={() => setExerciseQueue([])} className="text-red-400 text-xs font-bold hover:text-red-600">مسح الكل ×</button>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {exerciseQueue.map((eid, qi) => {
                      const qex = EXERCISES.find(e => e.id === eid)
                      return qex ? (
                        <div key={qi} className="bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span>{qex.icon}</span>
                          <span>{qex.labelAr}</span>
                          <button
                            onClick={() => setExerciseQueue(q => q.filter((_, i) => i !== qi))}
                            className="text-brand-300 hover:text-red-500 ml-0.5 font-black"
                          >×</button>
                        </div>
                      ) : null
                    })}
                  </div>
                  <button
                    onClick={() => {
                      if (!running) startSession()
                      setQueueIndex(0)
                      setQueueActive(true)
                      setActiveView({ type: 'exercise', id: exerciseQueue[0] })
                      setKidMode(false)
                    }}
                    className="w-full bg-gradient-to-l from-[#7C5CFC] to-[#9A7BFD] text-white font-black py-3 rounded-2xl text-sm shadow-lg transition-all active:scale-95"
                  >
                    ▶ ابدأ القائمة — {exerciseQueue.length} تمارين متتالية
                  </button>
                </div>
              )}

              {/* Queue progress when active */}
              {queueActive && (
                <div className="mb-5 bg-brand-600/90 rounded-3xl p-4 text-white" dir="rtl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm">تمرين {queueIndex + 1} من {exerciseQueue.length}</span>
                    <button onClick={() => { setQueueActive(false); setQueueIndex(0) }} className="text-white/60 text-xs hover:text-white">إيقاف القائمة</button>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((queueIndex) / exerciseQueue.length) * 100}%` }} />
                  </div>
                </div>
              )}

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
                      const inQueue = exerciseQueue.includes(ex.id)
                      return (
                        <div key={ex.id} className="relative">
                          <button
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExerciseQueue(q => inQueue ? q.filter(i => i !== ex.id) : [...q, ex.id])
                            }}
                            className={`absolute top-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl transition-all ${
                              inQueue ? 'bg-white text-brand-700' : 'bg-white/20 hover:bg-white/40 text-white'
                            }`}
                          >
                            {inQueue ? '✓ في القائمة' : '+ قائمة'}
                          </button>
                        </div>
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
                    const inQ = exerciseQueue.includes(ex.id)
                    return (
                      <div key={ex.id} className="relative">
                        <button
                          onClick={() => {
                            if (!running) startSession()
                            setActiveView({ type: 'exercise', id: ex.id })
                            setKidMode(false)
                          }}
                          className="rounded-3xl p-4 text-center active:scale-95 transition-all duration-150 select-none w-full"
                          style={{
                            background: c.bg,
                            border: `2px solid ${inQ ? '#7C5CFC' : c.border}`,
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExerciseQueue(q => inQ ? q.filter(i => i !== ex.id) : [...q, ex.id])
                          }}
                          className={`absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-lg transition-all ${
                            inQ ? 'bg-brand-600 text-white' : 'bg-black/10 hover:bg-brand-100 text-gray-500'
                          }`}
                        >
                          {inQ ? '✓' : '+'}
                        </button>
                      </div>
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
            {showCelebration && (() => {
              const avgScoreCelebration = results.length
                ? results.reduce((s, r) => s + r.score, 0) / results.length
                : 0
              const starsEarned = avgScoreCelebration >= 80 ? 3 : avgScoreCelebration >= 60 ? 2 : 1
              const confettiColors = ['#7C5CFC','#FF8C65','#2ABFA3','#FFBA44','#FF6B6B','#3B9EFF','#EC4899','#10B981']
              return (
                <div
                  className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(160deg,#FFF0FA 0%,#EEF0FF 38%,#F0FFF8 72%,#FFFBF0 100%)' }}
                >
                  <style>{`
                    @keyframes celConfetti {
                      0%   { transform: translateY(-30px) rotate(0deg);   opacity: 1; }
                      100% { transform: translateY(110vh)  rotate(540deg); opacity: 0; }
                    }
                    @keyframes celStarDrop {
                      0%   { transform: translateY(-40px) scale(0.4) rotate(-20deg); opacity: 0; }
                      65%  { transform: translateY(6px)   scale(1.25) rotate(5deg);  opacity: 1; }
                      100% { transform: translateY(0)     scale(1)    rotate(0deg);  opacity: 1; }
                    }
                    @keyframes celTrophy {
                      0%,100% { transform: translateY(0) rotate(-3deg); }
                      50%     { transform: translateY(-10px) rotate(3deg); }
                    }
                    @keyframes celNodePulse {
                      0%,100% { transform: scale(1);    opacity: 0.45; }
                      50%     { transform: scale(1.4);  opacity: 0; }
                    }
                  `}</style>

                  {/* Falling confetti */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          width:        `${5 + (i % 5) * 3}px`,
                          height:       `${5 + (i % 5) * 3}px`,
                          left:         `${(i * 3.7) % 100}%`,
                          top:          '-30px',
                          background:   confettiColors[i % confettiColors.length],
                          borderRadius: i % 3 === 0 ? '50%' : '3px',
                          animation:    `celConfetti ${2.2 + (i % 4) * 0.55}s ${i * 0.09}s linear infinite`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full">

                    {/* Trophy */}
                    <div
                      className="text-7xl mb-3 select-none"
                      style={{
                        animation: 'celTrophy 2s ease-in-out infinite',
                        filter: 'drop-shadow(0 8px 20px rgba(124,92,252,0.35))',
                      }}
                    >
                      🏆
                    </div>

                    {/* Title */}
                    <h1 className="font-black text-4xl text-gray-800 mb-1 leading-tight">أحسنت! 🎉</h1>
                    <p className="text-gray-500 text-base mb-5">أكملت جلسة اليوم بنجاح</p>

                    {/* Animated stars */}
                    <div className="flex justify-center gap-3 mb-5">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="text-5xl inline-block"
                          style={{
                            color:     i < starsEarned ? '#F59E0B' : '#E5E7EB',
                            animation: i < starsEarned
                              ? `celStarDrop 0.45s ${0.1 + i * 0.18}s ease-out both`
                              : 'none',
                            filter: i < starsEarned
                              ? 'drop-shadow(0 2px 8px rgba(245,158,11,0.5))'
                              : 'none',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Per-game score cards */}
                    <div className="flex gap-2.5 mb-5 flex-wrap justify-center">
                      {results.slice(-topGames.length).map((r, i) => {
                        const cardBgs = [
                          'linear-gradient(135deg,#7C5CFC,#9A7BFD)',
                          'linear-gradient(135deg,#FF8C65,#FFBA44)',
                          'linear-gradient(135deg,#2ABFA3,#3B9EFF)',
                        ]
                        return (
                          <div
                            key={i}
                            className="rounded-2xl p-3.5 text-white text-center w-24 shadow-lg"
                            style={{ background: cardBgs[i % 3] }}
                          >
                            <div className="text-xl mb-0.5">
                              {r.score >= 80 ? '⭐' : r.score >= 60 ? '👍' : '💪'}
                            </div>
                            <div className="font-black text-xl ltr-num">{r.score}%</div>
                            <div className="text-white/80 text-[10px] mt-0.5 truncate leading-tight">
                              {r.exerciseLabelAr}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Journey progress map — real data if loaded, skeleton fallback */}
                    <div
                      className="rounded-2xl px-4 py-4 mb-5 w-full"
                      style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-gray-700">🗺️ خارطة رحلتك</span>
                        {celebrationMap && (
                          <span className="text-[10px] font-bold text-indigo-400">
                            {celebrationMap.length} جلسة مكتملة ⭐ {celebrationMap.reduce((s,n) => s + n.stars, 0)} نجمة
                          </span>
                        )}
                      </div>

                      {celebrationMap ? (
                        /* Real personalised map */
                        <ProgressMap sessions={celebrationMap} compact upcomingSlots={2} />
                      ) : (
                        /* Loading skeleton — 5 shimmer dots */
                        <div className="flex items-center gap-3 py-2">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="rounded-full flex-shrink-0 animate-pulse"
                              style={{
                                width:      i === 4 ? 28 : 44,
                                height:     i === 4 ? 28 : 44,
                                background: i === 4 ? '#E5E7EB' : 'rgba(99,102,241,0.15)',
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Exit button */}
                    <button
                      onClick={() => { setShowCelebration(false); setKidMode(false); setCelebrationMap(null) }}
                      className="w-full font-black text-white text-lg px-8 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95"
                      style={{
                        background:  'linear-gradient(135deg,#6366F1,#8B5CF6)',
                        boxShadow:   '0 8px 24px rgba(99,102,241,0.4)',
                      }}
                    >
                      ← وضع الأستاذ
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Full-screen map dialog — outside kidMode so it works in specialist view too */}
        {showMapDialog && sidebarMapSessions && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMapDialog(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxWidth: 380, width: '100%', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="font-black text-gray-800 text-base">🗺️ خارطة رحلة الطفل</span>
                <button
                  onClick={() => setShowMapDialog(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 font-black text-lg leading-none"
                >×</button>
              </div>
              <div className="flex gap-4 px-5 py-3 border-b border-gray-50 text-center">
                <div className="flex-1">
                  <div className="font-black text-gray-800 text-lg">{sidebarMapSessions.length}</div>
                  <div className="text-gray-400 text-[11px]">جلسة</div>
                </div>
                <div className="flex-1">
                  <div className="font-black text-amber-500 text-lg">{sidebarMapSessions.reduce((s,n) => s + n.stars, 0)}</div>
                  <div className="text-gray-400 text-[11px]">نجمة</div>
                </div>
                <div className="flex-1">
                  <div className="font-black text-indigo-600 text-lg">
                    {Math.round(sidebarMapSessions.reduce((s,n) => s + n.avgScore, 0) / sidebarMapSessions.length)}%
                  </div>
                  <div className="text-gray-400 text-[11px]">متوسط</div>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 px-4 py-4">
                {/* Live current-session progress card */}
                {(() => {
                  const curr = sidebarMapSessions.find(s => s.sessionId === id)
                  if (!curr) return null
                  const nextThreshold = curr.stars === 1 ? 60 : curr.stars === 2 ? 80 : 100
                  const pct = Math.min(100, Math.round((curr.avgScore / nextThreshold) * 100))
                  return (
                    <div
                      className="rounded-2xl p-3 mb-4 flex gap-3 items-center"
                      style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))', border: '1.5px solid rgba(99,102,241,0.15)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow"
                        style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
                      >
                        {curr.stars}★
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-gray-700">الجلسة الحالية</span>
                          <span className="text-xs font-black text-indigo-600">{curr.avgScore}% • {curr.gameCount} تمرين</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {curr.stars < 3 ? `${pct}% نحو النجمة ${curr.stars === 1 ? '★★' : '★★★'}` : '★★★ ممتاز!'}
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <ProgressMap sessions={sidebarMapSessions} upcomingSlots={3} />
              </div>
            </div>
          </div>
        )}

        {/* Main exercise area */}

        <main className={`flex-1 flex items-center justify-center bg-gray-950 relative overflow-auto ${chromeHidden ? '' : 'pb-20 lg:pb-0'} ${kidMode ? 'hidden' : ''}`}>

          {/* ── Embedded Jitsi iframe ── */}
          {jitsiEmbedded && jitsiEmbedUrl && (
            <div
              className="rounded-2xl overflow-hidden"
              style={
                (activeView || showWhiteboard || promptCard)
                  ? {
                      position: 'fixed',
                      bottom: 20,
                      left: 20,
                      width: 280,
                      height: 210,
                      zIndex: promptCard ? 320 : 60,
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
              {(activeView || showWhiteboard || promptCard) && (
                <button
                  onClick={() => setJitsiEmbedded(false)}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white font-bold text-xs px-2 py-1 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Start screen — readiness check then start */}
          {!jitsiEmbedded && !activeView && !running && (() => {
            const readyComplete = readySleep > 0 && readyEnergy > 0 && readyMood > 0
            const avgReady = readyComplete ? (readySleep + readyEnergy + readyMood) / 3 : 0
            const readyLevel = avgReady >= 3.8 ? 'high' : avgReady >= 2.5 ? 'medium' : avgReady > 0 ? 'low' : 'none'
            const readyColor = readyLevel === 'high' ? '#22C55E' : readyLevel === 'medium' ? '#F59E0B' : '#EF4444'
            const readyEmoji = readyLevel === 'high' ? '🚀' : readyLevel === 'medium' ? '🙂' : readyLevel === 'low' ? '⚠️' : '🎯'

            function handleStartWithReadiness() {
              if (readyComplete) {
                const newDiff = avgReady >= 3.8 ? 3 : avgReady >= 2.5 ? 2 : 1
                setDifficulty(newDiff as 1|2|3)
              }
              setReadyDone(true)
              startSession()
            }

            const SCALE_OPTS = [
              ['1', '😴'], ['2', '😐'], ['3', '🙂'], ['4', '⚡'], ['5', '🌟'],
            ]

            const READY_COLORS = ['#EF4444','#F97316','#F59E0B','#22C55E','#3B82F6']

            return (
              <div className="absolute inset-0 overflow-y-auto">
                {/* Warm decorative background — replaces the dark console look for this child-facing screen */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(160deg, #FFF8F0 0%, #FFF3E8 45%, #F3EEFF 100%)' }}
                >
                  <div className="absolute text-4xl opacity-40 animate-float" style={{ top: '9%', left: '8%' }}>⭐</div>
                  <div className="absolute text-5xl opacity-30 animate-float" style={{ top: '16%', right: '9%', animationDelay: '1.1s' }}>☁️</div>
                  <div className="absolute text-3xl opacity-35 animate-bounce-soft" style={{ bottom: '16%', left: '11%', animationDelay: '0.4s' }}>🎈</div>
                  <div className="absolute text-4xl opacity-25 animate-float" style={{ bottom: '24%', right: '13%', animationDelay: '0.7s' }}>✨</div>
                </div>

                {/* min-h-full (not items-center on the scroll container itself) so tall content
                    grows the box instead of being centered-and-clipped above the scrollable area */}
                <div className="relative min-h-full flex items-center justify-center py-4">
                <div className="relative w-full max-w-sm mx-auto px-4" dir="rtl">
                  {/* Pre-session phase duration control */}
                  <div
                    className="mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white/80 border border-brand-100 shadow-sm backdrop-blur-sm"
                  >
                    <span className="text-gray-400 text-[10px] font-black flex-shrink-0">مراحل الجلسة</span>
                    <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                      {SESSION_PHASES.map((ph, i) => (
                        <span
                          key={ph.id}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ltr-num"
                          style={{ background: `${ph.color}15`, color: ph.color }}
                        >
                          {ph.icon} {phaseDurations[i]}د
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowPhaseEdit(true)}
                      className="text-gray-400 hover:text-brand-600 text-[11px] font-black flex-shrink-0 px-1.5 transition-colors"
                      title="تعديل مدة المراحل قبل البدء"
                    >
                      ⚙ تعديل
                    </button>
                  </div>
                  {!readyDone ? (
                    <div className="rounded-[2rem] overflow-hidden bg-white shadow-brand-xl border-2 border-brand-100 animate-slide-up">
                      {/* Top rainbow bar */}
                      <div className="h-2" style={{ background: 'linear-gradient(90deg, #FFBA44, #FF8C65, #7C5CFC, #2ABFA3)' }} />

                      <div className="p-6">
                        {/* Header */}
                        <div className="text-center mb-6">
                          <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-3 animate-bounce-soft"
                            style={{
                              background: 'linear-gradient(135deg, #FFBA44, #FF8C65)',
                              boxShadow: '0 10px 28px rgba(255,140,101,0.35)',
                            }}
                          >
                            <span className="text-3xl">📋</span>
                          </div>
                          <h2 className="text-gray-900 font-black text-xl tracking-tight">تقييم الجاهزية</h2>
                          <p className="text-gray-400 text-xs mt-1">3 أسئلة سريعة وممتعة قبل أن نبدأ! 🌈</p>

                          {/* Progress dots */}
                          <div className="flex justify-center gap-2 mt-3">
                            {[readySleep, readyEnergy, readyMood].map((v, i) => (
                              <div
                                key={i}
                                className="rounded-full transition-all duration-300"
                                style={{
                                  width: v > 0 ? 20 : 8,
                                  height: 8,
                                  background: v > 0 ? 'linear-gradient(90deg,#FF8C65,#FFBA44)' : '#F3EEFF',
                                  boxShadow: v > 0 ? '0 0 8px rgba(255,140,101,0.4)' : 'none',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Questions */}
                        {[
                          { label: 'نوم الطفل الليلة؟',   val: readySleep,  set: setReadySleep,  icons: ['😴','😟','😐','🙂','🌟'] },
                          { label: 'طاقة الطفل الآن؟',    val: readyEnergy, set: setReadyEnergy, icons: ['🔋','😐','🙂','⚡','🚀'] },
                          { label: 'مزاجه عند الدخول؟',   val: readyMood,   set: setReadyMood,   icons: ['😢','😟','😐','🙂','😄'] },
                        ].map(({ label, val, set, icons }) => (
                          <div key={label} className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-gray-700 text-sm font-bold">{label}</p>
                              {val > 0 && (
                                <span
                                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                  style={{ background: `${READY_COLORS[val-1]}18`, color: READY_COLORS[val-1] }}
                                >
                                  {val}/5
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {icons.map((icon, i) => (
                                <button
                                  key={i}
                                  onClick={() => set(i + 1)}
                                  className="flex-1 flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-90"
                                  style={{
                                    height: 60,
                                    fontSize: '1.75rem',
                                    background: val === i + 1
                                      ? `linear-gradient(135deg, ${READY_COLORS[i]}26, ${READY_COLORS[i]}12)`
                                      : '#FFF8F0',
                                    border: val === i + 1
                                      ? `2px solid ${READY_COLORS[i]}`
                                      : '2px solid #F3EEFF',
                                    boxShadow: val === i + 1
                                      ? `0 8px 20px ${READY_COLORS[i]}35`
                                      : 'none',
                                    transform: val === i + 1 ? 'scale(1.12) translateY(-2px)' : 'scale(1)',
                                  }}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Result banner */}
                        {readyComplete && (
                          <div
                            className="text-center py-4 px-4 rounded-2xl mb-5 transition-all duration-500 animate-pop"
                            style={{
                              background: `linear-gradient(135deg, ${readyColor}18, ${readyColor}08)`,
                              border: `2px solid ${readyColor}40`,
                            }}
                          >
                            <div className="text-4xl mb-1.5">{readyEmoji}</div>
                            <p className="font-black text-sm" style={{ color: readyColor }}>
                              {readyLevel === 'high' ? 'جاهزية ممتازة!' : readyLevel === 'medium' ? 'جاهزية جيدة' : 'يحتاج دعماً'}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              {readyLevel === 'high' ? 'سنبدأ بمستوى متقدم' : readyLevel === 'medium' ? 'مستوى متوسط مناسب' : 'سنبدأ بمستوى سهل'}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setReadyDone(true); startSession() }}
                            className="flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-95 bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
                          >
                            تخطّ ←
                          </button>
                          <button
                            onClick={handleStartWithReadiness}
                            disabled={!readyComplete}
                            className="flex-[2] py-3.5 rounded-2xl text-sm font-black text-white transition-all duration-200 active:scale-95"
                            style={readyComplete ? {
                              background: 'linear-gradient(135deg, #2ABFA3, #10B981)',
                              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                            } : {
                              background: '#F3EEFF',
                              color: '#C4B5FD',
                            }}
                          >
                            {readyComplete ? '▶ ابدأ الجلسة' : 'أجب على الأسئلة أولاً'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div
                        className="inline-flex items-center justify-center w-28 h-28 rounded-[2rem] mb-6 animate-float"
                        style={{
                          background: 'linear-gradient(135deg, #B99AFF, #7C5CFC)',
                          boxShadow: '0 16px 40px rgba(124,92,252,0.35)',
                          fontSize: '3.25rem',
                        }}
                      >
                        🎯
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">جاهز للجلسة؟ 🎉</h2>
                      <p className="text-gray-400 text-sm mb-8">اضغط لبدء تشغيل التمارين</p>
                      <button
                        onClick={startSession}
                        className="text-white font-black px-10 py-4 rounded-[1.75rem] text-lg transition-all active:scale-95 animate-bounce-soft"
                        style={{
                          background: 'linear-gradient(135deg, #2ABFA3, #10B981)',
                          boxShadow: '0 12px 32px rgba(16,185,129,0.4)',
                        }}
                      >
                        ▶ ابدأ الجلسة
                      </button>
                    </div>
                  )}
                </div>
                </div>
              </div>
            )
          })()}

          {/* Idle screen — hidden when Jitsi is embedded */}
          {!jitsiEmbedded && !activeView && running && (
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-white/40">اختر تمريناً من القائمة</p>
              <button
                onClick={() => setShowMobilePanel(true)}
                className="lg:hidden mt-4 bg-brand-600 hover:bg-brand-500 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                🎮 اختر تمريناً
              </button>
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
            <div key={`${activeView.id}-${exerciseRestartNonce}`} className="w-full max-w-2xl mx-auto py-6">
              {activeView.id === 'memory-cards'    && <MemoryCards onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'sequence-memory' && <SequenceMemory onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'n-back'          && <NBackTask onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'word-recall'     && <WordRecall onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'breathing'       && <BreathingGuide onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'tap-target'      && <TapTarget onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'simon-says'      && <SimonSays onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'letter-match'    && <LetterMatch    onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'reaction-game'  && <ReactionGame   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'stroop-test'    && <StroopTest     onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'stop-signal'    && <StopSignal     onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'emotion-cards'     && <EmotionCards      onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'token-board'       && <TokenBoard        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'self-rating'       && <SelfRating        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'verbal-fluency'    && <VerbalFluency     onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'social-scenarios'  && <SocialScenarios   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'behavior-contract' && <BehaviorContract  onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'color-grid'       && <ColorGrid         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'pattern-match'    && <PatternMatch      onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'word-builder'            && <WordBuilder            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'auditory-memory'        && <AuditoryMemory        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'listening-comprehension'&& <ListeningComprehension onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'picture-word-cards'     && <PictureWordCards       onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'number-sequence'        && <NumberSequence         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'shadow-match'           && <ShadowMatch            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'story-sequencing'       && <StorySequencing        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'waiting-game'           && <WaitingGame            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'social-problem-solving' && <SocialProblemSolving   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'visual-search'         && <VisualSearch          onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'odd-one-out'           && <OddOneOut             onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'sustained-attention'   && <SustainedAttention    onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'flash-count'           && <FlashCount            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'number-search'         && <NumberSearch          onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'go-no-go'              && <GoNoGo                onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'balloon-control'       && <BalloonControl        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'traffic-light'         && <TrafficLight          onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'emotion-mirror'        && <EmotionMirror         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'conversation-starter'  && <ConversationStarter   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'sound-discrimination'  && <SoundDiscrimination   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'rhyme-detection'       && <RhymeDetection        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'audio-sequence'        && <AudioSequenceRepeat   onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'sequence-tap'          && <SequenceTap           onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'target-tracking'       && <TargetTracking        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'finger-gym'            && <FingerGym             onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'category-sort'         && <CategorySort          onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'math-flash'            && <MathFlash             onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'analogies'             && <AnalogiesGame         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'body-scan'             && <BodyScan              onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'mood-meter'            && <MoodMeter             onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'calm-corner'           && <CalmCorner            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'emotion-volume'        && <EmotionVolume         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'daily-goals'           && <DailyGoals            onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'choice-board'          && <ChoiceBoard           onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'pattern-puzzle'        && <PatternPuzzle         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'if-then'               && <IfThen                onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'problem-solver'        && <ProblemSolver         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'spelling-bee'          && <SpellingBee           onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'reading-cards'         && <ReadingCards          onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'span-extension'        && <SpanExtension         onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'direction-follow'      && <DirectionFollow       onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'logic-sort'            && <LogicSort             onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {/* ── Autism exercises ── */}
              {activeView.id === 'visual-match'          && <VisualMatch           onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'visual-schedule'       && <VisualSchedule        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'first-then-board'      && <FirstThenBoard        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'imitation-mirror'      && <ImitationMirror       onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {activeView.id === 'sensory-checkin'      && <SensoryCheckIn        onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />}
              {/* ── Physical exercises ── */}
              {['jumping-jacks','obstacle-circuit','balance-walk','tiger-crawl','ball-throw','stretching','body-percussion'].includes(activeView.id) && (
                <PhysicalExercise id={activeView.id} onComplete={handleExerciseComplete} onCancel={handleCancel} studentAge={studentAge} difficulty={activeDifficulty} />
              )}
            </div>
          )}

          {/* ── Restart the active exercise mid-game without exiting it ──
              Stacked just below the screen-size toggle on the vertical mid-left edge.
              Tried top-right first, then mid-right: both collided — top-right with the
              header's own title/close icon once the specialist used the manual toggle to
              bring chrome back mid-exercise (header spans the full top edge), mid-right
              with the right-side exercises sidebar (also full-height when chrome is
              shown). The mid-left edge is the one spot clear in every combination of
              chrome-shown/hidden × exercise-active — see the toggle button's comment
              above for the full reasoning. */}
          {exerciseActive && !showWhiteboard && (
            <button
              onClick={() => setExerciseRestartNonce(n => n + 1)}
              className="fixed z-[80] left-3 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 hover:scale-105 shadow-lg"
              style={{ top: 'calc(50% + 26px)', transform: 'translateY(-50%)', background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.12)' }}
              title="إعادة هذا التمرين من البداية"
            >
              <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
          )}

          {/* ── Whiteboard — overlays on top of an active exercise (instead of
              requiring !activeView) so opening it mid-exercise actually shows it
              instead of leaving the exercise visible underneath unchanged. The
              exercise component stays mounted behind the overlay, so closing the
              whiteboard returns to it exactly where the specialist left off. ── */}
          {showWhiteboard && (
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
                    onCancel={handleCancel}
                  />
                )}
                {activeView.id === 'attention-domains' && (
                  <AttentionDomainsScale
                    studentId={currentStudentId || id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={handleCancel}
                  />
                )}
                {activeView.id === 'learning-difficulties' && (
                  <LearningDifficultiesScale
                    studentId={currentStudentId || id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={handleCancel}
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

      <AbcLogPanel
        running={running}
        chromeHidden={chromeHidden}
        abcOpen={abcOpen}
        onToggle={() => { setAbcOpen(o => !o); setObsOpen(false); setHwOpen(false) }}
        abcForm={abcForm}
        onChangeForm={setAbcForm}
        abcLog={abcLog}
        onLog={logABC}
      />

      <HomeworkPanel
        running={running}
        currentStudentId={currentStudentId}
        chromeHidden={chromeHidden}
        hwOpen={hwOpen}
        onToggle={() => { setHwOpen(o => !o); setAbcOpen(false); setObsOpen(false) }}
        hwSelected={hwSelected}
        setHwSelected={setHwSelected}
        hwNote={hwNote}
        setHwNote={setHwNote}
        hwSent={hwSent}
        hwSending={hwSending}
        studentAge={studentAge}
        onSend={sendHomework}
      />

      <QuickObsPanel
        running={running}
        chromeHidden={chromeHidden}
        obsOpen={obsOpen}
        onToggle={() => setObsOpen(o => !o)}
        obsLog={obsLog}
        onLog={logObs}
        elapsed={elapsed}
      />

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

      {/* Assessment Save Failure Toast */}
      {assessmentSaveFailed && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-none" dir="rtl">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{
              background: '#1F2937',
              border: '1.5px solid rgba(239,68,68,0.4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.2)',
            }}
          >
            <span className="text-rose-400">⚠</span>
            <span className="text-white font-bold text-sm">فشل حفظ التقييم — حاول مرة أخرى من تبويب التقييمات</span>
          </div>
        </div>
      )}

      {/* Light star-burst between exercises — quick, non-blocking, most fun in Kid Mode */}
      {miniCelebrate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
          {['⭐','✨','🌟','💫','⭐','✨'].map((star, i) => {
            const angle = (i / 6) * 360
            const dist = 90
            return (
              <span
                key={i}
                className="absolute text-3xl animate-in fade-in zoom-in duration-700"
                style={{
                  transform: `translate(${Math.cos((angle * Math.PI) / 180) * dist}px, ${Math.sin((angle * Math.PI) / 180) * dist}px)`,
                  animationDelay: `${i * 40}ms`,
                }}
              >
                {star}
              </span>
            )
          })}
        </div>
      )}

      {/* Before/After Comparison Toast (#10) */}
      {compareToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[95] pointer-events-none" dir="rtl">
          <div
            className="rounded-2xl px-5 py-4 shadow-2xl"
            style={{ background: '#1F2937', border: '1.5px solid rgba(255,255,255,0.12)', minWidth: 280 }}
          >
            <div className="text-white/50 text-[10px] font-black mb-2 uppercase tracking-wider">
              📊 مقارنة قبل/بعد — {compareToast.curr.exerciseLabelAr}
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div className="text-center">
                <div className="text-white/40 text-[10px] mb-1">قبل</div>
                <div
                  className="font-black text-2xl ltr-num"
                  style={{ color: compareToast.prev.score >= 80 ? '#22C55E' : compareToast.prev.score >= 60 ? '#F59E0B' : '#EF4444' }}
                >
                  {compareToast.prev.score}%
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="font-black text-lg"
                  style={{ color: compareToast.curr.score > compareToast.prev.score ? '#22C55E' : compareToast.curr.score < compareToast.prev.score ? '#EF4444' : '#9CA3AF' }}
                >
                  {compareToast.curr.score > compareToast.prev.score ? '↑' : compareToast.curr.score < compareToast.prev.score ? '↓' : '='}
                </div>
                <div
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: compareToast.curr.score > compareToast.prev.score ? 'rgba(34,197,94,0.15)' : compareToast.curr.score < compareToast.prev.score ? 'rgba(239,68,68,0.15)' : 'rgba(156,163,175,0.15)',
                    color: compareToast.curr.score > compareToast.prev.score ? '#22C55E' : compareToast.curr.score < compareToast.prev.score ? '#EF4444' : '#9CA3AF',
                  }}
                >
                  {compareToast.curr.score > compareToast.prev.score
                    ? `+${compareToast.curr.score - compareToast.prev.score}%`
                    : compareToast.curr.score < compareToast.prev.score
                    ? `${compareToast.curr.score - compareToast.prev.score}%`
                    : 'نفس الأداء'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/40 text-[10px] mb-1">بعد</div>
                <div
                  className="font-black text-2xl ltr-num"
                  style={{ color: compareToast.curr.score >= 80 ? '#22C55E' : compareToast.curr.score >= 60 ? '#F59E0B' : '#EF4444' }}
                >
                  {compareToast.curr.score}%
                </div>
              </div>
            </div>
            {compareToast.curr.score > compareToast.prev.score && (
              <div className="text-center text-green-400 font-black text-sm mt-2">تحسّن رائع! 🎉</div>
            )}
          </div>
        </div>
      )}

      {/* Phase Transition Toast */}
      {phaseToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none" style={{ top: toastTop }} dir="rtl">
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

      <PhaseDurationModal
        show={showPhaseEdit}
        onClose={() => setShowPhaseEdit(false)}
        phases={SESSION_PHASES}
        phaseDurations={phaseDurations}
        onChangeDurations={setPhaseDurations}
      />

      <ExerciseConfigModal
        exerciseConfigId={exerciseConfigId}
        onClose={() => setExerciseConfigId(null)}
        difficulty={difficulty}
        exerciseDiffOverrides={exerciseDiffOverrides}
        onChangeDiffOverride={(id, value) => {
          if (value === null) {
            setExerciseDiffOverrides(prev => { const next = { ...prev }; delete next[id]; return next })
          } else {
            setExerciseDiffOverrides(prev => ({ ...prev, [id]: value }))
          }
        }}
        results={results}
        gameHistoryByGame={gameHistoryByGame}
        gameUsageCounts={gameUsageCounts}
        running={running}
        onStart={startSession}
        onSetActiveView={setActiveView}
      />

      <VideoLibraryModal
        videoModal={videoModal}
        onClose={() => setVideoModal(null)}
        videoUrls={videoUrls}
        onChangeUrl={(id, url) => setVideoUrls(prev => ({ ...prev, [id]: url }))}
        videoIframeLoading={videoIframeLoading}
        onIframeLoad={() => setVideoIframeLoading(false)}
      />

      {/* Kid-mode star counter overlay */}
      <SessionStarCounter
        running={running}
        results={results}
        gameHistoryByGame={gameHistoryByGame}
        kidMode={kidMode}
      />

      {/* Adaptive difficulty toast — specialist-facing, shown 4 s after exercise completion */}
      {adaptiveToast && (
        <div
          className="fixed z-[110] pointer-events-auto"
          style={{ bottom: 96, left: '50%', transform: 'translateX(-50%)' }}
          dir="rtl"
        >
          <div
            className="toast-enter flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl"
            style={{
              background: '#111827',
              border: `2px solid ${adaptiveToast.reason === 'excellent' ? '#22C55E' : '#F59E0B'}`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.55)`,
              minWidth: 280,
            }}
          >
            <span className="text-2xl">{adaptiveToast.reason === 'excellent' ? '🚀' : '🛟'}</span>
            <div className="flex-1">
              <p className="text-white font-black text-sm">{adaptiveToast.label}</p>
              <p className="text-white/60 text-xs mt-0.5">
                {adaptiveToast.reason === 'excellent'
                  ? `أداء ممتاز — رُفع المستوى تلقائياً إلى ${adaptiveToast.newLevel === 2 ? 'متوسط' : 'صعب'} 📈`
                  : `مستوى مُكيَّف — خُفِّض إلى ${adaptiveToast.newLevel === 1 ? 'سهل' : 'متوسط'} لراحة الطفل 💛`
                }
              </p>
            </div>
            <button
              onClick={() => {
                setExerciseDiffOverrides(prev => { const n = { ...prev }; delete n[adaptiveToast.exerciseId]; return n })
                setAdaptiveToast(null)
              }}
              className="text-white/40 hover:text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              تراجع
            </button>
          </div>
        </div>
      )}

      {/* Achievement Toast */}
      {achievementToast && (() => {
        const tierColor = achievementToast.icon === '🏆' ? '#FFBA44' : achievementToast.icon === '⭐' ? '#7C5CFC' : '#2ABFA3'
        return (
          <div className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none" style={{ top: toastTop }}>
            <div
              className="toast-enter rounded-2xl px-7 py-5 flex items-center gap-4"
              style={{
                background: '#111827',
                border: `2px solid ${tierColor}`,
                boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 32px ${tierColor}66`,
              }}
            >
              <span className="text-5xl animate-bounce">{achievementToast.icon}</span>
              <div>
                <p className="text-white font-black text-xl">{achievementToast.message}</p>
                <p className="font-bold text-sm" style={{ color: tierColor }}>إنجاز رائع! 🎉</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
