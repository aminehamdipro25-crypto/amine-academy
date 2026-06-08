'use client'
import { useLang } from '@/lib/i18n'

const stats = [
  {
    value: '+200',
    label:   'طفل مستفيد من برامجنا',
    labelEn: 'Children in Program',
    sub:     'قطر وتونس والعالم العربي',
    subEn:   'Qatar, Tunisia & Arab World',
    color:   'text-brand-400',
  },
  {
    value: '98%',
    label:   'رضا أولياء الأمور',
    labelEn: 'Parent Satisfaction',
    sub:     'بعد 3 أشهر من البرنامج',
    subEn:   'After 3 months',
    color:   'text-calm-teal',
  },
  {
    value: '+25',
    label:   'بروتوكولاً علمياً',
    labelEn: 'Scientific Protocols',
    sub:     'APA + ABA + CBT',
    subEn:   'APA + ABA + CBT',
    color:   'text-purple-400',
  },
  {
    value: '45',
    unit:    'min',
    label:   'جلسة تفاعلية مباشرة',
    labelEn: 'Live Interactive Session',
    sub:     'حركة + سلوك + معرفة',
    subEn:   'Movement + Behavior + Cognition',
    color:   'text-amber-400',
  },
]

export default function StatsSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <section className="bg-brand-950 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-4xl font-black ltr-num mb-1 ${s.color} flex items-end justify-center gap-1`}>
                {s.value}
                {s.unit && (
                  <span className="text-base font-bold mb-0.5 opacity-80">
                    {isAr ? 'دقيقة' : s.unit}
                  </span>
                )}
              </div>
              <div className="text-white font-bold text-sm mb-0.5">
                {isAr ? s.label : s.labelEn}
              </div>
              <div className="text-white/40 text-xs">
                {isAr ? s.sub : s.subEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
