'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Video, MessageCircle, FileText, Brain, Zap, Calendar, Clock } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

type Currency = 'QAR' | 'TND'
type BillingCycle = 'session' | 'weekly' | 'monthly'

interface PublicSettings {
  prices: {
    session:  { QAR: number; TND: number }
    weekly:   { QAR: number; TND: number }
    monthly:  { QAR: number; TND: number }
  }
  discountPct: number
  discountLabel: string
  offerDurationDays: number
  sessionsPerWeek?: number
  sessionsPerMonth?: number
}

const FEATURES = [
  { text: 'جلسة تفاعلية مباشرة بالفيديو مع الأستاذ أمين',        textEn: 'Live 1-on-1 video session with Prof. Amine', textFr: 'Séance vidéo individuelle en direct avec le professeur Amine' },
  { text: 'برنامج تمارين مخصص يتكيّف أسبوعياً مع تطور الطفل',   textEn: 'Personalized exercise program, adapted weekly', textFr: "Programme d'exercices personnalisé, ajusté chaque semaine" },
  { text: 'مكتبة 60+ تمرين علمي (APA + ABA + CBT)',              textEn: '60+ scientific exercises (APA + ABA + CBT)', textFr: 'Plus de 60 exercices scientifiques (APA + ABA + TCC)' },
  { text: 'تقارير تقدم مفصّلة لولي الأمر بعد كل حصة',           textEn: 'Detailed progress reports for parents after each session', textFr: 'Rapports de progrès détaillés pour les parents après chaque séance' },
  { text: 'واتساب مباشر مع الأستاذ للمتابعة اليومية',            textEn: 'Direct WhatsApp with Prof. Amine for daily follow-up', textFr: 'WhatsApp direct avec le professeur Amine pour un suivi quotidien' },
  { text: 'تعديل البرنامج المستمر حسب استجابة الطفل',            textEn: 'Continuous program adjustments based on child\'s response', textFr: "Ajustements continus du programme selon la réponse de l'enfant" },
  { text: 'تقييم دوري متخصص لرصد التطور وتعديل البرنامج',       textEn: 'Periodic specialist assessment to track progress and adjust the program', textFr: "Évaluation périodique spécialisée pour suivre les progrès et ajuster le programme" },
  { text: 'إرشادات يومية للوالدين لتطبيق البرنامج في المنزل',    textEn: 'Daily parent guidance for home program implementation', textFr: 'Conseils quotidiens aux parents pour appliquer le programme à la maison' },
]

interface Plan {
  id: BillingCycle
  name: string
  nameEn: string
  nameFr: string
  subtitle: string
  subtitleEn: string
  subtitleFr: string
  prices: { QAR: number; TND: number }
  period: string
  periodEn: string
  periodFr: string
  savingsPct: number | null
  badge: string | null
  badgeEn: string | null
  badgeFr: string | null
  ctaText: string
  ctaTextEn: string
  ctaTextFr: string
  icon: typeof Clock
}

const PLANS: Plan[] = [
  {
    id: 'session',
    name: 'الحصة المفردة',
    nameEn: 'Single Session',
    nameFr: 'Séance unique',
    subtitle: 'مرونة كاملة — جرّب دون التزام',
    subtitleEn: 'Full flexibility — try with no commitment',
    subtitleFr: 'Flexibilité totale — essayez sans engagement',
    prices: { QAR: 49, TND: 15 },
    period: 'حصة',
    periodEn: 'session',
    periodFr: 'séance',
    savingsPct: null,
    badge: null,
    badgeEn: null,
    badgeFr: null,
    ctaText: 'احجز حصة',
    ctaTextEn: 'Book a Session',
    ctaTextFr: 'Réserver une séance',
    icon: Clock,
  },
  {
    id: 'weekly',
    name: 'الباقة الأسبوعية',
    nameEn: 'Weekly Package',
    nameFr: 'Forfait hebdomadaire',
    subtitle: 'متابعة منتظمة بمرونة أسبوعية',
    subtitleEn: 'Regular follow-up with weekly flexibility',
    subtitleFr: 'Suivi régulier avec une flexibilité hebdomadaire',
    prices: { QAR: 169, TND: 49 },
    period: 'أسبوع',
    periodEn: 'week',
    periodFr: 'semaine',
    savingsPct: 14,
    badge: '⭐ الأكثر طلباً',
    badgeEn: '⭐ Most Popular',
    badgeFr: '⭐ Le plus demandé',
    ctaText: 'اشترك أسبوعياً',
    ctaTextEn: 'Subscribe Weekly',
    ctaTextFr: "S'abonner par semaine",
    icon: Calendar,
  },
  {
    id: 'monthly',
    name: 'الباقة الشهرية',
    nameEn: 'Monthly Package',
    nameFr: 'Forfait mensuel',
    subtitle: 'أفضل قيمة للتطور المستدام',
    subtitleEn: 'Best value for sustainable progress',
    subtitleFr: 'Le meilleur rapport qualité-prix pour des progrès durables',
    prices: { QAR: 549, TND: 149 },
    period: 'شهر',
    periodEn: 'month',
    periodFr: 'mois',
    savingsPct: 31,
    badge: '💎 الأفضل قيمة',
    badgeEn: '💎 Best Value',
    badgeFr: '💎 Le meilleur choix',
    ctaText: 'اشترك شهرياً',
    ctaTextEn: 'Subscribe Monthly',
    ctaTextFr: "S'abonner par mois",
    icon: Brain,
  },
]

