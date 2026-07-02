'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, Play, X, Clock, LogOut, Star, Volume2, Film, List } from 'lucide-react'
import type { Exercise, Student } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

// ── Video lookup by exercise English title (stable key, unlike the random AE-xxx-xxx ID) ──
const TITLE_VIDEOS: Record<string, string> = {
  // Focus / Breathing
  'Bubble Breathing':                        '9zXVFK6RTnw',
  'Box Breathing 4-4-4-4':                  '9zXVFK6RTnw',
  'Zone of Regulation Body Check-In':        'frN2YcB63NA',
  'Stop & Listen Game':                      'hSsGS8Sec_0',
  'Target Toss Focus':                       'BBlaaSKP4HM',
  'Visual Tracking Trail':                   'mEalRQjsGqA',
  'Motor Sequencing Challenge':              'D3oRmGx7MVM',
  'Focused Listening Protocol':              'BBlaaSKP4HM',
  'Attention Rebuild Protocol':              '9zXVFK6RTnw',
  'Distraction Inoculation Training':        'dZd5X2MpxhQ',
  'Reverse Sequence Challenge':              'LdxAMNLZpFU',
  'Task Tower: Breaking Down Goals':         '8ttJ37GsF8Q',
  'Mindful Movement: Walking Meditation':    'QeVh3NVfa0k',
  'Reaction Time Training':                  'mEalRQjsGqA',
  'Digital Tracking & Scan':                 'mEalRQjsGqA',
  'Simon Says — Advanced Inhibition':        'hSsGS8Sec_0',
  'Anger Thermometer & Cool-Down Protocol':  '0AFRnZEkqq4',
  // Motor
  'Animal Walk Circuit':                     'mePc87XdsIE',
  'Rhythm Coordination Drill':               'MC4rQKU9cEk',
  'Rhythmic Beat Synchronization':           'MC4rQKU9cEk',
  'Jumping Jacks':                           'mePc87XdsIE',
  'Balloon Keep-Up Challenge':               'Xc3DQ7XuSWY',
  'Ball Throw & Catch':                      'Xc3DQ7XuSWY',
  'Cross-Lateral Crawl':                     'SBNxJuEXDyc',
  'Obstacle Circuit':                        'mePc87XdsIE',
  'Obstacle Navigation Course':              'mePc87XdsIE',
  'Adapted Swimming Program':                'SBNxJuEXDyc',
  'Stretching & Flexibility':                'QeVh3NVfa0k',
  'Body Percussion':                         'MC4rQKU9cEk',
  // Balance
  'Balance Beam Walk':                       'KwjBGh7khco',
  'Balance Walk':                            'KwjBGh7khco',
  'Kids Yoga Flow — Focus & Calm':           'QeVh3NVfa0k',
  // Sensory
  'Sensory Body Scan':                       'JL_22TU80Hs',
  'Progressive Muscle Relaxation':           'lAgnqQ3sbwk',
  'Deep Pressure & Proprioceptive Reset':    'SBNxJuEXDyc',
  'Animal Sound Discrimination':             'JL_22TU80Hs',
  '5-4-3-2-1 Grounding Technique':          'lAgnqQ3sbwk',
  // Social
  'Mirror Movement Game':                    'PDjIzdLXK80',
  'Cooperative Ball Pass':                   'ANwBmsfywkA',
  'Token Economy Daily Chart':               'FzEI_fJYmFI',
  'Social Story: The Classroom Transition':  'ejjM1Apj56c',
  'PEERS Conversation Entry Protocol':       'ANwBmsfywkA',
  'Daily Routine Mastery':                   'gIDaj-5wFwU',
  // Energy
  'Mindful Strength Circuit':                'MC4rQKU9cEk',
}

