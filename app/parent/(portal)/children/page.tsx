'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Calendar, BookOpen, TrendingUp, Star, Zap } from 'lucide-react'
import type { Student } from '@/lib/types'

const DIAGNOSIS_LABELS: Record<string, string> = {
  ADHD: 'اضطراب نقص الانتباه',
  AUTISM: 'طيف التوحد',
  'ADHD+AUTISM': 'ADHD + طيف التوحد',
  OTHER: 'أخرى',
}

const AGE_COLORS: Record<string, string> = {
  '5-11':  'from-orange-500 to-amber-500',
  '12-17': 'from-brand-600 to-brand-800',
  '18-22': 'from-teal-500 to-emerald-600',
}

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'خفيف', color: 'text-green-600 bg-green-100' },
  2: { label: 'متوسط', color: 'text-amber-600 bg-amber-100' },
  3: { label: 'شديد', color: 'text-red-600 bg-red-100' },
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.json())
      .then(d => setChildren(d.children || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-brand-600 text-4xl animate-pulse">👶</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">أطفالي</h1>
        <p className="text-gray-500 text-sm mt-0.5">ملف تفصيلي لكل طفل</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-600 mb-2">لم يُضف أي طفل بعد</h3>
          <p className="text-gray-400 text-sm mb-5">تواصل مع الأستاذ أمين عبر واتساب لاستكمال تسجيل طفلك.</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}?text=${encodeURIComponent('مرحباً، أريد استكمال تسجيل طفلي في أكاديمية أمين')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
          >
            تواصل عبر واتساب
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map(child => {
            const sev = SEVERITY_LABELS[child.severityLevel] || SEVERITY_LABELS[1]
            const gradient = AGE_COLORS[child.ageGroup] || 'from-brand-600 to-brand-800'
            const age = child.birthDate
              ? Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
              : null

            return (
              <div key={child.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Header */}
                <div className={`bg-gradient-to-l ${gradient} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
                      {child.firstName[0]}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-black text-xl">{child.firstName} {child.lastName}</h2>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {age && <span className="text-white/80 text-sm ltr-num">{age} سنة</span>}
                        <span className="text-white/80 text-sm">{DIAGNOSIS_LABELS[child.diagnosis] || child.diagnosis}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white`}>
                          {sev.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-white font-black text-2xl ltr-num">{child.totalPoints}</div>
                      <div className="text-white/70 text-xs">نقطة</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 border-b border-gray-100">
                  <div className="p-4 text-center">
                    <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <div className="font-black text-gray-900 ltr-num">{child.totalPoints}</div>
                    <div className="text-xs text-gray-400">نقطة</div>
                  </div>
                  <div className="p-4 text-center">
                    <Zap className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <div className="font-black text-gray-900 ltr-num">{child.streak}</div>
                    <div className="text-xs text-gray-400">يوم متتالي</div>
                  </div>
                  <div className="p-4 text-center">
                    <TrendingUp className="w-4 h-4 text-brand-600 mx-auto mb-1" />
                    <div className="font-black text-gray-900">{child.ageGroup}</div>
                    <div className="text-xs text-gray-400">الفئة العمرية</div>
                  </div>
                </div>

                {/* Sensory profile */}
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700 text-sm mb-3">الملف الحسي</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'البصر', value: child.sensoryProfile?.visualSensitivity },
                      { label: 'السمع', value: child.sensoryProfile?.audioSensitivity },
                      { label: 'اللمس', value: child.sensoryProfile?.touchSensitivity },
                    ].map(({ label, value }) => {
                      const color = value === 'high' ? 'text-red-600 bg-red-50' : value === 'low' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'
                      const levelLabel = value === 'high' ? 'حساسية عالية' : value === 'low' ? 'حساسية منخفضة' : 'حساسية متوسطة'
                      return (
                        <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                          <div className="font-bold text-xs mb-0.5">{label}</div>
                          <div className="text-xs opacity-80">{levelLabel}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Quick links */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-700 text-sm mb-3">روابط سريعة</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { href: '/parent/exercises', icon: BookOpen, label: 'التمارين', color: 'bg-purple-50 text-purple-700' },
                      { href: '/parent/appointments', icon: Calendar, label: 'المواعيد', color: 'bg-brand-50 text-brand-700' },
                      { href: '/parent/progress', icon: TrendingUp, label: 'التطور', color: 'bg-emerald-50 text-emerald-700' },
                    ].map(({ href, icon: Icon, label, color }) => (
                      <Link key={href} href={href} className={`rounded-xl p-3 text-center ${color} hover:opacity-80 transition-opacity`}>
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-bold">{label}</div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                {child.achievements?.length > 0 && (
                  <div className="px-5 pb-5">
                    <h3 className="font-bold text-gray-700 text-sm mb-2">الإنجازات</h3>
                    <div className="flex flex-wrap gap-2">
                      {child.achievements.slice(0, 6).map((a, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-bold">
                          🏆 {typeof a === 'string' ? a : (a as { titleAr?: string; title?: string }).titleAr || (a as { titleAr?: string; title?: string }).title || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
