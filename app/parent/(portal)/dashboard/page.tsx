'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Bell, MessageSquare, FileText, ChevronLeft, Zap, TrendingUp, Clock, Star, X } from 'lucide-react'
import type { Parent, Student, Program } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'
import { ACountUp } from '@/components/ui'
import { staggerContainer, fadeUp, popIn, liftHover } from '@/lib/motion'
import ProgressMap from '@/components/progress/ProgressMap'
import type { SessionNode } from '@/components/progress/ProgressMap'

const MotionLink = motion(Link)

interface DashboardData {
  parent: Parent
  children: Student[]
  upcomingAppointment: { date: string; time: string; type?: string } | null
  unreadReports: number
}

const DIAG_EMOJI: Record<string, string> = {
  ADHD: '⚡', AUTISM: '🌈', 'ADHD+AUTISM': '🌟', OTHER: '💙',
}

const TODAY_KEY = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()]

const PLAN_COLOR: Record<string, { color: string; bg: string }> = {
  basic:    { color: '#6B7280', bg: '#F3F4F6' },
  standard: { color: '#92400E', bg: '#FEF3C7' },
  premium:  { color: '#78350F', bg: '#FDE68A' },
}

const MILESTONES = [500, 1000, 2000, 5000]

type NotifSeverity = 'urgent' | 'warning' | 'positive' | 'achievement' | 'info'

interface Notification {
  id: number
  severity: NotifSeverity
  message: string
}

interface NotifT {
  notifStreakWeek: string
  notifNoExerciseToday: (name: string) => string
  notifMilestone: (name: string, milestone: number) => string
  notifUnreadReports: (count: number, coach: string) => string
  notifApptTomorrow: string
}

function buildNotifications(
  children: Student[],
  unreadReports: number,
  upcomingAppointment: { date: string; time: string; type?: string } | null,
  t: NotifT,
  coachName: string,
): Notification[] {
  const notifs: Notification[] = []
  let id = 0

  for (const student of children) {
    const name = student.firstName

    // 1. Streak > 7 — positive
    if ((student.streak || 0) > 7) {
      notifs.push({ id: id++, severity: 'positive', message: t.notifStreakWeek })
    }

    // 2. streak === 0 AND totalPoints > 0 — warning
    if ((student.streak || 0) === 0 && (student.totalPoints || 0) > 0) {
      notifs.push({ id: id++, severity: 'warning', message: t.notifNoExerciseToday(name) })
    }

    // 5. Milestone within last 10 points — achievement
    const pts = student.totalPoints || 0
    for (const milestone of MILESTONES) {
      if (pts >= milestone && pts - 10 < milestone) {
        notifs.push({ id: id++, severity: 'achievement', message: t.notifMilestone(name, milestone) })
        break
      }
    }
  }

  // 3. Unread reports — info
  if (unreadReports > 0) {
    notifs.push({ id: id++, severity: 'info', message: t.notifUnreadReports(unreadReports, coachName) })
  }

  // 4. Upcoming appointment within 24h — urgent
  if (upcomingAppointment) {
    const apptDate = new Date(upcomingAppointment.date)
    const now = new Date()
    const diffMs = apptDate.getTime() - now.getTime()
    if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
      notifs.push({ id: id++, severity: 'urgent', message: t.notifApptTomorrow })
    }
  }

  return notifs
}

const NOTIF_STYLES: Record<NotifSeverity, string> = {
  urgent:      'bg-amber-50 border-amber-200 text-amber-800',
  warning:     'bg-red-50 border-red-100 text-red-700',
  positive:    'bg-emerald-50 border-emerald-200 text-emerald-800',
  achievement: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info:        'bg-[#F3EEFF] border-[#D3BBFF] text-[#5A32D9]',
}

interface GreetT {
  greetingNight: string
  greetingMorning: string
  greetingAfternoon: string
  greetingEvening: string
}

function greeting(t: GreetT) {
  const h = new Date().getHours()
  if (h < 5)  return t.greetingNight
  if (h < 12) return t.greetingMorning
  if (h < 17) return t.greetingAfternoon
  return t.greetingEvening
}

