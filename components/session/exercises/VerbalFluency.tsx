'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Category {
  nameAr: string
  icon: string
  example: string
  minAge?: number
}

const CATEGORIES_YOUNG: Category[] = [
  { nameAr: 'حيوانات', icon: '🐾', example: 'قطة، كلب، أسد...' },
  { nameAr: 'ألوان', icon: '🎨', example: 'أحمر، أزرق، أخضر...' },
  { nameAr: 'فواكه', icon: '🍎', example: 'تفاحة، موزة، برتقالة...' },
  { nameAr: 'أشياء في البيت', icon: '🏠', example: 'كرسي، طاولة، سرير...' },
  { nameAr: 'مهن', icon: '👨‍⚕️', example: 'طبيب، معلم، مهندس...' },
  { nameAr: 'مواصلات', icon: '🚗', example: 'سيارة، حافلة، طائرة...' },
]

const CATEGORIES_OLDER: Category[] = [
  ...CATEGORIES_YOUNG,
  { nameAr: 'أشياء تُشترى من السوق', icon: '🛒', example: 'خبز، لبن، ملابس...', minAge: 10 },
  { nameAr: 'أشياء في المدرسة', icon: '📚', example: 'كتاب، قلم، سبورة...', minAge: 8 },
  { nameAr: 'كلمات تبدأ بحرف (ب)', icon: '🔤', example: 'بيت، باب، بحر...', minAge: 9 },
  { nameAr: 'كلمات تبدأ بحرف (م)', icon: '🔤', example: 'ماء، مدرسة، محبة...', minAge: 9 },
  { nameAr: 'أسماء المدن', icon: '🌍', example: 'القاهرة، باريس، الرياض...', minAge: 12 },
  { nameAr: 'كلمات تبدأ بحرف (س)', icon: '🔤', example: 'سماء، سيارة، سعادة...', minAge: 9 },
]

function getBenchmark(age: number): { label: string; target: number } {
  if (age <= 7)  return { label: 'المتوقع للسن', target: 8  }
  if (age <= 10) return { label: 'المتوقع للسن', target: 12 }
  if (age <= 14) return { label: 'المتوقع للسن', target: 15 }
  return           { label: 'المتوقع للسن', target: 18 }
}

