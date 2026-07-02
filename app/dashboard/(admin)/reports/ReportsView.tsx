'use client'
import { motion } from 'framer-motion'
import { FileText, TrendingUp, Brain, Plus, AlertCircle, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { ProgressReport, Student } from '@/lib/types'
import { staggerContainer, fadeUp, popIn, liftHover } from '@/lib/motion'
import { ACountUp } from '@/components/ui'

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar'
}

const TYPE_BADGE: Record<string, string> = {
  weekly:  'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  monthly: 'bg-brand-100 text-brand-700 ring-1 ring-brand-200',
  session: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
}

const AVATAR_GRADIENTS = [
  'from-brand-600 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',  'from-brand-500 to-blue-600',
]

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 5) * 100
  const color = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-black text-gray-800 ltr-num">{score}/5</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

export default function ReportsView({ allReports, error }: {
  allReports: Array<{ report: ProgressReport; student: Student; parentName: string; parentIdx: number }>
  error: boolean
}) {
  const { lang } = useLang()
  const t = tr[lang].adminReports
  const adminT = tr[lang].adminChrome

  const METRIC_LABELS: Record<string, string> = t.metricLabels
  const TYPE_LABEL: Record<string, string> = t.typeLabels

  const uniqueStudents = new Set(allReports.map(r => r.student.id)).size

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-500" />
            {t.pageTitle}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.pageSubtitle}</p>
        </div>
        <motion.div {...liftHover}>
          <Link
            href="/dashboard/reports/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            {t.newReportButton}
          </Link>
        </motion.div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{adminT.dbConnectionError}</p>
        </motion.div>
      )}

      {/* ── Stats Strip ── */}
      <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-3">
        {[
          { label: t.statTotalReports,         value: allReports.length,                                         bg: 'bg-brand-600',   glow: 'shadow-brand-500/20',   icon: FileText },
          { label: t.statMonthlyReports,        value: allReports.filter(r => r.report.type === 'monthly').length, bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20', icon: TrendingUp },
          { label: t.statChildrenWithReports, value: uniqueStudents,                                             bg: 'bg-violet-600',  glow: 'shadow-violet-500/20',  icon: Brain },
        ].map(({ label, value, bg, glow, icon: Icon }) => (
          <motion.div key={label} variants={popIn} {...liftHover} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num"><ACountUp value={value} /></div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Reports ── */}
      {allReports.length === 0 && !error ? (
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-900 font-black text-lg">{t.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-1 mb-6 max-w-sm mx-auto">
            {t.emptySubtitle}
          </p>
          <Link href="/dashboard/reports/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t.createFirstReportButton}
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} className="space-y-4">
          {allReports.map(({ report, student, parentName, parentIdx }) => {
            const completionPct = report.totalExercises > 0
              ? Math.round((report.completedExercises / report.totalExercises) * 100)
              : 0
            const avgRating = report.behaviorRatings?.length > 0
              ? (report.behaviorRatings.reduce((s, r) => s + r.score, 0) / report.behaviorRatings.length).toFixed(1)
              : null
            const gradient = AVATAR_GRADIENTS[parentIdx % AVATAR_GRADIENTS.length]
            const barColor = completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-400' : 'bg-red-400'

            return (
              <motion.div
                key={report.id}
                variants={fadeUp}
                {...liftHover}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:border-brand-200 transition-colors"
              >

                {/* Report header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0`}>
                      {student.firstName?.[0]?.toUpperCase() ?? <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-gray-400 text-[11px] mt-0.5">{parentName} · {student.diagnosis}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${TYPE_BADGE[report.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABEL[report.type] ?? report.type}
                    </span>
                    <span className="text-[11px] text-gray-400 ltr-num bg-gray-50 px-2.5 py-1 rounded-full">
                      {new Date(report.createdAt).toLocaleDateString(localeFor(lang))}
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Progress block */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.completedExercisesLabel}</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-4xl font-black text-gray-900 ltr-num"><ACountUp value={completionPct} suffix="%" /></span>
                      <span className="text-gray-400 text-sm mb-1 ltr-num">{report.completedExercises}/{report.totalExercises}</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPct}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-black text-gray-900 text-sm ltr-num"><ACountUp value={report.pointsEarned} /></span>
                      <span className="text-gray-400 text-xs">{t.pointEarnedSuffix}</span>
                    </div>
                    {avgRating && (
                      <div className="mt-2 text-xs text-gray-500 ltr-num">
                        {t.avgRatingPrefix} <span className="font-black text-brand-600">{avgRating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Behavior ratings */}
                  {report.behaviorRatings?.length > 0 && (
                    <div className="lg:col-span-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.behaviorRatingTitle}</p>
                      <div className="space-y-3">
                        {report.behaviorRatings.map((rating, i) => (
                          <ScoreBar key={i} score={rating.score} label={METRIC_LABELS[rating.metric] ?? rating.metric} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(report.professorNotes || report.aiSummary) && (
                  <div className="px-6 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {report.professorNotes && (
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.professorNotesTitle}</p>
                        <p className="text-gray-700 text-sm leading-relaxed">{report.professorNotes}</p>
                      </div>
                    )}
                    {report.aiSummary && (
                      <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {t.aiSummaryTitle}
                        </p>
                        <p className="text-brand-800 text-sm leading-relaxed">{report.aiSummary}</p>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
