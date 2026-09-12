'use client'
import { useState } from 'react'
import type { AssessmentResult } from '@/lib/types'

const ITEMS = [
  // Attention (9 items)
  { id:'a1', domain:'attention', text:'يصعب عليه الانتباه لتفاصيل الأشياء ويرتكب أخطاء من الإهمال' },
  { id:'a2', domain:'attention', text:'يجد صعوبة في الحفاظ على الانتباه أثناء اللعب أو المهام' },
  { id:'a3', domain:'attention', text:'يبدو أنه لا يسمع عندما يتحدث إليه مباشرة' },
  { id:'a4', domain:'attention', text:'لا يتبع التعليمات ولا يكمل الواجبات أو المهام' },
  { id:'a5', domain:'attention', text:'يجد صعوبة في تنظيم المهام والأنشطة' },
  { id:'a6', domain:'attention', text:'يتجنب أو يكره المهام التي تتطلب جهداً ذهنياً مستمراً' },
  { id:'a7', domain:'attention', text:'يفقد أشياءه الضرورية للمهام (ألعاب، أقلام، كتب)' },
  { id:'a8', domain:'attention', text:'يتشتت انتباهه بسهولة بالمنبهات الخارجية' },
  { id:'a9', domain:'attention', text:'كثير النسيان في الأنشطة اليومية' },
  // Hyperactivity (6 items)
  { id:'h1', domain:'hyperactivity', text:'يتحرك يديه أو قدميه أو يتلوى في مقعده' },
  { id:'h2', domain:'hyperactivity', text:'يغادر مقعده في الفصل أو المواقف التي يُتوقع منه الجلوس' },
  { id:'h3', domain:'hyperactivity', text:'يركض أو يتسلق بشكل مفرط في مواقف غير ملائمة' },
  { id:'h4', domain:'hyperactivity', text:'لا يستطيع اللعب أو ممارسة الأنشطة بهدوء' },
  { id:'h5', domain:'hyperactivity', text:'يتصرف كأنه "مدفوع بمحرك"، يصعب إيقافه' },
  { id:'h6', domain:'hyperactivity', text:'يتكلم بشكل مفرط' },
  // Impulsivity (3 items)
  { id:'i1', domain:'impulsivity', text:'يجيب قبل اكتمال السؤال' },
  { id:'i2', domain:'impulsivity', text:'يجد صعوبة في الانتظار لدوره' },
  { id:'i3', domain:'impulsivity', text:'يقاطع الآخرين أو يتطفل على محادثاتهم' },
]

const RATINGS = ['أبداً','أحياناً','كثيراً','دائماً']

// SCORING (scientific accuracy):
// These 18 items are the DSM-5 ADHD symptom criteria (9 inattention, plus the
// 6 hyperactivity + 3 impulsivity items that together form the 9-symptom
// hyperactive/impulsive list), on the standard 0–3 frequency scale.
// So we score them the DSM way — a symptom COUNTS when rated "كثيراً/دائماً"
// (>= 2), and a presentation needs >= 6 of its 9 symptoms — instead of the
// arbitrary 25/50/75 percentage quartiles this previously used, which had no
// clinical basis and could call 5 severe symptoms "mild".
//
// IMPORTANT: DSM-5 also requires symptoms to appear in TWO OR MORE settings
// and to impair functioning. This scale captures neither, so it remains a
// structured screen to guide the specialist — never a diagnosis.
const SYMPTOM_PRESENT_MIN = 2
const DSM_THRESHOLD = 6

const INATTENTION_IDS   = ITEMS.filter(i => i.domain === 'attention').map(i => i.id)
const HYPER_IMPULSE_IDS = ITEMS.filter(i => i.domain !== 'attention').map(i => i.id)

function countPresent(answers: Record<string, 0|1|2|3>, ids: string[]): number {
  return ids.reduce((n, id) => n + ((answers[id] ?? 0) >= SYMPTOM_PRESENT_MIN ? 1 : 0), 0)
}

function severityFromCounts(inattention: number, hyperImpulsive: number): AssessmentResult['severity'] {
  const totalSx = inattention + hyperImpulsive
  const meetsInattentive = inattention >= DSM_THRESHOLD
  const meetsHyperactive = hyperImpulsive >= DSM_THRESHOLD
  if (meetsInattentive && meetsHyperactive) return 'severe'      // combined presentation
  if (meetsInattentive || meetsHyperactive) return totalSx >= 12 ? 'severe' : 'moderate'
  if (totalSx >= DSM_THRESHOLD) return 'mild'                    // subthreshold but notable
  return 'none'
}

