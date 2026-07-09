'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface WordItem {
  word: string
  hint: string
  category: string
  minAge?: number
}

const WORDS_EASY: WordItem[] = [
  { word: 'قطة', hint: '🐱', category: 'حيوانات' },
  { word: 'كلب', hint: '🐶', category: 'حيوانات' },
  { word: 'بيت', hint: '🏠', category: 'أماكن' },
  { word: 'نجم', hint: '⭐', category: 'طبيعة' },
  { word: 'ماء', hint: '💧', category: 'طبيعة' },
  { word: 'شمس', hint: '☀️', category: 'طبيعة' },
  { word: 'قمر', hint: '🌙', category: 'طبيعة' },
  { word: 'باب', hint: '🚪', category: 'أشياء' },
  { word: 'كتب', hint: '📚', category: 'أشياء' },
  { word: 'سمك', hint: '🐟', category: 'حيوانات' },
  { word: 'دجاج', hint: '🐔', category: 'حيوانات' },
  { word: 'فيل', hint: '🐘', category: 'حيوانات' },
]

const WORDS_MEDIUM: WordItem[] = [
  { word: 'سيارة', hint: '🚗', category: 'مواصلات', minAge: 7 },
  { word: 'طائرة', hint: '✈️', category: 'مواصلات', minAge: 7 },
  { word: 'مدرسة', hint: '🏫', category: 'أماكن', minAge: 7 },
  { word: 'تفاحة', hint: '🍎', category: 'فواكه', minAge: 6 },
  { word: 'موزة',  hint: '🍌', category: 'فواكه', minAge: 6 },
  { word: 'برتقال', hint: '🍊', category: 'فواكه', minAge: 7 },
  { word: 'قلم',   hint: '✏️', category: 'أدوات', minAge: 6 },
  { word: 'كرسي',  hint: '🪑', category: 'أثاث', minAge: 7 },
  { word: 'طاولة', hint: '🪵', category: 'أثاث', minAge: 7 },
  { word: 'حذاء',  hint: '👟', category: 'ملابس', minAge: 7 },
]

const WORDS_HARD: WordItem[] = [
  { word: 'مستشفى', hint: '🏥', category: 'أماكن', minAge: 9 },
  { word: 'حاسوب',  hint: '💻', category: 'أجهزة', minAge: 9 },
  { word: 'برنامج', hint: '📱', category: 'أجهزة', minAge: 10 },
  { word: 'تلفاز',  hint: '📺', category: 'أجهزة', minAge: 9 },
  { word: 'مكتبة',  hint: '📖', category: 'أماكن', minAge: 9 },
  { word: 'جامعة',  hint: '🎓', category: 'أماكن', minAge: 10 },
  { word: 'مطبخ',   hint: '🍳', category: 'أماكن', minAge: 9 },
  { word: 'حديقة',  hint: '🌳', category: 'أماكن', minAge: 9 },
]

function shuffleStr(rng: Rng, str: string): string {
  const arr = str.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  // Ensure it's different from the original
  if (arr.join('') === str && str.length > 1) {
    [arr[0], arr[arr.length - 1]] = [arr[arr.length - 1], arr[0]]
  }
  return arr.join('')
}

function getWordPool(rng: Rng, difficulty: 1|2|3, age: number): WordItem[] {
  let pool: WordItem[] = []
  if (difficulty >= 1) pool = [...pool, ...WORDS_EASY]
  if (difficulty >= 2) pool = [...pool, ...WORDS_MEDIUM.filter(w => !w.minAge || w.minAge <= age)]
  if (difficulty >= 3) pool = [...pool, ...WORDS_HARD.filter(w => !w.minAge || w.minAge <= age)]
  return shuffleWithRng(rng, pool)
}

