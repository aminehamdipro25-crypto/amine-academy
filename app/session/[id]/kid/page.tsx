'use client'
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams } from 'next/navigation'
import type { ExerciseResult } from '@/lib/types'
import { PROMPT_CARDS } from '@/lib/session-constants'
import { startNoiseEngine, type NoiseHandle } from '@/lib/noise-synth'
import { formatTime } from '@/lib/session-helpers'
import { subscribeSession, realtimeEnabled } from '@/lib/realtime-client'

const DailyVideoCall = lazy(() => import('@/components/session/DailyVideoCall'))

// ── Exercise components (same set as specialist page) ──────────────────────
const MemoryCards          = lazy(() => import('@/components/session/exercises/MemoryCards'))
const SequenceMemory       = lazy(() => import('@/components/session/exercises/SequenceMemory'))
const NBackTask            = lazy(() => import('@/components/session/exercises/NBackTask'))
const WordRecall           = lazy(() => import('@/components/session/exercises/WordRecall'))
const BreathingGuide       = lazy(() => import('@/components/session/exercises/BreathingGuide'))
const TapTarget            = lazy(() => import('@/components/session/exercises/TapTarget'))
const SimonSays            = lazy(() => import('@/components/session/exercises/SimonSays'))
const LetterMatch          = lazy(() => import('@/components/session/exercises/LetterMatch'))
const ReactionGame         = lazy(() => import('@/components/session/exercises/ReactionGame'))
const StroopTest           = lazy(() => import('@/components/session/exercises/StroopTest'))
const StopSignal           = lazy(() => import('@/components/session/exercises/StopSignal'))
const EmotionCards         = lazy(() => import('@/components/session/exercises/EmotionCards'))
const TokenBoard           = lazy(() => import('@/components/session/exercises/TokenBoard'))
const SelfRating           = lazy(() => import('@/components/session/exercises/SelfRating'))
const VerbalFluency        = lazy(() => import('@/components/session/exercises/VerbalFluency'))
const SocialScenarios      = lazy(() => import('@/components/session/exercises/SocialScenarios'))
const BehaviorContract     = lazy(() => import('@/components/session/exercises/BehaviorContract'))
const ColorGrid            = lazy(() => import('@/components/session/exercises/ColorGrid'))
const PatternMatch         = lazy(() => import('@/components/session/exercises/PatternMatch'))
const WordBuilder          = lazy(() => import('@/components/session/exercises/WordBuilder'))
const AuditoryMemory       = lazy(() => import('@/components/session/exercises/AuditoryMemory'))
const ListeningComprehension = lazy(() => import('@/components/session/exercises/ListeningComprehension'))
const PictureWordCards     = lazy(() => import('@/components/session/exercises/PictureWordCards'))
const NumberSequence       = lazy(() => import('@/components/session/exercises/NumberSequence'))
const ShadowMatch          = lazy(() => import('@/components/session/exercises/ShadowMatch'))
const StorySequencing      = lazy(() => import('@/components/session/exercises/StorySequencing'))
const WaitingGame          = lazy(() => import('@/components/session/exercises/WaitingGame'))
const SocialProblemSolving = lazy(() => import('@/components/session/exercises/SocialProblemSolving'))
const VisualSearch         = lazy(() => import('@/components/session/exercises/VisualSearch'))
const OddOneOut            = lazy(() => import('@/components/session/exercises/OddOneOut'))
const SustainedAttention   = lazy(() => import('@/components/session/exercises/SustainedAttention'))
const FlashCount           = lazy(() => import('@/components/session/exercises/FlashCount'))
const NumberSearch         = lazy(() => import('@/components/session/exercises/NumberSearch'))
const GoNoGo               = lazy(() => import('@/components/session/exercises/GoNoGo'))
const BalloonControl       = lazy(() => import('@/components/session/exercises/BalloonControl'))
const TrafficLight         = lazy(() => import('@/components/session/exercises/TrafficLight'))
const EmotionMirror        = lazy(() => import('@/components/session/exercises/EmotionMirror'))
const ConversationStarter  = lazy(() => import('@/components/session/exercises/ConversationStarter'))
const SoundDiscrimination  = lazy(() => import('@/components/session/exercises/SoundDiscrimination'))
const RhymeDetection       = lazy(() => import('@/components/session/exercises/RhymeDetection'))
const AudioSequenceRepeat  = lazy(() => import('@/components/session/exercises/AudioSequenceRepeat'))
const SequenceTap          = lazy(() => import('@/components/session/exercises/SequenceTap'))
const TargetTracking       = lazy(() => import('@/components/session/exercises/TargetTracking'))
const FingerGym            = lazy(() => import('@/components/session/exercises/FingerGym'))
const CategorySort         = lazy(() => import('@/components/session/exercises/CategorySort'))
const MathFlash            = lazy(() => import('@/components/session/exercises/MathFlash'))
const AnalogiesGame        = lazy(() => import('@/components/session/exercises/AnalogiesGame'))
const BodyScan             = lazy(() => import('@/components/session/exercises/BodyScan'))
const MoodMeter            = lazy(() => import('@/components/session/exercises/MoodMeter'))
const CalmCorner           = lazy(() => import('@/components/session/exercises/CalmCorner'))
const EmotionVolume        = lazy(() => import('@/components/session/exercises/EmotionVolume'))
const DailyGoals           = lazy(() => import('@/components/session/exercises/DailyGoals'))
const ChoiceBoard          = lazy(() => import('@/components/session/exercises/ChoiceBoard'))
const PatternPuzzle        = lazy(() => import('@/components/session/exercises/PatternPuzzle'))
const IfThen               = lazy(() => import('@/components/session/exercises/IfThen'))
const ProblemSolver        = lazy(() => import('@/components/session/exercises/ProblemSolver'))
const SpellingBee          = lazy(() => import('@/components/session/exercises/SpellingBee'))
const ReadingCards         = lazy(() => import('@/components/session/exercises/ReadingCards'))
const SpanExtension        = lazy(() => import('@/components/session/exercises/SpanExtension'))
const DirectionFollow      = lazy(() => import('@/components/session/exercises/DirectionFollow'))
const LogicSort            = lazy(() => import('@/components/session/exercises/LogicSort'))
const PhysicalExercise     = lazy(() => import('@/components/session/exercises/PhysicalExercise'))
const VisualMatch          = lazy(() => import('@/components/session/exercises/VisualMatch'))
const VisualSchedule       = lazy(() => import('@/components/session/exercises/VisualSchedule'))
const FirstThenBoard       = lazy(() => import('@/components/session/exercises/FirstThenBoard'))
const ImitationMirror      = lazy(() => import('@/components/session/exercises/ImitationMirror'))
const SensoryCheckIn       = lazy(() => import('@/components/session/exercises/SensoryCheckIn'))
const LetterReversal       = lazy(() => import('@/components/session/exercises/LetterReversal'))
const SyllableTap          = lazy(() => import('@/components/session/exercises/SyllableTap'))
const MatrixPuzzle         = lazy(() => import('@/components/session/exercises/MatrixPuzzle'))
const ClockReading         = lazy(() => import('@/components/session/exercises/ClockReading'))
const PicturePuzzle        = lazy(() => import('@/components/session/exercises/PicturePuzzle'))
const JigsawPuzzle         = lazy(() => import('@/components/session/exercises/JigsawPuzzle'))
const PatternBoard         = lazy(() => import('@/components/session/exercises/PatternBoard'))
const ColorSudoku          = lazy(() => import('@/components/session/exercises/ColorSudoku'))
const MoneyCounter         = lazy(() => import('@/components/session/exercises/MoneyCounter'))
const CrossLateral         = lazy(() => import('@/components/session/exercises/CrossLateral'))
const ReadingFluency       = lazy(() => import('@/components/session/exercises/ReadingFluency'))
const LetterSearch         = lazy(() => import('@/components/session/exercises/LetterSearch'))
const StoryReader          = lazy(() => import('@/components/session/exercises/StoryReader'))

