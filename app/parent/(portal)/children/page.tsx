'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Dumbbell } from 'lucide-react'
import type { Student } from '@/lib/types'

const DIAGNOSIS_LABELS: Record<string, string> = {
  ADHD: 'اضطراب نقص الانتباه',
  AUTISM: 'طيف التوحد',
  'ADHD+AUTISM': 'ADHD + طيف التوحد',
  OTHER: 'أخرى',
}

const DIAG_EMOJI: Record<string, string> = {
  ADHD: '⚡', AUTISM: '🌈', 'ADHD+AUTISM': '🌟', OTHER: '💙',
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
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl shadow-[0_2px_8px_-2px_rgba(124,92,252,0.15)]">
          👨‍👩‍👧
        </div>
        <div>
          <h1 className="font-black text-xl text-gray-900">أطفالي</h1>
          <p className="text-gray-400 text-sm">ملف تفصيلي لكل طفل</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#E8DBFF] p-14 text-center">
          <div className="text-6xl mb-4" style={{animation:'float 4s ease-in-out infinite'}}>👶</div>
          <h3 className="font-black text-gray-700 text-lg mb-2">لم يُضف أي طفل بعد</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">تواصل مع الأستاذ أمين عبر واتساب لاستكمال تسجيل طفلك</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}?text=${encodeURIComponent('مرحباً، أريد استكمال تسجيل طفلي في أكاديمية أمين')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-green-700 transition-colors"
          >
            تواصل عبر واتساب
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map(child => {
            const gradient = AGE_COLORS[child.ageGroup] || 'from-brand-600 to-brand-800'

            return (
              <div key={child.id} className="bg-white rounded-3xl border border-[#F0E8FF] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(124,92,252,0.16)] transition-all duration-200">
                {/* Top color banner based on age group */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                {/* Card content */}
                <div className="p-5">
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-warm-sm`}>
                      {DIAG_EMOJI[child.diagnosis] || '🌟'}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900 text-lg">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{child.ageGroup} سنة</div>
                    </div>
                    {SEVERITY_LABELS[child.severityLevel] && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${SEVERITY_LABELS[child.severityLevel].color}`}>
                        {SEVERITY_LABELS[child.severityLevel].label}
                      </span>
                    )}
                  </div>

                  {/* Diagnosis pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs bg-brand-50 text-brand-700 font-bold px-3 py-1.5 rounded-full border border-brand-100">
                      {DIAGNOSIS_LABELS[child.diagnosis] || child.diagnosis}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#FFF8E8] rounded-2xl p-3 text-center">
                      <div className="text-xl">⭐</div>
                      <div className="font-black text-amber-700 text-sm ltr-num">{child.totalPoints}</div>
                      <div className="text-[10px] text-amber-600">نقطة</div>
                    </div>
                    <div className="bg-[#FFF3E8] rounded-2xl p-3 text-center">
                      <div className="text-xl">🔥</div>
                      <div className="font-black text-orange-700 text-sm ltr-num">{child.streak}</div>
                      <div className="text-[10px] text-orange-600">يوم متتالي</div>
                    </div>
                    <div className="bg-[#F0F8FF] rounded-2xl p-3 text-center">
                      <div className="text-xl">🏆</div>
                      <div className="font-black text-blue-700 text-sm ltr-num">{child.achievements?.length || 0}</div>
                      <div className="text-[10px] text-blue-600">إنجاز</div>
                    </div>
                  </div>

                  {/* Sensory profile */}
                  {child.sensoryProfile && (
                    <div className="mb-4">
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
                            <div key={label} className={`rounded-2xl p-3 text-center ${color}`}>
                              <div className="font-bold text-xs mb-0.5">{label}</div>
                              <div className="text-xs opacity-80">{levelLabel}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {child.achievements?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-700 text-sm mb-2">الإنجازات</h3>
                      <div className="flex flex-wrap gap-2">
                        {child.achievements.slice(0, 6).map((a, i) => (
                          <span key={i} className="text-xs bg-[#F3EEFF] text-brand-700 border border-[#F0E8FF] px-3 py-1.5 rounded-full font-bold">
                            🏆 {typeof a === 'string' ? a : (a as { titleAr?: string; title?: string }).titleAr || (a as { titleAr?: string; title?: string }).title || ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/parent/exercises" className="flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs px-3 py-2.5 rounded-2xl transition-colors">
                      <Dumbbell className="w-3.5 h-3.5" /> التمارين
                    </Link>
                    <Link href="/parent/progress" className="flex items-center justify-center gap-1.5 bg-[#F0FFF9] hover:bg-[#DCFFF2] text-emerald-700 font-bold text-xs px-3 py-2.5 rounded-2xl transition-colors">
                      <TrendingUp className="w-3.5 h-3.5" /> التطور
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
