'use client'
import { useState } from 'react'
import type { AssessmentResult } from '@/lib/types'

type ASDDomain = 'social' | 'repetitive' | 'sensory' | 'flexibility' | 'selfRegulation'

const SECTIONS: Record<ASDDomain, { labelAr: string; emoji: string; items: { id: string; text: string }[] }> = {
  social: {
    labelAr: 'التواصل الاجتماعي والتفاعل', emoji: '🗣️',
    items: [
      { id: 'sc1', text: 'يجد صعوبة في بدء أو الحفاظ على تواصل بصري طبيعي مع الآخرين' },
      { id: 'sc2', text: 'يفضل اللعب منفرداً ولا يبادر للعب مع أطفال آخرين' },
      { id: 'sc3', text: 'يجد صعوبة في فهم تعبيرات الوجه أو نغمة الصوت ومقصدها' },
      { id: 'sc4', text: 'لا يشارك اهتماماته أو إنجازاته مع من حوله بشكل عفوي (مثل الإشارة لشيء يثير اهتمامه)' },
      { id: 'sc5', text: 'يجد صعوبة في الحفاظ على حوار متبادل (يتكلم دون انتظار الرد أو لا يرد بشكل مناسب)' },
    ],
  },
  repetitive: {
    labelAr: 'السلوكيات النمطية والاهتمامات المقيدة', emoji: '🔁',
    items: [
      { id: 'r1', text: 'يكرر حركات جسدية معينة (رفرفة اليدين، التمايل، الدوران) عند الانفعال أو الاستثارة' },
      { id: 'r2', text: 'يصرّ على اتباع روتين ثابت ويضطرب بشدة عند تغييره' },
      { id: 'r3', text: 'لديه اهتمام مكثف وغير عادي بموضوع أو نشاط محدد على حساب أنشطة أخرى' },
      { id: 'r4', text: 'يكرر كلمات أو عبارات بنفس النمط، أو يرتب الأشياء بطريقة متكررة وثابتة' },
      { id: 'r5', text: 'يبدي انزعاجاً شديداً من تغييرات بسيطة في البيئة المحيطة (ترتيب الأثاث، تغيير الطريق...)' },
    ],
  },
  sensory: {
    labelAr: 'الحساسية الحسية', emoji: '🌊',
    items: [
      { id: 'se1', text: 'يبدي حساسية زائدة أو نقص حساسية للأصوات (يغطي أذنيه أو لا يستجيب للأصوات العالية)' },
      { id: 'se2', text: 'يبدي حساسية غير عادية للمس أو لملمس بعض الأقمشة أو الأطعمة' },
      { id: 'se3', text: 'ينجذب بشكل غير عادي لمصادر الضوء أو الحركة البصرية (يحدّق فيها لفترات طويلة)' },
      { id: 'se4', text: 'يبحث عن إحساسات حركية معينة (الدوران، التأرجح، القفز) بشكل متكرر' },
      { id: 'se5', text: 'يبدي ردة فعل غير متناسبة (إيجابية أو سلبية) تجاه روائح أو نكهات معينة' },
    ],
  },
  flexibility: {
    labelAr: 'المرونة والتكيف مع التغيير', emoji: '🔄',
    items: [
      { id: 'f1', text: 'يجد صعوبة كبيرة في الانتقال من نشاط إلى آخر دون تحذير مسبق' },
      { id: 'f2', text: 'يصاب بانهيار انفعالي (Meltdown) عند مواجهة موقف غير متوقع' },
      { id: 'f3', text: 'يحتاج إلى تحضير وتهيئة مسبقة قبل أي نشاط أو موقف جديد' },
      { id: 'f4', text: 'يجد صعوبة في تطبيق ما تعلمه في موقف معين على مواقف مشابهة جديدة' },
    ],
  },
  selfRegulation: {
    labelAr: 'التنظيم الذاتي والانفعالي', emoji: '🧘',
    items: [
      { id: 'sr1', text: 'يجد صعوبة في التعبير عن مشاعره بطرق مناسبة لعمره' },
      { id: 'sr2', text: 'يصعب عليه تهدئة نفسه بعد الانفعال ويحتاج وقتاً طويلاً للعودة للهدوء' },
      { id: 'sr3', text: 'يستجيب بقوة مبالغ فيها (بكاء، صراخ، عدوانية) لمحفزات بسيطة' },
      { id: 'sr4', text: 'يجد صعوبة في طلب المساعدة أو التعبير عن احتياجاته بشكل واضح' },
    ],
  },
}

