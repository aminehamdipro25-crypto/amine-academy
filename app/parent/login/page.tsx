'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function ParentLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 15000)
    try {
      const res = await fetch('/api/auth/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'parent' }),
        signal: ctrl.signal,
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/parent/dashboard')
      } else {
        setError(data.error || 'بيانات غير صحيحة')
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
            👪
          </div>
          <h1 className="font-black text-xl text-gray-900">بوابة أولياء الأمور</h1>
          <p className="text-gray-500 text-sm mt-1">تابع تطور طفلك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pl-10"
                required
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/parent/forgot-password" className="text-sm text-brand-600 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'دخول'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-brand-600 font-bold hover:underline">سجّل الآن</Link>
        </p>
      </div>
    </div>
  )
}
