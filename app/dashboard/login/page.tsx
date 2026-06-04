'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await res.json()
        setError(error || 'كلمة مرور خاطئة')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="font-black text-xl text-gray-900">لوحة تحكم المشرف</h1>
          <p className="text-gray-500 text-sm mt-1">أكاديمية أمين الدولية</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور</label>
            <input
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
