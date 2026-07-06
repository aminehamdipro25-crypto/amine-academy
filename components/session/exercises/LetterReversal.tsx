'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic } from '@/lib/speech'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

interface Q {
  display:  string
  target:   string
  choices:  string[]
  type:     'letter' | 'word'
}

// ── d=1: single letter discrimination — confusable Arabic letter pairs ─────────
const LETTER_QS: Q[] = [
  { display:'ب', target:'ب', choices:['ب','ت','ث','ن'],   type:'letter' },
  { display:'ت', target:'ت', choices:['ب','ت','ث','ي'],   type:'letter' },
  { display:'ث', target:'ث', choices:['ب','ت','ث','ن'],   type:'letter' },
  { display:'ج', target:'ج', choices:['ح','ج','خ','ع'],   type:'letter' },
  { display:'ح', target:'ح', choices:['ح','ج','خ','ه'],   type:'letter' },
  { display:'خ', target:'خ', choices:['ح','ج','خ','غ'],   type:'letter' },
  { display:'س', target:'س', choices:['س','ش','ص','ض'],   type:'letter' },
  { display:'ش', target:'ش', choices:['س','ش','ص','ث'],   type:'letter' },
  { display:'ص', target:'ص', choices:['ص','ض','ظ','ط'],   type:'letter' },
  { display:'ض', target:'ض', choices:['ص','ض','ظ','ط'],   type:'letter' },
  { display:'ط', target:'ط', choices:['ط','ظ','ض','ص'],   type:'letter' },
  { display:'ظ', target:'ظ', choices:['ط','ظ','ض','ص'],   type:'letter' },
  { display:'ع', target:'ع', choices:['ع','غ','ح','خ'],   type:'letter' },
  { display:'غ', target:'غ', choices:['ع','غ','ح','ج'],   type:'letter' },
  { display:'ر', target:'ر', choices:['ر','ز','و','ن'],   type:'letter' },
  { display:'ز', target:'ز', choices:['ر','ز','ذ','ن'],   type:'letter' },
  { display:'ف', target:'ف', choices:['ف','ق','ن','ب'],   type:'letter' },
  { display:'ق', target:'ق', choices:['ف','ق','ن','ي'],   type:'letter' },
]

// ── d=2: find the correctly-spelled word ───────────────────────────────────────
const WORD_QS: Q[] = [
  { display:'🏠 اختر الكتابة الصحيحة', target:'بيت',  choices:['بيت','تيت','بيث','نيت'],     type:'word' },
  { display:'🌞 اختر الكتابة الصحيحة', target:'شمس',  choices:['شمس','سمس','شمص','شمث'],     type:'word' },
  { display:'🐱 اختر الكتابة الصحيحة', target:'قطة',  choices:['قطة','فطة','قطب','قطث'],     type:'word' },
  { display:'✏️ اختر الكتابة الصحيحة', target:'قلم',  choices:['قلم','فلم','كلم','قلن'],     type:'word' },
  { display:'📚 اختر الكتابة الصحيحة', target:'كتاب', choices:['كتاب','كتاث','كتات','ختاب'], type:'word' },
  { display:'🐟 اختر الكتابة الصحيحة', target:'سمكة', choices:['سمكة','شمكة','سمقة','صمكة'], type:'word' },
  { display:'🌙 اختر الكتابة الصحيحة', target:'قمر',  choices:['قمر','فمر','قمز','كمر'],     type:'word' },
  { display:'💧 اختر الكتابة الصحيحة', target:'ماء',  choices:['ماء','ناء','ماث','ماه'],     type:'word' },
  { display:'🌳 اختر الكتابة الصحيحة', target:'شجرة', choices:['شجرة','سجرة','شجزة','شحرة'], type:'word' },
  { display:'⭐ اختر الكتابة الصحيحة', target:'نجمة', choices:['نجمة','نحمة','نخمة','نجنة'], type:'word' },
]

