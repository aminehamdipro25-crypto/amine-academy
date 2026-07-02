'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'

function ActivateForm() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/parent/login'), 3000)
      } else {
        setError(data.error || 'حدث خطأ')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-black text-2xl text-gray-900 mb-2">تم التفعيل! 🎉</h1>
        <p className="text-gray-500 text-sm mb-6">حسابك مفعّل الآن. سيتم تحويلك لتسجيل الدخول...</p>
        <Link href="/parent/login"
          className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors">
          تسجيل الدخول ←
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-brand-600" />
        </div>
        <h1 className="font-black text-2xl text-gray-900 text-center mb-2">تفعيل الحساب</h1>
        <p className="text-gray-500 text-sm text-center mb-6">أدخل الرمز المُرسل إلى بريدك الإلكتروني</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">رمز التفعيل (6 أرقام)</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full border border-gray-200 rounded-xl px-4 py-4 text-3xl font-black tracking-widest text-center text-brand-600 focus:ring-2 focus:ring-brand-300 focus:outline-none ltr-num"
              dir="ltr"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          <button type="submit" disabled={loading || code.length < 6}
            className="w-full bg-brand-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            تفعيل الحساب
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          لم تستلم الرمز؟{' '}
          <Link href="/parent/login" className="text-brand-600 font-bold hover:underline">
            سجّل الدخول مباشرة
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    }>
      <ActivateForm />
    </Suspense>
  )
}
