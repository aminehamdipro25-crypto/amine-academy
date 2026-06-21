'use client'
import { AlertCircle, Users, TrendingUp, CreditCard, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useLang, tr, type Lang } from '@/lib/i18n'
import type { getAllParents, getAllPendingPayments, getAllExercises } from '@/lib/db'

function localeFor(lang: Lang) {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'fr-FR'
}

export default function AdminDashboardView({ parents, payments, exercises, redisError }: {
  parents: Awaited<ReturnType<typeof getAllParents>>
  payments: Awaited<ReturnType<typeof getAllPendingPayments>>
  exercises: Awaited<ReturnType<typeof getAllExercises>>
  redisError: boolean
}) {
  const { lang } = useLang()
  const t = tr[lang].adminDashboardHome
  const navT = tr[lang].adminNav
  const coachName = tr[lang].portal.common.coachName

  const activeCount   = parents.filter(p => p.subscriptionStatus === 'active').length
  const pendingCount  = parents.filter(p => p.subscriptionStatus === 'pending').length
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const recentParents = [...parents].reverse().slice(0, 5)

  const today = new Date().toLocaleDateString(localeFor(lang), {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Qatar',
  })

  return (
    <div className="space-y-6">

      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand-700 via-brand-600 to-indigo-700 p-6 md:p-8 text-white">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute -top-4 left-1/2 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative">
          <p className="text-white/60 text-xs font-medium mb-1 ltr-num">{today}</p>
          <h1 className="text-2xl md:text-3xl font-black mb-1">{t.greeting(coachName)}</h1>
          <p className="text-white/70 text-sm">
            {activeCount > 0
              ? `${t.subtitleActive(activeCount)}${pendingPayments.length > 0 ? t.subtitlePendingSuffix(pendingPayments.length) : ''}`
              : t.subtitleEmpty}
          </p>
        </div>

        {/* mini quick-stats inside banner */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: navT.clients, value: parents.length, icon: '👥' },
            { label: t.statActiveLabel, value: activeCount, icon: '✅' },
            { label: navT.exercises, value: exercises.length || 17, icon: '📚' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-2xl font-black ltr-num">{s.value}</div>
              <div className="text-white/60 text-[11px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Redis error ── */}
      {redisError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-800 text-sm">{t.redisErrorTitle}</p>
            <p className="text-red-600 text-xs mt-0.5">
              {t.redisErrorBody}{' '}
              <a href="/api/health" className="underline font-bold" target="_blank">{t.statusCheckLink}</a>
            </p>
          </div>
        </div>
      )}

      {/* ── Pending Payments Alert ── */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-amber-900 text-sm">{t.pendingPaymentsTitle}</h2>
                <p className="text-amber-600 text-[11px]">{t.pendingPaymentsCountSuffix(pendingPayments.length)}</p>
              </div>
            </div>
            <Link href="/dashboard/payments"
              className="text-xs font-black text-amber-700 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
              {t.viewAllLabel} <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingPayments.slice(0, 3).map(p => (
              <div key={p.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-black text-sm">
                    {p.guestName?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{p.guestName}</p>
                    <p className="text-gray-400 text-[11px]">{p.referenceCode} · {p.plan}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-sm ltr-num">{p.amount} {p.currency === 'QAR' ? t.currencyQar : t.currencyTnd}</p>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{t.awaitingLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent registrations */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <h2 className="font-black text-gray-900 text-sm">{t.recentRegistrationsTitle}</h2>
            </div>
            <Link href="/dashboard/clients"
              className="text-brand-600 text-xs font-bold hover:bg-brand-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
              {t.viewAllLabel} <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentParents.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3">👥</div>
                <p className="text-gray-400 font-bold text-sm">{t.noRegistrationsTitle}</p>
                <p className="text-gray-300 text-xs mt-1">{t.noRegistrationsBody}</p>
              </div>
            ) : (
              recentParents.map((parent) => {
                const isActive  = parent.subscriptionStatus === 'active'
                const isPending = parent.subscriptionStatus === 'pending'
                return (
                  <Link key={parent.id} href={`/dashboard/clients/${parent.id}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                        isActive ? 'bg-green-100 text-green-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {parent.firstName?.[0] ?? '?'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm group-hover:text-brand-600 transition-colors">
                          {parent.firstName} {parent.lastName}
                        </div>
                        <div className="text-gray-400 text-xs">{parent.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        isActive  ? 'bg-green-100 text-green-700' :
                        isPending ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-500'
                      }`}>
                        {isActive ? t.activeBadgeLabel : isPending ? t.awaitingBadgeLabel : parent.subscriptionStatus}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">

          {/* Summary card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {t.summaryTitle}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">{t.activeSubsLabel}</span>
                <span className="font-black text-green-600 text-sm ltr-num">{activeCount}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: parents.length > 0 ? `${Math.round((activeCount / parents.length) * 100)}%` : '0%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">{t.pendingActivationLabel}</span>
                <span className="font-black text-amber-600 text-sm ltr-num">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">{t.pendingPaymentsLabel}</span>
                <span className={`font-black text-sm ltr-num ${pendingPayments.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {pendingPayments.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-black text-gray-900 text-sm mb-4">{t.quickAccessTitle}</h2>
            <div className="space-y-1.5">
              {[
                { href: '/dashboard/clients',     label: navT.clients,     bg: 'bg-brand-50',   text: 'text-brand-700',  icon: '👥' },
                { href: '/dashboard/payments',    label: navT.payments,    bg: 'bg-amber-50',   text: 'text-amber-700',  icon: '💳' },
                { href: '/dashboard/exercises',   label: navT.exercises,   bg: 'bg-purple-50',  text: 'text-purple-700', icon: '🏃' },
                { href: '/dashboard/appointments',label: navT.appointments,bg: 'bg-green-50',   text: 'text-green-700',  icon: '📅' },
                { href: '/dashboard/settings',    label: navT.settings,    bg: 'bg-gray-50',    text: 'text-gray-700',   icon: '⚙️' },
              ].map(({ href, label, bg, text, icon }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:shadow-sm group ${bg}`}>
                  <span className="text-base">{icon}</span>
                  <span className={`font-bold text-sm flex-1 ${text}`}>{label}</span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${text} opacity-40 group-hover:opacity-100 transition-opacity`} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
