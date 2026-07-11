'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Play, LayoutDashboard, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLang, tr, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import AcademyLogo from '@/components/shared/AcademyLogo'
import InstallAppButton from '@/components/InstallAppButton'

type SessionRole = 'owner' | 'staff' | 'parent' | 'student' | null


function DashboardVisual() {
  const scores = [72, 85, 68, 91, 88, 95, 87]
  const days = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

  return (
    <div className="relative w-full">
      <div
        className="absolute -inset-8 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(107,70,240,0.10) 0%, transparent 70%)', filter: 'blur(32px)' }}
      />

      <div
        className="relative rounded-3xl p-6 md:p-7"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 56px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-slate-800 font-black text-base">لوحة المتابعة</p>
            <p className="text-slate-400 text-xs mt-0.5">التقدم الأسبوعي لطفلك</p>
          </div>
          <div
            className="text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ background: 'rgba(52,211,153,0.10)', color: '#059669', border: '1.5px solid rgba(52,211,153,0.25)' }}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
            مباشر
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(107,70,240,0.04)', border: '1px solid rgba(107,70,240,0.08)' }}
          >
            <p className="text-slate-400 text-xs mb-3">الأداء الأسبوعي</p>
            <div className="flex items-end gap-1.5 h-20">
              {scores.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    style={{
                      height: `${(score / 100) * 72}px`,
                      background: score >= 85
                        ? 'linear-gradient(to top, #10B981, #6EE7B7)'
                        : 'linear-gradient(to top, #7C5CFC, #B99AFF)',
                      opacity: score >= 85 ? 1 : 0.65,
                      borderRadius: '4px 4px 0 0',
                      width: '100%',
                    }}
                  />
                  <span className="text-[8px] text-slate-400">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div
              className="rounded-xl p-3 flex-1"
              style={{ background: 'rgba(107,70,240,0.07)', border: '1px solid rgba(107,70,240,0.13)' }}
            >
              <div className="font-black text-xl ltr-num" style={{ color: '#6B46F0' }}>+78%</div>
              <div className="text-slate-500 text-xs mt-0.5">تحسن التركيز</div>
            </div>
            <div
              className="rounded-xl p-3 flex-1"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.14)' }}
            >
              <div className="text-emerald-600 font-black text-xl ltr-num">4/4</div>
              <div className="text-slate-500 text-xs mt-0.5">جلسات الأسبوع</div>
            </div>
            <div
              className="rounded-xl px-3 py-2 flex items-center gap-2"
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

      {/* Floating cards */}
      <div
        className="absolute -top-3 -right-3 md:-right-5 rounded-2xl px-3 py-2.5 flex items-center gap-2 z-10"
        style={{
          background: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">✅</div>
        <div>
          <p className="text-[11px] font-black text-slate-800 leading-none">الجلسة مكتملة</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">أداء ممتاز</p>
        </div>
      </div>

      <div
        className="absolute -bottom-3 -left-3 md:-left-5 rounded-2xl px-3 py-2.5 flex items-center gap-2 z-10"
        style={{
          background: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.05)',
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

export default function HeroSection() {
  const { lang } = useLang()
  const t = tr[lang]
  const isRtl = lang === 'ar'

  // Detect an existing session so returning users get a direct entry button
  // (especially on mobile, where the login links are hidden)
  const [sessionRole, setSessionRole] = useState<SessionRole>(null)
  useEffect(() => {
    fetch('/api/auth/whoami')
      .then(r => r.ok ? r.json() : { role: null })
      .then(d => setSessionRole(d.role ?? null))
      .catch(() => {})
  }, [])

  const portal = sessionRole === 'parent'  ? { href: '/parent/dashboard',  label: pickLang(lang, '👪 لوحتي', '👪 My Portal', '👪 Mon espace') }
              : sessionRole === 'student' ? { href: '/student/dashboard', label: pickLang(lang, '🎮 لوحتي', '🎮 My Space', '🎮 Mon espace') }
              : (sessionRole === 'owner' || sessionRole === 'staff')
                ? { href: '/dashboard', label: pickLang(lang, 'لوحة التحكم', 'Dashboard', 'Tableau de bord') }
                : null

  return (
    <section
      className="relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 90% 70% at 65% 20%, rgba(107,70,240,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 5% 80%, rgba(42,191,163,0.05) 0%, transparent 60%),
          #FFF8F0
        `,
        minHeight: '100dvh',
      }}
    >
      {/* Dot texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(107,70,240,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <AcademyLogo size={36} />
          <div>
            <span className="text-slate-900 font-black text-base sm:text-lg block leading-none">
              {pickLang(lang, 'أكاديمية أمين', 'Amine Academy', 'Amine Academy')}
            </span>
            <span className="text-slate-400 text-[10px] sm:text-xs hidden sm:block">ADHD & Autism Academy</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors hidden sm:block"
          >
            {t.nav.trial}
          </Link>
          {!portal && (
            <Link
              href="/parent/login"
              className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              {pickLang(lang, 'دخول', 'Login', 'Connexion')}
            </Link>
          )}
          {portal ? (
            /* Logged in — one prominent direct-entry button (works on mobile too) */
            <Link
              href={portal.href}
              className="flex items-center gap-1.5 font-black text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#16A34A,#22C55E)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
              }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {portal.label}
            </Link>
          ) : (
            <Link
              href="/register?free=1"
              className="font-black text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
              style={{
                background: '#6B46F0',
                boxShadow: '0 4px 20px rgba(107,70,240,0.30)',
              }}
            >
              {t.nav.register}
            </Link>
          )}
          <div className="hidden sm:block"><LangToggle /></div>
        </div>
      </nav>

      {/* Hero — asymmetric 2-column split */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-16 lg:pt-10 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Content column — RIGHT in RTL, LEFT in LTR */}
        <div className="flex flex-col gap-7 lg:py-10">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 w-fit"
            style={{
              background: 'rgba(107,70,240,0.08)',
              border: '1.5px solid rgba(107,70,240,0.18)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6B46F0' }} />
            <span className="text-sm font-bold" style={{ color: '#6B46F0' }}>{t.hero.badge}</span>
          </div>

          {/* Heading — no gradient, solid colors only */}
          <h1 className="font-black leading-[1.12] text-[1.85rem] sm:text-5xl lg:text-[3.25rem] xl:text-6xl" style={{ color: '#1E293B' }}>
            {t.hero.h1a}
            <span className="block mt-1" style={{ color: '#6B46F0' }}>{t.hero.h1b}</span>
          </h1>

          {/* Description */}
          <p className="text-slate-500 text-lg leading-relaxed" style={{ maxWidth: '38ch' }}>
            {t.hero.desc}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <Link
              href="/register?free=1"
              className="flex items-center justify-center gap-2 font-black text-base px-8 py-3.5 rounded-2xl text-white transition-all hover:-translate-y-0.5 active:scale-95"
              style={{
                background: '#6B46F0',
                boxShadow: '0 8px 32px rgba(107,70,240,0.28)',
              }}
            >
              {t.hero.cta1}
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
            <Link
              href="/demo"
              className="flex items-center justify-center gap-2 font-bold text-base px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{
                color: '#6B46F0',
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid rgba(107,70,240,0.20)',
              }}
            >
              <Play className="w-4 h-4 fill-current" style={{ color: '#B99AFF' }} />
              {t.hero.cta2}
            </Link>
            {/* Appears only when the browser can install the app (self-hides otherwise) */}
            <InstallAppButton
              className="flex items-center justify-center gap-2 font-bold text-base px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 text-brand-700 bg-white border-[1.5px] border-brand-200 hover:bg-brand-50"
            />
          </div>

          {/* Stats — inline row */}
          <div
            className="flex items-center gap-4 sm:gap-8 pt-2"
            style={{ borderTop: '1px solid rgba(107,70,240,0.10)' }}
          >
            {[
              { value: '+200', label: t.hero.stats.children },
              { value: '+5',   label: t.hero.stats.years },
              { value: '98%',  label: t.hero.stats.satisfaction },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-black text-2xl ltr-num" style={{ color: '#6B46F0' }}>{value}</div>
                <div className="text-slate-400 text-xs leading-tight mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual column — LEFT in RTL, RIGHT in LTR */}
        <div className="relative flex flex-col items-stretch gap-5 lg:py-10">
          {/* Continuous float animation */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <DashboardVisual />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
