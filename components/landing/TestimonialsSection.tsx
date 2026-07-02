'use client'
import { Star } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

const testimonials = [
  {
    name: 'أم سارة',
    nameEn: "Sara's Mom",
    nameFr: 'La maman de Sara',
    role: 'ولية أمر — طفلة 8 سنوات (ADHD)',
    roleEn: 'Parent — 8-year-old girl (ADHD)',
    roleFr: 'Parent — fillette de 8 ans (TDAH)',
    text: 'بعد شهرين فقط، لاحظت تحسناً واضحاً في قدرة ابنتي على الجلوس والتركيز. البرنامج غيّر حياتنا اليومية.',
    textEn: "After just two months, I noticed a clear improvement in my daughter's ability to sit still and focus. The program has truly transformed our daily life.",
    textFr: "Après seulement deux mois, j'ai constaté une amélioration nette dans la capacité de ma fille à rester assise et à se concentrer. Le programme a vraiment transformé notre quotidien.",
    stars: 5,
    country: '🇹🇳',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  },
  {
    name: 'أبو خالد',
    nameEn: "Khalid's Dad",
    nameFr: 'Le papa de Khalid',
    role: 'ولي أمر — طفل 12 سنة (Autism)',
    roleEn: 'Parent — 12-year-old boy (Autism)',
    roleFr: 'Parent — garçon de 12 ans (Autisme)',
    text: 'كنت متشككاً في البداية، لكن نتائج الثلاثة أشهر الأولى أذهلتني. تمارين التنسيق الحركي أحدثت فارقاً حقيقياً.',
    textEn: "I was skeptical at first, but the results after the first three months were astounding. The motor coordination exercises have made a real difference.",
    textFr: "J'étais sceptique au début, mais les résultats des trois premiers mois m'ont impressionné. Les exercices de coordination motrice ont vraiment fait la différence.",
    stars: 5,
    country: '🇸🇦',
    gradient: 'linear-gradient(135deg, #14B8A6, #6366F1)',
  },
  {
    name: 'مريم',
    nameEn: 'Maryam',
    nameFr: 'Maryam',
    role: 'أم — شاب 19 سنة (ADHD+Autism)',
    roleEn: 'Mother — 19-year-old young man (ADHD+Autism)',
    roleFr: 'Mère — jeune homme de 19 ans (TDAH+Autisme)',
    text: 'الأستاذ أمين يفهم ما يحتاجه ابني بالضبط. الجلسات الأسبوعية والتمارين المخصصة أعادت ثقته بنفسه.',
    textEn: "Prof. Amine understands exactly what my son needs. The weekly sessions and personalized exercises have restored his self-confidence.",
    textFr: "Le professeur Amine comprend exactement ce dont mon fils a besoin. Les séances hebdomadaires et les exercices personnalisés lui ont redonné confiance en lui.",
    stars: 5,
    country: '🇲🇦',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  },
]

export default function TestimonialsSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 60% 45% at 50% 0%, rgba(168,85,247,0.07) 0%, transparent 60%),
          linear-gradient(180deg, #F4F0FF 0%, #F8F6FF 100%)
        `,
        padding: '80px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="font-bold text-sm px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.16)', color: '#6D44E8' }}
          >
            {pickLang(lang, 'قصص نجاح', 'Success Stories', 'Témoignages')}
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mt-4 mb-4"
            style={{ color: '#1E293B' }}
          >
            {pickLang(lang, 'ماذا يقول أولياء الأمور؟', 'What Do Parents Say?', 'Que disent les parents ?')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, nameEn, nameFr, role, roleEn, roleFr, text, textEn, textFr, stars, country, gradient }) => (
            <div
              key={name}
              className="rounded-3xl p-6 transition-all hover:-translate-y-1 flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1.5px solid rgba(124,92,252,0.12)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(124,92,252,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: '#475569' }}>
                {pickLang(lang, text, textEn, textFr)}
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0"
                  style={{ background: gradient }}
                >
                  {pickLang(lang, name, nameEn, nameFr)[0]}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: '#1E293B' }}>
                    {pickLang(lang, name, nameEn, nameFr)}
                    <span>{country}</span>
                  </div>
                  <div className="text-xs" style={{ color: '#94A3B8' }}>{pickLang(lang, role, roleEn, roleFr)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
