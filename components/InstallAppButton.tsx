'use client'
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

// Chrome fires `beforeinstallprompt` once and its auto-banner is transient —
// it disappears on navigation/timeout and won't reappear for a long cooldown.
// We capture that event and expose our OWN install button, so the user can
// install whenever they want instead of chasing Chrome's flaky banner.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppButton({ className, label = 'ثبّت التطبيق' }: { className?: string; label?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already running as an installed app → nothing to offer.
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) { setInstalled(true); return }

    const onPrompt = (e: Event) => {
      e.preventDefault() // stop Chrome's auto-banner; we drive it ourselves
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Nothing to show if installed, or the browser never offered install
  // (e.g. iOS Safari, which has no beforeinstallprompt — users add via Share).
  if (installed || !deferred) return null

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // Whatever they chose, the event is single-use — clear it either way.
    setDeferred(null)
    if (outcome === 'accepted') setInstalled(true)
  }

  return (
    <button
      type="button"
      onClick={install}
      className={
        className ??
        'inline-flex items-center gap-2 font-black text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95'
      }
      style={className ? undefined : { background: '#6B46F0', boxShadow: '0 4px 20px rgba(107,70,240,0.30)' }}
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  )
}
