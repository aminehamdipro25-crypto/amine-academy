'use client'
import { useEffect, useState } from 'react'
import type { Student, Achievement } from '@/lib/types'

const TIER_CONFIG = {
  bronze:   {
    label: 'برونزي 🥉',
    headerGradient: 'from-[#D97706] to-[#B45309]',
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    pill: 'bg-amber-100 text-amber-700',
  },
  silver:   {
    label: 'فضي 🥈',
    headerGradient: 'from-[#94A3B8] to-[#64748B]',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-200',
    pill: 'bg-slate-100 text-slate-600',
  },
  gold:     {
    label: 'ذهبي 🥇',
    headerGradient: 'from-[#FBBF24] to-[#F59E0B]',
    cardBg: 'bg-yellow-50',
    cardBorder: 'border-yellow-200',
    pill: 'bg-yellow-100 text-yellow-700',
  },
  platinum: {
    label: 'بلاتيني 💎',
    headerGradient: 'from-brand-500 to-brand-700',
    cardBg: 'bg-brand-50',
    cardBorder: 'border-[#E8DBFF]',
    pill: 'bg-brand-100 text-brand-700',
  },
}

const LOCKED_BADGES = [
  { icon: '🏃', title: '10 تمارين', desc: 'أكمل 10 تمارين', tier: 'bronze' as const },
  { icon: '🔥', title: 'أسبوع كامل', desc: '7 أيام متتالية', tier: 'silver' as const },
  { icon: '💪', title: 'بطل الشهر', desc: '30 تمريناً هذا الشهر', tier: 'gold' as const },
  { icon: '🧠', title: 'خبير التركيز', desc: 'أكمل 5 تمارين تركيز', tier: 'gold' as const },
  { icon: '🌟', title: '500 نقطة', desc: 'اجمع 500 نقطة', tier: 'platinum' as const },
]

type TierKey = keyof typeof TIER_CONFIG

function TierSection({ tier, achievements }: { tier: TierKey; achievements: Achievement[] }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <div className="rounded-3xl overflow-hidden border border-[#F0E8FF] shadow-card">
      {/* Section header */}
      <div className={`bg-gradient-to-r ${cfg.headerGradient} px-5 py-3 flex items-center justify-between`}>
        <span className="text-white font-black text-sm">{cfg.label}</span>
        <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full ltr-num">
          {achievements.length}
        </span>
      </div>

      {/* Achievements in this tier */}
      {achievements.length === 0 ? (
        <div className="bg-white p-5 text-center">
          <p className="text-gray-400 text-sm font-bold">لا توجد إنجازات بعد 🌱</p>
        </div>
      ) : (
        <div className="bg-white p-4 grid grid-cols-3 gap-3">
          {achievements.map((a, i) => (
            <div key={i} className={`${cfg.cardBg} border ${cfg.cardBorder} rounded-2xl p-3 text-center`}>
              <div className="text-3xl mb-1.5">{a.icon}</div>
              <p className="font-black text-xs text-gray-800 leading-tight">{a.titleAr || a.title}</p>
              {a.descriptionAr && (
                <p className="text-gray-400 text-[10px] mt-0.5 leading-tight line-clamp-2">{a.descriptionAr}</p>
              )}
              <span className={`inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.pill}`}>
                {cfg.label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
    <div className="flex flex-col items-center justify-center py-20" dir="rtl">
      <div className="text-5xl animate-bounce-soft mb-4">🏆</div>
      <p className="text-brand-600 font-black text-lg">جاري التحميل...</p>
    </div>
  )

  const ach = student?.achievements || []
  const unlockedCount = ach.length
  const lockedCount = LOCKED_BADGES.length

  // Group by tier
  const byTier: Record<TierKey, Achievement[]> = {
    gold:     ach.filter(a => a.tier === 'gold'),
    silver:   ach.filter(a => a.tier === 'silver'),
    bronze:   ach.filter(a => a.tier === 'bronze'),
    platinum: ach.filter(a => a.tier === 'platinum'),
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Page header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-black text-2xl text-gray-900">🏆 إنجازاتي</h1>
        <p className="text-gray-500 text-sm mt-1">كل جائزة تُعبّر عن تقدمك</p>
      </div>

      {/* Trophy stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-3 text-center shadow-card">
          <div className="text-2xl mb-1">🏅</div>
          <div className="font-black text-xl text-gray-900 ltr-num">{unlockedCount + lockedCount}</div>
          <div className="text-gray-400 text-[10px] font-bold">إجمالي</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-3 text-center shadow-card">
          <div className="text-2xl mb-1">✅</div>
          <div className="font-black text-xl text-green-600 ltr-num">{unlockedCount}</div>
          <div className="text-gray-400 text-[10px] font-bold">مكتسبة</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F0E8FF] p-3 text-center shadow-card">
          <div className="text-2xl mb-1">🔒</div>
          <div className="font-black text-xl text-gray-400 ltr-num">{lockedCount}</div>
          <div className="text-gray-400 text-[10px] font-bold">مقفلة</div>
        </div>
      </div>

      {/* Points banner */}
      <div className="bg-gradient-to-l from-brand-600 via-brand-500 to-[#9A7BFD] rounded-3xl p-5 text-white text-center shadow-brand relative overflow-hidden">
        <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <div className="text-5xl font-black ltr-num">{student?.totalPoints || 0}</div>
          <div className="text-white/80 mt-1 font-bold">نقطة إجمالية ⭐</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-amber-300">🔥</span>
            <span className="font-black text-sm">{student?.streak || 0} يوم متتالي</span>
          </div>
        </div>
      </div>

      {/* Tier sections — unlocked achievements */}
      {unlockedCount === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#E8DBFF] bg-white p-10 text-center">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-black text-gray-700">لا توجد إنجازات بعد 🌱</p>
          <p className="text-gray-400 text-sm mt-1">أكمل تمارينك لتحصل على أوسمتك!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {((['gold', 'silver', 'bronze', 'platinum'] as TierKey[]).filter(t => byTier[t].length > 0)).map(tier => (
            <TierSection key={tier} tier={tier} achievements={byTier[tier]} />
          ))}
        </div>
      )}

      {/* Locked badges */}
      <div>
        <h2 className="font-black text-gray-900 mb-3">أوسمة في انتظارك 🔒</h2>
        <div className="space-y-3">
          {LOCKED_BADGES.map(b => {
            const cfg = TIER_CONFIG[b.tier]
            return (
              <div key={b.title} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 flex items-center gap-4 shadow-card">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl opacity-40 grayscale">
                    {b.icon}
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-base">🔒</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-700">{b.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{b.desc}</div>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${cfg.pill}`}>
                  {cfg.label.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