const CATEGORY_VIDEOS: Record<string, string> = {
  motor:   'mePc87XdsIE',
  focus:   '9zXVFK6RTnw',
  balance: 'KwjBGh7khco',
  sensory: 'JL_22TU80Hs',
  energy:  'MC4rQKU9cEk',
  social:  'ANwBmsfywkA',
}

function getVideoId(ex: { title: string; category: string; videoUrl?: string }): string | null {
  if (ex.videoUrl) {
    const m = ex.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
    if (/^[a-zA-Z0-9_-]{11}$/.test(ex.videoUrl)) return ex.videoUrl
  }
  return TITLE_VIDEOS[ex.title] || CATEGORY_VIDEOS[ex.category] || null
}

// ── Exercise card visuals ─────────────────────────────────────
const GAME_CFG: Record<string, { gradient: string; icon: string }> = {
  'memory-cards':    { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🃏' },
  'sequence-memory': { gradient: 'linear-gradient(135deg,#3B9EFF,#60B4FF)', icon: '🔢' },
  'n-back':          { gradient: 'linear-gradient(135deg,#6B46F0,#8B66F0)', icon: '🧩' },
  'word-recall':     { gradient: 'linear-gradient(135deg,#7C5CFC,#B99AFF)', icon: '📝' },
  'breathing':       { gradient: 'linear-gradient(135deg,#2ABFA3,#4DD4BD)', icon: '🌬️' },
  'calm-corner':     { gradient: 'linear-gradient(135deg,#06B6D4,#38BDF8)', icon: '🧘' },
  'jumping-jacks':   { gradient: 'linear-gradient(135deg,#F97316,#FB923C)', icon: '⭐' },
  'stretching':      { gradient: 'linear-gradient(135deg,#84CC16,#A3E635)', icon: '🤸' },
  'balance-walk':    { gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', icon: '🚶' },
  'tiger-crawl':     { gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)', icon: '🐯' },
  'body-scan':       { gradient: 'linear-gradient(135deg,#14B8A6,#2DD4BF)', icon: '🌟' },
  'emotion-cards':   { gradient: 'linear-gradient(135deg,#EC4899,#F472B6)', icon: '🎭' },
  'token-board':     { gradient: 'linear-gradient(135deg,#6366F1,#818CF8)', icon: '🏅' },
  'traffic-light':   { gradient: 'linear-gradient(135deg,#EF4444,#FCD34D)', icon: '🚦' },
  'stop-signal':     { gradient: 'linear-gradient(135deg,#EF4444,#F87171)', icon: '🛑' },
  'tap-target':      { gradient: 'linear-gradient(135deg,#FF8C65,#FFAA88)', icon: '🎯' },
  'simon-says':      { gradient: 'linear-gradient(135deg,#10B981,#34D399)', icon: '🎨' },
  'letter-match':    { gradient: 'linear-gradient(135deg,#FFBA44,#FFD080)', icon: '🔤' },
  'reaction-game':   { gradient: 'linear-gradient(135deg,#FF6B6B,#FF9999)', icon: '⚡' },
  'stroop-test':     { gradient: 'linear-gradient(135deg,#FF6B6B,#FF8C65)', icon: '🎨' },
}
const CAT_CFG: Record<string, { gradient: string; icon: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#FFAA88)', icon: '🏃' },
  focus:   { gradient: 'linear-gradient(135deg,#3B9EFF,#60B4FF)', icon: '🎯' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#4DD4BD)', icon: '🌊' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#FFD080)', icon: '⚡' },
  sensory: { gradient: 'linear-gradient(135deg,#FF6B6B,#FF9999)', icon: '🌈' },
  social:  { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🤝' },
}

// ── Audio ─────────────────────────────────────────────────────
function playChime(type: 'start' | 'step' | 'complete') {
  if (typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    if (type === 'complete') {
      // Joyful ascending arpeggio C5-E5-G5-C6
      ;[523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.connect(gain)
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.28, ctx.currentTime + i * 0.13)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.35)
        osc.start(ctx.currentTime + i * 0.13)
        osc.stop(ctx.currentTime + i * 0.13 + 0.35)
      })
    } else if (type === 'step') {
      // Soft ding G4
      const osc = ctx.createOscillator()
      osc.connect(gain); osc.type = 'sine'; osc.frequency.value = 392
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25)
    } else {
      // Start: two-note pickup A4-C5
      ;[440, 523].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.connect(gain); osc.type = 'sine'; osc.frequency.value = freq
        gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2)
        osc.start(ctx.currentTime + i * 0.15)
        osc.stop(ctx.currentTime + i * 0.15 + 0.2)
      })
    }
  } catch { /* audio not supported */ }
}

