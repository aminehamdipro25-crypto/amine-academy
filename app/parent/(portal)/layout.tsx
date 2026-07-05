'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, LineChart,
  Calendar, MessageSquare, FileText, LogOut, Dumbbell, Bell, ClipboardCheck, ChevronLeft, Sparkles,
} from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const { lang } = useLang()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t = tr[lang].portal

  const navItems = [
    { href: '/parent/dashboard',    label: t.parentNav.home,    icon: LayoutDashboard },
    { href: '/parent/children',     label: t.parentNav.children, icon: Users },
    { href: '/parent/assessment',   label: t.parentNav.assessment, icon: ClipboardCheck },
    { href: '/parent/exercises',    label: t.parentNav.exercises, icon: Dumbbell },
    { href: '/parent/practice',     label: t.parentNav.practice, icon: Sparkles },
    { href: '/parent/progress',     label: t.parentNav.progress, icon: LineChart },
    { href: '/parent/appointments', label: t.parentNav.appointments, icon: Calendar },
    { href: '/parent/reports',      label: t.parentNav.reports, icon: FileText },
    { href: '/parent/chat',         label: t.parentNav.chat,    icon: MessageSquare },
    { href: '/parent/family-challenge', label: t.parentNav.familyChallenge, icon: Sparkles },
  ]

  const bottomItems = navItems.slice(0, 5)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function isActive(href: string) {
    return href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
  }

  const activeItem = navItems.find(n => isActive(n.href))

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#FFF8F0' }}>

      {/* ══ Header ══ */}
      <header
        className="fixed top-0 right-0 left-0 z-40 transition-all duration-300"
        style={{
          height: 60,
          background: scrolled ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
          borderBottom: scrolled ? '1.5px solid #F0E8FF' : '1.5px solid #F3EEFF',
          boxShadow: scrolled ? '0 4px 20px rgba(124,92,252,0.08)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="h-full px-4 md:px-6 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/parent/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: '#6B46F0' }}
            >
              <span className="text-white text-base font-black">أ</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-sm leading-tight" style={{ color: '#6B46F0' }}>أكاديمية أمين</div>
              <div className="text-[10px] text-gray-400 leading-tight">{t.common.parentsPortalSubtitle}</div>
            </div>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center px-6">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap"
                  style={active
                    ? { background: '#F3EEFF', color: '#6B46F0' }
                    : { color: '#9CA3AF' }
                  }
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = '#FAFAFA'; (e.currentTarget as HTMLAnchorElement).style.color = '#6B46F0' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = ''; (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' } }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7C5CFC' }} />}
                </Link>
              )
            })}
          </nav>

          {/* Right side: page title (mobile) + actions */}
          <div className="flex items-center gap-2">
            {/* Mobile: current page name */}
            {activeItem && (
              <span className="md:hidden text-xs font-black" style={{ color: '#7C5CFC' }}>
                {activeItem.label}
              </span>
            )}

            {/* Notifications — jumps to the notifications panel on the dashboard */}
            <Link
              href="/parent/dashboard#notifications"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: '#F3EEFF' }}
              title={t.common.notifications}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
            >
              <Bell className="w-4 h-4" style={{ color: '#7C5CFC' }} />
            </Link>

            {/* Language switcher (desktop only) */}
            <LangToggle variant="light" className="hidden md:flex" />

            {/* Logout (desktop only) */}
            <form action="/api/auth/client/logout" method="POST" className="hidden md:block">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ color: '#9CA3AF', background: '#F9FAFB' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.common.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ══ Main content ══ */}
      <main className="pb-24 md:pb-8" style={{ paddingTop: 60 }}>
        <div className="max-w-3xl mx-auto px-4 py-5 md:py-7">
          {children}
        </div>
      </main>

      {/* ══ Mobile bottom navigation ══ */}
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
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl flex-1 transition-all duration-200 relative"
                style={active
                  ? { color: '#6B46F0' }
                  : { color: '#C4C9D4' }
                }
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: '#F3EEFF' }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] font-black leading-none relative z-10">{label}</span>
              </Link>
            )
          })}
          {/* More button leading to more pages */}
          <Link
            href="/parent/reports"
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl flex-1 transition-all duration-200"
            style={
              ['/parent/reports','/parent/chat','/parent/appointments'].some(p => pathname.startsWith(p))
                ? { color: '#6B46F0' }
                : { color: '#C4C9D4' }
            }
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
            <span className="text-[10px] font-black leading-none">{t.parentNav.more}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
