const stats = [
  { value: '+200', label: 'طفل مستفيد من برامجنا', color: 'text-brand-600' },
  { value: '3', label: 'فئات عمرية متخصصة', color: 'text-calm-teal' },
  { value: '+50', label: 'تمريناً معدلاً مصنّفاً', color: 'text-purple-600' },
  { value: '98%', label: 'رضا أولياء الأمور', color: 'text-green-600' },
]

export default function StatsSection() {
  return (
    <section className="bg-brand-950 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <div className={`text-4xl font-black ltr-num mb-2 ${color}`}>{value}</div>
              <div className="text-white/60 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
