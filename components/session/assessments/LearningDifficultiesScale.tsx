'use client'
import { useState } from 'react'
import type { AssessmentResult } from '@/lib/types'

type LDDomain = 'dyslexia' | 'dyscalculia' | 'dysgraphia' | 'workingMemory' | 'processingSpeed'

const SECTIONS: Record<LDDomain, { labelAr: string; emoji: string; items: { id: string; text: string }[] }> = {
  dyslexia: {
    labelAr: 'عسر القراءة (Dyslexia)', emoji: '📖',
    items: [
      { id:'d1', text:'يواجه صعوبة في التعرف على الحروف أو مطابقتها بأصواتها' },
      { id:'d2', text:'يقلب الحروف أو الأرقام عند الكتابة (ب↔ت، 6↔9)' },
      { id:'d3', text:'يقرأ ببطء شديد أو يتخطى كلمات' },
      { id:'d4', text:'صعوبة في تذكر القواعد الإملائية' },
      { id:'d5', text:'يخلط بين الكلمات المتشابهة في الشكل (كان/كأن)' },
    ],
  },
  dyscalculia: {
    labelAr: 'عسر الحساب (Dyscalculia)', emoji: '🔢',
    items: [
      { id:'c1', text:'صعوبة في تذكر جداول الضرب أو الحقائق الأساسية' },
      { id:'c2', text:'يفقد الخطوات أثناء حل مسائل متعددة الخطوات' },
      { id:'c3', text:'صعوبة في فهم قيمة الأماكن (آحاد، عشرات...)' },
      { id:'c4', text:'يخلط بين العمليات الحسابية (+، -، ×، ÷)' },
      { id:'c5', text:'صعوبة في تقدير الكميات أو المقارنة بينها' },
    ],
  },
  dysgraphia: {
    labelAr: 'عسر الكتابة (Dysgraphia)', emoji: '✍️',
    items: [
      { id:'g1', text:'خطه صعب القراءة أو غير منتظم' },
      { id:'g2', text:'يمسك القلم بطريقة شاذة أو يضغط بشدة' },
      { id:'g3', text:'يكتب ببطء شديد يؤثر على إنجاز المهام' },
      { id:'g4', text:'يخلط بين الكتابة بالأحرف الكبيرة والصغيرة' },
      { id:'g5', text:'يتعب بسرعة أثناء الكتابة' },
    ],
  },
  workingMemory: {
    labelAr: 'ذاكرة العمل', emoji: '🧩',
    items: [
      { id:'w1', text:'يفقد التسلسل عند تنفيذ تعليمات متعددة' },
      { id:'w2', text:'ينسى بسرعة ما قيل له للتو' },
      { id:'w3', text:'يفقد مكانه عند القراءة بصوت عالٍ' },
      { id:'w4', text:'يجد صعوبة في التفكير والكتابة في آنٍ معاً' },
    ],
  },
  processingSpeed: {
    labelAr: 'سرعة المعالجة', emoji: '⏱️',
    items: [
      { id:'p1', text:'يحتاج وقتاً أطول لإنجاز مهام بسيطة' },
      { id:'p2', text:'يجد صعوبة في اتخاذ القرارات السريعة' },
      { id:'p3', text:'يتعب بسرعة عند الاختبارات المحدودة بالوقت' },
      { id:'p4', text:'يتأخر في الاستجابة للأسئلة الشفهية' },
    ],
  },
}

const RATINGS = ['أبداً','أحياناً','كثيراً','دائماً']

function severity(score: number): AssessmentResult['severity'] {
  if (score < 20) return 'none'
  if (score < 45) return 'mild'
  if (score < 70) return 'moderate'
  return 'severe'
}

interface Props {
  studentId: string
  onComplete: (result: AssessmentResult) => void
  onCancel: () => void
}

export default function LearningDifficultiesScale({ studentId, onComplete, onCancel }: Props) {
  const [answers, setAnswers] = useState<Record<string, 0|1|2|3>>({})
  const allItems = Object.values(SECTIONS).flatMap(s => s.items)
  const answered = allItems.filter(i => i.id in answers).length
  const total = allItems.length

  function setAnswer(id: string, val: 0|1|2|3) {
    setAnswers(a => ({ ...a, [id]: val }))
  }

  function submit() {
    if (answered < total) return
    const domainScores: Record<string, number> = {}
    const recommendations: string[] = []

    for (const [domain, section] of Object.entries(SECTIONS)) {
      const sum = section.items.reduce((acc, item) => acc + (answers[item.id] ?? 0), 0)
      const score = Math.round((sum / (section.items.length * 3)) * 100)
      domainScores[domain] = score
      const sev = severity(score)
      if (sev === 'mild') recommendations.push(`متابعة ${section.labelAr} مع تمارين تدعيمية`)
      if (sev === 'moderate') recommendations.push(`تدخل متخصص لـ${section.labelAr} (معالج تعلمي)`)
      if (sev === 'severe') recommendations.push(`تقييم رسمي وخطة تربوية فردية لـ${section.labelAr}`)
    }

    const totalScore = Math.round(
      Object.values(domainScores).reduce((a, b) => a + b, 0) / Object.keys(domainScores).length
    )

    onComplete({
      id: `AR-${Date.now().toString(36)}`,
      studentId,
      type: 'learning-difficulties',
      domainScores,
      totalScore,
      severity: severity(totalScore),
      recommendations,
      answers: Object.entries(answers).map(([itemId, rating]) => ({ itemId, rating })),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-2 z-10">
        <h2 className="text-lg font-black text-white">تقييم صعوبات التعلم</h2>
        <span className="text-brand-400 font-bold text-sm">{answered}/{total}</span>
      </div>

      {(Object.entries(SECTIONS) as [LDDomain, typeof SECTIONS[LDDomain]][]).map(([domain, section]) => (
        <div key={domain} className="space-y-3">
          <h3 className="font-black text-amber-400 text-sm border-b border-white/10 pb-2">
            {section.emoji} {section.labelAr}
          </h3>
          {section.items.map(item => (
            <div key={item.id} className="bg-white/5 rounded-xl p-4">
              <p className="text-white/90 text-sm mb-3 leading-relaxed">{item.text}</p>
              <div className="flex gap-2">
                {RATINGS.map((label, val) => (
                  <button key={val}
                    onClick={() => setAnswer(item.id, val as 0|1|2|3)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[item.id] === val
                        ? 'bg-amber-600 text-white'
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
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}>
          حفظ النتائج ({answered}/{total})
        </button>
      </div>
    </div>
  )
}
