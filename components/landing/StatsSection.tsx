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
      label:   'طفل مستفيد من برامجنا',
      labelEn: 'Children in Program',
      labelFr: 'Enfants accompagnés',
      sub:     'قطر وتونس والعالم العربي',
      subEn:   'Qatar, Tunisia & Arab World',
      subFr:   'Qatar, Tunisie et monde arabe',
      color:   'text-brand-400',
    },
    {
      value: s.satisfactionPct,
      label:   'رضا أولياء الأمور',
      labelEn: 'Parent Satisfaction',
      labelFr: 'Parents satisfaits',
      sub:     'بعد 3 أشهر من البرنامج',
      subEn:   'After 3 months',
      subFr:   'Après 3 mois de programme',
      color:   'text-calm-teal',
    },
    {
      value: s.protocolsCount,
      label:   'بروتوكولاً علمياً',
      labelEn: 'Scientific Protocols',
      labelFr: 'Protocoles scientifiques',
      sub:     'APA + ABA + CBT',
      subEn:   'APA + ABA + CBT',
      subFr:   'APA + ABA + TCC',
      color:   'text-purple-400',
    },
    {
      value: s.sessionMinutes,
      unit:    'min',
      label:   'جلسة تفاعلية مباشرة',
      labelEn: 'Live Interactive Session',
      labelFr: 'Séance interactive en direct',
      sub:     'حركة + سلوك + معرفة',
      subEn:   'Movement + Behavior + Cognition',
      subFr:   'Mouvement + comportement + cognition',
      color:   'text-amber-400',
    },
  ]

  return (
    <section className="bg-[#FFF8F0] py-14" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label}
              className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-6 text-center hover:-translate-y-1 transition-all">
              <div className={`text-4xl font-black mb-1 ${stat.color} flex items-end justify-center gap-1`} dir="ltr">
                <span className="ltr-num">{stat.value}</span>
                {'unit' in stat && stat.unit && (
                  <span className="text-base font-bold mb-0.5 opacity-80">
                    {pickLang(lang, 'دق', stat.unit, 'min')}
                  </span>
                )}
              </div>
              <div className="text-gray-800 font-bold text-sm mb-0.5">
                {pickLang(lang, stat.label, stat.labelEn, stat.labelFr)}
              </div>
              <div className="text-gray-500 text-xs">
                {pickLang(lang, stat.sub, stat.subEn, stat.subFr)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
