'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'
import AcademyLogo from '@/components/shared/AcademyLogo'

// A dismissible "install the app" banner that appears shortly after the site
// opens — a friendlier, always-available alternative to Chrome's transient
// auto-banner. Remembers dismissal so it doesn't nag.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
const DISMISS_KEY = 'aa-install-banner-dismissed'
const DISMISS_DAYS = 7

export default function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Never intrude on a live therapy session.
    if (window.location.pathname.startsWith('/session/')) return

    // Already installed → never show.
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    // Recently dismissed → respect the cooldown.
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (t && Date.now() - t < DISMISS_DAYS * 86400000) return
    } catch { /* localStorage blocked — just proceed */ }

    // iOS Safari has no beforeinstallprompt — show Share-sheet instructions.
    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      const timer = window.setTimeout(() => { setIos(true); setShow(true) }, 2500)
      return () => window.clearTimeout(timer)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    const onInstalled = () => setShow(false)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
    setShow(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          // Centered horizontally so it clears the floating chat (bottom-left) and
          // accessibility (bottom-right) buttons; lifted above them on mobile.
          className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 w-[calc(100%-2rem)] max-w-md"
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl border border-brand-100 p-4 flex items-center gap-3"
            style={{ boxShadow: '0 20px 60px rgba(107,70,240,0.28)' }}
          >
            <div className="rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              <AcademyLogo size={48} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-sm sm:text-base whitespace-nowrap">ثبّت تطبيق أكاديمية أمين</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                {ios ? 'من زر المشاركة ⬆️ اختر «إضافة إلى الشاشة الرئيسية»' : 'وصول أسرع من شاشتك الرئيسية'}
              </p>
            </div>
            {!ios && (
              <button
                onClick={install}
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C5CFC, #6B46F0)' }}
              >
                <Download className="w-4 h-4" /> ثبّت
              </button>
            )}
            <button onClick={dismiss} aria-label="إغلاق" className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
