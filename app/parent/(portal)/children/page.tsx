'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Dumbbell, Play } from 'lucide-react'
import type { Student } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

const DIAG_EMOJI: Record<string, string> = {
  ADHD: '⚡', AUTISM: '🌈', 'ADHD+AUTISM': '🌟', OTHER: '💙',
}

const AGE_GRADIENTS: Record<string, string> = {
  '5-11':  'linear-gradient(135deg, #F97316, #F59E0B)',
  '12-17': 'linear-gradient(135deg, #6B46F0, #4A20C8)',
  '18-22': 'linear-gradient(135deg, #14B8A6, #10B981)',
}

const SEVERITY_BG: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F0FFF4', color: '#15803D' },
  2: { bg: '#FFFBEB', color: '#B45309' },
  3: { bg: '#FEF2F2', color: '#B91C1C' },
}

export default function ChildrenPage() {
  const { lang } = useLang()
  const t = tr[lang].parentChildren
  const coachName = tr[lang].portal.common.coachName
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
      <div className="text-4xl animate-pulse">👶</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: '#F3EEFF', boxShadow: '0 2px 8px -2px rgba(124,92,252,0.15)' }}
        >
          👨‍👩‍👧
        </div>
        <div>
          <h1 className="font-black text-xl text-gray-900">{t.pageTitle}</h1>
          <p className="text-gray-400 text-sm">{t.pageSubtitle}</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div
          className="rounded-3xl p-14 text-center"
          style={{ background: '#FFFFFF', border: '2px dashed #E8DBFF' }}
        >
          <div className="text-6xl mb-4">👶</div>
          <h3 className="font-black text-gray-700 text-lg mb-2">{t.noChildrenTitle}</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">{t.noChildrenSubtitle(coachName)}</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}?text=${encodeURIComponent(t.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-all"
            style={{ background: '#16A34A' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#15803D' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#16A34A' }}
          >
            {t.contactViaWhatsapp}
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map(child => {
            const gradient = AGE_GRADIENTS[child.ageGroup] || 'linear-gradient(135deg, #6B46F0, #4A20C8)'
            const severityBg = SEVERITY_BG[child.severityLevel]
            const severityCfg = severityBg ? { ...severityBg, label: t.severityLabels[child.severityLevel as keyof typeof t.severityLabels] } : undefined

            return (
              <div
                key={child.id}
                className="rounded-3xl overflow-hidden transition-all duration-200"
                style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px -4px rgba(124,92,252,0.16)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
              >
                {/* Age group banner */}
                <div className="h-2" style={{ background: gradient }} />

                <div className="p-5">
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    >
                      {DIAG_EMOJI[child.diagnosis] || '🌟'}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900 text-lg">{child.firstName} {child.lastName}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{child.ageGroup} {t.yearsUnit}</div>
                    </div>
                    {severityCfg && (
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: severityCfg.bg, color: severityCfg.color }}
                      >
                        {severityCfg.label}
                      </span>
                    )}
                  </div>

                  {/* Diagnosis pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: '#F3EEFF', color: '#5A32D9', border: '1px solid #E8DBFF' }}
                    >
                      {t.diagnosisLabels[child.diagnosis as keyof typeof t.diagnosisLabels] || child.diagnosis}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF8E8' }}>
                      <div className="text-xl">⭐</div>
                      <div className="font-black text-amber-700 text-sm ltr-num">{child.totalPoints}</div>
                      <div className="text-[10px] text-amber-600">{t.pointLabel}</div>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#FFF3E8' }}>
                      <div className="text-xl">🔥</div>
                      <div className="font-black text-orange-700 text-sm ltr-num">{child.streak}</div>
                      <div className="text-[10px] text-orange-600">{t.streakDaysLabel}</div>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: '#EFF6FF' }}>
                      <div className="text-xl">🏆</div>
                      <div className="font-black text-blue-700 text-sm ltr-num">{child.achievements?.length || 0}</div>
                      <div className="text-[10px] text-blue-600">{t.achievementLabel}</div>
                    </div>
                  </div>

                  {/* Sensory profile */}
                  {child.sensoryProfile && (
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-700 text-sm mb-3">{t.sensoryProfileTitle}</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: t.sensoryLabels.vision, value: child.sensoryProfile?.visualSensitivity },
                          { label: t.sensoryLabels.hearing, value: child.sensoryProfile?.audioSensitivity },
                          { label: t.sensoryLabels.touch, value: child.sensoryProfile?.touchSensitivity },
                        ].map(({ label, value }) => {
                          const cfg = value === 'high'
                            ? { bg: '#FEF2F2', color: '#B91C1C', text: t.sensitivityHigh }
                            : value === 'low'
                            ? { bg: '#F0FFF4', color: '#15803D', text: t.sensitivityLow }
                            : { bg: '#FFFBEB', color: '#B45309', text: t.sensitivityMedium }
                          return (
                            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: cfg.bg, color: cfg.color }}>
                              <div className="font-bold text-xs mb-0.5">{label}</div>
                              <div className="text-xs opacity-80">{cfg.text}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {child.achievements?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-700 text-sm mb-2">{t.achievementsTitle}</h3>
                      <div className="flex flex-wrap gap-2">
                        {child.achievements.slice(0, 6).map((a, i) => (
                          <span
                            key={i}
                            className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: '#F3EEFF', color: '#5A32D9', border: '1px solid #F0E8FF' }}
                          >
                            🏆 {typeof a === 'string' ? a : (a as { titleAr?: string; title?: string }).titleAr || (a as { titleAr?: string; title?: string }).title || ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start session button */}
                  <Link
                    href={`/parent/child-session/${child.id}`}
                    className="flex items-center justify-center gap-2 font-black text-sm px-4 py-3 rounded-2xl transition-all mb-3 w-full"
                    style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(124,92,252,0.35)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 18px rgba(124,92,252,0.45)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 14px rgba(124,92,252,0.35)' }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {t.startSessionButton(child.firstName)}
                  </Link>

                  {/* Links row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/parent/exercises"
                      className="flex items-center justify-center gap-1.5 font-bold text-xs px-3 py-2.5 rounded-2xl transition-all"
                      style={{ background: '#F3EEFF', color: '#5A32D9' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
                    >
                      <Dumbbell className="w-3.5 h-3.5" /> {t.exercisesLink}
                    </Link>
                    <Link
                      href="/parent/progress"
                      className="flex items-center justify-center gap-1.5 font-bold text-xs px-3 py-2.5 rounded-2xl transition-all"
                      style={{ background: '#ECFDF5', color: '#065F46' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#D1FAE5' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#ECFDF5' }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> {t.progressLink}
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
