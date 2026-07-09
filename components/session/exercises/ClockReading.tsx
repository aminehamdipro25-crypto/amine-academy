'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
  onProgress?: (p: ExerciseProgressUpdate) => void // live per-answer feedback to the specialist
}

interface CQ {
  h:       number
  m:       number
  label:   string
  choices: [string, string, string, string]
}

// ── d=1: exact hours only ──────────────────────────────────────────────────────
const HOUR_QS: CQ[] = [
  { h:3,  m:0,  label:'الثالثة',        choices:['الثالثة','السادسة','التاسعة','الحادية عشرة'] },
  { h:6,  m:0,  label:'السادسة',        choices:['الثالثة','السادسة','الثانية عشرة','التاسعة'] },
  { h:9,  m:0,  label:'التاسعة',        choices:['التاسعة','الثانية','السادسة','الحادية عشرة'] },
  { h:12, m:0,  label:'الثانية عشرة',   choices:['الثانية عشرة','الثالثة','السادسة','التاسعة'] },
  { h:1,  m:0,  label:'الواحدة',        choices:['الواحدة','الثانية','الثالثة','الرابعة'] },
  { h:8,  m:0,  label:'الثامنة',        choices:['الثامنة','السابعة','التاسعة','السادسة'] },
  { h:4,  m:0,  label:'الرابعة',        choices:['الرابعة','الخامسة','الثالثة','السادسة'] },
  { h:11, m:0,  label:'الحادية عشرة',   choices:['الحادية عشرة','العاشرة','الثانية عشرة','الثامنة'] },
]

// ── d=2: half hours ────────────────────────────────────────────────────────────
const HALF_QS: CQ[] = [
  { h:3,  m:30, label:'الثالثة والنصف',       choices:['الثالثة والنصف','الثالثة','السادسة والنصف','التاسعة والنصف'] },
  { h:6,  m:30, label:'السادسة والنصف',        choices:['السادسة والنصف','السادسة','الثالثة والنصف','التاسعة والنصف'] },
  { h:9,  m:30, label:'التاسعة والنصف',        choices:['التاسعة والنصف','التاسعة','السادسة والنصف','الثانية عشرة والنصف'] },
  { h:12, m:30, label:'الثانية عشرة والنصف',  choices:['الثانية عشرة والنصف','الثانية عشرة','الواحدة والنصف','السادسة والنصف'] },
  { h:1,  m:30, label:'الواحدة والنصف',        choices:['الواحدة والنصف','الواحدة','الثانية والنصف','الثالثة والنصف'] },
  { h:7,  m:30, label:'السابعة والنصف',        choices:['السابعة والنصف','السابعة','الثامنة والنصف','السادسة والنصف'] },
  { h:4,  m:30, label:'الرابعة والنصف',        choices:['الرابعة والنصف','الرابعة','الخامسة والنصف','الثالثة والنصف'] },
  { h:10, m:30, label:'العاشرة والنصف',        choices:['العاشرة والنصف','العاشرة','الحادية عشرة والنصف','التاسعة والنصف'] },
]

// ── d=3: quarter hours and 5-min intervals ─────────────────────────────────────
const QUARTER_QS: CQ[] = [
  { h:3,  m:15, label:'الثالثة والربع',        choices:['الثالثة والربع','الثالثة والنصف','الثالثة إلا ربع','الرابعة والربع'] },
  { h:6,  m:45, label:'السادسة إلا ربع',       choices:['السادسة إلا ربع','السادسة والربع','السادسة والنصف','السابعة إلا ربع'] },
  { h:9,  m:15, label:'التاسعة والربع',         choices:['التاسعة والربع','التاسعة والنصف','التاسعة إلا ربع','العاشرة والربع'] },
  { h:2,  m:45, label:'الثانية إلا ربع',        choices:['الثانية إلا ربع','الثانية والربع','الثالثة إلا ربع','الواحدة إلا ربع'] },
  { h:8,  m:20, label:'الثامنة وعشرون دقيقة',  choices:['الثامنة وعشرون دقيقة','الثامنة وعشر دقائق','الثامنة والنصف','الثامنة وخمس عشرة دقيقة'] },
  { h:5,  m:40, label:'الخامسة وأربعون دقيقة', choices:['الخامسة وأربعون دقيقة','الخامسة وعشرون دقيقة','السادسة إلا ربع','الخامسة والنصف'] },
  { h:11, m:10, label:'الحادية عشرة وعشر دقائق', choices:['الحادية عشرة وعشر دقائق','الحادية عشرة وعشرون دقيقة','الحادية عشرة وخمس دقائق','الحادية عشرة والربع'] },
  { h:1,  m:50, label:'الواحدة وخمسون دقيقة', choices:['الواحدة وخمسون دقيقة','الواحدة والربع','الثانية إلا عشر دقائق','الواحدة وأربعون دقيقة'] },
]

