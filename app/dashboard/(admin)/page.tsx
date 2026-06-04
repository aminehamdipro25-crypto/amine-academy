import { getAllParents } from '@/lib/db'
import { Users, Calendar, TrendingUp, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const parents = await getAllParents()
  const activeCount = parents.filter(p => p.subscriptionStatus === 'active').length
  const pendingCount = parents.filter(p => p.subscriptionStatus === 'pending').length
  const recentParents = parents.slice(0, 5)

  const stats = [
    { label: 'إجمالي المشتركين', value: parents.length, icon: Users, color: 'bg-brand-100 text-brand-600', change: '+12%' },
    { label: 'اشتراكات نشطة', value: activeCount, icon: TrendingUp, color: 'bg-green-100 text-green-600', change: '+8%' },
    { label: 'في انتظار التفعيل', value: pendingCount, icon: Calendar, color: 'bg-orange-100 text-orange-600', change: '' },
    { label: 'التمارين المتاحة', value: 50, icon: BookOpen, color: 'bg-purple-100 text-purple-600', change: '+3 جديد' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">لوحة التحكم الرئيسية</h1>
        <p className="text-gray-500 text-sm mt-1">مرحباً بك، البروفيسور أمين</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {change && (
                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num">{value}</div>
            <div className="text-gray-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent parents + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-gray-900">آخر التسجيلات</h2>
            <Link href="/dashboard/clients" className="text-brand-600 text-sm font-bold hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentParents.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">لا توجد تسجيلات بعد</div>
            ) : (
              recentParents.map((parent) => (
                <div key={parent.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-black text-sm">
                      {parent.firstName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{parent.firstName} {parent.lastName}</div>
                      <div className="text-gray-500 text-xs">{parent.email}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    parent.subscriptionStatus === 'active'
                      ? 'bg-green-100 text-green-700'
                      : parent.subscriptionStatus === 'pending'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {parent.subscriptionStatus === 'active' ? 'نشط'
                      : parent.subscriptionStatus === 'pending' ? 'في الانتظار'
                      : parent.subscriptionStatus}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-5">إجراءات سريعة</h2>
          <div className="space-y-3">
            {[
              { href: '/dashboard/clients', label: 'إدارة المشتركين', emoji: '👥' },
              { href: '/dashboard/exercises', label: 'إدارة التمارين', emoji: '🏃' },
              { href: '/dashboard/appointments', label: 'جدول المواعيد', emoji: '📅' },
              { href: '/dashboard/reports', label: 'التقارير', emoji: '📊' },
              { href: '/dashboard/analytics', label: 'الإحصائيات', emoji: '📈' },
            ].map(({ href, label, emoji }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <span className="text-lg">{emoji}</span>
                <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors text-sm">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
