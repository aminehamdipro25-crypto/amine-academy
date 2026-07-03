'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
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

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export default function StatsSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const [s, setS] = useState<DynStats>(DEFAULTS)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

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
      style={{
        background: `
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(107,70,240,0.06) 0%, transparent 65%),
          #FFF8F0
        `,
        padding: '56px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Invisible anchor for useInView */}
        <div ref={ref} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="rounded-3xl p-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: EASE }}
              whileHover={{ y: -2 }}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
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
              <div className="font-bold text-sm mb-0.5" style={{ color: '#374151' }}>
                {pickLang(lang, stat.label, stat.labelEn, stat.labelFr)}
              </div>
              <div className="text-xs" style={{ color: '#9CA3AF' }}>
                {pickLang(lang, stat.sub, stat.subEn, stat.subFr)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
