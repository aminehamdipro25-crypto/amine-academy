'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Lock, Star, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { STORIES, type Story } from '@/lib/stories-data'

// Unlock rules — stories open as the child earns stars in their sessions.
// The first FREE_STORIES are always open so there's content from day one;
// after that each story costs STARS_PER_STEP more.
const FREE_STORIES = 3
const STARS_PER_STEP = 3
function unlockAt(index: number): number {
  return Math.max(0, index - (FREE_STORIES - 1)) * STARS_PER_STEP
}

// Educational letter cards — each teaches an Arabic letter with a word + picture.
// They unlock progressively too, so learning the alphabet is a reward.
const FLASHCARDS: { letter: string; word: string; emoji: string }[] = [
  { letter: 'أ', word: 'أَسَد', emoji: '🦁' },
  { letter: 'ب', word: 'بَطَّة', emoji: '🦆' },
  { letter: 'ت', word: 'تُفَّاحة', emoji: '🍎' },
  { letter: 'ج', word: 'جَمَل', emoji: '🐫' },
  { letter: 'د', word: 'دُبّ', emoji: '🐻' },
  { letter: 'ر', word: 'أَرنَب', emoji: '🐇' },
  { letter: 'س', word: 'سَمَكة', emoji: '🐟' },
  { letter: 'ش', word: 'شَجَرة', emoji: '🌳' },
  { letter: 'ط', word: 'طائِر', emoji: '🐦' },
  { letter: 'ف', word: 'فيل', emoji: '🐘' },
  { letter: 'ق', word: 'قِطّة', emoji: '🐱' },
  { letter: 'ن', word: 'نَحلة', emoji: '🐝' },
]
const CARD_UNLOCK_STEP = 4 // a new letter card every 4 stars

const DIFF_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'سهل', color: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'متوسط', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'متقدّم', color: 'bg-rose-100 text-rose-700' },
}

export default function StoryLibraryPage() {
  const [stars, setStars] = useState<number | null>(null)
  const [openStory, setOpenStory] = useState<Story | null>(null)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/parent/progress-map')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { progressData?: { totalStars: number }[] } | null) => {
        const total = (d?.progressData ?? []).reduce((s, c) => s + (c.totalStars || 0), 0)
        setStars(total)
      })
      .catch(() => setStars(0))
  }, [])

  const s = stars ?? 0
  const nextLocked = useMemo(() => STORIES.findIndex((_, i) => unlockAt(i) > s), [s])
  const unlockedCount = nextLocked === -1 ? STORIES.length : nextLocked

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Header */}
      <div className="rounded-3xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg, #7C3AED, #6B46F0 55%, #2ABFA3)' }}>
        <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">مكتبة القصص</h1>
            <p className="text-white/70 text-sm mt-0.5">قصص مصوّرة تُفتح كلّما تقدّم طفلك وجمع النجوم ⭐</p>
          </div>
          <div className="text-center bg-white/15 rounded-2xl px-4 py-2">
            <div className="text-2xl font-black ltr-num flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              {stars === null ? '…' : stars}
            </div>
            <div className="text-white/70 text-[11px]">نجوم الطفل</div>
          </div>
        </div>
        <div className="relative mt-4 text-xs text-white/80 bg-white/10 rounded-xl px-3 py-2 inline-block">
          فُتِح {unlockedCount} من {STORIES.length} قصة
          {nextLocked !== -1 && ` — القصة التالية تُفتح عند ${unlockAt(nextLocked)} نجمة`}
        </div>
      </div>

      {/* Story grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {STORIES.map((story, i) => {
          const need = unlockAt(i)
          const locked = s < need
          const diff = DIFF_LABEL[story.diff]
          return (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={locked ? undefined : { y: -4 }}
              onClick={() => !locked && setOpenStory(story)}
              disabled={locked}
              className={`relative rounded-3xl overflow-hidden text-right shadow-sm border border-black/5 ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'} transition-shadow`}
            >
              {/* Cover */}
              <div className="h-28 flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${story.accent}, ${story.accent}CC)` }}>
                <span className="text-5xl drop-shadow" style={locked ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined}>
                  {story.icon}
                </span>
                {locked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white">
                    <Lock className="w-6 h-6" />
                    <span className="text-[11px] font-black ltr-num flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" /> {need}
                    </span>
                  </div>
                )}
              </div>
              {/* Body */}
              <div className="bg-white p-3">
                <h3 className="font-black text-gray-900 text-sm leading-snug mb-1.5 line-clamp-1">{story.title}</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{story.pages.length} صفحات</span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Educational flashcards */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-black text-gray-900">بطاقات الحروف</h2>
        <span className="text-xs text-gray-400 font-bold">تُفتح بطاقة جديدة كلّ {CARD_UNLOCK_STEP} نجوم</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {FLASHCARDS.map((card, i) => {
          const need = i * CARD_UNLOCK_STEP
          const locked = s < need
          const isFlipped = flipped.has(i)
          return (
            <button
              key={card.letter}
              onClick={() => {
                if (locked) return
                setFlipped(prev => {
                  const n = new Set(prev)
                  n.has(i) ? n.delete(i) : n.add(i)
                  return n
                })
              }}
              disabled={locked}
              className={`aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${locked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-brand-100 hover:border-brand-300 hover:shadow-md active:scale-95'}`}
            >
              {locked ? (
                <>
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 ltr-num flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-gray-300 text-gray-300" />{need}
                  </span>
                </>
              ) : isFlipped ? (
                <>
                  <span className="text-4xl">{card.emoji}</span>
                  <span className="text-sm font-black text-gray-700">{card.word}</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black" style={{ color: '#6B46F0' }}>{card.letter}</span>
                  <span className="text-[10px] text-gray-400 font-bold">اضغط للقلب</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Reading modal */}
      <AnimatePresence>
        {openStory && <StoryReaderModal story={openStory} onClose={() => setOpenStory(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ── Child-friendly page-by-page reader ───────────────────────────────────────
function StoryReaderModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const total = story.pages.length
  const last = page >= total - 1

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose} dir="rtl"
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between text-white"
          style={{ background: `linear-gradient(135deg, ${story.accent}, ${story.accent}CC)` }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{story.icon}</span>
            <h3 className="font-black">{story.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Illustration */}
        <div className="h-40 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${story.accent}22, ${story.accent}0D)` }}>
          <span className="text-7xl">{story.icon}</span>
        </div>

        {/* Page text */}
        <div className="p-6 min-h-[140px] flex items-center justify-center">
          <p className="text-gray-800 text-xl leading-loose text-center font-bold" style={{ lineHeight: 2 }}>
            {story.pages[page].split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {story.pages.map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === page ? story.accent : '#E5E7EB' }} />
          ))}
        </div>

        {/* Nav */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-bold text-gray-500 disabled:opacity-30 px-3 py-2"
          >
            <ChevronRight className="w-4 h-4" /> السابق
          </button>
          {last ? (
            <button onClick={onClose}
              className="flex-1 max-w-[220px] text-white font-black py-3 rounded-2xl"
              style={{ background: story.accent }}>
              🎉 أحسنت! أنهيت القصة
            </button>
          ) : (
            <button
              onClick={() => setPage(p => Math.min(total - 1, p + 1))}
              className="flex items-center gap-1 text-sm font-black text-white px-5 py-2.5 rounded-2xl"
              style={{ background: story.accent }}
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
