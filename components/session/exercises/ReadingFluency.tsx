'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

// ── Word banks ─────────────────────────────────────────────────
const WORD_BANKS: Record<1|2|3, string[]> = {
  1: ['بيت','كلب','قط','باب','نار','ماء','يد','كتاب','قلم','شمس',
       'قمر','سمك','شجر','ولد','بنت','أكل','لعب','نام','جرى','طار'],
  2: ['سيارة','حديقة','مدرسة','تفاحة','قطار','طيارة','شجرة','عصفور',
       'فراشة','أسد','قرود','بطيخة','برتقال','عنكبوت','فيل','زرافة',
       'دجاجة','قنفذ','سلحفاة','تمساح'],
  3: ['اشتريت','الاستعداد','المدرسة','الأصدقاء','التلميذات','المكتبة',
       'الحيوانات','الطبيبة','البيئة','المستشفى','الاجتماع','المعلمة',
       'التلفزيون','الإخوة','الفطار','التمرين','الإجازة','الترتيب',
       'المساعدة','الاطمئنان'],
}

const TIME_MAP: Record<1|2|3, number> = { 1: 60, 2: 45, 3: 30 }

const LEVEL_LABELS: Record<1|2|3, string> = {
  1: 'كلمات بسيطة',
  2: 'كلمات متوسطة',
  3: 'كلمات مركبة',
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function ReadingFluency({ onComplete, onCancel, difficulty = 1 }: Props) {
  const totalTime  = TIME_MAP[difficulty]
  // useMemo ensures the word order is stable across re-renders
  const words      = useMemo(() => shuffle(WORD_BANKS[difficulty]), [difficulty]) // eslint-disable-line react-hooks/exhaustive-deps
  const totalWords = words.length

  const [phase,      setPhase]      = useState<'playing'|'done'>('playing')
  const [wordIdx,    setWordIdx]    = useState(0)
  const [wordsRead,  setWordsRead]  = useState(0)
  const [timeLeft,   setTimeLeft]   = useState(totalTime)
  const [flickerKey, setFlickerKey] = useState(0) // changes on every new word → triggers animation + auto-speak

  const startMs  = useRef(Date.now())
  const endMsRef = useRef(0)
  const doneRef  = useRef(false) // guards against double-fire in strict mode

  // ── TTS helpers ───────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ar-SA'
    u.rate = 0.8
    window.speechSynthesis.speak(u)
  }, [])

  // Cancel TTS on unmount
  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Auto-speak on new word — triggered by flickerKey (changes each time wordIdx advances)
  useEffect(() => {
    if (phase === 'playing') speak(words[wordIdx])
  }, [flickerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft])

  // Trigger done when the clock reaches zero
  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing' && !doneRef.current) {
      doneRef.current = true
      endMsRef.current = Date.now()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setPhase('done')
    }
  }, [timeLeft, phase])

  // ── Interactions ──────────────────────────────────────────────
  function handleConfirm() {
    if (phase !== 'playing' || doneRef.current) return
    const next = (wordIdx + 1) % totalWords
    setWordsRead(w => w + 1)
    setWordIdx(next)
    setFlickerKey(k => k + 1) // triggers animation + auto-speak via effect
  }

  function handleReplay() {
    speak(words[wordIdx])
  }

  function handleFinishEarly() {
    if (doneRef.current) return
    doneRef.current = true
    endMsRef.current = Date.now()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setPhase('done')
  }

  // ── Results screen ────────────────────────────────────────────
  if (phase === 'done') {
    const duration       = Math.max(1, Math.round(((endMsRef.current || Date.now()) - startMs.current) / 1000))
    const wordsPerMinute = Math.round((wordsRead / duration) * 60)
    const score          = Math.min(100, Math.round((wordsRead / totalWords) * 100))
    const trophy         = score >= 80 ? '🏆' : score >= 60 ? '⭐' : score >= 40 ? '👍' : '💪'
    const praise         =
      score >= 80 ? 'ممتاز! طلاقة رائعة جداً' :
      score >= 60 ? 'جيد جداً! استمر في التدريب' :
      score >= 40 ? 'جيد! التدريب يُحسِّن الطلاقة' :
      'بداية جيدة! واصل التدريب يومياً'
    const barColor =
      score >= 80 ? 'linear-gradient(to left, #16a34a, #86efac)' :
      score >= 60 ? 'linear-gradient(to left, #2563eb, #93c5fd)' :
      'linear-gradient(to left, #f59e0b, #fde68a)'

    function submit() {
      onComplete({
        exerciseType:    'reading-fluency',
        exerciseLabelAr: 'طلاقة القراءة',
        score,
        accuracy:   score,
        duration,
        errors:     Math.max(0, totalWords - wordsRead),
        metadata:   { wordsRead, totalWords, wordsPerMinute, difficulty, timeAllowed: totalTime },
        completedAt: new Date().toISOString(),
      })
    }

    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center gap-5 px-5 py-8 min-h-full select-none"
        style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3C7)' }}
      >
        <div className="text-7xl animate-bounce">{trophy}</div>
        <h2 className="text-2xl font-black text-gray-800">انتهى الوقت!</h2>

        {/* Score card */}
        <div
          className="w-full max-w-xs rounded-3xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}
        >
          <div className="p-6">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="text-center p-3 rounded-2xl" style={{ background: '#F0FFF4' }}>
                <div className="text-3xl font-black text-green-600">{wordsRead}</div>
                <div className="text-xs text-gray-500 mt-1">كلمة قُرئت</div>
              </div>
              <div className="text-center p-3 rounded-2xl" style={{ background: '#EFF6FF' }}>
                <div className="text-3xl font-black text-blue-600">{wordsPerMinute}</div>
                <div className="text-xs text-gray-500 mt-1">كلمة/دقيقة</div>
              </div>
              <div className="text-center p-3 rounded-2xl" style={{ background: '#FFFBEB' }}>
                <div className="text-3xl font-black text-amber-600">{duration}ث</div>
                <div className="text-xs text-gray-500 mt-1">المدة</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>النتيجة الكلية</span>
                <span className="font-black text-gray-800">{score}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full"
                  style={{ width: `${score}%`, background: barColor, transition: 'width 0.8s ease' }}
                />
              </div>
            </div>

            <p
              className="text-center text-sm font-bold"
              style={{ color: score >= 60 ? '#16a34a' : '#d97706' }}
            >
              {praise}
            </p>
          </div>
        </div>

        <button
          onClick={submit}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            boxShadow: '0 4px 18px rgba(22,163,74,0.35)',
          }}
        >
          حفظ النتيجة ✓
        </button>

        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← إغلاق
        </button>
      </div>
    )
  }

  // ── Playing screen ────────────────────────────────────────────
  const progressPct = Math.min(100, (wordsRead / totalWords) * 100)
  const isUrgent    = timeLeft <= 10
  const isWarning   = timeLeft <= 20 && !isUrgent
  const timerColor  = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#16a34a'
  const timerBg     = isUrgent ? '#FEE2E2' : isWarning ? '#FFFBEB' : '#F0FFF4'

  return (
    <div
      dir="rtl"
      className="flex flex-col items-center gap-4 px-4 pt-4 pb-6 min-h-full select-none"
      style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3C7)' }}
    >
      {/* Progress row */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-gray-600">
            {wordsRead} / {totalWords} كلمة
          </span>
          <span
            className="text-sm font-black px-2.5 py-1 rounded-lg tabular-nums"
            style={{
              color: timerColor,
              background: timerBg,
              animation: isUrgent ? 'timerPulse 0.8s ease-in-out infinite' : 'none',
            }}
          >
            {timeLeft} ث
          </span>
        </div>
        {/* Words-read progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(to left, #16a34a, #86efac)',
            }}
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="text-center">
        <h2 className="text-base font-black text-gray-700">طلاقة القراءة</h2>
        <p className="text-xs text-gray-500">{LEVEL_LABELS[difficulty]} — اقرأ الكلمة وأكِّد</p>
      </div>

      {/* Word card — key={flickerKey} remounts the element on each new word,
          restarting the CSS animation automatically */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        <div
          key={flickerKey}
          className="w-full flex items-center justify-center rounded-3xl"
          style={{
            background: 'white',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            padding: '2.5rem 1.5rem',
            minHeight: 200,
            animation: 'wordPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          <span
            className="font-black text-gray-800 leading-none text-center"
            style={{ fontSize: '5.5rem', direction: 'rtl', display: 'block' }}
          >
            {words[wordIdx]}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={handleReplay}
          className="py-4 rounded-2xl font-bold text-amber-700 transition-all active:scale-95 text-sm"
          style={{ flex: 1, background: '#FFFBEB', border: '2px solid #F59E0B' }}
        >
          ↺ مرة ثانية
        </button>
        <button
          onClick={handleConfirm}
          className="py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95"
          style={{
            flex: 2,
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
          }}
        >
          ✓ قرأتها
        </button>
      </div>

      <button
        onClick={handleFinishEarly}
        className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
      >
        ← إنهاء مبكر
      </button>

      {/* Keyframe animations */}
      <style>{`
        @keyframes wordPop {
          0%   { opacity: 0; transform: scale(0.78); }
          65%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1.00); }
        }
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}
