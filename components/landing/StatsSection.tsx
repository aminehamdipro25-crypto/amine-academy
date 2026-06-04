const stats = [
  { value: '+200', label: 'طفل مستفيد من برامجنا', sub: 'قطر وتونس والعالم العربي', color: 'text-brand-400' },
  { value: '98%', label: 'رضا أولياء الأمور', sub: 'بعد 3 أشهر من البرنامج', color: 'text-calm-teal' },
  { value: '+25', label: 'بروتوكولاً علمياً', sub: 'APA + ABA + CBT', color: 'text-purple-400' },
  { value: '45 د', label: 'جلسة تفاعلية مباشرة', sub: 'حركة + سلوك + معرفة', color: 'text-amber-400' },
]

export default function StatsSection() {
  return (
    <section className="bg-brand-950 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label, sub, color }) => (
            <div key={label} className="text-center">
              <div className={`text-4xl font-black ltr-num mb-1 ${color}`}>{value}</div>
              <div className="text-white font-bold text-sm mb-0.5">{label}</div>
              <div className="text-white/40 text-xs">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
