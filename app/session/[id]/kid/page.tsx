'use client'
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams } from 'next/navigation'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { PROMPT_CARDS } from '@/lib/session-constants'
import { startNoiseEngine, type NoiseHandle } from '@/lib/noise-synth'
import { formatTime } from '@/lib/session-helpers'
import { subscribeSession, realtimeEnabled, subscribeConnectionState } from '@/lib/realtime-client'
import { playCorrect, playWrong } from '@/lib/feedback-sound'
import ExerciseErrorBoundary from '@/components/session/ExerciseErrorBoundary'

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

type LiveState = { exerciseId: string; difficulty: number; seed?: number; locked?: boolean } | null
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

const READY_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#3B82F6']
const READY_QUESTIONS: { field: 'sleep' | 'energy' | 'mood'; label: string; icons: string[] }[] = [
  { field: 'sleep',  label: 'كيف نمت الليلة؟ 😴',  icons: ['😴', '😟', '😐', '🙂', '🌟'] },
  { field: 'energy', label: 'كم طاقتك الآن؟ ⚡',   icons: ['🔋', '😐', '🙂', '⚡', '🚀'] },
  { field: 'mood',   label: 'كيف مزاجك اليوم؟ 😊', icons: ['😢', '😟', '😐', '🙂', '😄'] },
]

// Full-screen encouragement burst fired by the specialist. A big central
// pop plus a shower of the same emoji rising up the screen, then it clears
// itself. Purely decorative and non-interactive (pointerEvents:none) so it
// never blocks the child mid-exercise.
const REACTION_EMOJI: Record<string, string> = {
  star: '⭐', celebrate: '🎉', clap: '👏', love: '❤️', rainbow: '🌈', thumbs: '👍',
}
function KidReactionBurst({ reaction, onDone }: { reaction: { type: string; id: number }; onDone: () => void }) {
  const emoji = REACTION_EMOJI[reaction.type] ?? '⭐'
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    left: 4 + (i * 61) % 92,
    delay: (i % 8) * 80,
    dur: 1500 + (i % 5) * 280,
    size: 30 + (i % 4) * 16,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
      <style>{`
        @keyframes kidReactPop  { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:0} 40%{transform:translate(-50%,-50%) scale(1.15);opacity:1} 100%{transform:translate(-50%,-50%) scale(1.5);opacity:0} }
        @keyframes kidReactRise { 0%{transform:translateY(20px) scale(0.4);opacity:0} 15%{opacity:1} 100%{transform:translateY(-70vh) scale(1.15);opacity:0} }
      `}</style>
      <div style={{ position: 'absolute', top: '40%', left: '50%', fontSize: 128, animation: 'kidReactPop 1.4s ease-out forwards' }}>{emoji}</div>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: -40, left: `${p.left}%`, fontSize: p.size,
          animation: `kidReactRise ${p.dur}ms cubic-bezier(0.22,0.61,0.36,1) ${p.delay}ms forwards`,
        }}>{emoji}</div>
      ))}
    </div>
  )
}

