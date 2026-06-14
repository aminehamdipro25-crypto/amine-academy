'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Star, Users, Award, Play, LayoutDashboard, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, tr } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'

const DEFAULT_OFFER_DAYS = 5
const LS_KEY = 'aa_offer_expiry'
const LS_DURATION_KEY = 'aa_offer_duration'

function useCountdown(offerDays: number) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const durationMs = offerDays * 24 * 60 * 60 * 1000
    const storedDuration = parseInt(localStorage.getItem(LS_DURATION_KEY) || '0', 10)
    let expiry = parseInt(localStorage.getItem(LS_KEY) || '0', 10)
    if (!expiry || expiry < Date.now() || storedDuration !== durationMs) {
      expiry = Date.now() + durationMs
      localStorage.setItem(LS_KEY, String(expiry))
      localStorage.setItem(LS_DURATION_KEY, String(durationMs))
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
  }, [offerDays])

  if (!mounted) return null
  return time
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 min-w-[3rem] text-center">
        <span className="text-white font-black text-2xl ltr-num">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-white/60 text-xs mt-1">{label}</span>
    </div>
  )
}

function GameVisual() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow behind card */}
      <div className="absolute w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />

      {/* Main game card */}
      <div className="relative w-72 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-2xl shadow-black/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-white/60 text-xs font-bold">جلسة اليوم</span>
          <span className="bg-green-400/20 text-green-300 text-xs font-black px-2 py-0.5 rounded-full border border-green-400/30">
            ● مباشر
          </span>
        </div>

        {/* Game character */}
        <div className="text-center mb-5">
          <div className="text-7xl leading-none">🧩</div>
          <p className="text-white font-black text-lg mt-2">ذاكرة N-Back</p>
          <p className="text-white/60 text-xs">تمرين الذاكرة العاملة</p>
        </div>

        {/* Progress */}
        <div className="bg-white/10 rounded-2xl p-4 mb-4">
          <div className="flex justify-between text-white text-sm mb-2">
            <span className="text-white/70">التقدم</span>
            <span className="font-black">78%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-xl">⚡</div>
            <div className="text-white/60 text-[10px] mt-0.5">سريع</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-white font-black text-lg ltr-num">240</div>
            <div className="text-white/60 text-[10px]">نقطة</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-xl">🔥</div>
            <div className="text-white/60 text-[10px]">5 أيام</div>
          </div>
        </div>
      </div>

      {/* Floating achievement badge — top right */}
      <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 animate-[bounce_3s_ease-in-out_infinite]">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-[11px] font-black text-gray-800 leading-none">إنجاز جديد!</p>
          <p className="text-[10px] text-gray-400 mt-0.5">بطل التركيز</p>
        </div>
      </div>

      {/* Floating score — bottom left */}
      <div className="absolute -bottom-3 -left-3 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        <div>
          <p className="text-[11px] font-black text-gray-800 leading-none">تقدم رائع</p>
          <p className="text-[10px] text-green-600 font-bold mt-0.5">+50 نقطة</p>
        </div>
      </div>

      {/* Floating dots */}
      <div className="absolute top-1/3 -left-6 flex flex-col gap-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full ${i === 1 ? 'bg-brand-400 scale-125' : 'bg-brand-300'} opacity-70`} />
        ))}
      </div>
    </div>
  )
}

