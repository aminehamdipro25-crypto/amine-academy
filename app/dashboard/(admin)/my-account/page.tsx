'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserCog, KeyRound, Save, RefreshCw, CheckCircle2, Eye, EyeOff, Globe, Star } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Profile {
  name: string; email: string; languages?: string[]; teacherSharePct?: number
  bio?: string; headline?: string; experienceYears?: number; certifications?: string; approach?: string; publicVisible?: boolean
}
const LANG: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'

export default function MyAccountPage() {
  const [p, setP] = useState<Profile | null>(null)
  const [form, setForm] = useState({ headline: '', bio: '', experienceYears: '', certifications: '', approach: '', publicVisible: false })
  const [pwd, setPwd] = useState(''); const [showPwd, setShowPwd] = useState(false)
  const [savingP, setSavingP] = useState(false); const [savingPwd, setSavingPwd] = useState(false)
  const [okP, setOkP] = useState(false); const [okPwd, setOkPwd] = useState(false); const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const r = await fetch('/api/teacher/account'); if (!r.ok) return
    const d: Profile = await r.json(); setP(d)
    setForm({ headline: d.headline || '', bio: d.bio || '', experienceYears: d.experienceYears != null ? String(d.experienceYears) : '', certifications: d.certifications || '', approach: d.approach || '', publicVisible: !!d.publicVisible })
  }, [])
  useEffect(() => { load() }, [load])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingP(true); setOkP(false); setErr('')
    try {
      const r = await fetch('/api/teacher/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, experienceYears: form.experienceYears }) })
      if (r.ok) { setOkP(true); setTimeout(() => setOkP(false), 2000); load() } else setErr((await r.json()).error || 'تعذّر الحفظ')
    } finally { setSavingP(false) }
  }
  async function savePwd(e: React.FormEvent) {
    e.preventDefault(); if (pwd.length < 8) { setErr('كلمة المرور قصيرة جداً (8 أحرف على الأقل)'); return }
    setSavingPwd(true); setOkPwd(false); setErr('')
    try {
      const r = await fetch('/api/teacher/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) })
      if (r.ok) { setOkPwd(true); setPwd(''); setTimeout(() => setOkPwd(false), 2000) } else setErr((await r.json()).error || 'تعذّر التغيير')
    } finally { setSavingPwd(false) }
  }

  if (!p) return <div className="p-10 text-center text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>

  return (
    <motion.div className="space-y-6 max-w-3xl" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-brand-500" /> حسابي</h1>
        <p className="text-gray-500 text-sm mt-1">عدّل ملفّك العام وكلمة مرورك. (لغاتك ونسبتك يضبطها المدير.)</p>
      </motion.div>

      {err && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">{err}</div>}

      {/* Read-only summary */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black text-lg flex items-center justify-center">{p.name.charAt(0)}</div>
        <div className="flex-1"><p className="font-black text-gray-900">{p.name}</p><p className="text-xs text-gray-400" dir="ltr">{p.email}</p></div>
        <div className="flex items-center gap-2 text-xs font-bold">
          {(p.languages || []).map(l => <span key={l} className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{LANG[l] || l}</span>)}
          {p.teacherSharePct != null && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{p.teacherSharePct}% لك</span>}
        </div>
      </motion.div>

      {/* Public portfolio */}
      <motion.form variants={fadeUp} onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-black text-gray-900 flex items-center gap-2"><Globe className="w-5 h-5 text-brand-500" /> ملفّي العام (البورتفوليو)</h2>
        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">العنوان المختصر</label><input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className={inputCls} placeholder="مثال: أستاذة فرنسيّة معتمدة — تحضير DELF" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">سنوات الخبرة</label><input dir="ltr" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} className={inputCls} placeholder="8" /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer"><input type="checkbox" checked={form.publicVisible} onChange={e => setForm(f => ({ ...f, publicVisible: e.target.checked }))} className="w-4 h-4 accent-violet-600" /> إظهار ملفّي للعموم</label></div>
        </div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">نبذة عنك</label><textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className={inputCls + ' resize-none'} placeholder="خلفيّتك، شغفك بالتدريس…" /></div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الشهادات / الاعتمادات</label><input value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} className={inputCls} placeholder="مثال: ماجستير لغة فرنسيّة، DELF B2 examinateur" /></div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">أسلوبك في التدريس</label><textarea value={form.approach} onChange={e => setForm(f => ({ ...f, approach: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="كيف تُدرّس؟ فلسفتك، منهجك الخاص…" /></div>
        <div className="flex justify-end"><button type="submit" disabled={savingP} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{savingP ? <RefreshCw className="w-4 h-4 animate-spin" /> : okP ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} {okP ? 'حُفظ' : 'حفظ الملف'}</button></div>
      </motion.form>

      {/* Password */}
      <motion.form variants={fadeUp} onSubmit={savePwd} className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-brand-500" /> تغيير كلمة المرور</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]"><label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة مرور جديدة</label>
            <div className="relative"><input type={showPwd ? 'text' : 'password'} dir="ltr" value={pwd} onChange={e => setPwd(e.target.value)} className={inputCls + ' pl-10'} placeholder="8 أحرف على الأقل" />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <button type="submit" disabled={savingPwd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{savingPwd ? <RefreshCw className="w-4 h-4 animate-spin" /> : okPwd ? <CheckCircle2 className="w-4 h-4" /> : <Star className="w-4 h-4" />} {okPwd ? 'تم' : 'تغيير'}</button>
        </div>
      </motion.form>
    </motion.div>
  )
}