const CURRENCY_SYMBOLS: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }
const CURRENCY_LABELS:  Record<Currency, string>  = { QAR: '🇶🇦 قطر (ر.ق)', TND: '🇹🇳 تونس (د.ت)' }

export default function PlansSection() {
  const [currency, setCurrency] = useState<Currency>('QAR')
  const [userChoseCurrency, setUserChoseCurrency] = useState(false)
  const { lang } = useLang()
  const isRtl = lang === 'ar'
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then((data: PublicSettings) => setSettings(data))
      .catch(() => {})
      .finally(() => setSettingsLoading(false))
  }, [])

  useEffect(() => {
    if (userChoseCurrency) return
    fetch('/api/geo')
      .then(r => r.json())
      .then((data: { country: string; currency: Currency }) => {
        if (!userChoseCurrency) setCurrency(data.currency)
      })
      .catch(() => {})
  }, [userChoseCurrency])

  return (
    <section
      id="plans"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%),
          linear-gradient(180deg, #FFFBF0 0%, #FFF8EC 100%)
        `,
        padding: '80px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="font-bold text-sm px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0' }}
          >
            {pickLang(lang, 'خيارات الاشتراك', 'Subscription Options', "Options d'abonnement")}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mt-4 mb-3" style={{ color: '#1E293B' }}>
            {pickLang(lang, 'نفس الجودة — تختار طريقة الدفع', 'Same Quality — You Choose How to Pay', 'Même qualité — vous choisissez votre mode de paiement')}
          </h2>
          <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: '#64748B' }}>
            {pickLang(
              lang,
              'كل الخيارات تمنحك الجلسة التفاعلية الكاملة مع الأستاذ أمين وجميع مزايا المنصة — الفرق الوحيد هو طريقة الاشتراك.',
              'Every option gives you the full interactive session with Prof. Amine and all platform features — the only difference is how you subscribe.',
              "Chaque option vous donne accès à la séance interactive complète avec le professeur Amine et à toutes les fonctionnalités de la plateforme — seule la formule d'abonnement change."
            )}
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center mb-10">
          <div
            className="rounded-2xl p-1.5 flex gap-1"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(107,70,240,0.12)' }}
          >
            {(['QAR', 'TND'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => { setUserChoseCurrency(true); setCurrency(c) }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all`}
                style={currency === c
                  ? { background: '#6B46F0', color: 'white' }
                  : { color: '#64748B' }
                }
              >
                {CURRENCY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* What's always included */}
        <div
          className="max-w-3xl mx-auto mb-12 rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <p className="text-center text-sm font-black uppercase tracking-wider mb-5" style={{ color: '#94A3B8' }}>
            {pickLang(lang, '✦ ما يشمله كل خيار بدون استثناء', '✦ Included in every option, no exceptions', '✦ Inclus dans chaque option, sans exception')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-2.5 text-sm" style={{ color: '#475569' }}>
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{pickLang(lang, f.text, f.textEn, f.textFr)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon
            const cycleKey = plan.id as keyof PublicSettings['prices']
            const basePrice = settings?.prices?.[cycleKey]?.[currency] ?? plan.prices[currency]
            const discountPct = settings?.discountPct ?? 0
            const discountedPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : null
            const displayPrice = discountedPrice ?? basePrice
            const symbol = CURRENCY_SYMBOLS[currency]
            const isPopular = plan.id === 'weekly'
            const isMonthly = plan.id === 'monthly'

            const spw = settings?.sessionsPerWeek ?? 4
            const spm = settings?.sessionsPerMonth ?? 16
            const sessionCountLabel = plan.id === 'weekly'
              ? pickLang(lang, `${spw} حصص / أسبوع`, `${spw} sessions / week`, `${spw} séances / semaine`)
              : plan.id === 'monthly'
              ? pickLang(lang, `${spm} حصة / شهر`, `${spm} sessions / month`, `${spm} séances / mois`)
              : null

            const singleSessionPrice = settings?.prices?.session?.[currency] ?? PLANS[0].prices[currency]
            const perSessionRaw = plan.id === 'weekly'
              ? displayPrice / spw
              : plan.id === 'monthly'
              ? displayPrice / spm
              : null
            const perSessionRounded = perSessionRaw !== null ? Math.round(perSessionRaw) : null
            const perSessionStr = perSessionRounded !== null
              ? `≈ ${perSessionRounded} ${symbol} / ${pickLang(lang, 'حصة', 'session', 'séance')}`
              : null
            const realSavingsPct = (perSessionRaw !== null && perSessionRaw < singleSessionPrice)
              ? Math.round((1 - perSessionRaw / singleSessionPrice) * 100)
              : 0

            return (
              <div
                key={plan.id}
                className="rounded-3xl overflow-hidden relative transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: isPopular
                    ? 'linear-gradient(160deg, rgba(107,70,240,0.06) 0%, rgba(107,70,240,0.03) 100%)'
                    : isMonthly
                    ? 'linear-gradient(160deg, rgba(245,158,11,0.06) 0%, rgba(249,115,22,0.03) 100%)'
                    : 'rgba(255,255,255,0.95)',
                  border: isPopular
                    ? '2px solid rgba(107,70,240,0.25)'
                    : isMonthly
                    ? '2px solid rgba(245,158,11,0.25)'
                    : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isPopular
                    ? '0 12px 40px rgba(107,70,240,0.12)'
                    : '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >

                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-xs font-black px-4 py-1.5 rounded-full text-white`}
                    style={{ background: isPopular ? '#6B46F0' : 'linear-gradient(135deg,#F59E0B,#F97316)' }}>
                    {pickLang(lang, plan.badge, plan.badgeEn ?? plan.badge, plan.badgeFr ?? plan.badge)}
                  </div>
                )}

                {/* Header */}
                <div className="p-6 pt-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(107,70,240,0.08)' }}
                  >
                    <PlanIcon className="w-5 h-5" style={{ color: '#6B46F0' }} />
                  </div>
                  <h3 className="font-black text-xl" style={{ color: '#1E293B' }}>{pickLang(lang, plan.name, plan.nameEn, plan.nameFr)}</h3>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{pickLang(lang, plan.subtitle, plan.subtitleEn, plan.subtitleFr)}</p>
                  {sessionCountLabel && !settingsLoading && (
                    <span className="inline-block mt-2 text-xs font-black px-3 py-1 rounded-full"
                      style={{ background: 'rgba(107,70,240,0.08)', color: '#6B46F0' }}>
                      📅 {sessionCountLabel}
                    </span>
                  )}

                  {/* Price */}
                  {settingsLoading ? (
                    <div className="mt-4 h-10 w-32 rounded-xl animate-pulse" style={{ background: 'rgba(107,70,240,0.07)' }} />
                  ) : (
                    <div className="mt-4">
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-4xl font-black ltr-num" style={{ color: '#1E293B' }}>{discountedPrice}</span>
                          <span className="text-sm line-through ltr-num" style={{ color: '#CBD5E1' }}>{basePrice}</span>
                          <span className="text-sm" style={{ color: '#94A3B8' }}>{symbol} / {pickLang(lang, plan.period, plan.periodEn, plan.periodFr)}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-black ltr-num" style={{ color: '#1E293B' }}>{basePrice}</span>
                          <span className="text-sm" style={{ color: '#94A3B8' }}>{symbol} / {pickLang(lang, plan.period, plan.periodEn, plan.periodFr)}</span>
                        </div>
                      )}
                      {(perSessionStr || realSavingsPct > 0) && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {perSessionStr && (
                            <span className="text-xs" style={{ color: '#94A3B8' }}>
                              {perSessionStr}
                            </span>
                          )}
                          {realSavingsPct > 0 && (
                            <span className="text-xs font-black px-2 py-0.5 rounded-full"
                              style={{ background: isPopular ? 'rgba(107,70,240,0.1)' : 'rgba(245,158,11,0.1)', color: isPopular ? '#6B46F0' : '#D97706' }}>
                              {pickLang(lang, `وفّر ${realSavingsPct}%`, `Save ${realSavingsPct}%`, `Économisez ${realSavingsPct}%`)}
                            </span>
                          )}
                        </div>
                      )}
                      {discountedPrice !== null && settings?.discountLabel && (
                        <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(107,70,240,0.08)', color: '#6B46F0' }}>
                          {settings.discountLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="p-6">
                  <Link
                    href={`/checkout?plan=${plan.id}&currency=${currency}`}
                    className="block w-full text-center font-black py-3.5 rounded-xl transition-all hover:opacity-90 text-white"
                    style={{
                      background: isPopular
                        ? '#6B46F0'
                        : isMonthly
                        ? 'linear-gradient(135deg, #F59E0B, #F97316)'
                        : 'rgba(107,70,240,0.10)',
                      color: isPopular || isMonthly ? 'white' : '#6B46F0',
                      border: isPopular || isMonthly ? 'none' : '1px solid rgba(107,70,240,0.18)',
                    }}
                  >
                    {pickLang(lang, `${plan.ctaText} ←`, `${plan.ctaTextEn} →`, `${plan.ctaTextFr} →`)}
                  </Link>

                  {plan.id === 'monthly' && (
                    <p className="text-center text-xs mt-3" style={{ color: '#94A3B8' }}>
                      {pickLang(lang, 'يُجدَّد تلقائياً • إلغاء في أي وقت', 'Auto-renews • Cancel anytime', 'Renouvellement automatique • Annulez à tout moment')}
                    </p>
                  )}
                  {plan.id === 'weekly' && (
                    <p className="text-center text-xs mt-3" style={{ color: '#94A3B8' }}>
                      {pickLang(lang, 'يُجدَّد أسبوعياً • إلغاء في أي وقت', 'Auto-renews weekly • Cancel anytime', 'Renouvellement automatique chaque semaine • Annulez à tout moment')}
                    </p>
                  )}
                  {plan.id === 'session' && (
                    <p className="text-center text-xs mt-3" style={{ color: '#94A3B8' }}>
                      {pickLang(lang, 'لا اشتراك — ادفع فقط عند الحجز', 'No subscription — pay only when you book', "Sans abonnement — payez uniquement lors de la réservation")}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Session explainer */}
        <div
          className="max-w-2xl mx-auto mt-10 mb-2 rounded-2xl p-5 flex items-start gap-4"
          style={{ background: 'rgba(107,70,240,0.05)', border: '1px solid rgba(107,70,240,0.12)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: '#6B46F0' }}
          >
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-sm mb-1" style={{ color: '#1E293B' }}>
              {pickLang(lang, 'كيف تعمل الجلسة التفاعلية؟', 'How does the interactive session work?', 'Comment fonctionne la séance interactive ?')}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
              {pickLang(
                lang,
                'اتصال فيديو مباشر مع الأستاذ أمين • الطفل يؤدي التمارين أمام الشاشة • تغذية راجعة فورية • توجيه الوالد لكيفية المتابعة اليومية في البيت',
                'Live video call with Prof. Amine • Child performs exercises on camera • Immediate feedback • Parent guidance for daily home follow-up',
                "Appel vidéo en direct avec le professeur Amine • L'enfant réalise les exercices devant l'écran • Retour immédiat • Conseils au parent pour le suivi quotidien à la maison"
              )}
            </p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          {[
            {
              icon: MessageCircle,
              text: 'تواصل مباشر على واتساب',
              textEn: 'Direct WhatsApp Contact',
              textFr: 'Contact direct sur WhatsApp',
              sub: 'لأي استفسار قبل الحجز',
              subEn: 'For any inquiry before booking',
              subFr: 'Pour toute question avant la réservation',
            },
            {
              icon: FileText,
              text: 'لا عقود — لا التزامات',
              textEn: 'No Contracts — No Lock-ins',
              textFr: 'Sans contrat — sans engagement',
              sub: 'إلغاء الاشتراك في أي وقت',
              subEn: 'Cancel your subscription anytime',
              subFr: 'Annulez votre abonnement à tout moment',
            },
            {
              icon: Brain,
              text: 'نتائج مضمونة علمياً',
              textEn: 'Scientifically Backed Results',
              textFr: 'Des résultats validés scientifiquement',
              sub: 'مبنية على أبحاث APA وABA',
              subEn: 'Based on APA & ABA research',
              subFr: 'Fondés sur la recherche en APA et ABA',
            },
          ].map(({ icon: Icon, text, textEn, textFr, sub, subEn, subFr }) => (
            <div key={text} className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5" style={{ color: '#6B46F0' }} />
              <p className="font-bold text-sm" style={{ color: '#374151' }}>{pickLang(lang, text, textEn, textFr)}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{pickLang(lang, sub, subEn, subFr)}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
