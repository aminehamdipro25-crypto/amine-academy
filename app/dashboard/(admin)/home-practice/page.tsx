'use client'
import { useState, useEffect, useMemo } from 'react'
import { Search, Link2, X, Check, Loader2, Home, BookOpen, Dumbbell } from 'lucide-react'
import { HOME_EXERCISES } from '@/lib/home-exercises'

interface ChildOpt { id: string; name: string; parentName: string }
interface StoryOpt { id: string; title: string; icon: string }
interface AssignItem { kind: 'exercise' | 'story'; id: string; labelAr: string; icon?: string }
interface AssignmentRow { id: string; items: AssignItem[]; note?: string; dueDate?: string; createdAt: string }

const todayYMD = () => new Date().toISOString().slice(0, 10)
const keyOf = (kind: string, id: string) => `${kind}:${id}`

export default function HomePracticePage() {
  const [children, setChildren] = useState<ChildOpt[]>([])
  const [stories, setStories]   = useState<StoryOpt[]>([])
  const [childId, setChildId]   = useState('')
  const [query, setQuery]       = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const [selected, setSelected] = useState<Record<string, AssignItem>>({})
  const [note, setNote]         = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [notifyParent, setNotifyParent] = useState(true)

  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')
  const [history, setHistory]   = useState<AssignmentRow[]>([])

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { clients?: { name?: string; students?: { id: string; firstName: string; lastName: string }[] }[] } | null) => {
        const opts: ChildOpt[] = []
        for (const c of d?.clients ?? []) for (const s of c.students ?? []) {
          opts.push({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim(), parentName: c.name ?? '' })
        }
        setChildren(opts)
      }).catch(() => setChildren([]))
    fetch('/api/stories')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { stories?: StoryOpt[] } | null) => setStories((d?.stories ?? []).map(s => ({ id: s.id, title: s.title, icon: s.icon }))))
      .catch(() => setStories([]))
  }, [])

  useEffect(() => {
    if (!childId) { setHistory([]); return }
    fetch(`/api/admin/home-assignment?studentId=${encodeURIComponent(childId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { assignments?: AssignmentRow[] } | null) => setHistory(d?.assignments ?? []))
      .catch(() => setHistory([]))
  }, [childId])

  const selectedChild = useMemo(() => children.find(c => c.id === childId), [children, childId])
  const matches = useMemo(
    () => (query.trim() ? children.filter(c => c.name.includes(query.trim())).slice(0, 20) : []),
    [children, query],
  )
  const selectedList = Object.values(selected)

  function toggle(item: AssignItem) {
    const k = keyOf(item.kind, item.id)
    setSelected(prev => {
      const next = { ...prev }
      if (next[k]) delete next[k]; else next[k] = item
      return next
    })
  }

  async function save() {
    if (!childId) { setToast('اختر الطفل أولاً'); return }
    if (selectedList.length === 0) { setToast('اختر تمريناً أو قصّة واحدة على الأقل'); return }
    setSaving(true); setToast('')
    try {
      const res = await fetch('/api/admin/home-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: childId, items: selectedList, note: note.trim() || undefined, dueDate: dueDate || undefined, notifyParent }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.ok) {
        setToast(d.emailed ? '✓ أُرسلت الخطة لولي الأمر' : '✓ حُفظت الخطة المنزلية')
        setSelected({}); setNote(''); setDueDate('')
        setHistory(h => [d.assignment, ...h])
      } else {
        setToast(d.error || '❌ تعذّر الحفظ')
      }
    } catch {
      setToast('❌ تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-brand-sm">
          <Home className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">الخطة المنزلية</h1>
          <p className="text-sm text-slate-500">اختر تمارين وقصصاً يؤدّيها الطفل في المنزل بين الحصص — تظهر لولي الأمر كـ«واجب هذا الأسبوع».</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        {/* Child picker */}
        <div>
          <span className="block text-xs font-bold text-slate-500 mb-1">الطفل</span>
          {childId ? (
            <div className="flex items-center justify-between gap-3 bg-brand-50 border border-brand-100 rounded-xl px-3.5 py-2.5">
              <p className="text-sm font-bold text-brand-700 flex items-center gap-1.5">
                <Link2 className="w-4 h-4" /> {selectedChild?.name || 'طفل'}
                {selectedChild?.parentName ? <span className="text-brand-400 font-normal"> · {selectedChild.parentName}</span> : null}
              </p>
              <button onClick={() => { setChildId(''); setQuery('') }} className="text-brand-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-brand-400">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input value={query} onChange={e => { setQuery(e.target.value); setPickerOpen(true) }} onFocus={() => setPickerOpen(true)}
                  className="flex-1 outline-none text-sm bg-transparent" placeholder="ابحث باسم الطفل…" />
              </div>
              {pickerOpen && query.trim() && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                  {matches.map(c => (
                    <button key={c.id} onClick={() => { setChildId(c.id); setPickerOpen(false); setQuery('') }}
                      className="w-full text-right px-3.5 py-2.5 text-sm hover:bg-brand-50 transition border-b border-slate-50 last:border-0">
                      {c.name}{c.parentName ? <span className="text-slate-400"> · {c.parentName}</span> : null}
                    </button>
                  ))}
                  {matches.length === 0 && <p className="px-3.5 py-3 text-xs text-slate-400">لا نتائج</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exercises */}
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2"><Dumbbell className="w-3.5 h-3.5" /> تمارين منزلية</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HOME_EXERCISES.map(ex => {
              const on = !!selected[keyOf('exercise', ex.id)]
              return (
                <button key={ex.id} onClick={() => toggle({ kind: 'exercise', id: ex.id, labelAr: ex.labelAr, icon: ex.icon })}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition text-right ${on ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                  <span>{ex.icon}</span><span className="flex-1 truncate">{ex.labelAr}</span>
                  {on && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stories */}
        {stories.length > 0 && (
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2"><BookOpen className="w-3.5 h-3.5" /> قصص</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stories.map(st => {
                const on = !!selected[keyOf('story', st.id)]
                return (
                  <button key={st.id} onClick={() => toggle({ kind: 'story', id: st.id, labelAr: st.title, icon: st.icon })}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition text-right ${on ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                    <span>{st.icon}</span><span className="flex-1 truncate">{st.title}</span>
                    {on && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected count */}
        {selectedList.length > 0 && (
          <p className="text-xs font-bold text-brand-600">اختير {selectedList.length} عنصراً</p>
        )}

        {/* Due date + note */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-500 mb-1">تاريخ الاستحقاق (اختياري)</span>
            <input type="date" value={dueDate} min={todayYMD()} onChange={e => setDueDate(e.target.value)} className="af-in w-full" />
          </label>
        </div>
        <label className="block">
          <span className="block text-xs font-bold text-slate-500 mb-1">ملاحظة لولي الأمر (اختياري)</span>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="af-in w-full resize-none"
            placeholder="مثال: كرّروا تمرين التنفّس مرّتين يومياً، ويُفضّل قراءة القصة قبل النوم." />
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={notifyParent} onChange={e => setNotifyParent(e.target.checked)} className="w-4 h-4 accent-brand-600" />
          <span className="text-sm font-bold text-slate-600">إرسال الخطة لولي الأمر بالبريد</span>
        </label>

        <button onClick={save} disabled={saving || !childId || selectedList.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          إرسال الخطة المنزلية
        </button>
        {toast && <p className="text-center text-sm font-bold text-slate-600">{toast}</p>}
      </div>

      {/* Current / recent plans */}
      {childId && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-black text-slate-700 mb-1">الخطة الحالية</h2>
          <p className="text-xs text-slate-400 mb-3">الأحدث هي التي يراها ولي الأمر الآن.</p>
          <div className="space-y-2.5">
            {history.slice(0, 5).map((a, idx) => (
              <div key={a.id} className={`border rounded-xl p-3 ${idx === 0 ? 'border-brand-200 bg-brand-50/40' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>{a.createdAt.slice(0, 10)}{a.dueDate ? ` · حتى ${a.dueDate}` : ''}</span>
                  {idx === 0 && <span className="text-brand-600 font-bold">نشِطة</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.items.map((it, i) => (
                    <span key={i} className="text-xs rounded-lg px-2 py-1 bg-slate-100 text-slate-600 font-medium">{it.icon ? it.icon + ' ' : ''}{it.labelAr}</span>
                  ))}
                </div>
                {a.note && <p className="text-xs text-slate-500 mt-2">{a.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
