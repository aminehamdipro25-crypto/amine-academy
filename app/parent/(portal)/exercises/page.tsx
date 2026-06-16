'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Clock, CheckCircle, Play, X, Info, Volume2, Trophy, Flame, Zap } from 'lucide-react'
import type { Exercise, Student, ExerciseResult } from '@/lib/types'

// ── Lazy-load interactive game components ─────────────────────
const BreathingGuide   = dynamic(() => import('@/components/session/exercises/BreathingGuide'),   { ssr: false })
const SimonSays        = dynamic(() => import('@/components/session/exercises/SimonSays'),        { ssr: false })
const TargetTracking   = dynamic(() => import('@/components/session/exercises/TargetTracking'),   { ssr: false })
const PhysicalExercise = dynamic(() => import('@/components/session/exercises/PhysicalExercise'), { ssr: false })
const BalloonControl   = dynamic(() => import('@/components/session/exercises/BalloonControl'),   { ssr: false })
const ReactionGame     = dynamic(() => import('@/components/session/exercises/ReactionGame'),     { ssr: false })
const StopSignal       = dynamic(() => import('@/components/session/exercises/StopSignal'),       { ssr: false })
const BodyScan         = dynamic(() => import('@/components/session/exercises/BodyScan'),         { ssr: false })

// ── Types ─────────────────────────────────────────────────────
type Phase = 'grid' | 'prestart' | 'game' | 'complete'
type InteractiveKind =
  | 'breathing' | 'simon-says' | 'target-tracking' | 'physical'
  | 'balloon-control' | 'reaction-game' | 'stop-signal' | 'body-scan'
  | null
type PhysId = 'jumping-jacks' | 'obstacle-circuit' | 'balance-walk' | 'tiger-crawl' | 'ball-throw' | 'stretching' | 'body-percussion'

// ── Category config ───────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن',
  energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}
const CAT_CFG: Record<string, { gradient: string; icon: string; light: string; shadow: string; dark: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#E05A2A)', icon: '🏃', light: '#FFF5F0', shadow: 'rgba(255,107,53,0.30)', dark: '#7A2000' },
  focus:   { gradient: 'linear-gradient(135deg,#7C5CFC,#5A32D9)', icon: '🎯', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.30)', dark: '#2E1065' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#0D9488)', icon: '⚖️', light: '#F0FDFA', shadow: 'rgba(42,191,163,0.30)', dark: '#042F2E' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#E07B00)', icon: '⚡', light: '#FFFBEB', shadow: 'rgba(255,186,68,0.30)', dark: '#451A03' },
  sensory: { gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', icon: '🌈', light: '#FDF2F8', shadow: 'rgba(236,72,153,0.30)', dark: '#500724' },
  social:  { gradient: 'linear-gradient(135deg,#10B981,#047857)', icon: '🤝', light: '#ECFDF5', shadow: 'rgba(16,185,129,0.30)', dark: '#022C22' },
}
const DEFAULT_CFG = { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '⭐', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.25)', dark: '#2E1065' }

const DIFF_MAP: Record<string, 1|2|3> = { beginner: 1, intermediate: 2, advanced: 3 }
const AGE_MAP: Record<string, number> = { '5-11': 8, '12-17': 14, '18-22': 20 }

// ── Interactive component detector ────────────────────────────
function detectInteractive(ex: Exercise): { kind: InteractiveKind; physId?: PhysId } {
  const t = ex.title.toLowerCase()
  // Breathing
  if (t.includes('bubble breath') || t.includes('box breath') || t.includes('breathing')) return { kind: 'breathing' }
  // Cognitive games
  if (t.includes('simon says')) return { kind: 'simon-says' }
  if (t.includes('stop') && t.includes('listen')) return { kind: 'stop-signal' }
  // Visual tracking — screen game (NOT "target toss" which is physical throwing)
  if (t.includes('digital tracking') || t.includes('visual tracking trail')) return { kind: 'target-tracking' }
  // Balloon control — inhibition game
  if (t.includes('balloon keep') || t.includes('balloon control')) return { kind: 'balloon-control' }
  // Reaction time
  if (t.includes('reaction time')) return { kind: 'reaction-game' }
  // Body scan / muscle relaxation
  if (t.includes('body scan') || t.includes('muscle relax') || t.includes('progressive muscle')) return { kind: 'body-scan' }
  // Physical exercises with timer component
  if (t.includes('jumping jack')) return { kind: 'physical', physId: 'jumping-jacks' }
  if (t.includes('obstacle navigation') || t.includes('obstacle circuit')) return { kind: 'physical', physId: 'obstacle-circuit' }
  if (t.includes('balance walk') || t.includes('balance beam')) return { kind: 'physical', physId: 'balance-walk' }
  if (t.includes('cross-lateral')) return { kind: 'physical', physId: 'tiger-crawl' }
  if (t.includes('ball throw')) return { kind: 'physical', physId: 'ball-throw' }
  if (t.includes('stretching') || t.includes('flexibility')) return { kind: 'physical', physId: 'stretching' }
  if (t.includes('body percussion')) return { kind: 'physical', physId: 'body-percussion' }
  return { kind: null }
}

// ── Step helpers ──────────────────────────────────────────────
function stepEmoji(text: string, cat: string): string {
  if (text.includes('تنفس') || text.includes('نفساً') || text.includes('زفير') || text.includes('شهيق')) return '💨'
  if (text.includes('فقاعة') || text.includes('نفخ')) return '🫧'
  if (text.includes('دب')) return '🐻'
  if (text.includes('ضفدع') || text.includes('اقفز') || text.includes('قفز')) return '🐸'
  if (text.includes('أفعى') || text.includes('ازحف') || text.includes('زحف')) return '🐍'
  if (text.includes('حصان') || text.includes('اركض') || text.includes('اجرِ')) return '🐴'
  if (text.includes('بالون')) return '🎈'
  if (text.includes('كرة')) return '⚽'
  if (text.includes('موسيقى') || text.includes('إيقاع') || text.includes('ميترونوم')) return '🎵'
  // Vision BEFORE audio
  if (text.includes('انظر') || text.includes('عين') || text.includes('بصر') || text.includes('ترى') || text.includes('تراها') || text.includes('شاهد')) return '👁️'
  if ((text.includes('استمع') || text.includes('اسمع') || text.includes('صوت')) && !text.includes('بصوت')) return '👂'
  if (text.includes('لمس') || text.includes('الملس') || text.includes('تلمس')) return '🤚'
  if (text.includes('شمّ') || text.includes('تشمه') || text.includes('رائحة')) return '👃'
  if (text.includes('تذوق') || text.includes('طعم')) return '👅'
  if (text.includes('امشِ') || text.includes('مشي') || text.includes('خطوة')) return '🚶'
  if (text.includes('تصفيق') || text.includes('صفق')) return '👏'
  if (text.includes('قف') || text.includes('تجمّد') || text.includes('اثبت') || text.includes('لا تتحرك')) return '🧍'
  if (text.includes('اجلس') || text.includes('جلوس')) return '🧘'
  if (text.includes('ارفع') || text.includes('رفع')) return '💪'
  if (text.includes('ارمِ') || text.includes('رمي') || text.includes('قذف')) return '🎯'
  if (text.includes('استرح') || text.includes('راحة')) return '😮‍💨'
  if (text.includes('ابدأ') || text.includes('استعد')) return '🚀'
  if (text.includes('كرر') || text.includes('تكرار')) return '🔄'
  if (text.includes('توازن')) return '⚖️'
  if (text.includes('سيمون') || text.includes('سايمون')) return '🎮'
  if (text.includes('هدف') || text.includes('رقم')) return '🎯'
  if (text.includes('تأمل') || text.includes('يقظ')) return '🌟'
  if (text.includes('ماء') || text.includes('سباح')) return '🌊'
  if (text.includes('كتاب') || text.includes('اقرأ')) return '📖'
  return { motor: '🏃', focus: '🎯', balance: '⚖️', energy: '⚡', sensory: '🌈', social: '🤝' }[cat] || '⭐'
}

function keyTitle(text: string): string {
  const clean = text.replace(/\([^)]*\)/g, '').trim()
  const parts = clean.split(/\s*[—:؛،]\s*/)
  const first = parts[0].trim()
  // "المرحلة N / الجولة N / الجلسة N" are stage labels, not useful alone — append name
  if (/^(المرحلة|الجولة|الجلسة)\s+\d/.test(first) && parts.length > 1) {
    const label = first
    const name  = parts[1].trim().split(' ').slice(0, 3).join(' ')
    return `${label}: ${name}`
  }
  if (first.length <= 28) return first
  return first.split(' ').slice(0, 5).join(' ')
}

