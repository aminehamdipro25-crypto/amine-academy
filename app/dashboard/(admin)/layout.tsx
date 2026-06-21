'use client'
import { useState } from 'react'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import AdminHeader  from '@/components/dashboard/AdminHeader'
import { ToastProvider }   from '@/components/ui/Toast'
import { CommandPalette }  from '@/components/ui/CommandPalette'
import { useLang } from '@/lib/i18n'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const { lang } = useLang()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-slate-100" dir={dir}>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — overlay on mobile, permanent on desktop */}
        <aside
          className={`
            print:hidden
            fixed top-0 right-0 bottom-0 z-50 w-64 flex-shrink-0
            lg:static lg:z-auto lg:translate-x-0 lg:self-stretch
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <AdminSidebar onClose={() => setMobileOpen(false)} unreadMessages={unreadMessages} />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <div className="print:hidden">
            <AdminHeader onMenuToggle={() => setMobileOpen(o => !o)} onUnreadChange={setUnreadMessages} />
          </div>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto print:p-0">
            {children}
          </main>
        </div>

      </div>

      {/* Global: Command palette (Ctrl+K) */}
      <CommandPalette />
    </ToastProvider>
  )
}
