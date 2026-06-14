'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, LayoutDashboard, Users, CreditCard, Calendar,
  ClipboardList, Dumbbell, FileText, MessageSquare, BookOpen,
  BarChart3, Settings, UserPlus, Plus,
} from 'lucide-react'

const COMMANDS = [
  { label: 'الرئيسية',         href: '/dashboard',                        icon: LayoutDashboard, hint: 'Home' },
  { label: 'المشتركون',        href: '/dashboard/clients',                icon: Users },
  { label: 'إضافة مشترك',     href: '/dashboard/clients/new',            icon: UserPlus },
  { label: 'المدفوعات',        href: '/dashboard/payments',               icon: CreditCard },
  { label: 'المواعيد',         href: '/dashboard/appointments',           icon: Calendar },
  { label: 'موعد جديد',        href: '/dashboard/appointments/new',       icon: Plus },
  { label: 'البرامج',          href: '/dashboard/programs',               icon: ClipboardList },
  { label: 'التمارين',         href: '/dashboard/exercises',              icon: Dumbbell },
  { label: 'التقارير',         href: '/dashboard/reports',                icon: FileText },
  { label: 'الرسائل',          href: '/dashboard/messages',               icon: MessageSquare },
  { label: 'صعوبات التعلم',   href: '/dashboard/learning-difficulties',  icon: BookOpen },
  { label: 'الإحصائيات',      href: '/dashboard/analytics',              icon: BarChart3 },
  { label: 'الإعدادات',       href: '/dashboard/settings',               icon: Settings },
]

export function CommandPalette() {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx]     = useState(0)
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setIdx(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = COMMANDS.filter(c =>
    !query || c.label.includes(query) || c.href.includes(query)
  )

  useEffect(() => { setIdx(0) }, [query])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[idx]) go(filtered[idx].href)
  }

  function go(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-start justify-center pt-20 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden palette-enter"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="ابحث في الصفحات..."
            className="flex-1 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">لا توجد نتائج</div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.href}
                  onClick={() => go(cmd.href)}
                  onMouseEnter={() => setIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors ${
                    idx === i ? 'bg-brand-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    idx === i ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold transition-colors ${idx === i ? 'text-brand-700' : 'text-gray-700'}`}>
                    {cmd.label}
                  </span>
                  {idx === i && (
                    <span className="mr-auto text-[10px] text-brand-400 font-medium">Enter</span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-50 px-5 py-2.5 flex items-center gap-3 text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">↑↓</kbd>
            <span>تنقل</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">Enter</kbd>
            <span>فتح</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd>
            <span>إغلاق</span>
          </div>
        </div>
      </div>
    </div>
  )
}
