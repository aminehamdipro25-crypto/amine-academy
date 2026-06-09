'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, X, Save, Video, Star, ClipboardList } from 'lucide-react'
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
import ADHDScale       from '@/components/session/assessments/ADHDScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'

type ActiveView =
  | { type: 'exercise'; id: string }
  | { type: 'assessment'; id: string }
  | null

const EXERCISES = [
  { id:'memory-cards',    labelAr:'مطابقة البطاقات',         icon:'🃏', category:'ذاكرة',      color:'bg-purple-900/40 border-purple-500' },
  { id:'sequence-memory', labelAr:'تذكر التسلسل',            icon:'🔢', category:'ذاكرة',      color:'bg-blue-900/40 border-blue-500' },
  { id:'n-back',          labelAr:'ذاكرة N-Back',             icon:'🧩', category:'ذاكرة',      color:'bg-indigo-900/40 border-indigo-500' },
  { id:'word-recall',     labelAr:'تذكر الكلمات',             icon:'📝', category:'ذاكرة',      color:'bg-violet-900/40 border-violet-500' },
  { id:'breathing',       labelAr:'تمارين التنفس',            icon:'🌬️', category:'تنفس',       color:'bg-cyan-900/40 border-cyan-500' },
  { id:'tap-target',      labelAr:'التناسق الحركي',           icon:'🎯', category:'حركي',       color:'bg-orange-900/40 border-orange-500' },
  { id:'simon-says',      labelAr:'سايمون يقول',              icon:'🎨', category:'إدراكي',     color:'bg-green-900/40 border-green-500' },
  { id:'letter-match',    labelAr:'مطابقة الحروف',            icon:'🔤', category:'صعوبات التعلم', color:'bg-amber-900/40 border-amber-500'  },
  { id:'reaction-game',   labelAr:'سرعة رد الفعل',            icon:'⚡', category:'حركي',          color:'bg-yellow-900/40 border-yellow-500' },
  { id:'stroop-test',     labelAr:'ستروب — كبح الاستجابة',    icon:'🎨', category:'انتباه',         color:'bg-rose-900/40 border-rose-500'     },
  { id:'stop-signal',     labelAr:'توقف أو اكمل',             icon:'🛑', category:'اندفاعية',       color:'bg-red-900/40 border-red-500'       },
  { id:'emotion-cards',   labelAr:'التعرف على المشاعر',       icon:'🎭', category:'اجتماعي',        color:'bg-pink-900/40 border-pink-500'     },
]

