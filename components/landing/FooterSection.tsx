'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function FooterSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <footer className="bg-[#1A0F45] text-white py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-l from-brand-600 to-brand-500 rounded-xl flex items-center justify-center font-black text-lg shadow-brand-sm">A</div>
              <div>
                <div className="font-black text-lg text-white">
                  {isAr ? 'أكاديمية أمين الدولية' : 'Amine International Academy'}
                </div>
                <div className="text-white/40 text-xs">ADHD & Autism Academy</div>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              {isAr
                ? 'منصة تفاعلية عالمية للرياضة المعدلة وعلم النفس لأطفال وشباب ADHD وطيف التوحد، من عمر 5 إلى 22 سنة.'
                : 'A global interactive platform for adapted sports and psychology for children and young adults with ADHD and Autism Spectrum, ages 5 to 22.'}
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="font-bold text-sm text-white/60 mb-4">
              {isAr ? 'الأكاديمية' : 'Academy'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#programs" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'البرامج' : 'Programs'}</Link></li>
              <li><Link href="/#plans" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'الأسعار' : 'Pricing'}</Link></li>
              <li><Link href="/register" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'التسجيل' : 'Register'}</Link></li>
              <li><Link href="/blog" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'المدونة' : 'Blog'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white/60 mb-4">
              {isAr ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms of Use'}</Link></li>
              <li><Link href="/legal/privacy" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
              <li><Link href="/legal/cancellation" className="text-white/60 hover:text-white/90 transition-colors">{isAr ? 'سياسة الإلغاء' : 'Cancellation Policy'}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            {isAr
              ? `© ${new Date().getFullYear()} أكاديمية أمين الدولية. جميع الحقوق محفوظة.`
              : `© ${new Date().getFullYear()} Amine International Academy. All rights reserved.`}
          </p>
          <p className="text-white/40 text-sm">
            {isAr
              ? 'COPPA & GDPR Compliant — بيانات أطفالك محمية بالكامل'
              : "COPPA & GDPR Compliant — Your children's data is fully protected"}
          </p>
        </div>
      </div>
    </footer>
  )
}
