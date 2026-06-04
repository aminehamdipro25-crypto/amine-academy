'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Home, Dumbbell, BookOpen, Trophy, Calendar } from 'lucide-react'

const navItems = [
  { href: '/student/dashboard',   label: 'بيتي',     icon: Home,     emoji: '🏠' },
  { href: '/student/exercises',   label: 'تمارين',   icon: Dumbbell, emoji: '💪' },
  { href: '/student/journal',     label: 'يومياتي',  icon: BookOpen, emoji: '📔' },
  { href: '/student/achievements',label: 'جوائزي',   icon: Trophy,   emoji: '🏆' },
  { href: '/student/schedule',    label: 'جدولي',    icon: Calendar, emoji: '📅' },
]

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Heartbeat — report online status every 60s
  useEffect(() => {
    const ping = () => fetch('/api/student/ping')
    ping()
    const id = setInterval(ping, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Fun header bar */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="text-brand-600 font-black text-lg">🌟 أكاديميتي</div>
        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
          <span className="text-orange-500 text-sm">🔥</span>
          <span className="text-orange-600 font-black text-sm" id="streak-display">3</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-28">{children}</main>

      {/* Bottom navigation — big & friendly */}
      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t-2 border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {navItems.map(({ href, label, emoji }) => {
            const active = href === '/student/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                  active
                    ? 'bg-brand-100 text-brand-700 scale-110'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] font-bold">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
