'use client'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import type { ExerciseResult } from '@/lib/types'

// Lightweight exercise subset suitable for home use
const HOME_EXERCISES: Array<{
  id: string
  labelAr: string
  icon: string
  description: string
  ageMin: number
  category: string
}> = [
  { id: 'memory-cards',       labelAr: 'بطاقات الذاكرة',      icon: '🃏', description: 'لعبة الذاكرة الكلاسيكية — اقلب البطاقات وابحث عن أزواج',     ageMin: 4,  category: 'ذاكرة' },
  { id: 'breathing',          labelAr: 'تمرين التنفس',         icon: '🫁', description: 'تنفس عميق موجَّه للاسترخاء والهدوء',                            ageMin: 4,  category: 'استرخاء' },
  { id: 'emotion-cards',      labelAr: 'بطاقات المشاعر',       icon: '😊', description: 'تعرّف على المشاعر المختلفة وتعلّم كيف تعبّر عنها',              ageMin: 4,  category: 'عاطفي' },
  { id: 'balloon-control',    labelAr: 'تحكّم بالبالون',       icon: '🎈', description: 'تمرين التنفس البطني بطريقة ممتعة',                              ageMin: 5,  category: 'استرخاء' },
  { id: 'simon-says',         labelAr: 'سايمون يقول',          icon: '🎮', description: 'لعبة اتباع التعليمات والانتباه',                                ageMin: 5,  category: 'انتباه' },
  { id: 'calm-corner',        labelAr: 'زاوية الهدوء',         icon: '🧘', description: 'نشاط مريح للتهدئة والاسترخاء',                                  ageMin: 4,  category: 'استرخاء' },
  { id: 'reading-cards',      labelAr: 'بطاقات القراءة',       icon: '📚', description: 'قراءة كلمات وجمل بسيطة بصوت عالٍ',                             ageMin: 5,  category: 'قراءة' },
  { id: 'emotion-volume',     labelAr: 'مقياس المشاعر',        icon: '📊', description: 'تعلّم التعبير عن شدة المشاعر',                                  ageMin: 5,  category: 'عاطفي' },
  { id: 'body-scan',          labelAr: 'مسح الجسم',            icon: '🧘', description: 'تمرين وعي الجسم والاسترخاء التدريجي',                          ageMin: 6,  category: 'استرخاء' },
  { id: 'word-recall',        labelAr: 'تذكّر الكلمات',        icon: '🧠', description: 'احفظ قائمة كلمات وأعد ترديدها',                                ageMin: 6,  category: 'ذاكرة' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'ذاكرة':    '#3B82F6',
  'استرخاء':  '#2ABFA3',
  'عاطفي':    '#EC4899',
  'انتباه':   '#7C5CFC',
  'قراءة':    '#F59E0B',
}

// Lazy-loaded exercise components (same as session page)
const MemoryCards    = lazy(() => import('@/components/session/exercises/MemoryCards'))
const BreathingGuide = lazy(() => import('@/components/session/exercises/BreathingGuide'))
const EmotionCards   = lazy(() => import('@/components/session/exercises/EmotionCards'))
const BalloonControl = lazy(() => import('@/components/session/exercises/BalloonControl'))
const SimonSays      = lazy(() => import('@/components/session/exercises/SimonSays'))
const CalmCorner     = lazy(() => import('@/components/session/exercises/CalmCorner'))
const ReadingCards   = lazy(() => import('@/components/session/exercises/ReadingCards'))
const EmotionVolume  = lazy(() => import('@/components/session/exercises/EmotionVolume'))
const BodyScan       = lazy(() => import('@/components/session/exercises/BodyScan'))
const WordRecall     = lazy(() => import('@/components/session/exercises/WordRecall'))

interface SessionResult {
  exerciseLabelAr: string
  score: number
  duration: number
}

export default function PracticePage() {
  const [activeId, setActiveId]     = useState<string | null>(null)
  const [results, setResults]       = useState<SessionResult[]>([])
  const [finished, setFinished]     = useState<string | null>(null)
  const [childAge, setChildAge]     = useState(7)

  // Fetch child's age from profile
  useEffect(() => {
    fetch('/api/parent/me').then(r => r.json()).then(d => {
      const student = d.children?.[0]
      if (student?.birthDate) {
        const age = Math.floor((Date.now() - new Date(student.birthDate).getTime()) / 31536000000)
        setChildAge(age)
      }
    }).catch(() => {})
  }, [])

  function handleComplete(r: ExerciseResult) {
    setResults(prev => [...prev, { exerciseLabelAr: r.exerciseLabelAr, score: r.score, duration: r.duration }])
    setFinished(activeId)
    setActiveId(null)
  }

  function handleCancel() {
    setActiveId(null)
  }

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0

  const suitableExercises = HOME_EXERCISES.filter(e => e.ageMin <= childAge)

  if (activeId) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          </div>
        }>
          {activeId === 'memory-cards'    && <MemoryCards    onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'breathing'       && <BreathingGuide onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'emotion-cards'   && <EmotionCards   onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'balloon-control' && <BalloonControl onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'simon-says'      && <SimonSays      onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'calm-corner'     && <CalmCorner     onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'reading-cards'   && <ReadingCards   onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'emotion-volume'  && <EmotionVolume  onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'body-scan'       && <BodyScan       onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
          {activeId === 'word-recall'     && <WordRecall     onComplete={handleComplete} onCancel={handleCancel} studentAge={childAge} difficulty={1} />}
        </Suspense>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <div
        className="py-8 px-6"
        style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)' }}
      >
        <motion.div {...fadeUp} className="max-w-2xl mx-auto">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-black text-gray-900">التمارين المنزلية</h1>
          <p className="text-gray-500 text-sm mt-1">
            تمارين مختارة يمكنك ممارستها مع طفلك في المنزل
          </p>

          {/* Session summary */}
          {results.length > 0 && (
            <motion.div {...fadeUp}
              className="mt-5 grid grid-cols-3 gap-3"
            >
              <div className="bg-white/80 rounded-2xl p-3 text-center shadow-sm border border-white">
                <div className="text-2xl font-black text-brand-600">{results.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">تمارين اليوم</div>
              </div>
              <div className="bg-white/80 rounded-2xl p-3 text-center shadow-sm border border-white">
                <div className={`text-2xl font-black ${avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore}%
                </div>
                <div className="text-xs text-gray-500 mt-0.5">متوسط الأداء</div>
              </div>
              <div className="bg-white/80 rounded-2xl p-3 text-center shadow-sm border border-white">
                <div className="text-2xl font-black text-indigo-600">
                  {results.reduce((s, r) => s + r.duration, 0)}ث
                </div>
                <div className="text-xs text-gray-500 mt-0.5">إجمالي الوقت</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {suitableExercises.map((ex, i) => {
          const done = results.some(r => r.exerciseLabelAr === ex.labelAr)
          const justFinished = finished === ex.id
          const color = CATEGORY_COLORS[ex.category] ?? '#7C5CFC'

          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => { setFinished(null); setActiveId(ex.id) }}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border-2 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                style={{ borderColor: done ? color + '40' : '#F3F4F6' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
                  style={{ background: color + '15' }}
                >
                  {ex.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-gray-900 text-base">{ex.labelAr}</span>
                    {done && <span className="text-xs text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full">✓ تم</span>}
                    {justFinished && !done && <span className="text-xs text-emerald-600 font-black">✓ أحسنت!</span>}
                  </div>
                  <div className="text-xs text-gray-400 leading-snug">{ex.description}</div>
                  <div className="mt-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color + '15', color }}
                    >
                      {ex.category}
                    </span>
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '15' }}
                >
                  <span className="text-lg" style={{ color }}>▶</span>
                </div>
              </button>

              {/* Show score card after completing */}
              <AnimatePresence>
                {justFinished && results.find(r => r.exerciseLabelAr === ex.labelAr) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 mx-2 px-4 py-2 rounded-xl flex items-center gap-3"
                      style={{ background: color + '10', border: `1px solid ${color}25` }}>
                      <div className="text-2xl">🌟</div>
                      <div>
                        <div className="font-black text-sm" style={{ color }}>
                          نتيجة: {results.find(r => r.exerciseLabelAr === ex.labelAr)?.score}%
                        </div>
                        <div className="text-xs text-gray-500">رائع! حاول مرة أخرى لتحسين النتيجة</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
