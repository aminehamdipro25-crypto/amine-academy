'use client'
import { useEffect, useState } from 'react'
import type { Student, Achievement } from '@/lib/types'

const TIER_CFG = {
  platinum: {
    label: 'بلاتيني 💎',
    headerBg: 'linear-gradient(135deg,#9A7BFD,#7C5CFC)',
    cardBg: '#F3EEFF',
    cardBorder: '#D3BBFF',
    pillBg: '#E8DBFF',
    pillColor: '#6B46F0',
    order: 0,
  },
  gold: {
    label: 'ذهبي 🥇',
    headerBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
    cardBg: '#FFFBEB',
    cardBorder: '#FDE68A',
    pillBg: '#FEF3C7',
    pillColor: '#B45309',
    order: 1,
  },
  silver: {
    label: 'فضي 🥈',
    headerBg: 'linear-gradient(135deg,#94A3B8,#64748B)',
    cardBg: '#F8FAFC',
    cardBorder: '#CBD5E1',
    pillBg: '#F1F5F9',
    pillColor: '#475569',
    order: 2,
  },
  bronze: {
    label: 'برونزي 🥉',
    headerBg: 'linear-gradient(135deg,#D97706,#B45309)',
    cardBg: '#FFFBF5',
    cardBorder: '#FCD9A0',
    pillBg: '#FEF3C7',
    pillColor: '#92400E',
    order: 3,
  },
}

const LOCKED_BADGES = [
  { icon: '🏃', title: '10 تمارين',     desc: 'أكمل 10 تمارين',           tier: 'bronze'   as const },
  { icon: '🔥', title: 'أسبوع كامل',   desc: '7 أيام متتالية',            tier: 'silver'   as const },
  { icon: '💪', title: 'بطل الشهر',    desc: '30 تمريناً هذا الشهر',     tier: 'gold'     as const },
  { icon: '🧠', title: 'خبير التركيز', desc: 'أكمل 5 تمارين تركيز',       tier: 'gold'     as const },
  { icon: '🌟', title: '500 نقطة',     desc: 'اجمع 500 نقطة',            tier: 'platinum' as const },
]

type TierKey = keyof typeof TIER_CFG

function TierSection({ tier, achievements }: { tier: TierKey; achievements: Achievement[] }) {
  const cfg = TIER_CFG[tier]
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ border: `1.5px solid ${cfg.cardBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: cfg.headerBg }}
      >
        <span className="text-white font-black text-sm">{cfg.label}</span>
        <span
          className="text-xs font-black px-2.5 py-0.5 rounded-full ltr-num"
          style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}
        >
          {achievements.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ background: '#FFFFFF', padding: '16px' }}>
        {achievements.length === 0 ? (
          <p className="text-gray-400 text-sm font-bold text-center py-2">لا توجد إنجازات بعد 🌱</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="rounded-2xl p-3 text-center transition-all duration-200 card-lift"
                style={{ background: cfg.cardBg, border: `1.5px solid ${cfg.cardBorder}` }}
              >
                <div className="text-3xl mb-1.5">{a.icon}</div>
                <p className="font-black text-xs text-gray-800 leading-tight">{a.titleAr || a.title}</p>
                {a.descriptionAr && (
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight line-clamp-2">{a.descriptionAr}</p>
                )}
                <span
                  className="inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: cfg.pillBg, color: cfg.pillColor }}
                >
                  {cfg.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className="flex flex-col items-center justify-center py-24" dir="rtl">
      <div className="text-5xl animate-bounce-soft mb-4">🏆</div>
      <p className="font-black text-lg" style={{ color: '#7C5CFC' }}>جاري التحميل...</p>
    </div>
  )

  const ach = student?.achievements ?? []
  const unlockedCount = ach.length

  const byTier: Record<TierKey, Achievement[]> = {
    platinum: ach.filter(a => a.tier === 'platinum'),
    gold:     ach.filter(a => a.tier === 'gold'),
    silver:   ach.filter(a => a.tier === 'silver'),
    bronze:   ach.filter(a => a.tier === 'bronze'),
  }

  const activeTiers = (Object.keys(TIER_CFG) as TierKey[])
    .sort((a, b) => TIER_CFG[a].order - TIER_CFG[b].order)
    .filter(t => byTier[t].length > 0)

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Page header ── */}
      <div className="text-center pt-1 pb-1">
        <h1 className="font-black text-2xl text-gray-900">🏆 إنجازاتي</h1>
        <p className="text-gray-500 text-sm mt-1">كل جائزة تُعبّر عن تقدمك</p>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { emoji: '🏅', value: unlockedCount + LOCKED_BADGES.length, label: 'إجمالي',   bg: '#F8F8F8', border: '#E5E7EB', color: '#374151' },
          { emoji: '✅', value: unlockedCount,                         label: 'مكتسبة',   bg: '#F0FFF9', border: '#A7F3D0', color: '#059669' },
          { emoji: '🔒', value: LOCKED_BADGES.length,                  label: 'مقفلة',    bg: '#F9FAFB', border: '#E5E7EB', color: '#9CA3AF' },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-3 text-center"
            style={{ background: s.bg, border: `1.5px solid ${s.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="font-black text-xl ltr-num" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-bold text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Points & streak banner ── */}
      <div
        className="rounded-3xl p-5 text-white text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6B46F0 0%, #7C5CFC 50%, #9A7BFD 100%)',
          boxShadow: '0 8px 24px -4px rgba(124,92,252,0.35)',
        }}
      >
        <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(12px)' }} />
        <div className="relative z-10">
          <div className="text-5xl font-black ltr-num">{student?.totalPoints ?? 0}</div>
          <div className="text-white/80 mt-1 font-bold">نقطة إجمالية ⭐</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span>🔥</span>
            <span className="font-black text-sm ltr-num">{student?.streak ?? 0} يوم متتالي</span>
          </div>
        </div>
      </div>

      {/* ── Tier sections ── */}
      {unlockedCount === 0 ? (
        <div
          className="rounded-3xl p-10 text-center"
          style={{ border: '2px dashed #D3BBFF', background: '#FFFFFF' }}
        >
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-black text-gray-700 text-lg">لا توجد إنجازات بعد</p>
          <p className="text-gray-400 text-sm mt-1">أكمل تمارينك لتحصل على أوسمتك!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTiers.map(tier => (
            <TierSection key={tier} tier={tier} achievements={byTier[tier]} />
          ))}
        </div>
      )}

      {/* ── Locked badges ── */}
      <div>
        <h2 className="font-black text-gray-900 mb-3 text-base">أوسمة في انتظارك 🔒</h2>
        <div className="space-y-2">
          {LOCKED_BADGES.map(b => {
            const cfg = TIER_CFG[b.tier]
            return (
              <div
                key={b.title}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #F0E8FF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: '#F3F4F6', opacity: 0.45, filter: 'grayscale(1)' }}
                  >
                    {b.icon}
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-base leading-none">🔒</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-700">{b.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{b.desc}</div>
                </div>
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: cfg.pillBg, color: cfg.pillColor }}
                >
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
