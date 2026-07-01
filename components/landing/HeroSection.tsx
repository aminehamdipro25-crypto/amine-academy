'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Star, Users, Award, Play, LayoutDashboard, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, tr, pickLang } from '@/lib/i18n'
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
      <div
        className="rounded-xl px-3 py-2 min-w-[3rem] text-center"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }}
      >
        <span className="text-white font-black text-2xl ltr-num">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-white/50 text-xs mt-1">{label}</span>
    </div>
  )
}

function DashboardVisual() {
  const scores = [72, 85, 68, 91, 88, 95, 87]
  const days = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

  return (
    <div className="relative flex items-center justify-center py-8 lg:py-0">
      {/* Ambient glow */}
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
      />

      {/* Main dashboard card */}
      <div
        className="relative w-80 rounded-3xl p-5 shadow-2xl"
        style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-black text-sm">لوحة المتابعة</p>
            <p className="text-white/40 text-xs">التقدم الأسبوعي لطفلك</p>
          </div>
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
            مباشر
          </span>
        </div>

        {/* Bar chart */}
        <div
          className="rounded-2xl p-3 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-end gap-1.5 h-20">
            {scores.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${(score / 100) * 72}px`,
                    background: score >= 85
                      ? 'linear-gradient(to top, #10B981, #6EE7B7)'
                      : 'linear-gradient(to top, #6366F1, #A78BFA)',
                    opacity: score >= 85 ? 1 : 0.65,
                    borderRadius: '3px 3px 0 0',
                  }}
                />
                <span className="text-[9px] text-white/25">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            <div className="font-black text-xl ltr-num" style={{ color: '#A78BFA' }}>+78%</div>
            <div className="text-white/45 text-[10px] mt-0.5">تحسن التركيز</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
          >
            <div className="text-emerald-400 font-black text-xl ltr-num">4/4</div>
            <div className="text-white/45 text-[10px] mt-0.5">جلسات الأسبوع</div>
          </div>
        </div>

        {/* Report notification */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.13)' }}
        >
          <span className="text-base">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 font-black text-xs">التقرير الأسبوعي جاهز</p>
            <p className="text-white/30 text-[10px]">مراجعة التقدم الآن</p>
          </div>
          <span className="text-amber-400 text-xs font-black flex-shrink-0">عرض</span>
        </div>
      </div>

      {/* Floating card — session complete */}
      <div
        className="absolute -top-2 -right-5 rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
        style={{
          background: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">✅</div>
        <div>
          <p className="text-[11px] font-black text-gray-800 leading-none">الجلسة مكتملة</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">أداء ممتاز</p>
        </div>
      </div>

      {/* Floating card — stars earned */}
      <div
        className="absolute -bottom-2 -left-5 rounded-2xl px-3 py-2 flex items-center gap-2.5"
        style={{
          background: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <span className="text-lg">⭐</span>
        <div>
          <p className="text-[11px] font-black text-gray-800 leading-none">نجوم اليوم</p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5 ltr-num">+6 نجوم</p>
        </div>
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
  const isRtl = lang === 'ar'

  return (
    <section
      className={`relative min-h-screen overflow-hidden`}
      style={{ background: 'linear-gradient(150deg, #020817 0%, #030A1C 40%, #07111F 70%, #020817 100%)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            A
          </div>
          <div>
            <span className="text-white font-black text-lg block leading-none">
              {pickLang(lang, 'أكاديمية أمين', 'Amine Academy', 'Amine Academy')}
            </span>
            <span className="text-white/35 text-xs">ADHD & Autism Academy</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/demo"
            className="text-white/55 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            {t.nav.trial}
          </Link>
          <Link href="/parent/login"
            className="text-white/55 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            {t.nav.parents}
          </Link>
          <Link href="/register"
            className="font-black text-sm px-5 py-2.5 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            {t.nav.register}
          </Link>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-white hover:bg-white/10 font-bold text-xs px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pickLang(lang, 'لوحة التحكم', 'Dashboard', 'Tableau de bord')}</span>
          </Link>
          <LangToggle />
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[82vh]">

          {/* Text Column */}
          <div className={isRtl ? 'order-1' : 'order-2'}>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)' }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />
              <span className="text-sm font-bold" style={{ color: '#C4B5FD' }}>{t.hero.badge}</span>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['100+ طفل', 'ADHD & Autism', 'Qatar & Tunisia'].map(badge => (
                <span
                  key={badge}
                  className="text-white/70 text-sm font-medium px-4 py-1.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              {t.hero.h1a}
              <span className="block mt-1" style={{
                background: 'linear-gradient(135deg, #C084FC 0%, #818CF8 50%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {t.hero.h1b}
              </span>
              <span className="block text-2xl md:text-3xl mt-3 text-white/50 font-bold">
                {t.hero.h1c}
              </span>
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-3 max-w-lg">{t.hero.desc}</p>
            <p className="text-white/40 text-sm mb-8">{t.hero.ages}</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Link href="/register"
                className="flex items-center gap-2 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
                }}
              >
                {t.hero.cta1}
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </Link>
              <Link href="/demo"
                className="flex items-center gap-2 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-2xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Play className="w-5 h-5 fill-current text-white/60" />
                {t.hero.cta2}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-2 flex-wrap mb-8">
              {['APA Certified', 'ABA Protocol', 'CBT for Children', 'PEERS Protocol'].map(b => (
                <span
                  key={b}
                  className="text-white/50 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                >
                  ✓ {b}
                </span>
              ))}
            </div>

            {/* Countdown */}
            {time && !time.expired && (
              <div
                className="inline-flex flex-col items-center gap-3 rounded-2xl px-8 py-4 mb-8"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-white/50 text-sm font-medium">{t.hero.offerLabel}</p>
                <div className="flex items-center gap-3" dir="ltr">
                  <CountdownUnit value={time.d} label={t.hero.units.d} />
                  <span className="text-white/20 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.h} label={t.hero.units.h} />
                  <span className="text-white/20 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.m} label={t.hero.units.m} />
                  <span className="text-white/20 text-xl font-black mb-4">:</span>
                  <CountdownUnit value={time.s} label={t.hero.units.s} />
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div
              className="grid grid-cols-3 gap-4 max-w-sm pt-8"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                { icon: Users, value: '+200', label: t.hero.stats.children, gradient: 'from-violet-400 to-indigo-400' },
                { icon: Award, value: '+5',   label: t.hero.stats.years,    gradient: 'from-purple-400 to-violet-400' },
                { icon: Star,  value: '98%',  label: t.hero.stats.satisfaction, gradient: 'from-amber-400 to-orange-400' },
              ].map(({ icon: Icon, value, label, gradient }) => (
                <div key={label} className="text-center">
                  <div
                    className="text-white font-black text-2xl ltr-num mb-1"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                    }}
                  >
                    <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-black text-2xl`}>{value}</span>
                  </div>
                  <div className="text-white/40 text-xs leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Column */}
          <div className={`${isRtl ? 'order-2' : 'order-1'} flex items-center justify-center`}>
            <DashboardVisual />
          </div>

        </div>
      </div>
    </section>
  )
}
