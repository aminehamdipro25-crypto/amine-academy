'use client'
import { useEffect, useState } from 'react'
import type { Student } from '@/lib/types'

const TIERS = {
  bronze:   { label: 'برونزي', bg: 'bg-amber-100',   border: 'border-amber-300',   text: 'text-amber-700' },
  silver:   { label: 'فضي',    bg: 'bg-gray-100',    border: 'border-gray-300',    text: 'text-gray-600' },
  gold:     { label: 'ذهبي',   bg: 'bg-yellow-100',  border: 'border-yellow-400',  text: 'text-yellow-700' },
  platinum: { label: 'بلاتيني', bg: 'bg-purple-100', border: 'border-purple-400',  text: 'text-purple-700' },
}

const LOCKED_BADGES = [
  { icon: '🏃', title: '10 تمارين', desc: 'أكمل 10 تمارين', tier: 'bronze', needed: 10 },
  { icon: '🔥', title: 'أسبوع كامل', desc: '7 أيام متتالية', tier: 'silver', needed: 7 },
  { icon: '💪', title: 'بطل الشهر', desc: '30 تمريناً هذا الشهر', tier: 'gold', needed: 30 },
  { icon: '🧠', title: 'خبير التركيز', desc: 'أكمل 5 تمارين تركيز', tier: 'gold', needed: 5 },
  { icon: '🌟', title: '500 نقطة', desc: 'اجمع 500 نقطة', tier: 'platinum', needed: 500 },
]

export default function AchievementsPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/me')
      .then(r => r.json())
      .then(d => setStudent(d.student))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl animate-bounce mb-4">🏆</div>
      <p className="text-brand-600 font-bold">جاري التحميل...</p>
    </div>
  )

  const ach = student?.achievements || []

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <h1 className="font-black text-2xl text-gray-900">جوائزي 🏆</h1>
        <p className="text-gray-500 text-sm mt-1 ltr-num">{ach.length} وسام مكتسب</p>
      </div>

      {/* Points */}
      <div className="bg-gradient-to-l from-brand-600 to-brand-800 rounded-2xl p-5 text-white text-center">
        <div className="text-5xl font-black ltr-num">{student?.totalPoints || 0}</div>
        <div className="text-white/70 mt-1">نقطة إجمالية ⭐</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-orange-300">🔥</span>
          <span className="font-bold">{student?.streak || 0} يوم متتالي</span>
        </div>
      </div>

      {/* Unlocked badges */}
      {ach.length > 0 && (
        <div>
          <h2 className="font-black text-gray-900 mb-3">أوسمتي المكتسبة</h2>
          <div className="grid grid-cols-3 gap-3">
            {ach.map((a, i) => {
              const tier = TIERS[(a.tier as keyof typeof TIERS)] || TIERS.bronze
              return (
                <div key={i} className={`${tier.bg} border-2 ${tier.border} rounded-2xl p-4 text-center`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className={`font-black text-xs ${tier.text}`}>{a.titleAr || a.title}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${tier.bg} ${tier.text} font-bold`}>
                    {tier.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges to unlock */}
      <div>
        <h2 className="font-black text-gray-900 mb-3">أوسمة في انتظارك</h2>
        <div className="space-y-3">
          {LOCKED_BADGES.map(b => {
            const tier = TIERS[b.tier as keyof typeof TIERS]
            return (
              <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl opacity-40 flex-shrink-0">
                  {b.icon}
                </div>
                <div className="flex-1">
                  <div className="font-black text-gray-700">{b.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{b.desc}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tier.bg} ${tier.text}`}>{tier.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
