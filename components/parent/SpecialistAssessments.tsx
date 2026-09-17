'use client'

// The assessment the specialist runs in the toolkit is saved permanently
// against the child ("تم حفظ هذا التقييم بشكل دائم في سجل …") and the toolkit
// renders it as a document headed "وثيقة سرية خاصة بولي الأمر والفريق المختص"
// — a document addressed to the parent. But nothing on the parent's side ever
// showed it. /api/parent/assessment did return the records, and the only screen
// that read them was the Vanderbilt questionnaire page, where they appeared as
// three date-and-severity rows under "التقييمات السابقة", with no indication
// that a specialist had produced them and none of their content. The parent's
// التقارير page — the one place a parent goes looking for a report — showed
// nothing at all.
//
// This renders the content of that document on the parent's side. It carries
// the same material the printed version carries, and it marks clearly which
// assessments the specialist ran and which the parent filled in themselves,
// because both are stored in the same place.
//
// The specialist's clinical notes are deliberately NOT here. They are withheld
// server-side in /api/parent/assessment, not merely hidden in this component,
// so they never reach the browser: printing the toolkit document and handing it
// to a family is a decision the specialist makes each time, and publishing the
// same text to a portal the family can open whenever they like is not that.

import { useState } from 'react'
import { ChevronDown, ClipboardCheck, Stethoscope, User } from 'lucide-react'
import { tr, useLang, type Lang } from '@/lib/i18n'
import { localeFor, formatDateOnly } from '@/lib/format'

export interface ParentAssessmentView {
  id: string
  studentId: string
  type: string
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  totalScore: number
  domainScores: Record<string, number>
  recommendations: string[]
  completedAt: string
  assessedByName?: string
  bySpecialist?: boolean
  recommendedPlan?: {
    sessionsPerWeek: number
    programWeeks: number
    totalSessions: number
    reassessWeeks: number
    targetDomains: { key: string; label: string; score: number; priority: 'high' | 'medium' }[]
  }
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string; bar: string }> = {
  none:     { bg: '#D1FAE5', color: '#065F46', bar: '#10B981' },
  mild:     { bg: '#FEF3C7', color: '#B45309', bar: '#F59E0B' },
  moderate: { bg: '#FFEDD5', color: '#C2410C', bar: '#F97316' },
  severe:   { bg: '#FEE2E2', color: '#B91C1C', bar: '#EF4444' },
}

// The specialist's own screen only names the five scales its picker offers, so
// its scaleNames map has no entry for the types that reach a child's record by
// other routes — chiefly vanderbilt-adhd, which is what the parent's own
// questionnaire saves. Without these the parent's page printed the raw key
// ("vanderbilt-adhd") as the title of a clinical document.
const EXTRA_SCALE_NAMES: Record<'ar' | 'en' | 'fr', Record<string, string>> = {
  ar: {
    'vanderbilt-adhd': 'مقياس فاندربيلت — فرز فرط الحركة وتشتت الانتباه',
    cognitive: 'بطارية الأداء المعرفي — قياس ملاحَظ لا اختبار ذكاء',
    motor: 'تقييم المهارات الحركية',
  },
  en: {
    'vanderbilt-adhd': 'NICHQ Vanderbilt — ADHD screen',
    cognitive: 'Cognitive performance battery — observed, not an IQ test',
    motor: 'Motor skills assessment',
  },
  fr: {
    'vanderbilt-adhd': 'Échelle de Vanderbilt — dépistage du TDAH',
    cognitive: 'Batterie de performance cognitive — observée, pas un test de QI',
    motor: 'Évaluation des habiletés motrices',
  },
}

