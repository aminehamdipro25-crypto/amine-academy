'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, pickWithRng, type Rng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

const COLORS = [
  { key: 'red',    label: 'أحمر',   hex: '#EF4444' },
  { key: 'blue',   label: 'أزرق',   hex: '#3B82F6' },
  { key: 'green',  label: 'أخضر',   hex: '#22C55E' },
  { key: 'yellow', label: 'أصفر',   hex: '#EAB308' },
  { key: 'purple', label: 'بنفسجي', hex: '#A855F7' },
  { key: 'orange', label: 'برتقالي',hex: '#F97316' },
  { key: 'pink',   label: 'وردي',   hex: '#EC4899' },
  { key: 'teal',   label: 'فيروزي', hex: '#14B8A6' },
]

function getConfig(difficulty: 1|2|3, age: number) {
  const isYoung = age <= 7
  const size    = difficulty === 1 ? (isYoung ? 3 : 4)
               : difficulty === 2 ? (isYoung ? 4 : 5)
               : (isYoung ? 4 : 6)
  const colors  = COLORS.slice(0, difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6)
  const studySec= difficulty === 1 ? 7 : difficulty === 2 ? 5 : 4
  return { size, colors, studySec }
}

function makeGrid(rng: Rng, size: number, colors: typeof COLORS): string[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => pickWithRng(rng, colors).key)
  )
}