export default function VerbalFluency({ onComplete, onCancel, studentAge, difficulty = 2 }: Props) {
  const TIME_LIMIT = 60
  const isYoung = studentAge <= 9
  const categories = isYoung ? CATEGORIES_YOUNG : CATEGORIES_OLDER.filter(c => !c.minAge || c.minAge <= studentAge)
  const benchmark = getBenchmark(studentAge)

  const [setup, setSetup] = useState(true)
  const [category, setCategory] = useState<Category | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [count, setCount] = useState(0)
  const [words, setWords] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())
  const doneRef  = useRef(false)

  useEffect(() => {
    if (!running || timeLeft <= 0) return
    const id = setTimeout(() => {
      setTimeLeft(t => t <= 1 ? 0 : t - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [running, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && running && !doneRef.current) {
      doneRef.current = true
      setRunning(false)
      setDone(true)
    }
  }, [timeLeft, running])

  function startTask(cat: Category) {
    setCategory(cat)
    setSetup(false)
    setTimeLeft(TIME_LIMIT)
    setCount(0)
    setWords([])
    doneRef.current = false
    setRunning(true)
    startRef.current = Date.now()
  }

  function addWord() {
    const wordNum = count + 1
    setCount(wordNum)
    setWords(prev => [...prev, `كلمة ${wordNum}`])
  }

  function finish() {
    setRunning(false)
    setDone(true)
  }

  function submit() {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const pct = Math.min(100, Math.round((count / benchmark.target) * 100))
    onComplete({
      exerciseType: 'verbal-fluency',
      exerciseLabelAr: 'الطلاقة اللفظية',
      score: pct,
      accuracy: pct,
      duration: dur,
      errors: 0,
      metadata: {
        category: category?.nameAr,
        count,
        benchmark: benchmark.target,
        timeTaken: TIME_LIMIT - timeLeft,
      },
      completedAt: new Date().toISOString(),
    })
  }

  if (setup) {
    return (
      <div className="flex flex-col h-full overflow-hidden" dir="rtl">
        <div className="px-6 pt-5 pb-3">
          <div className="text-5xl text-center mb-2">🗣️</div>
          <h2 className="text-white font-black text-xl text-center">الطلاقة اللفظية</h2>
          <p className="text-white/50 text-sm text-center mt-1">
            60 ثانية — الأستاذ يضغط (+) لكل كلمة صحيحة ينطق بها الطالب
          </p>
          <div className="mt-2 p-3 bg-brand-600/20 border border-brand-400/30 rounded-xl">
            <p className="text-brand-300 text-xs text-center">
              {benchmark.label}: {benchmark.target} كلمة/دقيقة
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <p className="text-white/60 text-sm mb-3">اختر الفئة</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat.nameAr}
                onClick={() => startTask(cat)}
                className="p-4 bg-white/10 hover:bg-brand-600/40 border border-white/10 hover:border-brand-400/50 rounded-2xl text-right transition-all active:scale-95"
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-black text-white text-sm">{cat.nameAr}</div>
                <div className="text-white/40 text-xs mt-1">{cat.example}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-3">
          <button onClick={onCancel} className="w-full text-white/40 hover:text-white/70 text-sm transition-colors py-2">← إلغاء</button>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.min(100, Math.round((count / benchmark.target) * 100))
    const above = count >= benchmark.target
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6" dir="rtl">
        <div className="text-6xl">{above ? '🏆' : count >= benchmark.target * 0.7 ? '⭐' : '💪'}</div>
        <h2 className="text-white font-black text-2xl">انتهى الوقت!</h2>
        <div className="bg-white/5 rounded-2xl p-6 w-full max-w-xs text-center">
          <div className="text-5xl font-black text-brand-400 mb-1">{count}</div>
          <div className="text-white/60 text-sm">كلمة من فئة «{category?.nameAr}»</div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-white/40 text-xs">{benchmark.label}: {benchmark.target}</div>
            <div className={`font-black mt-1 ${above ? 'text-green-400' : 'text-yellow-400'}`}>
              {above ? `✓ تجاوز المعيار بـ ${count - benchmark.target} كلمة` : `${benchmark.target - count} كلمة تحت المعيار`}
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs bg-white/10 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: above ? '#22c55e' : 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
            }}
          />
        </div>
        <button
          onClick={submit}
          className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl transition-colors"
        >
          حفظ النتيجة
        </button>
      </div>
    )
  }

  const progressPct = ((TIME_LIMIT - timeLeft) / TIME_LIMIT) * 100
  const urgentColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#7C5CFC'

  return (
    <div className="flex flex-col items-center h-full px-6" dir="rtl">
      {/* Timer ring */}
      <div className="relative flex items-center justify-center mt-6 mb-4" style={{ width: 160, height: 160 }}>
        <svg className="absolute" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="80" cy="80" r="70" fill="none"
            stroke={urgentColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="text-center z-10">
          <div className="font-black text-4xl ltr-num" style={{ color: urgentColor }}>{timeLeft}</div>
          <div className="text-white/50 text-xs mt-1">ثانية</div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-white/50 text-sm">{category?.icon} فئة: {category?.nameAr}</div>
        <div className="text-white/30 text-xs mt-0.5">{category?.example}</div>
      </div>

      {/* Word count */}
      <div className="bg-white/5 rounded-2xl p-4 w-full max-w-xs text-center mb-6">
        <div className="text-6xl font-black text-brand-400">{count}</div>
        <div className="text-white/50 text-sm mt-1">كلمة</div>
        <div className="text-white/30 text-xs mt-1">الهدف: {benchmark.target}</div>
      </div>

      {/* Big tap button */}
      <button
        onClick={addWord}
        className="w-full max-w-xs py-8 rounded-3xl font-black text-4xl text-white transition-all active:scale-95 mb-4"
        style={{
          background: 'linear-gradient(135deg, #6B46F0, #9A7BFD)',
          boxShadow: '0 8px 24px rgba(124,92,252,0.4)',
        }}
      >
        +1
      </button>

      <button
        onClick={finish}
        className="text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        إنهاء مبكر
      </button>
    </div>
  )
}