const ASSESSMENTS = [
  { id:'adhd',                labelAr:'مقياس ADHD',             icon:'⚡', color:'bg-blue-900/40 border-blue-500' },
  { id:'learning-difficulties', labelAr:'صعوبات التعلم',       icon:'📚', color:'bg-amber-900/40 border-amber-500' },
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
  const [profile, setProfile] = useState<StudentAssessmentProfile | null>(null)
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null)
  const [currentStudentId, setCurrentStudentId] = useState<string>('')
  const [appointmentType, setAppointmentType] = useState<string>('')
  const [studentDiagnosis, setStudentDiagnosis] = useState<string>('')
  const [studentSeverity, setStudentSeverity] = useState<number>(1)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [gameUsageCounts, setGameUsageCounts] = useState<Record<string, number>>({})

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

  const [jitsiOpen, setJitsiOpen] = useState(false)
  const jitsiWindowRef = useRef<Window | null>(null)

  function openJitsiPopup() {
    if (jitsiWindowRef.current && !jitsiWindowRef.current.closed) {
      jitsiWindowRef.current.focus()
      return
    }
    const w = 480, h = 380
    const left = window.screenX + window.outerWidth - w - 20
    const top  = window.screenY + 60
    const popup = window.open(
      jitsiUrl!,
      'jitsi-meeting',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,toolbar=no,menubar=no,location=no`
    )
    jitsiWindowRef.current = popup
    setJitsiOpen(true)
    const check = setInterval(() => {
      if (popup?.closed) { setJitsiOpen(false); clearInterval(check) }
    }, 1000)
  }


  // Timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  function startSession() {
    setRunning(true)
    startRef.current = Date.now()
  }

  function handleExerciseComplete(result: ExerciseResult) {
    setResults(r => [...r, result])
    setActiveView(null)
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
          studentId: id,
          therapistNotes: notes,
          observations,
          exercises: results,
          durationSeconds: elapsed,
          highlights: results.filter(r => r.score >= 80).map(r => `${r.exerciseLabelAr}: ${r.score}%`),
        }),
      })
      setSaved(true)
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-white text-sm">
                {studentName || 'جلسة تفاعلية'}
              </h1>
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
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            running ? 'bg-green-900/40 border border-green-500/40' : 'bg-white/5 border border-white/10'
          }`}>
            <Clock className="w-4 h-4 text-green-400" />
            <span className="font-black text-lg ltr-num">{formatTime(elapsed)}</span>
          </div>

          {jitsiUrl && (
            <button
              onClick={openJitsiPopup}
              className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
                jitsiOpen
                  ? 'bg-green-500 text-white ring-2 ring-green-400/50 animate-pulse'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
              title="فتح نافذة المقابلة — ضعها في زاوية الشاشة وشارك نافذة الجلسة"
            >
              <Video className="w-3.5 h-3.5" />
              {jitsiOpen ? 'المقابلة مفتوحة ●' : 'فتح المقابلة'}
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

          <button onClick={saveSession} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}>
            <Save className="w-4 h-4" />
            {saving ? 'جار الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ'}
          </button>
        </div>
      </header>

      {/* Screen-share tip — shown only when Jitsi popup is open */}
      {jitsiOpen && (
        <div className="bg-green-900/40 border-b border-green-500/30 px-4 py-2 flex items-center justify-between gap-4">
          <p className="text-green-300 text-xs font-bold flex items-center gap-2">
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            نافذة المقابلة مفتوحة — لمشاركة شاشتك مع الطالب: في Jitsi اختر
            <span className="bg-green-800/60 rounded px-1.5 py-0.5 font-black">Share Screen</span>
            ثم اختر نافذة المتصفح هذه (الجلسة) وليس النافذة الصغيرة
          </p>
          <button onClick={() => { jitsiWindowRef.current?.focus() }}
            className="text-green-400 text-xs font-bold hover:text-green-300 whitespace-nowrap">
            إظهار النافذة ↗
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-72 bg-gray-900 border-l border-white/10 flex flex-col">
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
            {tab === 'exercises' && sortedExercises.map((ex, idx) => {
              const isTop = topGames.includes(ex.id)
              const isActive = activeView?.type === 'exercise' && activeView.id === ex.id
              const isFirst = topGames.length > 0 && idx === 0
              return (
                <div key={ex.id}>
                  {isFirst && (
                    <div className="text-[10px] font-black text-brand-400 px-1 pb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> موصى بها لهذا الطالب
                    </div>
                  )}
                  {!isTop && idx === topGames.length && topGames.length > 0 && (
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
                    `}>
                    <span className="text-xl">{ex.icon}</span>
                    <div className="text-right flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-white font-bold text-xs truncate">{ex.labelAr}</div>
                        {isTop && <Star className="w-3 h-3 text-brand-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-white/40 text-[10px]">{ex.category}</span>
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
                {results.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">لم تبدأ أي تمرين بعد</p>
                )}
                {results.map((r, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-black ${r.score >= 80 ? 'text-green-400' : r.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {r.score}%
                      </span>
                      <span className="text-white/70 text-xs font-bold">{r.exerciseLabelAr}</span>
                    </div>
                    <ScoreBar score={r.score}
                      color={r.score >= 80 ? 'bg-green-500' : r.score >= 60 ? 'bg-amber-500' : 'bg-red-500'} />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-white/30 text-xs">{r.duration}ث</span>
                      <span className="text-white/30 text-xs">دقة: {r.accuracy}%</span>
                    </div>
                  </div>
                ))}

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
        </aside>

        {/* Main exercise area */}
        <main className="flex-1 flex items-center justify-center bg-gray-950 relative overflow-auto">
          {!activeView && !running && (
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

          {!activeView && running && (
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
              {activeView.id === 'emotion-cards'  && <EmotionCards   onComplete={handleExerciseComplete} onCancel={() => setActiveView(null)} studentAge={studentAge} difficulty={difficulty} />}
            </div>
          )}

          {activeView?.type === 'assessment' && (
            <div className="w-full max-w-2xl mx-auto py-6 px-4">
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                {activeView.id === 'adhd' && (
                  <ADHDScale
                    studentId={id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={() => setActiveView(null)}
                  />
                )}
                {activeView.id === 'learning-difficulties' && (
                  <LearningDifficultiesScale
                    studentId={id || ''}
                    onComplete={handleAssessmentComplete}
                    onCancel={() => setActiveView(null)}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
