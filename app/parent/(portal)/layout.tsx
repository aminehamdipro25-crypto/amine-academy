'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, LineChart, Calendar, MessageSquare, FileText,
  LogOut, Dumbbell, Bell, ClipboardCheck, ChevronDown, Sparkles,
  UserCircle, Zap, Home, MoreHorizontal, X, BookOpen,
} from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import AcademyLogo from '@/components/shared/AcademyLogo'
import ParentOnboarding from '@/components/parent/ParentOnboarding'

interface UpcomingAppt { date: string; time: string }

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const [scrolled, setScrolled]         = useState(false)
  const [moreOpen, setMoreOpen]         = useState(false)
  const [mobileMenu, setMobileMenu]     = useState(false)
  const [unreadBell, setUnreadBell]     = useState(0)
  const [bellOpen, setBellOpen]         = useState(false)
  const [upcomingAppt, setUpcomingAppt] = useState<UpcomingAppt | null>(null)
  const [unreadReports, setUnreadReports] = useState(0)
  const moreRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const { lang } = useLang()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t   = tr[lang].portal

  // ── Navigation definition ──────────────────────────────────────
  const primaryNav = [
    { href: '/parent/dashboard',    label: t.parentNav.home,         icon: LayoutDashboard },
    { href: '/parent/children',     label: t.parentNav.children,     icon: Users },
    { href: '/parent/exercises',    label: t.parentNav.exercises,    icon: Dumbbell },
    { href: '/parent/appointments', label: t.parentNav.appointments, icon: Calendar },
    { href: '/parent/reports',      label: t.parentNav.reports,      icon: FileText },
    { href: '/parent/chat',         label: t.parentNav.chat,         icon: MessageSquare },
  ]

  const secondaryNav = [
    { href: '/parent/progress',           label: t.parentNav.progress,        icon: LineChart,      color: '#3B82F6', bg: '#DBEAFE' },
    { href: '/parent/assessment',         label: t.parentNav.assessment,      icon: ClipboardCheck, color: '#F59E0B', bg: '#FEF3C7' },
    { href: '/parent/stories',            label: t.parentNav.stories,         icon: BookOpen,       color: '#7C3AED', bg: '#EDE9FE' },
    { href: '/parent/practice',           label: t.parentNav.practice,        icon: Sparkles,       color: '#EC4899', bg: '#FCE7F3' },
    { href: '/parent/family-challenge',   label: t.parentNav.familyChallenge, icon: Sparkles,       color: '#10B981', bg: '#D1FAE5' },
    { href: '/parent/upgrade-plan',       label: t.parentNav.upgradePlan,     icon: Zap,            color: '#F97316', bg: '#FFEDD5' },
    { href: '/parent/home-environment',   label: t.parentNav.homeEnv,         icon: Home,           color: '#06B6D4', bg: '#CFFAFE' },
    { href: '/parent/account',            label: t.parentNav.account,         icon: UserCircle,     color: '#8B5CF6', bg: '#EDE9FE' },
  ]

  const allNav = [...primaryNav, ...secondaryNav]

  // Mobile bottom bar: home + children + exercises + appointments + chat
  const mobileBottomNav = [primaryNav[0], primaryNav[1], primaryNav[2], primaryNav[3], primaryNav[5]]

  // ── Helpers ────────────────────────────────────────────────────
  function isActive(href: string) {
    return href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
  }
  const activeItem       = allNav.find(n => isActive(n.href))
  const isSecondaryActive = secondaryNav.some(n => isActive(n.href))

  // Close dropdowns on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Close menus on navigation
  useEffect(() => { setMoreOpen(false); setMobileMenu(false) }, [pathname])

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch parent info once for bell panel (appointment + reports)
  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.upcomingAppointment) setUpcomingAppt(d.upcomingAppointment)
        if (d?.unreadReports) setUnreadReports(d.unreadReports)
      })
      .catch(() => {})
  }, [])

  // Unread messages badge — poll every 60s
  useEffect(() => {
    function fetchUnread() {
      fetch('/api/messages')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setUnreadBell(d.unreadFromAdmin ?? 0) })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Shared link style ──────────────────────────────────────────
  function navLinkStyle(active: boolean) {
    return active
      ? { background: '#F3EEFF', color: '#6B46F0' }
      : { color: '#9CA3AF' }
  }
  function navHoverOn(el: HTMLElement, active: boolean) {
    if (!active) { el.style.background = '#F9F5FF'; el.style.color = '#6B46F0' }
  }
  function navHoverOff(el: HTMLElement, active: boolean) {
    if (!active) { el.style.background = ''; el.style.color = '#9CA3AF' }
  }

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#FFF8F0' }}>

      {/* ══ Header ══════════════════════════════════════════════ */}
      <header
        className="fixed top-0 right-0 left-0 z-40 transition-all duration-300"
        style={{
          height: 60,
          background: scrolled ? 'rgba(255,255,255,0.97)' : '#FFFFFF',
          borderBottom: '1.5px solid #F0E8FF',
          boxShadow: scrolled ? '0 4px 20px rgba(124,92,252,0.08)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="h-full px-4 md:px-5 flex items-center gap-3">

          {/* Brand */}
          <Link href="/parent/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <AcademyLogo size={36} />
            <div className="hidden lg:block">
              <div className="font-black text-sm leading-tight" style={{ color: '#6B46F0' }}>أكاديمية أمين</div>
              <div className="text-[10px] text-gray-400 leading-tight">{t.common.parentsPortalSubtitle}</div>
            </div>
          </Link>

          {/* ── Desktop primary nav ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-visible">
            {primaryNav.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap flex-shrink-0"
                  style={navLinkStyle(active)}
                  onMouseEnter={e => navHoverOn(e.currentTarget, active)}
                  onMouseLeave={e => navHoverOff(e.currentTarget, active)}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7C5CFC' }} />}
                </Link>
              )
            })}

            {/* ── "More" dropdown ── */}
            <div ref={moreRef} className="relative flex-shrink-0">
              <button
                onClick={() => setMoreOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap"
                style={isSecondaryActive || moreOpen ? { background: '#F3EEFF', color: '#6B46F0' } : { color: '#9CA3AF' }}
                onMouseEnter={e => navHoverOn(e.currentTarget, isSecondaryActive || moreOpen)}
                onMouseLeave={e => navHoverOff(e.currentTarget, isSecondaryActive || moreOpen)}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t.parentNav.more}</span>
                {!isSecondaryActive && !moreOpen && (
                  <span className="hidden lg:flex gap-0.5 items-center">
                    {secondaryNav.slice(0, 4).map(n => (
                      <span key={n.href} className="w-1.5 h-1.5 rounded-full" style={{ background: n.color }} />
                    ))}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                {isSecondaryActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#7C5CFC' }} />}
              </button>

              {moreOpen && (
                <div
                  className="absolute top-full mt-2 rounded-2xl overflow-hidden"
                  style={{
                    [dir === 'rtl' ? 'right' : 'left']: 0,
                    zIndex: 60,
                    background: 'white',
                    border: '1.5px solid #EDE9FE',
                    boxShadow: '0 12px 40px rgba(107,70,240,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                    minWidth: 220,
                  }}
                >
                  <div className="p-2">
                    {secondaryNav.map(({ href, label, icon: Icon, color, bg }) => {
                      const active = isActive(href)
                      return (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                          style={active ? { background: '#F3EEFF', color: '#6B46F0' } : { color: '#374151' }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#FAFAFA' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '' }}
                        >
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: active ? '#EDE9FE' : bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: active ? '#6B46F0' : color }} />
                          </div>
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ── Right-side actions ── */}
          <div className="flex items-center gap-2 ms-auto flex-shrink-0">
            {/* Mobile: current page label */}
            {activeItem && (
              <span className="md:hidden text-xs font-black truncate max-w-[90px]" style={{ color: '#7C5CFC' }}>
                {activeItem.label}
              </span>
            )}

            {/* Notifications bell */}
            <div ref={bellRef} className="relative flex-shrink-0">
              <button
                onClick={() => setBellOpen(o => !o)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all relative"
                style={{ background: bellOpen ? '#E8DBFF' : '#F3EEFF' }}
                title={t.common.notifications}
              >
                <Bell className="w-4 h-4" style={{ color: '#7C5CFC' }} />
                {(unreadBell > 0 || unreadReports > 0) && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-white text-[9px] font-black rounded-full flex items-center justify-center"
                    style={{ background: '#EF4444' }}
                  >
                    {unreadBell + unreadReports > 9 ? '9+' : unreadBell + unreadReports}
                  </span>
                )}
              </button>

              {/* Bell dropdown panel */}
              {bellOpen && (
                <div
                  className="absolute top-full mt-2 rounded-2xl overflow-hidden"
                  style={{
                    [dir === 'rtl' ? 'left' : 'right']: 0,
                    zIndex: 60,
                    width: 288,
                    background: 'white',
                    border: '1.5px solid #EDE9FE',
                    boxShadow: '0 16px 48px rgba(107,70,240,0.16), 0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #F3EEFF' }}>
                    <p className="font-black text-xs text-gray-400 uppercase tracking-widest">الإشعارات</p>
                  </div>
                  <div className="p-3 space-y-2">

                    {/* Unread messages */}
                    {unreadBell > 0 ? (
                      <Link
                        href="/parent/chat"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ background: '#F3EEFF', border: '1.5px solid #DDD6FE' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#EDE9FE' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8DBFF' }}>
                          <MessageSquare className="w-4 h-4" style={{ color: '#6B46F0' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900">{unreadBell === 1 ? 'رسالة جديدة' : `${unreadBell} رسائل جديدة`}</p>
                          <p className="text-xs text-gray-500">من الأستاذ أمين — اضغط للرد</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F3F4F6' }}>
                          <MessageSquare className="w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">لا توجد رسائل جديدة</p>
                      </div>
                    )}

                    {/* Upcoming appointment */}
                    {upcomingAppt ? (
                      <Link
                        href="/parent/appointments"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ background: '#F0FFF4', border: '1.5px solid #BBF7D0' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#DCFCE7' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F0FFF4' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
                          <Calendar className="w-4 h-4" style={{ color: '#16A34A' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900">موعد قادم</p>
                          <p className="text-xs text-gray-500 ltr-num">{upcomingAppt.date} · {upcomingAppt.time}</p>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href="/parent/appointments"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ background: '#F9FAFB' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3F4F6' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F9FAFB' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F3F4F6' }}>
                          <Calendar className="w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">لا يوجد موعد قادم — احجز الآن</p>
                      </Link>
                    )}

                    {/* New reports */}
                    {unreadReports > 0 && (
                      <Link
                        href="/parent/reports"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FEF3C7' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFFBEB' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
                          <FileText className="w-4 h-4" style={{ color: '#D97706' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900">{unreadReports === 1 ? 'تقرير جديد' : `${unreadReports} تقارير جديدة`}</p>
                          <p className="text-xs text-gray-500">متاح للاطلاع</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            <LangToggle variant="light" className="hidden md:flex" />

            <form action="/api/auth/client/logout" method="POST" className="hidden md:block">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={{ color: '#9CA3AF', background: '#F9FAFB' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t.common.logout}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ══ Main content ════════════════════════════════════════ */}
      <main className="pb-24 md:pb-8" style={{ paddingTop: 60 }}>
        <div className="max-w-3xl mx-auto px-4 py-5 md:py-7">
          {children}
        </div>
      </main>

      {/* ══ Mobile bottom navigation ════════════════════════════ */}
      <nav
        className="fixed bottom-0 right-0 left-0 z-40 md:hidden"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderTop: '1.5px solid #F0E8FF',
          boxShadow: '0 -4px 24px rgba(124,92,252,0.08)',
          backdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch justify-around px-2 pt-2 pb-1">
          {mobileBottomNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-2xl flex-1 transition-all duration-200 relative"
                style={active ? { color: '#6B46F0' } : { color: '#C4C9D4' }}
              >
                {active && <span className="absolute inset-0 rounded-2xl" style={{ background: '#F3EEFF' }} />}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-[11px] font-black leading-none relative z-10 text-center">{label}</span>
              </Link>
            )
          })}

          {/* More button — opens full-screen sheet */}
          <button
            onClick={() => setMobileMenu(true)}
            className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-2xl flex-1 transition-all duration-200 relative"
            style={isSecondaryActive ? { color: '#6B46F0', background: '#F3EEFF' } : { color: '#A78BFA' }}
          >
            <style>{`@keyframes moredt{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}`}</style>
            {/* Rainbow discovery dots */}
            {!isSecondaryActive && (
              <div className="flex gap-0.5 mb-0.5 relative z-10">
                {secondaryNav.slice(0, 5).map((n, i) => (
                  <span
                    key={n.href}
                    className="rounded-full"
                    style={{
                      display: 'block', width: 5, height: 5, background: n.color,
                      animation: `moredt ${1.1 + i * 0.13}s ease-in-out infinite`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {isSecondaryActive && <div style={{ height: 9 }} />}
            <MoreHorizontal className="w-5 h-5 relative z-10" />
            <span className="text-[9px] font-black leading-none relative z-10">{t.parentNav.more}</span>
          </button>
        </div>
      </nav>

      {/* ══ Mobile full menu sheet ═══════════════════════════════ */}
      {mobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 md:hidden"
            style={{ background: 'rgba(30,10,60,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileMenu(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 right-0 left-0 z-50 md:hidden rounded-t-3xl overflow-hidden"
            style={{ background: 'white', maxHeight: '82dvh', boxShadow: '0 -8px 40px rgba(107,70,240,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle + title */}
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #F3EEFF' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: '#E8DBFF' }} />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-base">القائمة الكاملة</h3>
                <button
                  onClick={() => setMobileMenu(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#F3F4F6' }}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Grid of all pages */}
            <div className="p-4 grid grid-cols-3 gap-3 overflow-y-auto" style={{ maxHeight: 'calc(82dvh - 130px)' }}>
              {allNav.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                const sec = secondaryNav.find(n => n.href === href)
                const iconColor = active ? '#6B46F0' : (sec?.color ?? '#6B46F0')
                const iconBg    = active ? '#EDE9FE' : (sec?.bg    ?? '#F3F4F6')
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all"
                    style={active
                      ? { background: '#F3EEFF', color: '#6B46F0', border: '1.5px solid #DDD6FE' }
                      : { background: '#FAFAFA', color: '#374151', border: '1px solid #F3F4F6' }
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: iconBg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight">{label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Logout row */}
            <div className="px-4 pb-6 pt-2" style={{ borderTop: '1px solid #F3EEFF' }}>
              <form action="/api/auth/client/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold"
                  style={{ color: '#EF4444', background: '#FEF2F2' }}
                >
                  <LogOut className="w-4 h-4" />
                  {t.common.logout}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
      <ParentOnboarding />
    </div>
  )
}
