'use client'
import { useState, useEffect, useRef } from 'react'
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
  // ── المستوى الأول: جمل قصيرة، مفردات بسيطة ───────────────────────────────
  {
    id: 'lion-brave', title: 'الأَسَدُ الطَّيِّب', icon: '🦁', diff: 1,
    pages: [
      { emoji: '🦁🌿', bg: 'linear-gradient(135deg,#FEF9C3,#FFFDE7)', text: 'كانَ في الغابةِ أَسَدٌ كبيرٌ اسمُهُ سامي.\nكانَ قَلبُهُ طَيِّباً رَغمَ جِسمِهِ الضَّخمِ.' },
      { emoji: '🦁🐇', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'رَأى سامي أَرنَباً صَغيراً يَبكي.\nسَأَلَهُ: ما بِكَ يا صَديقي؟' },
      { emoji: '🦁🐇⭐', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'قالَ الأَرنَبُ: لَقَد ضَعتُ عَن أُمِّي.\nأَمسَكَ سامي بيَدِهِ وأَوصَلَهُ إلى أُمِّه.\nفَرِحَ الجَميعُ كَثيراً.' },
    ],
    questions: [
      { q: 'ما اسمُ الأَسَدِ في القِصَّة؟', choices: ['نُور', 'سامي', 'كَريم'], correct: 1 },
      { q: 'لِماذا كانَ الأَرنَبُ يَبكي؟', choices: ['كانَ جائِعاً', 'ضاعَ عَن أُمِّه', 'وَقَعَ وأَلِمَ'], correct: 1 },
      { q: 'ماذا فَعَلَ الأَسَدُ سامي؟', choices: ['أَكَلَ الأَرنَب', 'أَوصَلَهُ إلى أُمِّه', 'تَرَكَهُ وَحدَه'], correct: 1 },
    ],
  },
  {
    id: 'rabbit-carrot', title: 'الأَرنَبُ والجَزَر', icon: '🐇', diff: 1,
    pages: [
      { emoji: '🐇🌱', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'كانَ هُناكَ أَرنَبٌ صَغيرٌ اسمُهُ بيبي.\nكانَ يُحِبُّ الجَزَرَ جِدّاً.' },
      { emoji: '🐇💧🌿', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'في يَومٍ مِنَ الأيّامِ زَرَعَ بيبي الجَزَرَ في حَديقَتِه.\nسَقاهُ كُلَّ يَومٍ بِعنايَة.' },
      { emoji: '🐇🥕😄', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'بَعدَ أيّامٍ نَضَجَ الجَزَرُ وأَصبَحَ كبيراً.\nقَطَفَهُ بيبي وأَكَلَهُ.\nقالَ: ما أَلَذَّهُ! الصَّبرُ يُثمِر.' },
    ],
    questions: [
      { q: 'ما اسمُ الأَرنَبِ؟', choices: ['بوبو', 'بيبي', 'فُفو'], correct: 1 },
      { q: 'ماذا زَرَعَ بيبي؟', choices: ['التُّفّاح', 'الجَزَر', 'البَطِّيخ'], correct: 1 },
      { q: 'ما الدَّرسُ مِنَ القِصَّة؟', choices: ['لا تأكُل الجَزَر', 'الصَّبرُ يُثمِر', 'الحَديقةُ صَعبة'], correct: 1 },
    ],
  },
  {
    id: 'little-duck', title: 'البَطَّةُ الصَّغيرة', icon: '🦆', diff: 1,
    pages: [
      { emoji: '🦆💧', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'تَعيشُ البَطَّةُ الصَّغيرةُ دودو بِجانِبِ البُحَيرة.\nتُحِبُّ السِّباحةَ كُلَّ يَوم.' },
      { emoji: '🦆😢', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'ذاتَ يَومٍ ابتَعَدَت دودو كثيراً ولَم تَجِد أُمَّها.\nجَلَسَت وبَكَت.' },
      { emoji: '🦆🤗😊', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'سَمِعَت الأُمُّ صَوتَها فَجاءَت مُسرِعةً.\nعانَقَتها بِحُبٍّ وقالَت: لا تَبتَعِدي أَبَداً يا دودو!' },
    ],
    questions: [
      { q: 'أَينَ تَعيشُ دودو؟', choices: ['في الجَبَل', 'بِجانِبِ البُحَيرة', 'في الغابة'], correct: 1 },
      { q: 'لِماذا بَكَت دودو؟', choices: ['كانَت جائِعة', 'لَم تَجِد أُمَّها', 'سَقَطَت في الماء'], correct: 1 },
      { q: 'ما نَصيحةُ الأُمِّ لِدودو؟', choices: ['اسبَحي أَكثَر', 'كُلي جَيِّداً', 'لا تَبتَعِدي أَبَداً'], correct: 2 },
    ],
  },
  {
    id: 'bear-honey', title: 'الدُّبُّ والعَسَل', icon: '🐻', diff: 1,
    pages: [
      { emoji: '🐻🌲', bg: 'linear-gradient(135deg,#FEF3C7,#FFFDE7)', text: 'كانَ في الغابةِ دُبٌّ اسمُهُ بوبو.\nكانَ يُحِبُّ العَسَلَ أَكثَرَ مِن أَيِّ شَيء.' },
      { emoji: '🐻🍯🐝', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'رَأى بوبو خَليَّةَ نَحلٍ عَلى شَجَرةٍ عاليَة.\nمَدَّ يَدَهُ لِيَأخُذَ العَسَل.' },
      { emoji: '🐻💨😅', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'طارَ النَّحلُ نَحوَهُ غاضِباً! فَرَّ بوبو مُسرِعاً.\nقالَ وَهوَ يَضحَك: العَسَلُ حُلوٌ لَكِنَّ العَقلَ أَحلى!' },
    ],
    questions: [
      { q: 'ما الَّذي يُحِبُّهُ الدُّبُّ بوبو؟', choices: ['التُّفّاح', 'العَسَل', 'السَّمَك'], correct: 1 },
      { q: 'أَينَ كانَت الخَليَّة؟', choices: ['عَلى الأَرض', 'في الماء', 'عَلى الشَّجَرة'], correct: 2 },
      { q: 'ما الدَّرسُ الَّذي تَعلَّمَهُ بوبو؟', choices: ['النَّحلُ خَطير جِدّاً', 'العَقلُ أَحلى مِن العَسَل', 'الغابةُ مَكانٌ سَيِّئ'], correct: 1 },
    ],
  },

  // ── المستوى الثاني — 4 صفحات ───────────────────────────────────────────────
  {
    id: 'new-friend', title: 'الصَّديقُ الجَديد', icon: '🤝', diff: 2,
    pages: [
      { emoji: '🏫😟', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'في أَوَّلِ يَومٍ بِالمَدرَسةِ الجَديدة،\nجَلَسَ ياسِرُ وَحيداً في الفِناء.\nلَم يَعرِف أَحَداً مِنَ التَّلاميذ.' },
      { emoji: '👦🌟', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'جاءَ طِفلٌ اسمُهُ نُور وابتَسَمَ.\nقالَ: أَتُريدُ أَن تَلعَبَ مَعَنا؟\nقالَ ياسِر بِفَرَحٍ: نَعَم، أُريد!' },
      { emoji: '⚽😄', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'لَعِبا الكُرَةَ مَعاً وَضَحِكا كثيراً.\nاكتَشَفا أَنَّهُما يُحِبّانِ نَفسَ الفَريق.' },
      { emoji: '🤝💛', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'قالَ ياسِر لِأُمِّهِ: وَجَدتُ صَديقاً جَديداً اسمُهُ نُور!\nالصَّداقةُ تَبدَأُ بِابتِسامةٍ واحِدة.' },
    ],
    questions: [
      { q: 'لِماذا جَلَسَ ياسِرُ وَحيداً؟', choices: ['لِأَنَّهُ غاضِب', 'لَم يَعرِف أَحَداً', 'لِأَنَّهُ مَريض'], correct: 1 },
      { q: 'كَيفَ بَدَأَت صَداقةُ نُور وَياسِر؟', choices: ['بِالكُتُب', 'بِابتِسامةٍ ودَعوةٍ لِلعَّب', 'بِالطَّعام'], correct: 1 },
      { q: 'بِماذا تَبدَأُ الصَّداقة؟', choices: ['بِالهَدايا', 'بِالمالِ', 'بِابتِسامةٍ واحِدة'], correct: 2 },
    ],
  },
  {
    id: 'lost-key', title: 'المِفتاحُ الضَّائِع', icon: '🔑', diff: 2,
    pages: [
      { emoji: '🔑😰', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'وَصَلَت رانيا إلى البَيتِ وَبَحَثَت في حَقيبَتِها.\nالمِفتاحُ لَيسَ مَوجوداً!\nقالَت بِقَلَق: أَينَ وَضَعتُهُ؟' },
      { emoji: '🧠💭', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'أَغمَضَت رانيا عَينَيها وَفَكَّرَت بِهُدوء.\nتَذَكَّرَت: ذَهَبتُ اليَومَ إلى المَكتَبة.\nرُبَّما نَسيتُهُ هُناك.' },
      { emoji: '📚🔑', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'ذَهَبَت إلى المَكتَبةِ بِسُرعة.\nقالَت الأَمينة: وَجَدناهُ عَلى الطَّاوِلة!\nفَرِحَت رانيا وَشَكَرَتها.' },
      { emoji: '😊🏠', bg: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)', text: 'عادَت رانيا إلى البَيتِ وَعَلَّقَت المِفتاحَ في مَكانٍ ثابِت.\nقالَت: مِنَ الآنِ لِمِفتاحي مَكانٌ واحِدٌ فَقَط!' },
    ],
    questions: [
      { q: 'ما الَّذي فَقَدَتهُ رانيا؟', choices: ['حَقيبَتَها', 'مِفتاحَها', 'كِتابَها'], correct: 1 },
      { q: 'أَينَ وَجَدَت المِفتاح؟', choices: ['في الحَديقة', 'في المَكتَبة', 'في المَدرَسة'], correct: 1 },
      { q: 'ماذا فَعَلَت رانيا لِتَحُلَّ المُشكِلةَ مُستَقبَلاً؟', choices: ['اشتَرَت مِفتاحاً جَديداً', 'عَلَّقَتهُ في مَكانٍ ثابِت', 'أَعطَتهُ لِأُمِّها'], correct: 1 },
    ],
  },

  // ── المستوى الثالث — 5 صفحات ───────────────────────────────────────────────
  {
    id: 'bridge-team', title: 'الفَريقُ المُتَعاوِن', icon: '🏆', diff: 3,
    pages: [
      { emoji: '🏫📋', bg: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)', text: 'طَلَبَ المُعَلِّمُ مِن كَريمٍ ونُورةَ وَسامي\nأَن يَبنوا جِسراً مِنَ الوَرَقِ والمَعكَرونة.\nكانَ لِكُلِّ واحِدٍ فِكرةٌ مُختَلِفة.' },
      { emoji: '💬😤', bg: 'linear-gradient(135deg,#FFE4E6,#FFF1F2)', text: 'تَجادَلَ الأَطفالُ طَويلاً.\nكُلُّ واحِدٍ يُريدُ فِكرَتَهُ فَقَط.\nضاعَ نِصفُ الوَقتِ بِلا فائِدة.' },
      { emoji: '💡🤝', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'قالَت نُورة بِهُدوء: تَوَقَّفوا!\nكُلُّ واحِدٍ يَشرَحُ فِكرَتَهُ، ثُمَّ نُصَوِّتُ مَعاً.\nاتَّفَقوا واختاروا أَفضَلَ فِكرة.' },
      { emoji: '🔨⚙️', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'عَمِلَ الثَّلاثةُ مَعاً بِسُرعة.\nلِكُلِّ واحِدٍ دَورٌ مُهِمّ.\nأَصبَحَ الجِسرُ جَميلاً وَمَتيناً.' },
      { emoji: '🏆🎉', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'صَمَدَ الجِسرُ وَفازوا بِالمُسابَقة!\nقالَ كَريم: تَعَلَّمتُ أَنَّ الاستِماعَ أَقوى مِنَ الجِدال.' },
    ],
    questions: [
      { q: 'ما المُشكِلةُ الأُولى الَّتي واجَهَت المَجموعة؟', choices: ['نَقصُ المَوادّ', 'الخِلافُ عَلى التَّصميم', 'لَم يَفهَموا التَّعليمات'], correct: 1 },
      { q: 'كَيفَ حَلُّوا الخِلاف؟', choices: ['رَميُ القُرعة', 'كُلُّ واحِدٍ يَشرَحُ ثُمَّ يُصَوِّتون', 'طَلَبوا مُساعَدةَ المُعَلِّم'], correct: 1 },
      { q: 'ما الدَّرسُ الَّذي تَعَلَّمَهُ كَريم؟', choices: ['الفَوزُ هُوَ كُلُّ شَيء', 'الاستِماعُ أَهَمُّ مِنَ الجِدال', 'العَمَلُ مُنفَرِداً أَفضَل'], correct: 1 },
    ],
  },
  {
    id: 'goal-journey', title: 'خُطوةٌ كُلَّ يَوم', icon: '🌟', diff: 3,
    pages: [
      { emoji: '🏊😰', bg: 'linear-gradient(135deg,#E0F2FE,#F0F9FF)', text: 'أَرادَ زِياد أَن يَسبَحَ في بُطولةِ المَدرَسة.\nلَكِنَّهُ كانَ يَتعَبُ بِسُرعة.\nقالَ المُدَرِّب: ابدَأ بِخُطوةٍ صَغيرةٍ كُلَّ يَوم.' },
      { emoji: '📅💪', bg: 'linear-gradient(135deg,#D1FAE5,#ECFDF5)', text: 'وَضَعَ زِياد جَدوَلاً يَومِيّاً للتَّدريب.\nفي الأُسبوعِ الأَوَّل تَوَقَّفَ ثَلاثَ مَرّات.\nفي الثَّالِثِ تَوَقَّفَ مَرَّةً واحِدة فَقَط.' },
      { emoji: '🏊⬆️', bg: 'linear-gradient(135deg,#FEF9C3,#FFFBEB)', text: 'في الأُسبوعِ الخامِسِ سَبَحَ زِياد دونَ أَن يَتَوَقَّف!\nقالَ المُدَرِّب: التَّقَدُّمُ الحَقيقيُّ يَحتاجُ وَقتاً وَصَبراً.' },
      { emoji: '🎽😤', bg: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text: 'جاءَ يَومُ البُطولة.\nأَخَذَ زِياد نَفَساً عَميقاً وَقالَ:\nأَنا هُنا لِأَكونَ أَفضَلَ مِمَّا كُنتُ أَمس.' },
      { emoji: '🥈😊', bg: 'linear-gradient(135deg,#FDF4FF,#FAF5FF)', text: 'جاءَ زِياد في المَركَزِ الثَّاني.\nقالَ لِأَبيه: اليَومَ انتَصَرتُ عَلى نَفسي.\nالخُطُواتُ الصَّغيرةُ تَصنَعُ الفَرق!' },
    ],
    questions: [
      { q: 'ما نَصيحةُ المُدَرِّبِ لِزِياد؟', choices: ['استَرِح أُسبوعاً', 'ابدَأ بِخُطوةٍ صَغيرةٍ كُلَّ يَوم', 'غَيِّر رِياضَتَك'], correct: 1 },
      { q: 'كَيفَ تَقَدَّمَ زِياد في السِّباحة؟', choices: ['بِسُرعةٍ كَبيرة', 'تَدريجِيّاً كُلَّ أُسبوع', 'بِدونِ تَدريب'], correct: 1 },
      { q: 'ما الدَّرسُ مِنَ القِصَّة؟', choices: ['الفَوزُ بِالمَركَزِ الأَوَّلِ أَهَمُّ شَيء', 'الخُطُواتُ الصَّغيرةُ تَصنَعُ الفَرق', 'السِّباحةُ سَهلة'], correct: 1 },
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
        <div className="flex-1 flex flex-col px-4 pb-5 gap-3 overflow-auto">
          {/* Illustration — big picture-book style */}
          <div
            className="rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: page.bg, height: 180, fontSize: 80, letterSpacing: -2, lineHeight: 1 }}
          >
            {page.emoji}
          </div>

          {/* Story text — large, clear, like a picture book */}
          <div
            className="rounded-3xl p-5 flex-1 flex flex-col justify-between"
            style={{ background: '#FFFDF7', border: '2px solid #F0E6FF', boxShadow: '0 2px 12px rgba(107,70,240,0.06)' }}
          >
            <p
              className="text-center font-black leading-loose"
              style={{ color: '#1E293B', fontSize: 22, lineHeight: 2.0 }}
            >
              {page.text}
            </p>
            <div className="flex items-center justify-end mt-3">
              <span className="text-xs font-bold text-gray-400">صفحة {pageIdx + 1} / {totalPages}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {pageIdx > 0 && (
              <button
                onClick={prevPage}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#64748B' }}
              >
                ← السابقة
              </button>
            )}
            <button
              onClick={nextPage}
              className="flex-1 py-3.5 rounded-2xl font-black text-base text-white transition-all hover:-translate-y-0.5"
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
            <p className="font-black text-xl text-gray-900 leading-snug">{q.q}</p>
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
