'use client'
import { useState, useEffect } from 'react'
import { ChevronRight, RotateCcw, CheckCircle, Save, Loader2 } from 'lucide-react'
import {
  VANDERBILT_ITEMS, PERFORMANCE_ITEMS,
  FREQ_LABELS, FREQ_LABELS_EN, FREQ_COLORS, FREQ_BG,
  PERF_LABELS, PERF_LABELS_EN,
  DOMAIN_META, SUBTYPE_LABEL, scoreVanderbilt,
  type VanderbiltDomain,
} from '@/lib/vanderbilt-data'
import { buildPlanFromVanderbilt } from '@/lib/assessment-plan'
import { useLang } from '@/lib/i18n'

type Phase = 'intro' | 'symptoms' | 'performance' | 'results'
type Lang = 'ar' | 'en' | 'fr'

interface Child { id: string; firstName: string; lastName: string }
interface PastAssessment { id: string; completedAt: string; totalScore: number; severity: string; studentId: string; type?: string }

const SEVERITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  none:     { label: 'ضمن الطبيعي', color: '#065F46', bg: '#D1FAE5' },
  mild:     { label: 'خفيف',        color: '#B45309', bg: '#FFFBEB' },
  moderate: { label: 'متوسط',       color: '#C2410C', bg: '#FFF7ED' },
  severe:   { label: 'مرتفع',       color: '#B91C1C', bg: '#FEF2F2' },
}

