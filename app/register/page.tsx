'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Check, AlertCircle } from 'lucide-react'

// ── Zod Schemas ────────────────────────────────────────────────
const step1Schema = z.object({
  firstName:       z.string().min(2, 'الاسم الأول مطلوب (حرفان على الأقل)'),
  lastName:        z.string().min(2, 'اسم العائلة مطلوب (حرفان على الأقل)'),
  email:           z.string().email('يرجى إدخال بريد إلكتروني صالح'),
  phone:           z.string().min(8, 'رقم الهاتف مطلوب (8 أرقام على الأقل)'),
  country:         z.string().min(1, 'يرجى اختيار دولتك'),
  password:        z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path:    ['confirmPassword'],
})

const step2Schema = z.object({
  childFirstName:    z.string().min(2, 'اسم الطفل مطلوب (حرفان على الأقل)'),
  childLastName:     z.string().optional(),
  birthDate:         z.string().min(1, 'تاريخ الميلاد مطلوب'),
  diagnosis:         z.enum(['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER'], {
    error: 'يرجى اختيار التشخيص',
  }),
  severityLevel:     z.number().int().min(1).max(3),
  visualSensitivity: z.enum(['low', 'medium', 'high']),
  audioSensitivity:  z.enum(['low', 'medium', 'high']),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>

// ── Field component ────────────────────────────────────────────
function Field({
  label, error, required = false, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-300 bg-red-50'
      : 'border-gray-200 focus:ring-brand-500'
  }`
}

const STEPS = [
  { id: 1, label: 'بيانات ولي الأمر' },
  { id: 2, label: 'بيانات الطفل' },
  { id: 3, label: 'اختيار الخطة' },
]

export default function RegisterPage() {
  const router  = useRouter()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [plan, setPlan]       = useState('standard')
  const formTopRef = useRef<HTMLDivElement>(null)

  // Persist step-2 data across navigations
  const [step2Data, setStep2Data] = useState<Partial<Step2>>({
    diagnosis: 'ADHD', severityLevel: 1,
    visualSensitivity: 'medium', audioSensitivity: 'medium',
  })

  const form1 = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '', lastName: '', email: '',
      phone: '', country: '', password: '', confirmPassword: '',
    },
  })

  const form2 = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    mode: 'onTouched',
    defaultValues: step2Data,
  })

  const scrollToTop = () =>
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  async function goNext() {
    if (step === 1) {
      const ok = await form1.trigger()
      if (!ok) { scrollToTop(); return }
      setStep(2)
      scrollToTop()
    } else if (step === 2) {
      const ok = await form2.trigger()
      if (!ok) { scrollToTop(); return }
      setStep2Data(form2.getValues())
      setStep(3)
      scrollToTop()
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setApiError('')
    const p = form1.getValues()
    const c = form2.getValues()
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 20000)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          parent: {
            firstName: p.firstName, lastName: p.lastName,
            email: p.email, phone: p.phone, country: p.country,
            password: p.password,
          },
          child: {
            firstName: c.childFirstName,
            lastName: c.childLastName || p.lastName,
            birthDate: c.birthDate,
            diagnosis: c.diagnosis,
            severityLevel: c.severityLevel,
            visualSensitivity: c.visualSensitivity,
            audioSensitivity: c.audioSensitivity,
          },
          plan,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/register/success')
      } else {
        setApiError(data.error || 'حدث خطأ — يرجى المحاولة مجدداً')
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setApiError('انتهت مهلة الاتصال — تحقق من اتصالك وحاول مجدداً')
      } else {
        setApiError('حدث خطأ في الاتصال')
      }
    } finally {
      clearTimeout(tid)
      setLoading(false)
    }
  }

  const { register: r1, formState: { errors: e1 } } = form1
  const { register: r2, formState: { errors: e2 }, watch: w2, setValue: sv2 } = form2

  const diag    = w2('diagnosis')
  const severity = w2('severityLevel')
  const visSens  = w2('visualSensitivity')
  const audSens  = w2('audioSensitivity')

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-10 px-4">
      <div className="max-w-xl mx-auto" ref={formTopRef}>
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

          {/* ── Step 1: Parent ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">بيانات ولي الأمر</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="الاسم الأول" error={e1.firstName?.message} required>
                  <input type="text" {...r1('firstName')} placeholder="محمد"
                    className={inputClass(!!e1.firstName)} />
                </Field>
                <Field label="اسم العائلة" error={e1.lastName?.message} required>
                  <input type="text" {...r1('lastName')} placeholder="الأمين"
                    className={inputClass(!!e1.lastName)} />
                </Field>
              </div>
              <Field label="البريد الإلكتروني" error={e1.email?.message} required>
                <input type="email" {...r1('email')} placeholder="example@email.com"
                  className={inputClass(!!e1.email)} dir="ltr" />
              </Field>
              <Field label="رقم الهاتف (واتساب)" error={e1.phone?.message} required>
                <input type="tel" {...r1('phone')} placeholder="+216XXXXXXXX"
                  className={`${inputClass(!!e1.phone)} ltr-num`} dir="ltr" />
              </Field>
              <Field label="الدولة" error={e1.country?.message} required>
                <select {...r1('country')} className={inputClass(!!e1.country)}>
                  <option value="">اختر دولتك</option>
                  {['تونس','المغرب','الجزائر','مصر','السعودية','الإمارات','قطر','الكويت','فرنسا','غيرها'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="كلمة المرور" error={e1.password?.message} required>
                  <input type="password" {...r1('password')} placeholder="••••••••"
                    className={inputClass(!!e1.password)} />
                </Field>
                <Field label="تأكيد كلمة المرور" error={e1.confirmPassword?.message} required>
                  <input type="password" {...r1('confirmPassword')} placeholder="••••••••"
                    className={inputClass(!!e1.confirmPassword)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Child ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">بيانات الطفل</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="اسم الطفل" error={e2.childFirstName?.message} required>
                  <input type="text" {...r2('childFirstName')} placeholder="سارة"
                    className={inputClass(!!e2.childFirstName)} />
                </Field>
                <Field label="اسم العائلة" error={e2.childLastName?.message}>
                  <input type="text" {...r2('childLastName')} placeholder="اختياري"
                    className={inputClass(!!e2.childLastName)} />
                </Field>
              </div>
              <Field label="تاريخ الميلاد" error={e2.birthDate?.message} required>
                <input type="date" {...r2('birthDate')}
                  className={`${inputClass(!!e2.birthDate)} ltr-num`} />
              </Field>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  التشخيص <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ADHD',       label: '🧠 ADHD فقط' },
                    { value: 'AUTISM',     label: '🌈 طيف التوحد فقط' },
                    { value: 'ADHD+AUTISM',label: '🧩 ADHD + توحد' },
                    { value: 'OTHER',      label: '📋 أخرى' },
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => sv2('diagnosis', value as Step2['diagnosis'], { shouldValidate: true })}
                      className={`p-3 rounded-xl border-2 text-sm font-bold text-right transition-colors ${
                        diag === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                {e2.diagnosis && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {e2.diagnosis.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">درجة الشدة</label>
                <div className="flex gap-3">
                  {[
                    { v: 1, label: 'خفيف',  cls: 'bg-green-100 border-green-400 text-green-700' },
                    { v: 2, label: 'متوسط', cls: 'bg-orange-100 border-orange-400 text-orange-700' },
                    { v: 3, label: 'شديد',  cls: 'bg-red-100 border-red-400 text-red-700' },
                  ].map(({ v, label, cls }) => (
                    <button key={v} type="button"
                      onClick={() => sv2('severityLevel', v as 1|2|3, { shouldValidate: true })}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        severity === v ? cls : 'border-gray-200 text-gray-500'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الحساسية البصرية</label>
                <div className="flex gap-3">
                  {(['low','medium','high'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => sv2('visualSensitivity', v, { shouldValidate: true })}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors ${
                        visSens === v
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      {v === 'low' ? 'منخفضة' : v === 'medium' ? 'متوسطة' : 'مرتفعة'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الحساسية السمعية</label>
                <div className="flex gap-3">
                  {(['low','medium','high'] as const).map(v => (
                    <button key={v} type="button"
                      onClick={() => sv2('audioSensitivity', v, { shouldValidate: true })}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors ${
                        audSens === v
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

          {/* ── Step 3: Plan ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-black text-xl text-gray-900 mb-5">اختر خطة الاشتراك</h2>
              <div className="space-y-3">
                {[
                  { id: 'basic',    name: 'الأساسي', qar: 179, tnd: 49,  features: ['برنامج أسبوعي مخصص','مكتبة 25+ تمرين','تقرير شهري'] },
                  { id: 'standard', name: 'المتقدم',  qar: 369, tnd: 99,  features: ['جلسة فيديو شهرية','واتساب مباشر','تقارير أسبوعية'], recommended: true },
                  { id: 'premium',  name: 'المتميز',  qar: 659, tnd: 179, features: ['جلستان بالفيديو','ABA + PEERS كامل','تقارير يومية'] },
                ].map(({ id, name, qar, tnd, features, recommended }) => (
                  <button key={id} type="button" onClick={() => setPlan(id)}
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
                      <div className="text-right">
                        <div className="font-black text-brand-600 ltr-num text-sm">{qar} <span className="text-xs font-normal text-gray-500">ر.ق / شهر</span></div>
                        <div className="text-gray-400 ltr-num text-xs">{tnd} <span className="text-xs">د.ت / شهر</span></div>
                      </div>
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

          {/* API Error */}
          {apiError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {apiError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => { setStep(s => s-1); scrollToTop() }}
                className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                السابق
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={goNext}
                className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors">
                التالي ←
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className={`flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-brand-700'}`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إكمال التسجيل ✓'}
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