const PHYSICAL_IDS = ['jumping-jacks','obstacle-circuit','balance-walk','tiger-crawl','ball-throw','stretching','body-percussion']

type LiveState = { exerciseId: string; difficulty: number } | null
type WBStroke = { c: string; s: number; e: boolean; p: number[] }
type WBState  = { active: boolean; strokes: WBStroke[]; rev: number; ar?: number }
type TimerState = { active: boolean; total: number; countUp: boolean; running: boolean; left: number; ts: number }

// Read-only countdown/countup display mirroring the specialist's timer.
// `left`/`ts` are a snapshot — while running, the displayed value is
// extrapolated from elapsed wall-clock time since `ts` and re-synced on
// every poll, so it ticks smoothly between polls without drifting.
function KidTimerDisplay({ timer }: { timer: TimerState }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!timer.running) return
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [timer.running])

  const elapsed = timer.running ? Math.floor((now - timer.ts) / 1000) : 0
  const rawLeft = timer.countUp ? timer.left + elapsed : timer.left - elapsed
  const left = Math.max(0, Math.min(timer.total, rawLeft))
  const isDone = timer.countUp ? left >= timer.total : left <= 0
  const pct = timer.total > 0 ? left / timer.total : 0
  const numColor = timer.countUp ? '#22C55E'
    : pct <= 0.1 ? '#EF4444'
    : pct <= 0.25 ? '#F59E0B'
    : '#22C55E'

  return (
    <div
      className="fixed z-[150] flex flex-col items-center justify-center select-none"
      style={{
        bottom: 80, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.88)', borderRadius: 24, backdropFilter: 'blur(12px)',
        border: `2px solid ${numColor}88`, boxShadow: `0 0 40px ${numColor}22`,
        minWidth: 210, padding: '20px 32px',
      }}
    >
      {isDone ? (
        <div className="flex flex-col items-center gap-1">
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🌟</div>
          <div className="text-white font-black text-lg mt-1">أحسنت! انتهى الوقت</div>
        </div>
      ) : (
        <>
          <div
            className="font-black ltr-num"
            style={{ fontSize: '3.5rem', color: numColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}
          >
            {formatTime(left)}
          </div>
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct * 100}%`, background: numColor }} />
          </div>
        </>
      )}
    </div>
  )
}

// Full-screen prompt card overlay — mirrors the specialist's own card exactly
// (see the "Prompt Card Full-Screen Overlay" block in app/session/[id]/page.tsx),
// looked up locally from the shared PROMPT_CARDS constant by id.
function KidPromptCardOverlay({ cardId }: { cardId: string }) {
  const card = PROMPT_CARDS.find(c => c.id === cardId)
  if (!card) return null
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center select-none"
      style={{ background: card.bg }}
      dir="rtl"
    >
      <div className="text-center">
        <div className="leading-none mb-8" style={{ fontSize: '10rem', filter: `drop-shadow(0 0 40px ${card.glow}88)` }}>
          {card.emoji}
        </div>
        <div className="text-white font-black" style={{ fontSize: '4.5rem', textShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 60px ${card.glow}66` }}>
          {card.text}
        </div>
      </div>
    </div>
  )
}

