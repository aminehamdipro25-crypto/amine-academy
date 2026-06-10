'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, LineChart,
  Calendar, MessageSquare, FileText, LogOut, Dumbbell, Menu, X,
} from 'lucide-react'

const navItems = [
  { href: '/parent/dashboard',    label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/parent/children',     label: 'أطفالي',   icon: Users },
  { href: '/parent/exercises',    label: 'التمارين', icon: Dumbbell },
  { href: '/parent/progress',     label: 'التطور',   icon: LineChart },
  { href: '/parent/appointments', label: 'المواعيد', icon: Calendar },
  { href: '/parent/reports',      label: 'التقارير', icon: FileText },
  { href: '/parent/chat',         label: 'التواصل',  icon: MessageSquare },
]

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    return href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0' }}>

      {/* ── Top header bar ── */}
      <header
        className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4"
        style={{ height: 56, background: '#FFFFFF', borderBottom: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(124,92,252,0.06)' }}
        dir="rtl"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}
          >
            <span className="text-white text-sm font-black">أ</span>
          </div>
          <div>
            <div className="font-black text-sm leading-tight" style={{ color: '#7C5CFC' }}>أكاديمية أمين</div>
            <div className="text-[10px] text-gray-400">بوابة الأولياء</div>
          </div>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{ background: open ? '#F3EEFF' : '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3EEFF' }}
          onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB' }}
          aria-label="القائمة"
        >
          {open
            ? <X className="w-5 h-5" style={{ color: '#7C5CFC' }} />
            : <Menu className="w-5 h-5 text-gray-500" />
          }
        </button>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar — slides in from right ── */}
      <aside
        className="fixed right-0 top-0 bottom-0 flex flex-col z-50"
        style={{
          width: 260,
          background: '#FFFFFF',
          borderLeft: '1.5px solid #F0E8FF',
          boxShadow: open ? '-8px 0 40px rgba(124,92,252,0.14)' : 'none',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s',
        }}
        dir="rtl"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1.5px solid #F0E8FF' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}
            >
              <span className="text-white text-base font-black">أ</span>
            </div>
            <div>
              <div className="font-black text-sm leading-tight" style={{ color: '#7C5CFC' }}>أكاديمية أمين</div>
              <div className="text-[10px] text-gray-400">بوابة الأولياء</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: '#F3EEFF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E8DBFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3EEFF' }}
          >
            <X className="w-4 h-4" style={{ color: '#6B46F0' }} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-2xl transition-all duration-200"
                style={active
                  ? { background: '#7C5CFC', color: '#FFFFFF', boxShadow: '0 2px 8px -2px rgba(124,92,252,0.4)' }
                  : { color: '#6B7280' }
                }
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF'; (e.currentTarget as HTMLAnchorElement).style.color = '#7C5CFC' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = ''; (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' } }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1.5px solid #F0E8FF' }}>
          <form action="/api/auth/client/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-0 right-0 left-0 z-30 md:hidden"
        style={{ background: '#FFFFFF', borderTop: '2px solid #F0E8FF', boxShadow: '0 -4px 16px rgba(124,92,252,0.06)' }}
      >
        <div className="flex items-center justify-around py-1.5 px-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px]"
                style={active ? { color: '#7C5CFC' } : { color: '#9CA3AF' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-black leading-none">{label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: '#7C5CFC' }} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Main content — full width always ── */}
      <main className="pb-20 md:pb-6" style={{ paddingTop: 56 }}>
        <div className="max-w-3xl mx-auto p-4 md:p-6" dir="rtl">
          {children}
        </div>
      </main>
    </div>
  )
}
