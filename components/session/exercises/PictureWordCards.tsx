'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic } from '@/lib/speech'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

interface Card {
  emoji: string
  word: string
  category: string
}

type Rating = 'knows' | 'approx' | 'unknown'
type ExerciseMode = 'assessment' | 'game'

interface RatedCard {
  card: Card
  rating: Rating
}

interface GameAnswer {
  card: Card
  correct: boolean
}

const ALL_CARDS: Card[] = [
  // حيوانات
  { emoji: '🐱', word: 'قِطَّة', category: 'حيوانات' },
  { emoji: '🐶', word: 'كَلْب', category: 'حيوانات' },
  { emoji: '🐘', word: 'فِيل', category: 'حيوانات' },
  { emoji: '🦁', word: 'أَسَد', category: 'حيوانات' },
  { emoji: '🐟', word: 'سَمَكَة', category: 'حيوانات' },
  { emoji: '🦋', word: 'فَرَاشَة', category: 'حيوانات' },
  { emoji: '🐦', word: 'عُصْفُور', category: 'حيوانات' },
  { emoji: '🐢', word: 'سُلَحْفَاة', category: 'حيوانات' },
  // فواكه
  { emoji: '🍎', word: 'تُفَّاحَة', category: 'فواكه' },
  { emoji: '🍌', word: 'مَوْزَة', category: 'فواكه' },
  { emoji: '🍊', word: 'بُرْتُقَالَة', category: 'فواكه' },
  { emoji: '🍇', word: 'عِنَب', category: 'فواكه' },
  { emoji: '🍓', word: 'فَرَاوْلَة', category: 'فواكه' },
  { emoji: '🍉', word: 'بِطِّيخ', category: 'فواكه' },
  // ألوان
  { emoji: '🔴', word: 'أَحْمَر', category: 'ألوان' },
  { emoji: '🔵', word: 'أَزْرَق', category: 'ألوان' },
  { emoji: '🟢', word: 'أَخْضَر', category: 'ألوان' },
  { emoji: '🟡', word: 'أَصْفَر', category: 'ألوان' },
  { emoji: '🟠', word: 'بُرْتُقَالِي', category: 'ألوان' },
  { emoji: '⚫', word: 'أَسْوَد', category: 'ألوان' },
  { emoji: '⚪', word: 'أَبْيَض', category: 'ألوان' },
  // أعضاء الجسم
  { emoji: '👁️', word: 'عَيْن', category: 'أعضاء' },
  { emoji: '👂', word: 'أُذُن', category: 'أعضاء' },
  { emoji: '👃', word: 'أَنْف', category: 'أعضاء' },
  { emoji: '👄', word: 'فَم', category: 'أعضاء' },
  { emoji: '🖐️', word: 'يَد', category: 'أعضاء' },
  { emoji: '🦶', word: 'قَدَم', category: 'أعضاء' },
  // مشاعر
  { emoji: '😊', word: 'سَعِيد', category: 'مشاعر' },
  { emoji: '😢', word: 'حَزِين', category: 'مشاعر' },
  { emoji: '😠', word: 'غَاضِب', category: 'مشاعر' },
  { emoji: '😨', word: 'خَائِف', category: 'مشاعر' },
  { emoji: '😴', word: 'نَعْسَان', category: 'مشاعر' },
  { emoji: '🤩', word: 'مُتَحَمِّس', category: 'مشاعر' },
  // أشياء
  { emoji: '📚', word: 'كُتُب', category: 'أشياء' },
  { emoji: '🖊️', word: 'قَلَم', category: 'أشياء' },
  { emoji: '🎒', word: 'حَقِيبَة', category: 'أشياء' },
  { emoji: '🏠', word: 'بَيْت', category: 'أشياء' },
  { emoji: '🚗', word: 'سَيَّارَة', category: 'أشياء' },
  { emoji: '📱', word: 'هَاتِف', category: 'أشياء' },
]

const CATEGORIES = ['كل الفئات', 'حيوانات', 'فواكه', 'ألوان', 'أعضاء', 'مشاعر', 'أشياء']