function extractCount(text: string): number | null {
  const m = text.match(/^(\d+)\s+أشياء|^(\d+)\s+أشي|^(\d+)\s+شيء/)
  if (m) return parseInt(m[1] || m[2] || m[3])
  return null
}

function extractTimer(text: string): number | null {
  const m = text.match(/لعد\s+(\d+)|(\d+)\s+ثانية|(\d+)\s+ث[^و]|لمدة\s+(\d+)/)
  if (m) return parseInt(m[1] || m[2] || m[3] || m[4])
  return null
}

function speakAr(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'; utt.rate = 0.85; utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

// ── Web Audio SFX engine (no external files) ──────────────────
let _sfxCtx: AudioContext | null = null
function _sfxCtone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.22) {
  if (typeof window === 'undefined') return
  try {
    if (!_sfxCtx) _sfxCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (_sfxCtx.state === 'suspended') _sfxCtx.resume()
    const osc = _sfxCtx.createOscillator()
    const g   = _sfxCtx.createGain()
    osc.connect(g); g.connect(_sfxCtx.destination)
    osc.frequency.value = freq; osc.type = type
    g.gain.setValueAtTime(0, _sfxCtx.currentTime)
    g.gain.linearRampToValueAtTime(vol, _sfxCtx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, _sfxCtx.currentTime + dur)
    osc.start(_sfxCtx.currentTime)
    osc.stop(_sfxCtx.currentTime + dur + 0.05)
  } catch { /* audio not supported */ }
}

