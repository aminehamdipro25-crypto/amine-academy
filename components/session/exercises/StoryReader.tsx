'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { speakArabic } from '@/lib/speech'
import type { ExerciseResult } from '@/lib/types'

interface StoryPage {
  emoji: string
  bg: string
  text: string
}
interface Question {
  q: string
  choices: string[]
  correct: number
}
interface Story {
  id: string
  title: string
  icon: string
  diff: 1 | 2 | 3
  pages: StoryPage[]
  questions: Question[]
}

const STORIES: Story[] = [
  // ── D1: 3 pages ────────────────────────────────────────────────────────────
  {
    id: 'cat-ball', title: 'القطة والكرة', icon: '🐱', diff: 1,
    pages: [
      { emoji: '🐱🔵', bg: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)', text: 'كانت هناك قطة صغيرة اسمها لولو. كانت تلعب بكرة زرقاء كبيرة في الحديقة.' },
      { emoji: '🐱🌳', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'قفزت الكرة بعيداً وسقطت خلف الشجرة الكبيرة. لم تستطع لولو أن تجدها وبدأت تبكي.' },
      { emoji: '🐶🐱🔵', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'جاء الكلب بسبوس وساعد لولو في إيجاد الكرة. فرحا معاً وصارا صديقين.' },
    ],
    questions: [
      { q: 'ما اسم القطة في القصة؟', choices: ['ببسي', 'لولو', 'سوسو'], correct: 1 },
      { q: 'أين سقطت الكرة؟', choices: ['في الماء', 'خلف الشجرة', 'على السطح'], correct: 1 },
      { q: 'من ساعد لولو في إيجاد الكرة؟', choices: ['طفلة صغيرة', 'قطة أخرى', 'الكلب بسبوس'], correct: 2 },
    ],
  },
  {
    id: 'rainy-day', title: 'يوم المطر', icon: '🌧️', diff: 1,
    pages: [
      { emoji: '☁️🌧️', bg: 'linear-gradient(135deg,#E0E7FF,#EEF2FF)', text: 'في الصباح نزل المطر الجميل. قال عمر بصوت عالٍ: أريد أن ألعب بالمطر!' },
      { emoji: '👦☂️', bg: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', text: 'أعطته أمه المظلة الصفراء ومعطف المطر الأزرق. خرج عمر من الباب مبتسماً.' },
      { emoji: '👦💧😊', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'لعب عمر في البرك الصغيرة وبلّلت قدميه. كان قلبه مليئاً بالفرح والسعادة.' },
    ],
    questions: [
      { q: 'من أراد اللعب بالمطر؟', choices: ['سارة', 'عمر', 'أحمد'], correct: 1 },
      { q: 'ما لون المظلة التي أخذها عمر؟', choices: ['الحمراء', 'الزرقاء', 'الصفراء'], correct: 2 },
      { q: 'كيف شعر عمر في نهاية القصة؟', choices: ['حزيناً', 'خائفاً', 'سعيداً'], correct: 2 },
    ],
  },
  {
    id: 'cake-day', title: 'الكعكة الجميلة', icon: '🎂', diff: 1,
    pages: [
      { emoji: '👩🧁', bg: 'linear-gradient(135deg,#FCE7F3,#FDF2F8)', text: 'قررت سلمى أن تصنع كعكة لعيد ميلاد أختها. جلبت الطحين والسكر والبيض من المطبخ.' },
      { emoji: '🥣✋', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'خلطت سلمى كل المكونات ببطء وعناية. ثم وضعت الكعكة في الفرن بعناية.' },
      { emoji: '🎂❤️', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'خرجت الكعكة ذهبية اللون ولذيذة الرائحة. قالت أختها: شكراً يا سلمى، أنتِ الأفضل!' },
    ],
    questions: [
      { q: 'لماذا صنعت سلمى الكعكة؟', choices: ['للبيع', 'لعيد ميلاد أختها', 'للمدرسة'], correct: 1 },
      { q: 'أين وضعت سلمى الكعكة؟', choices: ['في الثلاجة', 'على الطاولة', 'في الفرن'], correct: 2 },
      { q: 'كيف كانت الكعكة؟', choices: ['محترقة', 'ذهبية ولذيذة', 'صغيرة وحلوة'], correct: 1 },
    ],
  },

  // ── D2: 4 pages ────────────────────────────────────────────────────────────
  {
    id: 'new-friend', title: 'الصديق الجديد', icon: '🤝', diff: 2,
    pages: [
      { emoji: '🏫😟', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'في أول يوم بالمدرسة الجديدة، جلس ياسر وحيداً في الفناء. كان الأطفال يلعبون حوله لكنه لم يعرف أحداً ولم يجرؤ على الاقتراب.' },
      { emoji: '⚽👦', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'جاء طفل يرتدي قميصاً أخضر اسمه نور. قال بابتسامة: أتريد أن تلعب معنا؟ قام ياسر فرحاً وسار معه.' },
      { emoji: '⚽😄', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'لعبا الكرة معاً وضحكا كثيراً. اكتشف ياسر أن نور يحب نفس الألعاب ويمجّد نفس الفريق.' },
      { emoji: '🤝💛', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'في نهاية اليوم قال ياسر لأمه وهو يقفز: وجدت صديقاً جديداً اسمه نور! ابتسمت أمه وعانقته بحب.' },
    ],
    questions: [
      { q: 'لماذا جلس ياسر وحيداً في البداية؟', choices: ['لأنه غاضب', 'لأنه لا يعرف أحداً', 'لأنه مريض'], correct: 1 },
      { q: 'ما الذي فعله نور حين رأى ياسر وحيداً؟', choices: ['دعاه للعب', 'أعطاه طعاماً', 'جلس بجانبه صامتاً'], correct: 0 },
      { q: 'ما الذي قاله ياسر لأمه؟', choices: ['أنه متعب', 'أنه وجد صديقاً جديداً', 'أنه يريد تغيير المدرسة'], correct: 1 },
    ],
  },
  {
    id: 'magic-book', title: 'الكتاب السحري', icon: '📚', diff: 2,
    pages: [
      { emoji: '📚✨', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'في مكتبة المدرسة وجدت ليلى كتاباً قديماً به رسومات غريبة وجميلة. فتحته بفضول وبدأت تقرأ بصوت منخفض.' },
      { emoji: '🦁🌴', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'إذا بها في غابة خضراء واسعة! أمامها أسد كبير ذو عرف ذهبي، لكنه كان يبتسم ابتسامة لطيفة ومطمئنة.' },
      { emoji: '🦁👧🌧️', bg: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', text: 'قال الأسد: مرحباً ليلى، مطر سحري سيأتي الليلة. هل تساعديننا في إيجاد مأوى للحيوانات الصغيرة؟' },
      { emoji: '🌈🌟', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'ساعدت ليلى الحيوانات بسرعة وذكاء. حين جاء المطر ظهر قوس قزح. استيقظت ليلى على ابتسامة وبيدها الكتاب.' },
    ],
    questions: [
      { q: 'أين وجدت ليلى الكتاب السحري؟', choices: ['في بيتها', 'في الحديقة', 'في مكتبة المدرسة'], correct: 2 },
      { q: 'كيف كان الأسد حين رأته ليلى؟', choices: ['مخيفاً ومفزعاً', 'طيباً ومبتسماً', 'حزيناً وصامتاً'], correct: 1 },
      { q: 'بماذا ساعدت ليلى الحيوانات؟', choices: ['أعطتهم طعاماً', 'أوجدت لهم مأوى', 'قرأت لهم قصة'], correct: 1 },
    ],
  },
  {
    id: 'lost-key', title: 'المفتاح الضائع', icon: '🔑', diff: 2,
    pages: [
      { emoji: '🔑😰', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'وصلت رانيا إلى باب المنزل وبحثت في حقيبتها. لم تجد المفتاح! صارت قلقة وفكّرت: أين وضعته؟' },
      { emoji: '🧠💭', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'جلست رانيا وأغمضت عينيها. تذكّرت: في الصباح أخذت المفتاح، ثم ذهبت للحديقة، ثم للمكتبة…' },
      { emoji: '📚🔑', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'ركضت رانيا للمكتبة وسألت الأمينة. قالت الأمينة وهي تبتسم: نعم! وجدناه على الطاولة وانتظرنا صاحبه.' },
      { emoji: '😊🏠', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'عادت رانيا للبيت فرحة. علّقت المفتاح في مكان ثابت وقالت: من الآن لمفتاحي مكان واحد فقط!' },
    ],
    questions: [
      { q: 'ما المشكلة التي واجهت رانيا؟', choices: ['نسيت واجبها', 'ضاع منها المفتاح', 'تأخرت عن المدرسة'], correct: 1 },
      { q: 'كيف تذكّرت رانيا أين المفتاح؟', choices: ['اتصلت بأمها', 'أغمضت عينيها وتذكّرت خطواتها', 'سألت جيرانها'], correct: 1 },
      { q: 'ماذا قررت رانيا في النهاية؟', choices: ['تشتري مفتاحاً جديداً', 'تعلّق المفتاح في مكان ثابت دائماً', 'تعطي المفتاح لأمها'], correct: 1 },
    ],
  },

  // ── D3: 5 pages ────────────────────────────────────────────────────────────
  {
    id: 'bridge-team', title: 'الفريق المتعاون', icon: '🏆', diff: 3,
    pages: [
      { emoji: '🏫📋', bg: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)', text: 'طُلب من طلاب الصف الخامس بناء جسر من الورق والمعكرونة يتحمّل كرة حجرية. المجموعة: كريم ونورة وسامي. المشكلة؟ لكل واحد فكرة مختلفة.' },
      { emoji: '💬😤', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'أراد كريم التصميم الكبير المعقد، وتريد نورة تصميم المثلث، ويريد سامي أبسط شيء ممكن. انشغل الجميع بالجدال حتى ضاع نصف الوقت.' },
      { emoji: '💡🤔', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'قالت نورة بهدوء: توقفوا. لكل واحد عشر ثوانٍ يشرح فكرته، ثم نصوّت. استمعوا بصمت واختاروا تصميم المثلث بعد التصويت.' },
      { emoji: '🔨⚙️', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'عمل الثلاثة معاً بسرعة. ركّز كريم على القاعدة، وعمل سامي على الوصلات، وأشرفت نورة على الشكل الثلاثي. كان الجسر يتخذ شكلاً جميلاً.' },
      { emoji: '🏆🎉', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'صمد الجسر وحمل الكرة! فازوا بالمسابقة. قال كريم وهو يضحك: تعلّمت أن الاستماع أقوى من الفوز بالجدال. أنتما الأفضل.' },
    ],
    questions: [
      { q: 'ما المشكلة الأولى التي واجهت المجموعة؟', choices: ['نقص المواد', 'الخلاف على التصميم', 'لم يفهموا التعليمات'], correct: 1 },
      { q: 'كيف حلّوا الخلاف بطريقة عادلة؟', choices: ['رمي القرعة', 'كل واحد يشرح ثم يصوّتون', 'طلب مساعدة المعلم'], correct: 1 },
      { q: 'ما الدرس الذي تعلّمه كريم؟', choices: ['المثلثات أقوى البنى', 'الاستماع أهم من الفوز بالجدال', 'الورق أمتن من المعكرونة'], correct: 1 },
    ],
  },
  {
    id: 'young-inventor', title: 'المخترع الصغير', icon: '⚙️', diff: 3,
    pages: [
      { emoji: '⚙️💡', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'كانت أميرة تلاحظ دائماً أن أجداد الحي يصعب عليهم فتح العبوات البلاستيكية. فكّرت: يجب أن أخترع شيئاً يساعدهم.' },
      { emoji: '📐✏️', bg: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)', text: 'رسمت أميرة عشرات التصاميم في دفترها. جرّبت أشكالاً مختلفة، وفشلت أربع مرات. لكنها في كل مرة تكتب: هذا لن أفعله مرة أخرى.' },
      { emoji: '🔧🛠️', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'في المرة الخامسة صنعت أداة صغيرة من البلاستيك والمطاط. جرّبتها على إبريق القهوة. نجحت! قفزت أميرة من الفرح.' },
      { emoji: '👴👵❤️', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'عرضت الأداة على جيرانها المسنّين. قال الجد: يا بنيتي، هذه هدية حقيقية. لم يصنعها أحد بهذا الشكل من قبل.' },
      { emoji: '🏅🌟', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'قدّم معلمها أميرة لمسابقة الابتكار. فازت بالجائزة الأولى. وقالت في كلمتها: الفشل لم يوقفني — بل علّمني.' },
    ],
    questions: [
      { q: 'ما المشكلة التي لاحظتها أميرة؟', choices: ['أجداد الحي يصعب عليهم القراءة', 'أجداد الحي يصعب عليهم فتح العبوات', 'أجداد الحي لا يحبون الطعام الجديد'], correct: 1 },
      { q: 'كم مرة فشلت أميرة قبل النجاح؟', choices: ['مرتين', 'ثلاث مرات', 'أربع مرات'], correct: 2 },
      { q: 'ما الدرس الذي شاركته أميرة في كلمتها؟', choices: ['الصبر يأتي بالنجاح', 'الفشل علّمها', 'العمل الجماعي أهم'], correct: 1 },
    ],
  },
  {
    id: 'goal-journey', title: 'رحلة الهدف', icon: '🌟', diff: 3,
    pages: [
      { emoji: '⛵🌊', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'حلم زياد دائماً بالسباحة في بطولة المدرسة. لكنه في أول تدريب خرج من الماء وهو يتنفس بصعوبة. قال المدرب: هذا طبيعي، ابدأ كل يوم بخطوة صغيرة.' },
      { emoji: '🏊📅', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'وضع زياد جدولاً: عشر دقائق سباحة يومياً. في الأسبوع الأول كان يتوقف ثلاث مرات. في الثالث توقف مرة واحدة. في الخامس سبح دون توقف.' },
      { emoji: '💪📈', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'في الشهر الثاني بدأ يُضيف خمس دقائق كل أسبوع. التعب كان حاضراً لكن زياد تذكّر كلمة المدرب: لا تقارن نفسك بالآخرين، قارنها بنفسك أمس.' },
      { emoji: '🏊🌊', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'جاء يوم التصفيات. شعر زياد بالتوتر. قبل النزول قال لنفسه: أنا هنا لأكون أفضل مما كنت، لا لأكون الأفضل بين الجميع. ثم قفز.' },
      { emoji: '🥈😊', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'جاء زياد في المركز الثاني. لم يكن الأول، لكنه تحسّن بنسبة أربعين بالمئة مقارنة بأول تدريب. قال لأبيه: اليوم انتصرت على نفسي.' },
    ],
    questions: [
      { q: 'ما نصيحة المدرب لزياد في البداية؟', choices: ['استعن بمدرب آخر', 'ابدأ كل يوم بخطوة صغيرة', 'استرح أسبوعاً قبل العودة'], correct: 1 },
      { q: 'كيف كان تقدم زياد في السباحة؟', choices: ['سريع جداً من البداية', 'تدريجي بزيادة الوقت أسبوعياً', 'متقطع وغير منتظم'], correct: 1 },
      { q: 'ماذا قال زياد لأبيه بعد السباق؟', choices: ['أنه فاز بالمركز الأول', 'أنه انتصر على نفسه', 'أنه يريد ترك السباحة'], correct: 1 },
    ],
  },
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

export default function StoryReader({ onComplete, onCancel, studentAge, difficulty = 1 }: Props) {
  const startRef = useRef(Date.now())
  const doneRef  = useRef(false)

  const available = STORIES.filter(s => {
    if (difficulty === 1 && studentAge < 9) return s.diff === 1
    if (difficulty <= 1) return s.diff === 1
    if (difficulty === 2) return s.diff <= 2
    return true
  })
  const story = available[Math.floor(Math.random() * available.length)] ?? STORIES[0]

  const [phase, setPhase] = useState<'read' | 'quiz' | 'done'>('read')
  const [pageIdx, setPageIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const speak = useCallback((text: string) => speakArabic(text, 0.85), [])

  // Auto-speak when page changes in read phase
  useEffect(() => {
    if (phase === 'read') {
      timerRef.current = setTimeout(() => speak(story.pages[pageIdx].text), 400)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pageIdx, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-speak question when quiz phase starts
  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setTimeout(() => speak(story.questions[qIdx].q), 400)
    }
  }, [qIdx, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function nextPage() {
    if (pageIdx < story.pages.length - 1) {
      setPageIdx(p => p + 1)
    } else {
      setPhase('quiz')
      setQIdx(0)
    }
  }

  function prevPage() {
    if (pageIdx > 0) setPageIdx(p => p - 1)
  }

  function handleChoice(idx: number) {
    if (selected !== null || showFeedback) return
    setSelected(idx)
    setShowFeedback(true)
    const nc = correct + (idx === story.questions[qIdx].correct ? 1 : 0)
    if (idx === story.questions[qIdx].correct) setCorrect(nc)

    timerRef.current = setTimeout(() => {
      setShowFeedback(false)
      setSelected(null)
      if (qIdx < story.questions.length - 1) {
        setQIdx(q => q + 1)
      } else {
        if (doneRef.current) return
        doneRef.current = true
        const score = Math.round((nc / story.questions.length) * 100)
        setPhase('done')
        timerRef.current = setTimeout(() => {
          onComplete({
            exerciseType: 'story-reader',
            exerciseLabelAr: 'مكتبة القصص',
            completedAt: new Date().toISOString(),
            score,
            accuracy: score,
            duration: Math.round((Date.now() - startRef.current) / 1000),
            errors: story.questions.length - nc,
            metadata: { storyId: story.id, storyTitle: story.title, pagesRead: story.pages.length, questionsCorrect: nc },
          })
        }, 1800)
      }
    }, 1400)
  }

  const page = story.pages[pageIdx]
  const q = phase === 'quiz' ? story.questions[qIdx] : null
  const totalPages = story.pages.length

  // ── DONE screen
  if (phase === 'done') {
    const score = Math.round((correct / story.questions.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
        <div className="text-6xl">{score >= 70 ? '🌟' : '📚'}</div>
        <div>
          <p className="font-black text-2xl text-gray-900 mb-1">
            {score >= 70 ? 'أحسنت! فهمت القصة جيداً' : 'لا بأس، القصة جميلة للمراجعة'}
          </p>
          <p className="text-gray-500">{correct} من {story.questions.length} إجابات صحيحة</p>
        </div>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-3">
          <div className="h-3 rounded-full transition-all" style={{ width: `${score}%`, background: score >= 70 ? '#22C55E' : '#F59E0B' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">{story.icon}</span>
          <span className="font-black text-gray-900 text-sm">{story.title}</span>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm px-3 py-1 rounded-xl hover:bg-gray-100">
          إغلاق
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-5 py-3">
        {phase === 'read' ? (
          story.pages.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= pageIdx ? '#6B46F0' : '#E5E7EB' }} />
          ))
        ) : (
          story.questions.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i < qIdx ? '#22C55E' : i === qIdx ? '#F59E0B' : '#E5E7EB' }} />
          ))
        )}
      </div>

      {/* READ phase */}
      {phase === 'read' && (
        <div className="flex-1 flex flex-col px-5 pb-5 gap-4 overflow-auto">
          {/* Illustration */}
          <div
            className="rounded-3xl flex items-center justify-center flex-shrink-0"
            style={{ background: page.bg, height: 160, fontSize: 64, letterSpacing: -4 }}
          >
            {page.emoji}
          </div>

          {/* Page label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">صفحة {pageIdx + 1} من {totalPages}</span>
            <button onClick={() => speak(page.text)} className="text-xs px-2 py-0.5 rounded-lg font-bold" style={{ background: '#F3EEFF', color: '#6B46F0' }}>
              🔊 استمع
            </button>
          </div>

          {/* Story text */}
          <div
            className="rounded-2xl p-4 text-lg leading-loose font-medium flex-1"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(107,70,240,0.1)', color: '#1E293B', lineHeight: 2.2, minHeight: 100 }}
          >
            {page.text}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {pageIdx > 0 && (
              <button
                onClick={prevPage}
                className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#64748B' }}
              >
                ← السابقة
              </button>
            )}
            <button
              onClick={nextPage}
              className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6B46F0,#8B5CF6)', boxShadow: '0 4px 16px rgba(107,70,240,0.3)' }}
            >
              {pageIdx === totalPages - 1 ? '🎯 الأسئلة ←' : 'التالية ←'}
            </button>
          </div>
        </div>
      )}

      {/* QUIZ phase */}
      {phase === 'quiz' && q && (
        <div className="flex-1 flex flex-col px-5 pb-5 gap-4 overflow-auto">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#FDF4FF', border: '1px solid rgba(107,70,240,0.12)' }}>
            <p className="text-xs font-bold text-purple-500 mb-1">سؤال {qIdx + 1} من {story.questions.length}</p>
            <p className="font-black text-lg text-gray-900 leading-snug">{q.q}</p>
            <button onClick={() => speak(q.q)} className="mt-2 text-xs px-2 py-0.5 rounded-lg font-bold" style={{ background: 'rgba(107,70,240,0.08)', color: '#6B46F0' }}>
              🔊 اسمع السؤال
            </button>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {q.choices.map((choice, i) => {
              const isSelected = selected === i
              const isCorrect = i === q.correct
              let bg = 'rgba(255,255,255,0.97)'
              let border = '1.5px solid #E5E7EB'
              let color = '#374151'
              if (showFeedback && isSelected && isCorrect) { bg = '#F0FFF4'; border = '2px solid #22C55E'; color = '#15803D' }
              else if (showFeedback && isSelected && !isCorrect) { bg = '#FEF2F2'; border = '2px solid #EF4444'; color = '#B91C1C' }
              else if (showFeedback && isCorrect) { bg = '#F0FFF4'; border = '2px solid #22C55E'; color = '#15803D' }

              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={selected !== null}
                  className="w-full text-right p-4 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:cursor-default"
                  style={{ background: bg, border, color, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <span className="ltr-num font-black ml-3 text-xs opacity-50">{i + 1}</span>
                  {choice}
                  {showFeedback && isCorrect && <span className="mr-2">✓</span>}
                  {showFeedback && isSelected && !isCorrect && <span className="mr-2">✗</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
