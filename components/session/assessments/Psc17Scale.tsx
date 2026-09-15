'use client'
// PSC-17 — the platform's only screen for the internalising dimension.
//
// Scoring lives in lib/psc17-data.ts and is unit-tested there; this file is the
// form. Both the published English wording and the working Arabic rendering are
// shown, because the English is the instrument and the Arabic is a convenience
// for administration in this clinic — not a separately validated Arabic PSC-17.
import { useState } from 'react'
import type { AssessmentResult } from '@/lib/types'
import {
  PSC17_ITEMS,
  PSC_BG,
  PSC_COLORS,
  PSC_LABELS,
  SUBSCALE_META,
  describePsc17,
  scorePsc17,
  type PscSubscale,
} from '@/lib/psc17-data'

const ORDER: PscSubscale[] = ['attention', 'internalising', 'externalising']

interface Props {
  studentId: string
  onComplete: (result: AssessmentResult) => void
  onCancel: () => void
  initialAnswers?: Record<string, 0 | 1 | 2 | 3>
  onProgress?: (answers: Record<string, 0 | 1 | 2 | 3>) => void
  studentAge?: number
}

export default function Psc17Scale({ studentId, onComplete, onCancel, initialAnswers, onProgress }: Props) {
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2 | 3>>(initialAnswers ?? {})
  const [submitted, setSubmitted] = useState(false)

  const answered = Object.keys(answers).length
  const total = PSC17_ITEMS.length

  function setAnswer(id: number, val: 0 | 1 | 2) {
    const next = { ...answers, [String(id)]: val }
    setAnswers(next)
    onProgress?.(next)
  }

  function submit() {
    if (answered < total) return

    // Re-key to the numeric ids the scorer expects; the form stores strings
    // because the shared scale contract does.
    const numeric: Record<number, number> = {}
    for (const item of PSC17_ITEMS) {
      const v = answers[String(item.id)]
      if (v === 0 || v === 1 || v === 2) numeric[item.id] = v
    }
    const score = scorePsc17(numeric)
    if (!score.complete) return

    // Percentages so the existing exercise mapper and report bars, which expect
    // 0-100 domain scores, keep working — the raw sums and cut-offs are what the
    // clinical reading is based on and they go into recommendations.
    const domainScores: Record<string, number> = {}
    for (const s of score.subscales) {
      domainScores[s.subscale] = Math.round((s.score / s.max) * 100)
    }

    // The platform's severity vocabulary. PSC-17 is a pass/fail screen, not a
    // graded severity scale, so this maps how many domains crossed their
    // cut-off — never presented to the family as a severity diagnosis.
    const positives = score.positiveSubscales.length
    const severity: AssessmentResult['severity'] =
      !score.totalPositive && positives === 0 ? 'none'
      : positives >= 2 || (score.totalPositive && positives >= 1) ? 'moderate'
      : 'mild'

    const recommendations: string[] = [
      // 'ℹ️' marks a readout rather than an action — the toolkit's action plan
      // filters these out so a score never reads as a task to perform.
      `ℹ️ ${describePsc17(score)}`,
      ...score.subscales.map(s =>
        `ℹ️ ${SUBSCALE_META[s.subscale].label}: ${s.score}/${s.max} (العتبة ${s.cutoff})${s.positive ? ' — فوق العتبة' : ''}`,
      ),
    ]
    if (score.subscales.find(s => s.subscale === 'internalising')?.positive) {
      recommendations.push('إحالة للتقييم النفسي: بنود الحزن واليأس وتدنّي تقدير الذات والقلق بلغت عتبة الفرز — هذا خارج نطاق التدخل الحركي وحده')
    }
    if (score.subscales.find(s => s.subscale === 'attention')?.positive) {
      recommendations.push('تمارين الانتباه المستمر وكبح التشتّت ضمن الحصص')
    }
    if (score.subscales.find(s => s.subscale === 'externalising')?.positive) {
      recommendations.push('بروتوكول تعديل سلوك بقواعد معروضة بصرياً وتعزيز تفاضلي للسلوك البديل')
    }

    const result: AssessmentResult = {
      id: `AR-${Date.now().toString(36)}`,
      studentId,
      type: 'psc17',
      domainScores,
      totalScore: score.total,
      severity,
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
      <div className="sticky top-0 bg-gray-900 py-2 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">PSC-17 — قائمة الأعراض النفسية للأطفال</h2>
          <span className="text-brand-400 font-bold text-sm ltr-num">{answered}/{total}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
          يُعبّئه ولي الأمر عن سلوك الطفل في الأشهر الأخيرة. الصياغة الإنجليزية هي الأصل المعتمد،
          والعربية ترجمة عمل داخل العيادة وليست نسخة عربية مُقنّنة مستقلة.
        </p>
      </div>

      {ORDER.map(key => {
        const meta = SUBSCALE_META[key]
        return (
          <div key={key} className="space-y-3">
            <h3 className="font-black text-sm border-b border-white/10 pb-2" style={{ color: meta.color }}>
              {meta.emoji} {meta.label}
              <span className="text-gray-500 font-normal text-[11px] mr-2">{meta.desc}</span>
            </h3>
            {PSC17_ITEMS.filter(i => i.subscale === key).map(item => (
              <div key={item.id} className="bg-white/5 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-gray-500 text-xs font-bold ltr-num flex-shrink-0">{item.id}.</span>
                  <div>
                    <p className="text-white text-sm leading-relaxed">{item.text}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5" dir="ltr">{item.textEn}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {PSC_LABELS.map((label, val) => {
                    const on = answers[String(item.id)] === val
                    return (
                      <button key={val} type="button"
                        onClick={() => setAnswer(item.id, val as 0 | 1 | 2)}
                        aria-pressed={on}
                        aria-label={`${item.text}: ${label}`}
                        className="flex-1 py-2 rounded-lg text-xs font-bold border transition-colors"
                        style={on
                          ? { background: PSC_COLORS[val], borderColor: PSC_COLORS[val], color: '#fff' }
                          : { background: 'transparent', borderColor: 'rgba(255,255,255,0.14)', color: '#9CA3AF' }}>
                        <span className="ltr-num">{val}</span> · {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      <p className="text-[11px] text-gray-500 leading-relaxed border-t border-white/10 pt-3">
        أداة فرز — نتيجة عند أو فوق العتبة تعني الحاجة لتقييم متخصّص، ولا تعني تشخيصاً.
        <br />
        Gardner et al. (1999), Ambulatory Child Health 5(3), 225-236.
      </p>

      <div className="flex gap-2 sticky bottom-0 bg-gray-900 py-3">
        <button type="button" onClick={submit} disabled={answered < total}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors">
          {answered < total ? `أكمل البنود (${total - answered} متبقٍ)` : 'حفظ التقييم'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 border border-white/15 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  )
}
