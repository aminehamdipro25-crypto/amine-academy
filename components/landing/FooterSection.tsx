'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function FooterSection() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <footer className="bg-gray-900 text-white py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-black text-lg">A</div>
              <div>
                <div className="font-black text-lg">
                  {isAr ? 'أكاديمية أمين الدولية' : 'Amine International Academy'}
                </div>
                <div className="text-gray-400 text-xs">ADHD & Autism Academy</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {isAr
                ? 'منصة تفاعلية عالمية للرياضة المعدلة وعلم النفس لأطفال وشباب ADHD وطيف التوحد، من عمر 5 إلى 22 سنة.'
                : 'A global interactive platform for adapted sports and psychology for children and young adults with ADHD and Autism Spectrum, ages 5 to 22.'}
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">
              {isAr ? 'الأكاديمية' : 'Academy'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/#programs" className="hover:text-white transition-colors">{isAr ? 'البرامج' : 'Programs'}</Link></li>
              <li><Link href="/#plans" className="hover:text-white transition-colors">{isAr ? 'الأسعار' : 'Pricing'}</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">{isAr ? 'التسجيل' : 'Register'}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">{isAr ? 'المدونة' : 'Blog'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">
              {isAr ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/legal/terms" className="hover:text-white transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms of Use'}</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
              <li><Link href="/legal/cancellation" className="hover:text-white transition-colors">{isAr ? 'سياسة الإلغاء' : 'Cancellation Policy'}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            {isAr
              ? `© ${new Date().getFullYear()} أكاديمية أمين الدولية. جميع الحقوق محفوظة.`
              : `© ${new Date().getFullYear()} Amine International Academy. All rights reserved.`}
          </p>
          <p>
            {isAr
              ? 'COPPA & GDPR Compliant — بيانات أطفالك محمية بالكامل'
              : "COPPA & GDPR Compliant — Your children's data is fully protected"}
          </p>
        </div>
      </div>
    </footer>
  )
}
