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

// Unified feature list — same across all billing cycles
const FEATURES = [
  { text: 'جلسة تفاعلية مباشرة بالفيديو مع الأستاذ أمين',        textEn: 'Live 1-on-1 video session with Prof. Amine', textFr: 'Séance vidéo individuelle en direct avec le professeur Amine' },
  { text: 'برنامج تمارين مخصص يتكيّف أسبوعياً مع تطور الطفل',   textEn: 'Personalized exercise program, adapted weekly', textFr: "Programme d'exercices personnalisé, ajusté chaque semaine" },
  { text: 'مكتبة 60+ تمرين علمي (APA + ABA + CBT)',              textEn: '60+ scientific exercises (APA + ABA + CBT)', textFr: 'Plus de 60 exercices scientifiques (APA + ABA + TCC)' },
  { text: 'تقارير تقدم مفصّلة لولي الأمر بعد كل حصة',           textEn: 'Detailed progress reports for parents after each session', textFr: 'Rapports de progrès détaillés pour les parents après chaque séance' },
  { text: 'واتساب مباشر مع الأستاذ للمتابعة اليومية',            textEn: 'Direct WhatsApp with Prof. Amine for daily follow-up', textFr: 'WhatsApp direct avec le professeur Amine pour un suivi quotidien' },
  { text: 'تعديل البرنامج المستمر حسب استجابة الطفل',            textEn: 'Continuous program adjustments based on child\'s response', textFr: "Ajustements continus du programme selon la réponse de l'enfant" },
  { text: 'تقييم دوري بالذكاء الاصطناعي لرصد التطور',           textEn: 'Periodic AI-powered assessment to track progress', textFr: "Évaluation périodique par intelligence artificielle pour suivre les progrès" },
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
  perSession: { QAR: string; TND: string }
  savingsPct: number | null
  badge: string | null
  badgeEn: string | null
  badgeFr: string | null
  badgeStyle: string
  cardStyle: string
  headerBg: string
  headerText: string
  priceText: string
  ctaText: string
  ctaTextEn: string
  ctaTextFr: string
  ctaStyle: string
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
    perSession: { QAR: '49 ر.ق / حصة', TND: '15 د.ت / حصة' },
    savingsPct: null,
    badge: null,
    badgeEn: null,
    badgeFr: null,
    badgeStyle: '',
    cardStyle: '',
    headerBg: '',
    headerText: 'text-white',
    priceText: 'text-white',
    ctaText: 'احجز حصة',
    ctaTextEn: 'Book a Session',
    ctaTextFr: 'Réserver une séance',
    ctaStyle: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
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
    perSession: { QAR: '~42 ر.ق / حصة', TND: '~12 د.ت / حصة' },
    savingsPct: 14,
    badge: '⭐ الأكثر طلباً',
    badgeEn: '⭐ Most Popular',
    badgeFr: '⭐ Le plus demandé',
    badgeStyle: 'bg-brand-500 text-white',
    cardStyle: '',
    headerBg: '',
    headerText: 'text-white',
    priceText: 'text-white',
    ctaText: 'اشترك أسبوعياً',
    ctaTextEn: 'Subscribe Weekly',
    ctaTextFr: "S'abonner par semaine",
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50 font-black',
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
    perSession: { QAR: '~34 ر.ق / حصة', TND: '~9 د.ت / حصة' },
    savingsPct: 31,
    badge: '💎 الأفضل قيمة',
    badgeEn: '💎 Best Value',
    badgeFr: '💎 Le meilleur choix',
    badgeStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white',
    cardStyle: '',
    headerBg: '',
    headerText: 'text-white',
    priceText: 'text-white',
    ctaText: 'اشترك شهرياً',
    ctaTextEn: 'Subscribe Monthly',
    ctaTextFr: "S'abonner par mois",
    ctaStyle: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:opacity-90 font-black',
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
      style={{ background: 'linear-gradient(180deg, #1A2640 0%, #0C1829 100%)', padding: '80px 0' }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="font-bold text-sm px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#C4B5FD' }}
          >
            {pickLang(lang, 'خيارات الاشتراك', 'Subscription Options', "Options d'abonnement")}
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mt-4 mb-3"
            style={{
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {pickLang(lang, 'نفس الجودة — تختار طريقة الدفع', 'Same Quality — You Choose How to Pay', 'Même qualité — vous choisissez votre mode de paiement')}
          </h2>
          <p className="text-white/65 max-w-xl mx-auto text-sm leading-relaxed">
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
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {(['QAR', 'TND'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => { setUserChoseCurrency(true); setCurrency(c) }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  currency === c
                    ? 'text-white'
                    : 'text-white/65 hover:text-white/80'
                }`}
                style={currency === c ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : {}}
              >
                {CURRENCY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* What's always included — unified features */}
        <div
          className="max-w-3xl mx-auto mb-12 rounded-3xl p-6"
          style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.13)' }}
        >
          <p className="text-center text-sm font-black text-white/55 uppercase tracking-wider mb-5">
            {pickLang(lang, '✦ ما يشمله كل خيار بدون استثناء', '✦ Included in every option, no exceptions', '✦ Inclus dans chaque option, sans exception')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-2.5 text-sm text-white/65">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
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

            const spw = settings?.sessionsPerWeek ?? 4
            const spm = settings?.sessionsPerMonth ?? 16
            const sessionCountLabel = plan.id === 'weekly'
              ? pickLang(lang, `${spw} حصص / أسبوع`, `${spw} sessions / week`, `${spw} séances / semaine`)
              : plan.id === 'monthly'
              ? pickLang(lang, `${spm} حصة / شهر`, `${spm} sessions / month`, `${spm} séances / mois`)
              : null
            const perSessionStr = plan.id === 'weekly'
              ? `≈ ${Math.round(displayPrice / spw)} ${symbol} / ${pickLang(lang, 'حصة', 'session', 'séance')}`
              : plan.id === 'monthly'
              ? `≈ ${Math.round(displayPrice / spm)} ${symbol} / ${pickLang(lang, 'حصة', 'session', 'séance')}`
              : null

            return (
              <div
                key={plan.id}
                className="rounded-3xl overflow-hidden relative transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: isPopular
                    ? 'linear-gradient(160deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)'
                    : plan.id === 'monthly'
                    ? 'linear-gradient(160deg, rgba(245,158,11,0.1) 0%, rgba(249,115,22,0.07) 100%)'
                    : 'rgba(255,255,255,0.13)',
                  border: isPopular
                    ? '1px solid rgba(99,102,241,0.35)'
                    : plan.id === 'monthly'
                    ? '1px solid rgba(245,158,11,0.25)'
                    : '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: isPopular
                    ? '0 20px 60px rgba(99,102,241,0.2), inset 0 1px 0 rgba(99,102,241,0.2)'
                    : '0 12px 40px rgba(0,0,0,0.3)',
                }}
              >

                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-xs font-black px-4 py-1.5 rounded-full ${plan.badgeStyle}`}>
                    {pickLang(lang, plan.badge, plan.badgeEn ?? plan.badge, plan.badgeFr ?? plan.badge)}
                  </div>
                )}

                {/* Header */}
                <div className="p-6 pt-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(255,255,255,0.13)' }}
                  >
                    <PlanIcon className="w-5 h-5 text-white/70" />
                  </div>
                  <h3 className={`font-black text-xl ${plan.headerText}`}>{pickLang(lang, plan.name, plan.nameEn, plan.nameFr)}</h3>
                  <p className={`text-xs mt-1 ${plan.headerText} opacity-70`}>{pickLang(lang, plan.subtitle, plan.subtitleEn, plan.subtitleFr)}</p>
                  {sessionCountLabel && !settingsLoading && (
                    <span className={`inline-block mt-2 text-xs font-black px-3 py-1 rounded-full ${
                      isPopular ? 'bg-white/25 text-white' : 'bg-white/20 text-white'
                    }`}>
                      📅 {sessionCountLabel}
                    </span>
                  )}

                  {/* Price */}
                  {settingsLoading ? (
                    <div className="mt-4 h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
                  ) : (
                    <div className="mt-4">
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-4xl font-black ltr-num ${plan.priceText}`}>{discountedPrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-45 line-through ltr-num`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {pickLang(lang, plan.period, plan.periodEn, plan.periodFr)}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-4xl font-black ltr-num ${plan.priceText}`}>{basePrice}</span>
                          <span className={`text-sm ${plan.priceText} opacity-70`}>{symbol} / {pickLang(lang, plan.period, plan.periodEn, plan.periodFr)}</span>
                        </div>
                      )}
                      {/* Per-session equivalent — only for weekly/monthly */}
                      {(perSessionStr || plan.savingsPct) && (
                        <div className={`mt-2 flex items-center gap-2 flex-wrap`}>
                          {perSessionStr && (
                            <span className={`text-xs ${plan.priceText} opacity-60`}>
                              {perSessionStr}
                            </span>
                          )}
                          {plan.savingsPct && (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              isPopular ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {pickLang(lang, `وفّر ${plan.savingsPct}%`, `Save ${plan.savingsPct}%`, `Économisez ${plan.savingsPct}%`)}
                            </span>
                          )}
                        </div>
                      )}
                      {discountedPrice !== null && settings?.discountLabel && (
                        <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 ${plan.priceText}`}>
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
                    className="block w-full text-center font-bold py-3.5 rounded-xl transition-all hover:opacity-90 text-white font-black"
                    style={{
                      background: isPopular
                        ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                        : plan.id === 'monthly'
                        ? 'linear-gradient(135deg, #F59E0B, #F97316)'
                        : 'rgba(255,255,255,0.1)',
                      border: isPopular || plan.id === 'monthly' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {pickLang(lang, `${plan.ctaText} ←`, `${plan.ctaTextEn} →`, `${plan.ctaTextFr} →`)}
                  </Link>

                  {plan.id === 'monthly' && (
                    <p className="text-center text-xs text-white/50 mt-3">
                      {pickLang(lang, 'يُجدَّد تلقائياً • إلغاء في أي وقت', 'Auto-renews • Cancel anytime', 'Renouvellement automatique • Annulez à tout moment')}
                    </p>
                  )}
                  {plan.id === 'weekly' && (
                    <p className="text-center text-xs text-white/50 mt-3">
                      {pickLang(lang, 'يُجدَّد أسبوعياً • إلغاء في أي وقت', 'Auto-renews weekly • Cancel anytime', 'Renouvellement automatique chaque semaine • Annulez à tout moment')}
                    </p>
                  )}
                  {plan.id === 'session' && (
                    <p className="text-center text-xs text-white/50 mt-3">
                      {pickLang(lang, 'لا اشتراك — ادفع فقط عند الحجز', 'No subscription — pay only when you book', "Sans abonnement — payez uniquement lors de la réservation")}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Interactive session explainer */}
        <div
          className="max-w-2xl mx-auto mt-10 mb-2 rounded-2xl p-5 flex items-start gap-4 text-white"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-sm mb-1">
              {pickLang(lang, 'كيف تعمل الجلسة التفاعلية؟', 'How does the interactive session work?', 'Comment fonctionne la séance interactive ?')}
            </p>
            <p className="text-white/65 text-xs leading-relaxed">
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
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center text-white">
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
              <Icon className="w-5 h-5 text-indigo-400" />
              <p className="font-bold text-white/70 text-sm">{pickLang(lang, text, textEn, textFr)}</p>
              <p className="text-white/50 text-xs">{pickLang(lang, sub, subEn, subFr)}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
