'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface PhysicalExerciseProps {
  id: string
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty: 1 | 2 | 3
}

interface PhysEntry {
  labelAr:   string
  emoji:     string
  descAr:    string
  steps:     string[]
  benefitAr: string
  baseSec:   number
}

const PHYS_DATA: Record<string, PhysEntry> = {
  'jumping-jacks': {
    labelAr: 'قفز النجمة',
    emoji:   '⭐',
    descAr:  'تمرين هوائي كلاسيكي يُنشّط الجسم ويرفع مستوى التركيز',
    steps: [
      'قف مستقيماً — القدمان معاً، الذراعان بجانب الجسم',
      'اقفز وافتح الساقين عرض الكتفين مع رفع الذراعين فوق الرأس',
      'اقفز مرة أخرى وأعد القدمين والذراعين للوضع الأصلي',
      'كرر بإيقاع منتظم — الهدف 3 مجموعات × 15 قفزة (راحة 30 ث بينها)',
      'ذكّر الطفل بالتنفس بانتظام طوال التمرين',
    ],
    benefitAr: 'يُطلق الدوبامين والنورإبينفرين فور الانتهاء — يُحسّن التركيز والذاكرة العاملة مباشرة. موثّق في بروتوكولات APA لـ ADHD.',
    baseSec: 5 * 60,
  },
  'obstacle-circuit': {
    labelAr: 'دائرة الحواجز',
    emoji:   '🏅',
    descAr:  'سلسلة حركات متسلسلة تتطلب التخطيط والتنفيذ وضبط الجسم',
    steps: [
      'رتّب 4-6 عقبات في الغرفة (كرسي، وسادة، خط شريط، قماش ملفوف)',
      'اشرح التسلسل الكامل للطفل واطلب منه إعادته شفهياً (ذاكرة عاملة)',
      'ابدأ التنفيذ: المشي على الخط، القفز فوق الوسادة، الدوران حول الكرسي',
      'كرر الدائرة 3 مرات — في كل جولة أضف عنصراً أو غيّر الاتجاه',
      'سجّل الوقت وشجّع الطفل على تحسين نتيجته في الجولة التالية',
    ],
    benefitAr: 'يُدرّب الذاكرة العاملة الحركية والتخطيط التنفيذي — محوران أساسيان في تأهيل ADHD. التسلسل المتغيّر يُقلّل الإشباع.',
    baseSec: 10 * 60,
  },
  'balance-walk': {
    labelAr: 'خط التوازن',
    emoji:   '⚖️',
    descAr:  'تمرين توازن يُنشّط المخيخ ويُحسّن التنسيق الحركي الدقيق',
    steps: [
      'ضع شريطاً لاصقاً على الأرض بطول 3-4 أمتار (أو استخدم خطاً طبيعياً)',
      'المرحلة 1: المشي للأمام على الخط مع مدّ الذراعين للجانبين',
      'المرحلة 2: المشي للخلف على نفس الخط (تحدٍّ أعلى)',
      'المرحلة 3: المشي بكتاب خفيف على الرأس (يُضيف تحدّي الوضعية)',
      'المرحلة 4: الوقوف على قدم واحدة في نهاية الخط لمدة 5 ثوانٍ × 3 مرات',
    ],
    benefitAr: 'تحفيز المخيخ والجهاز الدهليزي يُحسّن الانتباه — العلاقة بين التوازن والتركيز موثّقة لدى ADHD وطيف التوحد.',
    baseSec: 7 * 60,
  },
  'tiger-crawl': {
    labelAr: 'الزحف المتقاطع',
    emoji:   '🐆',
    descAr:  'زحف يُنشّط كلا نصفَي الدماغ ويُقوّي التنسيق اليدوي-الرجلي',
    steps: [
      'أفرد حصيرة أو استخدم أرضية ناعمة',
      'البداية: وضعية الزحف — اليدان والركبتان على الأرض',
      'تقدّم بشكل متقاطع: اليد اليمنى + الركبة اليسرى معاً، ثم العكس',
      'المسافة: 5 أمتار ذهاباً وإياباً — 3 جولات',
      'التحدّي الأعلى: ارفع البطن قليلاً عن الأرض (الزحف العسكري الكامل)',
    ],
    benefitAr: 'الحركة المتقاطعة تُعزز التواصل بين نصفَي الدماغ (التكامل بين نصفَي الكرة المخية) — مفيدة جداً لصعوبات التنسيق عند ADHD والتوحد.',
    baseSec: 6 * 60,
  },
  'ball-throw': {
    labelAr: 'رمي الكرة والتقاطها',
    emoji:   '⚽',
    descAr:  'نشاط يجمع التتبع البصري والتنسيق اليد-العين والانتباه المزدوج',
    steps: [
      'استخدم كرة خفيفة إسفنجية (مناسبة للداخل)',
      'المرحلة 1: تمرير الكرة بكلتا اليدين من مسافة 1.5 متر',
      'المرحلة 2: الرمي بيد واحدة والإمساك بيد واحدة',
      'المرحلة 3: أثناء الرمي انطق عدداً أو لوناً (مهمة مزدوجة)',
      'الهدف: 20 تمريرة متواصلة بلا سقوط — زِد المسافة تدريجياً',
    ],
    benefitAr: 'المهمة المزدوجة (حركة + معرفة) تُدرّب الانتباه المنقسم — أساسية في بروتوكولات APA لـ ADHD. التتبع البصري يُقوّي الانتباه الانتقائي.',
    baseSec: 8 * 60,
  },
  'stretching': {
    labelAr: 'تمارين التمدد',
    emoji:   '🧘',
    descAr:  'تمارين إطالة تُهدّئ الجهاز العصبي وتُعدّ الجسم للتعلم',
    steps: [
      'تمدد الرقبة: أمِل الرأس ببطء لليمين 10 ث، ثم اليسار 10 ث',
      'تمدد الكتفين: اشبك الأصابع وادفع الذراعين للأمام مع تقوس الظهر',
      'تمدد الجذع: يدان على الخصر، دوران بطيء 5 مرات لكل جهة',
      'تمدد الفخذين: الوقوف على قدم والإمساك بكاحل القدم الأخرى للخلف',
      'تمدد الربلة: الوقوف على أطراف الأصابع 10 ث × 3 مرات',
    ],
    benefitAr: 'يُنشّط الجهاز العصبي الباراسمبثاوي، يُخفّض الكورتيزول، ويُهيّئ الجسم للتركيز. مثالي لبداية الجلسة أو بعد فترة إثارة.',
    baseSec: 5 * 60,
  },
  'body-percussion': {
    labelAr: 'الإيقاع الجسدي',
    emoji:   '🥁',
    descAr:  'إيقاعات جسدية تُنشّط الدماغ وتُحسّن التزامن الحركي-السمعي',
    steps: [
      'إيقاع أساسي: تصفيق × 2 + ضرب على الركبتين × 2 — كرر 4 مرات',
      'إضافة تعقيد: تصفيق + ضرب فخذ أيمن + فخذ أيسر + تصفيق',
      'سرّع الإيقاع تدريجياً مع الحفاظ على الدقة والانتظام',
      'التحدّي المعرفي: انطق رقماً أو كلمة بعد كل إيقاع كامل',
      'الدور المنعكس: دع الطفل يخترع إيقاعه الخاص وعلّمه للأستاذ',
    ],
    benefitAr: 'الإيقاع الجسدي يُزامن نشاط المخيخ والعقدة القاعدية والفص الجبهي — ثلاثتها مناطق قصور في ADHD. التعلم الإيقاعي يُعزز الانتباه والتنفيذ.',
    baseSec: 7 * 60,
  },
}

