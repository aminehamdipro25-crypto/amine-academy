'use client'
import { useState, useEffect, useMemo } from 'react'
import { Search, Link2, X, Check, Loader2, ClipboardList, Clock } from 'lucide-react'

interface ChildOpt { id: string; name: string; parentName: string }
interface SummaryRow {
  id: string; date: string; durationMin: number
  engagement: 'high' | 'medium' | 'low'
  activities: string[]; note: string; nextFocus?: string; createdAt: string
}

const ENGAGEMENT: { key: 'high' | 'medium' | 'low'; label: string; emoji: string; cls: string }[] = [
  { key: 'high',   label: 'تفاعل مرتفع', emoji: '🌟', cls: 'bg-emerald-500 border-emerald-500' },
  { key: 'medium', label: 'تفاعل متوسط', emoji: '🙂', cls: 'bg-amber-500 border-amber-500' },
  { key: 'low',    label: 'تفاعل منخفض', emoji: '😕', cls: 'bg-rose-500 border-rose-500' },
]
// Quick-add chips — common things worked on in a session.
const QUICK_ACTIVITIES = ['انتباه وتركيز', 'ذاكرة عاملة', 'تنظيم ذاتي', 'تواصل اجتماعي', 'مهارات حركية', 'قراءة', 'حساب', 'تنظيم الغضب', 'اتباع التعليمات']

const todayYMD = () => new Date().toISOString().slice(0, 10)

