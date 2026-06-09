'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/student/dashboard',    label: 'بيتي',    emoji: '🏠' },
  { href: '/student/exercises',    label: 'تمارين',  emoji: '💪' },
  { href: '/student/journal',      label: 'يومياتي', emoji: '📔' },
  { href: '/student/achievements', label: 'جوائزي',  emoji: '🏆' },
  { href: '/student/schedule',     label: 'جدولي',   emoji: '📅' },
]

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [studentName, setStudentName] = useState<string>('أكاديميتي')
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    try {
      const name = localStorage.getItem('data-student-name')
      if (name) setStudentName(name)
      const s = localStorage.getItem('data-student-streak')
      if (s) setStreak(parseInt(s, 10) || 0)
    } catch {}
  }, [])

  // Heartbeat — report online status every 60s
  useEffect(() => {
    const ping = () => fetch('/api/student/ping').catch(() => {})
    ping()
    const id = setInterval(ping, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#FFF8F0]" dir="rtl">

      {/* ── Sticky gradient header ── */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(to left, #6B46F0, #7C5CFC)', boxShadow: '0 2px 12px -2px rgba(124,92,252,0.35)' }}
      >
        <div className="text-white font-black text-lg tracking-tight">🌟 {studentName}</div>
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
          >
            <span>🔥</span>
            <span className="ltr-num">{streak}</span>
            <span className="text-white/80 text-xs">يوم</span>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-32">
        {children}
      </main>

      {/* ── Bottom navigation ── */}
      <nav
        className="fixed bottom-0 right-0 left-0 z-50"
        style={{ background: '#FFFFFF', borderTop: '2px solid #F0E8FF', boxShadow: '0 -4px 16px rgba(124,92,252,0.08)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {navItems.map(({ href, label, emoji }) => {
            const active = href === '/student/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 relative"
                style={{ minWidth: '52px' }}
              >
                <div
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                  style={active
                    ? { background: '#7C5CFC', boxShadow: '0 2px 8px -2px rgba(124,92,252,0.4)', transform: 'scale(1.08)' }
                    : {}
                  }
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span
                    className="text-[10px] font-black leading-none"
                    style={{ color: active ? '#FFFFFF' : '#9CA3AF' }}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
