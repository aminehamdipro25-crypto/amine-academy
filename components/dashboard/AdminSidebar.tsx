'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Calendar,
  BarChart3, FileText, LogOut, Brain, ClipboardList,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'المشتركون', icon: Users },
  { href: '/dashboard/programs', label: 'البرامج', icon: ClipboardList },
  { href: '/dashboard/exercises', label: 'التمارين', icon: Dumbbell },
  { href: '/dashboard/appointments', label: 'المواعيد', icon: Calendar },
  { href: '/dashboard/reports', label: 'التقارير', icon: FileText },
  { href: '/dashboard/analytics', label: 'الإحصائيات', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-brand-950 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-black text-sm leading-none">أكاديمية أمين</div>
            <div className="text-white/50 text-xs mt-0.5">لوحة المشرف</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <form action="/api/auth/admin/logout" method="POST">
          <button type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  )
}
