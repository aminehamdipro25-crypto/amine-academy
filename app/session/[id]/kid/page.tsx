'use client'
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams } from 'next/navigation'

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

export default function KidSessionPage() {
  const { id } = useParams<{ id: string }>()
  const [live, setLive] = useState<LiveState>(null)
  const [done, setDone] = useState(false)
  const [nonce, setNonce] = useState(0)
  const prevId = useRef<string | null>(null)

  // Poll every 3 seconds for current exercise
  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/sessions/${id}/live`)
      const { live: data } = await r.json() as { live: LiveState }
      if (data?.exerciseId !== prevId.current) {
        prevId.current = data?.exerciseId ?? null
        setDone(false)
        setNonce(n => n + 1)
        setLive(data)
      }
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => {
    poll()
    const iv = setInterval(poll, 3000)
    return () => clearInterval(iv)
  }, [poll])

  const handleDone = useCallback(() => setDone(true), [])

  const difficulty = (live?.difficulty ?? 1) as 1|2|3

  // ── Waiting screen ──────────────────────────────────────────────────────
  if (!live || done) {
    return (
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
  }

  // ── Exercise renderer ──────────────────────────────────────────────────
  const id_ = live.exerciseId
  const props = { onComplete: handleDone, onCancel: handleDone, difficulty, studentAge: 10 }

  return (
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#fff' }}>
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
