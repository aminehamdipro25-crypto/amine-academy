'use client'
import { Star } from 'lucide-react'
import { useLang } from '@/lib/i18n'

const testimonials = [
  {
    name: 'أم سارة',
    nameEn: 'Sara\'s Mom',
    role: 'ولية أمر — طفلة 8 سنوات (ADHD)',
    roleEn: 'Parent — 8-year-old girl (ADHD)',
    text: 'بعد شهرين فقط، لاحظت تحسناً واضحاً في قدرة ابنتي على الجلوس والتركيز. البرنامج غيّر حياتنا اليومية.',
    textEn: "After just two months, I noticed a clear improvement in my daughter's ability to sit still and focus. The program has truly transformed our daily life.",
    stars: 5,
    country: '🇹🇳',
  },
  {
    name: 'أبو خالد',
    nameEn: "Khalid's Dad",
    role: 'ولي أمر — طفل 12 سنة (Autism)',
    roleEn: 'Parent — 12-year-old boy (Autism)',
    text: 'كنت متشككاً في البداية، لكن نتائج الثلاثة أشهر الأولى أذهلتني. تمارين التنسيق الحركي أحدثت فارقاً حقيقياً.',
    textEn: "I was skeptical at first, but the results after the first three months were astounding. The motor coordination exercises have made a real difference.",
    stars: 5,
    country: '🇸🇦',
  },
  {
    name: 'مريم',
    nameEn: 'Maryam',
    role: 'أم — شاب 19 سنة (ADHD+Autism)',
    roleEn: 'Mother — 19-year-old young man (ADHD+Autism)',
    text: 'الأستاذ أمين يفهم ما يحتاجه ابني بالضبط. الجلسات الأسبوعية والتمارين المخصصة أعادت ثقته بنفسه.',
    textEn: "Prof. Amine understands exactly what my son needs. The weekly sessions and personalized exercises have restored his self-confidence.",
    stars: 5,
    country: '🇲🇦',
  },
]

export default function TestimonialsSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <section className="py-20 bg-[#FFF8F0]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            {isAr ? 'قصص نجاح' : 'Success Stories'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            {isAr ? 'ماذا يقول أولياء الأمور؟' : 'What Do Parents Say?'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, nameEn, role, roleEn, text, textEn, stars, country }) => (
            <div key={name}
              className="bg-white rounded-3xl border border-[#F0E8FF] shadow-card p-6 hover:-translate-y-1 transition-all">
              {/* Large quote mark */}
              <div className="text-brand-200 font-black text-6xl leading-none mb-2 select-none">&ldquo;</div>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">{isAr ? text : textEn}</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-2xl flex items-center justify-center flex-shrink-0">
                  {(isAr ? name : nameEn)[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                    {isAr ? name : nameEn} <span>{country}</span>
                  </div>
                  <div className="text-gray-500 text-xs">{isAr ? role : roleEn}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
