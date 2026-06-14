'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Settings, Save, RefreshCw, CheckCircle, AlertCircle,
  DollarSign, Tag, Clock, Phone, TrendingDown, BarChart2,
  Mail, Send, ExternalLink,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/site-settings'

interface EnvStatus {
  gmailConfigured: boolean
  gmailUser: string | null
  resendConfigured: boolean
  anthropicConfigured: boolean
  upstashConfigured: boolean
  baseUrl: string | null
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>
      {ok
        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
      {label}
    </div>
  )
}

type PlanKey = 'session' | 'weekly' | 'monthly'
type Currency = 'QAR' | 'TND'

const PLAN_LABELS: Record<PlanKey, string> = {
  session: 'الحصة المفردة',
  weekly:  'الباقة الأسبوعية',
  monthly: 'الباقة الشهرية',
}

const PLAN_PERIOD: Record<PlanKey, string> = {
  session: '/ حصة',
  weekly:  '/ أسبوع',
  monthly: '/ شهر',
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { QAR: 'ر.ق', TND: 'د.ت' }

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  placeholder,
  suffix,
}: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  suffix?: string
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
        style={suffix ? { paddingLeft: '3rem' } : {}}
        dir="ltr"
      />
      {suffix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
          {suffix}
        </span>
      )}
    </div>
  )
}