// Chrome strings kept local (the clinical items themselves render from the
// Vanderbilt data module) so we don't touch the large shared i18n blocks.
const L: Record<Lang, Record<string, string>> = {
  ar: {
    pageTitle: 'مقياس فاندربيلت للانتباه وفرط الحركة',
    pageSubtitle: 'استمارة الوالد (NICHQ Vanderbilt) — أداة فرز معتمدة',
    heroQuestion: 'استبيان علمي معتمد لفرز ADHD',
    heroBody: 'هذه استمارة الوالد من مقياس NICHQ Vanderbilt — المستخدمة عالمياً لفرز فرط الحركة وتشتت الانتباه لدى الأطفال (٦–١٢ سنة). تجيب عن سلوك طفلك خلال الأشهر الستة الماضية.',
    disclaimerLabel: 'مهم:',
    disclaimerText: 'هذه أداة فرز وليست تشخيصاً طبياً. النتيجة الإيجابية تعني أنه يُستحسن تقييم سريري كامل من مختص — لا تشخيصاً نهائياً.',
    start: '🚀 ابدأ الاستبيان',
    restartAssess: 'إعادة الاستبيان',
    sectionSymptoms: 'السلوك',
    sectionPerformance: 'الأداء الوظيفي',
    perfTitle: 'كيف تقيّم أداء طفلك في المجالات التالية؟',
    perfSubtitle: 'هذا القسم يقيس الأثر الوظيفي — وهو شرط أساسي في الفرز',
    previous: 'السابق',
    continue: 'متابعة',
    of: 'من',
    question: 'السؤال',
    resultsTitle: 'نتيجة الفرز',
    screenResult: 'نتيجة الفرز الأولية',
    symptomsPresent: 'عرَض حاضر',
    impairmentTitle: 'مجالات تأثّر الأداء',
    noImpairment: 'لم تُبلَّغ صعوبات وظيفية واضحة',
    planTitle: 'الخطة المقترحة',
    planSubtitle: 'نقطة انطلاق يعتمدها الأخصائي ويعدّلها حسب حالة طفلك',
    perWeek: 'حصص / أسبوع', weeks: 'أسبوعاً', totalSessions: 'إجمالي الحصص',
    pathTitle: '🧭 المسار — المجالات المستهدفة بالترتيب:',
    priorityHigh: 'أولوية عالية', priorityMedium: 'أولوية متوسطة',
    reassess: 'يُنصح بإعادة الفرز بعد',
    reassessUnit: 'أسابيع لقياس التحسّن بالأرقام',
    oppositionalNote: 'لوحظت مؤشرات على سلوك معارض — يستحسن مناقشتها مع الأخصائي',
    saveTitle: '💾 حفظ النتيجة في ملف طفلك',
    saved: 'تم حفظ النتيجة بنجاح',
    saving: 'جارٍ الحفظ...', save: 'حفظ النتيجة',
    saveErr: 'تعذر الحفظ، حاول مرة أخرى', netErr: 'حدث خطأ في الاتصال',
    startExercises: '🏃 ابدأ التمارين', bookSession: '📅 احجز جلسة',
    pastTitle: '📊 آخر عمليات فرز',
    monthsHint: 'أجب حسب سلوك الطفل في الأشهر الستة الماضية',
  },
  en: {
    pageTitle: 'Vanderbilt ADHD Rating Scale',
    pageSubtitle: 'Parent Informant (NICHQ Vanderbilt) — validated screen',
    heroQuestion: 'A validated ADHD screening questionnaire',
    heroBody: 'This is the NICHQ Vanderbilt Parent Informant scale — used worldwide to screen for ADHD in children (6–12). Answer based on your child\'s behavior over the past 6 months.',
    disclaimerLabel: 'Important:',
    disclaimerText: 'This is a screening tool, not a medical diagnosis. A positive result means a full clinical evaluation is advisable — not a final diagnosis.',
    start: '🚀 Start questionnaire',
    restartAssess: 'Restart',
    sectionSymptoms: 'Behavior',
    sectionPerformance: 'Functioning',
    perfTitle: 'How do you rate your child in the following areas?',
    perfSubtitle: 'This section measures functional impact — essential to the screen',
    previous: 'Previous',
    continue: 'Continue',
    of: 'of',
    question: 'Question',
    resultsTitle: 'Screening Result',
    screenResult: 'Preliminary screen result',
    symptomsPresent: 'symptoms present',
    impairmentTitle: 'Areas of impaired functioning',
    noImpairment: 'No clear functional difficulty reported',
    planTitle: 'Recommended Plan',
    planSubtitle: 'A starting point the specialist reviews and adjusts',
    perWeek: 'sessions / week', weeks: 'weeks', totalSessions: 'total sessions',
    pathTitle: '🧭 Path — target domains in order:',
    priorityHigh: 'High priority', priorityMedium: 'Medium priority',
    reassess: 'Re-screen recommended after',
    reassessUnit: 'weeks to measure improvement',
    oppositionalNote: 'Signs of oppositional behavior noted — worth discussing with the specialist',
    saveTitle: '💾 Save result to your child\'s file',
    saved: 'Result saved successfully',
    saving: 'Saving...', save: 'Save result',
    saveErr: 'Could not save, try again', netErr: 'Connection error',
    startExercises: '🏃 Start exercises', bookSession: '📅 Book a session',
    pastTitle: '📊 Recent screens',
    monthsHint: 'Answer based on the past 6 months',
  },
  fr: {
    pageTitle: 'Échelle Vanderbilt TDAH',
    pageSubtitle: 'Formulaire parent (NICHQ Vanderbilt) — dépistage validé',
    heroQuestion: 'Un questionnaire de dépistage TDAH validé',
    heroBody: 'Ceci est le formulaire parent NICHQ Vanderbilt — utilisé dans le monde entier pour dépister le TDAH chez l\'enfant (6–12 ans). Répondez selon le comportement des 6 derniers mois.',
    disclaimerLabel: 'Important :',
    disclaimerText: 'Ceci est un outil de dépistage, pas un diagnostic médical. Un résultat positif signifie qu\'une évaluation clinique complète est conseillée.',
    start: '🚀 Commencer',
    restartAssess: 'Recommencer',
    sectionSymptoms: 'Comportement',
    sectionPerformance: 'Fonctionnement',
    perfTitle: 'Comment évaluez-vous votre enfant dans les domaines suivants ?',
    perfSubtitle: 'Cette section mesure l\'impact fonctionnel — essentiel au dépistage',
    previous: 'Précédent',
    continue: 'Continuer',
    of: 'sur',
    question: 'Question',
    resultsTitle: 'Résultat du dépistage',
    screenResult: 'Résultat préliminaire',
    symptomsPresent: 'symptômes présents',
    impairmentTitle: 'Domaines de fonctionnement altéré',
    noImpairment: 'Aucune difficulté fonctionnelle nette signalée',
    planTitle: 'Plan recommandé',
    planSubtitle: 'Un point de départ que le spécialiste ajuste',
    perWeek: 'séances / semaine', weeks: 'semaines', totalSessions: 'séances au total',
    pathTitle: '🧭 Parcours — domaines ciblés dans l\'ordre :',
    priorityHigh: 'Priorité élevée', priorityMedium: 'Priorité moyenne',
    reassess: 'Nouveau dépistage conseillé après',
    reassessUnit: 'semaines pour mesurer les progrès',
    oppositionalNote: 'Signes de comportement oppositionnel notés — à discuter avec le spécialiste',
    saveTitle: '💾 Enregistrer le résultat',
    saved: 'Résultat enregistré',
    saving: 'Enregistrement...', save: 'Enregistrer',
    saveErr: 'Échec de l\'enregistrement', netErr: 'Erreur de connexion',
    startExercises: '🏃 Commencer les exercices', bookSession: '📅 Réserver',
    pastTitle: '📊 Derniers dépistages',
    monthsHint: 'Répondez selon les 6 derniers mois',
  },
}

