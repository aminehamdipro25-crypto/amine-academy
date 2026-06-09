'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'

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
  const isAr = lang === 'ar'
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
      label:   'طفل مستفيد من برامجنا',
      labelEn: 'Children in Program',
      sub:     'قطر وتونس والعالم العربي',
      subEn:   'Qatar, Tunisia & Arab World',
      color:   'text-brand-400',
    },
    {
      value: s.satisfactionPct,
      label:   'رضا أولياء الأمور',
      labelEn: 'Parent Satisfaction',
      sub:     'بعد 3 أشهر من البرنامج',
      subEn:   'After 3 months',
      color:   'text-calm-teal',
    },
    {
      value: s.protocolsCount,
      label:   'بروتوكولاً علمياً',
      labelEn: 'Scientific Protocols',
      sub:     'APA + ABA + CBT',
      subEn:   'APA + ABA + CBT',
      color:   'text-purple-400',
    },
    {
      value: s.sessionMinutes,
      unit:    'min',
      label:   'جلسة تفاعلية مباشرة',
      labelEn: 'Live Interactive Session',
      sub:     'حركة + سلوك + معرفة',
      subEn:   'Movement + Behavior + Cognition',
      color:   'text-amber-400',
    },
  ]

  return (
    <section className="bg-[#FFF8F0] py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label}
              className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-6 text-center hover:-translate-y-1 transition-all">
              <div className={`text-4xl font-black mb-1 ${stat.color} flex items-end justify-center gap-1`} dir="ltr">
                <span className="ltr-num">{stat.value}</span>
                {'unit' in stat && stat.unit && (
                  <span className="text-base font-bold mb-0.5 opacity-80">
                    {isAr ? 'دق' : stat.unit}
                  </span>
                )}
              </div>
              <div className="text-gray-800 font-bold text-sm mb-0.5">
                {isAr ? stat.label : stat.labelEn}
              </div>
              <div className="text-gray-500 text-xs">
                {isAr ? stat.sub : stat.subEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
