'use client'
import { useState } from 'react'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import AdminHeader from '@/components/dashboard/AdminHeader'
import AdminBreadcrumb from '@/components/dashboard/AdminBreadcrumb'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Backdrop — all screen sizes */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — overlay on all sizes, toggle via sidebarOpen */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-60 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main — always full width */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AdminBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  )
}
