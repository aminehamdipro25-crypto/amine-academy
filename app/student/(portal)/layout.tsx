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

  // Load student name and streak from localStorage
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
    const ping = () => fetch('/api/student/ping')
    ping()
    const id = setInterval(ping, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#FFF8F0]" dir="rtl">
      {/* Gradient header */}
      <header className="bg-gradient-to-l from-brand-600 to-brand-500 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-brand-sm">
        <div className="text-white font-black text-lg">🌟 {studentName}</div>
        <div className="flex items-center gap-1.5 bg-amber-400 text-white px-3 py-1.5 rounded-full">
          <span className="text-base">🔥</span>
          <span className="font-black text-sm" id="streak-display">{streak}</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-28">{children}</main>

      {/* Bottom navigation — large hit targets */}
      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t-2 border-[#F0E8FF] z-50 shadow-card">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-1">
          {navItems.map(({ href, label, emoji }) => {
            const active = href === '/student/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-brand-500 text-white scale-110 shadow-brand-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-2xl leading-none">{emoji}</span>
                <span className="text-[10px] font-black leading-none mt-0.5">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