export default function ColorGrid({ onComplete, onCancel, studentAge, difficulty = 1, seed }: Props) {
  const rng    = useRef(createRng(seed ?? Date.now())).current
  const cfg    = getConfig(difficulty, studentAge)
  const ROUNDS = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4

  const [phase, setPhase]     = useState<'intro' | 'study' | 'recall' | 'feedback' | 'done'>('intro')
  const [round, setRound]     = useState(0)
  const [target, setTarget]   = useState<string[][]>([])
  const [answer, setAnswer]   = useState<string[][]>([])
  const [selColor, setSelColor]= useState(cfg.colors[0].key)
  const [countdown, setCountdown] = useState(cfg.studySec)
  const [scores, setScores]   = useState<number[]>([])
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function startRound(r: number) {
    const grid = makeGrid(rng, cfg.size, cfg.colors)
    setTarget(grid)
    setAnswer(Array.from({ length: cfg.size }, () => Array(cfg.size).fill('')))
    setSelColor(cfg.colors[0].key)
    setCountdown(cfg.studySec)
    setPhase('study')
    setRound(r)
  }

  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) { setPhase('recall'); return }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, countdown])

  function paint(row: number, col: number) {
    if (phase !== 'recall') return
    setAnswer(prev => prev.map((r, ri) => r.map((c, ci) => ri === row && ci === col ? selColor : c)))
  }

  function checkAnswer() {
    let correct = 0
    const total = cfg.size * cfg.size
    for (let r = 0; r < cfg.size; r++)
      for (let c = 0; c < cfg.size; c++)
        if (answer[r][c] === target[r][c]) correct++

    const score = Math.round((correct / total) * 100)
    const newScores = [...scores, score]
    setScores(newScores)
    setPhase('feedback')

    if (round + 1 >= ROUNDS) {
      timerRef.current = setTimeout(() => {
        const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        onComplete({
          exerciseType: 'color-grid',
          exerciseLabelAr: 'لوحة الألوان',
          score: avg,
          accuracy: avg,
          duration: dur,
          errors: 0,
          metadata: { rounds: ROUNDS, scores: newScores, gridSize: cfg.size },
          completedAt: new Date().toISOString(),
        })
      }, 2000)
    } else {
      timerRef.current = setTimeout(() => startRound(round + 1), 2200)
    }
  }

  const colorMap = Object.fromEntries(cfg.colors.map(c => [c.key, c.hex]))

  // ── Intro ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="text-6xl">🎨</div>
        <h2 className="text-white font-black text-2xl text-center">لوحة الألوان</h2>
        <div className="bg-white/5 rounded-2xl p-5 max-w-xs w-full text-center">
          <p className="text-white/70 text-sm leading-relaxed">
            ستُعرض عليك شبكة ملونة لـ <span className="text-brand-300 font-black">{cfg.studySec} ثوانٍ</span>،
            ثم تختفي وتُعيد رسمها من الذاكرة!
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {cfg.colors.map(c => (
              <div key={c.key} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full border-2 border-white/20" style={{ background: c.hex }} />
                <span className="text-white/50 text-[10px]">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/50 text-xs">{ROUNDS} جولات • شبكة {cfg.size}×{cfg.size}</div>
        <button
          onClick={() => { startRef.current = Date.now(); startRound(0) }}
          className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          ابدأ التمرين 🚀
        </button>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">← إلغاء</button>
      </div>
    )
  }

  // ── Study ──────────────────────────────────────────────────────────
  if (phase === 'study') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <div className="flex items-center justify-between w-full max-w-xs">
          <div className="font-black text-white/60 text-sm">جولة {round + 1}/{ROUNDS}</div>
          <div
            className="font-black text-3xl ltr-num"
            style={{ color: countdown <= 2 ? '#EF4444' : '#7C5CFC' }}
          >
            {countdown}
          </div>
        </div>
        <p className="text-white/50 text-sm text-center">احفظ الألوان في ذاكرتك!</p>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cfg.size}, 1fr)`, maxWidth: 300 }}
        >
          {target.map((row, ri) =>
            row.map((col, ci) => (
              <div
                key={`${ri}-${ci}`}
                className="rounded-xl transition-transform"
                style={{
                  width: Math.min(52, 280 / cfg.size),
                  height: Math.min(52, 280 / cfg.size),
                  background: colorMap[col] || '#888',
                  boxShadow: `0 3px 8px ${colorMap[col] || '#888'}66`,
                  transform: countdown <= 1 ? 'scale(0.9)' : 'scale(1)',
                  opacity: countdown <= 1 ? 0.5 : 1,
                  transition: 'opacity 0.5s, transform 0.5s',
                }}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // ── Recall ──────────────────────────────────────────────────────────
  if (phase === 'recall') {
    const allFilled = answer.every(row => row.every(c => c !== ''))
    return (
      <div className="flex flex-col items-center h-full overflow-hidden py-4">
        <div className="flex items-center justify-between w-full px-4 mb-3">
          <p className="text-white/50 text-sm">أعد رسم الألوان من ذاكرتك</p>
          <div className="font-black text-white/50 text-sm">جولة {round + 1}/{ROUNDS}</div>
        </div>

        {/* Recall grid */}
        <div
          className="grid gap-2 mb-5"
          style={{ gridTemplateColumns: `repeat(${cfg.size}, 1fr)`, maxWidth: 300 }}
        >
          {answer.map((row, ri) =>
            row.map((col, ci) => (
              <button
                key={`${ri}-${ci}`}
                onClick={() => paint(ri, ci)}
                className="rounded-xl border-2 transition-all active:scale-95"
                style={{
                  width: Math.min(52, 280 / cfg.size),
                  height: Math.min(52, 280 / cfg.size),
                  background: col ? colorMap[col] : 'rgba(255,255,255,0.05)',
                  borderColor: col ? colorMap[col] : 'rgba(255,255,255,0.15)',
                  boxShadow: col ? `0 3px 8px ${colorMap[col]}55` : 'none',
                }}
              />
            ))
          )}
        </div>

        {/* Color palette */}
        <div className="flex gap-2 flex-wrap justify-center mb-4 px-4">
          {cfg.colors.map(c => (
            <button
              key={c.key}
              onClick={() => setSelColor(c.key)}
              className="rounded-full transition-all active:scale-90"
              style={{
                width: 40,
                height: 40,
                background: c.hex,
                boxShadow: selColor === c.key
                  ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${c.hex}`
                  : `0 3px 8px ${c.hex}66`,
                transform: selColor === c.key ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <button
          onClick={checkAnswer}
          disabled={!allFilled}
          className="w-full max-w-xs mx-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-colors"
        >
          تحقق من الإجابة ✓
        </button>
      </div>
    )
  }

  // ── Feedback ───────────────────────────────────────────────────────
  if (phase === 'feedback') {
    const lastScore = scores[scores.length - 1]
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div className="text-6xl">{lastScore >= 80 ? '🏆' : lastScore >= 60 ? '⭐' : '💪'}</div>
        <div className="font-black text-5xl" style={{ color: lastScore >= 80 ? '#22C55E' : lastScore >= 60 ? '#F59E0B' : '#EF4444' }}>
          {lastScore}%
        </div>
        <p className="text-white/60 text-sm">
          {lastScore >= 80 ? 'ذاكرة ممتازة!' : lastScore >= 60 ? 'جيد جداً، استمر!' : 'حاول مرة أخرى!'}
        </p>
        {/* Compare grids */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-white/40 text-[10px] mb-1">الهدف</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cfg.size}, 1fr)` }}>
              {target.map((row, ri) => row.map((col, ci) => (
                <div key={`t-${ri}-${ci}`} className="rounded" style={{ width: 18, height: 18, background: colorMap[col] || '#888' }} />
              )))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-[10px] mb-1">إجابتك</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cfg.size}, 1fr)` }}>
              {answer.map((row, ri) => row.map((col, ci) => (
                <div
                  key={`a-${ri}-${ci}`}
                  className="rounded"
                  style={{
                    width: 18, height: 18,
                    background: colorMap[col] || 'rgba(255,255,255,0.1)',
                    outline: col === target[ri]?.[ci] ? '2px solid #22C55E' : '2px solid #EF4444',
                    outlineOffset: 1,
                  }}
                />
              )))}
            </div>
          </div>
        </div>
        {round + 1 < ROUNDS && (
          <p className="text-white/40 text-xs">جولة {round + 2} تبدأ تلقائياً...</p>
        )}
      </div>
    )
  }

  return null
}