// Read-only mirror of the specialist's whiteboard. Strokes are normalized 0..1
// against the SPECIALIST canvas, so the kid canvas is letterboxed to the
// specialist's aspect ratio (wb.ar) — otherwise independent x/y scaling would
// stretch every drawing.
function KidWhiteboardOverlay({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wb, setWb] = useState<WBState | null>(null)

  // Stroke content sync — the bottleneck for how quickly a drawn line appears
  // on the child's screen. With realtime on, each pen-lift wakes this
  // instantly (~100ms) and the interval is just a safety net; without it,
  // fall back to a fast 500ms poll.
  useEffect(() => {
    let stop = false
    const tick = async () => {
      try {
        const r = await fetch(`/api/sessions/${id}/whiteboard`)
        const { wb: data } = await r.json() as { wb: WBState }
        if (!stop) setWb(data)
      } catch { /* ignore */ }
    }
    tick()
    const rt = realtimeEnabled()
    const unsub = subscribeSession(id, ev => { if (ev === 'whiteboard') tick() })
    const iv = setInterval(tick, rt ? 4000 : 500)
    return () => { stop = true; unsub(); clearInterval(iv) }
  }, [id])

  // Redraw whenever strokes change
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !wb) return
    c.width  = c.offsetWidth
    c.height = c.offsetHeight
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1F2937'
    ctx.fillRect(0, 0, c.width, c.height)

    // Letterbox: compute a sub-rectangle of the kid canvas whose aspect ratio
    // matches the specialist's (wb.ar). Strokes map into THIS box uniformly.
    const ar = wb.ar && wb.ar > 0 ? wb.ar : 4 / 3
    const cAR = c.width / c.height
    let bw = c.width, bh = c.height, ox = 0, oy = 0
    if (cAR > ar) { bw = c.height * ar; ox = (c.width - bw) / 2 }   // pillarbox
    else          { bh = c.width / ar;  oy = (c.height - bh) / 2 }  // letterbox
    const X = (nx: number) => ox + nx * bw
    const Y = (ny: number) => oy + ny * bh

    for (const st of wb.strokes) {
      ctx.globalCompositeOperation = st.e ? 'destination-out' : 'source-over'
      ctx.strokeStyle = st.e ? 'rgba(0,0,0,1)' : st.c
      ctx.fillStyle   = ctx.strokeStyle
      ctx.lineWidth   = st.s
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      const pts = st.p
      if (pts.length === 2) {
        ctx.beginPath()
        ctx.arc(X(pts[0]), Y(pts[1]), st.s / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(X(pts[0]), Y(pts[1]))
        for (let i = 2; i < pts.length - 1; i += 2) {
          ctx.lineTo(X(pts[i]), Y(pts[i + 1]))
        }
        ctx.stroke()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [wb?.rev, wb])

  if (!wb?.active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#1F2937' }}>
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(124,92,252,0.9)', color: '#fff', borderRadius: 12,
        padding: '6px 14px', fontSize: 13, fontWeight: 900,
      }} dir="rtl">
        ✏️ سبورة الأستاذ
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

export default function KidSessionPage() {
  const { id } = useParams<{ id: string }>()
  const [live, setLive] = useState<LiveState>(null)
  const [done, setDone] = useState(false)
  const [nonce, setNonce] = useState(0)
  const prevId = useRef<string | null>(null)
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)
  const [videoHidden, setVideoHidden] = useState(false)
  const [sharedContentUrl, setSharedContentUrl] = useState<string | null>(null)
  const [wbActive, setWbActive] = useState(false)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const noiseHandleRef = useRef<NoiseHandle | null>(null)
  // Tracks whichever of {synthesized mode, custom audio URL} is currently
  // playing, so we only restart audio on an actual transition, not every poll.
  const noiseKeyRef = useRef<string | null>(null)
  const customAudioElRef = useRef<HTMLAudioElement | null>(null)

  // Fetch meeting URL once on load
  useEffect(() => {
    fetch(`/api/sessions/${id}/meeting`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.meetingUrl) setMeetingUrl(d.meetingUrl) })
      .catch(() => {})
  }, [id])

  // Presence heartbeat — lets the specialist know the child is genuinely
  // still on this page (not just that an exercise once started). Without
  // this, closing the tab / losing connection / navigating away looked
  // identical to "still here, just not doing anything" from the specialist's
  // side — no signal at all when the child actually left.
  useEffect(() => {
    if (!id) return
    const beat = () => {
      fetch(`/api/sessions/${id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'kid' }),
      }).catch(() => {})
    }
    beat()
    const iv = setInterval(beat, 10_000)
    return () => clearInterval(iv)
  }, [id])

  // Per-channel fetchers — each re-reads Redis (the source of truth) for ONE
  // channel and applies it. A realtime wake-up event refreshes just the
  // channel that changed; the safety-net interval refreshes all of them.
  const fetchLive = useCallback(async () => {
    try {
      const { live: data } = await (await fetch(`/api/sessions/${id}/live`)).json() as { live: LiveState }
      if (data?.exerciseId !== prevId.current) {
        prevId.current = data?.exerciseId ?? null
        setDone(false)
        setNonce(n => n + 1)
        setLive(data)
      }
    } catch { /* ignore */ }
  }, [id])

  const fetchContent = useCallback(async () => {
    try {
      const { contentUrl } = await (await fetch(`/api/sessions/${id}/content`)).json() as { contentUrl: string | null }
      setSharedContentUrl(contentUrl)
    } catch { /* ignore */ }
  }, [id])

  const fetchWbActive = useCallback(async () => {
    try {
      const { wb } = await (await fetch(`/api/sessions/${id}/whiteboard`)).json() as { wb: WBState }
      setWbActive(!!wb?.active)
    } catch { /* ignore */ }
  }, [id])

  const fetchTimer = useCallback(async () => {
    try {
      const { timer } = await (await fetch(`/api/sessions/${id}/timer`)).json() as { timer: TimerState }
      setTimerState(timer?.active ? timer : null)
    } catch { /* ignore */ }
  }, [id])

  const fetchCard = useCallback(async () => {
    try {
      const { card } = await (await fetch(`/api/sessions/${id}/card`)).json() as { card: { cardId: string | null } }
      setCardId(card?.cardId ?? null)
    } catch { /* ignore */ }
  }, [id])

  // Drive the noise/audio engine. There is no audio file to stream, so the
  // child's browser runs the SAME synthesis (lib/noise-synth.ts) or plays the
  // shared URL — started/stopped/switched only on an actual transition, never
  // re-created on an unrelated refresh.
  const fetchNoise = useCallback(async () => {
    try {
      const { noise } = await (await fetch(`/api/sessions/${id}/noise`)).json() as { noise: { active: boolean; mode: string; customUrl?: string | null } }
      const wantActive = noise?.active ?? false
      const wantKey = wantActive ? (noise.customUrl ? `url:${noise.customUrl}` : `mode:${noise.mode}`) : null
      if (wantKey !== noiseKeyRef.current) {
        noiseHandleRef.current?.stop()
        noiseHandleRef.current = null
        if (customAudioElRef.current) { customAudioElRef.current.pause(); customAudioElRef.current = null }
        if (wantActive && noise.customUrl) {
          const audio = new Audio(noise.customUrl)
          audio.loop = true
          audio.play().catch(() => {})
          customAudioElRef.current = audio
        } else if (wantActive) {
          noiseHandleRef.current = startNoiseEngine(noise.mode as Parameters<typeof startNoiseEngine>[0])
        }
        noiseKeyRef.current = wantKey
      }
    } catch { /* ignore */ }
  }, [id])

  const pollAll = useCallback(() => {
    fetchLive(); fetchContent(); fetchWbActive(); fetchTimer(); fetchCard(); fetchNoise()
  }, [fetchLive, fetchContent, fetchWbActive, fetchTimer, fetchCard, fetchNoise])

  // Stop any playing audio if the child navigates away mid-session
  useEffect(() => {
    return () => {
      noiseHandleRef.current?.stop()
      customAudioElRef.current?.pause()
    }
  }, [])

  // Realtime: instant wake-ups via Pusher when configured (~100ms), falling
  // back to fast polling (1s) when it isn't. With realtime on, the interval
  // drops to a rare safety net that catches any missed event.
  useEffect(() => {
    if (!id) return
    pollAll()
    const rt = realtimeEnabled()
    const unsub = subscribeSession(id, ev => {
      if (ev === 'live') fetchLive()
      else if (ev === 'content') fetchContent()
      else if (ev === 'whiteboard') fetchWbActive()
      else if (ev === 'timer') fetchTimer()
      else if (ev === 'card') fetchCard()
      else if (ev === 'noise') fetchNoise()
    })
    const iv = setInterval(pollAll, rt ? 6000 : 1000)
    return () => { unsub(); clearInterval(iv) }
  }, [id, pollAll, fetchLive, fetchContent, fetchWbActive, fetchTimer, fetchCard, fetchNoise])

  // Report status to specialist when exercise starts/finishes. `result` is
  // only present on a real completion (the exercise's onComplete callback
  // passes its full score/accuracy/errors) — a cancel has none — so the
  // specialist can see not just THAT the child finished, but how they did.
  const reportStatus = useCallback((exerciseId: string, status: 'active' | 'done', result?: ExerciseResult) => {
    fetch(`/api/sessions/${id}/kid-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId,
        status,
        score: result?.score,
        accuracy: result?.accuracy,
        errors: result?.errors,
      }),
    }).catch(() => {})
  }, [id])

  // Exercise calls this with a full result object on completion; the same
  // handler is reused for onCancel, which calls it with no arguments.
  const handleDone = useCallback((result?: ExerciseResult) => {
    setDone(true)
    if (live?.exerciseId) reportStatus(live.exerciseId, 'done', result)
  }, [live?.exerciseId, reportStatus])

  // Report active when a new exercise is received
  useEffect(() => {
    if (live?.exerciseId) reportStatus(live.exerciseId, 'active')
  }, [live?.exerciseId, reportStatus])

  const difficulty = (live?.difficulty ?? 1) as 1|2|3

  // ── Teacher video — embedded in-page (Daily.co SDK, no iframe, no links).
  // Mounted ONCE for the whole session so the call never drops between
  // screens; hiding only collapses the box (audio keeps playing).
  const [videoSmall, setVideoSmall] = useState(false)
  const teacherVideo = meetingUrl && (
    <>
      <div style={{
        position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
        width:  videoSmall ? 120 : 'min(240px, 40vw)',
        height: videoSmall ? 90  : 180,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        border: '2px solid rgba(255,255,255,0.3)',
        background: '#111827',
        display: videoHidden ? 'none' : 'block',
      }}>
        <Suspense fallback={
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>
            جارٍ التحميل...
          </div>
        }>
          <DailyVideoCall url={meetingUrl} userName="الطفل" compact role="kid" />
        </Suspense>
        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, display: 'flex', gap: 4 }}>
          <button
            onClick={() => setVideoSmall(s => !s)}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none',
              color: '#fff', fontSize: 10, cursor: 'pointer',
            }}
          >{videoSmall ? '▲' : '▼'}</button>
          <button
            onClick={() => setVideoHidden(true)}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none',
              color: '#fff', fontSize: 10, cursor: 'pointer',
            }}
          >✕</button>
        </div>
      </div>
      {videoHidden && (
        <button
          onClick={() => setVideoHidden(false)}
          style={{
            position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
            padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#6D28D9,#9333EA)', color: '#fff',
            fontWeight: 900, fontSize: 13, boxShadow: '0 4px 20px rgba(109,40,217,0.4)',
          }}
        >📹 الأستاذ</button>
      )}
    </>
  )

  // ── Main content: waiting screen OR active exercise ───────────────────
  let mainContent: React.ReactNode

  if (!live || done) {
    mainContent = (
      <div
        dir="rtl"
        style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          background: 'linear-gradient(160deg,#FFF0FA 0%,#EEF0FF 40%,#F0FFF8 70%,#FFFBF0 100%)',
          padding: 24, gap: 24,
        }}
      >
        {/* Animated stars */}
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'bounce 2s infinite' }}>
          {done ? '🌟' : '⏳'}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#6D28D9' }}>
          {done ? 'أحسنت! 🎉' : 'في انتظار الأستاذ...'}
        </div>
        <div style={{ fontSize: 16, color: '#7C3AED', opacity: 0.7, maxWidth: 300 }}>
          {done
            ? 'انتهيت بتميز! سيختار الأستاذ التمرين التالي'
            : 'سيبدأ التمرين قريباً، ابقَ مستعداً!'}
        </div>
        {/* Pulsing ring */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '4px solid #A78BFA',
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          opacity: 0.4,
        }} />
        <style>{`
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
          @keyframes ping   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2);opacity:0} }
        `}</style>
      </div>
    )
  } else {
    // ── Exercise renderer ────────────────────────────────────────────────
    const id_ = live.exerciseId
    const props = { onComplete: handleDone, onCancel: handleDone, difficulty, studentAge: 10 }

    mainContent = (
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#fff', position: 'relative' }}>
      <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'5px solid #A78BFA', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <div key={`${id_}-${nonce}`} style={{ width:'100%', height:'100%' }}>
          {id_ === 'memory-cards'         && <MemoryCards          {...props} />}
          {id_ === 'sequence-memory'      && <SequenceMemory       {...props} />}
          {id_ === 'n-back'               && <NBackTask            {...props} />}
          {id_ === 'word-recall'          && <WordRecall           {...props} />}
          {id_ === 'breathing'            && <BreathingGuide       {...props} />}
          {id_ === 'tap-target'           && <TapTarget            {...props} />}
          {id_ === 'simon-says'           && <SimonSays            {...props} />}
          {id_ === 'letter-match'         && <LetterMatch          {...props} />}
          {id_ === 'reaction-game'        && <ReactionGame         {...props} />}
          {id_ === 'stroop-test'          && <StroopTest           {...props} />}
          {id_ === 'stop-signal'          && <StopSignal           {...props} />}
          {id_ === 'emotion-cards'        && <EmotionCards         {...props} />}
          {id_ === 'token-board'          && <TokenBoard           {...props} />}
          {id_ === 'self-rating'          && <SelfRating           {...props} />}
          {id_ === 'verbal-fluency'       && <VerbalFluency        {...props} />}
          {id_ === 'social-scenarios'     && <SocialScenarios      {...props} />}
          {id_ === 'behavior-contract'    && <BehaviorContract     {...props} />}
          {id_ === 'color-grid'           && <ColorGrid            {...props} />}
          {id_ === 'pattern-match'        && <PatternMatch         {...props} />}
          {id_ === 'word-builder'         && <WordBuilder          {...props} />}
          {id_ === 'auditory-memory'      && <AuditoryMemory       {...props} />}
          {id_ === 'listening-comprehension' && <ListeningComprehension {...props} />}
          {id_ === 'picture-word-cards'   && <PictureWordCards     {...props} />}
          {id_ === 'number-sequence'      && <NumberSequence       {...props} />}
          {id_ === 'shadow-match'         && <ShadowMatch          {...props} />}
          {id_ === 'story-sequencing'     && <StorySequencing      {...props} />}
          {id_ === 'waiting-game'         && <WaitingGame          {...props} />}
          {id_ === 'social-problem-solving' && <SocialProblemSolving {...props} />}
          {id_ === 'visual-search'        && <VisualSearch         {...props} />}
          {id_ === 'odd-one-out'          && <OddOneOut            {...props} />}
          {id_ === 'sustained-attention'  && <SustainedAttention   {...props} />}
          {id_ === 'flash-count'          && <FlashCount           {...props} />}
          {id_ === 'number-search'        && <NumberSearch         {...props} />}
          {id_ === 'go-no-go'             && <GoNoGo               {...props} />}
          {id_ === 'balloon-control'      && <BalloonControl       {...props} />}
          {id_ === 'traffic-light'        && <TrafficLight         {...props} />}
          {id_ === 'emotion-mirror'       && <EmotionMirror        {...props} />}
          {id_ === 'conversation-starter' && <ConversationStarter  {...props} />}
          {id_ === 'sound-discrimination' && <SoundDiscrimination  {...props} />}
          {id_ === 'rhyme-detection'      && <RhymeDetection       {...props} />}
          {id_ === 'audio-sequence'       && <AudioSequenceRepeat  {...props} />}
          {id_ === 'sequence-tap'         && <SequenceTap          {...props} />}
          {id_ === 'target-tracking'      && <TargetTracking       {...props} />}
          {id_ === 'finger-gym'           && <FingerGym            {...props} />}
          {id_ === 'category-sort'        && <CategorySort         {...props} />}
          {id_ === 'math-flash'           && <MathFlash            {...props} />}
          {id_ === 'analogies'            && <AnalogiesGame        {...props} />}
          {id_ === 'body-scan'            && <BodyScan             {...props} />}
          {id_ === 'mood-meter'           && <MoodMeter            {...props} />}
          {id_ === 'calm-corner'          && <CalmCorner           {...props} />}
          {id_ === 'emotion-volume'       && <EmotionVolume        {...props} />}
          {id_ === 'daily-goals'          && <DailyGoals           {...props} />}
          {id_ === 'choice-board'         && <ChoiceBoard          {...props} />}
          {id_ === 'pattern-puzzle'       && <PatternPuzzle        {...props} />}
          {id_ === 'if-then'              && <IfThen               {...props} />}
          {id_ === 'problem-solver'       && <ProblemSolver        {...props} />}
          {id_ === 'spelling-bee'         && <SpellingBee          {...props} />}
          {id_ === 'reading-cards'        && <ReadingCards         {...props} />}
          {id_ === 'span-extension'       && <SpanExtension        {...props} />}
          {id_ === 'direction-follow'     && <DirectionFollow      {...props} />}
          {id_ === 'logic-sort'           && <LogicSort            {...props} />}
          {id_ === 'visual-match'         && <VisualMatch          {...props} />}
          {id_ === 'visual-schedule'      && <VisualSchedule       {...props} />}
          {id_ === 'first-then-board'     && <FirstThenBoard       {...props} />}
          {id_ === 'imitation-mirror'     && <ImitationMirror      {...props} />}
          {id_ === 'sensory-checkin'      && <SensoryCheckIn       {...props} />}
          {id_ === 'letter-reversal'      && <LetterReversal       {...props} />}
          {id_ === 'syllable-tap'         && <SyllableTap          {...props} />}
          {id_ === 'matrix-puzzle'        && <MatrixPuzzle         {...props} />}
          {id_ === 'clock-reading'        && <ClockReading         {...props} />}
          {id_ === 'picture-puzzle'       && <PicturePuzzle        {...props} />}
          {id_ === 'jigsaw-puzzle'        && <JigsawPuzzle         {...props} />}
          {id_ === 'pattern-board'        && <PatternBoard         {...props} />}
          {id_ === 'color-sudoku'         && <ColorSudoku          {...props} />}
          {id_ === 'money-counter'        && <MoneyCounter         {...props} />}
          {id_ === 'cross-lateral'        && <CrossLateral         {...props} />}
          {id_ === 'reading-fluency'      && <ReadingFluency       {...props} />}
          {id_ === 'letter-search'        && <LetterSearch         {...props} />}
          {id_ === 'story-reader'         && <StoryReader          {...props} />}
          {PHYSICAL_IDS.includes(id_)     && <PhysicalExercise id={id_} {...props} />}
        </div>
      </Suspense>
    </div>
    )
  }

  return (
    <>
      {mainContent}
      {/* Shared content (specialist screen share) — global overlay */}
      {sharedContentUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}>
          <iframe
            src={sharedContentUrl}
            allow="autoplay; fullscreen"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="محتوى مشترك"
          />
        </div>
      )}
      {/* Whiteboard mirror — above shared content */}
      {wbActive && <KidWhiteboardOverlay id={id} />}
      {/* Specialist's visible timer — motivates/paces the child through a task */}
      {timerState && <KidTimerDisplay timer={timerState} />}
      {/* Specialist's prompt card — full-screen, above everything but the video */}
      {cardId && <KidPromptCardOverlay cardId={cardId} />}
      {/* Teacher video call — always on top, mounted once for the whole session */}
      {teacherVideo}
    </>
  )
}