const RATINGS = ['أبداً', 'أحياناً', 'كثيراً', 'دائماً']

const RECS: Record<ASDDomain, string> = {
  social:         'برنامج تدخل في المهارات الاجتماعية والتواصل البديل (بطاقات PECS أو وسائل تواصل بصرية)',
  repetitive:     'دمج الاهتمامات المقيدة كحافز تعزيزي داخل الجلسات + تمارين تدريجية لتوسيع المرونة السلوكية',
  sensory:        'بروتوكول تكامل حسي مخصص (Sensory Diet) حسب نمط الحساسية الظاهر',
  flexibility:    'جدول بصري يومي (Visual Schedule) والتحضير المسبق لأي تغيير في الروتين',
  selfRegulation: 'تمارين تنظيم ذاتي وتهدئة حسية (منطقة هدوء، تمارين تنفس مصورة)',
}

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

export default function AutismScale({ studentId, onComplete, onCancel }: Props) {
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2 | 3>>({})
  const allItems = Object.values(SECTIONS).flatMap(s => s.items)
  const answered = allItems.filter(i => i.id in answers).length
  const total = allItems.length

  function setAnswer(id: string, val: 0 | 1 | 2 | 3) {
    setAnswers(a => ({ ...a, [id]: val }))
  }

  function submit() {
    if (answered < total) return
    const domainScores: Record<string, number> = {}
    const recommendations: string[] = []

    for (const [domain, section] of Object.entries(SECTIONS) as [ASDDomain, typeof SECTIONS[ASDDomain]][]) {
      const sum = section.items.reduce((acc, item) => acc + (answers[item.id] ?? 0), 0)
      const score = Math.round((sum / (section.items.length * 3)) * 100)
      domainScores[domain] = score
      if (score >= 45) recommendations.push(RECS[domain])
    }

    const totalScore = Math.round(
      Object.values(domainScores).reduce((a, b) => a + b, 0) / Object.keys(domainScores).length
    )
    const sev = severity(totalScore)
    if (sev === 'severe') recommendations.push('التنسيق مع الطبيب أو الأخصائي النفسي المتابع لتحديث خطة الدعم الشاملة')

    onComplete({
      id: `AR-${Date.now().toString(36)}`,
      studentId,
      type: 'autism',
      domainScores,
      totalScore,
      severity: sev,
      recommendations,
      answers: Object.entries(answers).map(([itemId, rating]) => ({ itemId, rating })),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-2 z-10">
        <h2 className="text-lg font-black text-white">تقييم ملف الدعم — طيف التوحد</h2>
        <span className="text-brand-400 font-bold text-sm">{answered}/{total}</span>
      </div>

      {(Object.entries(SECTIONS) as [ASDDomain, typeof SECTIONS[ASDDomain]][]).map(([domain, section]) => (
        <div key={domain} className="space-y-3">
          <h3 className="font-black text-teal-400 text-sm border-b border-white/10 pb-2">
            {section.emoji} {section.labelAr}
          </h3>
          {section.items.map(item => (
            <div key={item.id} className="bg-white/5 rounded-xl p-4">
              <p className="text-white/90 text-sm mb-3 leading-relaxed">{item.text}</p>
              <div className="flex gap-2">
                {RATINGS.map((label, val) => (
                  <button key={val}
                    onClick={() => setAnswer(item.id, val as 0 | 1 | 2 | 3)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[item.id] === val
                        ? 'bg-teal-600 text-white'
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
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}>
          حفظ النتائج ({answered}/{total})
        </button>
      </div>
    </div>
  )
}