export default function AssessmentPage() {
  const { lang } = useLang()
  const t = L[(lang as Lang)] ?? L.ar
  const [phase, setPhase]     = useState<Phase>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [performance, setPerformance] = useState<Record<string, number>>({})
  const [children, setChildren]     = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [pastAssessments, setPastAssessments] = useState<PastAssessment[]>([])

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.children?.length) {
          setChildren(d.children)
          setSelectedChild(d.children[0].id)
        }
      })
      .catch(() => {})
    fetch('/api/parent/assessment')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.assessments) setPastAssessments(d.assessments.slice(0, 3)) })
      .catch(() => {})
  }, [])

  const item = VANDERBILT_ITEMS[current]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((current / VANDERBILT_ITEMS.length) * 100)
  const itemText = (lang as Lang) === 'en' ? item?.textEn : item?.text
  const freqLabels = (lang as Lang) === 'en' ? FREQ_LABELS_EN : FREQ_LABELS
  const perfLabels = (lang as Lang) === 'en' ? PERF_LABELS_EN : PERF_LABELS

  function answer(value: number) {
    setAnswers({ ...answers, [item.id]: value })
    if (current < VANDERBILT_ITEMS.length - 1) setCurrent(c => c + 1)
    else setPhase('performance')
  }

  function restart() {
    setAnswers({}); setPerformance({}); setCurrent(0)
    setPhase('intro'); setSaved(false); setSaveError('')
  }

  const allPerfAnswered = PERFORMANCE_ITEMS.every(p => performance[p.id] != null)
  const vb = scoreVanderbilt(answers, performance)
  const plan = buildPlanFromVanderbilt(vb)

  async function saveResults() {
    if (!selectedChild || saving || saved) return
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/parent/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedChild,
          type: 'vanderbilt-adhd',
          answers,
          performance,
        }),
      })
      if (res.ok) setSaved(true)
      else setSaveError(t.saveErr)
    } catch {
      setSaveError(t.netErr)
    } finally {
      setSaving(false)
    }
  }

  // ── Intro ──────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t.pageSubtitle}</p>
      </div>

      <div className="rounded-3xl p-6 text-white text-center" style={{ background: 'linear-gradient(135deg,#7C5CFC,#4A20C8)' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🧠</div>
        <h2 className="font-black text-xl mb-2">{t.heroQuestion}</h2>
        <p className="text-white/80 text-sm leading-relaxed">{t.heroBody}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['inattention', 'hyperactivity', 'oppositional'] as VanderbiltDomain[]).map(key => {
          const d = DOMAIN_META[key]
          return (
            <div key={key} className="rounded-2xl p-4 text-center" style={{ background: d.bg, border: `1.5px solid ${d.color}22` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{d.emoji}</div>
              <div className="font-black text-xs" style={{ color: d.color }}>{(lang as Lang) === 'en' ? d.labelEn : d.label}</div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
        <p className="text-xs text-amber-700">
          ⚠️ <strong>{t.disclaimerLabel}</strong> {t.disclaimerText}
        </p>
      </div>

      {pastAssessments.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF' }}>
          <p className="font-black text-sm text-gray-700 mb-3">{t.pastTitle}</p>
          <div className="space-y-2">
            {pastAssessments.map(a => {
              const sev = SEVERITY_LABEL[a.severity] ?? SEVERITY_LABEL.mild
              const childName = children.find(c => c.id === a.studentId)?.firstName ?? ''
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#F9FAFB' }}>
                  <div className="text-xs font-bold text-gray-700">
                    {new Date(a.completedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {childName ? ` · ${childName}` : ''}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setPhase('symptoms')}
        className="w-full font-black text-lg text-white py-4 rounded-2xl transition-all"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}
      >
        {pastAssessments.length > 0 ? t.restartAssess : t.start}
      </button>
    </div>
  )

  // ── Symptom questions ──────────────────────────────────────
  if (phase === 'symptoms') {
    const d = DOMAIN_META[item.domain]
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{t.question} {current + 1} {t.of} {VANDERBILT_ITEMS.length}</p>
            <div className="font-black text-sm mt-0.5" style={{ color: d.color }}>
              {d.emoji} {(lang as Lang) === 'en' ? d.labelEn : d.label}
            </div>
          </div>
          <button onClick={restart} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F9FAFB' }}>
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(4, progress)}%`, background: d.color }} />
        </div>

        <div className="rounded-3xl p-8 text-center" style={{ background: d.bg, border: `2px solid ${d.color}30` }}>
          <p className="text-xs text-gray-400 mb-3">{t.monthsHint}</p>
          <p className="font-black text-xl text-gray-900 leading-relaxed">{itemText}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {freqLabels.map((label, i) => (
            <button
              key={label}
              onClick={() => answer(i)}
              className="rounded-2xl py-4 font-black text-base transition-all"
              style={{ background: FREQ_BG[i], color: FREQ_COLORS[i], border: `2px solid ${FREQ_COLORS[i]}40` }}
            >
              {label}
            </button>
          ))}
        </div>

        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} className="flex items-center gap-1 text-sm text-gray-400 mx-auto">
            <ChevronRight className="w-4 h-4" /> {t.previous}
          </button>
        )}
        <p className="text-center text-xs text-gray-400 ltr-num">{answeredCount} / {VANDERBILT_ITEMS.length}</p>
      </div>
    )
  }

  // ── Performance / impairment ───────────────────────────────
  if (phase === 'performance') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{t.sectionPerformance}</p>
            <h1 className="font-black text-xl text-gray-900">{t.perfTitle}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t.perfSubtitle}</p>
          </div>
          <button onClick={restart} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F9FAFB' }}>
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {PERFORMANCE_ITEMS.map(p => (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF' }}>
              <p className="font-bold text-sm text-gray-800 mb-3">{(lang as Lang) === 'en' ? p.textEn : p.text}</p>
              <div className="grid grid-cols-5 gap-1.5">
                {perfLabels.map((label, i) => {
                  const val = i + 1
                  const active = performance[p.id] === val
                  const danger = val >= 4
                  return (
                    <button
                      key={val}
                      onClick={() => setPerformance(prev => ({ ...prev, [p.id]: val }))}
                      className="rounded-xl py-2 px-1 text-[11px] font-black transition-all leading-tight"
                      style={active
                        ? { background: danger ? '#EF4444' : '#7C5CFC', color: '#fff' }
                        : { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setPhase('symptoms'); setCurrent(VANDERBILT_ITEMS.length - 1) }} className="flex items-center gap-1 text-sm text-gray-400 py-3 px-4">
            <ChevronRight className="w-4 h-4" /> {t.previous}
          </button>
          <button
            onClick={() => setPhase('results')}
            disabled={!allPerfAnswered}
            className="flex-1 font-black text-white py-3.5 rounded-2xl transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}
          >
            {t.continue}
          </button>
        </div>
      </div>
    )
  }

  // ── Results ────────────────────────────────────────────────
  const sub = SUBTYPE_LABEL[vb.subtype]
  const domainRows: { key: VanderbiltDomain; count: number; max: number }[] = [
    { key: 'inattention', count: vb.inattentionCount, max: 9 },
    { key: 'hyperactivity', count: vb.hyperactivityCount, max: 9 },
    { key: 'oppositional', count: vb.oppositionalCount, max: 8 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">{t.resultsTitle}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t.pageSubtitle}</p>
        </div>
        <button onClick={restart} className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: '#F3EEFF', color: '#6B46F0' }}>
          <RotateCcw className="w-3.5 h-3.5" /> {t.restartAssess}
        </button>
      </div>

      {/* Screen result */}
      <div className="rounded-3xl p-5" style={{ background: sub.bg, border: `1.5px solid ${sub.color}30` }}>
        <p className="text-xs font-bold mb-1" style={{ color: sub.color }}>{t.screenResult}</p>
        <h2 className="font-black text-xl mb-1" style={{ color: sub.color }}>{(lang as Lang) === 'en' ? sub.labelEn : sub.label}</h2>
        <p className="text-sm text-gray-600">{(lang as Lang) === 'en' ? sub.descEn : sub.desc}</p>
      </div>

      {/* Domain bars */}
      <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #F0E8FF' }}>
        {domainRows.map((row, i) => {
          const d = DOMAIN_META[row.key]
          const pct = Math.round((row.count / row.max) * 100)
          return (
            <div key={row.key} className="p-4" style={{ borderBottom: i < 2 ? '1px solid #F0E8FF' : 'none', background: '#FFFFFF' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>{d.emoji}</span>
                  <span className="font-black text-sm text-gray-900">{(lang as Lang) === 'en' ? d.labelEn : d.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg" style={{ color: d.color }}>{row.count}</span>
                  <span className="text-gray-400 text-sm ltr-num">/{row.max}</span>
                  <div className="text-[10px] text-gray-400">{t.symptomsPresent}</div>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Impairment */}
      <div className="rounded-2xl p-4" style={{ background: '#F9FAFB', border: '1.5px solid #F0E8FF' }}>
        <p className="font-black text-sm text-gray-700 mb-2">{t.impairmentTitle}</p>
        {vb.hasImpairment ? (
          <div className="flex flex-wrap gap-2">
            {vb.impairedAreas.map(areaId => {
              const p = PERFORMANCE_ITEMS.find(x => x.id === areaId)
              return (
                <span key={areaId} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                  {p ? ((lang as Lang) === 'en' ? p.textEn : p.text) : areaId}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t.noImpairment}</p>
        )}
      </div>

      {/* Oppositional note */}
      {vb.oppositionalConcern && (
        <div className="rounded-2xl p-4 text-sm font-bold" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', color: '#B45309' }}>
          🛑 {t.oppositionalNote}
        </div>
      )}

      {/* Recommended plan */}
      {plan.severity !== 'none' && (
        <div className="rounded-3xl p-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8DBFF' }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 20 }}>🗺️</span>
            <h3 className="font-black text-base text-gray-900">{t.planTitle}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">{t.planSubtitle}</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { val: plan.sessionsPerWeek, label: t.perWeek, emoji: '📅' },
              { val: plan.programWeeks,    label: t.weeks,   emoji: '⏳' },
              { val: plan.totalSessions,   label: t.totalSessions, emoji: '🎯' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: '#F3EEFF' }}>
                <div style={{ fontSize: 18 }}>{s.emoji}</div>
                <div className="font-black text-xl text-gray-900 ltr-num">{s.val}</div>
                <div className="text-[10px] text-gray-500 font-bold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {plan.targetDomains.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-black text-gray-600 mb-2">{t.pathTitle}</p>
              <div className="space-y-1.5">
                {plan.targetDomains.map((d, i) => (
                  <div key={d.key} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#F9FAFB' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0" style={{ background: DOMAIN_META[d.key as VanderbiltDomain]?.color ?? '#7C5CFC' }}>{i + 1}</span>
                    <span className="font-bold text-sm text-gray-800">{(lang as Lang) === 'en' ? (DOMAIN_META[d.key as VanderbiltDomain]?.labelEn ?? d.label) : d.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-auto" style={{ background: d.priority === 'high' ? '#FEF2F2' : '#FFFBEB', color: d.priority === 'high' ? '#DC2626' : '#D97706' }}>
                      {d.priority === 'high' ? t.priorityHigh : t.priorityMedium}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: 15 }}>🔁</span>
            <span className="text-xs font-bold text-emerald-800">{t.reassess} {plan.reassessWeeks} {t.reassessUnit}</span>
          </div>
        </div>
      )}

      {/* Disclaimer reminder */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
        <p className="text-xs text-amber-700"><strong>{t.disclaimerLabel}</strong> {t.disclaimerText}</p>
      </div>

      {/* Save */}
      {children.length > 0 && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#F9FAFB', border: '1.5px solid #F0E8FF' }}>
          <p className="font-black text-sm text-gray-700">{t.saveTitle}</p>
          {children.length > 1 && (
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none"
            >
              {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          )}
          {saved ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
              <CheckCircle className="w-4 h-4" /> {t.saved}
            </div>
          ) : (
            <button
              onClick={saveResults}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full font-black text-sm py-3 rounded-xl transition-all"
              style={{ background: '#7C5CFC', color: '#FFFFFF' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t.saving : t.save}
            </button>
          )}
          {saveError && <p className="text-xs text-red-600 font-bold">{saveError}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <a href="/parent/exercises" className="rounded-2xl p-4 text-center font-black text-sm" style={{ background: '#7C5CFC', color: '#FFFFFF' }}>{t.startExercises}</a>
        <a href="/parent/appointments" className="rounded-2xl p-4 text-center font-black text-sm" style={{ background: '#F3EEFF', color: '#6B46F0', border: '1.5px solid #E8DBFF' }}>{t.bookSession}</a>
      </div>
    </div>
  )
}