const sfx = {
  step:     () => _sfxCtone(660, 0.09, 'sine', 0.18),
  back:     () => _sfxCtone(440, 0.07, 'sine', 0.14),
  start:    () => { _sfxCtone(440,0.1); setTimeout(()=>_sfxCtone(550,0.1),100); setTimeout(()=>_sfxCtone(660,0.15),200) },
  complete: () => [523,659,784,1047].forEach((f,i)=>setTimeout(()=>_sfxCtone(f,0.22,'sine',0.22),i*130)),
  tap:      () => _sfxCtone(900, 0.06, 'square', 0.08),
  tick:     () => _sfxCtone(1300, 0.04, 'sine', 0.05),
  pop:      () => _sfxCtone(700, 0.05, 'sine', 0.12),
  done:     () => { _sfxCtone(660,0.1,'sine',0.2); setTimeout(()=>_sfxCtone(880,0.15,'sine',0.18),100) },
}

function equipEmoji(eq: string): string {
  if (eq.includes('بالون')) return '🎈'
  if (eq.includes('كرة')) return '⚽'
  if (eq.includes('ماء')) return '🌊'
  if (eq.includes('حصير') || eq.includes('mat')) return '🟣'
  if (eq.includes('موسيق')) return '🎵'
  if (eq.includes('ورق')) return '📄'
  if (eq.includes('شريط')) return '🖊️'
  if (eq.includes('كرسي')) return '🪑'
  return '📦'
}

