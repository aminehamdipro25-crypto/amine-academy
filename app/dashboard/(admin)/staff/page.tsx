'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCog, Plus, X, Trash2, KeyRound, CheckCircle, AlertCircle,
  RefreshCw, Eye, EyeOff, Power, Mail, Calendar, Languages, Percent, Coins,
  GraduationCap, Settings2, Save,
} from 'lucide-react'
import { staggerContainer, fadeUp, popIn, liftHover } from '@/lib/motion'

type StaffRole = 'therapist' | 'language_teacher'

interface StaffMember {
  id: string
  email: string
  name: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  role?: StaffRole
  languages?: string[]
  bio?: string
  hourlyRate?: number
  currency?: 'QAR' | 'TND'
  teacherSharePct?: number
}

const LANG_OPTIONS: { code: string; label: string }[] = [
  { code: 'french',  label: 'الفرنسيّة 🇫🇷' },
  { code: 'english', label: 'الإنجليزيّة 🇬🇧' },
  { code: 'spanish', label: 'الإسبانيّة 🇪🇸' },
  { code: 'arabic',  label: 'العربيّة' },
  { code: 'german',  label: 'الألمانيّة 🇩🇪' },
  { code: 'italian', label: 'الإيطاليّة 🇮🇹' },
]
const LANG_LABEL = Object.fromEntries(LANG_OPTIONS.map(l => [l.code, l.label]))

interface TFields {
  role: StaffRole
  languages: string[]
  hourlyRate: string
  currency: 'QAR' | 'TND'
  teacherSharePct: string
  bio: string
}
const emptyTFields = (): TFields => ({ role: 'language_teacher', languages: ['french'], hourlyRate: '', currency: 'QAR', teacherSharePct: '', bio: '' })

function tPayload(t: TFields) {
  return {
    role: t.role,
    languages: t.role === 'language_teacher' ? t.languages : [],
    hourlyRate: t.hourlyRate === '' ? undefined : Number(t.hourlyRate),
    currency: t.currency,
    teacherSharePct: t.teacherSharePct === '' ? undefined : Number(t.teacherSharePct),
    bio: t.bio,
  }
}

