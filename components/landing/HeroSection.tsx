'use client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Star, Users, Award, Play, LayoutDashboard, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, tr, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import AcademyLogo from '@/components/shared/AcademyLogo'

const DEFAULT_OFFER_DAYS = 5
const LS_KEY = 'aa_offer_expiry'
const LS_DURATION_KEY = 'aa_offer_duration'

// ── Countdown ─────────────────────────────────────────────────────────────────
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
        style={{
          background: 'rgba(107,70,240,0.08)',
          border: '1.5px solid rgba(107,70,240,0.15)',
        }}
      >
        <span className="font-black text-2xl ltr-num" style={{ color: '#6B46F0' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-slate-400 text-xs mt-1">{label}</span>
    </div>
  )
}

// ── Dashboard Visual ──────────────────────────────────────────────────────────
function DashboardVisual() {
  const scores = [72, 85, 68, 91, 88, 95, 87]
  const days = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-16">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(107,70,240,0.12) 0%, rgba(42,191,163,0.05) 50%, transparent 80%)' }}
      />

      {/* Main dashboard card */}
      <div
        className="relative rounded-3xl p-6 md:p-8"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-800 font-black text-base">لوحة المتابعة</p>
            <p className="text-slate-400 text-xs mt-0.5">التقدم الأسبوعي لطفلك</p>
          </div>
          <div
            className="text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#059669', border: '1.5px solid rgba(52,211,153,0.25)' }}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
            مباشر
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Bar chart */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(107,70,240,0.04)', border: '1px solid rgba(107,70,240,0.08)' }}
          >
            <p className="text-slate-400 text-xs mb-3">الأداء الأسبوعي</p>
            <div className="flex items-end gap-1.5 h-24">
              {scores.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    style={{
                      height: `${(score / 100) * 88}px`,
                      background: score >= 85
                        ? 'linear-gradient(to top, #10B981, #6EE7B7)'
                        : 'linear-gradient(to top, #7C5CFC, #B99AFF)',
                      opacity: score >= 85 ? 1 : 0.7,
                      borderRadius: '4px 4px 0 0',
                      width: '100%',
                    }}
                  />
                  <span className="text-[9px] text-slate-400">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="flex flex-col gap-3">
            <div
              className="rounded-xl p-3 flex-1"
              style={{ background: 'rgba(107,70,240,0.07)', border: '1px solid rgba(107,70,240,0.14)' }}
            >
              <div className="font-black text-2xl ltr-num" style={{ color: '#6B46F0' }}>+78%</div>
              <div className="text-slate-500 text-xs mt-0.5">تحسن التركيز</div>
            </div>
            <div
              className="rounded-xl p-3 flex-1"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="text-emerald-600 font-black text-2xl ltr-num">4/4</div>
              <div className="text-slate-500 text-xs mt-0.5">جلسات الأسبوع</div>
            </div>
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}
            >
              <span>📋</span>
              <div>
                <p className="text-amber-600 font-black text-xs">التقرير جاهز</p>
                <p className="text-slate-400 text-[10px]">مراجعة الآن</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card — session complete */}
      <div
        className="absolute -top-4 -right-4 md:-right-8 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 z-10"
        style={{
          background: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">✅</div>
        <div>
          <p className="text-[11px] font-black text-slate-800 leading-none">الجلسة مكتملة</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">أداء ممتاز</p>
        </div>
      </div>

      {/* Floating card — stars earned */}
      <div
        className="absolute -bottom-4 -left-4 md:-left-8 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 z-10"
        style={{
          background: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <span className="text-xl">⭐</span>
        <div>
          <p className="text-[11px] font-black text-slate-800 leading-none">نجوم اليوم</p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5 ltr-num">+6 نجوم</p>
        </div>
      </div>
    </div>
  )
}

// ── Hero Section ───────────────────────────────────────────────────────────────
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
      className="relative min-h-[100dvh] overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 100% 55% at 50% -5%, rgba(107,70,240,0.10) 0%, transparent 65%),
          radial-gradient(ellipse 50% 45% at 10% 65%, rgba(42,191,163,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 40% 35% at 50% 110%, rgba(249,115,22,0.05) 0%, transparent 60%),
          #FFF8F0
        `,
      }}
    >
      {/* Soft dot texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(107,70,240,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AcademyLogo size={44} />
          <div>
            <span className="text-slate-900 font-black text-lg block leading-none">
              {pickLang(lang, 'أكاديمية أمين', 'Amine Academy', 'Amine Academy')}
            </span>
            <span className="text-slate-400 text-xs">ADHD & Autism Academy</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors hidden sm:block"
          >
            {t.nav.trial}
          </Link>
          <Link
            href="/parent/login"
            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors hidden sm:block"
          >
            {t.nav.parents}
          </Link>
          <Link
            href="/register"
            className="font-black text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: '#6B46F0',
              boxShadow: '0 4px 20px rgba(107,70,240,0.30)',
            }}
          >
            {t.nav.register}
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-600 font-bold text-xs px-3 py-2 rounded-xl transition-all hover:bg-brand-50"
            style={{ background: 'rgba(107,70,240,0.06)', border: '1px solid rgba(107,70,240,0.12)' }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pickLang(lang, 'لوحة التحكم', 'Dashboard', 'Tableau de bord')}</span>
          </Link>
          <LangToggle />
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-32 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
          style={{
            background: 'rgba(107,70,240,0.08)',
            border: '1.5px solid rgba(107,70,240,0.18)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#6B46F0' }} />
          <span className="text-sm font-bold" style={{ color: '#6B46F0' }}>{t.hero.badge}</span>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['100+ طفل', 'ADHD & Autism', 'Qatar & Tunisia'].map(badge => (
            <span
              key={badge}
              className="text-slate-600 text-sm font-medium px-4 py-1.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(107,70,240,0.12)',
                boxShadow: 'none',
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.1] mb-6 text-slate-900">
          {t.hero.h1a}
          <span
            className="block mt-2"
            style={{
              background: 'linear-gradient(135deg, #7C5CFC 0%, #5B8EFF 40%, #2ABFA3 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t.hero.h1b}
          </span>
          <span className="block text-2xl md:text-3xl mt-4 text-slate-400 font-bold leading-relaxed">
            {t.hero.h1c}
          </span>
        </h1>

        <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-3 max-w-2xl mx-auto">{t.hero.desc}</p>
        <p className="text-slate-400 text-sm mb-10">{t.hero.ages}</p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/register"
            className="flex items-center gap-2 font-black text-lg px-10 py-4 rounded-2xl text-white transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              background: '#6B46F0',
              boxShadow: '0 8px 32px rgba(107,70,240,0.30)',
            }}
          >
            {t.hero.cta1}
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{
              color: '#6B46F0',
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(107,70,240,0.20)',
              boxShadow: '0 4px 16px rgba(107,70,240,0.08)',
            }}
          >
            <Play className="w-5 h-5 fill-current" style={{ color: '#B99AFF' }} />
            {t.hero.cta2}
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-10">
          {['APA Certified', 'ABA Protocol', 'CBT for Children', 'PEERS Protocol'].map(b => (
            <span
              key={b}
              className="text-slate-500 text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(107,70,240,0.10)',
              }}
            >
              ✓ {b}
            </span>
          ))}
        </div>

        {/* Countdown */}
        {time && !time.expired && (
          <div
            className="inline-flex flex-col items-center gap-3 rounded-2xl px-8 py-4 mb-10"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1.5px solid rgba(107,70,240,0.12)',
              boxShadow: '0 4px 24px rgba(107,70,240,0.05)',
            }}
          >
            <p className="text-slate-400 text-sm font-medium">{t.hero.offerLabel}</p>
            <div className="flex items-center gap-3" dir="ltr">
              <CountdownUnit value={time.d} label={t.hero.units.d} />
              <span className="text-slate-300 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.h} label={t.hero.units.h} />
              <span className="text-slate-300 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.m} label={t.hero.units.m} />
              <span className="text-slate-300 text-xl font-black mb-4">:</span>
              <CountdownUnit value={time.s} label={t.hero.units.s} />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div
          className="grid grid-cols-3 gap-6 max-w-sm mx-auto pt-8 mb-16"
          style={{ borderTop: '1.5px solid rgba(107,70,240,0.10)' }}
        >
          {[
            { icon: Users, value: '+200', label: t.hero.stats.children,     gradient: 'from-brand-600 to-brand-400' },
            { icon: Award, value: '+5',   label: t.hero.stats.years,        gradient: 'from-brand-500 to-brand-400' },
            { icon: Star,  value: '98%',  label: t.hero.stats.satisfaction, gradient: 'from-amber-500 to-orange-400' },
          ].map(({ icon: Icon, value, label, gradient }) => (
            <div key={label} className="text-center">
              <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-black text-2xl md:text-3xl`}>{value}</span>
              <div className="text-slate-400 text-xs leading-tight mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Visual */}
        <DashboardVisual />

      </div>
    </section>
  )
}
