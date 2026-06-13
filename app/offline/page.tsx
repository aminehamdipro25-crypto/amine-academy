'use client'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: '#FFF8F0', direction: 'rtl' }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: '#F3EEFF' }}
      >
        <WifiOff className="w-10 h-10" style={{ color: '#7C5CFC' }} />
      </div>

      <div className="text-center">
        <h1 className="font-black text-2xl text-gray-900 mb-2">لا يوجد اتصال بالإنترنت</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك ثم أعد المحاولة.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 font-black text-white px-6 py-3 rounded-2xl"
        style={{ background: '#7C5CFC' }}
      >
        <RefreshCw className="w-4 h-4" />
        إعادة المحاولة
      </button>
    </div>
  )
}
