'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function StudentPortalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[student-portal-error]', error) }, [error])
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-black text-gray-900 text-lg mb-2">حدث خطأ</h2>
        <p className="text-gray-500 text-sm mb-6">لم نتمكن من تحميل الصفحة، حاول مجدداً</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            حاول مجدداً
          </button>
          <Link
            href="/student/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
