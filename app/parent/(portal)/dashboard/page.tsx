'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Calendar, TrendingUp, Bell, ArrowLeft } from 'lucide-react'
import type { Parent, Student } from '@/lib/types'

interface DashboardData {
  parent: Parent
  children: Student[]
  upcomingAppointment: { date: string; time: string } | null
  unreadReports: number
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-gentle-pulse text-brand-600 text-4xl">🌟</div>
    </div>
  )

  if (!data?.parent) return (
    <div className="text-center py-20 text-gray-500">حدث خطأ، حاول مجدداً.</div>
  )

  const { parent, children, upcomingAppointment, unreadReports } = data

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">أهلاً بك،</p>
            <h1 className="font-black text-2xl">{parent.firstName} {parent.lastName}</h1>
            <p className="text-white/80 text-sm mt-2">
              {children.length > 0
                ? `لديك ${children.length} طفل/أطفال مسجلون`
                : 'أضف طفلك الأول لبدء البرنامج'}
            </p>
          </div>
          <div className="text-4xl">👪</div>
        </div>
        {unreadReports > 0 && (
          <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">لديك {unreadReports} تقرير جديد غير مقروء</span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'الأطفال', value: children.length, icon: Users, href: '/parent/children', color: 'text-brand-600 bg-brand-50' },
          { label: 'الموعد القادم', value: upcomingAppointment ? upcomingAppointment.date : 'لا يوجد', icon: Calendar, href: '/parent/appointments', color: 'text-green-600 bg-green-50' },
          { label: 'التقارير', value: unreadReports, icon: TrendingUp, href: '/parent/reports', color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}
            className="card-hover bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-black text-gray-900 text-lg ltr-num">{value}</div>
            <div className="text-gray-500 text-xs">{label}</div>
          </Link>
        ))}
      </div>

      {/* Children cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900">أطفالي</h2>
          <Link href="/parent/children" className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:underline">
            إدارة <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">👶</div>
            <p className="text-gray-500 text-sm mb-4">لم تضف أي طفل بعد</p>
            <Link href="/parent/children"
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-700 transition-colors">
              إضافة طفل
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children.map(child => (
              <div key={child.id} className="card-hover bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {child.firstName[0]}
                  </div>
                  <div>
                    <div className="font-black text-gray-900">{child.firstName} {child.lastName}</div>
                    <div className="text-gray-500 text-xs">{child.ageGroup} سنة • {child.diagnosis}</div>
                  </div>
                </div>
                {/* Mini progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">تقدم الأسبوع</span>
                    <span className="font-bold text-brand-600 ltr-num">{child.totalPoints} نقطة</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="progress-bar h-full" style={{ width: `${Math.min(100, (child.totalPoints / 500) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600 font-bold">🔥 {child.streak} يوم متتالي</span>
                  <Link href={`/parent/children/${child.id}`}
                    className="text-xs text-brand-600 font-bold hover:underline">
                    عرض التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
