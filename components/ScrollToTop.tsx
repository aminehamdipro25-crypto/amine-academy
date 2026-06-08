'use client'
import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="العودة للأعلى"
      className="
        fixed bottom-6 left-6 z-50
        w-11 h-11 rounded-full
        bg-brand-600 hover:bg-brand-700 active:scale-95
        text-white shadow-lg shadow-brand-600/30
        flex items-center justify-center
        transition-all duration-200
        animate-in fade-in slide-in-from-bottom-2
      "
    >
      <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  )
}
