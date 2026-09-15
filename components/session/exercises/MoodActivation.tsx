'use client'
// Behavioural activation — the child rates their mood, does one pleasant
// activity, then rates it again.
//
// This does NOT treat low mood; see lib/mood-activation.ts for the scope note.
// It schedules activity and measures what that does to this child's mood, which
// is both inside an adapted-physical-activity specialist's lane and the one
// mechanism with real evidence that they can offer.
//
// Deliberately never celebrates an improvement: a child rewarded for reporting
// a better mood learns to report one, and the honest rating is the only thing
// here worth having.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'
import {
  MOOD_FACES,
  activitiesForAge,
  readMoodChange,
  type MoodLevel,
  type PleasantActivity,
} from '@/lib/mood-activation'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
  seed?: number
  onProgress?: (p: ExerciseProgressUpdate) => void
}

type Phase = 'before' | 'choose' | 'doing' | 'after' | 'done'

export default function MoodActivation({ onComplete, onCancel, studentAge, seed, onProgress }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<Phase>('before')
  const [before, setBefore] = useState<MoodLevel | null>(null)
  const [after, setAfter] = useState<MoodLevel | null>(null)
  const [activity, setActivity] = useState<PleasantActivity | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Offer a handful, not the whole menu: choosing is harder with low mood.
  // Shuffled from the shared seed so specialist and child see the same options.
  const options = useMemo(() => {
    const usable = activitiesForAge(studentAge)
    return shuffleWithRng(rng, usable).slice(0, 6)
  }, [studentAge, rng])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function pickBefore(level: MoodLevel) {
    setBefore(level)
    setPhase('choose')
    onProgress?.({ answered: 1, total: 3, correct: 0, errors: 0 })
  }

  function pickActivity(a: PleasantActivity) {
    setActivity(a)
    setPhase('doing')
    setSecondsLeft(a.minutes * 60)
    onProgress?.({ answered: 2, total: 3, correct: 0, errors: 0 })
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setPhase('after')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function finishEarly() {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('after')
  }

  function pickAfter(level: MoodLevel) {
    if (before === null || !activity) return
    setAfter(level)
    setPhase('done')
    onProgress?.({ answered: 3, total: 3, correct: 0, errors: 0 })
    // Deliberately does NOT call onComplete here. The host closes the exercise
    // as soon as it fires, which would unmount this before the child ever reads
    // the message — and that message, especially when mood did not lift, is the
    // part that must not be skipped. It fires when they dismiss the screen.
  }

  function finishAndReport() {
    if (before === null || after === null || !activity) { onCancel(); return }
    const change = readMoodChange(before, after)
    onComplete({
      exerciseType: 'mood-activation',
      exerciseLabelAr: 'تنشيط سلوكي — نشاط ومزاج',
      // There is no right answer here, so a percentage score would be a lie.
      // 0 keeps it out of accuracy averages; the reading lives in metadata.
      score: 0,
      accuracy: 0,
      duration: Math.round((Date.now() - startRef.current) / 1000),
      errors: 0,
      metadata: {
        moodBefore: before,
        moodAfter: after,
        moodDelta: change.delta,
        outcome: change.outcome,
        needsAttention: change.needsAttention,
        activityId: activity.id,
        activityLabel: activity.label,
        specialistNote: change.specialistNote,
      },
      completedAt: new Date().toISOString(),
    })
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  function MoodRow({ onPick, title }: { onPick: (l: MoodLevel) => void; title: string }) {
    return (
      <>
        <h2 className="text-white font-black text-xl mb-6 text-center">{title}</h2>
        <div className="flex gap-3 flex-wrap justify-center">
          {MOOD_FACES.map(f => (
            <button key={f.level} type="button" onClick={() => onPick(f.level)}
              aria-label={f.label}
              className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border-2 transition-transform hover:scale-105"
              style={{ borderColor: f.color, background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-4xl">{f.emoji}</span>
              <span className="text-xs font-bold" style={{ color: f.color }}>{f.label}</span>
            </button>
          ))}
        </div>
      </>
    )
  }

  const change = before !== null && after !== null ? readMoodChange(before, after) : null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {phase === 'before' && (
        <MoodRow title="كيف تشعر الآن؟" onPick={pickBefore} />
      )}

      {phase === 'choose' && (
        <>
          <h2 className="text-white font-black text-xl mb-2 text-center">اختر نشاطاً واحداً تجرّبه الآن</h2>
          <p className="text-gray-400 text-sm mb-6 text-center">لا يوجد اختيار صحيح — اختر ما تميل إليه.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
            {options.map(a => (
              <button key={a.id} type="button" onClick={() => pickActivity(a)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-3xl">{a.emoji}</span>
                <span className="text-white text-sm font-bold text-center leading-snug">{a.label}</span>
                <span className="text-gray-400 text-xs ltr-num">{a.minutes} دقيقة</span>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'doing' && activity && (
        <>
          <span className="text-6xl mb-4">{activity.emoji}</span>
          <h2 className="text-white font-black text-xl mb-2 text-center">{activity.label}</h2>
          <p className="text-5xl font-black text-white my-6 ltr-num">{fmt(secondsLeft)}</p>
          <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
            ابدأ الآن. إن أردت التوقف قبل انتهاء الوقت فلا بأس — الأهم أنك بدأت.
          </p>
          <button type="button" onClick={finishEarly}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            انتهيت
          </button>
        </>
      )}

      {phase === 'after' && (
        <MoodRow title="والآن، كيف تشعر؟" onPick={pickAfter} />
      )}

      {phase === 'done' && change && (
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-5xl">{MOOD_FACES.find(f => f.level === change.before)?.emoji}</span>
            <span className="text-3xl text-gray-500">←</span>
            <span className="text-5xl">{MOOD_FACES.find(f => f.level === change.after)?.emoji}</span>
          </div>
          <p className="text-white text-base leading-relaxed mb-8">{change.childMessage}</p>
          <button type="button" onClick={finishAndReport}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            تم
          </button>
        </div>
      )}

      {phase !== 'done' && (
        <button type="button" onClick={onCancel}
          className="mt-8 text-gray-500 hover:text-gray-300 text-sm font-bold transition-colors">
          إنهاء
        </button>
      )}
    </div>
  )
}
