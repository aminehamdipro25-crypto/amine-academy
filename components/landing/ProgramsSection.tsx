const programs = [
  {
    age: '5 - 11 سنة',
    emoji: '🧸',
    color: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    exercises: ['مشية الحيوانات', 'تمارين التوازن', 'تنفس الفقاعات', 'ألعاب الحركة الحسية'],
    objective: 'بناء الأسس الحركية والتنظيم الحسي',
    diagnosis: 'ADHD & Autism',
  },
  {
    age: '12 - 17 سنة',
    emoji: '🎯',
    color: 'from-brand-500 to-brand-700',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    exercises: ['تمارين الإيقاع والتنسيق', 'الاسترخاء العضلي التدريجي', 'تمارين التركيز المعزز', 'الرياضة الجماعية المعدلة'],
    objective: 'تطوير الوظيفة التنفيذية والضبط الذاتي',
    diagnosis: 'ADHD & Autism',
  },
  {
    age: '18 - 22 سنة',
    emoji: '💪',
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    exercises: ['دائرة القوة اليقظة', 'تمارين التنفس المتقدمة', 'اليوغا المعدلة', 'لعبة الحركة الاجتماعية'],
    objective: 'الاستقلالية والتكيف في الحياة اليومية',
    diagnosis: 'ADHD & Autism',
  },
]

export default function ProgramsSection() {
  return (
    <section className="py-20 bg-gray-50" id="programs">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            البرامج التخصصية
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            برنامج مخصص لكل مرحلة عمرية
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            كل فئة عمرية تحتاج نهجاً مختلفاً — نحن نصمم البرنامج المناسب لطفلك تحديداً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((prog) => (
            <div key={prog.age}
              className={`card-hover rounded-2xl border overflow-hidden ${prog.bg} ${prog.border}`}>
              {/* Header */}
              <div className={`bg-gradient-to-l ${prog.color} p-6 text-white`}>
                <div className="text-4xl mb-3">{prog.emoji}</div>
                <div className="font-black text-xl ltr-num">{prog.age}</div>
                <div className="text-white/80 text-sm mt-1">{prog.objective}</div>
              </div>
              {/* Body */}
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">التمارين المتضمنة</span>
                  <ul className="mt-3 space-y-2">
                    {prog.exercises.map(ex => (
                      <li key={ex} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-500">مناسب لـ: </span>
                  <span className="text-xs text-gray-600">{prog.diagnosis}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
