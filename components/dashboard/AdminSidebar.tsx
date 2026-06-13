'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Calendar,
  BarChart3, FileText, LogOut, Brain, ClipboardList,
  BookOpen, Settings, CreditCard, MessageSquare,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',                    label: 'الرئيسية',         icon: LayoutDashboard },
  { href: '/dashboard/clients',            label: 'المشتركون',        icon: Users },
  { href: '/dashboard/programs',           label: 'البرامج',          icon: ClipboardList },
  { href: '/dashboard/exercises',          label: 'التمارين',         icon: Dumbbell },
  { href: '/dashboard/appointments',       label: 'المواعيد',         icon: Calendar },
  { href: '/dashboard/learning-difficulties', label: 'صعوبات التعلم', icon: BookOpen },
  { href: '/dashboard/reports',            label: 'التقارير',         icon: FileText },
  { href: '/dashboard/payments',           label: 'المدفوعات',        icon: CreditCard },
  { href: '/dashboard/messages',           label: 'الرسائل',          icon: MessageSquare },
  { href: '/dashboard/settings',           label: 'الإعدادات',        icon: Settings },
  { href: '/dashboard/analytics',          label: 'الإحصائيات',       icon: BarChart3 },
]

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()

  function handleKeyDown(e: React.KeyboardEvent, href: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(href)
      onClose?.()
    }
  }

  return (
    <aside
      className="w-60 bg-brand-950 flex flex-col h-full min-h-screen"
      role="navigation"
      aria-label="القائمة الرئيسية"
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-black text-sm leading-none">أكاديمية أمين</div>
            <div className="text-white/40 text-[11px] mt-0.5">لوحة المشرف</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              onKeyDown={e => handleKeyDown(e, href)}
              aria-current={active ? 'page' : undefined}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                font-medium transition-all duration-150 outline-none
                focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1
                focus-visible:ring-offset-brand-950
                ${active
                  ? 'bg-white/12 text-white'
                  : 'text-white/55 hover:text-white hover:bg-white/7 active:bg-white/10'
                }
              `}
            >
              {/* Active indicator bar — left side (toward content) */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-400 rounded-r-full"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${
                  active ? 'text-brand-300 scale-110' : 'group-hover:scale-105'
                }`}
              />
              <span className="flex-1 truncate">{label}</span>

              {/* Hover indicator */}
              {!active && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/0 group-hover:bg-white/30 transition-colors flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <form action="/api/auth/admin/logout" method="POST">
          <button
            type="submit"
            className="
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
              text-white/50 hover:text-white hover:bg-red-500/15 active:bg-red-500/25
              transition-all duration-150 outline-none
              focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1
              focus-visible:ring-offset-brand-950
            "
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  )
}
