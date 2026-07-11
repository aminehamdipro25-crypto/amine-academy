'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void  // live per-answer feedback to the specialist
}

interface Choice {
  text: string
  type: 'assertive' | 'passive' | 'aggressive' | 'prosocial'
  feedback: string
}

interface Scenario {
  id: string
  situation: string
  icon: string
  question: string
  choices: Choice[]
  discussionPrompt: string
  minAge?: number
  maxAge?: number
}

const TYPE_LABELS: Record<Choice['type'], { label: string; color: string; bg: string }> = {
  assertive:  { label: 'حازم ومناسب',   color: '#22c55e', bg: '#14532d33' },
  passive:    { label: 'سلبي',           color: '#f59e0b', bg: '#78350f33' },
  aggressive: { label: 'عدواني',         color: '#ef4444', bg: '#7f1d1d33' },
  prosocial:  { label: 'إيجابي اجتماعي', color: '#3b82f6', bg: '#1e3a5f33' },
}

const SCENARIOS: Scenario[] = [
  // Young (5-10)
  {
    id: 'toy-sharing',
    icon: '🧸',
    minAge: 5, maxAge: 10,
    situation: 'أنت تلعب بلعبتك المفضلة، وصديقك يريد أن يأخذها منك بدون أن يطلب.',
    question: 'ماذا تفعل؟',
    choices: [
      { text: 'أقول له: "هذه لعبتي، عندما أنتهي أعطيك إياها"', type: 'assertive', feedback: 'ممتاز! تعبّر عن حقك بأدب وتعرض المشاركة.' },
      { text: 'أتركه يأخذها وأحزن', type: 'passive', feedback: 'أنت تنازلت عن حقك — يمكنك التحدث بهدوء.' },
      { text: 'أصرخ عليه وأبكي', type: 'aggressive', feedback: 'نفهم الشعور، لكن الكلام الهادئ أفضل.' },
      { text: 'أقترح نلعب معاً', type: 'prosocial', feedback: 'رائع! المشاركة تجعل الجميع سعيداً.' },
    ],
    discussionPrompt: 'ناقشا: كيف نطلب ما نريد بأدب؟ ما الفرق بين "خذ" و"هل يمكنني أن آخذ"؟',
  },
  {
    id: 'losing-game',
    icon: '😢',
    minAge: 5, maxAge: 10,
    situation: 'تلعب لعبة مع صديق وخسرت اللعبة.',
    question: 'ماذا تفعل؟',
    choices: [
      { text: 'أقول: "حسناً، لعبة جيدة! هل نلعب مرة أخرى؟"', type: 'assertive', feedback: 'ممتاز! تقبّل الخسارة بروح رياضية رائعة.' },
      { text: 'أصمت وأشعر بالحزن طوال اليوم', type: 'passive', feedback: 'الحزن قليلاً طبيعي، لكن لا تدعه يستمر طويلاً.' },
      { text: 'أرمي اللعبة وأصرخ "هذا غير عادل!"', type: 'aggressive', feedback: 'الغضب مفهوم لكنه يضر علاقتك بصديقك.' },
      { text: 'أهنّئ صديقي على فوزه وأطلب أن يعلّمني كيف فعل ذلك', type: 'prosocial', feedback: 'رائع! التعلّم من الآخرين علامة نضج.' },
    ],
    discussionPrompt: 'كيف نتعامل مع الخسارة دون أن نخسر صداقاتنا؟',
  },
  {
    id: 'new-kid',
    icon: '🆕',
    minAge: 5, maxAge: 10,
    situation: 'طالب جديد انضمّ للفصل ويبدو وحيداً في الفسحة.',
    question: 'ماذا تفعل؟',
    choices: [
      { text: 'أذهب وأقول: "مرحباً، هل تريد اللعب معنا؟"', type: 'assertive', feedback: 'مبادرة جميلة! الترحيب يصنع صداقات.' },
      { text: 'لا أفعل شيئاً، أنا أيضاً خجول', type: 'passive', feedback: 'الخجل طبيعي، لكن خطوة صغيرة قد تفتح صداقة جديدة.' },
      { text: 'أتجاهله وأقول لأصدقائي ألا يلعبوا معه', type: 'aggressive', feedback: 'هذا يجرح شخصاً يحتاج للترحيب.' },
      { text: 'أعرّفه على أصدقائي وأشرح له قوانين اللعبة', type: 'prosocial', feedback: 'ممتاز! هذا بالضبط ما يحتاجه الطالب الجديد.' },
    ],
    discussionPrompt: 'كيف نشعر في أول يوم في مكان جديد؟ كيف نجعل الآخرين يشعرون بالترحيب؟',
  },
  {
    id: 'exclude',
    icon: '😔',
    minAge: 5, maxAge: 10,
    situation: 'أثناء اللعب، أحد الأطفال لا يريدك أن تشارك في اللعبة وقال: "لا، لا تأت معنا".',
    question: 'ماذا تشعر وماذا تفعل؟',
    choices: [
      { text: 'أقول: "أريد اللعب معكم، هل يمكنني الانضمام؟"', type: 'assertive', feedback: 'جيد جداً! الطلب الواضح يفتح الأبواب.' },
      { text: 'أذهب وأجلس وحيداً', type: 'passive', feedback: 'حزين! يمكنك تجربة الطلب أو إيجاد لعبة أخرى.' },
      { text: 'أدفعه أو أشتمه', type: 'aggressive', feedback: 'هذا يسبب مشاكل أكثر. ما البديل الهادئ؟' },
      { text: 'أذهب لأجد أصدقاء آخرين أو نشاطاً آخر', type: 'prosocial', feedback: 'خيار ذكي! دائماً هناك بدائل إيجابية.' },
    ],
    discussionPrompt: 'كيف نتعامل مع الرفض؟ هل الرفض يعني أنك شخص سيئ؟',
  },
  // Tweens (11-14)
  {
    id: 'peer-pressure',
    icon: '😰',
    minAge: 11, maxAge: 14,
    situation: 'أصدقاؤك يضغطون عليك لتفعل شيئاً لا تريده — مثل الغياب عن الدرس أو إيذاء طالب آخر.',
    question: 'ما ردّ فعلك؟',
    choices: [
      { text: '"لا، هذا ليس صحيحاً وأنا لن أفعله" — بثقة وبدون اعتذار', type: 'assertive', feedback: 'ممتاز! الرفض الواضح والمحترم يحمي حدودك.' },
      { text: 'أفعل ما يقولون حتى لا أكون وحيداً', type: 'passive', feedback: 'الخوف من الوحدة شعور طبيعي، لكن الأصدقاء الحقيقيون لا يجبرونك.' },
      { text: 'أتشاجر معهم', type: 'aggressive', feedback: 'الغضب مفهوم، لكن هناك طريقة أكثر فعالية.' },
      { text: 'أقترح بديلاً ممتعاً للجميع', type: 'prosocial', feedback: 'قيادة إيجابية! تحويل الموقف بذكاء.' },
    ],
    discussionPrompt: 'ما معنى الضغط من المجموعة؟ كيف نفرق بين الصديق الحقيقي وضغط المجموعة؟',
  },
  {
    id: 'conflict-friend',
    icon: '😤',
    minAge: 11, maxAge: 14,
    situation: 'صديقك قال عنك كلاماً سيئاً أمام الآخرين وأحسست بالإهانة.',
    question: 'ما أول خطواتك؟',
    choices: [
      { text: 'أتحدث معه بهدوء على انفراد: "أحسست بالأذى حين قلت ذلك"', type: 'assertive', feedback: 'ناضج جداً! التحدث المباشر والهادئ يحل الكثير.' },
      { text: 'أتجاهل الأمر وأتظاهر بأن شيئاً لم يحدث', type: 'passive', feedback: 'الكتم لا يحل المشكلة وقد يراكم الأذى.' },
      { text: 'أرد عليه بكلام سيئ أمام نفس الناس', type: 'aggressive', feedback: 'الانتقام يضر العلاقة أكثر. ما البديل؟' },
      { text: 'أعطيه وقتاً ثم أتحدث معه لفهم لماذا قال ذلك', type: 'prosocial', feedback: 'حكيم! التفهم يفتح أبواب الحل.' },
    ],
    discussionPrompt: 'كيف نتحدث عن مشاعرنا دون اتهام؟ ما الفرق بين "أنت أهنتني" و"أحسست بالأذى"؟',
  },
  {
    id: 'group-project',
    icon: '📚',
    minAge: 11, maxAge: 14,
    situation: 'تعمل في مشروع جماعي، وأحد الزملاء لا يقوم بأي عمل ويترك كل شيء عليك.',
    question: 'كيف تتصرف؟',
    choices: [
      { text: 'أتحدث معه بوضوح: "أحتاج مساعدتك في الجزء الخاص بك حتى ننجح معاً"', type: 'assertive', feedback: 'تواصل واضح ومباشر! هذا يحل المشكلة دون خصام.' },
      { text: 'أقوم بكل العمل بصمت دون أن أقول شيئاً', type: 'passive', feedback: 'هذا يتعبك ولا يعلّم زميلك المسؤولية.' },
      { text: 'أشتكي عليه أمام الجميع وأحرجه', type: 'aggressive', feedback: 'الإحراج العلني يخلق عداوة بلا داعٍ.' },
      { text: 'أقترح تقسيم العمل بوضوح من جديد مع الأستاذ', type: 'prosocial', feedback: 'حل عملي ومنصف للجميع!' },
    ],
    discussionPrompt: 'كيف نوزّع المسؤوليات بعدل في العمل الجماعي؟',
  },
  {
    id: 'online-comment',
    icon: '📱',
    minAge: 11, maxAge: 14,
    situation: 'شخص كتب تعليقاً مسيئاً عنك في مجموعة الفصل على الإنترنت.',
    question: 'ما ردّة فعلك؟',
    choices: [
      { text: 'أرد بهدوء: "هذا التعليق غير مناسب، أرجو حذفه" وأبلغ المعلم إذا تكرر', type: 'assertive', feedback: 'تعامل حازم وآمن مع المواقف الرقمية.' },
      { text: 'أتجاهل الأمر وأشعر بالأذى وحدي طويلاً', type: 'passive', feedback: 'من المهم ألا تبقى وحدك مع هذا الشعور — تحدث مع شخص تثق به.' },
      { text: 'أرد بتعليق مسيء أسوأ', type: 'aggressive', feedback: 'هذا يصعّد الموقف ويزيد المشكلة.' },
      { text: 'أحفظ لقطة شاشة وأطلب مساعدة أحد الكبار الموثوقين', type: 'prosocial', feedback: 'خطوة ذكية وآمنة جداً!' },
    ],
    discussionPrompt: 'ما قواعد الأمان عند التعامل مع المضايقات على الإنترنت؟',
  },
  // Teens/Adults (15+)
  {
    id: 'workplace-feedback',
    icon: '💼',
    minAge: 15,
    situation: 'مشرفك يمنحك ملاحظات نقدية عن عملك، وبعضها تجده غير دقيق أو ظالم.',
    question: 'كيف تتعامل مع هذا الموقف؟',
    choices: [
      { text: 'أستمع كاملاً، ثم أشرح وجهة نظري بحجج واضحة واحترام', type: 'assertive', feedback: 'مثالي! الاستماع الكامل ثم الحوار الهادئ يبني المصداقية.' },
      { text: 'أوافق على كل شيء دون أن أتكلم', type: 'passive', feedback: 'قد يُفقدك الفرصة لتصحيح سوء الفهم.' },
      { text: 'أرد بانفعال وأقول إن النقد ظالم', type: 'aggressive', feedback: 'الانفعال في العمل يُضر صورتك حتى لو كنت محقاً.' },
      { text: 'أطلب اجتماعاً لاحقاً لمناقشة التفاصيل بهدوء', type: 'prosocial', feedback: 'ذكي! اختيار الوقت المناسب يحسن جودة الحوار.' },
    ],
    discussionPrompt: 'ما الفرق بين الدفاع عن النفس والانفعال؟ كيف نطلب الاستئذان في التعبير عن رأينا؟',
  },
  {
    id: 'social-anxiety',
    icon: '😟',
    minAge: 15,
    situation: 'دُعيت لحفل أو تجمع اجتماعي وتشعر بقلق شديد من التفاعل مع الناس.',
    question: 'ما الاستراتيجية الأفضل لك؟',
    choices: [
      { text: 'أحضر وأضع لنفسي هدفاً صغيراً: التحدث مع شخصين فقط', type: 'assertive', feedback: 'استراتيجية ذكية! الأهداف الصغيرة تبني الثقة تدريجياً.' },
      { text: 'أعتذر دائماً وأتجنب كل التجمعات', type: 'passive', feedback: 'التجنب يعزز القلق على المدى البعيد.' },
      { text: 'أذهب مضطراً وأبقى في الزاوية طوال الوقت ثم أنتقد نفسي لاحقاً', type: 'aggressive', feedback: 'الانتقاد الذاتي مؤلم. ما الذي يمكنك تغييره في الخطة؟' },
      { text: 'أذهب مع شخص أثق به يساعدني على الاندماج', type: 'prosocial', feedback: 'رائع! طلب الدعم ليس ضعفاً بل حكمة.' },
    ],
    discussionPrompt: 'ما الفرق بين القلق الاجتماعي الطبيعي والقلق الذي يحتاج تدخلاً؟ ما تقنياتك الشخصية لإدارته؟',
  },
  {
    id: 'deadline-stress',
    icon: '⏰',
    minAge: 15,
    situation: 'لديك عدة مواعيد نهائية في نفس الأسبوع وتشعر بضغط كبير.',
    question: 'كيف تخطط لمواجهة الموقف؟',
    choices: [
      { text: 'أرتب المهام حسب الأولوية وأطلب تمديداً إذا احتجت بأدب ووضوح', type: 'assertive', feedback: 'تخطيط وتواصل استباقي — هذا يقلل التوتر فعلياً.' },
      { text: 'أتجاهل كل شيء حتى آخر لحظة', type: 'passive', feedback: 'التسويف يزيد الضغط لاحقاً بدلاً من تقليله.' },
      { text: 'ألوم الآخرين على ضغط الوقت وأنفعل على من حولي', type: 'aggressive', feedback: 'اللوم لا يحل المشكلة ويضر علاقاتك.' },
      { text: 'أطلب مساعدة من زميل أو أستاذ لتنظيم وقتي', type: 'prosocial', feedback: 'طلب الدعم عند الحاجة علامة نضج، لا ضعف.' },
    ],
    discussionPrompt: 'ما استراتيجياتك لتنظيم الوقت تحت الضغط؟',
  },
  {
    id: 'disagreement-family',
    icon: '🏠',
    minAge: 15,
    situation: 'تختلف مع أحد أفراد العائلة حول قرار يخصك (مثل اختيار دراسي).',
    question: 'كيف تعبّر عن رأيك؟',
    choices: [
      { text: 'أشرح وجهة نظري بهدوء مع أسباب واضحة، وأستمع لرأيهم أيضاً', type: 'assertive', feedback: 'حوار متوازن يحترم الطرفين — هذا الأنضج.' },
      { text: 'أوافق على رأيهم رغم أنني غير مقتنع تماماً', type: 'passive', feedback: 'قد تشعر بالندم لاحقاً إن لم تعبّر عن رأيك الحقيقي.' },
      { text: 'أرفض الاستماع وأغلق الباب على الحوار بانفعال', type: 'aggressive', feedback: 'إغلاق الحوار يمنع الوصول لحل وسط.' },
      { text: 'أقترح أن نفكر في الأمر بضعة أيام ثم نتحدث مجدداً', type: 'prosocial', feedback: 'إعطاء وقت للتفكير يخفف التوتر ويحسّن القرار.' },
    ],
    discussionPrompt: 'كيف نوازن بين احترام رأي العائلة والتعبير عن رأينا الخاص؟',
  },
]

