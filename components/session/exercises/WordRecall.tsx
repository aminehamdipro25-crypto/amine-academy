'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

const WORD_BANK = [
  'شمس','قمر','نجم','بحر','جبل','شجرة','زهرة','طائر','سمكة','فيل',
  'أسد','قطة','كلب','حصان','أرنب','تفاحة','موزة','برتقالة','عنب','فراولة',
  'كتاب','قلم','مدرسة','بيت','سيارة','طائرة','قطار','دراجة','كرة','لعبة',
  'أحمر','أزرق','أخضر','أصفر','أبيض','أسود','بنفسجي','بني','وردي','رمادي',
  'أم','أب','أخ','أخت','جد','جدة','عم','خال','صديق','معلم',
  'باب','نافذة','طاولة','كرسي','سرير','مرآة','ساعة','مفتاح','حقيبة','مظلة',
  'غيمة','مطر','ثلج','رياح','رمل','صخرة','وادي','صحراء','واحة','نهر',
]

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number // shared seed for identical content on both screens — see lib/seeded-random.ts
}

interface ResultData { hits: number; falseAlarms: number; acc: number; dur: number }

export default function WordRecall({ onComplete, onCancel, studentAge: _studentAge, difficulty = 1, seed }: Props) {
  const rng = useRef(createRng(seed ?? Date.now())).current
  const wordCount   = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
  const displayTime = difficulty === 1 ? 10 : difficulty === 2 ? 8 : 6
  const startRef    = useRef(Date.now())
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phase,       setPhase]       = useState<'study'|'recall'|'done'>('study')
  const [targetWords, setTargetWords] = useState<string[]>([])
  const [allChoices,  setAllChoices]  = useState<string[]>([])
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [countdown,   setCountdown]   = useState(displayTime)
  const [result,      setResult]      = useState<ResultData | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  useEffect(() => {
    const shuffled = shuffleWithRng(rng, WORD_BANK)
    const targets = shuffled.slice(0, wordCount)
    const distractors = shuffled.slice(wordCount, wordCount + wordCount)
    const choices = shuffleWithRng(rng, [...targets, ...distractors])
    setTargetWords(targets)
    setAllChoices(choices)
    setCountdown(displayTime)
  }, [wordCount, displayTime])

  useEffect(() => {
    if (phase !== 'study') return
    if (countdown <= 0) { setPhase('recall'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, phase])

  function toggle(word: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(word) ? n.delete(word) : n.add(word)
      return n
    })
  }

  function submit() {
    const hits        = Array.from(selected).filter(w => targetWords.includes(w)).length
    const falseAlarms = Array.from(selected).filter(w => !targetWords.includes(w)).length
    const dur         = Math.round((Date.now() - startRef.current) / 1000)
    const acc         = Math.max(0, Math.round(((hits - falseAlarms) / wordCount) * 100))
    setResult({ hits, falseAlarms, acc, dur })
    setPhase('done')
    timerRef.current = setTimeout(() => {
      onComplete({
        exerciseType:    'word-recall',
        exerciseLabelAr: 'تذكر الكلمات',
        score:    acc,
        accuracy: acc,
        duration: dur,
        errors:   falseAlarms,
        metadata: { wordsRecalled: hits, totalWords: wordCount, falseAlarms },
        completedAt: new Date().toISOString(),
      })
    }, 2000)
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const emoji = result.acc >= 80 ? '🏆' : result.acc >= 50 ? '⭐' : '💪'
    const msg   = result.acc >= 80 ? 'ممتاز! ذاكرتك قوية جداً!' : result.acc >= 50 ? 'جيد! واصل التدريب!' : 'لا بأس، التدريب يقوي الذاكرة!'
    return (
      <div className="flex flex-col items-center gap-5 p-8 text-center select-none" dir="rtl">
        <div className="text-7xl">{emoji}</div>
        <div className="text-2xl font-black text-white">{msg}</div>
        <div className="flex gap-6 mt-2">
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">{result.hits}</div>
            <div className="text-xs text-white/50">كلمة صحيحة</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-[#7C5CFC]">{result.acc}%</div>
            <div className="text-xs text-white/50">النتيجة</div>
          </div>
          {result.falseAlarms > 0 && (
            <div className="text-center">
              <div className="text-3xl font-black text-red-400">{result.falseAlarms}</div>
              <div className="text-xs text-white/50">اختيار خاطئ</div>
            </div>
          )}
        </div>
        <div className="text-white/40 text-sm mt-2">تنتقل تلقائياً...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none max-w-lg mx-auto w-full" dir="rtl">
      <h2 className="text-xl font-black text-white">تذكر الكلمات</h2>

      {phase === 'study' && (
        <>
          <div className={`text-5xl font-black ${countdown <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
            {countdown}
          </div>
          <p className="text-white/60 text-sm text-center">تذكر هذه الكلمات جيداً:</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {targetWords.map(w => (
              <div key={w}
                className="rounded-2xl p-4 text-center text-2xl font-black text-white"
                style={{ background:'rgba(124,92,252,0.2)', border:'2px solid rgba(124,92,252,0.5)' }}>
                {w}
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs">ستختفي الكلمات بعد {countdown} ثانية</p>
        </>
      )}

      {phase === 'recall' && (
        <>
          <p className="text-white/80 text-sm font-bold text-center">اختر الكلمات التي تتذكرها:</p>
          <p className="text-white/40 text-xs text-center">({selected.size} محددة)</p>
          <div className="grid grid-cols-3 gap-2 w-full">
            {allChoices.map(w => (
              <button key={w}
                onClick={() => toggle(w)}
                className="p-3 rounded-xl border-2 font-bold text-lg transition-all active:scale-95"
                style={{
                  background:   selected.has(w) ? 'rgba(107,70,240,0.35)' : 'rgba(255,255,255,0.05)',
                  borderColor:  selected.has(w) ? '#7C5CFC' : 'rgba(255,255,255,0.15)',
                  color:        selected.has(w) ? 'white' : 'rgba(255,255,255,0.6)',
                  transform:    selected.has(w) ? 'scale(1.05)' : undefined,
                }}>
                {w}
              </button>
            ))}
          </div>
          <button onClick={submit}
            className="w-full text-white font-black py-4 rounded-2xl text-lg transition-colors active:scale-95"
            style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            تأكيد ✓
          </button>
        </>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
