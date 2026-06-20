'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useLang, tr } from '@/lib/i18n'

export default function StudentLoginPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = tr[lang].studentLoginPage
  const [form, setForm] = useState({ code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/student-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.code }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/student/dashboard')
        router.refresh()
      } else {
        setError(data.error || t.invalidCode)
      }
    } catch {
      setError(t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-400 to-calm-teal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center">
        {/* Big friendly icon */}
        <div className="text-7xl mb-4 animate-float inline-block">🌟</div>
        <h1 className="font-black text-2xl text-gray-900 mb-2">{t.welcome}</h1>
        <p className="text-gray-500 text-sm mb-8">{t.enterCode}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.code}
            onChange={e => setForm({ code: e.target.value.toUpperCase() })}
            placeholder="XXXXXX"
            maxLength={8}
            className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-2xl font-black text-center tracking-widest text-brand-600 focus:outline-none focus:border-brand-500 ltr-num"
            required
          />

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full bg-brand-600 hover:bg-brand-700 text-white font-black text-lg py-4 rounded-2xl transition-all hover:scale-105 ${loading ? 'opacity-60 cursor-not-allowed scale-100' : ''}`}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t.enterButton}
          </button>
        </form>

        <p className="text-gray-400 text-xs mt-6">
          {t.codeFromParent}
        </p>
      </div>
    </div>
  )
}