// ── Arabic TTS ────────────────────────────────────────────────
function speakAr(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'
  utt.rate = 0.82
  utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

interface CompleteResult {
  ok: boolean
  alreadyDone: boolean
  pointsEarned: number
  newTotalPoints: number
  newAchievements: string[]
}

export default function ChildSessionPage() {
  const { lang } = useLang()
  const t = tr[lang].parentChildSession
  const { studentId } = useParams<{ studentId: string }>()
  const router = useRouter()

  const [student, setStudent]   = useState<Student | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [done, setDone]         = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)

  const [selected, setSelected] = useState<Exercise | null>(null)
  const [modalTab, setModalTab] = useState<'video' | 'steps'>('steps')
  const [step, setStep]         = useState(0)
  const [timer, setTimer]       = useState(0)
  const [running, setRunning]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebPoints, setCelebPoints]         = useState(0)
  const [newBadges, setNewBadges]             = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const exitHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/parent/child-session/${studentId}`)
      .then(r => r.json())
      .then(d => {
        if (d.student) { setStudent(d.student); setTotalPoints(d.student.totalPoints || 0) }
        setExercises(d.todayExercises || [])
        if (Array.isArray(d.completedTodayIds)) setDone(new Set(d.completedTodayIds))
      })
      .catch(() => router.push('/parent/children'))
      .finally(() => setLoading(false))
  }, [studentId, router])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const open = useCallback((ex: Exercise) => {
    setSelected(ex)
    setStep(0)
    setTimer(0)
    setRunning(false)
    setSpeaking(false)
    // default to video tab if a video exists for this exercise
    setModalTab(getVideoId(ex) ? 'video' : 'steps')
  }, [])

  function close() {
    window.speechSynthesis?.cancel()
    setSelected(null)
    setRunning(false)
    setSpeaking(false)
  }

  function handleSpeak(text: string | undefined) {
    if (!text) return
    setSpeaking(true)
    speakAr(text)
    setTimeout(() => setSpeaking(false), text.length * 80)
  }

  function handleStart() {
    setRunning(true)
    setModalTab('steps')
    playChime('start')
    if (selected) handleSpeak(selected.instructionsAr?.[0])
  }

  function handleNext() {
    const nextStep = step + 1
    setStep(nextStep)
    playChime('step')
    if (selected) handleSpeak(selected.instructionsAr?.[nextStep])
  }

  async function finish() {
    if (!selected || saving) return
    setRunning(false)
    setSaving(true)
    window.speechSynthesis?.cancel()
    try {
      const res = await fetch(`/api/parent/child-session/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: selected.id, points: selected.points }),
      })
      const data: CompleteResult = await res.json()
      const next = new Set(done); next.add(selected.id)
      setDone(next)
      setSelected(null)
      if (data.ok && !data.alreadyDone) {
        setCelebPoints(data.pointsEarned)
        setTotalPoints(data.newTotalPoints)
        playChime('complete')
        setShowCelebration(true)
        speakAr('أحسنت! عمل رائع!')
        setTimeout(() => setShowCelebration(false), 3200)
        if (data.newAchievements?.length > 0) {
          setNewBadges(data.newAchievements)
          setTimeout(() => setNewBadges([]), 5000)
        }
      }
    } catch { /* don't disrupt the child */ }
    finally { setSaving(false) }
  }

  function startExit()  { exitHoldRef.current = setTimeout(() => setShowExitConfirm(true), 1500) }
  function cancelExit() { if (exitHoldRef.current) clearTimeout(exitHoldRef.current) }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: 'linear-gradient(135deg,#F3EEFF,#E8F4FF)' }}>
      <div className="text-8xl" style={{ animation: 'fadeIn 0.3s ease-out' }}>🎮</div>
      <p className="font-black text-2xl" style={{ color: '#7C5CFC' }}>{t.loadingText}</p>
    </div>
  )

  const completedAll = exercises.length > 0 && done.size >= exercises.length
  const selCfg = selected
    ? (GAME_CFG[selected.id] || CAT_CFG[selected.category] || { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🏋️' })
    : null
  const selVideoId = selected ? getVideoId(selected) : null

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#F8F4FF 0%,#EFF6FF 50%,#F0FFF8 100%)', fontFamily: 'var(--font-cairo,Cairo,sans-serif)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(124,92,252,0.1)' }}>

        <button
          onMouseDown={startExit} onMouseUp={cancelExit}
          onMouseLeave={cancelExit} onTouchStart={startExit} onTouchEnd={cancelExit}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: '#FEF2F2', color: '#B91C1C' }}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">{t.holdToExitLabel}</span>
          <span className="sm:hidden">{t.exitShortLabel}</span>
        </button>

        <div className="text-center">
          <p className="font-black text-xl" style={{ color: '#5A32D9' }}>
            {student ? `${student.firstName} 👋` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="font-black text-amber-700 text-sm">{totalPoints}</span>
        </div>
      </div>

      {/* ── Celebration ── */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="text-center space-y-4" style={{ animation: 'badgePop 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '8rem', lineHeight: 1 }}>🎉</div>
            <div className="text-white font-black" style={{ fontSize: '3rem' }}>{t.celebrationText}</div>
            <div className="font-black text-2xl px-10 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#FFF' }}>
              +{celebPoints} ⭐
            </div>
          </div>
        </div>
      )}

      {/* ── Achievement banners ── */}
      {newBadges.length > 0 && (
        <div className="fixed top-20 inset-x-4 z-50 space-y-2 pointer-events-none">
          {newBadges.map((name, i) => (
            <div key={i} className="text-center py-3 px-4 rounded-2xl font-black text-sm"
              style={{ background: '#FBBF24', color: '#78350F', boxShadow: '0 4px 16px rgba(251,191,36,0.5)', animation: 'badgePop 0.4s ease' }}>
              {t.newBadgeLabel(name)}
            </div>
          ))}
        </div>
      )}

      {/* ── Exit confirm ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="font-black text-gray-900 text-xl mb-2">{t.exitConfirmTitle}</h2>
            <p className="text-gray-400 text-sm mb-6">{t.exitConfirmBody}</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/parent/children')}
                className="flex-1 text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg,#EF4444,#F87171)' }}>
                {t.exitConfirmYes}
              </button>
              <button onClick={() => setShowExitConfirm(false)}
                className="flex-1 font-black py-3.5 rounded-2xl active:scale-95 transition-all"
                style={{ background: '#F3F4F6', color: '#374151' }}>
                {t.exitConfirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">

        <div className="text-center pt-1">
          <h1 className="font-black text-3xl text-gray-900 mb-1">{t.chooseGameTitle}</h1>
          {exercises.length > 0 && (
            <p className="font-bold text-gray-500">
              {completedAll
                ? t.allCompletedTodayBanner
                : <span>{t.progressLabel(done.size, exercises.length)}</span>}
            </p>
          )}
        </div>

        {exercises.length > 0 && (
          <div className="rounded-2xl p-3" style={{ background: '#FFF', border: '1.5px solid #E9D8FF', boxShadow: '0 2px 8px rgba(124,92,252,0.08)' }}>
            <div className="h-4 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${exercises.length ? (done.size / exercises.length) * 100 : 0}%`,
                  background: completedAll ? 'linear-gradient(to left,#10B981,#34D399)' : 'linear-gradient(to left,#7C5CFC,#9A7BFD)',
                }} />
            </div>
          </div>
        )}

        {completedAll && (
          <div className="rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#F0FFF4,#ECFDF5)', border: '2px solid #A7F3D0' }}>
            <div className="text-6xl mb-3">🏆</div>
            <p className="font-black text-2xl text-green-800 mb-1">{t.greatJobTitle}</p>
            <p className="text-green-600 font-bold">{t.allCompletedBody}</p>
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="rounded-3xl p-12 text-center" style={{ border: '2px dashed #D3BBFF', background: '#FFF' }}>
            <div className="text-6xl mb-4">😴</div>
            <p className="font-black text-gray-700 text-xl">{t.noExercisesTitle}</p>
            <p className="text-gray-400 mt-2">{t.noExercisesBody}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {exercises.map(ex => {
              const isDone = done.has(ex.id)
              const cfg = GAME_CFG[ex.id] || CAT_CFG[ex.category] || { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '🏋️' }
              const hasVideo = !!getVideoId(ex)
              return (
                <button key={ex.id} onClick={() => !isDone && open(ex)} disabled={isDone}
                  className="relative rounded-3xl overflow-hidden text-right transition-all duration-200 active:scale-95"
                  style={{ boxShadow: isDone ? 'none' : '0 6px 20px rgba(0,0,0,0.14)', opacity: isDone ? 0.7 : 1, border: isDone ? '2px solid #D1FAE5' : 'none' }}>
                  <div className="p-5 h-48 flex flex-col justify-between"
                    style={{ background: isDone ? '#F0FFF4' : cfg.gradient }}>
                    <div className="flex justify-between items-start">
                      <div className="text-5xl leading-none">{isDone ? '✅' : cfg.icon}</div>
                      {hasVideo && !isDone && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(255,255,255,0.25)', color: '#FFF' }}>
                          <Film className="w-3 h-3" /> {t.videoLabel}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-base leading-tight line-clamp-2"
                        style={{ color: isDone ? '#065F46' : '#FFF' }}>
                        {ex.titleAr}
                      </p>
                      <p className="text-xs mt-1 font-bold"
                        style={{ color: isDone ? '#6EE7B7' : 'rgba(255,255,255,0.75)' }}>
                        {isDone ? t.doneLabel : `⭐ ${ex.points} ${t.pointsSuffix}`}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Exercise modal ── */}
      {selected && selCfg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) close() }}>
          <div className="w-full sm:max-w-lg overflow-y-auto"
            style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '92vh' }}>

            {/* Modal header */}
            <div className="px-5 pt-6 pb-5 rounded-t-3xl relative" style={{ background: selCfg.gradient }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-5xl leading-none">{selCfg.icon}</div>
                <div className="flex items-center gap-2">
                  {/* 🔊 Read title aloud */}
                  <button onClick={() => handleSpeak(selected.titleAr)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={close}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <h2 className="text-white font-black text-2xl mb-2">{selected.titleAr}</h2>
              <div className="flex items-center gap-4 text-white/80 text-sm font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {selected.durationMinutes} {t.minutesSuffix}
                </span>
                <span>⭐ {selected.points} {t.pointsSuffix}</span>
                {speaking && <span className="animate-pulse">{t.speakingLabel}</span>}
              </div>
              {running && (
                <div className="mt-3 py-3 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <span className="text-white font-black text-3xl">
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 px-5 pt-4 pb-2">
              {selVideoId && (
                <button onClick={() => setModalTab('video')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: modalTab === 'video' ? '#7C5CFC' : '#F3EEFF',
                    color: modalTab === 'video' ? '#FFF' : '#5A32D9',
                    boxShadow: modalTab === 'video' ? '0 2px 8px rgba(124,92,252,0.35)' : 'none',
                  }}>
                  <Film className="w-4 h-4" /> {t.videoLabel}
                </button>
              )}
              <button onClick={() => setModalTab('steps')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: modalTab === 'steps' ? '#7C5CFC' : '#F3EEFF',
                  color: modalTab === 'steps' ? '#FFF' : '#5A32D9',
                  boxShadow: modalTab === 'steps' ? '0 2px 8px rgba(124,92,252,0.35)' : 'none',
                }}>
                <List className="w-4 h-4" /> {t.stepsTabLabel}
              </button>
            </div>

            <div className="px-5 pb-6">

              {/* ── Video tab ── */}
              {modalTab === 'video' && selVideoId && (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
                    <iframe
                      key={selVideoId}
                      src={`https://www.youtube.com/embed/${selVideoId}?rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <p className="text-amber-700 text-xs font-black mb-0.5">{t.objectiveLabel}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selected.psychologyObjectiveAr || selected.psychologyObjective}
                    </p>
                  </div>
                  <button onClick={() => setModalTab('steps')}
                    className="w-full text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: selCfg.gradient, boxShadow: '0 4px 14px rgba(124,92,252,0.3)' }}>
                    <Play className="w-5 h-5 fill-white" /> {t.startExerciseButton}
                  </button>
                </div>
              )}

              {/* ── Steps tab ── */}
              {modalTab === 'steps' && (
                <div>
                  <div className="space-y-2 mb-4 mt-1">
                    {selected.instructionsAr.map((inst, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl transition-all"
                        style={{
                          background: i === step ? '#F3EEFF' : i < step ? '#F0FFF9' : '#F9FAFB',
                          border: i === step ? '2px solid #D3BBFF' : '2px solid transparent',
                          opacity: !running || i > step ? (running ? 0.45 : 1) : 1,
                        }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
                          style={{
                            background: i === step ? '#7C5CFC' : i < step ? '#10B981' : '#E5E7EB',
                            color: i <= step ? '#FFF' : '#6B7280',
                          }}>
                          {i < step ? '✓' : i + 1}
                        </div>
                        <p className={`flex-1 text-base leading-relaxed ${i === step ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                          {inst}
                        </p>
                        {/* 🔊 per-step TTS */}
                        <button onClick={() => handleSpeak(inst)}
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                          style={{ background: i === step ? 'rgba(124,92,252,0.15)' : '#F0F0F0', color: i === step ? '#7C5CFC' : '#9CA3AF' }}>
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action button */}
                  {!running ? (
                    <button onClick={handleStart}
                      className="w-full text-white font-black py-5 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                      style={{ background: selCfg.gradient, boxShadow: '0 6px 20px rgba(124,92,252,0.35)' }}>
                      <Play className="w-6 h-6 fill-white" /> {t.startButton}
                    </button>
                  ) : step < selected.instructionsAr.length - 1 ? (
                    <button onClick={handleNext}
                      className="w-full text-white font-black py-5 rounded-2xl text-xl transition-all active:scale-95"
                      style={{ background: selCfg.gradient, boxShadow: '0 6px 20px rgba(124,92,252,0.35)' }}>
                      {t.nextButton}
                    </button>
                  ) : (
                    <button onClick={finish} disabled={saving}
                      className="w-full text-white font-black py-5 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>
                      {saving
                        ? <span className="animate-pulse">{t.savingButton}</span>
                        : <><CheckCircle className="w-6 h-6" /> {t.finishButton}</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes badgePop {
          0% { transform: scale(0.5); opacity: 0 }
          70% { transform: scale(1.08) }
          100% { transform: scale(1); opacity: 1 }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-16px) }
        }
      `}</style>
    </div>
  )
}
