'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, LineChart,
  Calendar, MessageSquare, FileText, LogOut, Dumbbell,
} from 'lucide-react'

const navItems = [
  { href: '/parent/dashboard',    label: 'الرئيسية',      icon: LayoutDashboard },
  { href: '/parent/children',     label: 'أطفالي',        icon: Users },
  { href: '/parent/exercises',    label: 'التمارين',      icon: Dumbbell },
  { href: '/parent/progress',     label: 'التطور',        icon: LineChart },
  { href: '/parent/appointments', label: 'المواعيد',      icon: Calendar },
  { href: '/parent/reports',      label: 'التقارير',      icon: FileText },
  { href: '/parent/chat',         label: 'التواصل',       icon: MessageSquare },
]

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-[#F0E8FF] z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                  active ? 'text-brand-600' : 'text-gray-400'
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-brand-500 mx-auto mt-0.5" />}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed right-0 top-0 bottom-0 w-56 bg-white border-l border-[#F0E8FF] flex-col z-40">
        <div className="p-5 border-b border-[#F0E8FF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-black">أ</span>
            </div>
            <div>
              <div className="text-brand-600 font-black text-sm leading-tight">أكاديمية أمين</div>
              <div className="text-gray-400 text-[10px]">بوابة الأولياء</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500 text-white shadow-brand-sm rounded-2xl'
                    : 'text-gray-500 hover:bg-[#F3EEFF] hover:text-brand-600 rounded-2xl'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-[#F0E8FF]">
          <form action="/api/auth/client/logout" method="POST">
            <button type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:bg-[#F3EEFF] hover:text-brand-600 transition-all duration-200">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:mr-56 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
