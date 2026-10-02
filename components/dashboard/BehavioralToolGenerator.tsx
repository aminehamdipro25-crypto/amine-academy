'use client'
// مولّد أدوات الفحص — يُنتج أداة غير معياريّة أصليّة لأيّ محور، قابلة للطباعة والحفظ،
// مع تطبيق سريع وتصحيح أوتوماتيكي للاستمارة. (AMINE ACADEMY)
import { useEffect, useMemo, useState } from 'react'
import {
  Wand2, Loader2, Printer, Save, Trash2, Library, Sparkles,
  CalendarClock, ClipboardList,
} from 'lucide-react'
import {
  GENERATOR_AXES, ANSWER_SCALE, CATEGORY_META, scoreGeneric,
  type GeneratedTool, type AnswerValue,
} from '@/lib/behavioral-compass'

const AGE_GROUPS = ['6–8 سنوات', '9–11 سنة', '12–14 سنة', '15–17 سنة']
const DURATIONS = ['20 دقيقة', '25–30 دقيقة', '40 دقيقة']
const CONTEXTS = ['فردي في جلسة', 'مع الأسرة', 'في الصفّ']

export default function BehavioralToolGenerator() {
  const [axis, setAxis] = useState<string>(GENERATOR_AXES[0])
  const [customAxis, setCustomAxis] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[1])
  const [duration, setDuration] = useState(DURATIONS[1])
  const [context, setContext] = useState(CONTEXTS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tool, setTool] = useState<GeneratedTool | null>(null)
  const [toast, setToast] = useState('')

  const [library, setLibrary] = useState<GeneratedTool[]>([])
  const [libOpen, setLibOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const effectiveAxis = (axis === '__custom' ? customAxis : axis).trim()

  function loadLibrary() {
    fetch('/api/admin/behavioral-compass/tools')
      .then(r => r.ok ? r.json() : null)
      .then((d: { tools?: GeneratedTool[] } | null) => setLibrary(Array.isArray(d?.tools) ? d!.tools : []))
      .catch(() => {})
  }
  useEffect(loadLibrary, [])

  async function generate() {
    if (!effectiveAxis) { setError('اختر المحور أو اكتبه'); return }
    setLoading(true); setError(''); setTool(null)
    try {
      const res = await fetch('/api/admin/behavioral-compass/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis: effectiveAxis, ageGroup, duration, context }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.tool) setTool(data.tool)
      else setError(data.error || 'تعذّر التوليد — حاول مجدداً')
    } catch {
      setError('تعذّر الاتصال — حاول مجدداً')
    } finally { setLoading(false) }
  }

  async function saveTool() {
    if (!tool) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/behavioral-compass/tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool }),
      })
      if (res.ok) { setToast('✓ حُفظت الأداة في المكتبة'); loadLibrary() }
      else setToast('❌ تعذّر الحفظ')
    } catch { setToast('❌ تعذّر الحفظ') } finally { setSaving(false) }
  }

  async function deleteTool(id?: string) {
    if (!id || !confirm('حذف هذه الأداة من المكتبة؟')) return
    await fetch(`/api/admin/behavioral-compass/tools?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
    loadLibrary()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* نموذج التوليد */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <p className="font-black text-slate-800 text-sm flex items-center gap-1.5"><Wand2 className="w-4 h-4 text-brand-500" /> مولّد أدوات الفحص</p>
          <button onClick={() => { setLibOpen(o => !o); loadLibrary() }} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 px-3 py-1.5 rounded-lg border border-slate-200">
            <Library className="w-3.5 h-3.5" /> المكتبة ({library.length})
          </button>
        </div>

        <div>
          <span className="block text-xs font-bold text-slate-500 mb-1.5">المحور</span>
          <div className="flex flex-wrap gap-2">
            {GENERATOR_AXES.map(a => (
              <button key={a} onClick={() => setAxis(a)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${axis === a ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>{a}</button>
            ))}
            <button onClick={() => setAxis('__custom')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${axis === '__custom' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>محور آخر…</button>
          </div>
          {axis === '__custom' && (
            <input value={customAxis} onChange={e => setCustomAxis(e.target.value)} placeholder="اكتب اسم المحور" className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Select label="الفئة العمريّة" value={ageGroup} options={AGE_GROUPS} onChange={setAgeGroup} />
          <Select label="مدّة التطبيق" value={duration} options={DURATIONS} onChange={setDuration} />
          <Select label="السياق" value={context} options={CONTEXTS} onChange={setContext} />
        </div>

        {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 text-white font-black text-sm hover:bg-brand-600 disabled:opacity-50 shadow-brand-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ توليد الأداة…</> : <><Wand2 className="w-4 h-4" /> توليد الأداة</>}
        </button>
        <p className="text-[11px] text-slate-400 text-center">قد يستغرق التوليد نصف دقيقة. كل البنود أصليّة وغير معياريّة.</p>
      </div>

      {/* المكتبة */}
      {libOpen && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 print:hidden">
          <p className="font-black text-slate-800 text-sm mb-3 flex items-center gap-1.5"><Library className="w-4 h-4 text-brand-500" /> مكتبة الأدوات</p>
          {library.length === 0 ? (
            <p className="text-xs text-slate-400">لا أدوات محفوظة بعد — ولّد أداة ثم اضغط «حفظ في المكتبة».</p>
          ) : (
            <div className="space-y-1.5">
              {library.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <button onClick={() => { setTool(t); setLibOpen(false) }} className="text-right flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400">{t.axisLabel} · {t.ageGroup} · {t.selfReport.items.length} عبارة</p>
                  </button>
                  <button onClick={() => deleteTool(t.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* الأداة المولّدة */}
      {tool && <ToolDocument tool={tool} onSave={saveTool} saving={saving} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold print:hidden" onClick={() => setToast('')}>{toast}</div>
      )}
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-500 mb-1.5">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

// ── عرض الأداة كوثيقة قابلة للطباعة + تطبيق سريع وتصحيح ──────────────────────────
function ToolDocument({ tool, onSave, saving }: { tool: GeneratedTool; onSave: () => void; saving: boolean }) {
  const [runOpen, setRunOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const sc = useMemo(() => scoreGeneric(tool.selfReport.items, answers), [tool.selfReport.items, answers])
  const cat = CATEGORY_META[sc.category]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 print:hidden">
        <button onClick={() => { setRunOpen(o => !o); setAnswers({}) }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-700 font-bold text-sm hover:bg-brand-50">
          <ClipboardList className="w-4 h-4" /> {runOpen ? 'إغلاق التطبيق' : 'تطبيق سريع وتصحيح'}
        </button>
        <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 disabled:opacity-50 shadow-brand-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ في المكتبة
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black"><Printer className="w-4 h-4" /> طباعة</button>
      </div>

      {/* التطبيق السريع (تصحيح أوتوماتيكي) */}
      {runOpen && (
        <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-5 print:hidden">
          <p className="font-black text-slate-800 text-sm mb-1">تطبيق الاستمارة — {tool.selfReport.instruction}</p>
          <p className="text-[11px] text-slate-500 mb-3">سلّم: 1 أبداً · 2 أحياناً · 3 غالباً · 4 دائماً</p>
          <div className="space-y-2">
            {tool.selfReport.items.map((it, i) => (
              <div key={it.id} className="bg-white rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-sm text-slate-700 mb-1.5">{i + 1}. {it.text}</p>
                <div className="flex gap-1.5">
                  {ANSWER_SCALE.map(opt => (
                    <button key={opt.value} onClick={() => setAnswers(a => ({ ...a, [it.id]: opt.value as AnswerValue }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${answers[it.id] === opt.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 rounded-xl border p-4 text-center ${sc.category === 'intervention' ? 'bg-red-50 border-red-200' : sc.category === 'support' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-xs font-bold text-slate-500">المجموع (أُجيب على {sc.answered}/{sc.count})</p>
            <p className="text-2xl font-black text-slate-800">{sc.sum} <span className="text-sm text-slate-400">من {sc.max}</span></p>
            <p className="text-sm font-black mt-1" style={{ color: cat.tone === 'red' ? '#b91c1c' : cat.tone === 'amber' ? '#b45309' : '#047857' }}>{cat.label}</p>
          </div>
        </div>
      )}

      {/* الوثيقة */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:shadow-none print:border-0">
        <div className="border-b border-slate-100 pb-4">
          <p className="text-[11px] font-black tracking-widest text-brand-500">AMINE ACADEMY</p>
          <h2 className="text-lg font-black text-slate-900">{tool.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">المحور: {tool.axisLabel} · {tool.ageGroup} · {tool.duration} · {tool.context}</p>
        </div>

        <Section title="المفاهيم العلميّة">
          <div className="space-y-2">
            {tool.concepts.map((c, i) => <div key={i} className="text-xs text-slate-600 leading-relaxed"><b className="text-slate-800">{c.name}:</b> {c.explanation}</div>)}
          </div>
        </Section>

        <Section title={`استمارة التقرير الذاتي (${tool.selfReport.items.length} عبارة)`}>
          <p className="text-[11px] text-slate-400 mb-2">التعليمة: {tool.selfReport.instruction}</p>
          <ol className="space-y-1">
            {tool.selfReport.items.map((it, i) => (
              <li key={it.id} className="text-xs text-slate-600 flex gap-2">
                <span className="text-slate-400">{i + 1}.</span>
                <span>{it.text}{it.reverse && <span className="text-brand-500 font-bold"> (ع)</span>}</span>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-slate-400 mt-2">(ع) = عبارة معكوسة تُحسب 5 − الإجابة.</p>
        </Section>

        {tool.tasks.length > 0 && (
          <Section title="كرّاسة المهام المتدرّجة">
            {([1, 2, 3] as const).map(lv => {
              const ts = tool.tasks.filter(t => t.level === lv)
              if (!ts.length) return null
              return (
                <div key={lv} className="mb-2">
                  <p className="text-xs font-black text-slate-700 mb-1">المستوى {lv}</p>
                  <ul className="space-y-1">{ts.map((t, i) => <li key={i} className="text-xs text-slate-600 leading-relaxed">• {t.prompt}{t.note && <span className="text-slate-400"> — ({t.note})</span>}</li>)}</ul>
                </div>
              )
            })}
          </Section>
        )}

        {tool.recordingIndicators.length > 0 && <ListSection title="مؤشّرات ورقة التسجيل" items={tool.recordingIndicators} />}
        {tool.parentInterview.length > 0 && <ListSection title="مقابلة وليّ الأمر" items={tool.parentInterview} ordered />}
        {tool.openQuestions.length > 0 && <ListSection title="الأسئلة المفتوحة" items={tool.openQuestions} ordered />}

        {tool.correctionNote && (
          <Section title="مفتاح التصحيح">
            <p className="text-xs text-slate-600 leading-relaxed">{tool.correctionNote}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(['intervention', 'support', 'strength'] as const).map(k => (
                <span key={k} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{CATEGORY_META[k].label}</span>
              ))}
            </div>
          </Section>
        )}

        {tool.resultsTable.length > 0 && (
          <Section title="قراءة النتائج">
            <div className="space-y-2">
              {tool.resultsTable.map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs font-black text-slate-700">{r.pattern}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">الفرضيّة: {r.hypothesis}</p>
                  <p className="text-[11px] text-brand-600 mt-0.5">الأولويّة: {r.priority}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tool.protocol.length > 0 && (
          <Section title="بروتوكول التدخّل">
            <div className="space-y-1.5">
              {tool.protocol.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-slate-600 leading-relaxed"><b className="text-slate-800">{s.title}:</b> {s.detail}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tool.remeasure.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-black text-slate-800 text-sm mb-1.5 flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-brand-500" /> إعادة القياس</p>
            <ul className="space-y-1">{tool.remeasure.map((r, i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-brand-400">•</span>{r}</li>)}</ul>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3 space-y-2">
          {tool.limits && <p className="text-[11px] text-slate-500 leading-relaxed"><b className="text-slate-700">حدود الأداة:</b> {tool.limits}</p>}
          {tool.referral && <p className="text-[11px] text-slate-500 leading-relaxed"><b className="text-slate-700">متى تُحال الحالة:</b> {tool.referral}</p>}
          <p className="text-[10px] text-slate-400 text-center pt-2">AMINE ACADEMY — أداة فحص وملاحظة غير معياريّة · لا تُستعمل للتشخيص</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-black text-slate-800 text-sm mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-brand-500" /> {title}</p>
      {children}
    </div>
  )
}
function ListSection({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  return (
    <Section title={title}>
      {ordered ? (
        <ol className="space-y-1">{items.map((x, i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-slate-400">{i + 1}.</span>{x}</li>)}</ol>
      ) : (
        <ul className="space-y-1">{items.map((x, i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-brand-400">•</span>{x}</li>)}</ul>
      )}
    </Section>
  )
}
