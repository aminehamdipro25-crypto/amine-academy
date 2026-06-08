'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Save, RefreshCw, CheckCircle, AlertCircle,
  DollarSign, Tag, Clock, Phone, TrendingDown,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/site-settings'

type PlanKey = 'basic' | 'standard' | 'premium'
type Currency = 'QAR' | 'TND'

const PLAN_LABELS: Record<PlanKey, string> = {
  basic:    'الأساسي',
  standard: 'المتقدم',
  premium:  'المتميز',
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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
  }, [fetchSettings])

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
    setSettings(prev => prev ? {
      ...prev,
      prices: {
        ...prev.prices,
        [plan]: { ...prev.prices[plan], [currency]: val },
      },
    } : prev)
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
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-brand-500" />
          أسعار الباقات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['basic', 'standard', 'premium'] as PlanKey[]).map(plan => (
            <div key={plan} className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <h3 className="font-black text-gray-800">{PLAN_LABELS[plan]}</h3>
              {(['QAR', 'TND'] as Currency[]).map(currency => {
                const base = settings.prices[plan][currency]
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
          ))}
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
              <Input
                type="number"
                value={settings.discountPct}
                onChange={v => {
                  const n = Math.min(50, Math.max(0, parseInt(v, 10) || 0))
                  setSettings(prev => prev ? { ...prev, discountPct: n } : prev)
                }}
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
              {(['basic', 'standard', 'premium'] as PlanKey[]).map(plan => (
                <div key={plan} className="text-center bg-white rounded-xl p-3 border border-brand-100">
                  <p className="text-xs text-gray-500 mb-1">{PLAN_LABELS[plan]}</p>
                  {(['QAR', 'TND'] as Currency[]).map(cur => {
                    const base = settings.prices[plan][cur]
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
              ))}
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
            <Input
              type="number"
              value={settings.offerDurationDays}
              onChange={v => {
                const n = Math.min(30, Math.max(1, parseInt(v, 10) || 1))
                setSettings(prev => prev ? { ...prev, offerDurationDays: n } : prev)
              }}
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
