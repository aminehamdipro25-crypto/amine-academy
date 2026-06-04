import Link from 'next/link'
import { ArrowLeft, MessageCircle, Play } from 'lucide-react'

export default function CTASection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '21600000000'

  return (
    <section className="py-20 bg-gradient-to-br from-brand-900 to-brand-950">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="text-5xl mb-6">🌟</div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
          ابدأ رحلة طفلك اليوم
        </h2>
        <p className="text-white/70 text-lg leading-relaxed mb-10">
          كل يوم تأخير هو يوم ضائع من التطور. انضم لأكثر من 200 عائلة تثق في أكاديمية أمين.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/register"
            className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-black/20">
            سجّل الآن مجاناً
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('مرحباً، أريد معرفة المزيد عن أكاديمية أمين')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-2xl transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
            تواصل عبر واتساب
          </a>
        </div>
        <Link href="/demo"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 text-sm font-medium transition-colors">
          <Play className="w-4 h-4" />
          أو شاهد جولة تجريبية للمنصة أولاً
        </Link>
      </div>
    </section>
  )
}
