'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Lock, Star, X, ChevronLeft, ChevronRight, Sparkles, Volume2, Square } from 'lucide-react'
import { type Story, parseStoryText } from '@/lib/stories-data'
import { speakArabic, cancelSpeech } from '@/lib/speech'

// Strip the {{word|#hex}} colour markup to plain text for narration.
function plainPageText(page: string): string {
  return page
    .replace(/\{\{([^|}]+)\|[^}]*\}\}/g, '$1')
    .replace(/\{\{([^}]+)\}\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// Unlock rules — stories open as the child earns stars in their sessions.
// The first FREE_STORIES are always open so there's content from day one;
// after that each story costs STARS_PER_STEP more. Six are free so the three
// featured behavioural stories AND the three original easy ones all open from
// day one (see FEATURED_STORY_IDS in lib/stories-data).
const FREE_STORIES = 6
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
  const [stories, setStories] = useState<Story[] | null>(null)
  const [openStory, setOpenStory] = useState<Story | null>(null)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [brokenCovers, setBrokenCovers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/parent/progress-map')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { progressData?: { totalStars: number }[] } | null) => {
        const total = (d?.progressData ?? []).reduce((s, c) => s + (c.totalStars || 0), 0)
        setStars(total)
      })
      .catch(() => setStars(0))
    fetch('/api/stories')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { stories?: Story[] } | null) => setStories(d?.stories ?? []))
      .catch(() => setStories([]))
  }, [])

  const s = stars ?? 0
  const list = stories ?? []
  const nextLocked = useMemo(() => list.findIndex((_, i) => unlockAt(i) > s), [list, s])
  const unlockedCount = nextLocked === -1 ? list.length : nextLocked

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
          فُتِح {unlockedCount} من {list.length} قصة
          {nextLocked !== -1 && ` — القصة التالية تُفتح عند ${unlockAt(nextLocked)} نجمة`}
        </div>
      </div>

      {/* Story grid */}
      {stories === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-black/5 animate-pulse">
              <div className="h-28 bg-gray-100" />
              <div className="bg-white p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400 mb-10">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm">لا توجد قصص بعد — سيضيفها الأستاذ قريباً</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {list.map((story, i) => {
          const need = unlockAt(i)
          const locked = s < need
          const diff = DIFF_LABEL[story.diff]
          const cover = story.pageImages?.[0] ?? null
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
              <div className="h-28 flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${story.accent}, ${story.accent}CC)` }}>
                {cover && !brokenCovers.has(story.id) && (
                  // eslint-disable-next-line @next/next/no-img-element -- dashboard-uploaded, arbitrary source
                  <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover"
                    style={locked ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined}
                    onError={() => setBrokenCovers(s => new Set(s).add(story.id))} />
                )}
                {(!cover || brokenCovers.has(story.id)) && (
                  <span className="text-5xl drop-shadow relative" style={locked ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined}>
                    {story.icon}
                  </span>
                )}
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
      )}

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
  const [imgBroken, setImgBroken] = useState(false)
  const [reading, setReading] = useState(false)
  const [wordIdx, setWordIdx] = useState(-1)
  const karaokeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = story.pages.length
  const last = page >= total - 1
  const image = story.pageImages?.[page] ?? null
  const lines = story.pages[page].split('\n')
  useEffect(() => { setImgBroken(false) }, [image])

  function stopKaraoke() {
    if (karaokeRef.current) { clearInterval(karaokeRef.current); karaokeRef.current = null }
    setWordIdx(-1)
  }

  // Read-aloud with a timed word highlight (SpeechSynthesis boundary events are
  // unreliable for Arabic, so the highlight advances proportionally to word
  // length). The global word index matches plainPageText(...).split(/\s+/).
  function readPage() {
    if (reading) { cancelSpeech(); stopKaraoke(); setReading(false); return }
    const text = plainPageText(story.pages[page])
    const words = text.split(/\s+/).filter(Boolean)
    if (!words.length) return
    setReading(true); setWordIdx(0)
    const perMs = Math.max(240, Math.round((text.length / words.length) * 92))
    let i = 0
    karaokeRef.current = setInterval(() => {
      i++
      if (i >= words.length) stopKaraoke()
      else setWordIdx(i)
    }, perMs)
    speakArabic(text, 0.8)
      .then(() => { stopKaraoke(); setReading(false) })
      .catch(() => { stopKaraoke(); setReading(false) })
  }

  // Stop narration whenever the page changes or the modal unmounts.
  useEffect(() => { cancelSpeech(); stopKaraoke(); setReading(false) }, [page])
  useEffect(() => () => { cancelSpeech(); stopKaraoke() }, [])

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

        {/* Illustration — uploaded image if present, else icon on gradient */}
        <div className="h-40 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${story.accent}22, ${story.accent}0D)` }}>
          {image && !imgBroken ? (
            // eslint-disable-next-line @next/next/no-img-element -- dashboard-uploaded, arbitrary source
            <img src={image} alt="" className="w-full h-full object-cover" onError={() => setImgBroken(true)} />
          ) : (
            <motion.span key={page} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">{story.icon}</motion.span>
          )}
        </div>

        {/* Page text — word-level render so the active word highlights while reading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="p-6 min-h-[150px] flex items-center justify-center"
          >
            <p className="text-gray-800 text-xl text-center font-bold" style={{ lineHeight: 2.1 }}>
              {(() => {
                // Global word counter that matches plainPageText word-splitting:
                // a colour boundary mid-word must NOT advance it (track inWord).
                let wordCounter = -1
                let inWord = false
                return lines.map((line, li) => {
                  const node = (
                    <span key={li} className="block">
                      {parseStoryText(line).map((seg, si) => {
                        const parts = seg.text.split(/(\s+)/)
                        return parts.map((part, pi) => {
                          if (part === '') return null
                          if (/^\s+$/.test(part)) { inWord = false; return <span key={`${si}-${pi}`}>{part}</span> }
                          if (!inWord) { wordCounter++; inWord = true }
                          const active = reading && wordCounter === wordIdx
                          return (
                            <span
                              key={`${si}-${pi}`}
                              style={{
                                color: seg.color || undefined,
                                background: active ? `${story.accent}2E` : 'transparent',
                                boxShadow: active ? `0 0 0 2px ${story.accent}` : 'none',
                                borderRadius: 8,
                                padding: active ? '1px 6px' : 0,
                                transition: 'background .15s ease, box-shadow .15s ease, padding .15s ease',
                              }}
                            >{part}</span>
                          )
                        })
                      })}
                    </span>
                  )
                  inWord = false // a line break separates words
                  return node
                })
              })()}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Read-aloud — the main interactivity for a child */}
        <div className="px-6 pb-1">
          <button
            onClick={readPage}
            className="w-full py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={reading
              ? { background: '#FEE2E2', border: '2px solid #FCA5A5', color: '#B91C1C' }
              : { background: `${story.accent}15`, border: `2px solid ${story.accent}`, color: story.accent }}
          >
            {reading ? <><Square className="w-4 h-4 fill-current" /> إِيقاف القِراءة</> : <><Volume2 className="w-4 h-4" /> اِقرَأ لي</>}
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {story.pages.map((_, i) => (
            <span key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === page ? 20 : 8, height: 8, background: i <= page ? story.accent : '#E5E7EB' }} />
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
