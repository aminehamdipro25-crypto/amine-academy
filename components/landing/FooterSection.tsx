'use client'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import AcademyLogo from '@/components/shared/AcademyLogo'

export default function FooterSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(180deg, #F5EEFF 0%, #EDE6FF 100%)',
        borderTop: '1px solid rgba(124,92,252,0.12)',
        padding: '48px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <AcademyLogo size={40} />
              <div>
                <div className="font-black text-lg" style={{ color: '#1E293B' }}>
                  {pickLang(lang, 'أكاديمية أمين الدولية', 'Amine International Academy', 'Amine International Academy')}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>ADHD & Autism Academy</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#64748B' }}>
              {pickLang(
                lang,
                'منصة تفاعلية عالمية للتأهيل الحركي والنشاط البدني المعدل لأطفال وشباب ADHD وطيف التوحد، من عمر 5 إلى 22 سنة.',
                'A global interactive platform for Adapted Physical Activity (APA) and movement rehabilitation for children and young adults with ADHD and Autism Spectrum, ages 5 to 22.',
                "Une plateforme interactive mondiale pour la rééducation motrice et l'activité physique adaptée des enfants et jeunes TDAH et autistes, de 5 à 22 ans."
              )}
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="font-bold text-sm mb-4" style={{ color: '#94A3B8' }}>
              {pickLang(lang, 'الأكاديمية', 'Academy', 'Académie')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#programs" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'البرامج', 'Programs', 'Programmes')}</Link></li>
              <li><Link href="/#plans" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'الأسعار', 'Pricing', 'Tarifs')}</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'التسجيل', 'Register', 'Inscription')}</Link></li>
              <li><Link href="/blog" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'المدونة', 'Blog', 'Blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" style={{ color: '#94A3B8' }}>
              {pickLang(lang, 'قانوني', 'Legal', 'Mentions légales')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'شروط الاستخدام', 'Terms of Use', "Conditions d'utilisation")}</Link></li>
              <li><Link href="/legal/privacy" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'سياسة الخصوصية', 'Privacy Policy', 'Politique de confidentialité')}</Link></li>
              <li><Link href="/legal/cancellation" className="transition-colors hover:text-indigo-600" style={{ color: '#64748B' }}>{pickLang(lang, 'سياسة الإلغاء', 'Cancellation Policy', "Politique d'annulation")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(124,92,252,0.12)' }}>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {pickLang(
              lang,
              `© ${new Date().getFullYear()} أكاديمية أمين الدولية. جميع الحقوق محفوظة.`,
              `© ${new Date().getFullYear()} Amine International Academy. All rights reserved.`,
              `© ${new Date().getFullYear()} Amine International Academy. Tous droits réservés.`
            )}
          </p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {pickLang(
              lang,
              'COPPA & GDPR Compliant — بيانات أطفالك محمية بالكامل',
              "COPPA & GDPR Compliant — Your children's data is fully protected",
              "Conforme COPPA & RGPD — les données de vos enfants sont entièrement protégées"
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