const CATEGORY_EMOJI: Record<string, string> = {
  'كل الفئات': '🌟',
  'حيوانات': '🐾',
  'فواكه': '🍓',
  'ألوان': '🎨',
  'أعضاء': '🖐️',
  'مشاعر': '😊',
  'أشياء': '🎒',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speakWord(word: string): void {
  speakArabic(word, 0.75)
}

function getRatingScore(r: Rating): number {
  if (r === 'knows') return 100
  if (r === 'approx') return 50
  return 0
}

// builds the 4 answer cards for a game round: the target + 3 distractors,
// preferring same-category distractors so the choice is a real discrimination test
function buildChoiceCards(card: Card): Card[] {
  const sameCat = ALL_CARDS.filter(c => c.category === card.category && c.word !== card.word)
  const otherCat = ALL_CARDS.filter(c => c.category !== card.category)
  const pool = [...shuffle(sameCat), ...shuffle(otherCat)]
  const seen = new Set<string>([card.word])
  const distractors: Card[] = []
  for (const c of pool) {
    if (distractors.length >= 3) break
    if (seen.has(c.word)) continue
    seen.add(c.word)
    distractors.push(c)
  }
  return shuffle([card, ...distractors])
}

type Phase = 'mode' | 'category' | 'cards' | 'results'

export default function PictureWordCards({
  onComplete,
  onCancel,
  studentAge: _studentAge,
  difficulty = 1,
}: Props) {
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const [phase, setPhase] = useState<Phase>('mode')
  const [mode, setMode] = useState<ExerciseMode | null>(null)
  const [deck, setDeck] = useState<Card[]>([])
  const [cardIdx, setCardIdx] = useState(0)
  const [ratings, setRatings] = useState<RatedCard[]>([])
  const [animating, setAnimating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [ttsSupported, setTtsSupported] = useState(true)

  // game mode
  const [gameChoices, setGameChoices] = useState<Card[][]>([])
  const [chosenEmoji, setChosenEmoji] = useState<string | null>(null)
  const [gameAnswers, setGameAnswers] = useState<GameAnswer[]>([])

  const maxCards = difficulty === 1 ? 8 : difficulty === 2 ? 16 : ALL_CARDS.length

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setTtsSupported(false)
    }
  }, [])

  function startWithCategory(cat: string) {
    setSelectedCategory(cat)
    const pool = cat === 'كل الفئات' ? ALL_CARDS : ALL_CARDS.filter(c => c.category === cat)
    const shuffled = shuffle(pool).slice(0, maxCards)
    setDeck(shuffled)
    setGameChoices(mode === 'game' ? shuffled.map(c => buildChoiceCards(c)) : [])
    setCardIdx(0)
    setRatings([])
    setGameAnswers([])
    setChosenEmoji(null)
    setAnimating(false)
    startRef.current = Date.now()
    setPhase('cards')
  }

  // Auto-play TTS when card changes
  useEffect(() => {
    if (phase !== 'cards' || animating || chosenEmoji || !deck[cardIdx]) return
    speakWord(deck[cardIdx].word)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cardIdx, deck])

  const handleRating = useCallback((rating: Rating) => {
    if (animating || !deck[cardIdx]) return
    const card = deck[cardIdx]
    const newRatings = [...ratings, { card, rating }]
    setRatings(newRatings)
    setAnimating(true)

    timerRef.current = setTimeout(() => {
      setAnimating(false)
      const nextIdx = cardIdx + 1
      if (nextIdx >= deck.length) {
        // compute results
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        const knows = newRatings.filter(r => r.rating === 'knows').length
        const approx = newRatings.filter(r => r.rating === 'approx').length
        const unknown = newRatings.filter(r => r.rating === 'unknown').length
        const totalScore = Math.round(
          newRatings.reduce((sum, r) => sum + getRatingScore(r.rating), 0) / newRatings.length
        )
        const accuracy = Math.round((knows / newRatings.length) * 100)

        setPhase('results')

        onComplete({
          exerciseType: 'picture-word-cards',
          exerciseLabelAr: 'بطاقات الصورة والكلمة',
          score: totalScore,
          accuracy,
          duration: dur,
          errors: unknown,
          metadata: {
            total: newRatings.length,
            knows,
            approx,
            unknown,
            category: selectedCategory,
            mode: 'assessment',
          },
          completedAt: new Date().toISOString(),
        })
      } else {
        setCardIdx(nextIdx)
      }
    }, 350)
  }, [animating, deck, cardIdx, ratings, selectedCategory, onComplete])

  const handleGameChoice = useCallback((choice: Card) => {
    if (chosenEmoji || !deck[cardIdx]) return
    const target = deck[cardIdx]
    const isCorrect = choice.word === target.word
    setChosenEmoji(choice.emoji)
    const newAnswers = [...gameAnswers, { card: target, correct: isCorrect }]
    setGameAnswers(newAnswers)

    timerRef.current = setTimeout(() => {
      setChosenEmoji(null)
      const nextIdx = cardIdx + 1
      if (nextIdx >= deck.length) {
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        const correct = newAnswers.filter(a => a.correct).length
        const wrong = newAnswers.length - correct
        const score = Math.round((correct / newAnswers.length) * 100)

        setPhase('results')

        onComplete({
          exerciseType: 'picture-word-cards',
          exerciseLabelAr: 'بطاقات الصورة والكلمة',
          score,
          accuracy: score,
          duration: dur,
          errors: wrong,
          metadata: {
            total: newAnswers.length,
            correct,
            wrong,
            category: selectedCategory,
            mode: 'game',
          },
          completedAt: new Date().toISOString(),
        })
      } else {
        setCardIdx(nextIdx)
      }
    }, 1300)
  }, [chosenEmoji, deck, cardIdx, gameAnswers, selectedCategory, onComplete])

  // ─── MODE PICKER ──────────────────────────────────────────────
  if (phase === 'mode') {
    return (
      <div dir="rtl" className="flex flex-col gap-5 p-6 select-none max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">بطاقات الصورة والكلمة</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← إلغاء
          </button>
        </div>

        <p className="text-white/60 text-sm">اختر طريقة التمرين:</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setMode('assessment'); setPhase('category') }}
            className="flex items-start gap-4 p-4 rounded-2xl border-2 text-right transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'rgba(124,92,252,0.08)', borderColor: 'rgba(124,92,252,0.35)' }}
          >
            <span className="text-3xl">🩺</span>
            <div className="flex-1">
              <div className="text-white font-black text-base">تقييم سريري</div>
              <div className="text-white/50 text-xs mt-1">
                يقيّم المختص معرفة الطفل بكل كلمة (يعرف / تقريباً / لا يعرف) لإعداد تقرير المفردات
              </div>
            </div>
          </button>
          <button
            onClick={() => { setMode('game'); setPhase('category') }}
            className="flex items-start gap-4 p-4 rounded-2xl border-2 text-right transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.35)' }}
          >
            <span className="text-3xl">🎮</span>
            <div className="flex-1">
              <div className="text-white font-black text-base">لعبة تفاعلية</div>
              <div className="text-white/50 text-xs mt-1">
                الطفل يسمع الكلمة ويختار الصورة الصحيحة من 4 خيارات — تفاعل مباشر وتقييم تلقائي
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ─── CATEGORY PICKER ──────────────────────────────────────────
  if (phase === 'category') {
    return (
      <div dir="rtl" className="flex flex-col gap-5 p-6 select-none max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">بطاقات الصورة والكلمة</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← إلغاء
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-xs px-3 py-1 rounded-full font-bold"
            style={{
              background: mode === 'game' ? 'rgba(22,163,74,0.15)' : 'rgba(124,92,252,0.15)',
              color: mode === 'game' ? '#4ade80' : '#c4b5fd',
            }}
          >
            {mode === 'game' ? '🎮 لعبة تفاعلية' : '🩺 تقييم سريري'}
          </span>
          <button onClick={() => setPhase('mode')} className="text-white/40 hover:text-white/70 text-xs transition-colors">
            تغيير الوضع
          </button>
        </div>

        <p className="text-white/60 text-sm">اختر فئة البطاقات:</p>

        {!ttsSupported && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-2 text-amber-300 text-sm text-center">
            ⚠️ التحدث الصوتي غير مدعوم في هذا المتصفح
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => {
            const count = cat === 'كل الفئات'
              ? Math.min(ALL_CARDS.length, maxCards)
              : Math.min(ALL_CARDS.filter(c => c.category === cat).length, maxCards)
            return (
              <button
                key={cat}
                onClick={() => startWithCategory(cat)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(124,92,252,0.4)',
                }}
              >
                <span className="text-3xl">{CATEGORY_EMOJI[cat] ?? '📦'}</span>
                <span className="text-white font-bold text-sm">{cat}</span>
                <span className="text-white/40 text-xs">{count} بطاقة</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── RESULTS ──────────────────────────────────────────────────
  if (phase === 'results') {
    if (mode === 'game') {
      const correct = gameAnswers.filter(a => a.correct).length
      const wrong = gameAnswers.length - correct
      const total = gameAnswers.length
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0

      return (
        <div dir="rtl" className="flex flex-col gap-5 p-6 select-none max-w-lg mx-auto w-full">
          <h2 className="text-xl font-black text-white text-center">نتائج اللعبة</h2>

          <div className="bg-gray-900 rounded-3xl p-5 border border-white/10 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-4xl font-black" style={{ color: '#22c55e' }}>{pct}%</div>
              <div className="text-white/50 text-xs mt-1">نسبة الإجابات الصحيحة</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col gap-2 flex-1 pr-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400 font-bold">✅ صحيح</span>
                <span className="text-white font-black">{correct}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-400 font-bold">❌ خطأ</span>
                <span className="text-white font-black">{wrong}</span>
              </div>
            </div>
          </div>

          {wrong > 0 && (
            <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4">
              <p className="text-red-300 text-xs font-bold mb-2">كلمات تحتاج تدريباً إضافياً:</p>
              <div className="flex flex-wrap gap-2">
                {gameAnswers.filter(a => !a.correct).map((a, i) => (
                  <span key={i} className="flex items-center gap-1 bg-red-500/20 rounded-xl px-3 py-1 text-white text-sm">
                    {a.card.emoji} {a.card.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('category')}
              className="flex-1 py-3 rounded-2xl font-bold text-base border-2 transition-all duration-200"
              style={{ background: 'rgba(22,163,74,0.15)', borderColor: 'rgba(22,163,74,0.4)', color: '#86efac' }}
            >
              جلسة جديدة
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl font-bold text-base border-2 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
            >
              إنهاء
            </button>
          </div>
        </div>
      )
    }

    const knows = ratings.filter(r => r.rating === 'knows').length
    const approx = ratings.filter(r => r.rating === 'approx').length
    const unknown = ratings.filter(r => r.rating === 'unknown').length
    const total = ratings.length
    const pct = Math.round((knows / total) * 100)

    // Per-category breakdown
    const categoryGroups: Record<string, RatedCard[]> = {}
    for (const r of ratings) {
      if (!categoryGroups[r.card.category]) categoryGroups[r.card.category] = []
      categoryGroups[r.card.category].push(r)
    }

    return (
      <div dir="rtl" className="flex flex-col gap-5 p-6 select-none max-w-lg mx-auto w-full">
        <h2 className="text-xl font-black text-white text-center">نتائج الجلسة</h2>

        {/* Overall score */}
        <div className="bg-gray-900 rounded-3xl p-5 border border-white/10 flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-4xl font-black" style={{ color: '#7C5CFC' }}>{pct}%</div>
            <div className="text-white/50 text-xs mt-1">نسبة المعرفة</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="flex flex-col gap-2 flex-1 pr-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-400 font-bold">✅ يعرف</span>
              <span className="text-white font-black">{knows}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-400 font-bold">⚡ تقريباً</span>
              <span className="text-white font-black">{approx}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 font-bold">❌ لا يعرف</span>
              <span className="text-white font-black">{unknown}</span>
            </div>
          </div>
        </div>

        {/* Per-category breakdown */}
        {Object.keys(categoryGroups).length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-white/50 text-xs">تفصيل حسب الفئة:</p>
            {Object.entries(categoryGroups).map(([cat, items]) => {
              const catKnows = items.filter(r => r.rating === 'knows').length
              const catPct = Math.round((catKnows / items.length) * 100)
              return (
                <div key={cat} className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-2 border border-white/10">
                  <span className="text-lg">{CATEGORY_EMOJI[cat] ?? '📦'}</span>
                  <span className="text-white text-sm font-bold flex-1">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${catPct}%`, background: catPct >= 70 ? '#22c55e' : catPct >= 40 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                    <span className="text-white/60 text-xs w-8 text-left">{catPct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Words the child didn't know */}
        {unknown > 0 && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4">
            <p className="text-red-300 text-xs font-bold mb-2">كلمات تحتاج تدريباً إضافياً:</p>
            <div className="flex flex-wrap gap-2">
              {ratings.filter(r => r.rating === 'unknown').map((r, i) => (
                <span key={i} className="flex items-center gap-1 bg-red-500/20 rounded-xl px-3 py-1 text-white text-sm">
                  {r.card.emoji} {r.card.word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setPhase('category')}
            className="flex-1 py-3 rounded-2xl font-bold text-base border-2 transition-all duration-200"
            style={{ background: 'rgba(124,92,252,0.15)', borderColor: 'rgba(124,92,252,0.4)', color: '#c4b5fd' }}
          >
            جلسة جديدة
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-base border-2 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            إنهاء
          </button>
        </div>
      </div>
    )
  }

  // ─── CARD SCREEN ────────────────────────────────────────────────
  const currentCard = deck[cardIdx]
  if (!currentCard) return null

  const total = deck.length
  const progressPct = Math.round((cardIdx / total) * 100)

  // ─── GAME MODE ──────────────────────────────────────────────────
  if (mode === 'game') {
    const choices = gameChoices[cardIdx] ?? []
    return (
      <div dir="rtl" className="flex flex-col gap-4 p-5 select-none max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">بطاقات الصورة والكلمة</h2>
          <span className="text-white/50 text-sm">{cardIdx + 1} من {total}</span>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: '#16a34a' }}
          />
        </div>

        {/* Target word */}
        <div className="flex flex-col items-center gap-3 bg-gray-900 rounded-3xl border border-white/10 py-6">
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80' }}>
            اسمع واختر الصورة الصحيحة
          </span>
          <p className="font-black text-white text-center" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
            {currentCard.word}
          </p>
          <button
            onClick={() => speakWord(currentCard.word)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-200 text-sm"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
          >
            🔊 استمع
          </button>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3">
          {choices.map(c => {
            const isChosen = chosenEmoji === c.emoji
            const isCorrectCard = c.word === currentCard.word
            let bg = 'rgba(255,255,255,0.06)'
            let border = 'rgba(255,255,255,0.15)'
            if (isChosen && isCorrectCard) { bg = 'rgba(34,197,94,0.25)'; border = '#4ade80' }
            else if (isChosen && !isCorrectCard) { bg = 'rgba(239,68,68,0.25)'; border = '#f87171' }
            else if (chosenEmoji && !isChosen && isCorrectCard) { bg = 'rgba(34,197,94,0.12)'; border = 'rgba(74,222,128,0.5)' }
            return (
              <button
                key={c.word}
                onClick={() => handleGameChoice(c)}
                disabled={!!chosenEmoji}
                className="flex items-center justify-center rounded-2xl border-2 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                style={{ background: bg, borderColor: border, height: 110, fontSize: '3.5rem' }}
              >
                {c.emoji}
              </button>
            )
          })}
        </div>

        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors text-center mt-1">
          ← إنهاء التمرين
        </button>
      </div>
    )
  }

  // ─── ASSESSMENT MODE ────────────────────────────────────────────
  // Rating dots so far
  const recentRatings = ratings.slice(-10)

  return (
    <div dir="rtl" className="flex flex-col gap-4 p-5 select-none max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white">بطاقات الصورة والكلمة</h2>
        <span className="text-white/50 text-sm">{cardIdx + 1} من {total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, background: '#7C5CFC' }}
        />
      </div>

      {/* Recent rating dots */}
      {recentRatings.length > 0 && (
        <div className="flex gap-1.5 justify-center">
          {recentRatings.map((r, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                background: r.rating === 'knows' ? '#22c55e' : r.rating === 'approx' ? '#f59e0b' : '#ef4444',
              }}
            />
          ))}
        </div>
      )}

      {/* Card */}
      <div
        className="flex flex-col items-center justify-center gap-4 bg-gray-900 rounded-3xl border border-white/10 transition-all duration-300"
        style={{
          minHeight: 280,
          transform: animating ? 'translateX(-100%)' : 'translateX(0)',
          opacity: animating ? 0 : 1,
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: '10rem', lineHeight: 1 }}>{currentCard.emoji}</div>

        {/* Word */}
        <p
          className="font-black text-white text-center"
          style={{ fontSize: '3rem', lineHeight: 1.1 }}
        >
          {currentCard.word}
        </p>

        {/* Category badge */}
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: 'rgba(124,92,252,0.2)', color: '#c4b5fd' }}
        >
          {currentCard.category}
        </span>

        {/* Replay TTS */}
        <button
          onClick={() => speakWord(currentCard.word)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-200 text-sm"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
        >
          🔊 استمع
        </button>
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-3 gap-3 mt-1">
        <button
          onClick={() => handleRating('knows')}
          disabled={animating}
          className="flex flex-col items-center gap-1 py-4 rounded-2xl font-bold text-white transition-all duration-200 active:scale-95"
          style={{ background: animating ? 'rgba(22,163,74,0.4)' : '#16a34a', fontSize: 14 }}
        >
          <span className="text-2xl">✅</span>
          <span>يَعْرِف</span>
        </button>
        <button
          onClick={() => handleRating('approx')}
          disabled={animating}
          className="flex flex-col items-center gap-1 py-4 rounded-2xl font-bold text-white transition-all duration-200 active:scale-95"
          style={{ background: animating ? 'rgba(217,119,6,0.4)' : '#d97706', fontSize: 14 }}
        >
          <span className="text-2xl">⚡</span>
          <span>تَقْرِيباً</span>
        </button>
        <button
          onClick={() => handleRating('unknown')}
          disabled={animating}
          className="flex flex-col items-center gap-1 py-4 rounded-2xl font-bold text-white transition-all duration-200 active:scale-95"
          style={{ background: animating ? 'rgba(220,38,38,0.4)' : '#dc2626', fontSize: 14 }}
        >
          <span className="text-2xl">❌</span>
          <span>لا يَعْرِف</span>
        </button>
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors text-center mt-1">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
