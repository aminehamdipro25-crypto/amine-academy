import Link from 'next/link'

export default function FooterSection() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-black text-lg">A</div>
              <div>
                <div className="font-black text-lg">أكاديمية أمين الدولية</div>
                <div className="text-gray-400 text-xs">ADHD & Autism Academy</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              منصة تفاعلية عالمية للرياضة المعدلة وعلم النفس لأطفال وشباب ADHD وطيف التوحد، من عمر 5 إلى 22 سنة.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">الأكاديمية</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/#programs" className="hover:text-white transition-colors">البرامج</Link></li>
              <li><Link href="/#plans" className="hover:text-white transition-colors">الأسعار</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">التسجيل</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">المدونة</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">قانوني</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/legal/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/legal/cancellation" className="hover:text-white transition-colors">سياسة الإلغاء</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} أكاديمية أمين الدولية. جميع الحقوق محفوظة.</p>
          <p>COPPA & GDPR Compliant — بيانات أطفالك محمية بالكامل</p>
        </div>
      </div>
    </footer>
  )
}
