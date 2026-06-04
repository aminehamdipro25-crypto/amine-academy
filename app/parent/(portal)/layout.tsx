'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, LineChart,
  Calendar, MessageSquare, FileText, LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/parent/dashboard',    label: 'الرئيسية',      icon: LayoutDashboard },
  { href: '/parent/children',     label: 'أطفالي',        icon: Users },
  { href: '/parent/progress',     label: 'التطور',        icon: LineChart },
  { href: '/parent/appointments', label: 'المواعيد',      icon: Calendar },
  { href: '/parent/reports',      label: 'التقارير',      icon: FileText },
  { href: '/parent/chat',         label: 'التواصل',       icon: MessageSquare },
]

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors ${
                  active ? 'text-brand-600' : 'text-gray-400'
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed right-0 top-0 bottom-0 w-56 bg-white border-l border-gray-100 flex-col z-40">
        <div className="p-5 border-b border-gray-100">
          <div className="text-brand-600 font-black text-lg">أكاديمية أمين</div>
          <div className="text-gray-400 text-xs mt-0.5">بوابة الأولياء</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <form action="/api/auth/client/logout" method="POST">
            <button type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:mr-56 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
