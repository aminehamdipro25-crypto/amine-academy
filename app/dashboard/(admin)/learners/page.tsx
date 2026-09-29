'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Plus, X, Trash2, RefreshCw, AlertCircle, Mail, Phone, Settings2, Save, KeyRound } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Teacher { id: string; name: string; role?: string }
interface Learner { id: string; name: string; email: string; phone: string; language: string; level: string; teacherId: string | null; teacherName: string | null; lastLoginAt: string | null }

const CEFR = ['unknown', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LANG: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', language: 'french', level: 'unknown', teacherId: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ level: 'unknown', teacherId: '', password: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, tRes] = await Promise.all([fetch('/api/admin/learners'), fetch('/api/admin/staff')])
      if (!lRes.ok || !tRes.ok) throw new Error('تعذّر التحميل')
      setLearners(await lRes.json())
      setTeachers((await tRes.json()).filter((s: Teacher) => s.role === 'language_teacher'))
      setError('')
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) { setFormError('الاسم والبريد وكلمة المرور مطلوبة'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/admin/learners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الإنشاء')
      setForm({ name: '', email: '', phone: '', password: '', language: 'french', level: 'unknown', teacherId: '' })
      setShowForm(false); await load()
    } catch (e) { setFormError((e as Error).message) } finally { setSaving(false) }
  }

  function openEdit(l: Learner) {
    if (editId === l.id) { setEditId(null); return }
    setEditId(l.id); setEdit({ level: l.level, teacherId: l.teacherId || '', password: '' })
  }
  async function saveEdit(id: string) {
    setBusyId(id)
    try {
      const body: Record<string, unknown> = { level: edit.level, teacherId: edit.teacherId || null }
      if (edit.password) body.password = edit.password
      const res = await fetch(`/api/admin/learners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setEditId(null); await load() }
    } finally { setBusyId(null) }
  }
  async function remove(id: string) {
    setBusyId(id)
    try { const res = await fetch(`/api/admin/learners/${id}`, { method: 'DELETE' }); if (res.ok) await load() }
    finally { setBusyId(null) }
  }

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-brand-500" /> متعلّمو اللغات</h1>
          <p className="text-gray-500 text-sm mt-1">أنشئ حسابات المتعلّمين، عيّن لكلٍّ أستاذاً ومستواه — ويدخل المتعلّم من بوّابته الخاصّة.</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError('') }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"><Plus className="w-4 h-4" /> متعلّم جديد</button>
      </motion.div>

      {error && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-800 text-sm font-medium">{error}</p></div>}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="font-black text-gray-900 text-lg">متعلّم جديد</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label><input type="email" dir="ltr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف</label><input dir="ltr" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة مرور مبدئيّة</label><input dir="ltr" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="6 أحرف على الأقل" className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">اللغة</label><select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={inputCls}>{Object.entries(LANG).map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">المستوى</label><select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={inputCls}>{CEFR.map(l => <option key={l} value={l}>{l === 'unknown' ? 'غير محدّد' : l}</option>)}</select></div>
              <div className="md:col-span-3"><label className="block text-sm font-bold text-gray-700 mb-1.5">الأستاذ المسند</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className={inputCls}>
                  <option value="">— بدون تعيين بعد —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {formError && <div className="md:col-span-3 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</div>}
              <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إنشاء الحساب</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        ) : learners.length === 0 ? (
          <div className="p-10 text-center text-gray-400"><GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm font-medium">لا متعلّمين بعد — أنشئ أوّل حساب</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {learners.map(l => (
              <div key={l.id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0">{l.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-gray-900 truncate">{l.name}</p>
                        <span className="text-[10px] font-black bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{l.level === 'unknown' ? 'غير محدّد' : l.level}</span>
                        <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{LANG[l.language] || l.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</span>
                        {l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>}
                        <span>{l.teacherName ? `الأستاذ: ${l.teacherName}` : 'بدون أستاذ'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(l)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${editId === l.id ? 'text-violet-700 bg-violet-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}><Settings2 className="w-3.5 h-3.5" /> تعديل</button>
                    <button onClick={() => remove(l.id)} disabled={busyId === l.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">{busyId === l.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} حذف</button>
                  </div>
                </div>

                <AnimatePresence>
                  {editId === l.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5">المستوى</label><select value={edit.level} onChange={e => setEdit(s => ({ ...s, level: e.target.value }))} className={inputCls}>{CEFR.map(x => <option key={x} value={x}>{x === 'unknown' ? 'غير محدّد' : x}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5">الأستاذ المسند</label><select value={edit.teacherId} onChange={e => setEdit(s => ({ ...s, teacherId: e.target.value }))} className={inputCls}><option value="">— بدون —</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1"><KeyRound className="w-3 h-3" /> كلمة مرور جديدة (اختياري)</label><input dir="ltr" value={edit.password} onChange={e => setEdit(s => ({ ...s, password: e.target.value }))} placeholder="اتركه فارغاً للإبقاء" className={inputCls} /></div>
                        <div className="md:col-span-3 flex justify-end"><button onClick={() => saveEdit(l.id)} disabled={busyId === l.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{busyId === l.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ</button></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