// ── Shared editor for the teacher/therapist attributes (create + edit) ──
function TeacherFields({ value, onChange }: { value: TFields; onChange: (t: TFields) => void }) {
  const set = (patch: Partial<TFields>) => onChange({ ...value, ...patch })
  const toggleLang = (code: string) =>
    set({ languages: value.languages.includes(code) ? value.languages.filter(c => c !== code) : [...value.languages, code] })

  return (
    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
      {/* Role */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">الدور</label>
        <select value={value.role} onChange={e => set({ role: e.target.value as StaffRole })}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="language_teacher">أستاذ لغة 🗣️</option>
          <option value="therapist">معالج (ADHD/توحّد)</option>
        </select>
      </div>

      {value.role === 'language_teacher' && (
        <>
          {/* Profit share */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> نسبة الأستاذ من الحصّة</label>
            <div className="relative">
              <input type="number" min={0} max={100} value={value.teacherSharePct} onChange={e => set({ teacherSharePct: e.target.value })}
                placeholder="مثال: 70" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {value.teacherSharePct ? `الأكاديمية تحتفظ بـ ${100 - Number(value.teacherSharePct)}%` : 'الباقي يذهب للأكاديمية'}
            </p>
          </div>

          {/* Hourly rate */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> أجر الساعة (اختياري)</label>
            <div className="flex gap-2">
              <input type="number" min={0} value={value.hourlyRate} onChange={e => set({ hourlyRate: e.target.value })}
                placeholder="0" dir="ltr"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <select value={value.currency} onChange={e => set({ currency: e.target.value as 'QAR' | 'TND' })}
                className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
                <option value="QAR">ر.ق</option>
                <option value="TND">د.ت</option>
              </select>
            </div>
          </div>

          {/* Languages */}
          <div className="md:col-span-3">
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1"><Languages className="w-3.5 h-3.5" /> اللغات التي يدرّسها</label>
            <div className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map(l => {
                const on = value.languages.includes(l.code)
                return (
                  <button type="button" key={l.code} onClick={() => toggleLang(l.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'}`}>
                    {l.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bio */}
          <div className="md:col-span-3">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">نبذة / التخصّص (اختياري)</label>
            <textarea value={value.bio} onChange={e => set({ bio: e.target.value })} rows={2} maxLength={600}
              placeholder="مثال: أستاذة فرنسيّة معتمدة، خبرة 8 سنوات، تحضير DELF"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
        </>
      )}
    </div>
  )
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [cFields, setCFields] = useState<TFields>(emptyTFields())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [pwdEditId, setPwdEditId] = useState<string | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [eFields, setEFields] = useState<TFields>(emptyTFields())
  const [eSaving, setESaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff')
      if (!res.ok) throw new Error('فشل تحميل قائمة فريق العمل')
      setStaff(await res.json())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ...tPayload(cFields) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب')
      setName(''); setEmail(''); setPassword(''); setCFields(emptyTFields())
      setShowCreate(false)
      await load()
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  function openDetails(member: StaffMember) {
    if (detailsId === member.id) { setDetailsId(null); return }
    setDetailsId(member.id)
    setEFields({
      role: member.role || 'therapist',
      languages: member.languages || [],
      hourlyRate: member.hourlyRate != null ? String(member.hourlyRate) : '',
      currency: member.currency || 'QAR',
      teacherSharePct: member.teacherSharePct != null ? String(member.teacherSharePct) : '',
      bio: member.bio || '',
    })
  }

  async function saveDetails(id: string) {
    setESaving(true)
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tPayload(eFields)),
      })
      if (res.ok) { setDetailsId(null); await load() }
    } finally {
      setESaving(false)
    }
  }

  async function toggleActive(member: StaffMember) {
    setBusyId(member.id)
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      if (res.ok) await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handlePasswordReset(id: string) {
    if (newPwd.length < 8) { setPwdError('كلمة المرور قصيرة جداً (8 أحرف على الأقل)'); return }
    setPwdSaving(true)
    setPwdError('')
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور')
      setPwdEditId(null)
      setNewPwd('')
    } catch (e) {
      setPwdError((e as Error).message)
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDeleteId(null)
        await load()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-brand-500" />
            فريق العمل — معالجون وأساتذة اللغات
          </h1>
          <p className="text-gray-500 text-sm mt-1">أنشئ حسابات المعالجين وأساتذة اللغات، حدّد لغاتهم ونسبتهم من الأرباح. صلاحياتهم محدودة — لا وصول للمدفوعات أو الإعدادات.</p>
        </div>
        <motion.button
          {...liftHover}
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة عضو
        </motion.button>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-lg">عضو جديد</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="مثال: سارة بن علي"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="example@email.com" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="8 أحرف على الأقل" dir="ltr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <TeacherFields value={cFields} onChange={setCFields} />

            {createError && (
              <div className="md:col-span-3 flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {createError}
              </div>
            )}

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit" disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
              </button>
            </div>
          </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff list */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">لا يوجد فريق عمل بعد — أضف أول عضو للبدء</p>
          </div>
        ) : (
          <motion.div className="divide-y divide-gray-100" variants={staggerContainer} initial="hidden" animate="show">
            <AnimatePresence initial={false}>
            {staff.map(member => {
              const isTeacher = member.role === 'language_teacher'
              return (
              <motion.div key={member.id} variants={popIn} exit={{ opacity: 0, scale: 0.95 }} {...liftHover} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${member.isActive ? (isTeacher ? 'bg-gradient-to-br from-violet-400 to-violet-700' : 'bg-gradient-to-br from-brand-400 to-brand-700') : 'bg-gray-300'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-gray-900 truncate">{member.name}</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 ${isTeacher ? 'bg-violet-100 text-violet-700' : 'bg-brand-50 text-brand-600'}`}>
                          {isTeacher ? <><GraduationCap className="w-2.5 h-2.5" /> أستاذ لغة</> : 'معالج'}
                        </span>
                        {!member.isActive && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">معطّل</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {member.lastLoginAt ? `آخر دخول: ${new Date(member.lastLoginAt).toLocaleDateString('ar-u-nu-latn')}` : 'لم يسجل الدخول بعد'}
                        </span>
                      </div>
                      {/* Teacher meta */}
                      {isTeacher && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {(member.languages || []).map(c => (
                            <span key={c} className="text-[11px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{LANG_LABEL[c] || c}</span>
                          ))}
                          {member.teacherSharePct != null && (
                            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Percent className="w-2.5 h-2.5" />{member.teacherSharePct}% للأستاذ
                            </span>
                          )}
                          {member.hourlyRate != null && (
                            <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              {member.hourlyRate} {member.currency === 'TND' ? 'د.ت' : 'ر.ق'}/ساعة
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openDetails(member)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${detailsId === member.id ? 'text-violet-700 bg-violet-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      التفاصيل
                    </button>
                    <button
                      onClick={() => { setPwdEditId(pwdEditId === member.id ? null : member.id); setNewPwd(''); setPwdError('') }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      كلمة مرور
                    </button>
                    <button
                      onClick={() => toggleActive(member)}
                      disabled={busyId === member.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        member.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {member.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    {confirmDeleteId === member.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100">إلغاء</button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={busyId === member.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        >
                          {busyId === member.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          تأكيد الحذف
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(member.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    )}
                  </div>
                </div>

                {/* Details editor */}
                <AnimatePresence>
                  {detailsId === member.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden"
                    >
                      <div className="mt-4 bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <TeacherFields value={eFields} onChange={setEFields} />
                        </div>
                        <div className="flex justify-end mt-3">
                          <button onClick={() => saveDetails(member.id)} disabled={eSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60">
                            {eSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            حفظ التفاصيل
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password reset */}
                <AnimatePresence>
                  {pwdEditId === member.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">كلمة مرور جديدة</label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                            placeholder="8 أحرف على الأقل" dir="ltr"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                          />
                          <button type="button" onClick={() => setShowNewPwd(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePasswordReset(member.id)}
                        disabled={pwdSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
                      >
                        {pwdSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        حفظ
                      </button>
                      {pwdError && <p className="text-red-600 text-xs font-medium w-full">{pwdError}</p>}
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )})}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
