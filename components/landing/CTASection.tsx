'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircle, Play } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

export default function CTASection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '21600000000'
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const waMessage = pickLang(
    lang,
    'مرحباً، أريد معرفة المزيد عن أكاديمية أمين',
    'Hello, I would like to learn more about Amine Academy',
    "Bonjour, je souhaite en savoir plus sur Amine Academy"
  )

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className=""
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 40%, rgba(107,70,240,0.07) 0%, transparent 65%),
          #FFF8F0
        `,
        padding: '100px 0',
      }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <span
          className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(107,70,240,0.08)',
            border: '1px solid rgba(107,70,240,0.15)',
            color: '#6B46F0',
          }}
        >
          {pickLang(lang, 'ابدأ رحلة طفلك اليوم', "Start Your Child's Journey Today", "Commencez dès aujourd'hui")}
        </span>

        {/* Heading */}
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          <span style={{ color: '#1E293B' }}>
            {pickLang(lang, 'كل يوم تأخير هو', 'Every Day of Delay Is', 'Chaque jour de retard est')}
          </span>
          <br />
          <span style={{ color: '#6B46F0' }}>
            {pickLang(lang, 'يوم ضائع من التطور', 'A Lost Day of Progress', 'Un jour de progrès perdu')}
          </span>
        </h2>

        <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748B' }}>
          {pickLang(
            lang,
            'انضم لأكثر من 200 عائلة تثق في أكاديمية أمين. ابدأ بجلسة تقييمية مجانية — بدون أي التزام.',
            'Join over 200 families who trust Amine Academy. Start with a free assessment session — no commitment required.',
            'Rejoignez plus de 200 familles qui font confiance à Amine Academy. Commencez par une séance d\'évaluation gratuite — sans engagement.'
          )}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/register"
            className="flex items-center gap-2 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              background: '#6B46F0',
              color: 'white',
              boxShadow: '0 8px 32px rgba(107,70,240,0.28)',
            }}
          >
            {pickLang(lang, 'سجّل الآن مجاناً', 'Register Now for Free', "Inscrivez-vous gratuitement")}
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(waMessage)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-2xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(107,70,240,0.15)',
              color: '#374151',
            }}
          >
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            {pickLang(lang, 'تواصل عبر واتساب', 'Contact via WhatsApp', 'Contactez-nous sur WhatsApp')}
          </a>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-600"
          style={{ color: '#94A3B8' }}
        >
          <Play className="w-4 h-4" />
          {pickLang(lang, 'أو شاهد جولة تجريبية للمنصة أولاً', 'Or watch a demo tour of the platform first', "Ou découvrez d'abord une visite guidée de la plateforme")}
        </Link>
      </div>
    </section>
  )
}
