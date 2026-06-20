'use client'
import { useEffect, useState } from 'react'
import { Home, Check, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { HomeEnvironment } from '@/lib/types'
import { useLang, tr } from '@/lib/i18n'

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

const SPACE_ICONS: Record<'small' | 'medium' | 'large', string> = { small: '🏠', medium: '🏡', large: '🏘️' }
const NOISE_ICONS: Record<'quiet' | 'moderate' | 'noisy', string> = { quiet: '🤫', moderate: '🔉', noisy: '📢' }
const TIME_ICONS: Record<'morning' | 'afternoon' | 'evening', string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' }
const AVAILABILITY_ICONS: Record<'always' | 'sometimes' | 'rarely', string> = { always: '✅', sometimes: '🕐', rarely: '⏳' }

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
  const { lang } = useLang()
  const t = tr[lang].parentHomeEnvironment
  const coachName = tr[lang].portal.common.coachName

  const spaceOptions: RadioOption[] = (['small', 'medium', 'large'] as const).map(v => ({
    value: v, label: t.spaceOptions[v].label, icon: SPACE_ICONS[v], desc: t.spaceOptions[v].desc,
  }))
  const equipmentOptions = (['ball', 'mat', 'rope', 'stick', 'none', 'other'] as const).map(v => ({
    value: v, label: t.equipmentOptions[v],
  }))
  const noiseOptions: RadioOption[] = (['quiet', 'moderate', 'noisy'] as const).map(v => ({
    value: v, label: t.noiseOptions[v].label, icon: NOISE_ICONS[v], desc: t.noiseOptions[v].desc,
  }))
  const sensoryOptions = (['bright-lights', 'loud-sounds', 'textures', 'smells'] as const).map(v => ({
    value: v, label: t.sensoryOptions[v],
  }))
  const timeOptions: RadioOption[] = (['morning', 'afternoon', 'evening'] as const).map(v => ({
    value: v, label: t.timeOptions[v].label, icon: TIME_ICONS[v], desc: t.timeOptions[v].desc,
  }))
  const availabilityOptions: RadioOption[] = (['always', 'sometimes', 'rarely'] as const).map(v => ({
    value: v, label: t.availabilityOptions[v].label, icon: AVAILABILITY_ICONS[v], desc: t.availabilityOptions[v].desc,
  }))

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
        throw new Error(d.error || t.saveFailedError)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.saveFailedRetry)
    } finally {
      setSaving(false)
    }
  }

  function patch<K extends keyof HomeEnvironment>(key: K, val: HomeEnvironment[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)' }}
      >
        <span className="text-3xl">🏠</span>
      </div>
      <p className="font-black text-sm" style={{ color: '#7C5CFC' }}>{t.loadingText}</p>
    </div>
  )

  return (
    <div className="space-y-5">

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
            {t.backToDashboard}
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              🏠
            </div>
            <div>
              <h1 className="font-black text-2xl text-white leading-tight">{t.pageTitle}</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {childName ? t.pageSubtitleWithChild(childName) : t.pageSubtitleNoChild}
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
          <p className={SECTION_LABEL}>{t.spaceLabel}</p>
          <p className={SECTION_HINT}>{t.spaceHint}</p>
          <RadioCards
            options={spaceOptions}
            value={form.spaceAvailable}
            onChange={v => patch('spaceAvailable', v as HomeEnvironment['spaceAvailable'])}
          />
        </div>

        {/* Section 2: Equipment */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.equipmentLabel}</p>
          <p className={SECTION_HINT}>{t.equipmentHint}</p>
          <MultiChips
            options={equipmentOptions}
            selected={form.equipment}
            onChange={v => patch('equipment', v)}
          />
        </div>

        {/* Section 3: Noise */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.noiseLabel}</p>
          <p className={SECTION_HINT}>{t.noiseHint}</p>
          <RadioCards
            options={noiseOptions}
            value={form.noiseLevel}
            onChange={v => patch('noiseLevel', v as HomeEnvironment['noiseLevel'])}
          />
        </div>

        {/* Section 4: Sensory issues */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.sensoryLabel}</p>
          <p className={SECTION_HINT}>{t.sensoryHint}</p>
          <MultiChips
            options={sensoryOptions}
            selected={form.sensoryIssues}
            onChange={v => patch('sensoryIssues', v)}
          />
        </div>

        {/* Section 5: Best time */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.timeLabel}</p>
          <p className={SECTION_HINT}>{t.timeHint}</p>
          <RadioCards
            options={timeOptions}
            value={form.bestTimeOfDay}
            onChange={v => patch('bestTimeOfDay', v as HomeEnvironment['bestTimeOfDay'])}
          />
        </div>

        {/* Section 6: Parent availability */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.availabilityLabel}</p>
          <p className={SECTION_HINT}>{t.availabilityHint}</p>
          <RadioCards
            options={availabilityOptions}
            value={form.parentAvailability}
            onChange={v => patch('parentAvailability', v as HomeEnvironment['parentAvailability'])}
          />
        </div>

        {/* Section 7: Notes */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <p className={SECTION_LABEL}>{t.notesLabel}</p>
          <p className={SECTION_HINT}>{t.notesHint(coachName)}</p>
          <textarea
            value={form.notes}
            onChange={e => patch('notes', e.target.value)}
            rows={4}
            placeholder={t.notesPlaceholder}
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
            ✅ {t.savedSuccess}
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
              {t.savingButton}
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {t.saveButton}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
