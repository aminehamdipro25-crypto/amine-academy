'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Goal {
  text: string
  achieved: boolean | null
}

const YOUNG_SUGGESTIONS = [
  'أجلس بهدوء خلال الجلسة',
  'أستمع للأستاذ دون مقاطعة',
  'أكمل التمرين بالكامل',
  'أعبّر عن مشاعري بكلمات',
  'أطلب المساعدة بأدب',
  'أنتظر دوري للكلام',
]

const OLDER_SUGGESTIONS = [
  'أبقى منتبهاً طوال الجلسة',
  'أشارك بإجابات دون خوف من الخطأ',
  'أطبّق استراتيجية واحدة جديدة اليوم',
  'أتحدث عن موقف صعب واجهته',
  'أتدرب على مهارة اجتماعية معينة',
  'أحدد هدفاً أعمل عليه للأسبوع القادم',
  'أستخدم أدوات الضبط الذاتي عند الشعور بالتوتر',
  'أسجّل ملاحظة عن نفسي أثناء الجلسة',
]

export default function BehaviorContract({ onComplete, onCancel, studentAge }: Props) {
  const isYoung = studentAge <= 12
  const suggestions = isYoung ? YOUNG_SUGGESTIONS : OLDER_SUGGESTIONS

  const [phase, setPhase] = useState<'setup' | 'session' | 'review'>('setup')
  const [goals, setGoals] = useState<Goal[]>([
    { text: '', achieved: null },
    { text: '', achieved: null },
    { text: '', achieved: null },
  ])
  const [studentName, setStudentName] = useState('')
  const startRef = useRef(Date.now())

  const filledGoals = goals.filter(g => g.text.trim())

  function updateGoalText(i: number, text: string) {
    setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, text } : g))
  }

  function setSuggestion(i: number, text: string) {
    updateGoalText(i, text)
  }

  function startSession() {
    if (filledGoals.length === 0) return
    setPhase('session')
    startRef.current = Date.now()
  }

  function goToReview() {
    setPhase('review')
  }

  function markAchieved(i: number, achieved: boolean) {
    setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, achieved } : g))
  }

  function finish() {
    const dur = Math.round((Date.now() - startRef.current) / 1000)
    const achieved = goals.filter(g => g.text && g.achieved === true).length
    const total = filledGoals.length
    const score = total > 0 ? Math.round((achieved / total) * 100) : 0

    onComplete({
      exerciseType: 'behavior-contract',
      exerciseLabelAr: 'عقد السلوك',
      score,
      accuracy: score,
      duration: dur,
      errors: 0,
      metadata: {
        studentName,
        goals: goals.filter(g => g.text),
        achieved,
        total,
      },
      completedAt: new Date().toISOString(),
    })
  }

  if (phase === 'setup') {
    return (
      <div className="flex flex-col h-full overflow-hidden" dir="rtl">
        <div className="px-6 pt-5 pb-3 text-center">
          <div className="text-5xl mb-2">📋</div>
          <h2 className="text-white font-black text-xl">عقد الجلسة</h2>
          <p className="text-white/50 text-sm mt-1">
            الطالب والمعالج يتفقان على {isYoung ? '3 أهداف' : '3 التزامات'} للجلسة
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-white/60 text-xs font-bold block mb-1">اسم الطالب (اختياري)</label>
            <input
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-brand-400"
            />
          </div>

          {/* Goals */}
          {goals.map((goal, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4">
              <label className="text-white/60 text-xs font-bold mb-2 block">
                {isYoung ? `هدف ${i + 1} 🎯` : `التزام ${i + 1} ✍️`}
              </label>
              <input
                value={goal.text}
                onChange={e => updateGoalText(i, e.target.value)}
                placeholder={isYoung ? 'مثال: أجلس بهدوء...' : 'مثال: أطبّق استراتيجية...'}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-brand-400 mb-3"
              />
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(i * 2, i * 2 + 3).map(s => (
                  <button
                    key={s}
                    onClick={() => setSuggestion(i, s)}
                    className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-brand-600/40 text-white/60 hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 space-y-2">
          <button
            onClick={startSession}
            disabled={filledGoals.length === 0}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            نبدأ الجلسة! 🚀
          </button>
          <button onClick={onCancel} className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors">← إلغاء</button>
        </div>
      </div>
    )
  }

  if (phase === 'session') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6" dir="rtl">
        <div className="text-6xl">🎯</div>
        <h2 className="text-white font-black text-2xl text-center">الجلسة جارية</h2>

        {studentName && (
          <p className="text-brand-300 font-bold">مرحباً {studentName}!</p>
        )}

        <div className="w-full max-w-xs bg-white/5 rounded-2xl p-5 space-y-3">
          <p className="text-white/60 text-xs font-bold mb-2">أهداف هذه الجلسة:</p>
          {goals.filter(g => g.text).map((goal, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                style={{ background: 'rgba(124,92,252,0.3)', color: '#9A7BFD' }}>
                {i + 1}
              </div>
              <p className="text-white text-sm">{goal.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={goToReview}
          className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          تقييم الأهداف ✓
        </button>
      </div>
    )
  }

  // Review phase
  const reviewedAll = goals.filter(g => g.text).every(g => g.achieved !== null)
  const achievedCount = goals.filter(g => g.achieved === true).length
  const totalCount = filledGoals.length

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      <div className="px-6 pt-5 pb-3 text-center">
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-white font-black text-xl">تقييم أهداف الجلسة</h2>
        <p className="text-white/50 text-sm mt-1">هل حقق الطالب كل هدف؟</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
        {goals.filter(g => g.text).map((goal, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-4">
            <p className="text-white text-sm font-bold mb-3">{i + 1}. {goal.text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => markAchieved(i, true)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  goal.achieved === true
                    ? 'bg-green-600 text-white ring-2 ring-green-400'
                    : 'bg-white/10 text-white/60 hover:bg-green-900/40 hover:text-green-300'
                }`}
              >
                ✓ تحقق
              </button>
              <button
                onClick={() => markAchieved(i, false)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  goal.achieved === false
                    ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                    : 'bg-white/10 text-white/60 hover:bg-orange-900/40 hover:text-orange-300'
                }`}
              >
                ○ لم يتحقق
              </button>
            </div>
          </div>
        ))}

        {reviewedAll && (
          <div className={`rounded-2xl p-5 text-center ${achievedCount === totalCount ? 'bg-green-900/30 border border-green-500/30' : 'bg-brand-600/20 border border-brand-400/30'}`}>
            <div className="text-4xl mb-2">
              {achievedCount === totalCount ? '🏆' : achievedCount > 0 ? '⭐' : '💪'}
            </div>
            <div className="text-white font-black text-2xl">{achievedCount} / {totalCount}</div>
            <div className="text-white/60 text-sm mt-1">
              {achievedCount === totalCount
                ? 'ممتاز! حققت كل الأهداف!'
                : achievedCount > 0
                ? 'جيد! نعمل على الباقي في الجلسة القادمة'
                : 'لا بأس — كل جلسة تعلّم'}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3">
        <button
          onClick={finish}
          disabled={!reviewedAll}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-colors"
        >
          حفظ وإنهاء
        </button>
      </div>
    </div>
  )
}
