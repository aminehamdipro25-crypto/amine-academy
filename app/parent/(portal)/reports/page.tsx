'use client'
import { useEffect, useState, useRef } from 'react'
import { Printer, TrendingUp, Award } from 'lucide-react'
import type { Student, ProgressReport } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

interface ChildReports { child: Student; reports: ProgressReport[] }

const METRIC_ICONS: Record<string, string> = {
  attention:            '🎯',
  impulse_control:      '🛑',
  social_interaction:   '🤝',
  motor_coordination:   '🏃',
  emotional_regulation: '💙',
}

const TYPE_ICONS: Record<string, string> = {
  session: '📋',
  weekly:  '📅',
  monthly: '📊',
}

const SCORE_STYLE: Record<number, { color: string; bg: string; bar: string }> = {
  1: { color: '#B91C1C', bg: '#FEF2F2', bar: '#EF4444' },
  2: { color: '#C2410C', bg: '#FFF7ED', bar: '#F97316' },
  3: { color: '#B45309', bg: '#FFFBEB', bar: '#F59E0B' },
  4: { color: '#047857', bg: '#ECFDF5', bar: '#10B981' },
  5: { color: '#065F46', bg: '#D1FAE5', bar: '#059669' },
}

function ProgressRing({ pct, size = 88 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 100) / 100 * circ
  const clr = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={11} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={clr} strokeWidth={11}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

function ReportDocument({ report, child }: { report: ProgressReport; child: Student }) {
  const { lang } = useLang()
  const t = tr[lang].parentReports
  const coachName = tr[lang].portal.common.coachName
  const yearsUnit = tr[lang].parentChildren.yearsUnit
  const severityLabels = tr[lang].parentChildren.severityLabels
  const metricLabels = tr[lang].parentProgress.metricLabels
  const docRef = useRef<HTMLDivElement>(null)
  const pct    = report.totalExercises > 0 ? Math.round((report.completedExercises / report.totalExercises) * 100) : 0
  const avg    = report.behaviorRatings?.length > 0
    ? report.behaviorRatings.reduce((s, r) => s + r.score, 0) / report.behaviorRatings.length
    : 0
  const avgRounded = Math.round(avg)
  const overallCfg = avg >= 4.5
    ? { label: t.overallExcellent,        color: '#065F46', bg: '#D1FAE5', icon: '🏆' }
    : avg >= 3.5
    ? { label: t.overallGood,             color: '#047857', bg: '#ECFDF5', icon: '⭐' }
    : avg >= 2.5
    ? { label: t.overallAverage,          color: '#B45309', bg: '#FFFBEB', icon: '📈' }
    : { label: t.overallNeedsImprovement, color: '#B91C1C', bg: '#FEF2F2', icon: '💪' }

  const typeLabel = t.typeLabels[report.type as keyof typeof t.typeLabels] ?? report.type
  const typeIcon = TYPE_ICONS[report.type] ?? '📄'
  const locale = lang === 'ar' ? 'fr-FR' : lang === 'fr' ? 'fr-FR' : 'en-US'
  const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const issueDate  = new Date(report.createdAt).toLocaleDateString(locale, dateOpts)
  const periodFrom = new Date(report.periodStart).toLocaleDateString(locale, dateOpts)
  const periodTo   = new Date(report.periodEnd).toLocaleDateString(locale, dateOpts)
  const diagnosisFull = t.diagnosisFullLabels[child.diagnosis as keyof typeof t.diagnosisFullLabels] ?? child.diagnosis

  function handlePrint() {
    if (!docRef.current) return
    const html = docRef.current.innerHTML
    const win = window.open('', '_blank', 'width=860,height=750')
    if (!win) return
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    win.document.write(`<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${t.printDocTitle(child.firstName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Cairo',Arial,sans-serif;background:#fff;color:#111827;direction:${dir};font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .doc{max-width:780px;margin:0 auto;padding:0}
    .ltr-num{direction:ltr;unicode-bidi:embed;display:inline-block}
    @media print{@page{margin:15mm}}
  </style>
</head>
<body>
  <div class="doc">${html}</div>
  <script>window.onload=()=>{setTimeout(()=>{window.print()},600)}<\/script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

      {/* Print button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 20px 0', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
        <button
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          <Printer style={{ width: 14, height: 14 }} />
          {t.printButtonLabel}
        </button>
        <span style={{ marginRight: 'auto', fontSize: 11, color: '#9CA3AF', alignSelf: 'center' }}>
          {typeIcon} {typeLabel} · <span className="ltr-num">{issueDate}</span>
        </span>
      </div>

      {/* ═══════════════════ PRINTABLE DOCUMENT ════════════════════ */}
      <div ref={docRef}>

        {/* ── 1. Letterhead ── */}
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#3730a3 55%,#6366f1 100%)', padding: '28px 32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.18)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🧠</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 19, lineHeight: 1.2 }}>{t.academyName}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 3 }}>{t.academyTagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {typeIcon} {typeLabel}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4 }}>{t.issueDateLabel} <span className="ltr-num">{issueDate}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              {t.docHeaderLabel}
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>
              {t.progressReportTitle(`${child.firstName} ${child.lastName}`)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>
              {t.periodLabel} <span className="ltr-num">{periodFrom}</span> — <span className="ltr-num">{periodTo}</span>
            </div>
          </div>
        </div>

        {/* ── 2. Student & Therapist Info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1.5px solid #F3F4F6' }}>
          {/* Student */}
          <div style={{ padding: '20px 28px', borderLeft: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{t.studentInfoLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {child.firstName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#111827' }}>{child.firstName} {child.lastName}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{diagnosisFull}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: t.ageGroupLabel, val: `${child.ageGroup} ${yearsUnit}` },
                { label: t.severityLabel, val: severityLabels[child.severityLevel as keyof typeof severityLabels] },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#111827', fontWeight: 700, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Therapist */}
          <div style={{ padding: '20px 28px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{t.therapistInfoLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0891b2,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{t.professorFullName[0]}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#111827' }}>{t.professorFullName}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{t.professorTitle}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: t.domainLabel,     val: t.domainValue },
                { label: t.reportTypeLabel, val: typeLabel },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#111827', fontWeight: 700, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1.5px solid #F3F4F6' }}>
          {[
            { label: t.kpiCompletionRate,      val: `${pct}%`,                                 icon: '📊', color: pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626' },
            { label: t.kpiCompletedExercises,  val: `${report.completedExercises}/${report.totalExercises}`, icon: '✅', color: '#4F46E5' },
            { label: t.kpiPointsEarned,        val: String(report.pointsEarned),               icon: '⭐', color: '#D97706' },
            { label: t.kpiAvgBehavior,         val: avg > 0 ? `${avg.toFixed(1)}/5` : '—',    icon: '🧠', color: avg >= 4 ? '#059669' : avg >= 3 ? '#D97706' : '#DC2626' },
          ].map(({ label, val, icon, color }, i) => (
            <div key={i} style={{ padding: '18px 20px', borderLeft: i > 0 ? '1px solid #F3F4F6' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontWeight: 900, fontSize: 20, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── 4. Exercise Progress ── */}
        <div style={{ padding: '22px 28px', borderBottom: '1.5px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            {t.exerciseProgressLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing pct={pct} size={96} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626', lineHeight: 1 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444', borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6B7280' }}>{t.completedOfTotalPrefix} <strong style={{ color: '#111827' }}>{report.completedExercises}</strong> {t.completedOfTotalUnit} <strong style={{ color: '#111827' }}>{report.totalExercises}</strong></span>
                <span style={{ color: '#6B7280' }}>⭐ {report.pointsEarned} {t.pointsEarnedSuffix}</span>
              </div>
            </div>
            {/* Overall badge */}
            <div style={{ background: overallCfg.bg, borderRadius: 14, padding: '12px 18px', textAlign: 'center', flexShrink: 0, minWidth: 110 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{overallCfg.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 13, color: overallCfg.color }}>{overallCfg.label}</div>
            </div>
          </div>
        </div>

        {/* ── 5. Behavioral Assessment Table ── */}
        {report.behaviorRatings?.length > 0 && (
          <div style={{ padding: '22px 28px', borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
              {t.behavioralAssessmentLabel}
            </div>

            {/* Scale legend */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {[1,2,3,4,5].map(v => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, background: SCORE_STYLE[v].bg, padding: '3px 10px', borderRadius: 20 }}>
                  <span style={{ fontWeight: 900, fontSize: 11, color: SCORE_STYLE[v].color }}>{v}</span>
                  <span style={{ fontSize: 10, color: SCORE_STYLE[v].color }}>{t.scoreLabels[v as keyof typeof t.scoreLabels]}</span>
                </div>
              ))}
            </div>

            {/* Ratings rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.behaviorRatings.map(({ metric, score }, i) => {
                const style = SCORE_STYLE[score as 1|2|3|4|5] ?? SCORE_STYLE[3]
                const scoreText = t.scoreLabels[score as keyof typeof t.scoreLabels] ?? ''
                const icon = METRIC_ICONS[metric] ?? '📌'
                const label = metricLabels[metric as keyof typeof metricLabels] ?? metric
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FAFAFA', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#374151', width: 160, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: style.bar, borderRadius: 99 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: 13, color: style.color, minWidth: 20, textAlign: 'center' }}>{score}</span>
                      <span style={{ background: style.bg, color: style.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{scoreText}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Average summary */}
            {avg > 0 && (
              <div style={{ marginTop: 14, background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#3730A3' }}>{t.avgBehaviorOverallLabel}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: 24, color: '#3730A3' }}>{avg.toFixed(1)}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#6366F1' }}>/5</span>
                  <span style={{ fontWeight: 900, fontSize: 13, color: '#4F46E5', marginRight: 6, background: 'white', padding: '2px 10px', borderRadius: 20 }}>
                    {t.scoreLabels[avgRounded as keyof typeof t.scoreLabels] ?? ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 6. Professor Notes ── */}
        {report.professorNotes && (
          <div style={{ padding: '22px 28px', borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#0891B2', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
              ✏️ {tr[lang].parentProgress.professorNotesLabel(coachName)}
            </div>
            <div style={{ background: '#F8FAFF', border: '1.5px solid #E0E7FF', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ color: '#1E3A5F', fontSize: 14, lineHeight: 1.9, fontWeight: 500 }}>{report.professorNotes}</p>
            </div>
          </div>
        )}

        {/* ── 7. AI Summary ── */}
        {report.aiSummary && (
          <div style={{ padding: '22px 28px', borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#D97706', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✨</span> {t.aiSummaryLabel}
            </div>
            <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ color: '#78350F', fontSize: 14, lineHeight: 1.9, fontWeight: 500 }}>{report.aiSummary}</p>
            </div>
          </div>
        )}

        {/* ── 8. Recommendations Banner ── */}
        <div style={{ padding: '18px 28px', background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', borderBottom: '1.5px solid #BBF7D0' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#065F46', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            {t.familyRecommendationsLabel}
          </div>
          <p style={{ color: '#064E3B', fontSize: 13, lineHeight: 1.8 }}>
            {pct >= 80
              ? t.recommendationHigh(child.firstName)
              : pct >= 50
              ? t.recommendationMedium(child.firstName)
              : t.recommendationLow(child.firstName)
            }
          </p>
        </div>

        {/* ── 9. Footer / Signature ── */}
        <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', background: '#F9FAFB' }}>
          <div>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>{t.footerIssuedByLabel}</div>
            <div style={{ fontWeight: 900, fontSize: 13, color: '#1e1b4b' }}>{t.footerAcademyFullName}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{t.footerCopyright} {new Date().getFullYear()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, borderTop: '1.5px solid #9CA3AF', marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 700 }}>{t.footerSignatureName}</div>
            <div style={{ fontSize: 9, color: '#9CA3AF' }}>{t.footerSignatureTitle}</div>
          </div>
        </div>

      </div>
      {/* ═══════════════════ END OF PRINTABLE DOCUMENT ════════════ */}
    </div>
  )
}

export default function ReportsPage() {
  const { lang } = useLang()
  const t = tr[lang].parentReports
  const coachName = tr[lang].portal.common.coachName
  const [data, setData] = useState<ChildReports[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState('')

  useEffect(() => {
    fetch('/api/parent/reports')
      .then(r => r.json())
      .then(d => {
        setData(d.reportsPerChild || [])
        if (d.reportsPerChild?.[0]) setSelectedChild(d.reportsPerChild[0].child.id)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1.5s linear infinite' }}>📋</div>
        <p style={{ color: '#9CA3AF', fontSize: 13 }}>{t.loadingReports}</p>
      </div>
    </div>
  )

  const current = data.find(d => d.child.id === selectedChild)
  const reports  = current?.reports ?? []

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: '#EEF2FF' }}>📄</div>
        <div>
          <h1 className="font-black text-xl text-gray-900">{t.pageTitle}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t.pageSubtitle(coachName)}</p>
        </div>
      </div>

      {/* ── Child selector ── */}
      {data.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {data.map(({ child }) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={selectedChild === child.id
                ? { background: '#4F46E5', color: '#fff' }
                : { background: '#F5F3FF', color: '#6B7280', border: '1.5px solid #E0E7FF' }}
            >
              {child.firstName}
            </button>
          ))}
        </div>
      )}

      {/* ── Report count strip ── */}
      {reports.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-500 bg-white rounded-2xl px-5 py-3" style={{ border: '1.5px solid #E0E7FF' }}>
          <Award className="w-4 h-4 text-indigo-500" />
          <span>
            <strong className="text-gray-900 font-black">{reports.length}</strong> {t.reportsAvailableSuffix(current?.child.firstName ?? '')}
          </span>
          <span className="text-gray-300">·</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-xs">{t.printableNote}</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {reports.length === 0 ? (
        <div className="rounded-3xl py-20 text-center" style={{ background: '#FFFFFF', border: '2px dashed #E0E7FF' }}>
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-black text-gray-700 text-lg mb-2">{t.noReportsTitle}</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{t.noReportsBody(coachName)}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map(report => (
            <ReportDocument key={report.id} report={report} child={current!.child} />
          ))}
        </div>
      )}

      {/* ── Info note ── */}
      <div className="rounded-2xl p-4 text-sm leading-relaxed" style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#5B21B6' }}>
        <strong>{t.infoNoteLabel}</strong>
        {t.infoNoteBody}
      </div>

    </div>
  )
}