// Brief screen-edge glow on each answer — green for correct, soft red for
// wrong. Subtle (inset shadow, non-interactive) so it reinforces the answer
// without covering the exercise. Paired with the feedback sound.
function KidAnswerGlow({ correct, onDone }: { correct: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 650)
    return () => clearTimeout(t)
  }, [onDone])
  const rgb = correct ? '34,197,94' : '244,114,114'
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        boxShadow: `inset 0 0 90px 22px rgba(${rgb},0.5)`,
        animation: 'kidGlowFade 0.65s ease-out forwards',
      }}
    >
      <style>{`@keyframes kidGlowFade { 0%{opacity:0} 18%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  )
}

// The child's progress map — a Duolingo-style path of the exercises they've
// finished this session, each a lit node with its earned stars, plus the
// total and a pulsing "next" node. Shown between exercises so the child sees
// their journey grow and stays motivated (the specialist asked for this to
// appear every time).
function KidProgressMap({ stars, done }: { stars: { id: string; stars: number }[]; done: boolean }) {
  const total = stars.reduce((s, x) => s + x.stars, 0)
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        background: 'linear-gradient(160deg,#FFF0FA 0%,#EEF0FF 40%,#F0FFF8 70%,#FFFBF0 100%)',
        padding: '28px 20px', gap: 16,
      }}
    >
      <div style={{ fontSize: 60, lineHeight: 1, animation: 'kidBounce 2s infinite' }}>{done ? '🌟' : '🗺️'}</div>
      <div style={{ fontSize: 25, fontWeight: 900, color: '#6D28D9' }}>{done ? 'أحسنت! 🎉' : 'رحلتك اليوم'}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 999, padding: '8px 18px', boxShadow: '0 6px 20px rgba(124,92,252,0.18)' }}>
        <span style={{ fontSize: 24 }}>⭐</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: '#F59E0B' }}>{total}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF' }}>نجمة</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 340, marginTop: 4 }}>
        {stars.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7C5CFC,#C084FC)', color: '#fff', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 12px rgba(124,92,252,0.4)' }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 10 }}>{'⭐'.repeat(s.stars)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3EEFF', border: '2px dashed #C4B5FD', color: '#A78BFA', fontWeight: 900, fontSize: 20, animation: 'kidPulse 1.4s ease-in-out infinite' }}>
            {done ? '🎯' : '⏳'}
          </div>
          <div style={{ fontSize: 10, color: '#A78BFA', fontWeight: 800 }}>التالي</div>
        </div>
      </div>

      <div style={{ fontSize: 15, color: '#7C3AED', opacity: 0.75, maxWidth: 300 }}>
        {done ? 'رائع! سيختار الأستاذ التمرين التالي' : (stars.length ? 'استعد للتمرين التالي! 🚀' : 'في انتظار الأستاذ ليبدأ...')}
      </div>

      <style>{`
        @keyframes kidBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes kidPulse  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
      `}</style>
    </div>
  )
}

// The child answers the pre-session readiness check directly — same 3
// questions the specialist used to fill in from observation, now tapped by
// the child themselves (faces they recognize) and synced live to the
// specialist's screen. Shown in place of the plain waiting screen whenever
// the specialist has this phase open (readiness.active) and no exercise has
// started yet.
function KidReadinessScreen({
  readiness,
  onAnswer,
}: {
  readiness: { sleep: number; energy: number; mood: number }
  onAnswer: (field: 'sleep' | 'energy' | 'mood', value: number) => void
}) {
  const allAnswered = readiness.sleep > 0 && readiness.energy > 0 && readiness.mood > 0

  return (
    <div
      dir="rtl"
      style={{
        // Not vertically centered, and with real bottom padding: while the
        // call is live, Chrome/Android draw their own "camera/mic in use"
        // control (a browser feature, not ours) fixed over the viewport's
        // bottom-left corner. That's unavoidable, so instead we keep this
        // screen's own content — especially the last question's face
        // buttons — from ever landing under it, and let the page scroll if
        // a short device needs it.
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center',
        background: 'linear-gradient(160deg,#FFF8F0 0%,#FFF3E8 45%,#F3EEFF 100%)',
        padding: '24px 20px 200px', gap: 0, overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 56, marginBottom: 6 }}>👋</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#6D28D9', marginBottom: 4 }}>
          أخبرنا عن نفسك!
        </div>
        <div style={{ fontSize: 13, color: '#7C3AED', opacity: 0.7, marginBottom: 24 }}>
          اضغط على الوجه الذي يشبهك 🌈
        </div>

        {READY_QUESTIONS.map(({ field, label, icons }) => {
          const val = readiness[field]
          return (
            <div key={field} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#374151', marginBottom: 10 }}>{label}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {icons.map((icon, i) => {
                  const selected = val === i + 1
                  const color = READY_COLORS[i]
                  return (
                    <button
                      key={i}
                      onClick={() => onAnswer(field, i + 1)}
                      style={{
                        flex: 1, maxWidth: 62, aspectRatio: '1', borderRadius: 18,
                        fontSize: '1.85rem', border: selected ? `2.5px solid ${color}` : '2px solid #F3EEFF',
                        background: selected ? `linear-gradient(135deg,${color}26,${color}12)` : '#FFFFFF',
                        boxShadow: selected ? `0 8px 20px ${color}35` : '0 2px 8px rgba(0,0,0,0.04)',
                        transform: selected ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                        transition: 'all 0.2s', cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div
          style={{
            marginTop: 8, padding: '14px 18px', borderRadius: 18,
            background: allAnswered ? 'linear-gradient(135deg,#D1FAE5,#A7F3D0)' : 'rgba(124,92,252,0.08)',
            color: allAnswered ? '#065F46' : '#7C3AED',
            fontSize: 14, fontWeight: 800, transition: 'all 0.3s',
          }}
        >
          {allAnswered ? '🎉 رائع! ننتظر الأستاذ ليبدأ' : 'أجب على الأسئلة الثلاثة لنبدأ 🌟'}
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
  // Tracks the current "activation" = `${exerciseId}:${seed}`. A restart of
  // the SAME exercise keeps exerciseId but mints a new seed, so keying on
  // exerciseId alone (as before) silently ignored restarts — the child kept
  // the old board and never re-seeded. Including the seed catches restarts.
  const activationRef = useRef<string | null>(null)
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)
  const [videoHidden, setVideoHidden] = useState(false)
  const [sharedContentUrl, setSharedContentUrl] = useState<string | null>(null)
  const [wbActive, setWbActive] = useState(false)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<{ active: boolean; sleep: number; energy: number; mood: number } | null>(null)
  // Live encouragement burst fired by the specialist (star/celebrate/…). We
  // only animate a reaction whose id we haven't shown yet, so polling the same
  // stored reaction repeatedly doesn't loop the animation.
  const [reactionBurst, setReactionBurst] = useState<{ type: string; id: number } | null>(null)
  const lastReactionIdRef = useRef(0)
  // The child's own session progress — one entry per completed exercise, with
  // 1–3 stars by score. Persisted to localStorage (keyed by session) so a
  // reload keeps the child's stars. Drives the progress map shown between
  // exercises, the motivator the specialist wanted the child to see each time.
  const [kidStars, setKidStars] = useState<{ id: string; stars: number }[]>([])
  // Unified per-answer feedback (sound + screen glow), driven off the same
  // onProgress the exercises already emit — so all 60 get consistent feedback.
  const [answerGlow, setAnswerGlow] = useState<{ correct: boolean; id: number } | null>(null)
  const noiseHandleRef = useRef<NoiseHandle | null>(null)
  // Tracks whichever of {synthesized mode, custom audio URL} is currently
  // playing, so we only restart audio on an actual transition, not every poll.
  const noiseKeyRef = useRef<string | null>(null)
  const customAudioElRef = useRef<HTMLAudioElement | null>(null)

  // Restore the child's star progress for this session on load.
  useEffect(() => {
    if (!id) return
    try {
      const raw = localStorage.getItem(`kid-stars:${id}`)
      if (raw) setKidStars(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [id])

  // Unlock audio on the child's FIRST tap. Mobile browsers (esp. Android
  // Chrome) block programmatically-triggered speech and Web-Audio until a
  // user gesture — and the listening exercises auto-play their prompt, so
  // without this the child would hear nothing on the first play. One real
  // tap primes both engines for the rest of the session (the child still has
  // a "🔊 tap to listen" button as a fallback in each listening exercise).
  useEffect(() => {
    let unlocked = false
    const unlock = () => {
      if (unlocked) return
      unlocked = true
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(' ')
          u.volume = 0
          window.speechSynthesis.speak(u)
        }
      } catch { /* ignore */ }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('touchstart', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  // Fetch the meeting URL, RETRYING until it succeeds. A single failed fetch
  // (transient network/Redis blip on load) used to leave the child with no
  // video for the entire session and no way to recover. Now we back off and
  // keep trying (capped at 10s) until we have a URL, then stop.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    let attempt = 0
    const tryFetch = async () => {
      if (cancelled) return
      try {
        const r = await fetch(`/api/sessions/${id}/meeting`)
        const d = r.ok ? await r.json() : null
        if (d?.meetingUrl) { if (!cancelled) setMeetingUrl(d.meetingUrl); return }
      } catch { /* fall through to retry */ }
      if (cancelled) return
      attempt++
      const delay = Math.min(10000, 1000 * 2 ** Math.min(attempt, 4))
      setTimeout(tryFetch, delay)
    }
    tryFetch()
    return () => { cancelled = true }
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
      // A NEW activation = a different exercise OR the same exercise restarted
      // (the specialist mints a fresh seed on every start AND restart). On a
      // new activation we remount (nonce bump) so the exercise re-seeds and
      // re-runs from scratch, and clear `done`. A difficulty-only change (same
      // exercise, same seed — e.g. the adaptive engine nudging the level)
      // updates the prop WITHOUT a remount, mirroring the specialist side.
      const activation = data ? `${data.exerciseId}:${data.seed ?? ''}` : null
      if (activation !== activationRef.current) {
        activationRef.current = activation
        setDone(false)
        setNonce(n => n + 1)
        setLive(data)
      } else {
        setLive(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data)
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
      const r = await fetch(`/api/sessions/${id}/whiteboard`)
      if (!r.ok) return   // keep last state on a transient error, don't force-close the board
      const { wb } = await r.json() as { wb?: WBState }
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

  const fetchReadiness = useCallback(async () => {
    try {
      const { readiness: r } = await (await fetch(`/api/sessions/${id}/readiness`)).json() as {
        readiness: { active: boolean; sleep: number; energy: number; mood: number }
      }
      setReadiness(r ?? null)
    } catch { /* ignore */ }
  }, [id])

  const fetchReaction = useCallback(async () => {
    try {
      const { reaction } = await (await fetch(`/api/sessions/${id}/reaction`)).json() as {
        reaction: { type: string; id: number } | null
      }
      // Only fire the animation for a reaction we haven't shown yet. On first
      // load, adopt whatever's stored as already-seen so a stale reaction from
      // moments ago doesn't burst on the child the instant they open the page.
      if (reaction && reaction.id !== lastReactionIdRef.current) {
        if (lastReactionIdRef.current !== 0) setReactionBurst(reaction)
        lastReactionIdRef.current = reaction.id
      }
    } catch { /* ignore */ }
  }, [id])

  // Child taps a face — posts straight to the shared state; the specialist's
  // screen picks it up the same way (poll + realtime), so either side always
  // reflects the same answers.
  const answerReadiness = useCallback((field: 'sleep' | 'energy' | 'mood', value: number) => {
    setReadiness(r => r ? { ...r, [field]: value } : r)
    fetch(`/api/sessions/${id}/readiness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {})
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
    fetchLive(); fetchContent(); fetchWbActive(); fetchTimer(); fetchCard(); fetchNoise(); fetchReadiness(); fetchReaction()
  }, [fetchLive, fetchContent, fetchWbActive, fetchTimer, fetchCard, fetchNoise, fetchReadiness, fetchReaction])

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
      else if (ev === 'readiness') fetchReadiness()
      else if (ev === 'reaction') fetchReaction()
    })
    const iv = setInterval(pollAll, rt ? 6000 : 1000)
    // Reconnect re-sync: while the realtime socket is down, wake-up events are
    // lost — the child could miss the specialist starting an exercise, a card,
    // the timer, etc. The interval eventually catches up, but on reconnect we
    // re-sync ALL channels immediately so the child snaps back to the current
    // state instead of waiting up to 6s. Only fires on a true reconnect (after
    // a drop), never on the first connect (mount already polled).
    let seenConnected = false
    let droppedSince = false
    const unsubConn = subscribeConnectionState(st => {
      if (st === 'connected') {
        if (droppedSince) pollAll()
        seenConnected = true
        droppedSince = false
      } else if (seenConnected) {
        droppedSince = true
      }
    })
    return () => { unsub(); unsubConn(); clearInterval(iv) }
  }, [id, pollAll, fetchLive, fetchContent, fetchWbActive, fetchTimer, fetchCard, fetchNoise, fetchReadiness, fetchReaction])

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

  // Live per-answer progress — the child's exercise calls onProgress(...) at
  // each answer; we forward it to the specialist so they watch the child play
  // in real time (current item, correct/wrong counts, last-answer ✓/✗) rather
  // than only seeing the end score. Throttled: an exercise that fires rapidly
  // (e.g. fast tap games) is coalesced to at most ~1 post / 350ms, and the
  // latest payload always wins so the final state is never dropped.
  const latestProgressRef = useRef<{ exerciseId: string; p: ExerciseProgressUpdate } | null>(null)
  const lastProgressSentRef = useRef(0)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushProgress = useCallback(() => {
    const payload = latestProgressRef.current
    if (!payload) return
    lastProgressSentRef.current = Date.now()
    fetch(`/api/sessions/${id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: payload.exerciseId, ...payload.p }),
    }).catch(() => {})
  }, [id])
  const postProgress = useCallback((exerciseId: string, p: ExerciseProgressUpdate) => {
    latestProgressRef.current = { exerciseId, p }
    const since = Date.now() - lastProgressSentRef.current
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
    if (since >= 350) flushProgress()
    else progressTimerRef.current = setTimeout(flushProgress, 350 - since)
  }, [flushProgress])
  useEffect(() => () => { if (progressTimerRef.current) clearTimeout(progressTimerRef.current) }, [])

  // Unified per-answer feedback for the CHILD — a gentle sound plus a brief
  // screen-edge glow, fired from the same onProgress the exercises already
  // emit. This gives every one of the 60 exercises consistent, clear
  // right/wrong feedback without changing any of them.
  const feedbackAnswer = useCallback((correct: boolean) => {
    if (correct) playCorrect(); else playWrong()
    setAnswerGlow({ correct, id: Date.now() })
  }, [])

  // Exercise calls this with a full result object on completion; the same
  // handler is reused for onCancel, which calls it with no arguments.
  const handleDone = useCallback((result?: ExerciseResult) => {
    // While the specialist has locked the session, ignore the child's own
    // "exit" tap (a cancel = no result) so they stay on the exercise. A real
    // completion (result present) still goes through.
    if (!result && live?.locked) return
    setDone(true)
    if (live?.exerciseId) {
      reportStatus(live.exerciseId, 'done', result)
      // Clear the live progress bar the moment the exercise ends, so the
      // specialist's panel doesn't linger on a full bar between exercises.
      fetch(`/api/sessions/${id}/progress`, { method: 'DELETE' }).catch(() => {})
      // Award stars for a real completion (not a cancel) and persist, so the
      // progress map the child sees between exercises grows each time.
      if (result && typeof result.score === 'number') {
        const stars = result.score >= 80 ? 3 : result.score >= 50 ? 2 : 1
        const exId = live.exerciseId
        setKidStars(prev => {
          const next = [...prev, { id: exId, stars }]
          try { localStorage.setItem(`kid-stars:${id}`, JSON.stringify(next)) } catch { /* ignore */ }
          return next
        })
      }
    }
  }, [live?.exerciseId, live?.locked, reportStatus, id])

  // Report active on every NEW activation — depends on `nonce` (which bumps
  // on every start AND restart), not just exerciseId, so a restart of the
  // same exercise re-reports "active" and the specialist's status flips back
  // from "أنهى" to "يتفاعل الآن" instead of staying stuck on the old result.
  useEffect(() => {
    if (live?.exerciseId) reportStatus(live.exerciseId, 'active')
  }, [nonce, live?.exerciseId, reportStatus])

  const difficulty = (live?.difficulty ?? 1) as 1|2|3

  // ── Teacher video — embedded in-page (Daily.co SDK, no iframe, no links).
  // Mounted ONCE for the whole session so the call never drops between
  // screens; hiding only collapses the box (audio keeps playing).
  const [videoSmall, setVideoSmall] = useState(false)
  // Draggable position for the teacher video. null = default (top-right). Once
  // the child drags it, we pin left/top so they can move it out of the way of
  // whatever the exercise shows — the specialist can drag their PiP, so the
  // child gets the same freedom. The Daily iframe swallows pointer events, so
  // dragging is done via a dedicated grab handle at the top of the box.
  const [videoPos, setVideoPos] = useState<{ x: number; y: number } | null>(null)
  const videoBoxRef = useRef<HTMLDivElement>(null)
  const videoDragRef = useRef<{ dx: number; dy: number } | null>(null)
  const teacherVideo = meetingUrl && (
    <>
      <div ref={videoBoxRef} style={{
        // Default top-right; Chrome/Android dock their own "camera in use"
        // bubble at the bottom-left corner, so we start away from it. Once
        // dragged, `videoPos` pins left/top and releases right.
        position: 'fixed', zIndex: 9999,
        ...(videoPos ? { left: videoPos.x, top: videoPos.y, right: 'auto' } : { top: 12, right: 12 }),
        // Bigger by default so the teacher is clearly visible — a child's
        // main need is to see the specialist. ▼ shrinks it out of the way
        // when an exercise needs the space.
        width:  videoSmall ? 130 : 'min(340px, 62vw)',
        height: videoSmall ? 98  : 'min(255px, 46vw)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        border: '2px solid rgba(255,255,255,0.35)',
        background: '#111827',
        display: videoHidden ? 'none' : 'block',
      }}>
        {/* Drag handle — the only grabbable strip (the video iframe below
            captures its own pointer events, so the box can't be dragged by it). */}
        <div
          onPointerDown={e => {
            const el = videoBoxRef.current; if (!el) return
            e.currentTarget.setPointerCapture(e.pointerId)
            const rect = el.getBoundingClientRect()
            videoDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
          }}
          onPointerMove={e => {
            if (!videoDragRef.current || !videoBoxRef.current) return
            const el = videoBoxRef.current
            const x = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - videoDragRef.current.dx))
            const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - videoDragRef.current.dy))
            setVideoPos({ x, y })
          }}
          onPointerUp={() => { videoDragRef.current = null }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 22, zIndex: 9,
            cursor: 'grab', touchAction: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 2, lineHeight: 1 }}>⋯</span>
        </div>
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
            position: 'fixed', top: 12, right: 12, zIndex: 9999,
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

  if (readiness?.active && !live && !done) {
    // Pre-session readiness — child answers the 3 questions themselves,
    // synced live to the specialist. Replaces the plain waiting screen only
    // during this phase; the moment the specialist starts/skips, `active`
    // flips false and this falls through to the normal waiting/exercise flow.
    mainContent = <KidReadinessScreen readiness={readiness} onAnswer={answerReadiness} />
  } else if (!live || done) {
    // Between exercises (and before the first) — show the child their progress
    // map: the journey they've completed today with stars, plus a pulsing
    // "next" node. Grows every time so it keeps motivating them.
    mainContent = <KidProgressMap stars={kidStars} done={done} />
  } else {
    // ── Exercise renderer ────────────────────────────────────────────────
    const id_ = live.exerciseId
    // `seed` (minted by the specialist, carried over the `live` channel) is
    // only declared on exercises that actually consume it (see
    // lib/seeded-random.ts) — harmless extra prop for the rest.
    const props = {
      onComplete: handleDone, onCancel: handleDone, difficulty, studentAge: 10, seed: live.seed,
      // Live per-answer feedback to the specialist, AND unified child-side
      // feedback (sound + glow). Only exercises that call onProgress emit it.
      onProgress: (p: ExerciseProgressUpdate) => {
        postProgress(live.exerciseId, p)
        if (typeof p.lastCorrect === 'boolean') feedbackAnswer(p.lastCorrect)
      },
    }

    mainContent = (
    // Dark stage — MUST match the specialist's exercise stage (bg-gray-950).
    // Many exercises are dark-themed (white text on translucent-white tiles)
    // and paint no background of their own; on a white container they rendered
    // white-on-white and were invisible to the child (the "spelling doesn't
    // show" bug). Light-themed exercises paint their own full-bleed background,
    // so they're unaffected — this makes both screens render identically.
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#030712', position: 'relative' }}>
      <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'5px solid #A78BFA', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <ExerciseErrorBoundary audience="kid" resetKey={`${id_}-${nonce}`}>
        <div key={`${id_}-${live.seed ?? ''}-${nonce}`} style={{ width:'100%', height:'100%' }}>
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
          {id_ === 'story-reader'         && <StoryReader          {...props} sessionId={id} mirror />}
          {PHYSICAL_IDS.includes(id_)     && <PhysicalExercise id={id_} {...props} />}
        </div>
        </ExerciseErrorBoundary>
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
      {/* Specialist's encouragement burst — celebratory overlay above all */}
      {reactionBurst && (
        <KidReactionBurst key={reactionBurst.id} reaction={reactionBurst} onDone={() => setReactionBurst(null)} />
      )}
      {/* Unified per-answer glow — green/soft-red edge flash on each answer */}
      {answerGlow && (
        <KidAnswerGlow key={answerGlow.id} correct={answerGlow.correct} onDone={() => setAnswerGlow(null)} />
      )}
    </>
  )
}
