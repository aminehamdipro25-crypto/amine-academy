'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

function ResetPasswordForm() {
  const { lang }      = useLang()
  const t              = tr[lang].parentResetPassword
  const router       = useRouter()
  const params       = useSearchParams()
  const token        = params.get('token') || ''
  const email        = params.get('email') || ''

  const [password,   setPassword]   = useState('')
  const [password2,  setPassword2]  = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!token || !email) setError(t.invalidLinkInline)
  }, [token, email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) {
      setError(t.passwordMismatch)
      return
    }
    if (password.length < 8) {
      setError(t.passwordTooShort8)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/parent/login'), 3000)
      } else {
        setError(data.error || t.genericError)
      }
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-black text-xl text-gray-900 mb-2">{t.successTitle}</h2>
        <p className="text-gray-500 text-sm">{t.successSubtitle}</p>
        <Link href="/parent/login" className="inline-block mt-4 text-brand-600 font-bold text-sm hover:underline">
          {t.loginNow}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-black text-xl text-gray-900">{t.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-red-700 text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">{t.newPasswordLabel}</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.newPasswordPlaceholder8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pl-10"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">{t.confirmPasswordLabel}</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder={t.confirmPasswordPlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        {password && password2 && password !== password2 && (
          <p className="text-red-500 text-xs font-medium">{t.passwordMismatch}</p>
        )}

        <button
          type="submit"
          disabled={loading || !token || !email}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            : t.submitNew
          }
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-100">
        <Suspense fallback={<div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