export default function WordBuilder({ onComplete, onCancel, studentAge, difficulty = 1, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const ROUNDS = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6
  const pool   = useRef(getWordPool(rng, difficulty, studentAge))

  const [round, setRound]         = useState(0)
  const [wordItem, setWordItem]    = useState<WordItem>(pool.current[0])
  const [shuffled, setShuffled]    = useState<string[]>(() => shuffleStr(rng, pool.current[0].word).split(''))
  const [selected, setSelected]    = useState<string[]>([])
  const [usedIdxs, setUsedIdxs]   = useState<number[]>([])
  const [feedback, setFeedback]    = useState<'correct' | 'wrong' | null>(null)
  const [scores, setScores]        = useState<number[]>([])
  const [started, setStarted]      = useState(false)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function pickLetter(idx: number) {
    if (feedback !== null || usedIdxs.includes(idx)) return
    const newSelected = [...selected, shuffled[idx]]
    const newUsed     = [...usedIdxs, idx]
    setSelected(newSelected)
    setUsedIdxs(newUsed)

    if (newSelected.length === wordItem.word.length) {
      const built = newSelected.join('')
      const isCorrect = built === wordItem.word
      setFeedback(isCorrect ? 'correct' : 'wrong')
      const newScores = [...scores, isCorrect ? 100 : 0]
      setScores(newScores)
      onProgress?.({ answered: newScores.length, total: ROUNDS, correct: newScores.filter(s => s === 100).length, errors: newScores.filter(s => s === 0).length, lastCorrect: isCorrect })

      timerRef.current = setTimeout(() => {
        setFeedback(null)
        if (!isCorrect) {
          // Reset for retry
          setSelected([])
          setUsedIdxs([])
          return
        }
        if (round + 1 >= ROUNDS) {
          const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
          const dur = Math.round((Date.now() - startRef.current) / 1000)
          onComplete({
            exerciseType: 'word-builder',
            exerciseLabelAr: 'بناء الكلمة',
            score: avg,
            accuracy: avg,
            duration: dur,
            errors: newScores.filter(s => s === 0).length,
            metadata: { rounds: ROUNDS, scores: newScores },
            completedAt: new Date().toISOString(),
          })
        } else {
          const nextRound = round + 1
          const nextWord  = pool.current[nextRound % pool.current.length]
          setRound(nextRound)
          setWordItem(nextWord)
          setShuffled(shuffleStr(rng, nextWord.word).split(''))
          setSelected([])
          setUsedIdxs([])
        }
      }, 900)
    }
  }

  function removeLast() {
    if (selected.length === 0 || feedback !== null) return
    const lastUsed = usedIdxs[usedIdxs.length - 1]
    setSelected(prev => prev.slice(0, -1))
    setUsedIdxs(prev => prev.slice(0, -1))
    void lastUsed
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-7xl">🔤</div>
        <h2 className="text-white font-black text-2xl text-center">بناء الكلمة</h2>
        <div className="bg-white/5 rounded-2xl p-5 max-w-xs w-full text-center">
          <p className="text-white/70 text-sm leading-relaxed">
            تظهر حروف مبعثرة — رتّبها لتكوّن الكلمة الصحيحة بمساعدة الصورة التلميحية
          </p>
        </div>
        <div className="text-white/40 text-xs">{ROUNDS} كلمات</div>
        <button
          onClick={() => { startRef.current = Date.now(); setStarted(true) }}
          className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين 🚀
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  const correct = selected.join('') === wordItem.word.slice(0, selected.length)

  return (
    <div className="flex flex-col items-center h-full py-4 px-6">
      {/* Progress */}
      <div className="w-full max-w-xs mb-5">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>كلمة {round + 1} من {ROUNDS}</span>
          <span>صحيح: {scores.filter(s => s === 100).length}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${(round / ROUNDS) * 100}%` }} />
        </div>
      </div>

      {/* Hint */}
      <div
        className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center mb-4"
        style={{
          background: feedback === 'correct' ? '#ECFDF5' : feedback === 'wrong' ? '#FEF2F2' : '#F3EEFF',
          border: `2px solid ${feedback === 'correct' ? '#86EFAC' : feedback === 'wrong' ? '#FCA5A5' : '#D8C5FF'}`,
          transition: 'all 0.3s',
        }}
      >
        <div className="text-5xl">{wordItem.hint}</div>
        <div className="text-xs mt-1 font-bold" style={{ color: '#9CA3AF' }}>{wordItem.category}</div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`font-black text-lg mb-3 ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? '✓ أحسنت!' : '✗ حاول مرة أخرى'}
        </div>
      )}

      {/* Answer slots */}
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {Array.from({ length: wordItem.word.length }).map((_, i) => {
          const ch = selected[i]
          const isWrong = ch && wordItem.word[i] !== ch
          return (
            <div
              key={i}
              className="w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all"
              style={{
                borderColor: feedback === 'correct' ? '#22C55E' :
                             (ch && isWrong) ? '#EF4444' :
                             ch ? '#7C5CFC' : 'rgba(255,255,255,0.15)',
                background: feedback === 'correct' ? 'rgba(34,197,94,0.1)' :
                            (ch && isWrong) ? 'rgba(239,68,68,0.1)' :
                            ch ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
              }}
            >
              {ch || ''}
            </div>
          )
        })}
      </div>

      {/* Scrambled letters */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {shuffled.map((ch, idx) => {
          const used = usedIdxs.includes(idx)
          return (
            <button
              key={idx}
              onClick={() => pickLetter(idx)}
              disabled={used || feedback !== null}
              className="w-12 h-12 rounded-xl font-black text-xl transition-all active:scale-90"
              style={{
                background: used ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                border: used ? '1.5px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(255,255,255,0.2)',
                color: used ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                boxShadow: used ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                cursor: used ? 'default' : 'pointer',
              }}
            >
              {ch}
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={removeLast}
          disabled={selected.length === 0 || feedback !== null}
          className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: selected.length > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
          }}
        >
          ← حذف
        </button>
        <button
          onClick={() => { setSelected([]); setUsedIdxs([]) }}
          disabled={selected.length === 0 || feedback !== null}
          className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: 'rgba(239,68,68,0.15)',
            color: selected.length > 0 ? '#EF4444' : 'rgba(239,68,68,0.3)',
          }}
        >
          مسح الكل
        </button>
      </div>
    </div>
  )
}
