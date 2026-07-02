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
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 90% 70% at 50% 50%, rgba(124,92,252,0.12) 0%, rgba(99,102,241,0.06) 40%, transparent 70%),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(59,130,246,0.07) 0%, transparent 60%),
          linear-gradient(150deg, #F0EEFF 0%, #EEF3FF 50%, #F0EEFF 100%)
        `,
        padding: '100px 0',
      }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(124,92,252,0.1) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <span
          className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.18)',
            color: '#6D44E8',
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
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
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
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: 'white',
              boxShadow: '0 8px 40px rgba(99,102,241,0.3)',
            }}
          >
            {pickLang(lang, 'سجّل الآن مجاناً', 'Register Now for Free', "Inscrivez-vous gratuitement")}
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(waMessage)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:bg-indigo-50"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid rgba(124,92,252,0.2)',
              color: '#374151',
            }}
          >
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            {pickLang(lang, 'تواصل عبر واتساب', 'Contact via WhatsApp', 'Contactez-nous sur WhatsApp')}
          </a>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-indigo-600"
          style={{ color: '#94A3B8' }}
        >
          <Play className="w-4 h-4" />
          {pickLang(lang, 'أو شاهد جولة تجريبية للمنصة أولاً', 'Or watch a demo tour of the platform first', "Ou découvrez d'abord une visite guidée de la plateforme")}
        </Link>
      </div>
    </section>
  )
}
