'use client'
import { Bell, Menu, Globe } from 'lucide-react'
import Link from 'next/link'

export default function AdminHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="القائمة"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile title */}
      <div className="lg:hidden font-black text-gray-900 text-sm flex-1">لوحة التحكم</div>

      {/* Desktop spacer */}
      <div className="hidden lg:flex items-center flex-1">
        <span className="text-sm font-bold text-gray-400">أكاديمية أمين — لوحة المشرف</span>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/" target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 font-medium transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-brand-300">
          <Globe className="w-3.5 h-3.5" />
          عرض الموقع
        </Link>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            أ
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-gray-900 leading-none">الأستاذ أمين</div>
            <div className="text-xs text-gray-500 mt-0.5">مشرف النظام</div>
          </div>
        </div>
      </div>
    </header>
  )
}
