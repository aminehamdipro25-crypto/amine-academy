'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useLang, tr } from '@/lib/i18n'

export default function ParentPortalError({ error, reset }: { error: Error; reset: () => void }) {
  const { lang } = useLang()
  const t = tr[lang].parentPortalError
  useEffect(() => { console.error('[parent-portal-error]', error) }, [error])
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-100 shadow-sm">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-black text-gray-900 text-xl mb-2">{t.title}</h2>
        <p className="text-gray-500 text-sm mb-6">{error.message || t.defaultMessage}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {t.retryButton}
          </button>
          <Link
            href="/parent/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {t.homeButton}
          </Link>
        </div>
      </div>
    </div>
  )
}
