'use client'
import { useState, useEffect } from 'react'

export default function TabletNotice() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only show on mobile screens (< 768px)
    if (window.innerWidth < 768 && !sessionStorage.getItem('tablet-notice-dismissed')) {
      const t = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('tablet-notice-dismissed', '1')
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 inset-x-4 z-50 transition-all duration-300"
      style={{
        transform: dismissed ? 'translateY(120%)' : 'translateY(0)',
        opacity: dismissed ? 0 : 1,
      }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3 shadow-2xl"
        style={{
          background: 'rgba(15,15,30,0.95)',
          border: '1px solid rgba(124,92,252,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">📱</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-snug">
            الجلسات مُصمَّمة للأجهزة اللوحية
          </p>
          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
            للأخصائيين: استخدم تابليت أو حاسوب للحصول على أفضل تجربة علاجية تفاعلية.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5 text-lg leading-none"
          aria-label="إغلاق"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
