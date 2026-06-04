import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'أم سارة',
    role: 'ولية أمر — طفلة 8 سنوات (ADHD)',
    text: 'بعد شهرين فقط، لاحظت تحسناً واضحاً في قدرة ابنتي على الجلوس والتركيز. البرنامج غيّر حياتنا اليومية.',
    stars: 5,
    country: '🇹🇳',
  },
  {
    name: 'أبو خالد',
    role: 'ولي أمر — طفل 12 سنة (Autism)',
    text: 'كنت متشككاً في البداية، لكن نتائج الثلاثة أشهر الأولى أذهلتني. تمارين التنسيق الحركي أحدثت فارقاً حقيقياً.',
    stars: 5,
    country: '🇸🇦',
  },
  {
    name: 'مريم',
    role: 'أم — شاب 19 سنة (ADHD+Autism)',
    text: 'البروفيسور أمين يفهم ما يحتاجه ابني بالضبط. الجلسات الأسبوعية والتمارين المخصصة أعادت ثقته بنفسه.',
    stars: 5,
    country: '🇲🇦',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            قصص نجاح
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            ماذا يقول أولياء الأمور؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, text, stars, country }) => (
            <div key={name}
              className="card-hover bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-100">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-black">
                  {name[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                    {name} <span>{country}</span>
                  </div>
                  <div className="text-gray-500 text-xs">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