interface Props {
  studentId: string
  onComplete: (result: AssessmentResult) => void
  onCancel: () => void
  initialAnswers?: Record<string, 0|1|2|3>
  onProgress?: (answers: Record<string, 0|1|2|3>) => void
}

export default function ADHDScale({ studentId, onComplete, onCancel, initialAnswers, onProgress }: Props) {
  const [answers, setAnswers] = useState<Record<string, 0|1|2|3>>(initialAnswers ?? {})
  const [submitted, setSubmitted] = useState(false)

  const answered = Object.keys(answers).length
  const total = ITEMS.length

  function setAnswer(id: string, val: 0|1|2|3) {
    const next = { ...answers, [id]: val }
    setAnswers(next)
    onProgress?.(next)
  }

  function submit() {
    if (answered < total) return
    const domains = ['attention','hyperactivity','impulsivity']
    const domainScores: Record<string, number> = {}
    for (const domain of domains) {
      const items = ITEMS.filter(i => i.domain === domain)
      const sum = items.reduce((acc, item) => acc + (answers[item.id] ?? 0), 0)
      domainScores[domain] = Math.round((sum / (items.length * 3)) * 100)
    }
    const totalScore = Math.round(
      Object.values(domainScores).reduce((a, b) => a + b, 0) / domains.length
    )
    // DSM-5 symptom counts drive severity (see note above); the percentages
    // above stay as-is because the exercise mapper keys off them.
    const inattentionCount   = countPresent(answers, INATTENTION_IDS)
    const hyperImpulseCount  = countPresent(answers, HYPER_IMPULSE_IDS)
    const sev = severityFromCounts(inattentionCount, hyperImpulseCount)
    const recommendations: string[] = [
      // 'ℹ️' marks this as a readout, not a plan action — the toolkit's action
      // plan filters these out so a symptom count never reads as a task to do.
      `ℹ️ عدد أعراض قلة الانتباه: ${inattentionCount}/9 — فرط الحركة/الاندفاعية: ${hyperImpulseCount}/9 (الحد المرجعي DSM-5: ٦)`,
    ]
    if (domainScores.attention > 50)
      recommendations.push('تمارين التركيز والانتباه الانتقائي يومياً 15 دقيقة')
    if (domainScores.hyperactivity > 50)
      recommendations.push('تمارين الطاقة الحركية قبل الجلسات الأكاديمية')
    if (domainScores.impulsivity > 50)
      recommendations.push('بروتوكول التوقف والتفكير (Stop-Think-Act)')
    if (sev === 'moderate' || sev === 'severe')
      recommendations.push('التنسيق مع طبيب متخصص للتقييم الشامل — تَحقَّق من ظهور الأعراض في بيئتين على الأقل (المنزل والمدرسة) ومن تأثيرها الوظيفي، فهما شرطان في DSM-5 لا يقيسهما هذا النموذج')

    const result: AssessmentResult = {
      id: `AR-${Date.now().toString(36)}`,
      studentId,
      type: 'adhd',
      domainScores,
      totalScore,
      severity: sev,
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
        <p className="text-white font-black text-xl">تم حفظ التقييم</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-2 z-10">
        <h2 className="text-lg font-black text-white">مقياس ADHD — بنود DSM-5</h2>
        <span className="text-brand-400 font-bold text-sm">{answered}/{total}</span>
      </div>

      {['attention','hyperactivity','impulsivity'].map(domain => (
        <div key={domain} className="space-y-3">
          <h3 className="font-black text-brand-400 text-sm border-b border-white/10 pb-2">
            {domain === 'attention' ? '🧠 الانتباه' : domain === 'hyperactivity' ? '⚡ فرط الحركة' : '🎯 الاندفاعية'}
          </h3>
          {ITEMS.filter(i => i.domain === domain).map(item => (
            <div key={item.id} className="bg-white/5 rounded-xl p-4">
              <p className="text-white/90 text-sm mb-3 leading-relaxed" id={`label-${item.id}`}>{item.text}</p>
              <div className="flex gap-2" role="radiogroup" aria-labelledby={`label-${item.id}`}>
                {RATINGS.map((label, val) => (
                  <button key={val}
                    role="radio"
                    aria-checked={answers[item.id] === val}
                    onClick={() => setAnswer(item.id, val as 0|1|2|3)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[item.id] === val
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}>
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
