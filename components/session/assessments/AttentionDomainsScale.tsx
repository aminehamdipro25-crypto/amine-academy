'use client'
import { useState } from 'react'
import type { AssessmentResult } from '@/lib/types'

const DOMAINS = [
  { key: 'sustained',  label: '⏱️ الانتباه المستمر',    protocol: 'CPT Protocol' },
  { key: 'selective',  label: '🎯 الانتباه الانتقائي',  protocol: 'Go/No-Go' },
  { key: 'executive',  label: '🧩 الانتباه التنفيذي',   protocol: 'DIT Protocol' },
  { key: 'inhibition', label: '🛑 كبح المشتتات',         protocol: 'Cogmed-style' },
]

const ITEMS = [
  // Sustained Attention
  { id: 's1', domain: 'sustained',  text: 'يجد صعوبة في إكمال نشاط يتطلب تركيزاً لأكثر من 5 دقائق' },
  { id: 's2', domain: 'sustained',  text: 'ينتهي اهتمامه بالنشاط بسرعة قبل إكماله حتى لو كان يحبه' },
  { id: 's3', domain: 'sustained',  text: 'يحتاج إلى تذكير متكرر لإعادته إلى المهمة' },
  { id: 's4', domain: 'sustained',  text: 'يبدأ نشاطاً جديداً قبل الانتهاء من السابق' },
  { id: 's5', domain: 'sustained',  text: 'تتراجع جودة تركيزه كلما طال وقت المهمة' },
  // Selective Attention
  { id: 'e1', domain: 'selective',  text: 'يتشتت انتباهه بسهولة بسبب الأصوات المحيطة' },
  { id: 'e2', domain: 'selective',  text: 'ينجذب انتباهه لكل حركة أو شيء جديد في المحيط' },
  { id: 'e3', domain: 'selective',  text: 'يجد صعوبة في التركيز على شيء واحد عند وجود مشتتات' },
  { id: 'e4', domain: 'selective',  text: 'يصعب عليه تجاهل ما لا علاقة له بالمهمة' },
  { id: 'e5', domain: 'selective',  text: 'يجد صعوبة في استعادة التركيز بعد أي انقطاع' },
  // Executive Attention
  { id: 'x1', domain: 'executive',  text: 'يتصرف بتهور دون التفكير في العواقب' },
  { id: 'x2', domain: 'executive',  text: 'يجد صعوبة في تنظيم مهامه وترتيب أولوياته' },
  { id: 'x3', domain: 'executive',  text: 'يواجه صعوبة في الانتقال من نشاط لآخر' },
  { id: 'x4', domain: 'executive',  text: 'يجد صعوبة في اتباع تعليمات متعددة الخطوات' },
  { id: 'x5', domain: 'executive',  text: 'يواجه صعوبة في كبح انفعالاته عند الإحباط' },
  // Distraction Inhibition
  { id: 'i1', domain: 'inhibition', text: 'يتحرك باستمرار ولا يستطيع الجلوس هادئاً لوقت كافٍ' },
  { id: 'i2', domain: 'inhibition', text: 'يُصدر أصواتاً أو يتكلم بصوت عالٍ في أوقات غير مناسبة' },
  { id: 'i3', domain: 'inhibition', text: 'يجد صعوبة شديدة في الانتظار دون حركة أو كلام' },
  { id: 'i4', domain: 'inhibition', text: 'تُلهيه أفكار أو تساؤلات متكررة أثناء تنفيذ المهام' },
  { id: 'i5', domain: 'inhibition', text: 'يحتاج إلى حركة جسدية مستمرة حتى يستطيع التركيز' },
]

const RATINGS = ['أبداً', 'أحياناً', 'كثيراً', 'دائماً']

const RECS: Record<string, string[]> = {
  sustained:  ['تمارين CPT بالحركة يومياً 10 دقائق', 'بروتوكول Pomodoro المعدّل للطفل'],
  selective:  ['لعبة قف واسمع', 'تمرين تتبع البصر'],
  executive:  ['مزامنة الإيقاع الحركي', 'تحدي التسلسل المعكوس'],
  inhibition: ['يوغا الأطفال', 'الحركة اليقظة: التأمل المشي'],
}

function severity(pct: number): AssessmentResult['severity'] {
  if (pct < 25) return 'none'
  if (pct < 50) return 'mild'
  if (pct < 75) return 'moderate'
  return 'severe'
}

interface Props {
  studentId: string
  onComplete: (result: AssessmentResult) => void
  onCancel: () => void
}

export default function AttentionDomainsScale({ studentId, onComplete, onCancel }: Props) {
  const [answers, setAnswers] = useState<Record<string, 0|1|2|3>>({})
  const [submitted, setSubmitted] = useState(false)

  const answered = Object.keys(answers).length
  const total    = ITEMS.length

  function setAnswer(id: string, val: 0|1|2|3) {
    setAnswers(a => ({ ...a, [id]: val }))
  }

  function submit() {
    if (answered < total) return
    const domainScores: Record<string, number> = {}
    const recommendations: string[] = []

    for (const d of DOMAINS) {
      const items = ITEMS.filter(i => i.domain === d.key)
      const sum   = items.reduce((acc, it) => acc + (answers[it.id] ?? 0), 0)
      const pct   = Math.round((sum / (items.length * 3)) * 100)
      domainScores[d.key] = pct
      if (pct >= 50) recommendations.push(...RECS[d.key])
    }

    const totalScore = Math.round(
      Object.values(domainScores).reduce((a, b) => a + b, 0) / DOMAINS.length
    )

    const result: AssessmentResult = {
      id: `AR-${Date.now().toString(36)}`,
      studentId,
      type: 'adhd',
      domainScores,
      totalScore,
      severity: severity(totalScore),
      recommendations,
      answers: Object.entries(answers).map(([itemId, rating]) => ({ itemId, rating })),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    setSubmitted(true)
    onComplete(result)
  }

  if (submitted) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-white font-black text-xl">تم حفظ تقييم أنماط الانتباه</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-2 z-10">
        <h2 className="text-lg font-black text-white">تقييم أنماط الانتباه — SNAP-IV</h2>
        <span className="text-brand-400 font-bold text-sm">{answered}/{total}</span>
      </div>

      {DOMAINS.map(d => (
        <div key={d.key} className="space-y-3">
          <h3 className="font-black text-brand-400 text-sm border-b border-white/10 pb-2 flex justify-between">
            <span>{d.label}</span>
            <span className="text-white/30 text-xs font-normal">{d.protocol}</span>
          </h3>
          {ITEMS.filter(i => i.domain === d.key).map(item => (
            <div key={item.id} className="bg-white/5 rounded-xl p-4">
              <p className="text-white/90 text-sm mb-3 leading-relaxed">{item.text}</p>
              <div className="flex gap-2">
                {RATINGS.map((label, val) => (
                  <button key={val}
                    onClick={() => setAnswer(item.id, val as 0|1|2|3)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[item.id] === val
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="flex gap-3 sticky bottom-0 bg-gray-900 py-2">
        <button onClick={onCancel}
          className="flex-1 border border-white/20 text-white/60 py-3 rounded-xl font-bold text-sm">
          إلغاء
        </button>
        <button onClick={submit} disabled={answered < total}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-colors ${
            answered === total
              ? 'bg-brand-600 hover:bg-brand-700 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}>
          حفظ النتائج ({answered}/{total})
        </button>
      </div>
    </div>
  )
}