export default function HeroSection() {
  const [offerDays, setOfferDays] = useState(DEFAULT_OFFER_DAYS)
  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then(d => { if (d?.offerDurationDays) setOfferDays(d.offerDurationDays) })
      .catch(() => {})
  }, [])
  const time = useCountdown(offerDays)
  const { lang } = useLang()
  const t = tr[lang]
  const isAr = lang === 'ar'

  return (
    <section
      className={`relative min-h-screen overflow-hidden ${isAr ? 'direction-rtl' : 'direction-ltr'}`}
      style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #4A2FA3 50%, #7C5CFC 100%)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-brand-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-orange-500/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-teal-400/30 rounded-full blur-3xl" />
        {/* Dot grid — decorative */}
        <div className={`absolute top-32 ${isAr ? 'left-24' : 'right-24'} hidden lg:grid grid-cols-5 gap-3 opacity-[0.08]`}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full" />
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
            A
          </div>
          <div>
            <span className="text-white font-black text-lg block leading-none">
              {isAr ? 'أكاديمية أمين' : 'Amine Academy'}
            </span>
            <span className="text-white/50 text-xs">ADHD & Autism Academy</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/demo"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            {t.nav.trial}
          </Link>
          <Link href="/parent/login"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            {t.nav.parents}
          </Link>
          <Link href="/register"
            className="bg-white text-brand-700 hover:bg-brand-50 font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg">
            {t.nav.register}
          </Link>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold text-xs px-3 py-2 rounded-xl transition-all">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Link>
          <LangToggle />
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[82vh]">

          {/* ── Text Column ── */}
          <div className={isAr ? 'order-1' : 'order-2'}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span className="text-white text-sm font-bold">{t.hero.badge}</span>
            </div>

            {/* Floating info badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['100+ طفل', 'ADHD & Autism', 'Qatar & Tunisia'].map(badge => (
                <span key={badge}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-white text-sm font-medium">
                  {badge}
                </span>
              ))}
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              {t.hero.h1a}
              <span className="block text-white/90 mt-1">
                {t.hero.h1b}
              </span>
              <span className="block text-2xl md:text-3xl mt-3 text-white/60 font-bold">
                {t.hero.h1c}
              </span>
            </h1>

            <p className="text-white/80 text-lg leading-relaxed mb-3 max-w-lg">
              {t.hero.desc}
            </p>
            <p className="text-white/50 text-sm mb-8">{t.hero.ages}</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Link href="/register"
                className="flex items-center gap-2 bg-white text-brand-700 font-black text-lg px-8 py-4 rounded-2xl hover:-translate-y-1 shadow-xl transition-all active:scale-95">
                {t.hero.cta1}
                {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </Link>
              <Link href="/demo"
                className="flex items-center gap-2 bg-white/10 border border-white/30 text-white hover:bg-white/20 font-bold text-lg px-8 py-4 rounded-2xl transition-all">
                <Play className="w-5 h-5 fill-current text-white/70" />
                {t.hero.cta2}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-2 flex-wrap mb-8">
              {['APA Certified', 'ABA Protocol', 'CBT for Children', 'PEERS Protocol'].map(b => (
                <span key={b}
                  className="text-white/60 text-xs font-bold border border-white/20 bg-white/5 px-3 py-1 rounded-full">
                  ✓ {b}
                </span>
              ))}
            </div>

            {/* Countdown */}
            {time && !time.expired && (
              <div className="inline-flex flex-col items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-8 py-4 mb-8">
                <p className="text-white/60 text-sm font-medium">{t.hero.offerLabel}</p>
                <div className="flex items-center gap-3" dir="ltr">
                  <CountdownUnit value={time.d} label={t.hero.units.d} />
                  <span className="text-white/30 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.h} label={t.hero.units.h} />
                  <span className="text-white/30 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.m} label={t.hero.units.m} />
                  <span className="text-white/30 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.s} label={t.hero.units.s} />
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm pt-8 border-t border-white/10">
              {[
                { icon: Users, value: '+200', label: t.hero.stats.children, color: 'text-brand-300' },
                { icon: Award, value: '+5',   label: t.hero.stats.years,    color: 'text-purple-300' },
                { icon: Star,  value: '98%',  label: t.hero.stats.satisfaction, color: 'text-amber-400' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <div className="text-white font-black text-2xl ltr-num">{value}</div>
                  <div className="text-white/50 text-xs mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Visual Column ── */}
          <div className={`${isAr ? 'order-2' : 'order-1'} flex items-center justify-center py-12 lg:py-0`}>
            <GameVisual />
          </div>

        </div>
      </div>
    </section>
  )
}