export default function SocialScenarios({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const totalScenariosTarget = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4

  const available = SCENARIOS.filter(s =>
    (!s.minAge || s.minAge <= studentAge) &&
    (!s.maxAge || s.maxAge >= studentAge)
  )

  const [queue] = useState<Scenario[]>(() => {
    const shuffled = shuffleWithRng(rng, available)
    return shuffled.slice(0, Math.min(totalScenariosTarget, shuffled.length))
  })

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<Choice | null>(null)
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [poorChoices, setPoorChoices] = useState(0)
  const startRef = useRef(Date.now())
  const doneRef = useRef(false)

  const scenario = queue[idx]
  const totalScenarios = queue.length

  function pick(choice: Choice) {
    if (selected) return
    setSelected(choice)
    const isGood = choice.type === 'assertive' || choice.type === 'prosocial'
    const score = isGood ? 100 : choice.type === 'passive' ? 50 : 25
    setScores(prev => [...prev, score])
    const ne = poorChoices + (isGood ? 0 : 1)
    if (!isGood) setPoorChoices(ne)
    onProgress?.({ answered: idx + 1, total: totalScenarios, correct: (idx + 1) - ne, errors: ne, lastCorrect: isGood })
  }

  function next() {
    setSelected(null)
    setShowDiscussion(false)
    if (idx + 1 >= totalScenarios) {
      if (doneRef.current) return // guard double-tap on the final "إنهاء وحفظ"
      doneRef.current = true
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      const dur = Math.round((Date.now() - startRef.current) / 1000)
      onComplete({
        exerciseType: 'social-scenarios',
        exerciseLabelAr: 'المواقف الاجتماعية',
        score: avg,
        accuracy: avg,
        duration: dur,
        errors: poorChoices,
        metadata: { scores, totalScenarios, difficulty },
        completedAt: new Date().toISOString(),
      })
    } else {
      setIdx(i => i + 1)
    }
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6" dir="rtl">
        <div className="text-5xl">😊</div>
        <p className="text-white/60 text-center">لا توجد سيناريوهات متاحة لهذا العمر</p>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm">← رجوع</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>موقف {idx + 1} من {totalScenarios}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${(idx / totalScenarios) * 100}%` }} />
        </div>
      </div>

      {/* Scenario */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="bg-white/5 rounded-2xl p-5 mb-4">
          <div className="text-4xl text-center mb-3">{scenario.icon}</div>
          <p className="text-white/80 text-sm leading-relaxed mb-3">{scenario.situation}</p>
          <p className="text-white font-black">{scenario.question}</p>
        </div>

        {/* Choices */}
        <div className="space-y-2">
          {scenario.choices.map((c, i) => {
            const isSelected = selected?.text === c.text
            const typeCfg = TYPE_LABELS[c.type]
            const showResult = selected !== null
            return (
              <button
                key={i}
                onClick={() => pick(c)}
                disabled={!!selected}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-brand-400 bg-brand-600/30'
                    : showResult && (c.type === 'assertive' || c.type === 'prosocial')
                    ? 'border-green-500/50 bg-green-900/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                } ${selected ? 'cursor-default' : 'active:scale-98'}`}
              >
                <p className="text-white text-sm font-bold">{c.text}</p>
                {isSelected && (
                  <div className="mt-2">
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: typeCfg.bg, color: typeCfg.color }}
                    >
                      {typeCfg.label}
                    </span>
                    <p className="text-white/60 text-xs mt-2">{c.feedback}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Discussion */}
        {selected && (
          <div className="mt-4">
            {!showDiscussion ? (
              <button
                onClick={() => setShowDiscussion(true)}
                className="w-full py-3 rounded-xl border border-dashed border-brand-400/50 text-brand-300 text-sm font-bold hover:bg-brand-600/20 transition-colors"
              >
                💬 سؤال للنقاش
              </button>
            ) : (
              <div className="bg-brand-600/20 border border-brand-400/30 rounded-xl p-4">
                <p className="text-brand-200 text-xs font-black mb-1">للأستاذ — سؤال نقاش:</p>
                <p className="text-white/80 text-sm">{scenario.discussionPrompt}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selected && (
        <div className="px-6 py-3">
          <button
            onClick={next}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl transition-colors"
          >
            {idx + 1 >= totalScenarios ? 'إنهاء وحفظ' : 'الموقف التالي ←'}
          </button>
        </div>
      )}

      {!selected && (
        <div className="px-6 py-3">
          <button onClick={onCancel} className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors">← إلغاء</button>
        </div>
      )}
    </div>
  )
}