// ── d=3: harder pairs — spot the one correct word ──────────────────────────────
const HARD_QS: Q[] = [
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'جبل',  choices:['حبل','جبل','خبل','جبن'],     type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'حليب', choices:['جليب','حليب','خليب','حليث'],  type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'صديق', choices:['صديق','سديق','ضديق','صديغ'],  type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'طريق', choices:['طريق','ظريق','طريك','طريف'],  type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'ضوء',  choices:['ظوء','ضوء','صوء','ضوذ'],     type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'عقرب', choices:['عقرب','غقرب','عقرث','عقزب'], type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'حديقة',choices:['حديقة','جديقة','خديقة','حديكة'],type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'ظرف',  choices:['ظرف','ضرف','طرف','ذرف'],     type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'خزانة',choices:['خزانة','حزانة','غزانة','خذانة'],type:'word' },
  { display:'أيّ كلمة مكتوبة بشكل صحيح؟', target:'تلميذ',choices:['تلميذ','تلميز','ثلميذ','تلمث'],type:'word' },
]

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function speak(text: string) {
  speakArabic(text, 0.75)
}

export default function LetterReversal({ onComplete, onCancel, difficulty = 1, studentAge }: Props) {
  const isYoung = studentAge < 9

  const allQs: Q[] = useMemo(() => {
    if (difficulty === 1) return LETTER_QS.slice(0, 8)
    if (difficulty === 2) return [...LETTER_QS.slice(0, 6), ...WORD_QS.slice(0, 6)]
    return [...LETTER_QS.slice(0, 4), ...WORD_QS.slice(0, 6), ...HARD_QS.slice(0, 10)]
  }, [difficulty])

  const count = allQs.length

  const [idx,     setIdx]     = useState(0)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [errors,  setErrors]  = useState(0)
  const [startMs]             = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const q = allQs[idx]
  const choices = useMemo(() => shuffle([...q.choices]), [idx]) // eslint-disable-line

  function handleChoice(c: string) {
    if (chosen) return
    setChosen(c)
    const isCorrect = c === q.target
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) { setCorrect(nc); speak('ممتاز') }
    else           { setErrors(ne);  speak(q.target) }

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= count) {
        onComplete({
          exerciseType:    'letter-reversal',
          exerciseLabelAr: 'تمييز الحروف',
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
    }, 1400)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none" dir="rtl">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-[#7C5CFC]">{idx + 1}/{count}</div>
          <div className="text-xs text-white/50">سؤال</div>
        </div>
        <h2 className="text-xl font-black text-white">تمييز الحروف</h2>
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{correct}</div>
          <div className="text-xs text-white/50">صحيح</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, ((idx + (chosen ? 1 : 0)) / count) * 100)}%`, background: '#7C5CFC' }} />
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <p className="text-white/70 text-sm font-bold">
          {q.type === 'letter' ? 'اختر الحرف المطابق لهذا الحرف:' : q.display}
        </p>

        {q.type === 'letter' && (
          <>
            <button
              onClick={() => speak(q.target)}
              className="w-36 h-36 rounded-3xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'rgba(124,92,252,0.2)', border: '3px solid rgba(124,92,252,0.6)' }}
            >
              <span className="font-black text-white" style={{ fontSize: isYoung ? 80 : 64 }}>{q.display}</span>
            </button>
            <button onClick={() => speak(q.target)} className="text-white/40 text-xs hover:text-white/70 transition-colors">
              🔊 اسمع الحرف
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {choices.map(c => {
          const isChosen  = c === chosen
          const isCor     = c === q.target
          let bg = 'rgba(255,255,255,0.06)'; let bdr = 'rgba(255,255,255,0.15)'; let col = 'white'
          if (isChosen && isCor)            { bg = 'rgba(34,197,94,0.25)';  bdr = '#22c55e'; col = '#86efac' }
          if (isChosen && !isCor)           { bg = 'rgba(239,68,68,0.25)';  bdr = '#ef4444'; col = '#fca5a5' }
          if (chosen && !isChosen && isCor) { bg = 'rgba(34,197,94,0.12)';  bdr = 'rgba(34,197,94,0.4)'; col = '#86efac' }
          return (
            <button
              key={c}
              onClick={() => { speak(c); handleChoice(c) }}
              disabled={!!chosen}
              className="py-5 rounded-2xl border-2 font-black text-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              style={{ background: bg, borderColor: bdr, color: col, fontSize: q.type === 'word' ? 22 : (isYoung ? 52 : 40) }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="text-2xl font-black" style={{ color: chosen === q.target ? '#22c55e' : '#ef4444' }}>
          {chosen === q.target ? '✅ ممتاز!' : `❌ الصحيح: ${q.target}`}
        </div>
      )}

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
