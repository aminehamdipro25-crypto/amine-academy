import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center text-center p-4">
      <div>
        <div className="text-8xl mb-6 animate-float inline-block">🔍</div>
        <h1 className="text-white font-black text-4xl mb-4">الصفحة غير موجودة</h1>
        <p className="text-white/60 mb-8">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link href="/"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
