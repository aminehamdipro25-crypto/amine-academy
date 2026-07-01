'use client'
import { useEffect, useState } from 'react'
import { useLang, pickLang } from '@/lib/i18n'

interface DynStats {
  childrenCount: string
  satisfactionPct: string
  protocolsCount: string
  sessionMinutes: string
}

const DEFAULTS: DynStats = {
  childrenCount:   '12',
  satisfactionPct: '97%',
  protocolsCount:  '+25',
  sessionMinutes:  '45',
}

export default function StatsSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const [s, setS] = useState<DynStats>(DEFAULTS)

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then(d => { if (d?.stats) setS({ ...DEFAULTS, ...d.stats }) })
      .catch(() => {})
  }, [])

  const stats = [
    {
      value: s.childrenCount,
      label:   'طفل مستفيد',
      labelEn: 'Children in Program',
      labelFr: 'Enfants accompagnés',
      sub:     'قطر وتونس والعالم العربي',
      subEn:   'Qatar, Tunisia & Arab World',
      subFr:   'Qatar, Tunisie et monde arabe',
      gradient: 'linear-gradient(135deg, #818CF8, #C084FC)',
    },
    {
      value: s.satisfactionPct,
      label:   'رضا الأولياء',
      labelEn: 'Parent Satisfaction',
      labelFr: 'Parents satisfaits',
      sub:     'بعد 3 أشهر من البرنامج',
      subEn:   'After 3 months',
      subFr:   'Après 3 mois de programme',
      gradient: 'linear-gradient(135deg, #2DD4BF, #60A5FA)',
    },
    {
      value: s.protocolsCount,
      label:   'بروتوكولاً علمياً',
      labelEn: 'Scientific Protocols',
      labelFr: 'Protocoles scientifiques',
      sub:     'APA + ABA + CBT',
      subEn:   'APA + ABA + CBT',
      subFr:   'APA + ABA + TCC',
      gradient: 'linear-gradient(135deg, #A78BFA, #818CF8)',
    },
    {
      value: s.sessionMinutes,
      label:   'دقيقة جلسة تفاعلية',
      labelEn: 'Min. Live Session',
      labelFr: 'Min. séance en direct',
      sub:     'حركة + سلوك + معرفة',
      subEn:   'Movement + Behavior + Cognition',
      subFr:   'Mouvement + comportement + cognition',
      gradient: 'linear-gradient(135deg, #FBBF24, #F97316)',
    },
  ]

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(180deg, #07111F 0%, #0F172A 100%)', padding: '56px 0' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl p-6 text-center transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="text-4xl font-black mb-1.5 ltr-num"
                style={{
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <div className="text-white/80 font-bold text-sm mb-0.5">
                {pickLang(lang, stat.label, stat.labelEn, stat.labelFr)}
              </div>
              <div className="text-white/35 text-xs">
                {pickLang(lang, stat.sub, stat.subEn, stat.subFr)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
