'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface Scenario {
  emoji: string
  situation: string
  choices: string[]
  correct: number
  explanations: string[]
}

const ALL_SCENARIOS: Scenario[] = [
  {
    emoji: '😤',
    situation: 'صديقك أخذ لعبتك دون إذن',
    choices: ['أكلمه بهدوء وأطلب لعبتي', 'أصرخ عليه وآخذها بالقوة', 'أبكي في الزاوية وأصمت'],
    correct: 0,
    explanations: ['✅ الحل الأمثل — التواصل الهادئ', '❌ العنف يزيد المشكلة', '❌ الصمت لا يحل المشكلة'],
  },
  {
    emoji: '😳',
    situation: 'أخطأت في إجابة أمام الفصل',
    choices: ['أقول: حسناً سأحاول مرة أخرى', 'أغضب من المعلم وأرفض الإجابة', 'أبكي وأخرج من الفصل'],
    correct: 0,
    explanations: ['✅ الخطأ طبيعي والمحاولة شجاعة', '❌ الغضب لا يساعد على التعلم', '❌ الهروب لا يحل المشكلة'],
  },
  {
    emoji: '😠',
    situation: 'زميل تجاوزك في الطابور',
    choices: ['أذكّره بلطف بمكانه في الطابور', 'أدفعه بقوة ليرجع', 'أتركه وأتضايق بصمت'],
    correct: 0,
    explanations: ['✅ التذكير اللطيف يحل المشكلة', '❌ الدفع يسبب مشكلة أكبر', '❌ كتمان الانزعاج ليس حلاً'],
  },
  {
    emoji: '😢',
    situation: 'كسرت شيئاً لصديقك بالخطأ',
    choices: ['أعتذر منه وأعرض المساعدة', 'أهرب وأتظاهر أنني لم أكسره', 'ألوم الشيء على أنه كان في مكان خطأ'],
    correct: 0,
    explanations: ['✅ الاعتذار يبني الثقة', '❌ الهروب يفسد الصداقة', '❌ إلقاء اللوم على الأشياء غير صادق'],
  },
  {
    emoji: '🎮',
    situation: 'تريد اللعب بدور صديقك في اللعبة',
    choices: ['أنتظر دوري وأقول: هل أستطيع اللعب بعدك؟', 'آخذ اللعبة منه مباشرة', 'أشتكي للمعلم فوراً'],
    correct: 0,
    explanations: ['✅ الانتظار واحترام الدور مهارة', '❌ أخذ الأشياء قسراً يسبب الصراع', '❌ الشكوى للكبار أولاً ليست الحل دائماً'],
  },
  {
    emoji: '😤',
    situation: 'لا تفهم الواجب وتشعر بالإحباط',
    choices: ['أطلب المساعدة من المعلم أو الأهل', 'أرمي الكتاب وأرفض الواجب', 'أبكي طول الليل'],
    correct: 0,
    explanations: ['✅ طلب المساعدة شجاعة وذكاء', '❌ الرفض يضاعف المشكلة', '❌ البكاء دون طلب مساعدة لا ينفع'],
  },
  {
    emoji: '🤝',
    situation: 'طفل جديد جاء للمدرسة ولا يعرف أحداً',
    choices: ['أذهب إليه وأعرّف بنفسي', 'أتجاهله لأنني لا أعرفه', 'أضحك على خجله مع أصدقائي'],
    correct: 0,
    explanations: ['✅ الترحيب بالآخرين مهارة اجتماعية رائعة', '❌ التجاهل يجعله يشعر بالوحدة', '❌ السخرية تسبب الأذى'],
  },
  {
    emoji: '😡',
    situation: 'خسرت في لعبة مع أصدقائك',
    choices: ['أهنئ الفائز وأقول: مبروك!', 'أصرخ وأقول اللعبة غير عادلة', 'أرفض اللعب معهم مرة أخرى'],
    correct: 0,
    explanations: ['✅ تقبّل الخسارة بشرف مهارة مهمة', '❌ الصراخ ينفّر الأصدقاء', '❌ الرفض يُبعد الأصدقاء'],
  },
  {
    emoji: '🙋',
    situation: 'المعلم يشرح ولديك سؤال مهم',
    choices: ['أرفع يدي وأنتظر دوري', 'أقاطع المعلم وأسأل مباشرة', 'أصمت وأحتفظ بالسؤال لوقت لاحق'],
    correct: 0,
    explanations: ['✅ رفع اليد احترام للنظام', '❌ المقاطعة تعطّل الدرس', '❌ إن كان السؤال مهماً يجب طرحه'],
  },
  {
    emoji: '😟',
    situation: 'شعرت بالخوف من شيء ما في المدرسة',
    choices: ['أخبر شخصاً أثق به بما أشعر', 'أتظاهر أن كل شيء بخير', 'أرفض الذهاب للمدرسة'],
    correct: 0,
    explanations: ['✅ التحدث عن مشاعرنا يساعدنا', '❌ كتمان المشاعر يزيد القلق', '❌ الهروب لا يحل الخوف'],
  },
]