function NumberField({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  suffix,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  const [str, setStr] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setStr(String(value))
  }, [value])

  function handleChange(raw: string) {
    setStr(raw)
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= min && n <= max) onChange(n)
  }

  function handleBlur() {
    focused.current = false
    const n = parseInt(str, 10)
    if (isNaN(n) || str.trim() === '') {
      setStr(String(value))
    } else {
      const clamped = Math.min(max, Math.max(min, n))
      setStr(String(clamped))
      onChange(clamped)
    }
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={str}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { focused.current = true }}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
        style={suffix ? { paddingLeft: '3rem' } : {}}
        dir="ltr"
      />
      {suffix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
          {suffix}
        </span>
      )}
    </div>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Email diagnostics
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [testEmailState, setTestEmailState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [testEmailMsg, setTestEmailMsg] = useState('')

  const fetchEnvStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/test-email')
      if (res.ok) setEnvStatus(await res.json())
    } catch { /* silent */ }
  }, [])

  async function sendTestEmail() {
    const to = testEmailTo.trim() || envStatus?.gmailUser?.replace(/\*+/, '') || ''
    if (!to.includes('@')) { setTestEmailMsg('أدخل بريداً صالحاً'); setTestEmailState('error'); return }
    setTestEmailState('sending')
    setTestEmailMsg('')
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailTo || undefined }),
      })
      const data = await res.json()
      if (data.ok) {
        setTestEmailState('ok')
        setTestEmailMsg(`تم الإرسال إلى ${data.to}`)
      } else {
        setTestEmailState('error')
        setTestEmailMsg(data.error || 'فشل الإرسال')
      }
    } catch {
      setTestEmailState('error')
      setTestEmailMsg('خطأ في الاتصال بالخادم')
    }
  }

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('فشل تحميل الإعدادات')
      const data: SiteSettings = await res.json()
      setSettings(data)
    } catch (e) {
      setErrorMsg((e as Error).message)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchEnvStatus()
  }, [fetchSettings, fetchEnvStatus])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'فشل الحفظ')
      }
      const updated: SiteSettings = await res.json()
      setSettings(updated)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setErrorMsg((e as Error).message)
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  function updatePrice(plan: PlanKey, currency: Currency, raw: string) {
    const num = parseInt(raw, 10)
    const val = isNaN(num) ? 0 : Math.max(0, num)
    setSettings(prev => {
      if (!prev) return prev
      const prices = prev.prices as Record<PlanKey, { QAR: number; TND: number }>
      return {
        ...prev,
        prices: {
          ...prices,
          [plan]: { ...(prices[plan] ?? {}), [currency]: val },
        },
      }
    })
  }

  function discountedPrice(base: number): number | null {
    if (!settings || settings.discountPct <= 0) return null
    return Math.round(base * (1 - settings.discountPct / 100))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-800 text-sm font-medium">{errorMsg || 'تعذّر تحميل الإعدادات'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-500" />
            إعدادات الموقع
          </h1>
          <p className="text-gray-500 text-sm mt-1">تحكم في الأسعار والعروض والإعدادات العامة</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'جاري الحفظ…' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {status === 'success' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 text-sm font-medium">تم حفظ الإعدادات بنجاح</p>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Prices section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-1 flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-brand-500" />
          أسعار الاشتراك
        </h2>
        <p className="text-xs text-gray-400 mb-5">نفس المزايا الكاملة في كل خيار — الفرق فقط في طريقة الدفع</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['session', 'weekly', 'monthly'] as PlanKey[]).map(plan => {
            const prices = settings.prices as Record<PlanKey, { QAR: number; TND: number }>
            return (
              <div key={plan} className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-black text-gray-800">{PLAN_LABELS[plan]}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{PLAN_PERIOD[plan]}</p>
                </div>
                {(['QAR', 'TND'] as Currency[]).map(currency => {
                  const base = prices[plan]?.[currency] ?? 0
                  const discounted = discountedPrice(base)
                  return (
                    <Field key={currency} label={`السعر (${CURRENCY_SYMBOLS[currency]})`}>
                      <Input
                        type="number"
                        value={base}
                        onChange={v => updatePrice(plan, currency, v)}
                        min={0}
                        step={1}
                        suffix={CURRENCY_SYMBOLS[currency]}
                      />
                      {discounted !== null && (
                        <p className="text-xs mt-1 text-brand-600 font-medium">
                          بعد الخصم:{' '}
                          <span className="font-black ltr-num">{discounted}</span>{' '}
                          {CURRENCY_SYMBOLS[currency]}
                          {' '}
                          <span className="text-gray-400 line-through ltr-num">{base}</span>
                        </p>
                      )}
                    </Field>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Discount section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <TrendingDown className="w-5 h-5 text-red-500" />
          إعدادات الخصم
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="نسبة الخصم (%)">
            <div className="space-y-2">
              <NumberField
                value={settings.discountPct}
                onChange={n => setSettings(prev => prev ? { ...prev, discountPct: n } : prev)}
                min={0}
                max={50}
                step={1}
                suffix="%"
              />
              <input
                type="range"
                min={0}
                max={50}
                value={settings.discountPct}
                onChange={e => setSettings(prev => prev ? { ...prev, discountPct: parseInt(e.target.value, 10) } : prev)}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>بدون خصم</span>
                <span className="font-bold text-brand-600">{settings.discountPct}% خصم</span>
                <span>50%</span>
              </div>
            </div>
          </Field>

          <Field label="نص الخصم (العلامة التجارية)">
            <input
              type="text"
              value={settings.discountLabel}
              onChange={e => setSettings(prev => prev ? { ...prev, discountLabel: e.target.value } : prev)}
              placeholder="عرض التسجيل المبكر"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              dir="rtl"
            />
            {settings.discountLabel && settings.discountPct > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Tag className="w-3 h-3" />
                {settings.discountLabel} — {settings.discountPct}% خصم
              </div>
            )}
          </Field>
        </div>

        {settings.discountPct > 0 && (
          <div className="mt-5 bg-brand-50 rounded-2xl p-4">
            <p className="text-sm font-black text-brand-700 mb-3">معاينة الأسعار بعد الخصم:</p>
            <div className="grid grid-cols-3 gap-3">
              {(['session', 'weekly', 'monthly'] as PlanKey[]).map(plan => {
                const prices = settings.prices as Record<PlanKey, { QAR: number; TND: number }>
                return (
                  <div key={plan} className="text-center bg-white rounded-xl p-3 border border-brand-100">
                    <p className="text-xs text-gray-500 mb-0.5 font-bold">{PLAN_LABELS[plan]}</p>
                    <p className="text-[10px] text-gray-400 mb-1">{PLAN_PERIOD[plan]}</p>
                    {(['QAR', 'TND'] as Currency[]).map(cur => {
                      const base = prices[plan]?.[cur] ?? 0
                      const disc = Math.round(base * (1 - settings.discountPct / 100))
                      return (
                        <p key={cur} className="text-xs">
                          <span className="font-black text-brand-700 ltr-num">{disc}</span>
                          <span className="text-gray-400 mx-1 line-through ltr-num">{base}</span>
                          <span className="text-gray-400">{CURRENCY_SYMBOLS[cur]}</span>
                        </p>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Countdown / offer duration */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-orange-500" />
          مدة العرض (العد التنازلي)
        </h2>
        <div className="max-w-sm space-y-2">
          <Field label="المدة بالأيام">
            <NumberField
              value={settings.offerDurationDays}
              onChange={n => setSettings(prev => prev ? { ...prev, offerDurationDays: n } : prev)}
              min={1}
              max={30}
              step={1}
              suffix="يوم"
            />
          </Field>
          <input
            type="range"
            min={1}
            max={30}
            value={settings.offerDurationDays}
            onChange={e => setSettings(prev => prev ? { ...prev, offerDurationDays: parseInt(e.target.value, 10) } : prev)}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>يوم واحد</span>
            <span className="font-bold text-orange-600">{settings.offerDurationDays} أيام</span>
            <span>30 يوماً</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            العد التنازلي سيبدأ من تاريخ أول زيارة للمستخدم وينتهي بعد {settings.offerDurationDays} أيام.
          </p>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <Phone className="w-5 h-5 text-green-500" />
          رقم واتساب التواصل
        </h2>
        <div className="max-w-sm">
          <Field label="الرقم مع رمز الدولة">
            <Input
              type="tel"
              value={settings.whatsappNumber}
              onChange={v => setSettings(prev => prev ? { ...prev, whatsappNumber: v } : prev)}
              placeholder="+9741234567"
            />
          </Field>
          <p className="text-xs text-gray-400 mt-1.5">
            مثال: <span className="font-mono ltr-num">+9741234567</span>
          </p>
        </div>
      </div>

      {/* Sessions per package */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-1 flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-brand-500" />
          عدد الحصص في كل حزمة
        </h2>
        <p className="text-xs text-gray-400 mb-5">يظهر على بطاقات الأسعار — يُحدَّد السعر لكل حصة تلقائياً بناءً على هذه الأرقام</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
          <Field label="حصص / أسبوع (الباقة الأسبوعية)">
            <div className="space-y-2">
              <NumberField
                value={settings.sessionsPerWeek ?? 4}
                onChange={n => setSettings(prev => prev ? { ...prev, sessionsPerWeek: n } : prev)}
                min={1}
                max={20}
                step={1}
                suffix="حصة"
              />
              <p className="text-xs text-gray-400">
                سعر الحصة الواحدة:{' '}
                <span className="font-black text-brand-600 ltr-num">
                  {Math.round((settings.prices as Record<PlanKey, { QAR: number; TND: number }>).weekly?.QAR / (settings.sessionsPerWeek ?? 4))} ر.ق
                </span>{' / '}
                <span className="font-black text-brand-600 ltr-num">
                  {Math.round((settings.prices as Record<PlanKey, { QAR: number; TND: number }>).weekly?.TND / (settings.sessionsPerWeek ?? 4))} د.ت
                </span>
              </p>
            </div>
          </Field>
          <Field label="حصص / شهر (الباقة الشهرية)">
            <div className="space-y-2">
              <NumberField
                value={settings.sessionsPerMonth ?? 16}
                onChange={n => setSettings(prev => prev ? { ...prev, sessionsPerMonth: n } : prev)}
                min={1}
                max={100}
                step={1}
                suffix="حصة"
              />
              <p className="text-xs text-gray-400">
                سعر الحصة الواحدة:{' '}
                <span className="font-black text-brand-600 ltr-num">
                  {Math.round((settings.prices as Record<PlanKey, { QAR: number; TND: number }>).monthly?.QAR / (settings.sessionsPerMonth ?? 16))} ر.ق
                </span>{' / '}
                <span className="font-black text-brand-600 ltr-num">
                  {Math.round((settings.prices as Record<PlanKey, { QAR: number; TND: number }>).monthly?.TND / (settings.sessionsPerMonth ?? 16))} د.ت
                </span>
              </p>
            </div>
          </Field>
        </div>
      </div>

      {/* Landing page stats */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-2 flex items-center gap-2 text-lg">
          <BarChart2 className="w-5 h-5 text-brand-500" />
          إحصائيات الصفحة الرئيسية
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          هذه الأرقام تظهر للزوار — ضع أرقامك الحقيقية فقط لبناء الثقة.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="عدد الأطفال المستفيدين">
            <Input
              value={settings.stats?.childrenCount ?? ''}
              onChange={v => setSettings(prev => prev ? { ...prev, stats: { ...prev.stats!, childrenCount: v } } : prev)}
              placeholder="12"
            />
          </Field>
          <Field label="نسبة رضا الأولياء">
            <Input
              value={settings.stats?.satisfactionPct ?? ''}
              onChange={v => setSettings(prev => prev ? { ...prev, stats: { ...prev.stats!, satisfactionPct: v } } : prev)}
              placeholder="97%"
            />
          </Field>
          <Field label="سنوات الخبرة">
            <Input
              value={settings.stats?.yearsExperience ?? ''}
              onChange={v => setSettings(prev => prev ? { ...prev, stats: { ...prev.stats!, yearsExperience: v } } : prev)}
              placeholder="+5"
            />
          </Field>
          <Field label="عدد البروتوكولات العلمية">
            <Input
              value={settings.stats?.protocolsCount ?? ''}
              onChange={v => setSettings(prev => prev ? { ...prev, stats: { ...prev.stats!, protocolsCount: v } } : prev)}
              placeholder="+25"
            />
          </Field>
          <Field label="مدة الجلسة (دقيقة)">
            <Input
              value={settings.stats?.sessionMinutes ?? ''}
              onChange={v => setSettings(prev => prev ? { ...prev, stats: { ...prev.stats!, sessionMinutes: v } } : prev)}
              placeholder="45"
            />
          </Field>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-4">
          ⚠️ ضع أرقاماً حقيقية فقط — الأرقام الوهمية تضر بثقة العملاء وقد تعرّضك لمشاكل قانونية.
        </p>
      </div>

      {/* Email & System diagnostics */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <Mail className="w-5 h-5 text-blue-500" />
          تشخيص البريد الإلكتروني والبيئة
        </h2>

        {/* Env var status grid */}
        {envStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Gmail</p>
              <StatusBadge ok={envStatus.gmailConfigured} label={envStatus.gmailConfigured ? (envStatus.gmailUser || 'مُعدّ') : 'غير مُعدّ'} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Upstash Redis</p>
              <StatusBadge ok={envStatus.upstashConfigured} label={envStatus.upstashConfigured ? 'متصل' : 'غير مُعدّ'} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Anthropic AI</p>
              <StatusBadge ok={envStatus.anthropicConfigured} label={envStatus.anthropicConfigured ? 'مُعدّ' : 'غير مُعدّ'} />
            </div>
          </div>
        ) : (
          <div className="h-20 bg-gray-50 rounded-xl animate-pulse mb-6" />
        )}

        {/* Warning if Gmail not configured */}
        {envStatus && !envStatus.gmailConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-amber-800 font-bold text-sm mb-2">البريد غير مُعدّ في Vercel</p>
            <p className="text-amber-700 text-xs leading-relaxed mb-3">
              متغيرات <code className="bg-amber-100 px-1 rounded">GMAIL_USER</code> و{' '}
              <code className="bg-amber-100 px-1 rounded">GMAIL_APP_PASSWORD</code> مفقودة في بيئة الإنتاج.
              لهذا السبب لا تصل رسائل "نسيت كلمة المرور" إلى المستخدمين.
            </p>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              افتح Vercel Dashboard ← Project ← Settings ← Environment Variables
            </a>
            <div className="mt-3 bg-white border border-amber-200 rounded-lg p-3 space-y-1 font-mono text-xs text-gray-700">
              <p><span className="text-amber-600 font-bold">GMAIL_USER</span> = amine.hamdi.pro25@gmail.com</p>
              <p><span className="text-amber-600 font-bold">GMAIL_APP_PASSWORD</span> = [كلمة مرور تطبيق Gmail الخاصة بك]</p>
              <p><span className="text-amber-600 font-bold">UPSTASH_REDIS_REST_URL</span> = [رابط Upstash]</p>
              <p><span className="text-amber-600 font-bold">UPSTASH_REDIS_REST_TOKEN</span> = [مفتاح Upstash]</p>
              <p><span className="text-amber-600 font-bold">AUTH_SECRET</span> = [سر المصادقة]</p>
              <p><span className="text-amber-600 font-bold">ANTHROPIC_API_KEY</span> = [مفتاح Claude AI]</p>
            </div>
          </div>
        )}

        {/* Test email form */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-700">إرسال بريد اختباري</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmailTo}
              onChange={e => setTestEmailTo(e.target.value)}
              placeholder="اتركه فارغاً لإرساله إلى GMAIL_USER"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              dir="ltr"
            />
            <button
              onClick={sendTestEmail}
              disabled={testEmailState === 'sending'}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {testEmailState === 'sending'
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              إرسال
            </button>
          </div>
          {testEmailState === 'ok' && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              {testEmailMsg}
            </div>
          )}
          {testEmailState === 'error' && (
            <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="break-all">{testEmailMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white font-bold transition-colors disabled:opacity-60"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'جاري الحفظ…' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}