function ClockFace({ h, m, size = 190 }: { h: number; m: number; size?: number }) {
  const cx = 100; const cy = 100; const R = 85
  const hourAngle = ((h % 12) * 30 + m * 0.5 - 90) * Math.PI / 180
  const minAngle  = (m * 6 - 90) * Math.PI / 180
  const hx = cx + Math.cos(hourAngle) * 48
  const hy = cy + Math.sin(hourAngle) * 48
  const mx = cx + Math.cos(minAngle) * 68
  const my = cy + Math.sin(minAngle) * 68

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a   = (i * 30 - 90) * Math.PI / 180
    const big = i % 3 === 0
    const x1  = cx + Math.cos(a) * (R - (big ? 14 : 8))
    const y1  = cy + Math.sin(a) * (R - (big ? 14 : 8))
    const x2  = cx + Math.cos(a) * R
    const y2  = cy + Math.sin(a) * R
    const tx  = cx + Math.cos(a) * (R - 26)
    const ty  = cy + Math.sin(a) * (R - 26)
    return { x1, y1, x2, y2, tx, ty, num: i === 0 ? 12 : i, big }
  })

  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      <circle cx={cx} cy={cy} r={R + 4} fill="white" stroke="#6B46F0" strokeWidth={6} />
      <circle cx={cx} cy={cy} r={R} fill="#FAFAFE" />
      {ticks.map(({ x1, y1, x2, y2, tx, ty, num, big }) => (
        <g key={num}>
          <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={big ? '#1E293B' : '#CBD5E1'}
            strokeWidth={big ? 3 : 1.5} strokeLinecap="round" />
          {big && (
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
              fontSize={13} fontWeight="bold" fill="#1E293B" fontFamily="sans-serif">
              {num}
            </text>
          )}
        </g>
      ))}
      {/* Hour hand — short and thick */}
      <line x1={cx} y1={cy} x2={hx} y2={hy}
        stroke="#1E293B" strokeWidth={6} strokeLinecap="round" />
      {/* Minute hand — long and thinner */}
      <line x1={cx} y1={cy} x2={mx} y2={my}
        stroke="#6B46F0" strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#1E293B" />
      <circle cx={cx} cy={cy} r={2.5} fill="#6B46F0" />
    </svg>
  )
}

export default function ClockReading({ onComplete, onCancel, difficulty = 1, studentAge, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const qs = useMemo<CQ[]>(() => {
    if (difficulty === 1) return shuffleWithRng(rng, HOUR_QS)
    if (difficulty === 2) return shuffleWithRng(rng, [...HOUR_QS.slice(0, 4), ...HALF_QS])
    return shuffleWithRng(rng, [...HALF_QS.slice(0, 4), ...QUARTER_QS])
  }, [difficulty])

  const isYoung = studentAge < 8
  const count   = difficulty === 1
    ? (isYoung ? 4 : 6)
    : difficulty === 2 ? 8 : 10
  const subset  = qs.slice(0, count)

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = subset[idx]
  const choices = useMemo(() => shuffleWithRng(rng, [...q.choices]), [idx]) // eslint-disable-line

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === q.label
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)
    onProgress?.({ answered: idx + 1, total: count, correct: nc, errors: ne, lastCorrect: isCorrect })

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= count) {
        onComplete({
          exerciseType:    'clock-reading',
          exerciseLabelAr: 'قراءة الساعة',
          score:    Math.round((nc / count) * 100),
          accuracy: Math.round((nc / count) * 100),
          duration: Math.round((Date.now() - startMs) / 1000),
          errors:   ne,
          metadata: { total: count, correct: nc, difficulty },
          completedAt: new Date().toISOString(),
        })
      } else {
        setIdx(i => i + 1)
        setChosen(null)
      }
    }, 1600)
  }

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">قراءة الساعة</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${(idx / count) * 100}%`, background: '#7C5CFC' }} />
      </div>

      <p className="text-white/60 text-sm font-bold">كم الساعة الآن؟</p>

      <div className="rounded-3xl p-4 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(107,70,240,0.3)' }}>
        <ClockFace h={q.h} m={q.m} size={isYoung ? 210 : 190} />
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {choices.map(c => {
          const isChosen  = c === chosen
          const isCor     = c === q.label
          let bg  = 'rgba(255,255,255,0.06)'; let bdr = 'rgba(255,255,255,0.15)'; let col = 'white'
          if (isChosen && isCor)            { bg = 'rgba(34,197,94,0.25)';  bdr = '#22c55e'; col = '#86efac' }
          if (isChosen && !isCor)           { bg = 'rgba(239,68,68,0.25)';  bdr = '#ef4444'; col = '#fca5a5' }
          if (chosen && !isChosen && isCor) { bg = 'rgba(34,197,94,0.12)';  bdr = 'rgba(34,197,94,0.4)'; col = '#86efac' }
          return (
            <button
              key={c}
              onClick={() => handleChoice(c)}
              disabled={!!chosen}
              className="py-3 px-3 rounded-2xl border-2 font-bold text-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed text-sm leading-snug"
              style={{ background: bg, borderColor: bdr, color: col }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="text-2xl font-black" style={{ color: chosen === q.label ? '#22c55e' : '#ef4444' }}>
          {chosen === q.label ? '✅ ممتاز!' : `❌ الصحيح: ${q.label}`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
