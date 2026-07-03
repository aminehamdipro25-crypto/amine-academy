'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Dumbbell, Calendar,
  BarChart3, FileText, LogOut, Brain,
  ClipboardList, BookOpen, Settings, CreditCard, MessageSquare,
  Zap, UserCog, PersonStanding,
} from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

export default function AdminSidebar({ onClose, unreadMessages = 0 }: { onClose?: () => void; unreadMessages?: number }) {
  const pathname = usePathname()
  const { lang } = useLang()
  const t = tr[lang].adminChrome
  const navT = tr[lang].adminNav
  const [actor, setActor] = useState<{ role: 'owner' | 'staff'; name: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => { if (data) setActor(data) }).catch(() => {})
  }, [])

  const isOwner = actor?.role === 'owner'

  const NAV = [
    { href: '/dashboard',                        label: navT.home, icon: LayoutDashboard, ownerOnly: false },
    { href: '/dashboard/clients',                label: navT.clients, icon: Users, ownerOnly: false },
    { href: '/dashboard/payments',               label: navT.payments, icon: CreditCard, ownerOnly: true },
    { href: '/dashboard/appointments',           label: navT.appointments, icon: Calendar, ownerOnly: false },
    { href: '/dashboard/programs',               label: navT.programs, icon: ClipboardList, ownerOnly: false },
    { href: '/dashboard/exercises',              label: navT.exercises, icon: Dumbbell, ownerOnly: false },
    { href: '/dashboard/reports',                label: navT.reports, icon: FileText, ownerOnly: false },
    { href: '/dashboard/messages',               label: navT.messages, icon: MessageSquare, ownerOnly: false },
    { href: '/dashboard/learning-difficulties',  label: navT.learningDifficulties, icon: BookOpen, ownerOnly: false },
    { href: '/dashboard/specialist-toolkit',     label: navT.specialistToolkit, icon: PersonStanding, ownerOnly: false },
    { href: '/dashboard/analytics',              label: navT.analytics, icon: BarChart3, ownerOnly: true },
    { href: '/dashboard/staff',                  label: navT.staff, icon: UserCog, ownerOnly: true },
    { href: '/dashboard/settings',               label: navT.settings, icon: Settings, ownerOnly: true },
  ]
  const visibleNav = NAV.filter(item => !item.ownerOnly || isOwner)

  return (
    <aside className="w-64 h-full flex flex-col bg-white border-l border-gray-100 select-none overflow-hidden">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0 rounded-xl bg-[#6B46F0] flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-gray-900 font-black text-sm leading-none tracking-tight">أكاديمية أمين</div>
            <div className="mt-1 inline-flex items-center gap-1 bg-brand-50 px-1.5 py-0.5 rounded-md">
              <Zap className="w-2.5 h-2.5 text-brand-600" />
              <span className="text-brand-600 text-[9px] font-black uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Group label */}
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 mb-3">{t.mainMenuLabel}</p>

        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 outline-none group
                ${active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              {/* Active marker bar */}
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-l-full" />
              )}

              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                active
                  ? 'bg-brand-500 shadow-sm'
                  : 'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
              </div>

              <span className="flex-1 truncate">{label}</span>

              {/* Unread badge on messages */}
              {href === '/dashboard/messages' && unreadMessages > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-md">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}

              {active && href !== '/dashboard/messages' && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* Admin info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#6B46F0] flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
            {(actor?.name || t.unknownActorInitial).charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xs font-black truncate">{actor?.name || tr[lang].portal.common.coachName}</p>
            <p className="text-gray-400 text-[10px] truncate">{isOwner ? t.ownerRole : t.staffRole}</p>
          </div>
        </div>

        <form action={isOwner ? '/api/auth/admin/logout' : '/api/auth/staff/logout'} method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            {t.logoutLabel}
          </button>
        </form>
      </div>

    </aside>
  )
}
