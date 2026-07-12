'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library, Plus, Edit2, Trash2, X, Save, ImagePlus, Loader2,
  ArrowUp, ArrowDown, RefreshCw, BookOpen, HelpCircle,
} from 'lucide-react'
import type { Story, StoryQuestion } from '@/lib/types'
import { parseStoryText } from '@/lib/stories-data'

// ── Presets — quick-pick tools so the specialist rarely needs to type raw
// hex/emoji values, without the overhead of a full color/emoji picker library.
const ACCENT_PRESETS = ['#F59E0B', '#22C55E', '#38BDF8', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6', '#6366F1']
const ICON_PRESETS = ['🦁', '🐇', '🐻', '🦆', '🐱', '🐶', '🐸', '🐘', '🦋', '🌟', '📚', '🏠', '⚽', '🎨', '🐦', '🐝']
const WORD_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#0EA5E9', '#8B5CF6', '#EC4899']
const DIFF_OPTIONS: { v: 1 | 2 | 3; label: string }[] = [{ v: 1, label: 'سهل' }, { v: 2, label: 'متوسط' }, { v: 3, label: 'متقدّم' }]

interface EditForm {
  title: string
  icon: string
  accent: string
  diff: 1 | 2 | 3
  pages: string[]
  pageImages: (string | null)[]
  questions: StoryQuestion[]
}

const emptyForm = (): EditForm => ({
  title: '', icon: '📖', accent: '#6B46F0', diff: 1,
  pages: [''], pageImages: [null],
  questions: [{ q: '', choices: ['', ''], correct: 0 }],
})

// Renders story-page text with inline `{{word|#hex}}` color markup applied —
// used for the live preview inside the editor.
function ColoredPreview({ text }: { text: string }) {
  if (!text.trim()) return <span className="text-gray-300">ستظهر معاينة النص هنا…</span>
  return (
    <>
      {parseStoryText(text).map((seg, i) =>
        seg.color ? <span key={i} style={{ color: seg.color, fontWeight: 900 }}>{seg.text}</span> : <span key={i}>{seg.text}</span>
      )}
    </>
  )
}

export default function StoryLibraryAdminPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [urlDrafts, setUrlDrafts] = useState<Record<number, string>>({})
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stories')
      const data = await res.json().catch(() => ({}))
      setStories(data.stories ?? [])
    } catch {
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const editorOpen = editingId !== null

  function openNew() {
    setForm(emptyForm())
    setIsNew(true)
    setSaveError('')
    setUploadError('')
    setEditingId('__new__')
  }
  function openEdit(s: Story) {
    setForm({
      title: s.title,
      icon: s.icon,
      accent: s.accent,
      diff: s.diff,
      pages: s.pages.length ? [...s.pages] : [''],
      pageImages: s.pages.map((_, i) => s.pageImages?.[i] ?? null),
      questions: s.questions.length ? s.questions.map(q => ({ ...q, choices: [...q.choices] })) : [{ q: '', choices: ['', ''], correct: 0 }],
    })
    setIsNew(false)
    setSaveError('')
    setUploadError('')
    setEditingId(s.id)
  }
  function closeEditor() { setEditingId(null) }

  async function handleSave() {
    if (!form.title.trim()) { setSaveError('أدخل عنوان القصة'); return }
    if (!form.pages.some(p => p.trim())) { setSaveError('أضف نص صفحة واحدة على الأقل'); return }
    const badQuestion = form.questions.find(q => q.q.trim() && q.choices.filter(c => c.trim()).length < 2)
    if (badQuestion) { setSaveError('كل سؤال يحتاج نصّاً وخيارين على الأقل'); return }

    setSaving(true); setSaveError('')
    try {
      const payload = {
        title: form.title.trim(),
        icon: form.icon,
        accent: form.accent,
        diff: form.diff,
        pages: form.pages,
        pageImages: form.pageImages,
        questions: form.questions.filter(q => q.q.trim() && q.choices.filter(c => c.trim()).length >= 2),
      }
      const url = isNew ? '/api/admin/stories' : `/api/admin/stories/${editingId}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setSaveError(data.error || 'تعذّر الحفظ'); return }
      await load()
      closeEditor()
    } catch {
      setSaveError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذه القصة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' })
      await load()
      if (editingId === id) closeEditor()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSeed(force: boolean) {
    setSeeding(true); setSeedMsg('')
    try {
      const res = await fetch('/api/admin/stories/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json().catch(() => ({}))
      setSeedMsg(data.message || 'حدث خطأ')
      if (data.ok) await load()
    } catch {
      setSeedMsg('تعذّر الاتصال بالخادم')
    } finally {
      setSeeding(false)
    }
  }

  // ── Page helpers ──────────────────────────────────────────────────────────
  function updatePageText(i: number, text: string) {
    setForm(f => { const pages = [...f.pages]; pages[i] = text; return { ...f, pages } })
  }
  function addPage() {
    setForm(f => ({ ...f, pages: [...f.pages, ''], pageImages: [...f.pageImages, null] }))
  }
  function removePage(i: number) {
    if (form.pages.length <= 1) return
    setForm(f => ({ ...f, pages: f.pages.filter((_, idx) => idx !== i), pageImages: f.pageImages.filter((_, idx) => idx !== i) }))
  }
  function movePage(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= form.pages.length) return
    setForm(f => {
      const pages = [...f.pages]; [pages[i], pages[j]] = [pages[j], pages[i]]
      const pageImages = [...f.pageImages]; [pageImages[i], pageImages[j]] = [pageImages[j], pageImages[i]]
      return { ...f, pages, pageImages }
    })
  }
  // Wraps the currently-selected substring of page i's textarea in
  // `{{selection|#hex}}` — a lightweight "select text, pick a color" flow
  // instead of a full rich-text editor.
  function wrapSelectionWithColor(i: number, color: string) {
    const ta = textareaRefs.current[i]
    if (!ta) return
    const { selectionStart, selectionEnd, value } = ta
    if (selectionStart === selectionEnd) {
      setSaveError('حدّد كلمة داخل النص أولاً ثم اختر لوناً')
      return
    }
    setSaveError('')
    const selected = value.slice(selectionStart, selectionEnd)
    const before = value.slice(0, selectionStart)
    const after = value.slice(selectionEnd)
    const wrapped = `{{${selected}|${color}}}`
    updatePageText(i, before + wrapped + after)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = before.length + wrapped.length
      ta.setSelectionRange(pos, pos)
    })
  }
  async function handleImageUpload(i: number, file: File) {
    setUploadingIdx(i); setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setUploadError(data.error || 'تعذّر رفع الصورة'); return }
      setForm(f => { const pageImages = [...f.pageImages]; pageImages[i] = data.url; return { ...f, pageImages } })
    } catch {
      setUploadError('تعذّر رفع الصورة')
    } finally {
      setUploadingIdx(null)
    }
  }
  function removeImage(i: number) {
    setForm(f => { const pageImages = [...f.pageImages]; pageImages[i] = null; return { ...f, pageImages } })
  }
  // Paste-a-URL path — works with zero setup (no Blob storage needed), for
  // any image the specialist already has a link to.
  function setImageUrl(i: number, rawUrl: string) {
    const url = rawUrl.trim()
    if (!url) return
    if (!/^https:\/\//i.test(url)) { setUploadError('الرابط يجب أن يبدأ بـ https://'); return }
    setUploadError('')
    setForm(f => { const pageImages = [...f.pageImages]; pageImages[i] = url; return { ...f, pageImages } })
    setUrlDrafts(d => { const next = { ...d }; delete next[i]; return next })
  }

  // ── Question helpers ──────────────────────────────────────────────────────
  function updateQuestion(i: number, patch: Partial<StoryQuestion>) {
    setForm(f => { const questions = [...f.questions]; questions[i] = { ...questions[i], ...patch }; return { ...f, questions } })
  }
  function addQuestion() {
    setForm(f => ({ ...f, questions: [...f.questions, { q: '', choices: ['', ''], correct: 0 }] }))
  }
  function removeQuestion(i: number) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))
  }
  function updateChoice(qi: number, ci: number, text: string) {
    setForm(f => {
      const questions = [...f.questions]
      const choices = [...questions[qi].choices]; choices[ci] = text
      questions[qi] = { ...questions[qi], choices }
      return { ...f, questions }
    })
  }
  function addChoice(qi: number) {
    setForm(f => {
      const questions = [...f.questions]
      if (questions[qi].choices.length >= 6) return f
      questions[qi] = { ...questions[qi], choices: [...questions[qi].choices, ''] }
      return { ...f, questions }
    })
  }
  function removeChoice(qi: number, ci: number) {
    setForm(f => {
      const questions = [...f.questions]
      if (questions[qi].choices.length <= 2) return f
      const choices = questions[qi].choices.filter((_, idx) => idx !== ci)
      const correct = questions[qi].correct >= choices.length ? 0 : questions[qi].correct
      questions[qi] = { ...questions[qi], choices, correct }
      return { ...f, questions }
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#6B46F0)' }}>
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl text-gray-900">مكتبة القصص</h1>
            <p className="text-gray-400 text-xs mt-0.5">{loading ? '...' : `${stories.length} قصة`} — تحكّم كامل بالنص والصور والألوان، يظهر فوراً لدى الوالدين وفي الجلسة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors" title="تحديث">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> قصة جديدة
          </button>
        </div>
      </div>

      {/* Seed panel — only worth surfacing prominently when the library is empty */}
      {!loading && stories.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 mb-6 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-brand-400 mb-2" />
          <p className="font-bold text-gray-700 text-sm mb-3">لا توجد قصص بعد — ابدأ بتحميل ٢٢ قصة افتراضية جاهزة، ثم عدّل عليها كما تشاء.</p>
          <button
            onClick={() => handleSeed(false)}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            تحميل القصص الافتراضية
          </button>
          {seedMsg && <p className="text-xs text-gray-500 mt-2">{seedMsg}</p>}
        </div>
      )}
      {!loading && stories.length > 0 && (
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => { if (window.confirm('هذا سيحذف كل القصص الحالية (بما فيها تعديلاتك) ويستبدلها بـ22 قصة افتراضية. متابعة؟')) handleSeed(true) }}
            disabled={seeding}
            className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors disabled:opacity-50"
          >
            {seeding ? 'جارٍ التحميل…' : 'إعادة التحميل الكامل من القصص الافتراضية'}
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-28 bg-gray-100" />
              <div className="bg-white p-3 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stories.map(s => {
            const cover = s.pageImages?.[0] ?? null
            return (
              <div key={s.id} className="group relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow bg-white">
                <button onClick={() => openEdit(s)} className="w-full text-right">
                  <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent}CC)` }}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- dashboard-uploaded, arbitrary source
                      <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl drop-shadow">{s.icon}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-black text-gray-900 text-sm leading-snug mb-1 line-clamp-1">{s.title}</h3>
                    <p className="text-[11px] text-gray-400 font-bold">{s.pages.length} صفحات · {s.questions.length} أسئلة</p>
                  </div>
                </button>
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-500 hover:text-brand-600 shadow-sm" title="تعديل">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 shadow-sm disabled:opacity-50" title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Editor Modal ── */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <div>
                  <h2 className="font-black text-lg text-gray-900">{isNew ? 'قصة جديدة' : 'تعديل القصة'}</h2>
                  {!isNew && <p className="text-gray-400 text-xs mt-0.5 font-mono">{editingId}</p>}
                </div>
                <button onClick={closeEditor} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* ── Basics ── */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">عنوان القصة</label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="مثال: الأسد الطيّب"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">أيقونة الغلاف</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={form.icon}
                        onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 4) }))}
                        className="w-16 text-center text-2xl border border-gray-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                      {ICON_PRESETS.map(ic => (
                        <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${form.icon === ic ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">لون القصة</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="color"
                        value={form.accent}
                        onChange={e => setForm(f => ({ ...f, accent: e.target.value }))}
                        className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer"
                      />
                      {ACCENT_PRESETS.map(c => (
                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, accent: c }))}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ background: c, borderColor: form.accent === c ? '#1E293B' : 'transparent' }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">مستوى الصعوبة</label>
                    <div className="flex gap-2">
                      {DIFF_OPTIONS.map(d => (
                        <button key={d.v} type="button" onClick={() => setForm(f => ({ ...f, diff: d.v }))}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${form.diff === d.v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Pages ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-700">صفحات القصة ({form.pages.length})</label>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                    لتلوين كلمة: حدّدها داخل النص ثم اضغط لوناً من الشريط. الصورة تحلّ محلّ الرسم التوضيحي التلقائي إن رُفعت.
                  </p>
                  <div className="space-y-3">
                    {form.pages.map((page, i) => (
                      <div key={i} className="rounded-2xl border border-gray-200 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-gray-500">صفحة {i + 1}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => movePage(i, -1)} disabled={i === 0} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="نقل لأعلى">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => movePage(i, 1)} disabled={i === form.pages.length - 1} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="نقل لأسفل">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {form.pages.length > 1 && (
                              <button type="button" onClick={() => removePage(i)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="حذف الصفحة">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <textarea
                          ref={el => { textareaRefs.current[i] = el }}
                          value={page}
                          onChange={e => updatePageText(i, e.target.value)}
                          rows={3}
                          dir="rtl"
                          placeholder="اكتب نص الصفحة هنا…"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none mb-2"
                        />

                        {/* Word-coloring tool */}
                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-bold ml-1">لوّن الكلمة المحدّدة:</span>
                          {WORD_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => wrapSelectionWithColor(i, c)}
                              className="w-5 h-5 rounded-full border border-black/5 hover:scale-125 transition-transform" style={{ background: c }} title={c} />
                          ))}
                        </div>

                        {/* Live preview */}
                        <div className="text-sm font-bold text-center bg-gray-50 rounded-xl px-3 py-2.5 mb-2.5" dir="rtl">
                          <ColoredPreview text={page} />
                        </div>

                        {/* Image */}
                        {form.pageImages[i] ? (
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element -- dashboard-uploaded, arbitrary source */}
                            <img src={form.pageImages[i] ?? undefined} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 left-1 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl cursor-pointer transition-colors">
                              {uploadingIdx === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                              {uploadingIdx === i ? 'جارٍ الرفع…' : 'رفع صورة'}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingIdx !== null}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f); e.target.value = '' }} />
                            </label>
                            <span className="text-[11px] text-gray-300 font-bold">أو</span>
                            <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                              <input
                                value={urlDrafts[i] ?? ''}
                                onChange={e => setUrlDrafts(d => ({ ...d, [i]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setImageUrl(i, urlDrafts[i] ?? '') } }}
                                placeholder="الصق رابط صورة https://…"
                                dir="ltr"
                                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-300"
                              />
                              <button type="button" onClick={() => setImageUrl(i, urlDrafts[i] ?? '')}
                                className="flex-shrink-0 text-xs font-bold text-gray-500 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors">
                                إضافة
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {uploadError && <p className="text-xs text-red-500 font-bold mt-2">{uploadError}</p>}
                  <button type="button" onClick={addPage} className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 py-2.5 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> إضافة صفحة
                  </button>
                </div>

                {/* ── Comprehension questions ── */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-500" /> أسئلة الفهم ({form.questions.length})
                  </label>
                  <div className="space-y-3">
                    {form.questions.map((q, qi) => (
                      <div key={qi} className="rounded-2xl border border-gray-200 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-gray-500">سؤال {qi + 1}</span>
                          {form.questions.length > 1 && (
                            <button type="button" onClick={() => removeQuestion(qi)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          value={q.q}
                          onChange={e => updateQuestion(qi, { q: e.target.value })}
                          placeholder="نص السؤال"
                          dir="rtl"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 mb-2"
                        />
                        <div className="space-y-1.5">
                          {q.choices.map((c, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                              <button type="button" onClick={() => updateQuestion(qi, { correct: ci })}
                                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${q.correct === ci ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'}`}
                                title="الإجابة الصحيحة">
                                ✓
                              </button>
                              <input
                                value={c}
                                onChange={e => updateChoice(qi, ci, e.target.value)}
                                placeholder={`خيار ${ci + 1}`}
                                dir="rtl"
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                              />
                              {q.choices.length > 2 && (
                                <button type="button" onClick={() => removeChoice(qi, ci)} className="p-1 text-gray-300 hover:text-red-500">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {q.choices.length < 6 && (
                          <button type="button" onClick={() => addChoice(qi)} className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700">
                            + إضافة خيار
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addQuestion} className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 py-2.5 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> إضافة سؤال
                  </button>
                </div>

                {saveError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl">{saveError}</div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
                {!isNew ? (
                  <button
                    onClick={() => handleDelete(editingId!)}
                    disabled={deletingId === editingId}
                    className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> حذف القصة
                  </button>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button onClick={closeEditor} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">إلغاء</button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
