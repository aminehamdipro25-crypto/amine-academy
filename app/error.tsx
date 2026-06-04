'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
      <div>
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black text-gray-900 mb-4">حدث خطأ</h2>
        <p className="text-gray-500 mb-6">نأسف على هذا الخطأ. يرجى المحاولة مجدداً.</p>
        <button onClick={reset}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          حاول مجدداً
        </button>
      </div>
    </div>
  )
}