function buildQueue(difficulty: 1|2|3, rng: () => number): Scenario[] {
  if (difficulty === 1) return ALL_SCENARIOS.slice(0, 5)
  if (difficulty === 2) return ALL_SCENARIOS.slice(0, 8)
  return shuffleWithRng(rng, ALL_SCENARIOS)
}

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'reveal'

export default function SocialProblemSolving({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const [queue] = useState<Scenario[]>(() => buildQueue(difficulty, rng))
  const [idx, setIdx] = useState(0)
  const [choiceStates, setChoiceStates] = useState<ChoiceState[]>(['idle', 'idle', 'idle'])
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const advance = useCallback((newCorrect: number, newWrong: number, nextIdx: number) => {
    if (nextIdx >= queue.length) {
      const total = queue.length
      const score = Math.round((newCorrect / total) * 100)
      onComplete({
        exerciseType: 'social-problem-solving',
        exerciseLabelAr: 'كيف أتعامل؟',
        score,
        accuracy: score,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        errors: newWrong,
        metadata: { correct: newCorrect, wrong: newWrong, total, difficulty },
        completedAt: new Date().toISOString(),
      })
      setDone(true)
    } else {
      setIdx(nextIdx)
      setChoiceStates(['idle', 'idle', 'idle'])
      setAnswered(false)
    }
  }, [queue.length, onComplete, difficulty])

  function handleChoice(choiceIdx: number) {
    if (answered) return
    const q = queue[idx]
    setAnswered(true)

    const states: ChoiceState[] = ['idle', 'idle', 'idle']

    if (choiceIdx === q.correct) {
      states[choiceIdx] = 'correct'
      setChoiceStates(states)
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      onProgress?.({ answered: idx + 1, total: queue.length, correct: newCorrect, errors: wrongCount, lastCorrect: true })
      timerRef.current = setTimeout(() => advance(newCorrect, wrongCount, idx + 1), 1800)
    } else {
      states[choiceIdx] = 'wrong'
      states[q.correct] = 'reveal'
      setChoiceStates(states)
      const newWrong = wrongCount + 1
      setWrongCount(newWrong)
      onProgress?.({ answered: idx + 1, total: queue.length, correct: correctCount, errors: newWrong, lastCorrect: false })
      timerRef.current = setTimeout(() => advance(correctCount, newWrong, idx + 1), 1800)
    }
  }

  if (done) {
    const total = queue.length
    const pct = Math.round((correctCount / total) * 100)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6" dir="rtl">
        <div className="text-6xl">🎉</div>
        <h2 className="text-white font-black text-2xl text-center">أحسنت في اتخاذ القرار الصواب</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full max-w-xs text-center">
          <div className="text-5xl font-black text-brand-400 mb-1">{pct}%</div>
          <div className="text-white/50 text-sm">
            {correctCount} صحيح من {total} موقف
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">{correctCount}</div>
            <div className="text-xs text-white/40 mt-0.5">إجابات صحيحة</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-black text-red-400">{wrongCount}</div>
            <div className="text-xs text-white/40 mt-0.5">إجابات خاطئة</div>
          </div>
        </div>
      </div>
    )
  }

  const q = queue[idx]
  const total = queue.length

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">{idx + 1} / {total}</span>
          <span className="text-green-400 text-xs font-bold">{correctCount} صحيح</span>
          <button
            onClick={onCancel}
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario card */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col items-center gap-3">
          <span style={{ fontSize: '5rem', lineHeight: 1, userSelect: 'none' }}>{q.emoji}</span>
          <p className="text-white font-black text-lg text-center leading-snug">{q.situation}</p>
          <p className="text-white/40 text-sm">ما أفضل تصرف؟</p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-3">
          {q.choices.map((choice, i) => {
            const state = choiceStates[i]
            const explanation = q.explanations[i]
            return (
              <div key={i} className="flex flex-col gap-1">
                <button
                  onClick={() => handleChoice(i)}
                  disabled={answered}
                  className={[
                    'w-full text-right px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 min-h-[52px] font-bold text-sm leading-snug',
                    state === 'correct'
                      ? 'border-green-500 bg-green-500/20 text-green-300 scale-[1.02] shadow-lg shadow-green-500/20'
                      : state === 'wrong'
                      ? 'border-red-500 bg-red-500/20 text-red-300 animate-[shake_0.3s_ease-in-out]'
                      : state === 'reveal'
                      ? 'border-green-500/60 bg-green-500/10 text-green-400/80'
                      : 'border-white/10 bg-white/10 text-white hover:bg-white/15 hover:border-white/25 active:scale-[0.98]',
                  ].join(' ')}
                >
                  {choice}
                </button>
                {/* Explanation badge — shown after answering */}
                {answered && (state === 'correct' || state === 'wrong' || state === 'reveal') && (
                  <div className={[
                    'px-3 py-1.5 rounded-xl text-xs font-bold leading-snug',
                    state === 'correct'
                      ? 'bg-green-500/10 text-green-400'
                      : state === 'wrong'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/8 text-green-500/70',
                  ].join(' ')}>
                    {explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
