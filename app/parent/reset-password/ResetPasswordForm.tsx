'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const invalidLink = !token || !email

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 15000)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
        signal: ctrl.signal,
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        router.push('/parent/login?reset=1')
      } else {
        setError(data.error || 'حدث خطأ، حاول مجدداً')
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setError('انتهت مهلة الاتصال — تحقق من اتصالك وحاول مجدداً')
      } else {
        setError('حدث خطأ في الاتصال')
      }
    } finally {
      clearTimeout(tid)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🔑
          </div>
          <h1 className="font-black text-xl text-gray-900">إعادة تعيين كلمة المرور</h1>
          <p className="text-gray-500 text-sm mt-1">أدخل كلمة مرورك الجديدة</p>
        </div>

        {invalidLink ? (
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-800 font-bold text-base">الرابط غير صالح</p>
              <p className="text-red-700 text-sm mt-2 leading-relaxed">
                هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.
              </p>
            </div>
            <Link
              href="/parent/forgot-password"
              className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              طلب رابط جديد
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تعيين كلمة المرور'}
            </button>

            <div className="text-center">
              <Link
                href="/parent/login"
                className="text-sm text-gray-500 hover:text-brand-600 hover:underline"
              >
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