// ── Guided Step Timer sub-component ──────────────────────────
function StepTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(id); sfx.done(); onDone(); return 0 }
      if (l <= 4) sfx.tick()
      return l - 1
    }), 1000)
    return () => clearInterval(id)
  }, [onDone, seconds])
  const pct = ((seconds - left) / seconds) * 100
  const r = 36, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }} strokeLinecap="round" />
      </svg>
      <div className="font-black text-white text-2xl -mt-14 mb-10">{left}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ExercisesPage() {
  const [exercises,  setExercises]  = useState<Exercise[]>([])
  const [child,      setChild]      = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [selected,   setSelected]   = useState<Exercise | null>(null)
  const [phase,      setPhase]      = useState<Phase>('grid')
  const [step,       setStep]       = useState(0)
  const [stepTimer,  setStepTimer]  = useState(false)
  const [groundTaps, setGroundTaps] = useState(0)   // for grounding 5-4-3-2-1
  const [completed,  setCompleted]  = useState<Set<string>>(new Set())
  const [result,     setResult]     = useState<ExerciseResult | null>(null)
  const [showInfo,   setShowInfo]   = useState(false)
  const [sessionSec, setSessionSec] = useState(0)
  const [timerOn,    setTimerOn]    = useState(false)
  const [zoneSelected, setZoneSelected] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/parent/me').then(r => r.json()).then(d => {
      const c = d.children?.[0] || null
      setChild(c)
      const q = c ? `age=${c.ageGroup}&diagnosis=${c.diagnosis}` : ''
      return fetch(`/api/exercises?${q}`)
    }).then(r => r.json()).then(d => setExercises(d.exercises || []))
    .finally(() => setLoading(false))
  }, [])

  // Session timer
  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setSessionSec(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerOn])

  // Auto-speak guided step
  useEffect(() => {
    if (phase !== 'game' || !selected) return
    const { kind } = detectInteractive(selected)
    if (kind) return
    const steps = selected.instructionsAr || selected.instructions || []
    if (!steps[step]) return
    const id = setTimeout(() => speakAr(keyTitle(steps[step])), 450)
    return () => { clearTimeout(id); window.speechSynthesis?.cancel() }
  }, [step, phase, selected])

  const openExercise = useCallback((ex: Exercise) => {
    setSelected(ex); setPhase('prestart'); setStep(0)
    setResult(null); setShowInfo(false); setStepTimer(false); setGroundTaps(0)
    sfx.pop()
  }, [])

  function startExercise() {
    sfx.start()
    setPhase('game'); setTimerOn(true)
  }

  function handleComplete(r?: ExerciseResult) {
    if (!selected) return
    setTimerOn(false)
    sfx.complete()
    setCompleted(prev => new Set([...prev, selected.id]))
    setResult(r || {
      exerciseType: selected.title, exerciseLabelAr: selected.titleAr,
      score: 100, accuracy: 100, duration: sessionSec, errors: 0,
      metadata: {}, completedAt: new Date().toISOString(),
    })
    setPhase('complete')
  }

  function handleCancel() {
    setTimerOn(false)
    window.speechSynthesis?.cancel()
    setPhase('prestart')
  }

  function closeAll() {
    setTimerOn(false)
    window.speechSynthesis?.cancel()
    setSelected(null); setPhase('grid')
  }

  const filtered  = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)
  const cats      = ['all', ...Object.keys(CAT_LABELS)]
  const fmt       = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const totalPts  = Array.from(completed).reduce((s, id) => s + (exercises.find(e => e.id === id)?.points || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-6xl" style={{ animation: 'spin 1s linear infinite' }}>🎮</div>
    </div>
  )

  return (
    <div dir="rtl" className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">التمارين 🎮</h1>
          {child && (
            <p className="text-gray-400 text-sm mt-0.5">
              {child.firstName} • {child.ageGroup} سنة
            </p>
          )}
        </div>
        {child?.streak ? (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-black text-sm text-orange-700">{child.streak} يوم</span>
          </div>
        ) : null}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'متاح',  value: exercises.length, bg: '#F3EEFF', color: '#5A32D9', icon: '📚' },
          { label: 'أنجزت', value: completed.size,   bg: '#ECFDF5', color: '#059669', icon: '✅' },
          { label: 'نقاط',  value: totalPts,         bg: '#FFFBEB', color: '#B45309', icon: '⭐' },
        ].map(({ label, value, bg, color, icon }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="font-black text-xl" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {cats.map(cat => {
          const active = filter === cat
          const cfg    = CAT_CFG[cat]
          return (
            <button key={cat} onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-full text-xs font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={active
                ? { background: cfg?.gradient || '#6B46F0', color: '#FFF', boxShadow: `0 2px 8px ${cfg?.shadow || 'rgba(124,92,252,0.3)'}` }
                : { background: '#FFF', color: '#9CA3AF', border: '1.5px solid #E5E7EB' }}>
              {cat === 'all' ? '✨ الكل' : `${cfg?.icon} ${CAT_LABELS[cat]}`}
            </button>
          )
        })}
      </div>

      {/* ── Exercise grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p>لا توجد تمارين في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map(ex => {
            const done   = completed.has(ex.id)
            const cfg    = CAT_CFG[ex.category] || DEFAULT_CFG
            const { kind } = detectInteractive(ex)
            const hasGame = kind !== null
            return (
              <button key={ex.id} onClick={() => !done && openExercise(ex)} disabled={done}
                className="relative rounded-3xl overflow-hidden text-right transition-all duration-200 active:scale-95"
                style={{ boxShadow: done ? 'none' : `0 6px 20px ${cfg.shadow}`, opacity: done ? 0.75 : 1,
                  border: done ? '2px solid #D1FAE5' : 'none' }}>
                <div className="p-4 h-48 flex flex-col justify-between"
                  style={{ background: done ? '#F0FFF4' : cfg.gradient }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.25)', color: done ? '#065F46' : '#FFF' }}>
                      {CAT_LABELS[ex.category]}
                    </span>
                    <span style={{ fontSize: 36, lineHeight: 1 }}>{done ? '✅' : cfg.icon}</span>
                  </div>

                  <div>
                    {/* Game badge */}
                    {hasGame && !done && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Zap style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.9)' }} />
                        <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          تفاعلي
                        </span>
                      </div>
                    )}
                    <p className="font-black text-sm leading-snug line-clamp-2 mb-1.5"
                      style={{ color: done ? '#065F46' : '#FFF' }}>
                      {ex.titleAr}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold flex items-center gap-0.5"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        <Clock style={{ width: 10, height: 10 }} /> {ex.durationMinutes}د
                      </span>
                      <span className="text-xs font-bold"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        ⭐ {ex.points}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          EXERCISE MODAL
      ══════════════════════════════════════════ */}
      {selected && phase !== 'grid' && (() => {
        const cfg     = CAT_CFG[selected.category] || DEFAULT_CFG
        const steps   = selected.instructionsAr || selected.instructions || []
        const equip   = (selected.equipment || []).filter(e => e && e !== 'none')
        const { kind, physId } = detectInteractive(selected)
        const diff    = DIFF_MAP[selected.difficulty] || 1
        const age     = AGE_MAP[child?.ageGroup || '5-11'] || 8
        const isGame  = kind !== null

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) closeAll() }}>

            {/* ─── PRESTART SHEET ─── */}
            {phase === 'prestart' && (
              <div className="w-full sm:max-w-md flex flex-col overflow-hidden"
                style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '95vh' }}>

                {/* Gradient hero */}
                <div className="px-5 pt-6 pb-5 flex-shrink-0 relative" style={{ background: cfg.gradient }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-7xl leading-none drop-shadow-lg">{cfg.icon}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowInfo(v => !v)}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.22)' }}>
                        <Info className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={closeAll}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.22)' }}>
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <h2 className="text-white font-black text-2xl leading-snug mb-1">{selected.titleAr}</h2>
                  <div className="flex items-center gap-4 text-white/80 text-xs font-bold">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.durationMinutes} دقيقة</span>
                    <span>⭐ {selected.points} نقطة</span>
                    {isGame && (
                      <span className="flex items-center gap-1 font-black text-yellow-200">
                        <Zap className="w-3 h-3" /> ألعاب تفاعلية
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Parent info toggle */}
                  {showInfo && (
                    <div className="rounded-2xl p-4" style={{ background: '#F3EEFF', border: '1px solid #E8DBFF' }}>
                      <p className="text-xs font-black mb-1" style={{ color: '#5A32D9' }}>🔬 الهدف العلمي (للأهل)</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selected.psychologyObjectiveAr || selected.psychologyObjective}
                      </p>
                    </div>
                  )}

                  {/* What to expect card */}
                  <div className="rounded-3xl p-5 text-center"
                    style={{ background: cfg.light, border: `2px solid ${cfg.shadow.replace('0.30','0.12')}` }}>
                    <div style={{ fontSize: 68, lineHeight: 1, marginBottom: 10 }}>
                      {kind === 'breathing' ? '🌬️' :
                       kind === 'simon-says' ? '🎮' :
                       kind === 'target-tracking' ? '🌟' :
                       kind === 'balloon-control' ? '🎈' :
                       kind === 'reaction-game' ? '⚡' :
                       kind === 'stop-signal' ? '🛑' :
                       kind === 'body-scan' ? '🧘' :
                       cfg.icon}
                    </div>
                    {isGame ? (
                      <>
                        <p className="font-black text-gray-800 text-base mb-1">
                          {kind === 'breathing' && 'تمرين تنفس تفاعلي'}
                          {kind === 'simon-says' && 'لعبة التسلسل اللوني'}
                          {kind === 'target-tracking' && 'لعبة تتبع الهدف المتحرك'}
                          {kind === 'balloon-control' && 'لعبة التحكم في البالون'}
                          {kind === 'reaction-game' && 'لعبة رد الفعل'}
                          {kind === 'stop-signal' && 'لعبة توقف أو اكمل'}
                          {kind === 'body-scan' && 'فحص عضلات الجسم'}
                          {kind === 'physical' && 'تمرين جسدي موجّه'}
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {kind === 'breathing' && 'حلقة تنفس حية — استنشق، احبس، أخرج — مع عداد مرئي'}
                          {kind === 'simon-says' && 'شاهد تسلسل الألوان ثم كرّره بنفس الترتيب'}
                          {kind === 'target-tracking' && 'اضغط النجمة 🌟 المتحركة ولا تضغط الدوائر الحمراء 🔴'}
                          {kind === 'balloon-control' && 'البالون يكبر ببطء — اضغط عند المنطقة الخضراء!'}
                          {kind === 'reaction-game' && 'اضغط الهدف الأخضر فور ظهوره — قِس سرعتك!'}
                          {kind === 'stop-signal' && 'أخضر = اضغط بسرعة • أحمر = لا تضغط! تحدٍّ للتحكم'}
                          {kind === 'body-scan' && 'شدّ وأرخِ كل عضلة واحدة بعد الأخرى مع مؤقت تلقائي'}
                          {kind === 'physical' && (selected.descriptionAr?.split(/[—–]/)[0].trim() || selected.titleAr)}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-700 text-sm leading-relaxed">
                        {selected.descriptionAr?.split(/[—–]/)[0].trim() || selected.titleAr}
                      </p>
                    )}
                  </div>

                  {/* Equipment */}
                  {equip.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <p className="text-xs font-black text-amber-700 mb-3">📦 ستحتاج إلى:</p>
                      <div className="flex flex-wrap gap-2">
                        {equip.map((eq, i) => (
                          <span key={i} className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl"
                            style={{ background: '#FEF3C7', color: '#92400E' }}>
                            {equipEmoji(eq)} {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps preview (guided) or game preview */}
                  {isGame ? (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E5E7EB' }}>
                      <div className="px-4 py-3 flex items-center gap-2" style={{ background: cfg.light }}>
                        <Zap className="w-4 h-4 text-violet-500" />
                        <p className="text-xs font-black text-gray-700">كيف تعمل اللعبة</p>
                      </div>
                      <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed">
                        {kind === 'breathing' && '🌬️ اختر نمط التنفس ثم اتبع الحلقة المتحركة — استنشق مع توسعها، وأخرج مع انكماشها'}
                        {kind === 'simon-says' && '🔴🔵🟢🟡 يومض التسلسل — شاهد جيداً ثم كرّره باللمس بنفس الترتيب'}
                        {kind === 'target-tracking' && '🌟 النجمة تتحرك بسرعة — الملسها! الدوائر الحمراء 🔴 خسارة نقطة'}
                        {kind === 'balloon-control' && '🎈 البالون يكبر تدريجياً — اضغط "الآن!" في المنطقة الخضراء فقط — قبلها = اندفاع!'}
                        {kind === 'reaction-game' && '⚡ انتظر النجمة الخضراء تظهر فجأة... اضغطها فوراً! لا تضغط قبل ظهورها'}
                        {kind === 'stop-signal' && '🛑 دائرة خضراء = اضغط | دائرة حمراء = اثبت لا تتحرك! تحدٍّ 24 محاولة'}
                        {kind === 'body-scan' && '🧘 5 مناطق في الجسم — شدّ كل منطقة 4 ثوانٍ ثم أرخِها — مؤقت تلقائي'}
                        {kind === 'physical' && '▶️ اضغط ابدأ وتابع الخطوات مع المؤقت — المنبّه ينتقل تلقائياً'}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0E8FF' }}>
                      <div className="px-4 py-2.5" style={{ background: '#F3EEFF' }}>
                        <p className="text-xs font-black" style={{ color: '#5A32D9' }}>📋 الخطوات ({steps.length})</p>
                      </div>
                      {steps.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderTop: i > 0 ? '1px solid #F0E8FF' : 'none' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: '#7C5CFC', color: '#FFF' }}>{i + 1}</div>
                          <p className="text-sm text-gray-700 font-bold line-clamp-1">{keyTitle(s)}</p>
                        </div>
                      ))}
                      {steps.length > 4 && (
                        <div className="px-4 py-3 text-center text-xs text-gray-400 font-bold"
                          style={{ borderTop: '1px solid #F0E8FF' }}>
                          + {steps.length - 4} خطوات أخرى
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #F0E8FF' }}>
                  <button onClick={startExercise}
                    className="w-full text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    style={{ background: cfg.gradient, boxShadow: `0 6px 18px ${cfg.shadow}` }}>
                    <Play className="w-6 h-6 fill-white" />
                    {isGame ? '🎮 ابدأ اللعبة!' : '🚀 ابدأ!'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── GAME MODE: Interactive component ─── */}
            {phase === 'game' && isGame && (
              <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
                style={{ background: `linear-gradient(160deg, ${cfg.dark}, #0f172a)`,
                  height: '92vh', maxHeight: 680, overflowY: 'auto' }}>
                {/* Dark header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                  <button onClick={handleCancel}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    ← رجوع
                  </button>
                  <h3 className="text-white font-black text-sm">{selected.titleAr}</h3>
                  <div className="text-white/50 text-xs font-bold">{fmt(sessionSec)}</div>
                </div>

                {/* Component */}
                {kind === 'breathing' && (
                  <BreathingGuide onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'simon-says' && (
                  <SimonSays onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'target-tracking' && (
                  <TargetTracking onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'balloon-control' && (
                  <BalloonControl onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'reaction-game' && (
                  <ReactionGame onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'stop-signal' && (
                  <StopSignal onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'body-scan' && (
                  <BodyScan onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'physical' && physId && (
                  <PhysicalExercise id={physId} onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
              </div>
            )}

            {/* ─── GAME MODE: Guided steps ─── */}
            {phase === 'game' && !isGame && (() => {
              // ── Special exercise detection ──
              const isGrounding = selected.title.toLowerCase().includes('grounding')
              const isZoneCheck = selected.title.toLowerCase().includes('zone of regulation')
              const isAnimal    = selected.title.toLowerCase().includes('animal walk')

              // Grounding exercise data
              const GROUND_SENSES = [
                { count: 5, icon: '👁️', color: '#7C5CFC', label: 'أشياء تراها',  hint: 'انظر حولك وسمِّها بصوت عالٍ' },
                { count: 4, icon: '🤚', color: '#2ABFA3', label: 'أشياء تلمسها', hint: 'الملسها واحدة تلو الأخرى' },
                { count: 3, icon: '👂', color: '#FFBA44', label: 'أشياء تسمعها', hint: 'استمع جيداً للأصوات من حولك' },
                { count: 2, icon: '👃', color: '#EC4899', label: 'أشياء تشمهما', hint: 'خذ أنفاساً عميقة وركّز على الرائحة' },
                { count: 1, icon: '👅', color: '#10B981', label: 'شيء تتذوقه',   hint: 'ما الطعم الموجود في فمك الآن؟' },
                { count: 3, icon: '💨', color: '#5A32D9', label: 'أنفاس هادئة',  hint: 'استنشق ببطء... ثم أخرج ببطء' },
              ]
              const curSense = GROUND_SENSES[Math.min(step, GROUND_SENSES.length - 1)]

              // Zone of Regulation data
              const ZONES = [
                { color: '#3B82F6', label: 'المنطقة الزرقاء', emoji: '😴', desc: 'بطيء، متعب، حزين', tools: ['القفز', 'الموسيقى الصاخبة', 'ماء بارد'] },
                { color: '#22C55E', label: 'المنطقة الخضراء', emoji: '😊', desc: 'مستعد، سعيد، هادئ', tools: ['ابدأ النشاط مباشرة!'] },
                { color: '#EAB308', label: 'المنطقة الصفراء', emoji: '😤', desc: 'متوتر، مثار، قلق',  tools: ['التنفس العميق', 'التمدد', 'مضغ'] },
                { color: '#EF4444', label: 'المنطقة الحمراء', emoji: '😡', desc: 'خارج السيطرة، غاضب', tools: ['مكان هادئ', 'ضغط عميق', 'كرة ضغط'] },
              ]
              return (
              <div className="w-full sm:max-w-md flex flex-col overflow-hidden"
                style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '95vh' }}>

                {/* Header strip */}
                <div className="px-5 pt-4 pb-4 flex-shrink-0 flex items-center gap-3"
                  style={{ background: cfg.gradient }}>
                  <button onClick={() => { sfx.back(); handleCancel() }}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.22)' }}>
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-base truncate">{selected.titleAr}</h3>
                    <p className="text-white/70 text-xs font-bold">
                      {fmt(sessionSec)} •{' '}
                      {isGrounding ? `الحاسة ${step + 1} من ${GROUND_SENSES.length}` : `خطوة ${step + 1} من ${steps.length}`}
                    </p>
                  </div>
                  <div className="font-black text-white/90 text-sm">
                    {Math.round(((step + 1) / (isGrounding ? GROUND_SENSES.length : steps.length)) * 100)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 flex-shrink-0" style={{ background: '#F1F5F9' }}>
                  <div className="h-full transition-all duration-500"
                    style={{
                      width: `${((step + 1) / (isGrounding ? GROUND_SENSES.length : steps.length)) * 100}%`,
                      background: cfg.gradient
                    }} />
                </div>

                {/* ══ GROUNDING 5-4-3-2-1 INTERACTIVE MODE ══ */}
                {isGrounding ? (
                  <div className="flex-1 overflow-y-auto flex flex-col items-center text-center px-6 py-6 gap-4">

                    {/* Sense dots */}
                    <div className="flex gap-2">
                      {GROUND_SENSES.map((s, i) => (
                        <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{ background: i < step ? '#4ADE80' : i === step ? s.color : '#E5E7EB',
                            transform: i === step ? 'scale(1.4)' : 'scale(1)' }} />
                      ))}
                    </div>

                    {/* Big sense icon */}
                    <div key={step} style={{ fontSize: 96, lineHeight: 1,
                      animation: 'popIn 0.4s cubic-bezier(.34,1.56,.64,1)',
                      filter: `drop-shadow(0 6px 20px ${curSense.color}50)` }}>
                      {curSense.icon}
                    </div>

                    {/* Count + label */}
                    <div>
                      <div className="font-black leading-none mb-1" style={{ fontSize: 52, color: curSense.color }}>
                        {curSense.count}
                      </div>
                      <p className="font-black text-xl text-gray-800">{curSense.label}</p>
                      <p className="text-sm text-gray-400 mt-1">{curSense.hint}</p>
                    </div>

                    {/* Tap bubbles */}
                    <div className="flex gap-3 flex-wrap justify-center">
                      {Array.from({ length: curSense.count }).map((_, i) => (
                        <button key={i}
                          onClick={() => {
                            if (groundTaps <= i) {
                              sfx.tap()
                              const newTaps = groundTaps + 1
                              setGroundTaps(newTaps)
                              speakAr(String(newTaps))
                              if (newTaps >= curSense.count) {
                                setTimeout(() => {
                                  sfx.done()
                                  if (step >= GROUND_SENSES.length - 1) { handleComplete() }
                                  else { setStep(s => s + 1); setGroundTaps(0); speakAr(GROUND_SENSES[step + 1].label) }
                                }, 700)
                              }
                            }
                          }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-200 active:scale-90"
                          style={{
                            background: groundTaps > i ? curSense.color : '#F3F4F6',
                            color: groundTaps > i ? '#FFF' : '#CBD5E1',
                            boxShadow: groundTaps > i ? `0 4px 16px ${curSense.color}50` : 'none',
                            transform: groundTaps > i ? 'scale(1.08)' : 'scale(1)',
                          }}>
                          {groundTaps > i ? '✓' : i + 1}
                        </button>
                      ))}
                    </div>

                    <p className="text-sm font-bold" style={{ color: curSense.color }}>
                      {groundTaps < curSense.count
                        ? `اضغط ${curSense.count - groundTaps} ${curSense.count - groundTaps === 1 ? 'مرة' : 'مرات'} بعد`
                        : '✨ رائع! الانتقال للحاسة التالية...'}
                    </p>

                    {/* Parent note */}
                    <div className="w-full rounded-2xl p-3 text-right"
                      style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', maxWidth: 320 }}>
                      <p className="text-xs font-black mb-1 text-gray-400">💡 للأهل</p>
                      <p className="text-xs text-gray-400">{steps[Math.min(step, steps.length - 1)]}</p>
                    </div>
                  </div>

                ) : isZoneCheck ? (
                /* ══ ZONE OF REGULATION MODE ══ */
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                    <p className="text-center font-black text-gray-700 text-base">كيف تشعر الآن؟</p>
                    <div className="grid grid-cols-2 gap-3">
                      {ZONES.map((z, i) => (
                        <button key={i} onClick={() => { sfx.tap(); setZoneSelected(i); speakAr(z.label) }}
                          className="rounded-2xl p-4 text-center transition-all active:scale-95"
                          style={{
                            background: zoneSelected === i ? z.color : z.color + '18',
                            border: `2px solid ${z.color}${zoneSelected === i ? '' : '40'}`,
                            transform: zoneSelected === i ? 'scale(1.04)' : 'scale(1)',
                          }}>
                          <div className="text-4xl mb-2">{z.emoji}</div>
                          <p className="font-black text-sm" style={{ color: zoneSelected === i ? '#FFF' : z.color }}>{z.label}</p>
                          <p className="text-xs mt-1" style={{ color: zoneSelected === i ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>{z.desc}</p>
                        </button>
                      ))}
                    </div>

                    {zoneSelected !== null && (
                      <div className="rounded-2xl p-4" style={{ background: ZONES[zoneSelected].color + '15', border: `1.5px solid ${ZONES[zoneSelected].color}40` }}>
                        <p className="text-xs font-black mb-2" style={{ color: ZONES[zoneSelected].color }}>🛠 أدوات مقترحة</p>
                        <div className="flex flex-wrap gap-2">
                          {ZONES[zoneSelected].tools.map((t, i) => (
                            <span key={i} className="text-sm font-bold px-3 py-1.5 rounded-xl text-white"
                              style={{ background: ZONES[zoneSelected].color }}>{t}</span>
                          ))}
                        </div>
                        <button onClick={() => handleComplete()}
                          className="mt-4 w-full font-black py-3 rounded-2xl text-white transition-all active:scale-95"
                          style={{ background: ZONES[zoneSelected].color }}>
                          <CheckCircle className="w-4 h-4 inline ml-1" /> سجّلت حالتي ✓
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                /* ══ STANDARD GUIDED STEPS ══ */
                  <div className="flex-1 overflow-y-auto flex flex-col items-center text-center px-6 py-8 gap-5">
                    {/* Big emoji — changes with animation on step change */}
                    <div key={step} style={{ fontSize: 100, lineHeight: 1,
                      animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                      filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.10))' }}>
                      {isAnimal
                        ? (steps[step].includes('دب') ? '🐻' : steps[step].includes('ضفدع') ? '🐸'
                          : steps[step].includes('أفعى') ? '🐍' : steps[step].includes('حصان') ? '🐴' : '🐾')
                        : stepEmoji(steps[step], selected.category)}
                    </div>

                    {/* Count badge */}
                    {extractCount(steps[step]) && (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl text-white -mt-2 -mb-2"
                        style={{ background: cfg.gradient }}>
                        {extractCount(steps[step])}
                      </div>
                    )}

                    {/* Key action title */}
                    <p className="font-black leading-tight" style={{ fontSize: 26, color: '#1e293b', maxWidth: 280 }}>
                      {keyTitle(steps[step])}
                    </p>

                    {/* Step timer */}
                    {stepTimer && extractTimer(steps[step]) ? (
                      <StepTimer seconds={extractTimer(steps[step])!}
                        onDone={() => { setStepTimer(false); speakAr('أحسنت!') }} />
                    ) : extractTimer(steps[step]) ? (
                      <button onClick={() => { sfx.tap(); setStepTimer(true) }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95"
                        style={{ background: cfg.light, color: '#5A32D9', border: '1.5px solid rgba(124,92,252,0.2)' }}>
                        ⏱ ابدأ العد {extractTimer(steps[step])} ثانية
                      </button>
                    ) : null}

                    {/* Speak button */}
                    <button onClick={() => { sfx.pop(); speakAr(steps[step]) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all active:scale-95"
                      style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                      <Volume2 className="w-4 h-4" /> اسمع مرة أخرى
                    </button>

                    {/* Parent guidance */}
                    <div className="w-full rounded-2xl p-4 text-right"
                      style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', maxWidth: 340 }}>
                      <p className="text-xs font-black mb-1" style={{ color: '#94A3B8' }}>💡 للأهل والمشرف</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{steps[step]}</p>
                    </div>
                  </div>
                )}

                {/* Step dots (not shown for zone check) */}
                {!isZoneCheck && (
                  <div className="flex justify-center gap-1.5 py-3 flex-shrink-0">
                    {(isGrounding ? GROUND_SENSES : steps).map((_, i) => (
                      <div key={i} className="rounded-full transition-all duration-300"
                        style={{ width: i === step ? 24 : 8, height: 8,
                          background: i === step ? (isGrounding ? curSense.color : '#7C5CFC') : i < step ? '#4ADE80' : '#E5E7EB' }} />
                    ))}
                  </div>
                )}

                {/* Bottom nav — hidden for grounding (tap-driven) and zone check */}
                {!isGrounding && !isZoneCheck && (
                <div className="p-4 flex-shrink-0 flex gap-3" style={{ borderTop: '1px solid #F0E8FF' }}>
                  <button onClick={() => { sfx.back(); setStep(s => Math.max(0, s - 1)); setStepTimer(false) }}
                    disabled={step === 0}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                    style={{ background: '#F3F4F6' }}>
                    ›
                  </button>

                  {step < steps.length - 1 ? (
                    <button onClick={() => { sfx.step(); setStep(s => s + 1); setStepTimer(false) }}
                      className="flex-1 text-white font-black py-3 rounded-2xl text-lg transition-all active:scale-95"
                      style={{ background: cfg.gradient, boxShadow: `0 4px 14px ${cfg.shadow}` }}>
                      التالي ←
                    </button>
                  ) : (
                    <button onClick={() => handleComplete()}
                      className="flex-1 text-white font-black py-3 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                      <CheckCircle className="w-5 h-5" /> انتهيت! 🎉
                    </button>
                  )}

                  <button onClick={() => { sfx.step(); setStep(s => Math.min(steps.length - 1, s + 1)); setStepTimer(false) }}
                    disabled={step === steps.length - 1}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                    style={{ background: '#F3F4F6' }}>
                    ‹
                  </button>
                </div>
                )}
              </div>
              )
            })()}

            {/* ─── COMPLETE SCREEN ─── */}
            {phase === 'complete' && result && (
              <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(160deg,#1e1b4b,#312e81,#0f172a)', maxHeight: '95vh' }}>
                <div className="flex flex-col items-center text-center px-6 py-10 gap-5">
                  {/* Trophy */}
                  <div style={{ fontSize: 90, animation: 'popIn 0.5s cubic-bezier(.34,1.56,.64,1)' }}>🏆</div>

                  <div>
                    <h2 className="text-white font-black text-3xl mb-1">أحسنت!</h2>
                    <p className="text-white/60 text-sm">{selected.titleAr}</p>
                  </div>

                  {/* Score cards */}
                  <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-yellow-400">{result.score}</div>
                      <div className="text-white/40 text-xs mt-0.5">نتيجة</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-emerald-400">{selected.points}</div>
                      <div className="text-white/40 text-xs mt-0.5">نقاط ⭐</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-cyan-400">{fmt(result.duration)}</div>
                      <div className="text-white/40 text-xs mt-0.5">وقت</div>
                    </div>
                  </div>

                  {/* Total points banner */}
                  <div className="w-full max-w-xs rounded-2xl p-4 text-center"
                    style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}>
                    <div className="text-xs text-white/70 font-bold mb-1">مجموع نقاطك</div>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-300" />
                      {totalPts + selected.points}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-xs">
                    <button onClick={closeAll}
                      className="flex-1 font-black py-3.5 rounded-2xl text-base transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                      رجوع
                    </button>
                    <button onClick={() => {
                        const next = filtered.find(e => !completed.has(e.id) && e.id !== selected.id)
                        if (next) openExercise(next)
                        else closeAll()
                      }}
                      className="flex-1 font-black py-3.5 rounded-2xl text-base text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                      التمرين التالي ←
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )
      })()}

      <style jsx global>{`
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0 }
          70%  { transform: scale(1.12) }
          100% { transform: scale(1);   opacity: 1 }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
