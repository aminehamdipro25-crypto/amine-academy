'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'

function RecoverInner() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!token || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin/recover/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        router.replace('/dashboard')
        return
      }
      const { error } = await res.json().catch(() => ({ error: '' }))
      setError(error || 'تعذّر تسجيل الدخول')
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-5">
        <ShieldCheck className="w-8 h-8 text-brand-600" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 text-center">استعادة الدخول</h1>
      <p className="text-gray-500 text-sm text-center mt-1.5">أكاديمية أمين الدولية</p>

      {!token ? (
        <div className="mt-6 rounded-2xl px-4 py-3 text-sm font-bold flex items-start gap-2"
             style={{ background: '#FEF2F2', color: '#B91C1C' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          الرابط ناقص أو غير صالح — اطلب رابطاً جديداً من صفحة الدخول.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 text-center mt-6 leading-relaxed">
            اضغط الزر لتأكيد دخولك. هذا الرابط يُستخدم <strong>مرة واحدة فقط</strong>.
          </p>
          <button
            onClick={confirm}
            disabled={busy}
            className="mt-6 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {busy ? 'جارٍ الدخول…' : 'تأكيد الدخول'}
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
          {error}
        </div>
      )}

      <a href="/dashboard/login" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-6">
        العودة لصفحة الدخول
      </a>
    </div>
  )
}

export default function AdminRecoverPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#2B1B6B' }}>
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-white/70" />}>
        <RecoverInner />
      </Suspense>
    </div>
  )
}
