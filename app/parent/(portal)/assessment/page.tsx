'use client'
import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, RotateCcw, CheckCircle, Save, Loader2 } from 'lucide-react'
import {
  QUESTIONS, DOMAINS, DOMAIN_ORDER, ANSWER_LABELS, ANSWER_COLORS, ANSWER_BG,
  getScoreLevel, getDomainScores,
  type DomainKey,
} from '@/lib/assessment-data'
import { buildRecommendedPlan } from '@/lib/assessment-plan'
import { useLang, tr } from '@/lib/i18n'

type Phase = 'intro' | 'questions' | 'results'

interface Child { id: string; firstName: string; lastName: string }
interface PastAssessment { id: string; completedAt: string; totalScore: number; severity: string; studentId: string }

const SEVERITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  none:     { label: 'طبيعي',      color: '#065F46', bg: '#D1FAE5' },
  mild:     { label: 'خفيف',       color: '#B45309', bg: '#FFFBEB' },
  moderate: { label: 'متوسط',      color: '#C2410C', bg: '#FFF7ED' },
  severe:   { label: 'مرتفع',      color: '#B91C1C', bg: '#FEF2F2' },
}

export default function AssessmentPage() {
  const { lang } = useLang()
  const t = tr[lang].parentAssessment
  const [phase, setPhase]     = useState<Phase>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
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

  const question = QUESTIONS[current]
  const progress = Math.round(((current) / QUESTIONS.length) * 100)
  const answered = Object.keys(answers).length

  function answer(value: number) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setPhase('results')
    }
  }

  function restart() {
    setAnswers({})
    setCurrent(0)
    setPhase('intro')
    setSaved(false)
    setSaveError('')
  }

  async function saveResults() {
    if (!selectedChild || saving || saved) return
    setSaving(true)
    setSaveError('')
    try {
      const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0)
      const res = await fetch('/api/parent/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedChild,
          type: 'attention-domains',
          domainScores,
          totalScore,
          severity: totalScore >= 45 ? 'severe' : totalScore >= 30 ? 'moderate' : totalScore >= 15 ? 'mild' : 'none',
          recommendations: DOMAIN_ORDER.filter(k => domainScores[k] >= 5).flatMap(k => DOMAINS[k].exerciseTips),
          answers: Object.entries(answers).map(([id, rating]) => ({ itemId: id, rating })),
        }),
      })
      if (res.ok) setSaved(true)
      else setSaveError(t.saveError)
    } catch {
      setSaveError(t.networkError)
    } finally {
      setSaving(false)
    }
  }

  const domainScores = getDomainScores(answers)
  const worstDomain = DOMAIN_ORDER.reduce((a, b) => domainScores[a] >= domainScores[b] ? a : b)

  // ── Intro ──────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t.pageSubtitle}</p>
      </div>

      {/* Hero card */}
      <div
        className="rounded-3xl p-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#4A20C8)' }}
      >
        <div style={{ fontSize: 64, marginBottom: 12 }}>🧠</div>
        <h2 className="font-black text-xl mb-2">{t.heroQuestion}</h2>
        <p className="text-white/80 text-sm leading-relaxed">
          {t.heroBody}
        </p>
      </div>

      {/* 4 domains preview */}
      <div className="grid grid-cols-2 gap-3">
        {DOMAIN_ORDER.map(key => {
          const d = DOMAINS[key]
          return (
            <div
              key={key}
              className="rounded-2xl p-4"
              style={{ background: d.bg, border: `1.5px solid ${d.color}22` }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{d.emoji}</div>
              <div className="font-black text-sm" style={{ color: d.color }}>{d.label}</div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">{d.protocol}</div>
            </div>
          )
        })}
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-4" style={{ background: '#F9FAFB', border: '1.5px solid #F0E8FF' }}>
        <p className="font-black text-sm text-gray-700 mb-3">{t.howItWorksTitle}</p>
        <div className="space-y-2">
          {['📋', '⚖️', '📊', '🎯'].map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ fontSize: 16 }}>{e}</span>
              <span className="text-sm text-gray-600">{t.howItWorksSteps[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
        <p className="text-xs text-amber-700">
          ⚠️ <strong>{t.disclaimerLabel}</strong> {t.disclaimerText}
        </p>
      </div>

      {/* Previous assessments */}
      {pastAssessments.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF' }}>
          <p className="font-black text-sm text-gray-700 mb-3">📊 آخر تقييمات مكتملة</p>
          <div className="space-y-2">
            {pastAssessments.map(a => {
              const sev = SEVERITY_LABEL[a.severity] ?? SEVERITY_LABEL.mild
              const childName = children.find(c => c.id === a.studentId)?.firstName ?? ''
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#F9FAFB' }}>
                  <div>
                    <div className="text-xs font-bold text-gray-700">
                      {new Date(a.completedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {childName ? ` · ${childName}` : ''}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 ltr-num">{a.totalScore}/60 نقطة</div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sev.bg, color: sev.color }}>
                    {sev.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setPhase('questions')}
        className="w-full font-black text-lg text-white py-4 rounded-2xl transition-all"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
      >
        {pastAssessments.length > 0 ? 'إعادة التقييم' : t.startButton}
      </button>
    </div>
  )

  // ── Questions ──────────────────────────────────────────────
  if (phase === 'questions') {
    const domainInfo = DOMAINS[question.domain]
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{t.questionCounter(current + 1, QUESTIONS.length)}</p>
            <div className="font-black text-sm mt-0.5" style={{ color: domainInfo.color }}>
              {domainInfo.emoji} {domainInfo.label}
            </div>
          </div>
          <button
            onClick={restart}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#F9FAFB' }}
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, progress)}%`, background: domainInfo.color }}
          />
        </div>

        {/* Question card */}
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: domainInfo.bg, border: `2px solid ${domainInfo.color}30` }}
        >
          <div style={{ fontSize: 72, marginBottom: 20 }}>{question.emoji}</div>
          <p className="font-black text-xl text-gray-900 leading-relaxed">{question.text}</p>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-3">
          {ANSWER_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => answer(i)}
              className="rounded-2xl py-4 font-black text-base transition-all"
              style={{
                background: ANSWER_BG[i],
                color: ANSWER_COLORS[i],
                border: `2px solid ${ANSWER_COLORS[i]}40`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${ANSWER_COLORS[i]}40`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = ''
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Back button */}
        {current > 0 && (
          <button
            onClick={() => setCurrent(c => c - 1)}
            className="flex items-center gap-1 text-sm text-gray-400 mx-auto"
          >
            <ChevronRight className="w-4 h-4" /> {t.previousQuestion}
          </button>
        )}

        {/* Answered count */}
        <p className="text-center text-xs text-gray-400">{t.answeredCount(answered, QUESTIONS.length)}</p>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────
  const topDomain  = DOMAINS[worstDomain]
  const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0)
  const plan       = buildRecommendedPlan(domainScores, totalScore)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">{t.resultsTitle}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t.resultsSubtitle(QUESTIONS.length)}</p>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl"
          style={{ background: '#F3EEFF', color: '#6B46F0' }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> {t.restartButton}
        </button>
      </div>

      {/* Overall summary */}
      <div
        className="rounded-3xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${topDomain.color}, ${topDomain.color}cc)` }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>{topDomain.emoji}</div>
        <p className="text-white/70 text-xs mb-1">{t.topDomainLabel}</p>
        <h2 className="font-black text-xl mb-1">{topDomain.label}</h2>
        <p className="text-white/80 text-sm">{topDomain.description}</p>
        <div
          className="mt-3 rounded-2xl px-3 py-2 text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          {t.recommendedProtocol(topDomain.protocol)}
        </div>
      </div>

      {/* Recommended plan — session count + path */}
      {plan.severity !== 'none' && (
        <div className="rounded-3xl p-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8DBFF' }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 20 }}>🗺️</span>
            <h3 className="font-black text-base text-gray-900">الخطة المقترحة</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">نقطة انطلاق يعتمدها الأخصائي ويعدّلها حسب حالة طفلك</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { val: plan.sessionsPerWeek, label: 'حصص / أسبوع', emoji: '📅' },
              { val: plan.programWeeks,    label: 'أسبوعاً',      emoji: '⏳' },
              { val: plan.totalSessions,   label: 'إجمالي الحصص', emoji: '🎯' },
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
              <p className="text-xs font-black text-gray-600 mb-2">🧭 المسار — المجالات المستهدفة بالترتيب:</p>
              <div className="space-y-1.5">
                {plan.targetDomains.map((d, i) => (
                  <div key={d.key} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#F9FAFB' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0" style={{ background: DOMAINS[d.key as DomainKey].color }}>{i + 1}</span>
                    <span className="font-bold text-sm text-gray-800">{d.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-auto" style={{ background: d.priority === 'high' ? '#FEF2F2' : '#FFFBEB', color: d.priority === 'high' ? '#DC2626' : '#D97706' }}>
                      {d.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: 15 }}>🔁</span>
            <span className="text-xs font-bold text-emerald-800">يُنصح بإعادة التقييم بعد {plan.reassessWeeks} أسابيع لقياس التحسّن بالأرقام</span>
          </div>
        </div>
      )}

      {/* Domain bars */}
      <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #F0E8FF' }}>
        {DOMAIN_ORDER.map((key, i) => {
          const d    = DOMAINS[key]
          const sc   = domainScores[key]
          const lvl  = getScoreLevel(sc)
          const pct  = Math.round((sc / 15) * 100)
          return (
            <div
              key={key}
              className="p-4"
              style={{ borderBottom: i < 3 ? '1px solid #F0E8FF' : 'none', background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>{d.emoji}</span>
                  <div>
                    <div className="font-black text-sm text-gray-900">{d.label}</div>
                    <div className="text-xs text-gray-400">{d.labelEn}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg" style={{ color: lvl.color }}>{sc}</span>
                  <span className="text-gray-400 text-sm">/15</span>
                  <div
                    className="text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full text-center"
                    style={{ background: lvl.bg, color: lvl.color }}
                  >
                    {lvl.emoji} {lvl.label}
                  </div>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: d.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Exercise recommendations */}
      <div>
        <h3 className="font-black text-base text-gray-900 mb-3">{t.recommendedExercisesTitle}</h3>
        <div className="space-y-3">
          {DOMAIN_ORDER
            .filter(key => domainScores[key] >= 5)
            .sort((a, b) => domainScores[b] - domainScores[a])
            .map(key => {
              const d   = DOMAINS[key]
              const lvl = getScoreLevel(domainScores[key])
              return (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{ background: d.bg, border: `1.5px solid ${d.color}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 20 }}>{d.emoji}</span>
                    <span className="font-black text-sm" style={{ color: d.color }}>{d.label}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold mr-auto"
                      style={{ background: lvl.bg, color: lvl.color, border: `1px solid ${lvl.color}40` }}
                    >
                      {lvl.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {d.exerciseTips.map(tip => (
                      <span
                        key={tip}
                        className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: '#FFFFFF', color: d.color, border: `1px solid ${d.color}40` }}
                      >
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          {DOMAIN_ORDER.every(k => domainScores[k] < 5) && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: '#F0FFF4', border: '1.5px solid #BBF7D0' }}
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#16A34A' }} />
              <p className="font-black text-green-800">{t.allNormalTitle}</p>
              <p className="text-green-700 text-sm mt-1">{t.allNormalSubtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Score summary */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: '#F9FAFB', border: '1.5px solid #F0E8FF' }}
      >
        <div>
          <p className="text-xs text-gray-400">{t.totalScoreLabel}</p>
          <p className="font-black text-2xl text-gray-900">{totalScore}<span className="text-gray-400 font-normal text-sm">/60</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1">{t.distributionLabel}</p>
          <div className="flex gap-1">
            {DOMAIN_ORDER.map(k => (
              <div key={k} title={DOMAINS[k].label} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-2 rounded-full"
                  style={{ height: Math.max(8, Math.round((domainScores[k]/15)*40)), background: DOMAINS[k].color }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save to server */}
      {children.length > 0 && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#F9FAFB', border: '1.5px solid #F0E8FF' }}>
          <p className="font-black text-sm text-gray-700">{t.saveResultsTitle}</p>
          {children.length > 1 && (
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none"
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          )}
          {saved ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
              <CheckCircle className="w-4 h-4" /> {t.savedSuccess}
            </div>
          ) : (
            <button
              onClick={saveResults}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full font-black text-sm py-3 rounded-xl transition-all"
              style={{ background: '#7C5CFC', color: '#FFFFFF' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t.saving : t.saveButton}
            </button>
          )}
          {saveError && <p className="text-xs text-red-600 font-bold">{saveError}</p>}
        </div>
      )}

      {/* Navigation links */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/parent/exercises"
          className="rounded-2xl p-4 text-center font-black text-sm transition-all"
          style={{ background: '#7C5CFC', color: '#FFFFFF' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#5A32D9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#7C5CFC' }}
        >
          {t.startExercisesLink}
        </a>
        <a
          href="/parent/appointments"
          className="rounded-2xl p-4 text-center font-black text-sm transition-all"
          style={{ background: '#F3EEFF', color: '#6B46F0', border: '1.5px solid #E8DBFF' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
        >
          {t.bookSessionLink}
        </a>
      </div>

      {/* Back nav buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setPhase('questions'); setCurrent(QUESTIONS.length - 1) }}
          className="flex items-center gap-1.5 text-sm text-gray-400 py-2"
        >
          <ChevronRight className="w-4 h-4" />
          <ChevronLeft className="w-4 h-4 -mr-3" />
          {t.reviewAnswers}
        </button>
      </div>
    </div>
  )
}
