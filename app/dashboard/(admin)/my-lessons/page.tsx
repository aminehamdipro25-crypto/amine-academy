'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMarked, Plus, X, Trash2, RefreshCw, Link2, ChevronDown } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Lesson { id: string; title: string; level: string; content: string; resources: string; createdAt: string }
const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'

export default function MyLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', level: 'all', content: '', resources: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { const r = await fetch('/api/teacher/lessons'); if (r.ok) setLessons((await r.json()).lessons || []) }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!form.title.trim()) return
    setSaving(true)
    try {
      const r = await fetch('/api/teacher/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (r.ok) { setForm({ title: '', level: 'all', content: '', resources: '' }); setShowForm(false); await load() }
    } finally { setSaving(false) }
  }
  async function remove(id: string) {
    setBusyId(id)
    try { const r = await fetch(`/api/teacher/lessons/${id}`, { method: 'DELETE' }); if (r.ok) await load() }
    finally { setBusyId(null) }
  }

  const linkify = (text: string) => text.split('\n').filter(Boolean)

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BookMarked className="w-6 h-6 text-brand-500" /> دروسي الخاصّة</h1>
          <p className="text-gray-500 text-sm mt-1">مكتبتك الخاصّة — درّس بمنهجك ومادّتك بحرّيّة، إلى جانب دليل التدريس المرجعي.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"><Plus className="w-4 h-4" /> درس جديد</button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-black text-gray-900 text-lg">درس جديد</h2><button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1.5">عنوان الدرس</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className={inputCls} placeholder="مثال: الماضي المركّب — تمارين حواريّة" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">المستوى</label><select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={inputCls}>{LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'كل المستويات' : l}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">المحتوى / الخطّة</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} className={inputCls + ' resize-none'} placeholder="أهداف الدرس، الأنشطة، الملاحظات…" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">روابط ومراجع (رابط في كل سطر)</label><textarea value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))} rows={2} className={inputCls + ' resize-none'} dir="ltr" placeholder="https://…" /></div>
            <div className="flex justify-end"><button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} حفظ</button></div>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}</div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400"><BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">لا دروس بعد — أنشئ أوّل درس بمنهجك الخاص</p></div>
        ) : lessons.map(l => (
          <div key={l.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button onClick={() => setOpenId(openId === l.id ? null : l.id)} className="w-full flex items-center gap-3 p-4 text-right">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-brand-50 text-brand-600">{l.level === 'all' ? 'عام' : l.level}</span>
              <p className="flex-1 font-black text-gray-900 text-sm">{l.title}</p>
              <button onClick={e => { e.stopPropagation(); remove(l.id) }} disabled={busyId === l.id} className="text-red-400 hover:text-red-600 p-1.5">{busyId === l.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openId === l.id ? 'rotate-180' : ''}`} />
            </button>
            {openId === l.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                {l.content && <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{l.content}</p>}
                {l.resources && (
                  <div className="mt-3 space-y-1">
                    {linkify(l.resources).map((r, i) => (
                      <a key={i} href={r} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline" dir="ltr"><Link2 className="w-3.5 h-3.5" /> {r}</a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
