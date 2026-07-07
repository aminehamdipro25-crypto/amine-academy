'use client'
import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { useLang } from '@/lib/i18n'

type PlanId = 'session' | 'weekly' | 'monthly'
type Currency = 'QAR' | 'TND'

interface PublicSettings {
  prices?: Record<string, Record<string, number>>
}

const BASE_PRICES: Record<PlanId, Record<Currency, number>> = {
  session: { QAR: 49,  TND: 15  },
  weekly:  { QAR: 169, TND: 49  },
  monthly: { QAR: 549, TND: 149 },
}

const PLAN_SESSIONS: Record<PlanId, number> = { session: 1, weekly: 4, monthly: 12 }

const FEATURES: Record<PlanId, { emoji: string; ar: string; en: string }[]> = {
  session: [
    { emoji: '🎯', ar: 'جلسة مباشرة', en: 'Live session' },
    { emoji: '📋', ar: 'تقرير فوري', en: 'Instant report' },
    { emoji: '🔓', ar: 'بدون التزام', en: 'No commitment' },
  ],
  weekly: [
    { emoji: '📅', ar: '4 حصص / أسبوع', en: '4 sessions/week' },
    { emoji: '🧠', ar: 'برنامج متكيّف', en: 'Adaptive program' },
    { emoji: '📊', ar: 'تقارير أسبوعية', en: 'Weekly reports' },
    { emoji: '💬', ar: 'واتساب مباشر', en: 'Direct WhatsApp' },
  ],
  monthly: [
    { emoji: '🏆', ar: '12 حصة / شهر', en: '12 sessions/month' },
    { emoji: '⚡', ar: 'أولوية الحجز', en: 'Priority booking' },
    { emoji: '📈', ar: 'تقارير يومية', en: 'Daily reports' },
    { emoji: '👨‍👩‍👧', ar: 'توجيه الوالدين', en: 'Parent coaching' },
  ],
}

