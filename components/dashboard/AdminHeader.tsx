'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Menu, Globe, MessageSquare, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

interface Thread {
  parentId: string
  parentName: string
  lastMessage: string
  lastMessageAt: string
  unreadForAdmin: number
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                   'الرئيسية',
  '/dashboard/clients':           'المشتركون',
  '/dashboard/programs':          'البرامج',
  '/dashboard/exercises':         'التمارين',
  '/dashboard/appointments':      'المواعيد',
  '/dashboard/learning-difficulties': 'صعوبات التعلم',
  '/dashboard/reports':           'التقارير',
  '/dashboard/payments':          'المدفوعات',
  '/dashboard/messages':          'الرسائل',
  '/dashboard/settings':          'الإعدادات',
  '/dashboard/analytics':         'الإحصائيات',
  '/dashboard/staff':             'فريق العمل',
}

export default function AdminHeader({ onMenuToggle, onUnreadChange }: { onMenuToggle?: () => void; onUnreadChange?: (n: number) => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [totalUnread, setTotalUnread] = useState(0)
  const [threads, setThreads]         = useState<Thread[]>([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const [actor, setActor] = useState<{ role: 'owner' | 'staff'; name: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => { if (data) setActor(data) }).catch(() => {})
  }, [])

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) =>
    pathname === k || pathname.startsWith(k + '/')
  )?.[1] ?? 'لوحة التحكم'

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/messages', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const count = data.totalUnread ?? 0
      setTotalUnread(count)
      onUnreadChange?.(count)
      setThreads((data.threads ?? []).filter((t: Thread) => t.unreadForAdmin > 0).slice(0, 5))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [fetchUnread])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function openBell() {
    setOpen(o => !o)
    if (!open && totalUnread > 0) {
      setLoading(true)
      await fetchUnread()
      setLoading(false)
    }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'الآن'
    if (m < 60) return `منذ ${m} د`
    const h = Math.floor(m / 60)
    if (h < 24) return `منذ ${h} س`
    return `منذ ${Math.floor(h / 24)} ي`
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-3 sticky top-0 z-30">

      {/* Right side */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-gray-500" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base font-black text-gray-900 leading-none truncate">{pageTitle}</h1>
          <p className="hidden sm:block text-xs text-gray-400 mt-0.5">أكاديمية أمين — لوحة المشرف</p>
        </div>
      </div>

      {/* Left side */}
      <div className="flex items-center gap-1.5">

        {/* Ctrl+K hint */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <span>بحث</span>
          <kbd className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[9px] font-mono">⌘K</kbd>
        </button>

        {/* View site */}
        <Link href="/" target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 font-medium transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-brand-300 hover:bg-brand-50">
          <Globe className="w-3.5 h-3.5" />
          الموقع
        </Link>

        {/* Notification bell */}
        <div ref={dropRef} className="relative">
          <button
            onClick={openBell}
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
              open ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="الإشعارات"
          >
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white font-black text-[9px] px-0.5 leading-none">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600" />
                  <span className="font-black text-gray-900 text-sm">الإشعارات</span>
                  {totalUnread > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full">
                      {totalUnread} جديد
                    </span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thread list */}
              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : threads.length === 0 ? (
                <div className="py-10 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">لا توجد رسائل جديدة</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {threads.map(t => (
                    <button
                      key={t.parentId}
                      onClick={() => { router.push('/dashboard/messages'); setOpen(false) }}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-right flex items-start gap-3"
                    >
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-black text-sm flex-shrink-0 mt-0.5">
                        {t.parentName?.[0] ?? '؟'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 truncate">{t.parentName}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(t.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{t.lastMessage}</p>
                      </div>
                      {t.unreadForAdmin > 0 && (
                        <span className="w-5 h-5 bg-brand-600 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                          {t.unreadForAdmin}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-50 px-4 py-2.5">
                <Link
                  href="/dashboard/messages"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors py-0.5"
                >
                  عرض كل الرسائل
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin avatar */}
        <div className="flex items-center gap-2 pr-1 border-r border-gray-100 mr-0.5">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
            {(actor?.name || 'أ').charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-black text-gray-900 leading-none">{actor?.name || 'الأستاذ أمين'}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{actor?.role === 'staff' ? 'فريق العمل' : 'مشرف النظام'}</div>
          </div>
        </div>

      </div>
    </header>
  )
}
