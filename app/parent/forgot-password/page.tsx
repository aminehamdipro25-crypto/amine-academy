'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 15000)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: ctrl.signal,
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSent(true)
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
            🔐
          </div>
          <h1 className="font-black text-xl text-gray-900">نسيت كلمة المرور؟</h1>
          <p className="text-gray-500 text-sm mt-1">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-green-800 font-bold text-base">تم إرسال البريد الإلكتروني!</p>
              <p className="text-green-700 text-sm mt-2 leading-relaxed">
                إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور. تحقق من صندوق الوارد والبريد المزعج.
              </p>
            </div>
            <Link
              href="/parent/login"
              className="block w-full text-center text-brand-600 font-bold text-sm hover:underline mt-2"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  required
                  disabled={loading}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إرسال رابط إعادة التعيين'}
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
