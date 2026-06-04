'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'بيانات ولي الأمر' },
  { id: 2, label: 'بيانات الطفل' },
  { id: 3, label: 'اختيار الخطة' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [parent, setParent] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', country: '', password: '', confirmPassword: '',
  })

  const [child, setChild] = useState({
    firstName: '', lastName: '', birthDate: '',
    diagnosis: 'ADHD' as 'ADHD' | 'AUTISM' | 'ADHD+AUTISM' | 'OTHER',
    severityLevel: 1 as 1 | 2 | 3,
    visualSensitivity: 'medium' as 'low' | 'medium' | 'high',
    audioSensitivity: 'medium' as 'low' | 'medium' | 'high',
  })

  const [plan, setPlan] = useState('standard')

  async function handleSubmit() {
    if (parent.password !== parent.confirmPassword) {
      setError('كلمة المرور غير متطابقة')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent, child, plan }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/payment')
      } else {
        setError(data.error || 'حدث خطأ')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-brand-600 font-black text-2xl">أكاديمية أمين</Link>
          <p className="text-gray-500 text-sm mt-2">إنشاء حساب جديد</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                step === s.id ? 'bg-brand-600 text-white' :
                step > s.id  ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : <span className="ltr-num">{s.id}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {/* Step 1: Parent */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">بيانات ولي الأمر</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'firstName', label: 'الاسم الأول', placeholder: 'محمد' },
                  { key: 'lastName',  label: 'اسم العائلة', placeholder: 'الأمين' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
                    <input type="text"
                      value={parent[key as keyof typeof parent]}
                      onChange={e => setParent(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                <input type="email"
                  value={parent.email}
                  onChange={e => setParent(p => ({ ...p, email: e.target.value }))}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف (واتساب)</label>
                <input type="tel"
                  value={parent.phone}
                  onChange={e => setParent(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+216XXXXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ltr-num"
                  required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الدولة</label>
                <select
                  value={parent.country}
                  onChange={e => setParent(p => ({ ...p, country: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required>
                  <option value="">اختر دولتك</option>
                  {['تونس', 'المغرب', 'الجزائر', 'مصر', 'السعودية', 'الإمارات', 'قطر', 'الكويت', 'فرنسا', 'غيرها'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'password', label: 'كلمة المرور', placeholder: '••••••••' },
                  { key: 'confirmPassword', label: 'تأكيد كلمة المرور', placeholder: '••••••••' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
                    <input type="password"
                      value={parent[key as keyof typeof parent]}
                      onChange={e => setParent(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Child */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">بيانات الطفل</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'firstName', label: 'اسم الطفل', placeholder: 'سارة' },
                  { key: 'lastName',  label: 'اسم العائلة', placeholder: 'الأمين' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
                    <input type="text"
                      value={child[key as keyof typeof child] as string}
                      onChange={e => setChild(c => ({ ...c, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">تاريخ الميلاد</label>
                <input type="date"
                  value={child.birthDate}
                  onChange={e => setChild(c => ({ ...c, birthDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ltr-num"
                  required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">التشخيص</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ADHD', label: '🧠 ADHD فقط' },
                    { value: 'AUTISM', label: '🌈 طيف التوحد فقط' },
                    { value: 'ADHD+AUTISM', label: '🧩 ADHD + توحد' },
                    { value: 'OTHER', label: '📋 أخرى' },
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setChild(c => ({ ...c, diagnosis: value as typeof child.diagnosis }))}
                      className={`p-3 rounded-xl border-2 text-sm font-bold text-right transition-colors ${
                        child.diagnosis === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">درجة الشدة</label>
                <div className="flex gap-3">
                  {[
                    { v: 1, label: 'خفيف', color: 'bg-green-100 border-green-300 text-green-700' },
                    { v: 2, label: 'متوسط', color: 'bg-orange-100 border-orange-300 text-orange-700' },
                    { v: 3, label: 'شديد', color: 'bg-red-100 border-red-300 text-red-700' },
                  ].map(({ v, label, color }) => (
                    <button key={v} type="button"
                      onClick={() => setChild(c => ({ ...c, severityLevel: v as 1 | 2 | 3 }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        child.severityLevel === v
                          ? color + ' border-2'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">الحساسية البصرية</label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map(v => (
                    <button key={v} type="button"
                      onClick={() => setChild(c => ({ ...c, visualSensitivity: v as 'low' | 'medium' | 'high' }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors ${
                        child.visualSensitivity === v
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      {v === 'low' ? 'منخفضة' : v === 'medium' ? 'متوسطة' : 'مرتفعة'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">اختر خطة الاشتراك</h2>
              <div className="space-y-3">
                {[
                  { id: 'basic', name: 'الأساسي', price: 'XX', features: ['برنامج أسبوعي', 'تتبع التطور', 'تقرير شهري'] },
                  { id: 'standard', name: 'المتقدم', price: 'XX', features: ['برنامج مخصص', 'جلسة متابعة شهرية', 'واتساب مباشر'], recommended: true },
                  { id: 'premium', name: 'المتميز', price: 'XX', features: ['كل المزايا', 'جلستان شهرياً', 'تقارير يومية'] },
                ].map(({ id, name, price, features, recommended }) => (
                  <button key={id} type="button"
                    onClick={() => setPlan(id)}
                    className={`w-full text-right p-4 rounded-2xl border-2 transition-all ${
                      plan === id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          plan === id ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                        }`}>
                          {plan === id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="font-black text-gray-900">{name}</span>
                        {recommended && <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">مُوصى</span>}
                      </div>
                      <span className="font-black text-brand-600 ltr-num">{price} <span className="text-xs font-normal text-gray-500">د.ت/شهر</span></span>
                    </div>
                    <div className="flex flex-wrap gap-2 pr-7">
                      {features.map(f => (
                        <span key={f} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                السابق
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors">
                التالي
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className={`flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-brand-700'}`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إكمال التسجيل'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          لديك حساب؟{' '}
          <Link href="/parent/login" className="text-brand-600 font-bold hover:underline">سجل دخول</Link>
        </p>
      </div>
    </div>
  )
}
