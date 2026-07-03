'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircle, Play } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLang, pickLang } from '@/lib/i18n'

export default function CTASection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '21600000000'
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const waMessage = pickLang(
    lang,
    'مرحباً، أريد معرفة المزيد عن أكاديمية أمين',
    'Hello, I would like to learn more about Amine Academy',
    "Bonjour, je souhaite en savoir plus sur Amine Academy"
  )

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: '#1E293B',
        padding: '100px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle brand glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(107,70,240,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dot texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        ref={ref}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Badge */}
        <span
          className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(107,70,240,0.25)',
            border: '1px solid rgba(107,70,240,0.4)',
            color: '#B99AFF',
          }}
        >
          {pickLang(lang, 'ابدأ رحلة طفلك اليوم', "Start Your Child's Journey Today", "Commencez dès aujourd'hui")}
        </span>

        {/* Heading */}
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          <span style={{ color: 'rgba(255,255,255,0.9)' }}>
            {pickLang(lang, 'كل يوم تأخير هو', 'Every Day of Delay Is', 'Chaque jour de retard est')}
          </span>
          <br />
          <span style={{ color: '#B99AFF' }}>
            {pickLang(lang, 'يوم ضائع من التطور', 'A Lost Day of Progress', 'Un jour de progrès perdu')}
          </span>
        </h2>

        <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {pickLang(
            lang,
            'انضم لأكثر من 200 عائلة تثق في أكاديمية أمين. ابدأ بجلسة تقييمية مجانية — بدون أي التزام.',
            'Join over 200 families who trust Amine Academy. Start with a free assessment session — no commitment required.',
            "Rejoignez plus de 200 familles qui font confiance à Amine Academy. Commencez par une séance d'évaluation gratuite — sans engagement."
          )}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/register"
              className="flex items-center gap-2 font-black text-lg px-8 py-4 rounded-2xl transition-colors"
              style={{
                background: '#6B46F0',
                color: 'white',
                boxShadow: '0 8px 40px rgba(107,70,240,0.45)',
              }}
            >
              {pickLang(lang, 'سجّل الآن مجاناً', 'Register Now for Free', "Inscrivez-vous gratuitement")}
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }}>
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(waMessage)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-2xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              {pickLang(lang, 'تواصل عبر واتساب', 'Contact via WhatsApp', 'Contactez-nous sur WhatsApp')}
            </a>
          </motion.div>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <Play className="w-4 h-4" />
          {pickLang(lang, 'أو شاهد جولة تجريبية للمنصة أولاً', 'Or watch a demo tour of the platform first', "Ou découvrez d'abord une visite guidée de la plateforme")}
        </Link>
      </motion.div>
    </section>
  )
}
