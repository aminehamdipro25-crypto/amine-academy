'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { Languages as LangIcon, Mail, Lock, Loader2, LogIn } from 'lucide-react'

const PURPLE = '#6B46F0'

export default function LearnerLoginPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/learner/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'تعذّر الدخول')
      router.push('/learn')
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] flex flex-col" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center p-4 max-w-md w-full mx-auto">
        <Link href="/languages" className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: PURPLE }}><LangIcon className="w-4 h-4" /></div>
          {pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}
        </Link>
        <LangToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, #9A7BFD)` }}>
              <LogIn className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">{pickLang(lang, 'بوّابة المتعلّم', 'Learner Portal', 'Espace apprenant')}</h1>
            <p className="text-slate-500 text-sm mt-1">{pickLang(lang, 'ادخل لمتابعة مستواك وحصصك', 'Sign in to track your level and lessons', 'Connectez-vous pour suivre votre niveau et vos cours')}</p>
          </div>

          <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">{pickLang(lang, 'البريد الإلكتروني', 'Email', 'E-mail')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-300 absolute top-1/2 -translate-y-1/2 start-3" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr"
                  className="w-full ps-10 pe-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-start" placeholder="you@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">{pickLang(lang, 'كلمة المرور', 'Password', 'Mot de passe')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-300 absolute top-1/2 -translate-y-1/2 start-3" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr"
                  className="w-full ps-10 pe-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-start" placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs font-bold">⚠️ {error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-sm transition disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {pickLang(lang, 'دخول', 'Sign in', 'Se connecter')}
            </button>
            <p className="text-center text-slate-400 text-xs">
              {pickLang(lang, 'لا تملك حساباً؟ سيصلك من فريق أمين للّغات بعد التسجيل.', 'No account? The Amine Languages team sets it up after you enrol.', 'Pas de compte ? L’équipe vous le crée après l’inscription.')}
            </p>
          </form>

          <p className="text-center mt-5">
            <Link href="/languages" className="text-sm font-bold" style={{ color: PURPLE }}>{pickLang(lang, '← أمين للّغات', '← Amine Languages', '← Amine Langues')}</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
