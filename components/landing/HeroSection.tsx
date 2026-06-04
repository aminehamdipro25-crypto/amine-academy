'use client'
import Link from 'next/link'
import { ArrowLeft, Star, Users, Award, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

// Countdown Timer — شخصي لكل زائر (localStorage)
const OFFER_DURATION = 5 * 24 * 60 * 60 * 1000
const LS_KEY = 'aa_offer_expiry'

function useCountdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let expiry = parseInt(localStorage.getItem(LS_KEY) || '0', 10)
    if (!expiry || expiry < Date.now()) {
      expiry = Date.now() + OFFER_DURATION
      localStorage.setItem(LS_KEY, String(expiry))
    }
    const tick = () => {
      const diff = expiry - Date.now()
      if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0, expired: true }); return }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) return null
  return time
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 min-w-[3rem] text-center">
        <span className="text-white font-black text-2xl ltr-num">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-white/70 text-xs mt-1">{label}</span>
    </div>
  )
}

export default function HeroSection() {
  const time = useCountdown()

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 overflow-hidden">
      {/* Background decorative elements — calm, non-distracting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-calm-teal/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-calm-lavender/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
            A
          </div>
          <div>
            <span className="text-white font-black text-lg block leading-none">أكاديمية أمين</span>
            <span className="text-white/60 text-xs">ADHD & Autism Academy</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/parent/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            بوابة الأولياء
          </Link>
          <Link href="/register"
            className="bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
            سجّل الآن
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-8">
          <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
          <span className="text-white/90 text-sm font-medium">منصة عالمية معتمدة للرياضة المعدلة وعلم النفس</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
          طفلك يفكّر
          <span className="block text-transparent bg-clip-text bg-gradient-to-l from-calm-teal to-calm-lavender">
            بطريقة مختلفة
          </span>
          <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-white/80 font-bold">
            ونحن نتحدّث لغته
          </span>
        </h1>

        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
          المنصة العربية الأولى التي تجمع
          <strong className="text-white"> الرياضة المعدّلة (APA) + تعديل السلوك (ABA) + التدريب المعرفي (CBT)</strong>
          {' '}في جلسات تفاعلية مباشرة لأطفال ADHD وطيف التوحد.
        </p>
        <p className="text-white/50 text-sm mb-10">
          للأعمار 5 – 22 سنة • قطر 🇶🇦 وتونس 🇹🇳 والعالم العربي
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link href="/register"
            className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-black/30">
            احجز الجلسة التقييمية المجانية
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="#how-it-works"
            className="flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-2xl transition-colors">
            <Play className="w-5 h-5" />
            شاهد كيف تعمل الجلسة
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 flex-wrap mb-10">
          {['APA معتمد', 'ABA بروتوكول', 'CBT للأطفال', 'PEERS Protocol'].map(b => (
            <span key={b} className="text-white/50 text-xs font-bold border border-white/20 px-3 py-1 rounded-full">
              ✓ {b}
            </span>
          ))}
        </div>

        {/* Countdown timer */}
        {time && !time.expired && (
          <div className="inline-flex flex-col items-center gap-4 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-8 py-5">
            <p className="text-white/80 text-sm font-medium">⏰ عرض التسجيل المبكر ينتهي خلال</p>
            <div className="flex items-center gap-3">
              <CountdownUnit value={time.d} label="يوم" />
              <span className="text-white/60 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.h} label="ساعة" />
              <span className="text-white/60 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.m} label="دقيقة" />
              <span className="text-white/60 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.s} label="ثانية" />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-4 pt-10 border-t border-white/10">
          {[
            { icon: Users, value: '+200', label: 'طفل في البرنامج' },
            { icon: Award, value: '+5',   label: 'سنوات خبرة متخصصة' },
            { icon: Star,  value: '98%',  label: 'رضا أولياء الأمور' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="w-6 h-6 text-calm-teal mx-auto mb-2" />
              <div className="text-white font-black text-2xl ltr-num">{value}</div>
              <div className="text-white/60 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
