'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, CheckCircle, Mail } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { lang } = useLang()
  const t = tr[lang].parentForgotPassword
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success — don't reveal if email exists
      setSent(true)
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-100">
        <Link href="/parent/login"
          className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-medium mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" />
          {t.backToLogin}
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-black text-xl text-gray-900 mb-2">{t.sentTitle}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t.sentBodyPrefix} <span className="font-bold text-gray-700" dir="ltr">{email}</span> {t.sentBodySuffix}
            </p>
            <p className="text-gray-400 text-xs mt-3">{t.checkSpam}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-brand-600" />
              </div>
              <h1 className="font-black text-xl text-gray-900">{t.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                  dir="ltr"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  : t.submit
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
