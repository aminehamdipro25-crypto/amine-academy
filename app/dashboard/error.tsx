'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const { lang } = useLang()
  const t = tr[lang].dashboardError
  useEffect(() => { console.error('[dashboard-error]', error) }, [error])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-100 shadow-sm">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-black text-gray-900 text-xl mb-2">{t.title}</h2>
        <p className="text-gray-500 text-sm mb-1">{error.message || t.defaultMessage}</p>
        <p className="text-gray-400 text-xs mb-6">
          {t.healthCheckPrefix}{' '}
          <a href="/api/health" className="text-brand-600 underline" target="_blank">/api/health</a>
        </p>
        <button onClick={reset}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
          {t.retryButton}
        </button>
      </div>
    </div>
  )
}
