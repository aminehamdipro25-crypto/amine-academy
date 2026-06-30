'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import { Clock, X, Save, Video, Star, ClipboardList, PenLine, ChevronDown, User, Gamepad2, BarChart3, BookOpen, Play, Youtube, ExternalLink } from 'lucide-react'
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
import Whiteboard      from '@/components/session/Whiteboard'
import ADHDScale       from '@/components/session/assessments/ADHDScale'
import LearningDifficultiesScale from '@/components/session/assessments/LearningDifficultiesScale'
import AttentionDomainsScale from '@/components/session/assessments/AttentionDomainsScale'

// localStorage key for the specialist's remembered "prefer the bigger/compact
// screen" choice on the idle session screen — see idleChromePreferHidden below.
const CHROME_PREF_KEY = 'amine-academy:prefer-compact-chrome'

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

interface ABCEntry {
  antecedent: string
  behavior: string
  consequence: string
  intensity: 1|2|3
  ts: string
  elapsed: number
}

const PROMPT_CARDS = [
  { id: 'stop',    text: 'توقف وفكّر',     emoji: '🛑', bg: 'linear-gradient(135deg,#DC2626,#EF4444)', glow: '#EF4444' },
  { id: 'breathe', text: 'تنفس معي',       emoji: '🌬️', bg: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', glow: '#3B82F6' },
  { id: 'great',   text: 'أنت رائع!',      emoji: '⭐', bg: 'linear-gradient(135deg,#D97706,#F59E0B)', glow: '#F59E0B' },
  { id: 'listen',  text: 'استمع جيداً',    emoji: '👂', bg: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', glow: '#8B5CF6' },
  { id: 'calm',    text: 'هدّئ نفسك',      emoji: '😌', bg: 'linear-gradient(135deg,#059669,#10B981)', glow: '#10B981' },
  { id: 'try',     text: 'حاول مرة أخرى', emoji: '💪', bg: 'linear-gradient(135deg,#EA580C,#F97316)', glow: '#F97316' },
]

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
  { id: 'warmup',  label: 'تحية ودفء',   icon: '👋', defaultMin: 5,  color: '#3B82F6' },
  { id: 'main',    label: 'نشاط رئيسي',  icon: '🎯', defaultMin: 25, color: '#7C5CFC' },
  { id: 'assess',  label: 'تقييم',        icon: '📊', defaultMin: 10, color: '#F59E0B' },
  { id: 'wrap',    label: 'تلخيص',        icon: '✅', defaultMin: 5,  color: '#22C55E' },
]

const EXERCISES = [
  { id:'memory-cards',      labelAr:'مطابقة البطاقات',         icon:'🃏', category:'ذاكرة',          color:'bg-purple-50 border-purple-200',  ageMin:5,  ageMax:22 },
  { id:'sequence-memory',   labelAr:'تذكر التسلسل',            icon:'🔢', category:'ذاكرة',          color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:17 },
  { id:'n-back',            labelAr:'ذاكرة N-Back',             icon:'🧩', category:'ذاكرة',          color:'bg-indigo-50 border-indigo-200',   ageMin:8,  ageMax:22 },
  { id:'word-recall',       labelAr:'تذكر الكلمات',             icon:'📝', category:'ذاكرة',          color:'bg-violet-50 border-violet-200',   ageMin:6,  ageMax:17 },
  { id:'breathing',         labelAr:'تمارين التنفس',            icon:'🌬️', category:'تنظيم',          color:'bg-cyan-50 border-cyan-200',        ageMin:5,  ageMax:22 },
  { id:'tap-target',        labelAr:'التناسق الحركي',           icon:'🎯', category:'حركي',           color:'bg-orange-50 border-orange-200',   ageMin:5,  ageMax:22 },
  { id:'simon-says',        labelAr:'سايمون يقول',              icon:'🎨', category:'إدراكي',         color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:17 },
  { id:'letter-match',      labelAr:'مطابقة الحروف',            icon:'🔤', category:'تعلّم',           color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:11 },
  { id:'reaction-game',     labelAr:'سرعة رد الفعل',            icon:'⚡', category:'حركي',           color:'bg-yellow-50 border-yellow-200',   ageMin:5,  ageMax:22 },
  { id:'stroop-test',       labelAr:'ستروب — كبح الاستجابة',   icon:'🔵', category:'انتباه',          color:'bg-rose-50 border-rose-200',       ageMin:10, ageMax:22 },
  { id:'stop-signal',       labelAr:'توقف أو اكمل',             icon:'🛑', category:'اندفاعية',       color:'bg-red-50 border-red-200',         ageMin:8,  ageMax:22 },
  { id:'emotion-cards',     labelAr:'التعرف على المشاعر',       icon:'🎭', category:'اجتماعي',        color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:17 },
  { id:'token-board',       labelAr:'لوح التعزيز',              icon:'🏅', category:'تعديل السلوك',   color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:22 },
  { id:'self-rating',       labelAr:'تقييم الذات',              icon:'🪞', category:'تعديل السلوك',   color:'bg-teal-50 border-teal-200',       ageMin:7,  ageMax:22 },
  { id:'verbal-fluency',    labelAr:'الطلاقة اللفظية',          icon:'🗣️', category:'معرفي',          color:'bg-sky-50 border-sky-200',         ageMin:5,  ageMax:22 },
  { id:'social-scenarios',  labelAr:'المواقف الاجتماعية',       icon:'🤝', category:'اجتماعي',        color:'bg-fuchsia-50 border-fuchsia-200', ageMin:5,  ageMax:22 },
  { id:'behavior-contract', labelAr:'عقد الجلسة',               icon:'📋', category:'تعديل السلوك',   color:'bg-lime-50 border-lime-200',       ageMin:7,  ageMax:22 },
  { id:'color-grid',             labelAr:'لوحة الألوان',            icon:'🎨', category:'إدراكي',       color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:14 },
  { id:'pattern-match',          labelAr:'مطابقة الأنماط',          icon:'🔍', category:'إدراكي',       color:'bg-violet-50 border-violet-200',   ageMin:5,  ageMax:16 },
  { id:'word-builder',           labelAr:'بناء الكلمة',             icon:'🔤', category:'تعلّم',         color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:14 },
  { id:'auditory-memory',        labelAr:'الذاكرة السمعية',         icon:'🎧', category:'سمعي',          color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },
  { id:'listening-comprehension',labelAr:'فهم الاستماع',            icon:'🔊', category:'سمعي',          color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:18 },
  { id:'picture-word-cards',     labelAr:'بطاقات الصورة والكلمة',  icon:'🖼️', category:'تعلّم',         color:'bg-teal-50 border-teal-200',       ageMin:4,  ageMax:14 },
  { id:'number-sequence',        labelAr:'تسلسل الأرقام',           icon:'🔢', category:'معرفي',          color:'bg-blue-50 border-blue-200',       ageMin:4,  ageMax:22 },
  { id:'shadow-match',           labelAr:'مطابقة الظلال',           icon:'🌑', category:'إدراكي',         color:'bg-gray-100 border-gray-300',       ageMin:4,  ageMax:12 },
  { id:'story-sequencing',       labelAr:'ترتيب القصة',             icon:'📖', category:'تفكير',          color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:14 },
  { id:'waiting-game',           labelAr:'لعبة الانتظار',           icon:'⏳', category:'اندفاعية',      color:'bg-red-50 border-red-200',         ageMin:5,  ageMax:14 },
  { id:'social-problem-solving', labelAr:'كيف أتعامل؟',            icon:'😤', category:'اجتماعي',        color:'bg-pink-50 border-pink-200',       ageMin:6,  ageMax:18 },
  // ── انتباه ───────────────────────────────────────
  { id:'visual-search',         labelAr:'البحث البصري',            icon:'🔎', category:'انتباه',           color:'bg-cyan-50 border-cyan-200',       ageMin:5,  ageMax:22 },
  { id:'odd-one-out',           labelAr:'الغريب في المجموعة',      icon:'🤔', category:'انتباه',           color:'bg-indigo-50 border-indigo-200',   ageMin:5,  ageMax:17 },
  { id:'sustained-attention',   labelAr:'الانتباه المستمر',        icon:'👁️', category:'انتباه',           color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:22 },
  { id:'flash-count',           labelAr:'عدّ السريع',              icon:'⚡', category:'انتباه',           color:'bg-yellow-50 border-yellow-200',   ageMin:5,  ageMax:22 },
  { id:'number-search',         labelAr:'البحث عن الأرقام',        icon:'🔍', category:'انتباه',           color:'bg-teal-50 border-teal-200',       ageMin:6,  ageMax:22 },
  // ── اندفاعية ─────────────────────────────────────
  { id:'go-no-go',              labelAr:'اضغط / لا تضغط',         icon:'🚦', category:'اندفاعية',         color:'bg-orange-50 border-orange-200',   ageMin:6,  ageMax:22 },
  { id:'balloon-control',       labelAr:'البالون الهادئ',          icon:'🎈', category:'اندفاعية',         color:'bg-red-50 border-red-200',         ageMin:5,  ageMax:14 },
  { id:'traffic-light',         labelAr:'إشارة المرور',            icon:'🚦', category:'اندفاعية',         color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22 },
  // ── اجتماعي ──────────────────────────────────────
  { id:'emotion-mirror',        labelAr:'مرآة المشاعر',            icon:'🪞', category:'اجتماعي',          color:'bg-fuchsia-50 border-fuchsia-200', ageMin:5,  ageMax:18 },
  { id:'conversation-starter',  labelAr:'كيف أبدأ الحديث؟',       icon:'💬', category:'اجتماعي',          color:'bg-teal-50 border-teal-200',       ageMin:6,  ageMax:22 },
  // ── سمعي ─────────────────────────────────────────
  { id:'sound-discrimination',  labelAr:'تمييز الأصوات',           icon:'👂', category:'سمعي',             color:'bg-violet-50 border-violet-200',   ageMin:5,  ageMax:22 },
  { id:'rhyme-detection',       labelAr:'اكتشاف القافية',          icon:'🎵', category:'سمعي',             color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:14 },
  { id:'audio-sequence',        labelAr:'تسلسل الأصوات',           icon:'🔁', category:'سمعي',             color:'bg-indigo-50 border-indigo-200',   ageMin:5,  ageMax:17 },
  // ── حركي ─────────────────────────────────────────
  { id:'sequence-tap',          labelAr:'النقر بالتسلسل',          icon:'🟣', category:'حركي',             color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },
  { id:'target-tracking',       labelAr:'تتبع الهدف',              icon:'🎯', category:'حركي',             color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:17 },
  { id:'finger-gym',            labelAr:'جمباز الأصابع',           icon:'🥁', category:'حركي',             color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:22 },
  // ── معرفي ────────────────────────────────────────
  { id:'category-sort',         labelAr:'تصنيف الأشياء',           icon:'🗂️', category:'معرفي',            color:'bg-sky-50 border-sky-200',         ageMin:4,  ageMax:14 },
  { id:'math-flash',            labelAr:'الحساب السريع',           icon:'🔢', category:'معرفي',            color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:22 },
  { id:'analogies',             labelAr:'العلاقات والقياسات',      icon:'🧩', category:'معرفي',            color:'bg-teal-50 border-teal-200',       ageMin:7,  ageMax:22 },
  // ── تنظيم ────────────────────────────────────────
  { id:'body-scan',             labelAr:'فحص الجسم',               icon:'🫁', category:'تنظيم',            color:'bg-cyan-50 border-cyan-200',       ageMin:6,  ageMax:22 },
  { id:'mood-meter',            labelAr:'مقياس المزاج',            icon:'🌡️', category:'تنظيم',            color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:22 },
  { id:'calm-corner',           labelAr:'ركن الهدوء',              icon:'🧘', category:'تنظيم',            color:'bg-teal-50 border-teal-200',       ageMin:5,  ageMax:22 },
  { id:'emotion-volume',        labelAr:'حجم الانفعال',            icon:'📊', category:'تنظيم',            color:'bg-orange-50 border-orange-200',   ageMin:6,  ageMax:22 },
  // ── تعديل السلوك ──────────────────────────────────
  { id:'daily-goals',           labelAr:'أهدافي اليوم',            icon:'🎯', category:'تعديل السلوك',    color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22 },
  { id:'choice-board',          labelAr:'لوح الاختيارات',          icon:'🗳️', category:'تعديل السلوك',    color:'bg-violet-50 border-violet-200',   ageMin:4,  ageMax:14 },
  // ── تفكير ────────────────────────────────────────
  { id:'pattern-puzzle',        labelAr:'أكمل النمط',              icon:'🔮', category:'تفكير',            color:'bg-indigo-50 border-indigo-200',   ageMin:4,  ageMax:14 },
  { id:'if-then',               labelAr:'ماذا سيحدث؟',            icon:'🔗', category:'تفكير',            color:'bg-sky-50 border-sky-200',         ageMin:5,  ageMax:17 },
  { id:'problem-solver',        labelAr:'حل المشكلة',              icon:'💡', category:'تفكير',            color:'bg-yellow-50 border-yellow-200',   ageMin:6,  ageMax:22 },
  // ── تعلّم ─────────────────────────────────────────
  { id:'spelling-bee',          labelAr:'الإملاء',                 icon:'🐝', category:'تعلّم',            color:'bg-rose-50 border-rose-200',       ageMin:5,  ageMax:14 },
  { id:'reading-cards',         labelAr:'بطاقات القراءة',          icon:'📖', category:'تعلّم',            color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:14 },
  { id:'span-extension',        labelAr:'امتداد الذاكرة',           icon:'🔢', category:'ذاكرة',            color:'bg-indigo-50 border-indigo-200',   ageMin:6,  ageMax:22 },
  { id:'direction-follow',      labelAr:'اتباع الاتجاهات',         icon:'🧭', category:'إدراكي',           color:'bg-cyan-50 border-cyan-200',       ageMin:5,  ageMax:17 },
  { id:'logic-sort',            labelAr:'الترتيب المنطقي',         icon:'📊', category:'تفكير',            color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:17 },
  // ── رياضي ──────────────────────────────────────────
  { id:'jumping-jacks',    labelAr:'قفز النجمة',           icon:'⭐', category:'رياضي', color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22 },
  { id:'obstacle-circuit', labelAr:'دائرة الحواجز',         icon:'🏅', category:'رياضي', color:'bg-orange-50 border-orange-200',   ageMin:5,  ageMax:17 },
  { id:'balance-walk',     labelAr:'خط التوازن',            icon:'⚖️', category:'رياضي', color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:22 },
  { id:'tiger-crawl',      labelAr:'الزحف المتقاطع',        icon:'🐆', category:'رياضي', color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:17 },
  { id:'ball-throw',       labelAr:'رمي الكرة والتقاطها',  icon:'⚽', category:'رياضي', color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:22 },
  { id:'stretching',       labelAr:'تمارين التمدد',         icon:'🧘', category:'رياضي', color:'bg-teal-50 border-teal-200',       ageMin:5,  ageMax:22 },
  { id:'body-percussion',  labelAr:'الإيقاع الجسدي',        icon:'🥁', category:'رياضي', color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },
]

// Exercises whose component renders its own post-completion results screen
// (score, feedback, "play again"/"finish") and should stay mounted until the
// user dismisses it, instead of being closed the instant onComplete fires.
const SELF_CLOSING_RESULTS = new Set(['picture-word-cards'])

// ── مكتبة الفيديو ──────────────────────────────────────────────────────────
const VIDEO_LIBRARY: Record<string, { desc: string; tips: string[]; videoId?: string }> = {
  'breathing':           { videoId: 'IB1JNAcc2mc', desc: 'يُهدّئ الجهاز العصبي ويقلل الاندفاعية والقلق ويُحسّن التركيز.', tips: ['استنشق 4 عدّات من الأنف', 'حبس 4 عدّات', 'زفير بطيء 6 عدّات', 'كرر 3-5 مرات'] },
  'calm-corner':         { videoId: 'u5t32hucFRQ', desc: 'مساحة آمنة يلجأ إليها الطفل عند الإرهاق لتنظيم نفسه ذاتياً.', tips: ['بيئة هادئة وخافتة الإضاءة', 'أدوات حسية: كرة ضغط، سماعات', 'لا يُستخدم كعقاب', 'علّم الطفل متى يذهب إليه'] },
  'jumping-jacks':       { videoId: 'iFT-ObTJVEI', desc: 'ينشّط الجسم ويفرغ الطاقة الزائدة ويُحسّن التنسيق الثنائي.', tips: ['3 مجموعات × 10 قفزات', 'استخدمه قبل جلسات التركيز', 'تأكد من تزامن الذراعين والساقين', 'زد الوتيرة تدريجياً'] },
  'stretching':          { videoId: 'QeVh3NVfa0k', desc: 'يُهدّئ الجسم وينمّي الوعي الجسدي ويُسهّل الانتقال للاسترخاء.', tips: ['كل حركة 10-15 ثانية', 'تنفس بعمق أثناء التمدد', 'ابدأ بالرقبة ثم الكتفين ثم الظهر', 'حركات بطيئة هادئة'] },
  'balance-walk':        { videoId: '7tcQh-xQDUI', desc: 'يُنشّط المخيخ المسؤول عن الانتباه ويُحسّن التنسيق بين الجانبين.', tips: ['ضع شريطاً لاصقاً على الأرض', 'امشِ ببطء مركّزاً على التوازن', 'جرّب بأعين مغمضة لاحقاً', 'احمل غرضاً على رأسك لزيادة الصعوبة'] },
  'tiger-crawl':         { videoId: '_HJRY9j_Y9Y', desc: 'يُنشّط التكامل بين نصفي المخ وهو أساسي للقراءة والانتباه.', tips: ['اليد اليمنى مع الركبة اليسرى في آنٍ', 'الزحف ببطء مع الوعي الكامل', '5-7 دقائق قبل التمارين المعرفية', 'مناسب لجميع الأعمار'] },
  'body-percussion':     { videoId: 'VUlQBDSG9Ps', desc: 'يُحسّن التنسيق الدقيق والإيقاع الزمني والانتباه المستمر.', tips: ['ابدأ بنمط بسيط: تصفيق + ضرب الركبة', 'كرر 3 مرات قبل أن يؤديه وحده', 'زد التعقيد تدريجياً', 'استخدم موسيقى هادئة'] },
  'body-scan':           { videoId: 'Y96Qq7UE_qc', desc: 'يُطوّر الوعي الجسدي ويُساعد على رصد التوتر قبل الانفجار الانفعالي.', tips: ['الطفل مستلقٍ أو جالس بهدوء', 'انتقل من القدمين للرأس', 'اطلب منه توصيف ما يشعر به', '10 دقائق كافية للتأثير'] },
  'emotion-cards':       { videoId: '1-8ntwLiNcw', desc: 'يُطوّر الذكاء الانفعالي والقدرة على قراءة تعابير الوجه.', tips: ['استخدم صوراً حقيقية لأشخاص', 'اربط المشاعر بمواقف يومية', 'اطلب منه تمثيل المشعر بجسده', 'ابدأ بالمشاعر الأساسية الستة'] },
  'emotion-mirror':      { videoId: 'ZWTq-HazzsU', desc: 'يُطوّر التواصل الاجتماعي من خلال تقليد تعابير الوجه.', tips: ['قفا أمام مرآة معاً', 'ابدأ بمشاعر واضحة: فرح، حزن', 'تناوبا الأدوار', 'اربط كل تعبير بحدث يومي'] },
  'social-scenarios':    { videoId: 'tAVKSckForg', desc: 'يُطوّر التعامل مع المواقف الاجتماعية وحل النزاعات بشكل بناء.', tips: ['استخدم مواقف من حياة الطفل الفعلية', 'اسأل: ماذا تفعل؟ وماذا سيحدث؟', 'ناقش أكثر من حل ممكن', 'العب أدواراً تمثيلية'] },
  'social-problem-solving': { videoId: 'ejjM1Apj56c', desc: 'يُطوّر التفكير التسلسلي والقدرة على إيجاد الحلول البديلة.', tips: ['SODAS: موقف، خيارات، مشكلات، نتائج، مفاضلة', 'استخدم قصصاً مصورة', 'فكّر بصوت عالٍ نموذجاً له', 'اربطه بمواقف حديثة'] },
  'token-board':         { videoId: 'FzEI_fJYmFI', desc: 'يُحفّز الطفل ويعزز السلوك الإيجابي من خلال مكافآت فورية.', tips: ['5-10 رموز لكل مكافأة', 'حدد السلوك المطلوب بوضوح', 'المكافأة فورية وليست مؤجلة', 'تناقص تدريجي مع التحسن'] },
  'behavior-contract':   { videoId: 'WQlWjWUv06U', desc: 'يُوضّح التوقعات والمكافآت ويعزز التزام الطفل بأهدافه.', tips: ['اكتب الاتفاق معه لا له', 'هدف واحد فقط في البداية', 'مكافأة محددة وقابلة للتحقيق', 'راجعه أسبوعياً'] },
  'traffic-light':       { videoId: '9VmWNdmtfxk', desc: 'يُعلّم التوقف والتفكير قبل التصرف — أداة فعّالة لكبح الاندفاعية.', tips: ['أحمر: توقف وتنفس', 'أصفر: فكر في خياراتك', 'أخضر: تصرف', 'طبّق على مواقف يومية حقيقية'] },
  'stop-signal':         { videoId: 'B6DASGn4HWI', desc: 'يُطوّر القدرة على كبح الاستجابة الاندفاعية وهو الأكثر فاعلية مع ADHD.', tips: ['ابدأ بزمن استجابة طويل ثم قلّصه', 'راقب دقة التوقف لا السرعة فقط', '10-15 دقيقة للجلسة', 'سجّل التحسن عبر الجلسات'] },
  'mood-meter':          { videoId: 'h8fCgLD0ziU', desc: 'يُطوّر الوعي الانفعالي ويُساعد الطفل على تسمية مشاعره وشدتها.', tips: ['محور أفقي: الطاقة (عالية/منخفضة)', 'محور رأسي: الشعور (إيجابي/سلبي)', 'ابدأ الجلسة بتحديد المزاج', 'استخدم الألوان للمساعدة'] },
  'verbal-fluency':      { videoId: 'BBlaaSKP4HM', desc: 'يُطوّر الذاكرة الدلالية والبحث السريع في مخازن الذاكرة.', tips: ['فئات مألوفة: حيوانات، أكل، ألوان', 'دقيقة واحدة لكل فئة', 'سجّل العدد وقارنه بين الجلسات', 'زد الصعوبة بفئات أكثر تخصصاً'] },
  'finger-gym':          { videoId: 'F8bEmfEP-FQ', desc: 'يُطوّر الحركة الدقيقة ويُقوّي عضلات الأصابع للكتابة.', tips: ['فرد الأصابع واحداً تلو الآخر', 'ضرب كل أصبع بالإبهام', 'عجن الطين أو كرات الضغط', '5 دقائق قبل جلسات الكتابة'] },
  'memory-cards':        { videoId: 'J0v-bX1u2Kc', desc: 'يُطوّر الذاكرة البصرية قصيرة المدى والانتباه الانتقائي.', tips: ['ابدأ بـ 6 بطاقات (3 أزواج)', 'زد تدريجياً حتى 20 بطاقة', 'شجعه على تسمية الصور بصوت عالٍ', 'راقب زمن الإنجاز'] },
  'sequence-memory':     { videoId: 'gv7EnAeagkA', desc: 'يُطوّر الذاكرة العاملة وترتيب المعلومات في الزمن.', tips: ['ابدأ بتسلسل من 3 عناصر', 'استخدم أرقاماً ثم ألواناً ثم صوراً', 'سرعة التقديم: 1 ثانية/عنصر', 'أضف عنصراً كل 2-3 جلسات'] },
  'conversation-starter':{ videoId: 'CBEyNj-IkUM', desc: 'يُعلّم الطفل كيف يبدأ محادثة ويُبقيها مستمرة.', tips: ['ابدأ بسؤال عن الطرف الآخر', 'تناوبا البدء والاستمرار', 'استخدم موضوعات مشتركة', 'راقب لغة الجسد'] },
  'choice-board':        { videoId: 'ptOcxeje2r4', desc: 'يمنح الطفل شعوراً بالسيطرة مما يُقلّل مقاومة التعليمات.', tips: ['2-3 خيارات كافية', 'تأكد أن كل الخيارات مقبولة', 'الطفل يختار ويلتزم باختياره', 'استخدم صوراً للأطفال الصغار'] },
  'daily-goals':         { videoId: 'p6FeVyw0ZNU', desc: 'يُطوّر التخطيط والتنظيم الذاتي ويُحسّن الشعور بالكفاءة.', tips: ['هدفان كحد أقصى', 'الأهداف قابلة للقياس والتحقيق', 'راجع الأهداف نهاية الجلسة', 'احتفل بالإنجاز مهما كان صغيراً'] },
  'ball-throw':          { videoId: 'odveiZjwnIg', desc: 'يُحسّن التنسيق البصري الحركي والتتبع البصري وسرعة رد الفعل.', tips: ['ابدأ بمسافة قريبة', 'تناوبا الرمي والإمساك', 'عدّ الرميات الناجحة', 'أضف مسافة تدريجياً'] },
  'emotion-volume':      { videoId: 'pNxlVLwh2vc', desc: 'يُطوّر القدرة على تقدير شدة الانفعالات والتحكم في ردود الفعل.', tips: ['مقياس 1-10 أو صور صوتية', 'اربط الرقم بموقف حقيقي', 'ناقش متى يكون رقم 8 مناسباً', 'علّمه استراتيجيات خفض الرقم'] },
}


function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

const ASSESSMENTS = [
  { id:'adhd',               labelAr:'مقياس ADHD',              icon:'⚡', color:'bg-blue-50 border-blue-200'    },
  { id:'attention-domains',  labelAr:'أنماط الانتباه — SNAP-IV', icon:'🧠', color:'bg-purple-50 border-purple-200' },
  { id:'learning-difficulties', labelAr:'صعوبات التعلم',        icon:'📚', color:'bg-amber-50 border-amber-200'  },
]

const SESSION_TYPE_CFG: Record<string, { label: string; color: string; isAssessment?: boolean }> = {
  assessment:   { label: 'جلسة تقييمية',       color: 'bg-amber-50 text-amber-700 border-amber-200',  isAssessment: true },
  followup:     { label: 'جلسة متابعة',         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  emergency:    { label: 'استشارة طارئة',       color: 'bg-red-50 text-red-700 border-red-200' },
  consultation: { label: 'استشارة الوالدين',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  training:     { label: 'جلسة تدريبية مكثفة', color: 'bg-green-50 text-green-700 border-green-200' },
  review:       { label: 'مراجعة البرنامج',     color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
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

// Renders dropdown panels via a portal so the toolbar's overflow-x-auto
// (which forces overflow-y to clip too, per the CSS overflow spec) never hides them.
function ToolbarPopover({ anchorRef, open, onClose, children }: { anchorRef: React.RefObject<HTMLElement | null>; open: boolean; onClose?: () => void; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !anchorRef.current) { setPos(null); return }
    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef])

  // Click/tap outside the popover (and its toggle button) or pressing Escape
  // dismisses it — without this, the only way to close a popover was to
  // re-click its own toggle or pick an item, even though it can visually sit
  // on top of other clickable UI (e.g. the exercises sidebar).
  useEffect(() => {
    if (!open || !onClose) return
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointer, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, anchorRef])

  if (!open || !pos || typeof document === 'undefined') return null
  return createPortal(
    <div ref={popoverRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}>
      {children}
    </div>,
    document.body
  )
}

type SoundType = 'success' | 'complete' | 'start' | 'phase' | 'tick' | 'ding' | 'compare' | 'abc'

function playSound(type: SoundType) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const g = ctx.createGain()
    g.connect(ctx.destination)

    if (type === 'success') {
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.frequency.setValueAtTime(523, ctx.currentTime)
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      o.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4)

    } else if (type === 'complete') {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.3)
      })

    } else if (type === 'start') {
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.value = 440
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2)

    } else if (type === 'phase') {
      // Gong-like tone for phase transition
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.setValueAtTime(660, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.6)
      g.gain.setValueAtTime(0.35, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8)

    } else if (type === 'tick') {
      // Countdown tick
      const o = ctx.createOscillator(); o.connect(g); o.type = 'square'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.05)

    } else if (type === 'ding') {
      // Timer done — rising bell
      const notes = [659, 784, 988, 1319]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25)
        o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + i * 0.08 + 0.3)
      })

    } else if (type === 'compare') {
      // Improvement fanfare — major chord
      const chord = [523, 659, 784]
      chord.forEach(freq => {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'triangle'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.7)
      })

    } else if (type === 'abc') {
      // Soft click — ABC entry saved
      const o = ctx.createOscillator(); o.connect(g); o.type = 'sine'
      o.frequency.value = 300
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1)
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
  const [saveFailed, setSaveFailed] = useState(false)
  const [assessmentSaveFailed, setAssessmentSaveFailed] = useState(false)
  const [studentAge, setStudentAge] = useState(8)
  const [studentName, setStudentName] = useState('')
  const [observations, setObservations] = useState<SessionObservations>({
    attention:3, cooperation:3, energy:3, mood:3, anxiety:3,
  })
  const [tab, setTab] = useState<'exercises'|'assessments'|'log'|'videos'>('exercises')
  const [videoModal, setVideoModal] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [categoryFilter, setCategoryFilter] = useState<string>('الكل')
  const [obsLog, setObsLog] = useState<ObsEntry[]>([])
  const [obsOpen, setObsOpen] = useState(false)
  const [obsToast, setObsToast] = useState<ObsEntry | null>(null)
  const obsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [profile, setProfile] = useState<StudentAssessmentProfile | null>(null)
  const [kidMode, setKidMode] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementToast, setAchievementToast] = useState<{ icon: string; message: string } | null>(null)
  const achievementToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Auto-save draft to sessionStorage (debounced 2s to avoid thrashing on elapsed counter)
  useEffect(() => {
    if (elapsed === 0 && results.length === 0 && notes === '' && obsLog.length === 0 && abcLog.length === 0) return
    const key = `session_draft_${id}`
    const draft = { elapsed, running, results, assessments, notes, difficulty, obsLog, abcLog, phaseIdx, phaseDurations, savedAt: Date.now() }
    const tid = setTimeout(() => {
      try { sessionStorage.setItem(key, JSON.stringify(draft)) } catch { /* storage full */ }
    }, 2000)
    return () => clearTimeout(tid)
  }, [elapsed, running, results, assessments, notes, difficulty, obsLog, abcLog, phaseIdx, phaseDurations, id])

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
    }
  }, [])

  function printSessionReport() {
    const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const avgScoreVal = results.length
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0

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
    }
    const exCat: Record<string, keyof typeof catMap> = {
      'memory-cards':'memory','sequence-memory':'memory','n-back':'memory','word-recall':'memory','auditory-memory':'auditory',
      'stroop-test':'attention','stop-signal':'attention','tap-target':'motor','reaction-game':'motor','n-back-2':'attention',
      'breathing':'behavior','token-board':'behavior','self-rating':'behavior','behavior-contract':'behavior',
      'emotion-cards':'social','social-scenarios':'social',
      'verbal-fluency':'language','word-builder':'language','letter-match':'language','picture-word-cards':'language',
      'listening-comprehension':'auditory','sound-discrimination':'auditory',
      'simon-says':'attention','color-grid':'attention','pattern-match':'attention',
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
            <div style="height:100%;width:${avg}%;background:${barColor};border-radius:4px;transition:width 0.5s"></div>
          </div>
          <div style="font-size:10px;color:#999;margin-top:2px">${v.scores.length} تمرين</div>
        </div>`
    }).join('')

    // ── Clinical recommendations ──
    const recs: string[] = []
    const memExs    = results.filter(r => ['memory-cards','sequence-memory','n-back','word-recall','auditory-memory'].includes(r.exerciseType))
    const attExs    = results.filter(r => ['stroop-test','stop-signal','simon-says','color-grid','pattern-match'].includes(r.exerciseType))
    const langExs   = results.filter(r => ['verbal-fluency','word-builder','letter-match','picture-word-cards','listening-comprehension'].includes(r.exerciseType))
    const socialExs = results.filter(r => ['emotion-cards','social-scenarios'].includes(r.exerciseType))
    const motorExs  = results.filter(r => ['tap-target','reaction-game'].includes(r.exerciseType))
    const avgOf = (arr: ExerciseResult[]) => arr.length ? Math.round(arr.reduce((s,r)=>s+r.score,0)/arr.length) : -1

    const memAvg = avgOf(memExs)
    if (memAvg >= 0) {
      if (memAvg >= 80) recs.push('الذاكرة العاملة: أداء ضمن المعدل الطبيعي أو أعلى. يُنصح بالانتقال إلى تمارين N-Back من المستوى 3 لتعزيز ظرفية التخزين phonological loop.')
      else if (memAvg >= 60) recs.push('الذاكرة العاملة: مستوى دون المتوسط. يُنصح بتكثيف تمارين التسلسل اللفظي والبصري بتردد 3 جلسات أسبوعياً، مع تقليل المشتتات البيئية.')
      else recs.push('الذاكرة العاملة: عجز ملحوظ (< 60%). يُقترح إجراء تقييم معمّق لوظائف الفص الجبهي، ومراجعة احتمالية وجود صعوبة تعلم مصاحبة لاضطراب ADHD.')
    }
    const attAvg = avgOf(attExs)
    if (attAvg >= 0) {
      if (attAvg >= 80) recs.push('الكبح المعرفي والانتباه: أداء مناسب. يُوصى بتحديات Stroop متزايدة الصعوبة والتدريب على Task-Switching.')
      else if (attAvg >= 60) recs.push('الكبح المعرفي: يحتاج تعزيزاً. يُوصى باستراتيجية التوقف والتفكير (Stop-Think-Act) واستخدام أجهزة ضبط الزمن المرئية خلال المهام.')
      else recs.push('الكبح المعرفي: اضطراب جوهري. يُقترح إعادة النظر في البروتوكول العلاجي وإشراك الأسرة في برامج parent-training لإدارة الاندفاعية.')
    }
    const langAvg = avgOf(langExs)
    if (langAvg >= 0) {
      if (langAvg >= 80) recs.push('اللغة والوعي الصوتي: مستوى مناسب. يُوصى بدمج القراءة الموجّهة والتدريب على الطلاقة اللفظية بوتيرة أسرع.')
      else if (langAvg >= 60) recs.push('اللغة: يستدعي تدخلاً. يُوصى باستخدام بطاقات الصورة والكلمة يومياً، وتقنية التكرار التباعدي (Spaced Repetition) لتحسين المفردات.')
      else recs.push('اللغة: تأخر ملحوظ. يُنصح بإحالة الحالة لتقييم نطق وتخاطب متخصص، وبدء برنامج AAC إن كان ذا صلة.')
    }
    const socialAvg = avgOf(socialExs)
    if (socialAvg >= 0) {
      if (socialAvg < 70) recs.push('المهارات الاجتماعية: تحتاج دعماً. يُوصى بتمارين التعرف على المشاعر، ومحاكاة المواقف الاجتماعية عبر لعب الأدوار (Role-play).')
    }
    const motorAvg = avgOf(motorExs)
    if (motorAvg >= 0 && motorAvg < 70) {
      recs.push('التناسق الحركي: دون المتوسط. يُقترح استشارة معالج وظيفي، وإدراج تمارين التناسق اليدوي ضمن الخطة العلاجية.')
    }
    if (abcLog.filter(e=>e.intensity===3).length > 0) {
      recs.push(`تحليل ABC: سُجِّل ${abcLog.filter(e=>e.intensity===3).length} حادث(ة) بحدة شديدة. يُقترح وضع خطة تدخل سلوكي وقائي (Proactive BIP) واستعراضها مع الفريق متعدد التخصصات.`)
    }
    if (recs.length === 0) {
      recs.push(avgScoreVal >= 80
        ? 'الأداء العام ممتاز. يُوصى بالاستمرار في البرنامج الحالي مع رفع مستوى الصعوبة تدريجياً.'
        : avgScoreVal >= 60
        ? 'الأداء العام مقبول. يُوصى بمواصلة التدريب مع التركيز على المجالات التي سجّل فيها الطالب أقل من 70%.'
        : 'يُوصى بمراجعة شاملة للبروتوكول العلاجي وتكثيف التدخل.')
    }
    const recsHtml = recs.map((r,i) => `<li style="margin-bottom:8px;padding:8px 12px;background:#f8fafc;border-right:3px solid #7C5CFC;border-radius:4px;font-size:12px;line-height:1.7">${i+1}. ${r}</li>`).join('')

    // ── Exercise rows ──
    const exerciseRows = results.map(r => {
      const grade = r.score>=80?'ممتاز':r.score>=60?'جيد':r.score>=40?'متوسط':'يحتاج دعم'
      const gradeColor = r.score>=80?'#16a34a':r.score>=60?'#d97706':r.score>=40?'#ea580c':'#dc2626'
      return `<tr>
        <td style="font-weight:700">${r.exerciseLabelAr}</td>
        <td style="text-align:center;font-weight:900;font-size:15px;color:${gradeColor}">${r.score}%</td>
        <td style="text-align:center;color:#666">${r.accuracy}%</td>
        <td style="text-align:center;color:#666">${r.duration}ث</td>
        <td style="text-align:center"><span style="background:${gradeColor}20;color:${gradeColor};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">${grade}</span></td>
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

${results.length > 0 ? `
<!-- Exercise table -->
<div class="section">
  <h2>🎮 نتائج التمارين التفصيلية</h2>
  <table>
    <thead><tr>
      <th>التمرين</th>
      <th style="text-align:center;width:70px">الدرجة</th>
      <th style="text-align:center;width:70px">الدقة</th>
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
  }, [kidMode, topGames, currentStudentId, id, difficulty, queueActive, exerciseQueue, showAchievement])

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
        <div
          className="fixed z-[150] flex flex-col items-center justify-center pointer-events-none select-none"
          style={{
            bottom: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            borderRadius: 24,
            padding: '16px 32px',
            backdropFilter: 'blur(12px)',
            border: `2px solid ${studentTimerLeft <= studentTimerTotal * 0.1 ? '#EF4444' : studentTimerLeft <= studentTimerTotal * 0.25 ? '#F59E0B' : '#22C55E'}55`,
            boxShadow: `0 0 40px ${studentTimerLeft <= studentTimerTotal * 0.1 ? '#EF444420' : studentTimerLeft <= studentTimerTotal * 0.25 ? '#F59E0B20' : '#22C55E20'}`,
            minWidth: 200,
          }}
        >
          <div
            className="font-black ltr-num"
            style={{
              fontSize: '3.5rem',
              color: studentTimerLeft <= studentTimerTotal * 0.1 ? '#EF4444'
                   : studentTimerLeft <= studentTimerTotal * 0.25 ? '#F59E0B'
                   : '#22C55E',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em',
            }}
          >
            {formatTime(studentTimerLeft)}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(studentTimerLeft / studentTimerTotal) * 100}%`,
                background: studentTimerLeft <= studentTimerTotal * 0.1 ? '#EF4444'
                           : studentTimerLeft <= studentTimerTotal * 0.25 ? '#F59E0B'
                           : '#22C55E',
              }}
            />
          </div>
          {studentTimerLeft === 0 && (
            <div className="text-white font-black text-sm mt-1">انتهى الوقت! ⏰</div>
          )}
          {/* Clickable to pause/resume */}
          <div className="pointer-events-auto mt-2 flex gap-2">
            <button
              onClick={() => setStudentTimerRunning(r => !r)}
              className="text-white/50 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {studentTimerRunning ? '⏸ إيقاف مؤقت' : '▶ استئناف'}
            </button>
            <button
              onClick={() => { setStudentTimerLeft(studentTimerTotal); setStudentTimerRunning(true) }}
              className="text-white/50 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              ↺ إعادة
            </button>
            <button
              onClick={() => { setShowStudentTimer(false); setStudentTimerRunning(false) }}
              className="text-white/30 hover:text-white text-xs px-2 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
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
          className="fixed left-3 z-[490] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black shadow-lg transition-all active:scale-95 select-none"
          style={{ top: 'calc(50% - 26px)', transform: 'translateY(-50%)', background: 'rgba(17,24,39,0.85)', color: '#FFFFFF', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          title={chromeHidden ? 'إظهار أدوات الجلسة' : 'تكبير الشاشة — إخفاء الأدوات'}
        >
          {chromeHidden ? '🔽 إظهار الأدوات' : '🔼 تكبير الشاشة'}
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
      <header
        ref={headerRef}
        className={`border-b border-brand-100 bg-white/90 backdrop-blur-sm flex items-center gap-2 px-3 py-2 flex-shrink-0 relative z-[60] ${chromeHidden ? 'hidden' : ''}`}
      >
        {/* Close — pause the timer before leaving so the session isn't left
            "running" in the background; reopening it later resumes paused,
            never silently counting the time spent away. */}
        <button
          onClick={() => { setRunning(false); router.back() }}
          className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors hover:bg-brand-50 text-gray-400 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Student info — name only on mobile, full on desktop */}
        <div className="flex-1 min-w-0 relative">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-1.5 min-w-0 max-w-full"
          >
            {/* Avatar initial */}
            <div
              className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg,#7C5CFC,#C084FC)' }}
            >
              {(studentName || 'ج').charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-900 font-black text-sm truncate">
              <span className="sm:hidden">{(() => { const n = (studentName || 'جلسة').split(' ')[0]; return n.charAt(0).toUpperCase() + n.slice(1); })()}</span>
              <span className="hidden sm:inline">{studentName || 'جلسة تفاعلية'}</span>
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-300 flex-shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Badges — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
            {studentDiagnosis && (
              <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full font-bold">
                {DIAG_LABELS[studentDiagnosis] || studentDiagnosis}
              </span>
            )}
            {studentSeverity > 0 && (
              <span className="text-[10px] bg-surface-page text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                {SEVERITY_LABELS[studentSeverity]}
              </span>
            )}
            {sessionCount > 0 && (
              <span className="text-[10px] bg-surface-page text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                ج.{sessionCount} سابقة
              </span>
            )}
            {appointmentType && SESSION_TYPE_CFG[appointmentType] && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${SESSION_TYPE_CFG[appointmentType].color}`}>
                {SESSION_TYPE_CFG[appointmentType].isAssessment && <ClipboardList className="w-2.5 h-2.5" />}
                {SESSION_TYPE_CFG[appointmentType].label}
              </span>
            )}
          </div>

          {/* ── Quick Profile Card ── */}
          {profileOpen && (
            <div
              className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto z-[70] rounded-2xl p-4 w-[min(288px,calc(100vw-24px))] shadow-2xl bg-white border border-brand-100"
              dir="rtl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-black text-sm truncate">{studentName || '—'}</div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {studentAge} سنة • {DIAG_LABELS[studentDiagnosis] || studentDiagnosis || 'لا يوجد تشخيص'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {studentSeverity > 0 && (
                      <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full font-bold">
                        {SEVERITY_LABELS[studentSeverity]}
                      </span>
                    )}
                    {sessionCount > 0 && (
                      <span className="text-[10px] text-gray-400 font-medium">{sessionCount} جلسة سابقة</span>
                    )}
                  </div>
                </div>
              </div>

              {pastSessions.length > 0 && (
                <div className="mb-3">
                  <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">آخر 3 جلسات</div>
                  <div className="space-y-1.5">
                    {pastSessions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-page rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.score}%`,
                              background: s.score >= 80 ? '#22C55E' : s.score >= 60 ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </div>
                        <span className="text-gray-600 text-[10px] font-black ltr-num w-8 text-left">{s.score}%</span>
                        <span className="text-gray-300 text-[9px] ltr-num flex-shrink-0">{s.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none') && (
                <div className="border-t border-brand-100 pt-3 mb-3">
                  <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">صعوبات موثقة</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(profile.diagnosedDifficulties)
                      .filter(([, v]) => v !== 'none')
                      .map(([k, v]) => (
                        <span key={k} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          v === 'severe'   ? 'bg-red-50 text-red-600 border-red-200' :
                          v === 'moderate' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                             'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {DIFFICULTY_LABELS_AR[k as keyof typeof DIFFICULTY_LABELS_AR]}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className={`${(profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none')) || pastSessions.length > 0 ? 'border-t border-brand-100 pt-3' : ''}`}>
                <div className="text-gray-400 text-[10px] font-black mb-1 uppercase tracking-wider">ملاحظات</div>
                {notes ? (
                  <p className="text-gray-600 text-[10px] leading-relaxed line-clamp-3">{notes}</p>
                ) : (
                  <p className="text-gray-300 text-[10px] italic">لا توجد ملاحظات بعد</p>
                )}
              </div>

              <button
                onClick={() => setProfileOpen(false)}
                className="mt-3 w-full text-gray-400 hover:text-gray-600 text-[10px] font-bold transition-colors pt-2 border-t border-brand-100"
              >
                إغلاق ✕
              </button>
            </div>
          )}
        </div>

        {/* Session Timer */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0 border ${
            running ? 'bg-emerald-50 border-emerald-200' : 'bg-surface-page border-brand-100'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${running ? 'text-emerald-600' : 'text-gray-300'}`} />
          <span className={`font-black text-base ltr-num ${running ? 'text-emerald-600' : 'text-gray-400'}`}>
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Average score — hidden on mobile */}
        {results.length > 0 && (
          <div className="hidden sm:block text-center flex-shrink-0">
            <div className="font-black text-brand-600 text-lg ltr-num">{avgScore}%</div>
            <div className="text-gray-400 text-[10px]">متوسط</div>
          </div>
        )}

        {/* Start */}
        {!running && (
          <button
            onClick={startSession}
            className="font-black text-white text-xs px-3 py-2 rounded-xl flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#16A34A,#22C55E)', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}
          >
            ▶ ابدأ
          </button>
        )}

        {/* Save */}
        <button
          onClick={saveSession}
          disabled={saving}
          title={saveFailed ? 'فشل الحفظ — البيانات محفوظة محليًا مؤقتًا، اضغط لإعادة المحاولة' : undefined}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs flex-shrink-0 transition-all active:scale-95 ${
            saveFailed ? 'bg-red-50 text-red-600 border border-red-200' :
            saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
            saving ? 'bg-brand-50 text-gray-400' : 'text-white'
          }`}
          style={!saveFailed && !saved && !saving
            ? { background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.35)' }
            : undefined
          }
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{saving ? '...' : saveFailed ? '⚠ فشل، أعد المحاولة' : saved ? '✓ محفوظ' : 'حفظ'}</span>
        </button>
      </header>

      {/* ── Toolbar strip ── */}
      <div
        ref={toolbarRef}
        className={`bg-white border-b border-brand-100 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${chromeHidden ? 'hidden' : ''}`}>

        {/* Group 1 — Camera */}
        {jitsiUrl && (
          <button
            onClick={() => setJitsiEmbedded(e => !e)}
            className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
              jitsiEmbedded
                ? 'bg-green-600 text-white ring-1 ring-green-400/50'
                : 'bg-surface-page hover:bg-brand-50 text-gray-500'
            }`}
            title="المقابلة المرئية"
          >
            <Video className="w-3.5 h-3.5" />
            {jitsiEmbedded ? '● مقابلة' : 'مقابلة'}
          </button>
        )}

        <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

        {/* Group 2 — Drawing & Cards & Timer */}
        <button
          onClick={() => setShowWhiteboard(w => !w)}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
            showWhiteboard
              ? 'bg-amber-500 text-white ring-1 ring-amber-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="السبورة التفاعلية"
        >
          <PenLine className="w-3.5 h-3.5" />
          سبورة
        </button>

        <div className="relative flex-shrink-0" ref={promptBtnRef}>
          <button
            onClick={() => setPromptPickerOpen(p => !p)}
            className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              promptPickerOpen
                ? 'bg-purple-500 text-white ring-1 ring-purple-400/50'
                : 'bg-surface-page hover:bg-brand-50 text-gray-500'
            }`}
            title="بطاقات التحفيز"
          >
            🃏 بطاقة
          </button>
        </div>
        <ToolbarPopover anchorRef={promptBtnRef} open={promptPickerOpen} onClose={() => setPromptPickerOpen(false)}>
          <div
            className="rounded-2xl overflow-hidden shadow-2xl bg-white border border-brand-100"
            style={{ minWidth: 200 }}
            dir="rtl"
          >
            {PROMPT_CARDS.map(card => (
              <button
                key={card.id}
                onClick={() => { setPromptCard(card); setPromptPickerOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-right"
              >
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-gray-800 font-black text-sm">{card.text}</span>
              </button>
            ))}
          </div>
        </ToolbarPopover>

        <div className="relative flex-shrink-0" ref={timerBtnRef}>
          <button
            onClick={() => setTimerPickerOpen(p => !p)}
            className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              showStudentTimer
                ? 'bg-orange-500 text-white ring-1 ring-orange-400/50'
                : 'bg-surface-page hover:bg-brand-50 text-gray-500'
            }`}
            title="مؤقت الطالب"
          >
            ⏱ {showStudentTimer ? formatTime(studentTimerLeft) : 'مؤقت'}
          </button>
        </div>
        <ToolbarPopover anchorRef={timerBtnRef} open={timerPickerOpen} onClose={() => setTimerPickerOpen(false)}>
          <div
            className="rounded-2xl p-3 shadow-2xl bg-white border border-brand-100"
            style={{ minWidth: 180 }}
            dir="rtl"
          >
            <p className="text-gray-400 text-[10px] font-black mb-2">اختر مدة المؤقت</p>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[[60,'1 دقيقة'],[120,'2 دقيقة'],[180,'3 دقائق'],[300,'5 دقائق']].map(([s,l]) => (
                <button
                  key={s}
                  onClick={() => startStudentTimer(s as number)}
                  className="py-2 rounded-xl text-xs font-black text-gray-700 bg-surface-page transition-all hover:ring-1 hover:ring-orange-400"
                >
                  {l as string}
                </button>
              ))}
            </div>
            {showStudentTimer && (
              <button
                onClick={() => { setShowStudentTimer(false); setStudentTimerRunning(false); setTimerPickerOpen(false) }}
                className="w-full py-1.5 rounded-xl text-[10px] font-black text-red-500 bg-red-50 transition-all"
              >
                إيقاف المؤقت
              </button>
            )}
          </div>
        </ToolbarPopover>

        {/* White noise / focus music */}
        <div className="relative flex-shrink-0" ref={noiseBtnRef}>
          <button
            onClick={() => setShowNoisePanel(p => !p)}
            className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              noiseRunning
                ? 'bg-cyan-600 text-white ring-1 ring-cyan-400/50'
                : 'bg-surface-page hover:bg-brand-50 text-gray-500'
            }`}
            title="موسيقى وترددات الاسترخاء والتركيز"
          >
            🎵 {noiseRunning ? formatTime(noiseSecsLeft) : 'موسيقى'}
          </button>
        </div>
        <ToolbarPopover anchorRef={noiseBtnRef} open={showNoisePanel} onClose={() => setShowNoisePanel(false)}>
          <div
            className="rounded-2xl p-3 shadow-2xl bg-white border border-cyan-100"
            style={{ minWidth: 230 }}
            dir="rtl"
          >
            <p className="text-gray-400 text-[10px] font-black mb-2.5 flex items-center gap-1">
              🎵 صوت الجلسة <span className="text-cyan-600">(5 دقائق)</span>
            </p>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {([
                { key: 'calm',  label: 'أمبيانت هادئ',  emoji: '🎐' },
                { key: 'theta', label: 'ثيتا للاسترخاء', emoji: '🌙' },
                { key: 'focus', label: 'غاما 40Hz',     emoji: '🧠' },
                { key: 'rain',  label: 'مطر',           emoji: '🌧️' },
                { key: 'white', label: 'ضوضاء بيضاء',  emoji: '🌊' },
              ] as const).map(m => (
                <button
                  key={m.key}
                  onClick={() => { setNoiseMode(m.key); if (noiseRunning) stopNoise() }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black text-center transition-all leading-tight ${
                    noiseMode === m.key
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 bg-surface-page'
                  }`}
                >
                  <div className="text-base mb-0.5">{m.emoji}</div>
                  <div>{m.label}</div>
                </button>
              ))}
            </div>

            {/* Countdown */}
            {noiseRunning && (
              <div className="text-center mb-3">
                <div className="text-cyan-600 font-black text-xl ltr-num">{formatTime(noiseSecsLeft)}</div>
                <div className="h-1.5 bg-surface-page rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-cyan-400 to-cyan-600 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 * 60 - noiseSecsLeft) / (5 * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => noiseRunning ? stopNoise() : startNoise()}
              className={`w-full py-2.5 rounded-xl text-sm font-black transition-all ${
                noiseRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {noiseRunning ? '⏹ إيقاف' : '▶ تشغيل'}
            </button>
            <p className="text-gray-400 text-[9px] mt-2 text-center leading-relaxed">
              {{
                calm:  'نغمات هادئة متجانسة بتذبذب يحاكي التنفس البطيء (~6 أنفاس/د) — مستوحى من أبحاث الموسيقى المهدئة للدماغ',
                theta: 'نبضة ثنائية (binaural) بتردد ~6Hz (ثيتا) مرتبطة بالاسترخاء العميق — يلزم استخدام سماعات الرأس',
                focus: 'نبضة ثنائية (binaural) بتردد 40Hz (غاما) مرتبطة باليقظة والتركيز — يلزم استخدام سماعات الرأس',
                rain:  'صوت مطر طبيعي مهدئ لتغطية المشتتات الصوتية',
                white: 'الضوضاء البيضاء تُحسّن التركيز لدى ADHD — موثّق علمياً',
              }[noiseMode]}
            </p>
          </div>
        </ToolbarPopover>

        <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

        {/* Group 3 — Modes */}
        <button
          onClick={() => setKidMode(m => !m)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 ${
            kidMode
              ? 'bg-gradient-to-r from-[#7C5CFC] to-[#9A7BFD] text-white shadow-[0_4px_12px_-2px_rgba(124,92,252,0.4)]'
              : 'bg-surface-page text-gray-500 hover:bg-brand-50'
          }`}
          title="وضع الطفل"
        >
          🎮 {kidMode ? 'وضع الأستاذ' : 'وضع الطفل'}
        </button>

        <button
          onClick={() => setFocusMode(m => !m)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 ${
            focusMode
              ? 'bg-gradient-to-r from-[#FF8C65] to-[#FFBA44] text-white shadow-[0_4px_12px_-2px_rgba(255,140,101,0.4)]'
              : 'bg-surface-page text-gray-500 hover:bg-brand-50'
          }`}
          title="وضع التركيز"
        >
          🎯 {focusMode ? 'تركيز ●' : 'تركيز'}
        </button>

        <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

        {/* Group 4 — Difficulty */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {([1,2,3] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                difficulty === d ? 'bg-brand-600 text-white' : 'bg-surface-page text-gray-400 hover:bg-brand-50'
              }`}>
              {d === 1 ? 'سهل' : d === 2 ? 'متوسط' : 'صعب'}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Report */}
        {results.length > 0 && (
          <button
            onClick={printSessionReport}
            className="flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all bg-surface-page hover:bg-brand-50 text-gray-500 flex-shrink-0"
            title="طباعة تقرير الجلسة"
          >
            📄 تقرير
          </button>
        )}

        {/* Lock session button */}
        <button
          onClick={lockSession}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 bg-surface-page text-gray-500 hover:bg-amber-50 hover:text-amber-600"
          title="قفل الجلسة — يخفي أدوات المعالج حتى لا يتشتت الطفل"
        >
          🔒 قفل
        </button>
      </div>

      {/* ── Session Phase Progress Bar ── */}
      {running && !chromeHidden && (
        <div ref={phaseBarRef} className="bg-white border-b border-brand-100 px-4 py-2 flex items-center gap-3 shadow-sm" dir="rtl">
          <span className="text-gray-400 text-[10px] font-black flex-shrink-0">مراحل</span>
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
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition-all ${isActive ? 'animate-pop' : ''}`}
                  style={{
                    background: isActive ? `${ph.color}16` : 'transparent',
                    border: isActive ? `1px solid ${ph.color}55` : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-[11px]">{ph.icon}</span>
                    <span
                      className="text-[10px] font-black truncate"
                      style={{ color: isActive ? ph.color : isDone ? '#9CA3AF' : '#D1D5DB' }}
                    >
                      {ph.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] mr-auto ltr-num" style={{ color: `${ph.color}99` }}>
                        {formatTime(phaseElapsed)}/{phaseDurations[i]}د
                      </span>
                    )}
                    {isDone && <span className="text-[9px] mr-auto text-calm-teal">✓</span>}
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden bg-surface-page">
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
            className="text-gray-300 hover:text-brand-600 text-[10px] font-bold flex-shrink-0 transition-colors px-1"
            title="تعديل مدة المراحل"
          >
            ⚙
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* Sidebar */}
        {!chromeHidden && <aside className="hidden lg:flex w-72 bg-white border-l border-brand-100 flex-col">
          {/* Tabs */}
          <div className="flex border-b border-brand-100">
            {([
              { key: 'exercises',   icon: '🎮', label: 'تمارين' },
              { key: 'assessments', icon: '📊', label: 'تقييم'  },
              { key: 'log',         icon: '📝', label: 'سجل'    },
              { key: 'videos',      icon: '📹', label: 'فيديو'  },
            ] as const).map(({ key: t, icon, label }) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                  tab === t ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <span className="text-sm leading-none">{icon}</span>
                {label}
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
                  const filteredEx = categoryFilter === 'الكل' ? sortedExercises : sortedExercises.filter(e => e.category === categoryFilter)
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
              className="fixed z-[80] left-3 flex items-center gap-1.5 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
              style={{ top: 'calc(50% + 26px)', transform: 'translateY(-50%)', background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }}
              title="إعادة هذا التمرين من البداية"
            >
              🔄 إعادة
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

      {/* ── ABC Behavior Log Panel ── */}
      {running && (
        <div
          className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
          style={{ marginRight: 190 }}
          dir="rtl"
        >
          {abcOpen && (
            <div
              className="mb-2 rounded-2xl p-4 w-80"
              style={{ background: '#111827', border: '1.5px solid rgba(245,158,11,0.3)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-amber-400 font-black text-xs">🔗 تحليل ABC</span>
                <button onClick={() => setAbcOpen(false)} className="text-white/40 hover:text-white text-lg leading-none">×</button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-black text-blue-400 mb-1 block">A — السابق (ما حدث قبل)</label>
                  <input
                    value={abcForm.antecedent}
                    onChange={e => setAbcForm(f => ({ ...f, antecedent: e.target.value }))}
                    placeholder="ما الذي سبق السلوك؟"
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(96,165,250,0.4)' }}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-amber-400 mb-1 block">B — السلوك (ما حدث)</label>
                  <input
                    value={abcForm.behavior}
                    onChange={e => setAbcForm(f => ({ ...f, behavior: e.target.value }))}
                    placeholder="صِف السلوك بدقة..."
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.4)' }}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-green-400 mb-1 block">C — النتيجة (ردة الفعل)</label>
                  <input
                    value={abcForm.consequence}
                    onChange={e => setAbcForm(f => ({ ...f, consequence: e.target.value }))}
                    placeholder="ما الذي تلا السلوك؟"
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(74,222,128,0.4)' }}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 mb-1 block">الحدة</label>
                  <div className="flex gap-1.5">
                    {([1,2,3] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setAbcForm(f => ({ ...f, intensity: v }))}
                        className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
                        style={{
                          background: abcForm.intensity === v
                            ? v === 1 ? '#22C55E' : v === 2 ? '#F59E0B' : '#EF4444'
                            : 'rgba(255,255,255,0.08)',
                          color: abcForm.intensity === v ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {v === 1 ? 'خفيف' : v === 2 ? 'متوسط' : 'شديد'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={logABC}
                disabled={!abcForm.antecedent && !abcForm.behavior}
                className="mt-3 w-full py-2.5 rounded-xl font-black text-sm transition-all"
                style={{
                  background: (abcForm.antecedent || abcForm.behavior) ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                  color: (abcForm.antecedent || abcForm.behavior) ? '#000000' : 'rgba(255,255,255,0.2)',
                }}
              >
                حفظ السجل ✓
              </button>
            </div>
          )}
          <button
            onClick={() => { setAbcOpen(o => !o); setObsOpen(false); setHwOpen(false) }}
            className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
            style={abcOpen
              ? { background: '#F59E0B', color: '#000000', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }
              : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
            }
          >
            🔗 ABC
            {abcLog.length > 0 && (
              <span className="font-black text-[10px] px-1.5 py-0.5 rounded-full ltr-num bg-amber-500 text-black">
                {abcLog.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Homework Builder Panel ── */}
      {running && currentStudentId && (
        <div
          className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
          style={{ marginRight: 96 }}
          dir="rtl"
        >
          {hwOpen && (
            <div
              className="mb-2 rounded-2xl p-4 w-80"
              style={{ background: '#111827', border: '1.5px solid rgba(34,197,94,0.3)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-green-400 font-black text-xs">🏠 الواجب المنزلي</span>
                <button onClick={() => setHwOpen(false)} className="text-white/40 hover:text-white text-lg leading-none">×</button>
              </div>
              {hwSent ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-green-400 font-black">تم الإرسال للطالب!</p>
                </div>
              ) : (
                <>
                  <p className="text-white/40 text-[10px] mb-3">اختر حتى 3 تمارين للواجب المنزلي</p>
                  <div className="space-y-1 max-h-52 overflow-y-auto mb-3">
                    {EXERCISES.filter(e => studentAge >= (e.ageMin ?? 5) && studentAge <= (e.ageMax ?? 22)).map(ex => {
                      const sel = hwSelected.includes(ex.id)
                      return (
                        <button
                          key={ex.id}
                          onClick={() => {
                            if (sel) {
                              setHwSelected(prev => prev.filter(id => id !== ex.id))
                            } else if (hwSelected.length < 3) {
                              setHwSelected(prev => [...prev, ex.id])
                            }
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl transition-all text-right"
                          style={{
                            background: sel ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                            border: sel ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
                            opacity: !sel && hwSelected.length >= 3 ? 0.4 : 1,
                          }}
                        >
                          <span className="text-lg">{ex.icon}</span>
                          <span className="text-white text-xs font-bold flex-1 text-right">{ex.labelAr}</span>
                          {sel && <span className="text-green-400 text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    value={hwNote}
                    onChange={e => setHwNote(e.target.value)}
                    placeholder="ملاحظة للطالب (اختياري)..."
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-green-400 mb-3 resize-none"
                    rows={2}
                    dir="rtl"
                  />
                  <button
                    onClick={sendHomework}
                    disabled={hwSelected.length === 0 || hwSending}
                    className="w-full py-2.5 rounded-xl font-black text-sm transition-all"
                    style={{
                      background: hwSelected.length > 0 ? '#22C55E' : 'rgba(255,255,255,0.06)',
                      color: hwSelected.length > 0 ? '#000000' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {hwSending ? '...' : `إرسال (${hwSelected.length}/3) →`}
                  </button>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => { setHwOpen(o => !o); setAbcOpen(false); setObsOpen(false) }}
            className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-lg"
            style={hwOpen
              ? { background: '#22C55E', color: '#000000', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }
              : { background: 'linear-gradient(135deg,#1F2937,#374151)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)' }
            }
          >
            🏠 واجب
            {hwSent && <span className="text-green-400 text-[10px]">✓</span>}
          </button>
        </div>
      )}

      {/* ── Quick Observation Panel ── */}
      {running && (
        <div
          className={`fixed z-[80] bottom-20 lg:bottom-6 ${chromeHidden ? 'right-6' : 'right-4 lg:right-72'}`}
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

      {/* ── Phase Duration Edit Modal ── */}
      {showPhaseEdit && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setShowPhaseEdit(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            style={{ background: '#0F172A', border: '1.5px solid rgba(255,255,255,0.12)' }}
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-black text-base">⚙ ضبط مراحل الجلسة</h3>
              <button onClick={() => setShowPhaseEdit(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              {SESSION_PHASES.map((ph, i) => (
                <div
                  key={ph.id}
                  className="flex items-center gap-4 rounded-2xl px-4 py-3"
                  style={{ background: `${ph.color}14`, border: `1px solid ${ph.color}35` }}
                >
                  <span className="text-2xl flex-shrink-0">{ph.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm mb-2" style={{ color: ph.color }}>{ph.label}</div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPhaseDurations(prev => prev.map((d, idx) => idx === i ? Math.max(1, d - 1) : d))}
                        className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-90 select-none"
                        style={{ background: `${ph.color}25`, color: ph.color }}
                      >−</button>
                      <div className="flex-1 text-center">
                        <span className="font-black text-3xl text-white ltr-num">{phaseDurations[i]}</span>
                        <span className="text-white/40 text-sm mr-1.5">د</span>
                      </div>
                      <button
                        onClick={() => setPhaseDurations(prev => prev.map((d, idx) => idx === i ? Math.min(60, d + 1) : d))}
                        className="w-9 h-9 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-90 select-none"
                        style={{ background: `${ph.color}25`, color: ph.color }}
                      >+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-white/40 text-sm">
                المجموع: <span className="text-white font-black ltr-num">{phaseDurations.reduce((a, b) => a + b, 0)}</span> دقيقة
              </div>
              <button
                onClick={() => setShowPhaseEdit(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                تأكيد ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exercise Config Modal ── */}
      {exerciseConfigId && (() => {
        const ex = EXERCISES.find(e => e.id === exerciseConfigId)
        if (!ex) return null
        const overrideDiff = exerciseDiffOverrides[exerciseConfigId] ?? difficulty
        const sessionResults = results.filter(r => r.exerciseType === exerciseConfigId)
        const avgSessionScore = sessionResults.length
          ? Math.round(sessionResults.reduce((s, r) => s + r.score, 0) / sessionResults.length)
          : null
        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            onClick={() => setExerciseConfigId(null)}
          >
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <div
              className="relative rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl bg-white border border-brand-100"
              onClick={e => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border ${ex.color}`}>
                  {ex.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-black text-sm">{ex.labelAr}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{ex.category} • {ex.ageMin}–{ex.ageMax} سنة</div>
                </div>
                <button onClick={() => setExerciseConfigId(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">×</button>
              </div>

              {/* Difficulty override */}
              <div className="mb-4">
                <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">الصعوبة لهذا التمرين</div>
                <div className="grid grid-cols-3 gap-2">
                  {([1,2,3] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setExerciseDiffOverrides(prev => ({ ...prev, [exerciseConfigId]: d }))}
                      className="py-2.5 rounded-xl text-xs font-black transition-all"
                      style={{
                        background: overrideDiff === d
                          ? d === 1 ? '#F0FDF4' : d === 2 ? '#FFFBEB' : '#FEF2F2'
                          : '#FFF8F0',
                        color: overrideDiff === d
                          ? d === 1 ? '#16a34a' : d === 2 ? '#d97706' : '#dc2626'
                          : '#9CA3AF',
                        border: overrideDiff === d
                          ? `1px solid ${d === 1 ? '#16a34a55' : d === 2 ? '#d9770655' : '#dc262655'}`
                          : '1px solid transparent',
                      }}
                    >
                      {d === 1 ? '🟢 سهل' : d === 2 ? '🟡 متوسط' : '🔴 صعب'}
                    </button>
                  ))}
                </div>
                {overrideDiff !== difficulty && (
                  <button
                    onClick={() => setExerciseDiffOverrides(prev => {
                      const next = { ...prev }
                      delete next[exerciseConfigId]
                      return next
                    })}
                    className="mt-2 text-gray-300 hover:text-gray-500 text-[10px] font-bold transition-colors"
                  >
                    ← العودة للمستوى العام ({difficulty === 1 ? 'سهل' : difficulty === 2 ? 'متوسط' : 'صعب'})
                  </button>
                )}
                {!exerciseDiffOverrides[exerciseConfigId] && suggestedDifficulty(exerciseConfigId, difficulty) !== difficulty && (
                  <button
                    onClick={() => setExerciseDiffOverrides(prev => ({ ...prev, [exerciseConfigId]: suggestedDifficulty(exerciseConfigId, difficulty) }))}
                    className="mt-2 w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <span>🤖 مقترح بناءً على متوسط {gameHistoryByGame[exerciseConfigId]?.avgScore}%: {suggestedDifficulty(exerciseConfigId, difficulty) === 1 ? 'سهل' : suggestedDifficulty(exerciseConfigId, difficulty) === 2 ? 'متوسط' : 'صعب'}</span>
                    <span className="text-emerald-600">تطبيق ←</span>
                  </button>
                )}
              </div>

              {/* Stats from this session + history */}
              {(sessionResults.length > 0 || (gameUsageCounts[exerciseConfigId] ?? 0) > 0) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {sessionResults.length > 0 && (
                    <>
                      <div className="bg-surface-page rounded-xl p-3 text-center">
                        <div className="font-black text-xl text-brand-600 ltr-num">{sessionResults.length}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">مرة الجلسة الحالية</div>
                      </div>
                      {avgSessionScore !== null && (
                        <div className="bg-surface-page rounded-xl p-3 text-center">
                          <div className={`font-black text-xl ltr-num ${avgSessionScore >= 80 ? 'text-emerald-600' : avgSessionScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {avgSessionScore}%
                          </div>
                          <div className="text-gray-400 text-[10px] mt-0.5">متوسط الدرجات</div>
                        </div>
                      )}
                    </>
                  )}
                  {(gameUsageCounts[exerciseConfigId] ?? 0) > 0 && sessionResults.length === 0 && (
                    <div className="col-span-2 bg-surface-page rounded-xl p-3 flex items-center justify-between">
                      <span className="text-gray-400 text-xs">الجلسات السابقة</span>
                      <span className="text-brand-600 font-black text-sm ltr-num">{gameUsageCounts[exerciseConfigId]} مرة</span>
                    </div>
                  )}
                </div>
              )}

              {/* Launch button */}
              <button
                onClick={() => {
                  if (!running) startSession()
                  setActiveView({ type: 'exercise', id: exerciseConfigId })
                  setExerciseConfigId(null)
                }}
                className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', boxShadow: '0 4px 20px rgba(124,92,252,0.35)' }}
              >
                {ex.icon} تشغيل التمرين الآن →
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── مكتبة الفيديو Modal ── */}
      {videoModal && (() => {
        const ex = EXERCISES.find(e => e.id === videoModal)
        const entry = VIDEO_LIBRARY[videoModal]
        if (!ex || !entry) return null
        const currentUrl = videoUrls[videoModal] || ''
        const customId = extractYoutubeId(currentUrl)
        const activeVideoId = customId || entry.videoId || null
        // Bundled library clips are curated to be short; hard-cap playback at 30s
        // so a long source video can never run past that, even if mis-tagged.
        // A specialist's own pasted link is their deliberate choice — left uncapped.
        const isLibraryClip = !customId && !!entry.videoId
        return (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center"
            onClick={() => setVideoModal(null)}
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
            <div
              className="relative rounded-3xl w-full max-w-xl mx-4 overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(10,8,22,0.97)',
                border: '1px solid rgba(124,92,252,0.2)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px)',
              }}
              onClick={e => e.stopPropagation()}
              dir="rtl"
            >
              {/* Gradient header bar */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg,#7C5CFC,#C084FC,#7C5CFC)' }} />

              {/* Header */}
              <div className="px-5 pt-5 pb-4 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)' }}
                >
                  {ex.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-black text-lg leading-tight">{ex.labelAr}</div>
                  <div className="text-brand-400 text-xs font-bold mt-0.5">{ex.category}</div>
                  <div className="text-white/50 text-xs mt-1 leading-relaxed">{entry.desc}</div>
                </div>
                <button
                  onClick={() => setVideoModal(null)}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video embed */}
              {activeVideoId ? (
                <div className="mx-5 mb-4">
                  {isLibraryClip && (
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-brand-300">
                      <span>⏱ مقطع مختصر — 30 ثانية كحد أقصى</span>
                    </div>
                  )}
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
                    <iframe
                      key={activeVideoId}
                      src={`https://www.youtube.com/embed/${activeVideoId}?rel=0&modestbranding=1${isLibraryClip ? '&end=30' : ''}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="mx-5 mb-4 rounded-2xl flex flex-col items-center justify-center gap-3 py-8"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                  <Youtube className="w-10 h-10 text-white/20" />
                  <p className="text-white/30 text-sm">الصق رابط يوتيوب لتشغيل الفيديو هنا</p>
                </div>
              )}

              {/* Tips */}
              <div className="px-5 mb-4">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-2">💡 نصائح التطبيق</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {entry.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-brand-500 text-[10px] font-black mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span className="text-white/60 text-[10px] leading-snug">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom URL override */}
              <div className="px-5 pb-5">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={currentUrl}
                    onChange={e => setVideoUrls(prev => ({ ...prev, [videoModal]: e.target.value }))}
                    placeholder={entry.videoId ? 'استبدل الفيديو برابط يوتيوب آخر (اختياري)' : 'الصق رابط يوتيوب هنا...'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40"
                    dir="ltr"
                  />
                  {currentUrl && (
                    <button
                      onClick={() => setVideoUrls(prev => ({ ...prev, [videoModal]: '' }))}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
