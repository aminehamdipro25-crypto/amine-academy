'use client'
import { motion } from 'framer-motion'
import { BarChart3, Users, TrendingUp, Calendar, Dumbbell, Globe, Brain, AlertCircle, DollarSign } from 'lucide-react'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { getAllParents, getAllExercises, getAllAppointments, getAllPendingPayments } from '@/lib/db'
import { staggerContainer, fadeUp, popIn, liftHover } from '@/lib/motion'
import { ACountUp } from '@/components/ui'

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar'
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 font-medium w-28 text-right shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-sm font-black text-gray-800 ltr-num w-8 text-left">{value}</span>
    </div>
  )
}

export default function AnalyticsView({ parents, exercises, appointments, payments, error }: {
  parents: Awaited<ReturnType<typeof getAllParents>>
  exercises: Awaited<ReturnType<typeof getAllExercises>>
  appointments: Awaited<ReturnType<typeof getAllAppointments>>
  payments: Awaited<ReturnType<typeof getAllPendingPayments>>
  error: boolean
}) {
  const { lang } = useLang()
  const t = tr[lang].adminAnalytics
  const adminT = tr[lang].adminChrome
  const catLabels = tr[lang].portal.common.categoryLabels

  // ── Revenue (confirmed payments only) ───────────────────────
  const confirmedPayments = payments.filter(p => p.status === 'confirmed')
  const revenueByCurrency: Record<string, number> = {}
  confirmedPayments.forEach(p => {
    revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] ?? 0) + p.amount
  })
  const now30 = Date.now() - 30 * 24 * 3600 * 1000
  const revenueLast30dByCurrency: Record<string, number> = {}
  confirmedPayments
    .filter(p => new Date(p.createdAt).getTime() >= now30)
    .forEach(p => {
      revenueLast30dByCurrency[p.currency] = (revenueLast30dByCurrency[p.currency] ?? 0) + p.amount
    })

  // ── Subscription breakdown ──────────────────────────────────
  const statusCounts = {
    active:    parents.filter(p => p.subscriptionStatus === 'active').length,
    pending:   parents.filter(p => p.subscriptionStatus === 'pending').length,
    suspended: parents.filter(p => p.subscriptionStatus === 'suspended').length,
    expired:   parents.filter(p => p.subscriptionStatus === 'expired').length,
    cancelled: parents.filter(p => p.subscriptionStatus === 'cancelled').length,
  }

  const planCounts = {
    basic:    parents.filter(p => p.subscriptionPlan === 'basic').length,
    standard: parents.filter(p => p.subscriptionPlan === 'standard').length,
    premium:  parents.filter(p => p.subscriptionPlan === 'premium').length,
  }

  // ── Country distribution ────────────────────────────────────
  const countryCounts: Record<string, number> = {}
  parents.forEach(p => {
    const c = p.country || t.unspecifiedCountry
    countryCounts[c] = (countryCounts[c] ?? 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // ── Exercise category breakdown ─────────────────────────────
  const catCounts: Record<string, number> = {}
  exercises.forEach(e => {
    catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  })

  // ── Monthly registrations (last 6 months) ──────────────────
  const now = new Date()
  const months: Array<{ label: string; count: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString(localeFor(lang), { month: 'short', year: '2-digit' })
    const count = parents.filter(p => {
      const created = new Date(p.createdAt)
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
    }).length
    months.push({ label, count })
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1)

  // ── Appointment stats ───────────────────────────────────────
  const apptStats = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          {t.pageTitle}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t.pageSubtitle}</p>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{adminT.dbConnectionError}</p>
        </motion.div>
      )}

      {/* ── KPI Strip ── */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" variants={staggerContainer}>
        {[
          { label: t.kpiTotalClients,      value: parents.length,      bg: 'bg-brand-600',   glow: 'shadow-brand-500/20',   icon: Users },
          { label: t.kpiActiveSubs,        value: statusCounts.active, bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20', icon: TrendingUp },
          { label: t.kpiTotalExercises,    value: exercises.length,    bg: 'bg-violet-600',  glow: 'shadow-violet-500/20',  icon: Dumbbell },
          { label: t.kpiCompletedSessions, value: apptStats.completed, bg: 'bg-orange-500',  glow: 'shadow-orange-500/20',  icon: Calendar },
        ].map(({ label, value, bg, glow, icon: Icon }) => (
          <motion.div
            key={label}
            variants={popIn}
            {...liftHover}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900"><ACountUp value={value} /></div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Revenue ── */}
      <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          {t.revenueTitle}
        </h2>
        {confirmedPayments.length === 0 ? (
          <p className="text-gray-300 text-sm text-center py-4">{t.noConfirmedPayments}</p>
        ) : (
          <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={staggerContainer} initial="hidden" animate="show">
            {Object.entries(revenueByCurrency).map(([currency, total]) => (
              <motion.div key={`total-${currency}`} variants={popIn} className="bg-emerald-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-700"><ACountUp value={total} /></div>
                <div className="text-emerald-600 text-xs mt-0.5 font-bold">{currency} — {t.totalSuffix}</div>
              </motion.div>
            ))}
            {Object.entries(revenueLast30dByCurrency).map(([currency, total]) => (
              <motion.div key={`30d-${currency}`} variants={popIn} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-gray-800"><ACountUp value={total} /></div>
                <div className="text-gray-400 text-xs mt-0.5 font-bold">{currency} — {t.last30dSuffix}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── Subscriptions + Plans ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            {t.subscriptionStatusTitle}
          </h2>
          <div className="space-y-3.5">
            <Bar label={t.statusActive}    value={statusCounts.active}    max={parents.length} color="bg-emerald-500" />
            <Bar label={t.statusPending}    value={statusCounts.pending}   max={parents.length} color="bg-amber-400" />
            <Bar label={t.statusSuspended}  value={statusCounts.suspended} max={parents.length} color="bg-red-400" />
            <Bar label={t.statusExpired}    value={statusCounts.expired}   max={parents.length} color="bg-orange-400" />
            <Bar label={t.statusCancelled}  value={statusCounts.cancelled} max={parents.length} color="bg-gray-300" />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            {t.planDistributionTitle}
          </h2>
          <div className="space-y-4">
            {[
              { key: 'basic',    label: t.planBasic,    color: 'bg-gray-400',    value: planCounts.basic },
              { key: 'standard', label: t.planStandard, color: 'bg-brand-500',   value: planCounts.standard },
              { key: 'premium',  label: t.planPremium,  color: 'bg-violet-500',  value: planCounts.premium },
              { key: 'session',  label: t.planSession,  color: 'bg-teal-500',    value: parents.filter(p => (p.subscriptionPlan as string) === 'session').length },
              { key: 'weekly',   label: t.planWeekly,   color: 'bg-blue-400',    value: parents.filter(p => (p.subscriptionPlan as string) === 'weekly').length },
              { key: 'monthly',  label: t.planMonthly,  color: 'bg-emerald-500', value: parents.filter(p => (p.subscriptionPlan as string) === 'monthly').length },
            ].filter(x => x.value > 0).map(({ label, color, value }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-700">{label}</span>
                  <span className="text-gray-400 ltr-num">{value} ({parents.length > 0 ? Math.round(value/parents.length*100) : 0}%)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${parents.length > 0 ? (value/parents.length)*100 : 0}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
            {parents.length === 0 && (
              <p className="text-gray-300 text-sm text-center py-4">{t.noDataYet}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Countries + Monthly trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-emerald-500" />
            {t.geoDistributionTitle}
          </h2>
          {topCountries.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">{t.noDataYet}</p>
          ) : (
            <div className="space-y-3.5">
              {topCountries.map(([country, count]) => (
                <Bar key={country} label={country} value={count} max={parents.length} color="bg-brand-400" />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-orange-500" />
            {t.monthlyRegistrationsTitle}
          </h2>
          <div className="flex items-end gap-2 h-36">
            {months.map(({ label, count }, i) => (
              <div key={`${label}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-black text-gray-700 ltr-num">{count || ''}</span>
                <div className="w-full">
                  <motion.div
                    className="bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg w-full"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((count / maxMonthCount) * 90, count > 0 ? 8 : 2)}px` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Exercise breakdown ── */}
      <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-violet-500" />
          {t.exerciseLibraryTitle(exercises.length)}
        </h2>
        {exercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm">{t.exercisesNotLoaded}</p>
            <a href="/dashboard/exercises" className="text-brand-600 text-sm font-bold hover:underline mt-2 inline-block">
              {t.goToExerciseMgmt}
            </a>
          </div>
        ) : (
          <motion.div className="grid grid-cols-3 sm:grid-cols-6 gap-3" variants={staggerContainer} initial="hidden" animate="show">
            {(['motor','focus','balance','energy','sensory','social'] as const).map((key) => {
              const count = catCounts[key] ?? 0
              const pct = exercises.length > 0 ? Math.round(count/exercises.length*100) : 0
              return (
                <motion.div key={key} variants={popIn} {...liftHover} className="text-center bg-gray-50 rounded-2xl p-4">
                  <div className="text-2xl font-black text-gray-900"><ACountUp value={count} /></div>
                  <div className="text-xs text-gray-500 mt-0.5 font-medium">{catLabels[key]}</div>
                  <div className="text-[10px] text-gray-300 mt-0.5 ltr-num">{pct}%</div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* ── Sessions ── */}
      <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-blue-500" />
          {t.sessionsTitle(appointments.length)}
        </h2>
        <motion.div className="grid grid-cols-3 gap-3" variants={staggerContainer} initial="hidden" animate="show">
          {[
            { label: t.apptScheduled, value: apptStats.scheduled, bg: 'bg-blue-600',    glow: 'shadow-blue-500/20' },
            { label: t.apptCompleted, value: apptStats.completed, bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20' },
            { label: t.apptCancelled, value: apptStats.cancelled, bg: 'bg-red-500',     glow: 'shadow-red-500/20' },
          ].map(({ label, value, bg, glow }) => (
            <motion.div key={label} variants={popIn} {...liftHover} className="bg-gray-50 rounded-2xl p-5 text-center">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3 mx-auto`}>
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900"><ACountUp value={value} /></div>
              <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
            </motion.div>
          ))}
        </motion.div>
        {(apptStats.completed + apptStats.cancelled) > 0 && (
          <p className="text-gray-400 text-xs mt-4 text-center">
            {t.cancellationRatePrefix}{' '}
            <span className="font-black text-gray-700 ltr-num">
              {Math.round(apptStats.cancelled / (apptStats.completed + apptStats.cancelled) * 100)}%
            </span>{' '}
            {t.cancellationRateSuffix}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
