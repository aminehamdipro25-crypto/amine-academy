'use client'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'

export default function FooterSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <footer className="bg-[#1A0F45] text-white py-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-l from-brand-600 to-brand-500 rounded-xl flex items-center justify-center font-black text-lg shadow-brand-sm">A</div>
              <div>
                <div className="font-black text-lg text-white">
                  {pickLang(lang, 'أكاديمية أمين الدولية', 'Amine International Academy', 'Amine International Academy')}
                </div>
                <div className="text-white/40 text-xs">ADHD & Autism Academy</div>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
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
            <h4 className="font-bold text-sm text-white/60 mb-4">
              {pickLang(lang, 'الأكاديمية', 'Academy', 'Académie')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#programs" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'البرامج', 'Programs', 'Programmes')}</Link></li>
              <li><Link href="/#plans" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'الأسعار', 'Pricing', 'Tarifs')}</Link></li>
              <li><Link href="/register" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'التسجيل', 'Register', 'Inscription')}</Link></li>
              <li><Link href="/blog" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'المدونة', 'Blog', 'Blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white/60 mb-4">
              {pickLang(lang, 'قانوني', 'Legal', 'Mentions légales')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'شروط الاستخدام', 'Terms of Use', "Conditions d'utilisation")}</Link></li>
              <li><Link href="/legal/privacy" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'سياسة الخصوصية', 'Privacy Policy', 'Politique de confidentialité')}</Link></li>
              <li><Link href="/legal/cancellation" className="text-white/60 hover:text-white/90 transition-colors">{pickLang(lang, 'سياسة الإلغاء', 'Cancellation Policy', "Politique d'annulation")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            {pickLang(
              lang,
              `© ${new Date().getFullYear()} أكاديمية أمين الدولية. جميع الحقوق محفوظة.`,
              `© ${new Date().getFullYear()} Amine International Academy. All rights reserved.`,
              `© ${new Date().getFullYear()} Amine International Academy. Tous droits réservés.`
            )}
          </p>
          <p className="text-white/40 text-sm">
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
