'use client'
import { Bell, Search } from 'lucide-react'

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="بحث..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-black text-sm">
            أ
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-gray-900">الأستاذ أمين</div>
            <div className="text-xs text-gray-500">مشرف النظام</div>
          </div>
        </div>
      </div>
    </header>
  )
}
