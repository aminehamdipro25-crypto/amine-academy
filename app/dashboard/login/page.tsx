'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, Users } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'owner' | 'staff'>('owner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [notice, setNotice] = useState('')

  // Owner recovery: the owner password is an env var, not a stored account, so
  // it can't be "reset" here — we email a single-use login link instead.
  async function requestRecovery() {
    if (recovering) return
    setRecovering(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/auth/admin/recover', { method: 'POST' })
      if (res.ok) {
        setNotice('تم إرسال رابط دخول لمرة واحدة إلى بريد الإدارة المسجَّل. الرابط صالح 15 دقيقة.')
      } else {
        const { error } = await res.json().catch(() => ({ error: '' }))
        setError(error || 'تعذّر إرسال رابط الاستعادة')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setRecovering(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(mode === 'owner' ? '/api/auth/admin' : '/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'owner' ? { password } : { email, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await res.json()
        setError(error || 'بيانات غير صحيحة')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-brand-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="font-black text-xl text-gray-900">لوحة تحكم المشرف</h1>
          <p className="text-gray-500 text-sm mt-1">أكاديمية أمين الدولية</p>
        </div>

        {/* Owner vs staff login mode */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('owner'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'owner' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400'}`}
          >
            <Shield className="w-3.5 h-3.5" /> مالك الموقع
          </button>
          <button
            type="button"
            onClick={() => { setMode('staff'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'staff' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400'}`}
          >
            <Users className="w-3.5 h-3.5" /> فريق العمل
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'staff' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="f-fefaf8">البريد الإلكتروني</label>
              <input id="f-fefaf8"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
                autoComplete="username"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="f-fa5aae">كلمة المرور</label>
            <input id="f-fa5aae"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {notice && (
            <div className="bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
              ✉️ {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'دخول'}
          </button>

          {mode === 'owner' && (
            <button
              type="button"
              onClick={requestRecovery}
              disabled={recovering}
              className="w-full text-center text-xs font-bold text-gray-400 hover:text-brand-600 disabled:opacity-50 transition-colors pt-1"
            >
              {recovering ? 'جارٍ الإرسال…' : 'نسيت كلمة المرور؟ أرسل رابط دخول للبريد'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