const PHYS_IDS = new Set(Object.keys(PHYS_DATA))

export function isPhysicalExercise(id: string): boolean {
  return PHYS_IDS.has(id)
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function PhysicalExercise({ id, onComplete, onCancel, difficulty }: PhysicalExerciseProps) {
  const ex = PHYS_DATA[id]
  const totalSec = ex ? Math.round(ex.baseSec / (difficulty === 1 ? 1.4 : difficulty === 3 ? 0.75 : 1)) : 300

  const [secsLeft, setSecsLeft]   = useState(totalSec)
  const [running, setRunning]     = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)

  const elapsed = totalSec - secsLeft
  const pct     = Math.min(100, Math.round((elapsed / totalSec) * 100))
  const currentStep = running || completed
    ? Math.min(ex.steps.length - 1, Math.floor((elapsed / totalSec) * ex.steps.length))
    : -1

  useEffect(() => {
    if (!running || completed) return
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => s <= 1 ? 0 : s - 1)
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, completed])

  useEffect(() => {
    if (secsLeft === 0 && running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setRunning(false)
      setCompleted(true)
    }
  }, [secsLeft, running])

  if (!ex) return null

  function finish(score: number) {
    onComplete({
      exerciseType:    id,
      exerciseLabelAr: ex.labelAr,
      score,
      accuracy:        score,
      duration:        Math.max(5, elapsed),
      errors:          0,
      metadata:        { physical: true },
      completedAt:     new Date().toISOString(),
    })
  }

  return (
    <div className="bg-gray-800/90 rounded-3xl p-6 max-w-xl mx-auto border border-white/10" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <button
          onClick={onCancel}
          className="text-white/30 hover:text-white/60 transition-colors text-xs mt-1"
        >
          ✕ إلغاء
        </button>
        <div className="text-center flex-1 mx-4">
          <div className="text-5xl mb-2 leading-none">{ex.emoji}</div>
          <h2 className="text-white font-black text-xl leading-tight">{ex.labelAr}</h2>
          <p className="text-white/50 text-xs mt-1 leading-relaxed">{ex.descAr}</p>
        </div>
        <div className="text-left min-w-[56px]">
          <div className={`font-black text-xl ltr-num ${secsLeft <= 30 && running ? 'text-red-400' : 'text-cyan-400'}`}>
            {fmt(secsLeft)}
          </div>
          <div className="text-white/30 text-[9px] text-right">المتبقي</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-400 to-cyan-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps — active step glows as timer progresses */}
      <div className="space-y-2 mb-5">
        {ex.steps.map((step, i) => {
          const isActive = i === currentStep
          const isDone   = i < currentStep
          return (
            <div
              key={i}
              className={`flex gap-3 items-start rounded-2xl p-2.5 transition-all duration-500 ${
                isActive
                  ? 'bg-cyan-500/15 border border-cyan-500/30'
                  : isDone
                  ? 'opacity-50'
                  : 'opacity-70'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 transition-all ${
                isActive
                  ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                  : isDone
                  ? 'bg-emerald-600/60 text-emerald-300'
                  : 'bg-brand-600/40 text-brand-300'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <p className={`text-sm leading-relaxed ${isActive ? 'text-white font-bold' : 'text-white/70'}`}>
                {step}
              </p>
            </div>
          )
        })}
      </div>

      {/* Scientific basis */}
      <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-2xl p-3 mb-5">
        <p className="text-cyan-300/80 text-xs leading-relaxed">
          <span className="font-black text-cyan-200">الأساس العلمي: </span>
          {ex.benefitAr}
        </p>
      </div>

      {/* Actions */}
      {completed ? (
        <div>
          <p className="text-center text-emerald-400 font-black text-base mb-4">🎉 أحسنت! كيف كان أداء الطفل؟</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'ممتاز',      score: 95, cls: 'bg-emerald-600 hover:bg-emerald-500' },
              { label: 'جيد',        score: 75, cls: 'bg-amber-500 hover:bg-amber-400' },
              { label: 'يحتاج دعم', score: 50, cls: 'bg-orange-600 hover:bg-orange-500' },
            ].map(({ label, score, cls }) => (
              <button
                key={score}
                onClick={() => finish(score)}
                className={`${cls} text-white font-black py-3 rounded-2xl text-sm transition-all active:scale-95`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setRunning(r => !r)}
            className={`flex-1 font-black py-3 rounded-2xl text-sm transition-all active:scale-95 ${
              running
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            {running ? '⏸ إيقاف مؤقت' : elapsed > 0 ? '▶ استكمال' : '▶ ابدأ التمرين'}
          </button>
          <button
            onClick={() => finish(Math.max(50, pct))}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-5 rounded-2xl text-sm transition-all active:scale-95"
            title="إنهاء التمرين والتقييم الآن"
          >
            ✓ أنهيت
          </button>
        </div>
      )}
    </div>
  )
}