const COPY = {
  ar: {
    title: 'تقييمات الأخصائي',
    subtitle: 'نتائج جلسات التقييم التي أجراها الأخصائي مع طفلك',
    bySpecialist: 'أجراه الأخصائي',
    byParent: 'أجبتَ عنه بنفسك',
    scoreLabel: 'الدرجة الكلية',
    domainsTitle: 'المجالات المقاسة',
    recommendationsTitle: 'التوصيات',
    noRecommendations: 'لا توصيات مسجّلة لهذا المقياس',
    planTitle: 'الخطة المقترحة',
    planSessions: (n: number, w: number) => `${n} حصة أسبوعياً لمدة ${w} أسبوعاً`,
    planReassess: (w: number) => `إعادة تقييم بعد ${w} أسبوعاً`,
    planTargets: 'المجالات المستهدفة',
    priorityHigh: 'أولوية عالية',
    priorityMedium: 'أولوية متوسطة',
    expand: 'عرض التفاصيل',
    collapse: 'إخفاء التفاصيل',
    empty: 'لم يسجّل الأخصائي أي تقييم لطفلك بعد. عند إجراء جلسة تقييم ستظهر نتائجها هنا.',
    disclaimer: 'هذه أدوات فرز لا تشخيص. النتيجة المرتفعة تعني الحاجة إلى تقييم متخصّص، ولا تُعدّ تشخيصاً طبياً أو نفسياً. التقديرات اجتهاد مهني من الأخصائي وليست قياساً آلياً.',
  },
  en: {
    title: 'Specialist assessments',
    subtitle: 'Results of the assessment sessions the specialist ran with your child',
    bySpecialist: 'Run by the specialist',
    byParent: 'You completed this one',
    scoreLabel: 'Total score',
    domainsTitle: 'Domains measured',
    recommendationsTitle: 'Recommendations',
    noRecommendations: 'No recommendations recorded for this scale',
    planTitle: 'Suggested plan',
    planSessions: (n: number, w: number) => `${n} sessions per week for ${w} weeks`,
    planReassess: (w: number) => `Reassess after ${w} weeks`,
    planTargets: 'Target domains',
    priorityHigh: 'High priority',
    priorityMedium: 'Medium priority',
    expand: 'Show details',
    collapse: 'Hide details',
    empty: 'The specialist has not filed an assessment for your child yet. Results will appear here once one is run.',
    disclaimer: 'These are screening tools, not diagnoses. A high result means a specialist evaluation is warranted; it is not a medical or psychological diagnosis. Ratings are the specialist’s professional judgement, not an automated measurement.',
  },
  fr: {
    title: 'Évaluations du spécialiste',
    subtitle: "Résultats des séances d'évaluation menées par le spécialiste avec votre enfant",
    bySpecialist: 'Réalisée par le spécialiste',
    byParent: 'Vous l’avez remplie vous-même',
    scoreLabel: 'Score total',
    domainsTitle: 'Domaines mesurés',
    recommendationsTitle: 'Recommandations',
    noRecommendations: 'Aucune recommandation enregistrée pour cette échelle',
    planTitle: 'Plan proposé',
    planSessions: (n: number, w: number) => `${n} séances par semaine pendant ${w} semaines`,
    planReassess: (w: number) => `Réévaluation après ${w} semaines`,
    planTargets: 'Domaines ciblés',
    priorityHigh: 'Priorité élevée',
    priorityMedium: 'Priorité moyenne',
    expand: 'Voir les détails',
    collapse: 'Masquer les détails',
    empty: "Le spécialiste n'a pas encore enregistré d'évaluation pour votre enfant. Les résultats apparaîtront ici.",
    disclaimer: "Ce sont des outils de dépistage, pas des diagnostics. Un résultat élevé signifie qu'une évaluation spécialisée est nécessaire ; ce n'est pas un diagnostic médical ou psychologique. Les cotations relèvent du jugement professionnel du spécialiste, pas d'une mesure automatique.",
  },
} as const

