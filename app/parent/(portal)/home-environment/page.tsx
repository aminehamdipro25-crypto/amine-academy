'use client'
import { useEffect, useState } from 'react'
import { Home, Check, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { HomeEnvironment } from '@/lib/types'

// ─── Option helpers ────────────────────────────────────────────

interface RadioOption {
  value: string
  label: string
  icon: string
  desc?: string
}

function RadioCards({
  options,
  value,
  onChange,
}: {
  options: RadioOption[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rounded-2xl p-3 text-center transition-all duration-150 border-2 flex flex-col items-center gap-1.5"
            style={{
              background: selected ? '#F3EEFF' : '#FFFFFF',
              borderColor: selected ? '#7C5CFC' : '#E8DBFF',
              boxShadow: selected ? '0 0 0 3px rgba(124,92,252,0.12)' : 'none',
            }}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-xs font-black" style={{ color: selected ? '#6B46F0' : '#374151' }}>
              {opt.label}
            </span>
            {opt.desc && (
              <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function MultiChips({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className="px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all duration-150 flex items-center gap-1.5"
            style={{
              background: active ? '#7C5CFC' : '#FFFFFF',
              borderColor: active ? '#7C5CFC' : '#E8DBFF',
              color: active ? '#FFFFFF' : '#374151',
            }}
          >
            {active && <Check className="w-3 h-3" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Constants ─────────────────────────────────────────────────

const SPACE_OPTIONS: RadioOption[] = [
  { value: 'small', label: 'صغيرة', icon: '🏠', desc: 'أقل من 10م²' },
  { value: 'medium', label: 'متوسطة', icon: '🏡', desc: '10-25م²' },
  { value: 'large', label: 'كبيرة', icon: '🏘️', desc: 'أكثر من 25م²' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'ball', label: 'كرة' },
  { value: 'mat', label: 'حصيرة' },
  { value: 'rope', label: 'حبل' },
  { value: 'stick', label: 'عصا' },
  { value: 'none', label: 'لا شيء' },
  { value: 'other', label: 'أخرى' },
]

const NOISE_OPTIONS: RadioOption[] = [
  { value: 'quiet', label: 'هادئ', icon: '🤫', desc: 'بيئة صامتة' },
  { value: 'moderate', label: 'متوسط', icon: '🔉', desc: 'ضوضاء عادية' },
  { value: 'noisy', label: 'صاخب', icon: '📢', desc: 'ضوضاء عالية' },
]

const SENSORY_OPTIONS = [
  { value: 'bright-lights', label: 'الإضاءة الساطعة' },
  { value: 'loud-sounds', label: 'الأصوات العالية' },
  { value: 'textures', label: 'الملمس الخشن' },
  { value: 'smells', label: 'الروائح الحادة' },
]

const TIME_OPTIONS: RadioOption[] = [
  { value: 'morning', label: 'الصباح', icon: '🌅', desc: '8 ص - 12 م' },
  { value: 'afternoon', label: 'بعد الظهر', icon: '☀️', desc: '12 - 5 م' },
  { value: 'evening', label: 'المساء', icon: '🌙', desc: 'بعد 5 م' },
]

const AVAILABILITY_OPTIONS: RadioOption[] = [
  { value: 'always', label: 'دائماً', icon: '✅', desc: 'متاح طوال الوقت' },
  { value: 'sometimes', label: 'أحياناً', icon: '🕐', desc: 'فترات محددة' },
  { value: 'rarely', label: 'نادراً', icon: '⏳', desc: 'مشغول في العادة' },
]

const SECTION_LABEL = 'font-black text-gray-800 text-sm mb-3'
const SECTION_HINT  = 'text-gray-400 text-xs mb-3'

// ─── Default form values ────────────────────────────────────────
const DEFAULT_FORM: HomeEnvironment = {
  spaceAvailable: 'medium',
  equipment: [],
  noiseLevel: 'moderate',
  sensoryIssues: [],
  bestTimeOfDay: 'morning',
  parentAvailability: 'sometimes',
  notes: '',
}

// ─── Page ──────────────────────────────────────────────────────
export default function HomeEnvironmentPage() {
  const [form, setForm] = useState<HomeEnvironment>(DEFAULT_FORM)
  const [childId, setChildId] = useState<string | null>(null)
  const [childName, setChildName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/parent/home-environment')
      .then(r => r.json())
      .then(d => {
        if (d.homeEnvironment) setForm(d.homeEnvironment)
        if (d.studentId) setChildId(d.studentId)
        if (d.studentName) setChildName(d.studentName)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/parent/home-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, homeEnvironment: form }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'فشل الحفظ')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

  function patch<K extends keyof HomeEnvironment>(key: K, val: HomeEnvironment[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" dir="rtl">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)' }}
      >
        <span className="text-3xl">🏠</span>
      </div>
      <p className="font-black text-sm" style={{ color: '#7C5CFC' }}>جاري التحميل...</p>
    </div>
  )

  return (
    <div className="space-y-5" dir="rtl">

      {/* ══ Header ══ */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #5A32D9 0%, #7C5CFC 45%, #9A7BFD 100%)',
          boxShadow: '0 12px 40px -8px rgba(124,92,252,0.45)',
        }}
      >
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full -translate-x-16 -translate-y-16 pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full translate-x-10 translate-y-10 pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <div className="relative p-6">
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 text-xs font-bold mb-4 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة للوحة التحكم
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              🏠
            </div>
            <div>
              <h1 className="font-black text-2xl text-white leading-tight">بيئة المنزل</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {childName ? `تخصيص بيئة التمارين لـ ${childName}` : 'تخصيص بيئة التمارين'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Form ══ */}
      <div className="space-y-4">

        {/* Section 1: Space */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>المساحة المتاحة</p>
          <p className={SECTION_HINT}>حجم المساحة المخصصة للتمارين</p>
          <RadioCards
            options={SPACE_OPTIONS}
            value={form.spaceAvailable}
            onChange={v => patch('spaceAvailable', v as HomeEnvironment['spaceAvailable'])}
          />
        </div>

        {/* Section 2: Equipment */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>المعدات المتاحة</p>
          <p className={SECTION_HINT}>اختر كل ما يتوفر في منزلك</p>
          <MultiChips
            options={EQUIPMENT_OPTIONS}
            selected={form.equipment}
            onChange={v => patch('equipment', v)}
          />
        </div>

        {/* Section 3: Noise */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>مستوى الضوضاء في المنزل</p>
          <p className={SECTION_HINT}>البيئة الصوتية العامة في المنزل</p>
          <RadioCards
            options={NOISE_OPTIONS}
            value={form.noiseLevel}
            onChange={v => patch('noiseLevel', v as HomeEnvironment['noiseLevel'])}
          />
        </div>

        {/* Section 4: Sensory issues */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>الحساسيات الحسية</p>
          <p className={SECTION_HINT}>اختر أي حساسيات تؤثر على الطفل في بيئة المنزل</p>
          <MultiChips
            options={SENSORY_OPTIONS}
            selected={form.sensoryIssues}
            onChange={v => patch('sensoryIssues', v)}
          />
        </div>

        {/* Section 5: Best time */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>أفضل وقت للتمارين</p>
          <p className={SECTION_HINT}>متى يكون الطفل في أفضل حالاته؟</p>
          <RadioCards
            options={TIME_OPTIONS}
            value={form.bestTimeOfDay}
            onChange={v => patch('bestTimeOfDay', v as HomeEnvironment['bestTimeOfDay'])}
          />
        </div>

        {/* Section 6: Parent availability */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>مدى توفر ولي الأمر</p>
          <p className={SECTION_HINT}>كم من الوقت يمكنك مرافقة الطفل أثناء التمارين؟</p>
          <RadioCards
            options={AVAILABILITY_OPTIONS}
            value={form.parentAvailability}
            onChange={v => patch('parentAvailability', v as HomeEnvironment['parentAvailability'])}
          />
        </div>

        {/* Section 7: Notes */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>ملاحظات إضافية</p>
          <p className={SECTION_HINT}>أي معلومات أخرى تودّ مشاركتها مع الأستاذ أمين</p>
          <textarea
            value={form.notes}
            onChange={e => patch('notes', e.target.value)}
            rows={4}
            placeholder="مثال: الطفل يحب التمارين الهادئة، وغرفة النوم هي الأنسب للتمرين..."
            className="w-full rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none outline-none transition-all"
            style={{
              background: '#FAFAFA',
              border: '1.5px solid #E8DBFF',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#7C5CFC'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E8DBFF'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        {/* Error / success feedback */}
        {error && (
          <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm font-bold">
            ❌ {error}
          </div>
        )}
        {saved && (
          <div className="rounded-2xl px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
            ✅ تم حفظ بيئة المنزل بنجاح
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl py-4 text-white font-black text-base transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: saving ? '#C4B5FD' : 'linear-gradient(135deg, #6B46F0, #9A7BFD)',
            boxShadow: saving ? 'none' : '0 8px 24px -4px rgba(124,92,252,0.4)',
          }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              حفظ البيئة
            </>
          )}
        </button>
      </div>
    </div>
  )
}
