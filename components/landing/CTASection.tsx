'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircle, Play } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export default function CTASection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '21600000000'
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const waMessage = isAr
    ? 'مرحباً، أريد معرفة المزيد عن أكاديمية أمين'
    : 'Hello, I would like to learn more about Amine Academy'

  return (
    <section className="py-20 bg-gradient-to-br from-brand-900 to-brand-950" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="text-5xl mb-6">🌟</div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
          {isAr ? 'ابدأ رحلة طفلك اليوم' : "Start Your Child's Journey Today"}
        </h2>
        <p className="text-white/70 text-lg leading-relaxed mb-10">
          {isAr
            ? 'كل يوم تأخير هو يوم ضائع من التطور. انضم لأكثر من 200 عائلة تثق في أكاديمية أمين.'
            : 'Every day of delay is a lost day of development. Join over 200 families who trust Amine Academy.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/register"
            className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-black/20">
            {isAr ? 'سجّل الآن مجاناً' : 'Register Now for Free'}
            {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(waMessage)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-2xl transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
            {isAr ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
          </a>
        </div>
        <Link href="/demo"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 text-sm font-medium transition-colors">
          <Play className="w-4 h-4" />
          {isAr ? 'أو شاهد جولة تجريبية للمنصة أولاً' : 'Or watch a demo tour of the platform first'}
        </Link>
      </div>
    </section>
  )
}