export default function SpecialistAssessments({ assessments }: { assessments: ParentAssessmentView[] }) {
  const { lang } = useLang()
  const L = (lang as Lang) in COPY ? (lang as Lang) : 'ar'
  const c = COPY[L as keyof typeof COPY]
  const locale = localeFor(L)
  // The clinical vocabulary (scale names, severity words, domain labels) already
  // exists in all three languages for the specialist's own screen. Reusing it
  // keeps one wording for one concept instead of a second, drifting copy.
  const clinical = tr[L].adminSpecialistToolkit
  const scaleNames = { ...EXTRA_SCALE_NAMES[L as keyof typeof EXTRA_SCALE_NAMES], ...(clinical.scaleNames as Record<string, string>) }
  const severityLabels = clinical.severityLabels as Record<string, string>
  const domainLabels = clinical.domainLabels as Record<string, string>

  // The list arrives after the first render, so an initial useState value would
  // be computed from an empty array and the newest assessment would never open.
  // Open it by default until the parent touches a row themselves.
  const [open, setOpen] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const openId = touched ? open : (assessments[0]?.id ?? null)

  if (assessments.length === 0) {
    return (
      <div className="rounded-3xl py-12 px-6 text-center" style={{ background: '#FFFFFF', border: '2px dashed #CFE9E4' }}>
        <div className="text-4xl mb-3">🩺</div>
        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">{c.empty}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#E6F7F4' }}>
          <Stethoscope className="w-5 h-5" style={{ color: '#0D9488' }} />
        </div>
        <div>
          <h2 className="font-black text-lg text-gray-900">{c.title}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{c.subtitle}</p>
        </div>
      </div>

      {assessments.map(a => {
        const sev = SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.mild
        const isOpen = openId === a.id
        const domains = Object.entries(a.domainScores ?? {})

        return (
          <div key={a.id} className="rounded-3xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <button
              type="button"
              onClick={() => { setTouched(true); setOpen(isOpen ? null : a.id) }}
              aria-expanded={isOpen}
              className="w-full text-start px-5 py-4 flex items-center gap-3 hover:bg-gray-50/70 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDFA' }}>
                <ClipboardCheck className="w-4 h-4" style={{ color: '#0D9488' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 truncate">{scaleNames[a.type] ?? a.type}</p>
                {/* No ltr-num here. It sets direction:ltr, which moves a leading
                    number to the END of an Arabic line: "16 سبتمبر 2026 · الأستاذ
                    أمين" rendered as "سبتمبر 2026 · الأستاذ أمين 16". The digits
                    are already Latin via the ar-u-nu-latn locale, so the RTL
                    paragraph lays this out correctly on its own. */}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateOnly(a.completedAt, locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                  {a.assessedByName ? ` · ${a.assessedByName}` : ''}
                </p>
              </div>

              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1"
                style={a.bySpecialist
                  ? { background: '#E6F7F4', color: '#0F766E' }
                  : { background: '#F3EEFF', color: '#5A32D9' }}
              >
                {a.bySpecialist ? <Stethoscope className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {a.bySpecialist ? c.bySpecialist : c.byParent}
              </span>

              <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0" style={{ background: sev.bg, color: sev.color }}>
                {severityLabels[a.severity] ?? a.severity}
              </span>

              <ChevronDown
                className="w-4 h-4 text-gray-300 flex-shrink-0 transition-transform"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>

                {domains.length > 0 && (
                  <div className="pt-4">
                    <p className="text-xs font-bold text-gray-500 mb-2.5">{c.domainsTitle}</p>
                    <div className="space-y-2">
                      {domains.map(([key, score]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 font-medium">{domainLabels[key] ?? key}</span>
                            <span className="font-black text-gray-800 ltr-num">{score}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: sev.bar }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">{c.recommendationsTitle}</p>
                  {a.recommendations?.length > 0 ? (
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {a.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 flex-shrink-0" style={{ color: '#0D9488' }}>•</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">{c.noRecommendations}</p>
                  )}
                </div>

                {a.recommendedPlan && (
                  <div className="rounded-2xl p-4" style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}>
                    <p className="text-xs font-black mb-2" style={{ color: '#0F766E' }}>{c.planTitle}</p>
                    <p className="text-sm text-gray-700">
                      {c.planSessions(a.recommendedPlan.sessionsPerWeek, a.recommendedPlan.programWeeks)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{c.planReassess(a.recommendedPlan.reassessWeeks)}</p>

                    {a.recommendedPlan.targetDomains?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-gray-500 mb-1.5">{c.planTargets}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.recommendedPlan.targetDomains.map(d => (
                            <span
                              key={d.key}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={d.priority === 'high'
                                ? { background: '#FEF2F2', color: '#DC2626' }
                                : { background: '#FFFBEB', color: '#D97706' }}
                            >
                              {d.label} · {d.priority === 'high' ? c.priorityHigh : c.priorityMedium}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )
      })}

      <div className="rounded-2xl p-4 text-xs leading-relaxed" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', color: '#92400E' }}>
        ⚠️ {c.disclaimer}
      </div>
    </div>
  )
}