export default function UpgradePlanPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [currency, setCurrency] = useState<Currency>('QAR')
  const [apiPrices, setApiPrices] = useState<Record<string, Record<string, number>> | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)

  useEffect(() => {
    fetch('/api/geo')
      .then(r => r.json())
      .then((d: { currency?: Currency }) => { if (d.currency) setCurrency(d.currency) })
      .catch(() => {})
    fetch('/api/public/settings')
      .then(r => r.json())
      .then((d: PublicSettings) => { if (d.prices) setApiPrices(d.prices) })
      .catch(() => {})
    fetch('/api/parent/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { parent?: { subscriptionPlan?: string } } | null) => {
        const plan = d?.parent?.subscriptionPlan as PlanId | undefined
        if (plan && ['session', 'weekly', 'monthly'].includes(plan)) setCurrentPlan(plan)
      })
      .catch(() => {})
  }, [])

  const sym = currency === 'QAR' ? 'ر.ق' : 'د.ت'

  function price(id: PlanId) {
    return apiPrices?.[id]?.[currency] ?? BASE_PRICES[id][currency]
  }

  function perSession(id: PlanId) {
    return Math.round(price(id) / PLAN_SESSIONS[id])
  }

  function savings(id: PlanId) {
    const single = price('session')
    const pp = perSession(id)
    return pp < single ? Math.round((1 - pp / single) * 100) : 0
  }

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">

      {/* ── Header ── */}
      <div className="text-center pt-2 pb-1">
        <div className="text-4xl mb-2">🚀</div>
        <h1 className="font-black text-2xl text-gray-900">
          {isAr ? 'اختر رحلة طفلك' : "Choose Your Child's Journey"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isAr ? 'يمكنك التغيير في أي وقت — بدون عقود' : 'Change anytime — no contracts'}
        </p>
      </div>

      {/* ── Currency toggle ── */}
      <div className="flex justify-center">
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: '#F3EEFF' }}>
          {(['QAR', 'TND'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className="px-5 py-2 rounded-xl text-sm font-black transition-all"
              style={currency === c
                ? { background: '#6B46F0', color: '#fff', boxShadow: '0 4px 12px rgba(107,70,240,0.3)' }
                : { color: '#9CA3AF' }}
            >
              {c === 'QAR' ? '🇶🇦 ر.ق' : '🇹🇳 د.ت'}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURED PLAN — الأسبوعية
      ════════════════════════════════════════ */}
      {(() => {
        const id: PlanId = 'weekly'
        const isCurrent = currentPlan === id
        const sv = savings(id)
        const features = FEATURES[id]
        return (
          <div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #3A1FA8 0%, #6B46F0 55%, #9A7BFD 100%)',
              boxShadow: '0 16px 48px rgba(107,70,240,0.4)',
            }}
          >
            {/* Badges row */}
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-[11px] font-black px-3 py-1 rounded-full text-white"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                ⭐ {isAr ? 'الأكثر طلباً' : 'Most Popular'}
              </span>
              {sv > 0 && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full"
                  style={{ background: '#22C55E', color: '#fff' }}>
                  {isAr ? `وفّر ${sv}%` : `Save ${sv}%`}
                </span>
              )}
              {isCurrent && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full"
                  style={{ background: '#22C55E', color: '#fff' }}>
                  ✓ {isAr ? 'باقتك الحالية' : 'Your plan'}
                </span>
              )}
            </div>

            {/* Price hero */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-white/60 text-sm font-bold mb-1">
                {isAr ? 'الباقة الأسبوعية' : 'Weekly Package'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white ltr-num">{price(id)}</span>
                <div>
                  <div className="text-white/70 text-sm font-bold">{sym}</div>
                  <div className="text-white/50 text-xs">/ {isAr ? 'أسبوع' : 'week'}</div>
                </div>
              </div>
            </div>

            {/* Feature chips */}
            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2 mt-3 mb-5">
                {features.map(f => (
                  <div
                    key={f.ar}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    <span style={{ fontSize: 14 }}>{f.emoji}</span>
                    {isAr ? f.ar : f.en}
                  </div>
                ))}
              </div>

              <a
                href={isCurrent ? '#' : `/checkout?plan=${id}&currency=${currency}`}
                className="flex items-center justify-center gap-2 w-full font-black py-3.5 rounded-2xl text-sm transition-all"
                style={isCurrent
                  ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', cursor: 'default', pointerEvents: 'none' }
                  : { background: '#FFFFFF', color: '#6B46F0', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.background = '#F0EBFF' }}
                onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.background = '#FFFFFF' }}
              >
                {isCurrent
                  ? (isAr ? '✓ باقتك الحالية' : '✓ Your current plan')
                  : (isAr ? 'ابدأ الأسبوعية الآن ←' : 'Start Weekly Now ←')}
              </a>
            </div>
          </div>
        )
      })()}

      {/* ════════════════════════════════════════
          OTHER PLANS — 2 cards side by side
      ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        {(['session', 'monthly'] as PlanId[]).map(id => {
          const isCurrent = currentPlan === id
          const sv = savings(id)
          const features = FEATURES[id]
          const names: Record<PlanId, { ar: string; en: string }> = {
            session: { ar: 'حصة واحدة',      en: 'Single Session' },
            weekly:  { ar: 'الأسبوعية',       en: 'Weekly' },
            monthly: { ar: 'الشهرية 💎',       en: 'Monthly 💎' },
          }
          return (
            <div
              key={id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: '#FFFFFF',
                border: isCurrent ? '2px solid #22C55E' : id === 'monthly' ? '2px solid #F59E0B' : '1.5px solid #F0E8FF',
                boxShadow: id === 'monthly' ? '0 4px 20px rgba(245,158,11,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                {isCurrent ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full mb-2 inline-block"
                    style={{ background: '#D1FAE5', color: '#065F46' }}>
                    ✓ {isAr ? 'باقتك' : 'Your plan'}
                  </span>
                ) : sv > 0 ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full mb-2 inline-block"
                    style={{ background: id === 'monthly' ? '#FEF3C7' : '#F3EEFF', color: id === 'monthly' ? '#D97706' : '#6B46F0' }}>
                    {isAr ? `وفّر ${sv}%` : `Save ${sv}%`}
                  </span>
                ) : (
                  <div className="h-5 mb-2" />
                )}
                <p className="font-black text-sm text-gray-900 leading-tight">
                  {isAr ? names[id].ar : names[id].en}
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-gray-900 ltr-num">{price(id)}</span>
                  <span className="text-xs text-gray-400">{sym}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {id === 'session'
                    ? (isAr ? 'حصة واحدة — لا التزام' : 'One session — no commitment')
                    : (isAr ? `≈ ${perSession(id)} ${sym} / حصة` : `≈ ${perSession(id)} ${sym}/session`)}
                </p>
              </div>

              {/* Mini features */}
              <div className="px-4 pb-3 flex-1">
                <div className="flex flex-col gap-1.5">
                  {features.slice(0, 3).map(f => (
                    <div key={f.ar} className="flex items-center gap-1.5 text-[11px] text-gray-600 font-bold">
                      <span style={{ fontSize: 13 }}>{f.emoji}</span>
                      {isAr ? f.ar : f.en}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-3 pb-3">
                <a
                  href={isCurrent ? '#' : `/checkout?plan=${id}&currency=${currency}`}
                  className="flex items-center justify-center w-full font-black py-2.5 rounded-xl text-xs transition-all"
                  style={isCurrent
                    ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'default', pointerEvents: 'none' }
                    : id === 'monthly'
                    ? { background: 'linear-gradient(135deg, #F59E0B, #F97316)', color: '#fff' }
                    : { background: '#F3EEFF', color: '#6B46F0', border: '1.5px solid #E0D0FF' }}
                  onMouseEnter={e => {
                    if (isCurrent) return
                    if (id === 'monthly') (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'
                    else (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF'
                  }}
                  onMouseLeave={e => {
                    if (isCurrent) return
                    if (id === 'monthly') (e.currentTarget as HTMLAnchorElement).style.opacity = '1'
                    else (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF'
                  }}
                >
                  {isCurrent
                    ? (isAr ? '✓ باقتك' : '✓ Current')
                    : (isAr ? 'اختر ←' : 'Choose ←')}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Reassurance strip ── */}
      <div className="flex items-center justify-center gap-6 py-2">
        {[
          { emoji: '🔄', text: isAr ? 'تغيير مجاني' : 'Free change' },
          { emoji: '🚫', text: isAr ? 'بدون عقد' : 'No contract' },
          { emoji: '💬', text: isAr ? 'دعم مباشر' : 'Live support' },
        ].map(item => (
          <div key={item.text} className="flex flex-col items-center gap-1">
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <span className="text-[11px] font-bold text-gray-500">{item.text}</span>
          </div>
        ))}
      </div>

      {/* ── WhatsApp CTA ── */}
      <a
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(isAr ? 'أريد الاستفسار عن الباقات' : 'I want to ask about plans')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full font-black py-4 rounded-2xl text-white text-base transition-all"
        style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)', boxShadow: '0 8px 24px rgba(22,163,74,0.35)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px rgba(22,163,74,0.45)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(22,163,74,0.35)' }}
      >
        <span style={{ fontSize: 22 }}>💬</span>
        {isAr ? 'تحدث مع الأستاذ أمين مباشرة' : 'Talk to Prof. Amine directly'}
        <ExternalLink className="w-4 h-4 opacity-70" />
      </a>

    </div>
  )
}