export default function ParentDashboardPage() {
  const { lang } = useLang()
  const t = tr[lang].parentDashboard
  const coachName = tr[lang].portal.common.coachName
  const [data, setData] = useState<DashboardData | null>(null)
  const [programs, setPrograms] = useState<Record<string, Program>>({})
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [dismissedNotifs, setDismissedNotifs] = useState<number[]>([])
  const [progressMap, setProgressMap] = useState<{
    studentId: string
    studentName: string
    sessions: SessionNode[]
    totalSessions: number
    totalStars: number
  }[]>([])

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(async d => {
        setData(d)
        const progs: Record<string, Program> = {}
        await Promise.all((d.children || []).map(async (c: Student) => {
          try {
            const r = await fetch(`/api/parent/children/${c.id}/program`)
            if (r.ok) { const p = await r.json(); if (p.program) progs[c.id] = p.program }
          } catch { /* no program */ }
        }))
        setPrograms(progs)
      })
      .finally(() => setLoading(false))

    fetch('/api/messages')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUnreadMessages(d.unreadFromAdmin ?? 0) })
      .catch(() => {})

    fetch('/api/parent/progress-map')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.progressData) setProgressMap(d.progressData) })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <motion.div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: '#F3EEFF' }}
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-3xl">⭐</span>
      </motion.div>
      <p className="font-black text-sm" style={{ color: '#6B46F0' }}>{t.loading}</p>
    </div>
  )

  if (!data?.parent) return (
    <div className="text-center py-20 text-gray-500">{t.loadError}</div>
  )

  const { parent, children, upcomingAppointment, unreadReports } = data
  const planColorCfg = PLAN_COLOR[parent.subscriptionPlan] || PLAN_COLOR.basic
  const planCfg = { ...planColorCfg, label: t.planLabels[parent.subscriptionPlan as keyof typeof t.planLabels] || t.planLabels.basic }
  const totalPoints = children.reduce((s, c) => s + (c.totalPoints || 0), 0)
  const totalStreak = children.reduce((s, c) => s + (c.streak || 0), 0)

  // Compute notifications from available data
  const allNotifications = buildNotifications(children, unreadReports, upcomingAppointment, t, coachName)
  const visibleNotifications = allNotifications.filter(n => !dismissedNotifs.includes(n.id))

  return (
    <motion.div className="space-y-5" variants={staggerContainer} initial="hidden" animate="show">

      {/* ══ Hero ══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-3xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          borderTop: '4px solid #6B46F0',
        }}
      >
        <div className="p-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-sm font-medium">{greeting(t)}</p>
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: '#6B46F0', background: '#F3EEFF' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-gentle-pulse" />
                  {t.liveLabel}
                </span>
              </div>
              <h1 className="font-black text-2xl text-gray-900 mt-0.5 leading-tight">
                {parent.firstName} {parent.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: planCfg.bg, color: planCfg.color }}>
                  {planCfg.label}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  parent.subscriptionStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {parent.subscriptionStatus === 'active' ? t.statusActive :
                   parent.subscriptionStatus === 'pending' ? t.statusPending : parent.subscriptionStatus}
                </span>
              </div>
            </div>

            {/* Stats bubble */}
            <motion.div
              className="flex-shrink-0 text-center rounded-2xl px-4 py-3"
              style={{ background: '#F3EEFF', border: '1.5px solid #E0D0FF' }}
              variants={popIn}
            >
              <div className="font-black text-2xl" style={{ color: '#6B46F0' }}><ACountUp value={totalPoints} /></div>
              <div className="text-[10px] font-bold" style={{ color: '#9A7BFD' }}>{t.pointsTotal}</div>
            </motion.div>
          </div>

          {/* Alerts */}
          {unreadReports > 0 && (
            <MotionLink
              href="/parent/reports"
              variants={fadeUp}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2 transition-colors"
              style={{ background: '#F3EEFF', border: '1px solid #E0D0FF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#EDE0FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#6B46F0' }}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold flex-1" style={{ color: '#5A32D9' }}>{t.newReportInline(unreadReports)}</span>
              <ChevronLeft className="w-4 h-4" style={{ color: '#9A7BFD' }} />
            </MotionLink>
          )}
          {unreadMessages > 0 && (
            <MotionLink
              href="/parent/chat"
              variants={fadeUp}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
              style={{ background: '#FFF8E8', border: '1px solid #FDE68A' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFF3D4' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFF8E8' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F59E0B' }}>
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold flex-1 text-amber-800">{t.newMessageFromCoach(coachName)}</span>
              <ChevronLeft className="w-4 h-4 text-amber-400" />
            </MotionLink>
          )}
        </div>
      </motion.div>

      {/* ══ Smart Notifications ══ */}
      {visibleNotifications.length > 0 && (
        <div id="notifications" className="space-y-2">
          <AnimatePresence initial={false}>
            {visibleNotifications.map(notif => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 40, height: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border text-sm font-bold overflow-hidden ${NOTIF_STYLES[notif.severity]}`}
              >
                <span className="flex-1 leading-snug">{notif.message}</span>
                <button
                  onClick={() => setDismissedNotifs(prev => [...prev, notif.id])}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
                  aria-label={t.closeAria}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ══ Quick stats row ══ */}
      <motion.div className="grid grid-cols-3 gap-3" variants={staggerContainer}>
        {[
          {
            href: '/parent/appointments',
            icon: <Calendar className="w-5 h-5" />,
            iconBg: '#ECFDF5',
            iconColor: '#10B981',
            value: upcomingAppointment ? <span className="ltr-num">{upcomingAppointment.date?.slice(5)}</span> : '—',
            label: t.statUpcomingAppt,
          },
          {
            href: '/parent/exercises',
            icon: <Zap className="w-5 h-5" />,
            iconBg: '#FFF8E8',
            iconColor: '#F59E0B',
            value: <span className="inline-flex items-center gap-1">🔥<ACountUp value={totalStreak} /></span>,
            label: t.statStreakDays,
          },
          {
            href: '/parent/progress',
            icon: <TrendingUp className="w-5 h-5" />,
            iconBg: '#F3EEFF',
            iconColor: '#7C5CFC',
            value: <ACountUp value={children.length} />,
            label: children.length === 1 ? t.statChildSingular : t.statChildPlural,
          },
        ].map((s, i) => (
          <MotionLink
            key={i}
            href={s.href}
            variants={fadeUp}
            {...liftHover}
            className="rounded-3xl p-4 text-center"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #F0E8FF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
            }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div className="font-black text-gray-900 text-sm">{s.value}</div>
            <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
          </MotionLink>
        ))}
      </motion.div>

      {/* ══ Journey Progress Map ══ */}
      {progressMap.length > 0 && progressMap.some(p => p.totalSessions > 0) && (
        <motion.div
          variants={fadeUp}
          className="rounded-3xl p-5 overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-gray-900 text-sm">🗺️ خارطة الرحلة</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {progressMap[0]?.totalSessions > 0
                  ? `${progressMap[0].totalSessions} جلسة مكتملة • ${progressMap[0].totalStars} نجمة`
                  : 'جلساتك التفاعلية'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#F59E0B,#FBBF24)' }} />
                3★
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)' }} />
                2★
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#06B6D4,#38BDF8)' }} />
                1★
              </span>
            </div>
          </div>

          {progressMap.map(child => (
            <div key={child.studentId}>
              {progressMap.length > 1 && (
                <p className="text-xs font-bold text-gray-500 mb-2">{child.studentName}</p>
              )}
              {child.sessions.length > 0 ? (
                <ProgressMap sessions={child.sessions} compact upcomingSlots={3} />
              ) : (
                <div className="text-center py-4 text-gray-400 text-xs">
                  لم تبدأ الجلسات بعد — ستظهر هنا بعد أول جلسة تفاعلية 🌱
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* ══ Upcoming appointment banner ══ */}
      {upcomingAppointment && (
        <motion.div
          variants={fadeUp}
          className="rounded-3xl p-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            border: '1.5px solid #A7F3D0',
          }}
        >
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Calendar className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-green-900 text-sm">{t.upcomingSessionTitle}</p>
            <p className="text-green-700 text-xs mt-0.5 ltr-num">{upcomingAppointment.date} — {upcomingAppointment.time}</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/parent/appointments"
              className="text-xs font-black px-4 py-2 rounded-xl flex-shrink-0 whitespace-nowrap transition-colors"
              style={{ background: '#10B981', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            >
              {t.detailsButton}
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* ══ Children ══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-lg">{t.myChildrenTitle}</h2>
          <Link
            href="/parent/children"
            className="text-xs font-black flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
            style={{ color: '#6B46F0', background: '#F3EEFF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
          >
            {t.manageLink} <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div
            className="rounded-3xl p-10 text-center"
            style={{ background: '#FFFFFF', border: '2px dashed #E8DBFF' }}
          >
            <motion.div
              className="text-5xl mb-3"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              👶
            </motion.div>
            <p className="font-black text-gray-700 mb-1">{t.noChildrenTitle}</p>
            <p className="text-gray-400 text-sm mb-5">{t.noChildrenSubtitle}</p>
            <Link
              href="/parent/children"
              className="inline-flex items-center gap-2 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all"
              style={{ background: '#6B46F0', boxShadow: '0 4px 16px rgba(107,70,240,0.25)' }}
            >
              {t.addChildButton}
            </Link>
          </div>
        ) : (
          <motion.div className="space-y-4" variants={staggerContainer}>
            {children.map(child => {
              const prog = programs[child.id]
              const todayExs: string[] = (prog?.weeklySchedule as unknown as Record<string,string[]>)?.[TODAY_KEY] || []
              const pct = Math.min(100, Math.round((child.totalPoints / 500) * 100))
              const emoji = DIAG_EMOJI[child.diagnosis] || '🌟'

              return (
                <motion.div
                  key={child.id}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl overflow-hidden transition-shadow duration-200"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #F0E8FF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Child header */}
                  <div className="p-5 flex items-center gap-4">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #F3EEFF, #E8DBFF)',
                        border: '1.5px solid #D8C5FF',
                      }}
                      animate={{ rotate: [0, -4, 4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {emoji}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-base">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{child.ageGroup} {t.yearsUnit} • {child.diagnosis}</div>
                      {/* Progress bar inline */}
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">{t.progressTowardGoal}</span>
                          <span className="font-black" style={{ color: '#7C5CFC' }}><ACountUp value={pct} suffix="٪" /></span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0E8FF' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: '#6B46F0' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/parent/children`}
                      className="text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0 transition-all"
                      style={{ background: '#F3EEFF', color: '#6B46F0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
                    >
                      {t.detailsButton}
                    </Link>
                  </div>

                  {/* Stats row */}
                  <div className="px-5 pb-4 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF8E8' }}>
                      <div className="font-black text-amber-700 text-base"><ACountUp value={child.totalPoints} /></div>
                      <div className="text-[10px] text-amber-600 mt-0.5">{t.pointLabel}</div>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF3E8' }}>
                      <div className="font-black text-orange-700 text-base inline-flex items-center justify-center gap-1 w-full">🔥 <ACountUp value={child.streak} /></div>
                      <div className="text-[10px] text-orange-600 mt-0.5">{t.streakLabel}</div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-center relative"
                      style={{ background: todayExs.length > 0 ? '#F0FFF4' : '#F9FAFB' }}
                    >
                      {todayExs.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-gentle-pulse" />
                      )}
                      <div
                        className="font-black text-base"
                        style={{ color: todayExs.length > 0 ? '#15803D' : '#9CA3AF' }}
                      >
                        <ACountUp value={todayExs.length} />
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: todayExs.length > 0 ? '#16A34A' : '#9CA3AF' }}>
                        {t.todayExercisesLabel}
                      </div>
                    </div>
                  </div>

                  {/* Today's exercises */}
                  {todayExs.length > 0 && (
                    <div className="px-5 pb-4">
                      <div
                        className="rounded-2xl p-3"
                        style={{ background: 'linear-gradient(135deg, #F0FFF4, #ECFDF5)', border: '1.5px solid #D1FAE5' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-green-800">
                            {t.todayExercisesBoxTitle(tr[lang].studentSchedule.days[new Date().getDay()], todayExs.length)}
                          </span>
                          <Link
                            href="/parent/exercises"
                            className="text-xs font-black px-2.5 py-1 rounded-lg transition-all"
                            style={{ background: '#10B981', color: '#FFFFFF' }}
                          >
                            {t.startNowButton}
                          </Link>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {todayExs.slice(0, 4).map((_, i) => (
                            <span
                              key={i}
                              className="text-xs font-bold px-2.5 py-0.5 rounded-full ltr-num"
                              style={{ background: '#BBF7D0', color: '#15803D' }}
                            >
                              {t.exerciseN(i + 1)}
                            </span>
                          ))}
                          {todayExs.length > 4 && (
                            <span className="text-xs text-green-600">{t.moreCount(todayExs.length - 4)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* ══ Quick action cards ══ */}
      <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer}>
        <MotionLink
          href="/parent/exercises"
          variants={fadeUp}
          {...liftHover}
          className="rounded-3xl p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            borderTop: '3px solid #6B46F0',
          }}
        >
          <motion.div className="text-3xl mb-2" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>🎮</motion.div>
          <div className="font-black text-base text-gray-900">{t.gamesCardTitle}</div>
          <div className="text-gray-400 text-xs mt-1">{t.gamesCardSubtitle}</div>
        </MotionLink>
        <MotionLink
          href="/parent/appointments"
          variants={fadeUp}
          {...liftHover}
          className="rounded-3xl p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            borderTop: '3px solid #10B981',
          }}
        >
          <motion.div className="text-3xl mb-2" animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>📅</motion.div>
          <div className="font-black text-base text-gray-900">{t.bookSessionTitle}</div>
          <div className="text-gray-400 text-xs mt-1">{t.bookSessionSubtitle}</div>
        </MotionLink>
      </motion.div>

      {/* ══ Tips card ══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{
          background: '#FFFFFF',
          border: '1px solid #FDE68A',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          borderRight: '4px solid #F59E0B',
        }}
      >
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: '#FEF3C7', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          💡
        </motion.div>
        <div className="flex-1">
          <p className="font-black text-amber-900 text-sm">{t.tipOfDayTitle}</p>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed">
            {t.tipOfDayText}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