export default function SessionSummaryPage() {
  const [children, setChildren] = useState<ChildOpt[]>([])
  const [childId, setChildId]   = useState('')
  const [query, setQuery]       = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const [date, setDate]         = useState(todayYMD())
  const [durationMin, setDuration] = useState('')
  const [engagement, setEngagement] = useState<'high' | 'medium' | 'low'>('high')
  const [activities, setActivities] = useState<string[]>([])
  const [activityInput, setActivityInput] = useState('')
  const [note, setNote]         = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [notifyParent, setNotifyParent] = useState(true)

  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')
  const [history, setHistory]   = useState<SummaryRow[]>([])

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { clients?: { name?: string; students?: { id: string; firstName: string; lastName: string }[] }[] } | null) => {
        const opts: ChildOpt[] = []
        for (const c of d?.clients ?? []) {
          for (const s of c.students ?? []) {
            opts.push({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim(), parentName: c.name ?? '' })
          }
        }
        setChildren(opts)
      })
      .catch(() => setChildren([]))
  }, [])

  useEffect(() => {
    if (!childId) { setHistory([]); return }
    fetch(`/api/admin/session-summary?studentId=${encodeURIComponent(childId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { summaries?: SummaryRow[] } | null) => setHistory(d?.summaries ?? []))
      .catch(() => setHistory([]))
  }, [childId])

  const selectedChild = useMemo(() => children.find(c => c.id === childId), [children, childId])
  const matches = useMemo(
    () => (query.trim() ? children.filter(c => c.name.includes(query.trim())).slice(0, 20) : []),
    [children, query],
  )

  function toggleActivity(a: string) {
    setActivities(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]))
  }
  function addActivityInput() {
    const v = activityInput.trim()
    if (v && !activities.includes(v)) setActivities(prev => [...prev, v])
    setActivityInput('')
  }

  async function save() {
    if (!childId) { setToast('اختر الطفل أولاً'); return }
    if (!note.trim()) { setToast('اكتب ملاحظة قصيرة لولي الأمر'); return }
    setSaving(true); setToast('')
    try {
      const res = await fetch('/api/admin/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: childId, date,
          durationMin: Number(durationMin) || 0,
          engagement, activities, note: note.trim(),
          nextFocus: nextFocus.trim() || undefined,
          notifyParent,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.ok) {
        setToast(d.emailed ? '✓ حُفظ الملخّص وأُرسل لولي الأمر' : '✓ حُفظ الملخّص')
        setNote(''); setNextFocus(''); setActivities([]); setDuration('')
        setHistory(h => [d.summary, ...h])
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
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">ملخّص الحصة الحضورية</h1>
          <p className="text-sm text-slate-500">دوّن الحصة بسرعة بعد انتهائها — يصل ملخّصها لولي الأمر فوراً.</p>
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

        {/* Date + duration */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-500 mb-1">تاريخ الحصة</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="af-in w-full" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-slate-500 mb-1">المدة (دقيقة)</span>
            <input type="number" inputMode="numeric" value={durationMin} onChange={e => setDuration(e.target.value)} className="af-in w-full" placeholder="مثال: 45" />
          </label>
        </div>

        {/* Engagement */}
        <div>
          <span className="block text-xs font-bold text-slate-500 mb-1.5">تفاعل الطفل اليوم</span>
          <div className="grid grid-cols-3 gap-2">
            {ENGAGEMENT.map(e => (
              <button key={e.key} onClick={() => setEngagement(e.key)}
                className={`py-2.5 rounded-xl text-sm font-bold border transition text-white ${engagement === e.key ? e.cls : 'bg-white !text-slate-500 border-slate-200 hover:border-brand-300'}`}>
                <span className="ml-1">{e.emoji}</span>{e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <span className="block text-xs font-bold text-slate-500 mb-1.5">ما عملنا عليه (اختياري)</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_ACTIVITIES.map(a => (
              <button key={a} onClick={() => toggleActivity(a)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition ${activities.includes(a) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'}`}>
                {a}
              </button>
            ))}
          </div>
          {activities.filter(a => !QUICK_ACTIVITIES.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {activities.filter(a => !QUICK_ACTIVITIES.includes(a)).map(a => (
                <span key={a} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-brand-500 text-white flex items-center gap-1">
                  {a}<button onClick={() => toggleActivity(a)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={activityInput} onChange={e => setActivityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivityInput() } }}
              className="af-in flex-1" placeholder="أضف نشاطاً آخر…" />
            <button onClick={addActivityInput} className="px-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50">إضافة</button>
          </div>
        </div>

        {/* Note */}
        <label className="block">
          <span className="block text-xs font-bold text-slate-500 mb-1">ملاحظة لولي الأمر <span className="text-rose-500">*</span></span>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="af-in w-full resize-none"
            placeholder="مثال: تفاعل سامي جيداً اليوم وأكمل تمارين الانتباه. ننصح بتكرار تمرين التنفّس في المنزل." />
        </label>

        {/* Next focus */}
        <label className="block">
          <span className="block text-xs font-bold text-slate-500 mb-1">تركيز المرحلة القادمة (اختياري)</span>
          <input value={nextFocus} onChange={e => setNextFocus(e.target.value)} className="af-in w-full" placeholder="مثال: تمارين التنظيم الذاتي" />
        </label>

        {/* Notify */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={notifyParent} onChange={e => setNotifyParent(e.target.checked)} className="w-4 h-4 accent-brand-600" />
          <span className="text-sm font-bold text-slate-600">إرسال الملخّص لولي الأمر بالبريد</span>
        </label>

        <button onClick={save} disabled={saving || !childId || !note.trim()}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          حفظ وإرسال الملخّص
        </button>
        {toast && <p className="text-center text-sm font-bold text-slate-600">{toast}</p>}
      </div>

      {/* Recent summaries for this child */}
      {childId && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-black text-slate-700 mb-3">آخر الملخّصات لهذا الطفل</h2>
          <div className="space-y-2.5">
            {history.slice(0, 8).map(s => (
              <div key={s.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.date}{s.durationMin ? ` · ${s.durationMin} د` : ''}</span>
                  <span>{ENGAGEMENT.find(e => e.key === s.engagement)?.emoji}</span>
                </div>
                <p className="text-sm text-slate-700">{s.note}</p>
                {s.activities.length > 0 && <p className="text-xs text-brand-500 mt-1">{s.activities.join('، ')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
