'use client'
// البوصلة السلوكية–التعلّمية — نسخة رقميّة بتصحيح أوتوماتيكي (AMINE ACADEMY)
// تُدار بالكامل على الشاشة — لا طباعة للاستمارات، والتصحيح يحدث فوراً.
import { ARABIC_LOCALE, formatDateTime } from '@/lib/format'
import { useMemo, useState, useEffect } from 'react'
import {
  Compass, ArrowRight, ArrowLeft, Printer, RotateCcw, CheckCircle2,
  ClipboardList, Brain, HeartPulse, HandHelping, Sparkles, AlertTriangle, CalendarClock,
  Search, Save, Loader2, Link2, X, TrendingUp, TrendingDown, Minus, History as HistoryIcon,
  Play, Pause, Timer,
} from 'lucide-react'
import {
  AXES, SELF_REPORT, ANSWER_SCALE, TASKS, CATEGORY_META, PARENT_INTERVIEW, OPEN_QUESTIONS,
  CLOSURE_SIGNS, HINTS, scoreSelfReport, gradeTasks, interpret, emptyObservation, compareCompass,
  type AnswerValue, type AxisKey, type Glyph, type ObservationRecord, type Task, type CompassRecord,
} from '@/lib/behavioral-compass'

interface ChildOption { id: string; name: string; age: string }

type Step = 'intro' | 'self' | 'tasks' | 'observe' | 'interview' | 'report'
const STEPS: { key: Step; label: string }[] = [
  { key: 'intro', label: 'التعريف' },
  { key: 'self', label: 'الاستمارة' },
  { key: 'tasks', label: 'المهام' },
  { key: 'observe', label: 'الملاحظة' },
  { key: 'interview', label: 'وليّ الأمر' },
  { key: 'report', label: 'النتيجة' },
]

const DRAFT_KEY = 'behavioral-compass-draft-v1'
const AXIS_ICON: Record<AxisKey, React.ComponentType<{ className?: string }>> = {
  A: Brain, B: Sparkles, C: HandHelping, D: HeartPulse,
}
const TONE: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     bar: 'bg-red-500' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   bar: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
}

// ── رسم الأشكال (Glyph) ────────────────────────────────────────────────────────
function GlyphView({ g, size = 56 }: { g: Glyph; size?: number }) {
  const s = size, c = s / 2, stroke = '#334155', sw = 2.5
  if (g.t === 'arrow') {
    const rot = { up: -90, right: 0, down: 90, left: 180 }[g.dir]
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden>
        <g transform={`rotate(${rot} 24 24)`} stroke={stroke} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="24" x2="36" y2="24" />
          <polyline points="28,16 38,24 28,32" />
        </g>
      </svg>
    )
  }
  if (g.t === 'dots') {
    const pts: [number, number][] = []
    const per = Math.ceil(Math.sqrt(g.n))
    for (let i = 0; i < g.n; i++) { pts.push([i % per, Math.floor(i / per)]) }
    const gap = 12, off = 24 - ((per - 1) * gap) / 2
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden>
        {pts.map(([x, y], i) => <circle key={i} cx={off + x * gap} cy={off + y * gap} r={3.5} fill={stroke} />)}
      </svg>
    )
  }
  // poly
  const fillColor = g.fill ? stroke : 'none'
  let shapeEl: React.ReactNode = null
  if (g.shape === 'circle') shapeEl = <circle cx="24" cy="24" r="15" fill={fillColor} stroke={stroke} strokeWidth={sw} />
  else if (g.shape === 'square') shapeEl = <rect x="9" y="9" width="30" height="30" rx="3" fill={fillColor} stroke={stroke} strokeWidth={sw} />
  else shapeEl = <polygon points="24,8 40,38 8,38" fill={fillColor} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  const innerColor = g.fill ? '#fff' : stroke
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden>
      {shapeEl}
      {g.inner === 'hline' && <line x1="14" y1="24" x2="34" y2="24" stroke={innerColor} strokeWidth={sw} />}
      {g.inner === 'vline' && <line x1="24" y1="14" x2="24" y2="34" stroke={innerColor} strokeWidth={sw} />}
      {g.inner === 'plus' && <g stroke={innerColor} strokeWidth={sw}><line x1="24" y1="18" x2="24" y2="32" /><line x1="17" y1="25" x2="31" y2="25" /></g>}
    </svg>
  )
}

function StemView({ task }: { task: Extract<Task, { kind: 'visual' }> }) {
  const Cell = ({ g }: { g: Glyph | null }) => (
    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
      {g ? <GlyphView g={g} /> : <span className="text-2xl font-black text-brand-500">؟</span>}
    </div>
  )
  const stem = task.stem
  if (stem.kind === 'analogy') {
    return (
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Cell g={stem.a} /><span className="font-black text-slate-400">:</span><Cell g={stem.b} />
        <span className="font-black text-slate-400 mx-2">::</span>
        <Cell g={stem.c} /><span className="font-black text-slate-400">:</span><Cell g={null} />
      </div>
    )
  }
  if (stem.kind === 'grid') {
    return (
      <div className="inline-grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${stem.cols}, minmax(0, 1fr))` }}>
        {stem.cells.map((g, i) => <Cell key={i} g={g} />)}
      </div>
    )
  }
  // صفّ بسيط بترتيب RTL طبيعي (أول عنصر على اليمين) — دون أسهم تربك القارئ
  return (
    <div className="flex items-center gap-2.5 flex-wrap justify-center">
      {stem.cells.map((g, i) => <Cell key={i} g={g} />)}
    </div>
  )
}

interface DraftShape {
  name: string; age: string; specialist: string; appNo: 'الأول' | 'الثاني'
  childId: string
  self: Record<string, AnswerValue>
  tasks: Record<string, string | number>
  obs: ObservationRecord
  interview: Record<number, string>
  open: Record<number, string>
}

export default function BehavioralCompass() {
  const [step, setStep] = useState<Step>('intro')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [specialist, setSpecialist] = useState('')
  const [appNo, setAppNo] = useState<'الأول' | 'الثاني'>('الأول')
  const [self, setSelf] = useState<Record<string, AnswerValue>>({})
  const [tasks, setTasks] = useState<Record<string, string | number>>({})
  const [obs, setObs] = useState<ObservationRecord>(emptyObservation())
  const [interview, setInterview] = useState<Record<number, string>>({})
  const [open, setOpen] = useState<Record<number, string>>({})
  const today = useMemo(() => formatDateTime(new Date(), ARABIC_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' }), [])

  // ربط الطفل + السجلّ + الحفظ
  const [childId, setChildId] = useState('')
  const [children, setChildren] = useState<ChildOption[]>([])
  const [childQuery, setChildQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [history, setHistory] = useState<CompassRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showRules, setShowRules] = useState(false)  // عرض القواعد للمختص (مخفيّة افتراضياً)

  // تحميل قائمة الأطفال المرتبطين
  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => r.ok ? r.json() : null)
      .then((data: { clients?: { students?: { id: string; firstName?: string; lastName?: string; birthDate?: string }[] }[] } | null) => {
        if (!data?.clients) return
        const opts: ChildOption[] = []
        for (const c of data.clients) {
          for (const s of c.students ?? []) {
            let age = ''
            if (s.birthDate) {
              const y = (Date.now() - new Date(s.birthDate).getTime()) / (365.25 * 86400000)
              if (Number.isFinite(y) && y > 0) age = String(Math.floor(y))
            }
            opts.push({ id: s.id, name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'طفل', age })
          }
        }
        setChildren(opts)
      })
      .catch(() => {})
  }, [])

  // جلب سجلّ الطفل المختار
  useEffect(() => {
    if (!childId) { setHistory([]); return }
    fetch(`/api/admin/behavioral-compass?childId=${encodeURIComponent(childId)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { records?: CompassRecord[] } | null) => setHistory(Array.isArray(d?.records) ? d!.records : []))
      .catch(() => setHistory([]))
  }, [childId])

  // استرجاع المسودّة
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw) as Partial<DraftShape>
      if (d.name) setName(d.name)
      if (d.age) setAge(d.age)
      if (d.specialist) setSpecialist(d.specialist)
      if (d.appNo) setAppNo(d.appNo)
      if (d.childId) setChildId(d.childId)
      if (d.self) setSelf(d.self)
      if (d.tasks) setTasks(d.tasks)
      if (d.obs) setObs({ ...emptyObservation(), ...d.obs })
      if (d.interview) setInterview(d.interview)
      if (d.open) setOpen(d.open)
    } catch { /* ignore */ }
  }, [])

  // حفظ المسودّة
  useEffect(() => {
    try {
      const d: DraftShape = { name, age, specialist, appNo, childId, self, tasks, obs, interview, open }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch { /* ignore */ }
  }, [name, age, specialist, appNo, childId, self, tasks, obs, interview, open])

  const score = useMemo(() => scoreSelfReport(self), [self])
  const grade = useMemo(() => gradeTasks(tasks), [tasks])
  const reading = useMemo(() => interpret(score.axes), [score.axes])

  // سجلّ حيّ من الحالة الحالية (للحفظ والمقارنة)
  const liveRecord = useMemo<CompassRecord>(() => ({
    id: 'live', childId, childName: name, age, appNo, specialist: specialist || undefined,
    createdAt: new Date().toISOString(),
    axes: { A: score.axes.A.sum, B: score.axes.B.sum, C: score.axes.C.sum, D: score.axes.D.sum },
    tasksCorrect: grade.correct, tasksTotal: grade.total,
    persistenceSec: obs.persistenceSec, timeToClosureSec: obs.timeToClosureSec,
    helpRequests: obs.helpRequests, helpSpecific: obs.helpSpecific,
    firstClosureSign: obs.firstClosureSign, finished: obs.finished,
  }), [childId, name, age, appNo, specialist, score, grade, obs])

  async function saveResult() {
    if (!childId) { setToast('اربط الطفل أولاً لحفظ النتيجة'); return }
    if (!score.complete) { setToast('أكمل الاستمارة قبل الحفظ'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/behavioral-compass', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...liveRecord, childName: name || children.find(c => c.id === childId)?.name || '' }),
      })
      if (res.ok) {
        setToast('✓ حُفظت النتيجة في سجلّ الطفل')
        const r = await fetch(`/api/admin/behavioral-compass?childId=${encodeURIComponent(childId)}`).then(x => x.json()).catch(() => null)
        if (Array.isArray(r?.records)) setHistory(r.records)
      } else {
        const d = await res.json().catch(() => ({}))
        setToast(d.error || '❌ تعذّر الحفظ')
      }
    } catch {
      setToast('❌ تعذّر الحفظ — تحقّق من الاتصال')
    } finally { setSaving(false) }
  }

  function reset() {
    if (!confirm('مسح كل البيانات والبدء من جديد؟')) return
    setName(''); setAge(''); setAppNo('الأول'); setChildId('')
    setSelf({}); setTasks({}); setObs(emptyObservation()); setInterview({}); setOpen({})
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setStep('intro')
  }

  const stepIdx = STEPS.findIndex(s => s.key === step)
  const goNext = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)].key)
  const goBack = () => setStep(STEPS[Math.max(0, stepIdx - 1)].key)

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-start gap-3 print:hidden">
        <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-brand-sm">
          <Compass className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900">البوصلة السلوكية–التعلّمية</h1>
          <p className="text-sm text-slate-500">فحص وملاحظة غير معياريّ — تصحيح أوتوماتيكي، دون طباعة.</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-xl border border-slate-200">
          <RotateCcw className="w-3.5 h-3.5" /> من جديد
        </button>
      </div>

      {/* شريط الخطوات */}
      <div className="flex items-center gap-1.5 print:hidden">
        {STEPS.map((s, i) => (
          <button key={s.key} onClick={() => setStep(s.key)}
            className={`flex-1 text-center py-2 rounded-xl text-[11px] font-bold transition border
              ${i === stepIdx ? 'bg-brand-500 text-white border-brand-500'
                : i < stepIdx ? 'bg-brand-50 text-brand-700 border-brand-100'
                : 'bg-white text-slate-400 border-slate-200'}`}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* ── التعريف ── */}
      {step === 'intro' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          {/* ربط الطفل من السجلّ — لازم للحفظ والمقارنة */}
          <div>
            <span className="block text-xs font-bold text-slate-500 mb-1">الطفل (اربطه لحفظ النتيجة ومقارنتها)</span>
            {childId ? (
              <div className="flex items-center justify-between gap-3 bg-brand-50 border border-brand-100 rounded-xl px-3.5 py-2.5">
                <p className="text-sm font-bold text-brand-700 flex items-center gap-1.5"><Link2 className="w-4 h-4" /> {children.find(c => c.id === childId)?.name || name || 'طفل مرتبط'}{history.length > 0 ? ` · ${history.length} قياس سابق` : ''}</p>
                <button onClick={() => { setChildId(''); }} className="text-brand-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-brand-400">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input value={childQuery} onChange={e => { setChildQuery(e.target.value); setPickerOpen(true) }} onFocus={() => setPickerOpen(true)}
                    className="flex-1 outline-none text-sm bg-transparent" placeholder="ابحث باسم الطفل…" />
                </div>
                {pickerOpen && childQuery.trim() && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                    {children.filter(c => c.name.includes(childQuery.trim())).slice(0, 20).map(c => (
                      <button key={c.id} onClick={() => { setChildId(c.id); if (!name) setName(c.name); if (!age && c.age) setAge(c.age); setPickerOpen(false); setChildQuery('') }}
                        className="w-full text-right px-3.5 py-2.5 text-sm hover:bg-brand-50 transition border-b border-slate-50 last:border-0">
                        {c.name}{c.age ? <span className="text-slate-400"> · {c.age} سنة</span> : null}
                      </button>
                    ))}
                    {children.filter(c => c.name.includes(childQuery.trim())).length === 0 && (
                      <p className="px-3.5 py-3 text-xs text-slate-400">لا نتائج — يمكنك المتابعة دون ربط (لن تُحفظ النتيجة).</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="اسم الطفل"><input value={name} onChange={e => setName(e.target.value)} className="af-in" placeholder="الاسم" /></Field>
            <Field label="العمر"><input value={age} onChange={e => setAge(e.target.value)} className="af-in" placeholder="بالسنوات" /></Field>
            <Field label="اسم الأخصائي"><input value={specialist} onChange={e => setSpecialist(e.target.value)} className="af-in" placeholder="اختياري" /></Field>
            <Field label="رقم التطبيق">
              <div className="flex gap-2">
                {(['الأول', 'الثاني'] as const).map(v => (
                  <button key={v} onClick={() => setAppNo(v)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${appNo === v ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4" /> قبل البدء</p>
            قل للطفل: «هذه ليست امتحاناً، ولا توجد إجابة صحيحة أو خاطئة. أريد أن أعرف كيف ترى نفسك، حتى أعرف كيف أساعدك».
            المدح أثناء الأداء مسموح ويُشجَّع. التلميح أو الإلحاح غير المسجَّل يُتجنَّب.
          </div>
          <NavRow onNext={goNext} nextLabel="ابدأ الاستمارة" />
        </div>
      )}

      {/* ── الاستمارة ── */}
      {step === 'self' && (
        <div className="space-y-4">
          {AXES.map(axis => {
            const Icon = AXIS_ICON[axis.key]
            const items = SELF_REPORT.filter(it => it.axis === axis.key)
            return (
              <div key={axis.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                  <div><p className="font-black text-slate-800 text-sm">{axis.code} — {axis.title}</p><p className="text-[11px] text-slate-400">{axis.subtitle}</p></div>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map(it => (
                    <div key={it.id} className="px-5 py-3">
                      <p className="text-sm text-slate-700 font-medium mb-2">{it.text}</p>
                      <div className="flex gap-1.5">
                        {ANSWER_SCALE.map(opt => (
                          <button key={opt.value} onClick={() => setSelf(s => ({ ...s, [it.id]: opt.value as AnswerValue }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${self[it.id] === opt.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="text-center text-xs text-slate-400">أُجيب على {score.answeredCount} من {SELF_REPORT.length} عبارة</div>
          <NavRow onBack={goBack} onNext={goNext} />
        </div>
      )}

      {/* ── المهام ── */}
      {step === 'tasks' && (
        <div className="space-y-4">
          {/* مؤقّت الملاحظة — مثبّت أعلى الصفحة (sticky) حتى تبقى أزرار اللحظات
              في متناول اليد أثناء اختبار الطفل دون الحاجة للتمرير للأعلى. */}
          <div className="sticky top-14 z-20 -mx-1 px-1 pt-1 pb-2 bg-slate-50/95 backdrop-blur-sm rounded-b-2xl">
            <ObservationStopwatch obs={obs} setObs={setObs} />
          </div>

          {/* مفتاح عرض القواعد — للمختص فقط */}
          <label className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2.5 cursor-pointer">
            <span className="text-xs font-bold text-slate-600">عرض القاعدة والحلّ لكل بند <span className="text-slate-400">(للمختص فقط — أخفِها أمام الطفل)</span></span>
            <button type="button" onClick={() => setShowRules(v => !v)}
              className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${showRules ? 'bg-brand-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${showRules ? 'left-0.5' : 'right-0.5'}`} />
            </button>
          </label>

          {([1, 2, 3] as const).map(level => (
            <div key={level} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 font-black text-slate-800 text-sm">
                المستوى {level === 1 ? 'الأول (سهل)' : level === 2 ? 'الثاني (متوسّط)' : 'الثالث (صعب)'}
              </div>
              <div className="divide-y divide-slate-50">
                {TASKS.filter(t => t.level === level).map(t => {
                  const num = TASKS.findIndex(x => x.id === t.id) + 1
                  return (
                  <div key={t.id} className="px-5 py-4">
                    {t.kind === 'numeric' ? (
                      <div>
                        <p className="text-sm text-slate-600 font-bold mb-2">{num}. أكمل السلسلة:</p>
                        {/* ترتيب من اليمين إلى اليسار: أول عدد على اليمين، «؟» على اليسار */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {t.sequence.map((n, i) => <span key={i} className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-700">{n}</span>)}
                          <span className="text-xl font-black text-brand-500">؟</span>
                        </div>
                        <input inputMode="numeric" value={String(tasks[t.id] ?? '')} onChange={e => setTasks(s => ({ ...s, [t.id]: e.target.value }))}
                          className="af-in w-32" placeholder="الإجابة" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-600 font-bold mb-3">{num}. {t.prompt}</p>
                        <div className="mb-4 overflow-x-auto"><StemView task={t} /></div>
                        <div className="grid grid-cols-4 gap-2 max-w-sm">
                          {t.options.map((opt, i) => (
                            <button key={i} onClick={() => setTasks(s => ({ ...s, [t.id]: i }))}
                              className={`relative aspect-square rounded-xl border-2 flex items-center justify-center transition ${tasks[t.id] === i ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                              <GlyphView g={opt} size={44} />
                              {showRules && i === t.correctIndex && <span className="absolute top-1 left-1 text-emerald-500"><CheckCircle2 className="w-4 h-4" /></span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {showRules && (
                      <p className="mt-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <b className="text-slate-600">القاعدة:</b> {t.rule}
                        {t.kind === 'numeric' && <> — <b className="text-slate-600">الإجابة:</b> <span dir="ltr">{t.answer}</span></>}
                      </p>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
            تذكير: عدد الإجابات الصحيحة مؤشّر <b>ثانوي</b>. الأهمّ هو ملاحظة السلوك أثناء الحلّ (الزمن، التلميحات، علامات الانغلاق) — سجّلها في الخطوة التالية.
          </div>
          <NavRow onBack={goBack} onNext={goNext} />
        </div>
      )}

      {/* ── الملاحظة ── */}
      {step === 'observe' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="font-black text-slate-800 text-sm mb-1">ورقة التسجيل أثناء المهام</p>
            <p className="text-[11px] text-emerald-600 font-bold mb-1">⏱ حقول الزمن تُملأ تلقائياً من «مؤقّت الملاحظة» في خطوة المهام — ويمكنك تعديلها.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="زمن البدء بعد التعليمة (ث)"><input value={obs.startDelaySec} onChange={e => setObs(o => ({ ...o, startDelaySec: e.target.value }))} className="af-in" inputMode="numeric" /></Field>
              <Field label="زمن الاستمرار قبل أول توقّف (ث)"><input value={obs.persistenceSec} onChange={e => setObs(o => ({ ...o, persistenceSec: e.target.value }))} className="af-in" inputMode="numeric" /></Field>
              <Field label="عدد المحاولات المختلفة"><input value={obs.attempts} onChange={e => setObs(o => ({ ...o, attempts: e.target.value }))} className="af-in" inputMode="numeric" /></Field>
              <Field label="عدد مرات طلب المساعدة"><input value={obs.helpRequests} onChange={e => setObs(o => ({ ...o, helpRequests: e.target.value }))} className="af-in" inputMode="numeric" /></Field>
              <Field label="الزمن من أول صعوبة إلى الانغلاق (ث)"><input value={obs.timeToClosureSec} onChange={e => setObs(o => ({ ...o, timeToClosureSec: e.target.value }))} className="af-in" inputMode="numeric" /></Field>
              <Field label="هل طلب المساعدة بصيغة محدّدة؟">
                <div className="flex gap-2">
                  {(['yes', 'no'] as const).map(v => (
                    <button key={v} onClick={() => setObs(o => ({ ...o, helpSpecific: o.helpSpecific === v ? '' : v }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${obs.helpSpecific === v ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>{v === 'yes' ? 'نعم' : 'لا'}</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="هل أنهى المهمة؟">
              <div className="flex gap-2">
                {([['yes', 'نعم'], ['partly', 'جزئياً'], ['no', 'لا']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setObs(o => ({ ...o, finished: o.finished === v ? '' : v }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${obs.finished === v ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200'}`}>{l}</button>
                ))}
              </div>
            </Field>
            <Field label="ما الذي أعاده إلى المهمة؟"><input value={obs.broughtBack} onChange={e => setObs(o => ({ ...o, broughtBack: e.target.value }))} className="af-in" /></Field>
            <Field label="عبارات قالها عن نفسه (تُنقل حرفيّاً)"><textarea value={obs.selfPhrases} onChange={e => setObs(o => ({ ...o, selfPhrases: e.target.value }))} className="af-in min-h-[70px]" /></Field>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="font-black text-slate-800 text-sm mb-2">التلميحات المستعملة</p>
            <div className="space-y-2">
              {HINTS.map(h => {
                const on = obs.hintsUsed.includes(h.code)
                return (
                  <button key={h.code} onClick={() => setObs(o => ({ ...o, hintsUsed: on ? o.hintsUsed.filter(x => x !== h.code) : [...o.hintsUsed, h.code] }))}
                    className={`w-full text-right p-3 rounded-xl border text-xs leading-relaxed transition ${on ? 'bg-brand-50 border-brand-300 text-brand-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <b>{h.code}</b> — {h.say}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="font-black text-slate-800 text-sm mb-2">أول علامة انغلاق</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 mb-1">لفظيّة</p>
                <div className="space-y-1">
                  {CLOSURE_SIGNS.verbal.map(s => (
                    <button key={s.code} onClick={() => setObs(o => ({ ...o, firstClosureSign: o.firstClosureSign === s.code ? '' : s.code }))}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] border transition ${obs.firstClosureSign === s.code ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                      <b>{s.code}</b> {s.text}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 mb-1">جسديّة وسلوكيّة</p>
                <div className="space-y-1">
                  {CLOSURE_SIGNS.physical.map(s => (
                    <button key={s.code} onClick={() => setObs(o => ({ ...o, firstClosureSign: o.firstClosureSign === s.code ? '' : s.code }))}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] border transition ${obs.firstClosureSign === s.code ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                      <b>{s.code}</b> {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="font-black text-slate-800 text-sm">الأسئلة المفتوحة الثلاثة (شفهيّة — تُنقل إجابته بكلماته)</p>
            {OPEN_QUESTIONS.map((q, i) => (
              <Field key={i} label={`${i + 1}. ${q}`}><textarea value={open[i] ?? ''} onChange={e => setOpen(o => ({ ...o, [i]: e.target.value }))} className="af-in min-h-[56px]" /></Field>
            ))}
          </div>
          <NavRow onBack={goBack} onNext={goNext} />
        </div>
      )}

      {/* ── مقابلة وليّ الأمر ── */}
      {step === 'interview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="font-black text-slate-800 text-sm">مقابلة وليّ الأمر (يمكن تأجيلها)</p>
            {PARENT_INTERVIEW.map((q, i) => (
              <Field key={i} label={`${i + 1}. ${q}`}><textarea value={interview[i] ?? ''} onChange={e => setInterview(o => ({ ...o, [i]: e.target.value }))} className="af-in min-h-[52px]" /></Field>
            ))}
          </div>
          <NavRow onBack={goBack} onNext={() => setStep('report')} nextLabel="عرض النتيجة" />
        </div>
      )}

      {/* ── النتيجة ── */}
      {step === 'report' && (
        <Report
          name={name} age={age} specialist={specialist} appNo={appNo} today={today}
          score={score} grade={grade} reading={reading} obs={obs}
          onBack={goBack}
          childId={childId} history={history} live={liveRecord} saving={saving} onSave={saveResult}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold print:hidden" onClick={() => setToast('')}>
          {toast}
        </div>
      )}

      <style jsx global>{`
        .af-in { width: 100%; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.6rem 0.8rem; font-size: 0.875rem; outline: none; background: #fff; }
        .af-in:focus { border-color: #7c5cfc; box-shadow: 0 0 0 3px rgba(124,92,252,.12); }
      `}</style>
    </div>
  )
}

// ── مؤقّت الملاحظة — يقيس الأزمنة تلقائياً من لحظات مُعلَّمة ──────────────────────
// يبدأ المختص المؤقّت عند إعطاء التعليمة، ثم يضغط اللحظات كما تحدث؛ فتُحسب
// الأزمنة (البدء، الاستمرار، حتى الانغلاق) تلقائياً وتُملأ ورقة الملاحظة.
function fmtClock(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function ObservationStopwatch({ obs, setObs }: { obs: ObservationRecord; setObs: React.Dispatch<React.SetStateAction<ObservationRecord>> }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [marks, setMarks] = useState<{ start?: number; difficulty?: number; stop?: number; closure?: number }>({})

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  function applyMarks(nm: typeof marks) {
    // احسب الأزمنة من اللحظات المُعلَّمة واملأ ورقة الملاحظة تلقائياً.
    const patch: Partial<ObservationRecord> = {}
    if (nm.start != null) patch.startDelaySec = String(nm.start)
    if (nm.start != null && nm.stop != null) patch.persistenceSec = String(Math.max(0, nm.stop - nm.start))
    if (nm.difficulty != null && nm.closure != null) patch.timeToClosureSec = String(Math.max(0, nm.closure - nm.difficulty))
    if (Object.keys(patch).length) setObs(o => ({ ...o, ...patch }))
  }
  function mark(key: keyof typeof marks) {
    if (!running && elapsed === 0) setRunning(true) // أول لحظة تُشغّل المؤقّت تلقائياً
    setMarks(m => { const nm = { ...m, [key]: elapsed }; applyMarks(nm); return nm })
  }
  function reset() {
    setRunning(false); setElapsed(0); setMarks({})
    setObs(o => ({ ...o, startDelaySec: '', persistenceSec: '', timeToClosureSec: '' }))
  }

  const EVENTS: { key: keyof typeof marks; label: string; hint: string }[] = [
    { key: 'start',      label: 'بدأ الطفل',   hint: 'يُحسب زمن البدء بعد التعليمة' },
    { key: 'difficulty', label: 'ظهرت صعوبة',  hint: 'بداية احتساب زمن الانغلاق' },
    { key: 'stop',       label: 'أوّل توقّف',   hint: 'يُحسب زمن الاستمرار' },
    { key: 'closure',    label: 'انغلاق',      hint: 'يُحسب الزمن حتى الانغلاق' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center gap-2">
        <Timer className="w-4 h-4 text-brand-600" />
        <p className="text-xs font-black text-brand-700">مؤقّت الملاحظة — يقيس الأزمنة تلقائياً</p>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-black text-slate-800 tabular-nums" dir="ltr">{fmtClock(elapsed)}</div>
          <button type="button" onClick={() => setRunning(r => !r)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-500 hover:bg-brand-600'}`}>
            {running ? <><Pause className="w-4 h-4" /> إيقاف مؤقّت</> : <><Play className="w-4 h-4" /> {elapsed === 0 ? 'ابدأ (عند التعليمة)' : 'استئناف'}</>}
          </button>
          <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">
            <RotateCcw className="w-3.5 h-3.5" /> صفّر
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">اضغط اللحظة فور حدوثها (أوّل ضغطة تُشغّل المؤقّت):</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EVENTS.map(ev => (
            <button key={ev.key} type="button" onClick={() => mark(ev.key)} title={ev.hint}
              className={`py-2 rounded-xl text-xs font-bold border transition ${marks[ev.key] != null ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              {ev.label}
              {marks[ev.key] != null && <span className="block text-[10px] font-black mt-0.5" dir="ltr">{fmtClock(marks[ev.key]!)}</span>}
            </button>
          ))}
        </div>
        {(obs.startDelaySec || obs.persistenceSec || obs.timeToClosureSec) && (
          <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
            {obs.startDelaySec && <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">البدء: {obs.startDelaySec} ث</span>}
            {obs.persistenceSec && <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">الاستمرار: {obs.persistenceSec} ث</span>}
            {obs.timeToClosureSec && <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">حتى الانغلاق: {obs.timeToClosureSec} ث</span>}
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">تُملأ ورقة الملاحظة تلقائياً — يمكن تعديلها.</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── مكوّنات مساعدة ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>{children}</label>
}
function NavRow({ onBack, onNext, nextLabel = 'التالي' }: { onBack?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="flex items-center justify-between pt-1 print:hidden">
      {onBack ? <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"><ArrowRight className="w-4 h-4" /> السابق</button> : <span />}
      {onNext && <button onClick={onNext} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 shadow-brand-sm">{nextLabel} <ArrowLeft className="w-4 h-4" /></button>}
    </div>
  )
}

// ── التقرير (قراءة أوتوماتيكية) ─────────────────────────────────────────────────
function Report({ name, age, specialist, appNo, today, score, grade, reading, obs, onBack, childId, history, live, saving, onSave }: {
  name: string; age: string; specialist: string; appNo: string; today: string
  score: ReturnType<typeof scoreSelfReport>
  grade: ReturnType<typeof gradeTasks>
  reading: ReturnType<typeof interpret>
  obs: ObservationRecord
  onBack: () => void
  childId: string
  history: CompassRecord[]
  live: CompassRecord
  saving: boolean
  onSave: () => void
}) {
  // المقارنة بآخر قياس محفوظ (إن وُجد)
  const previous = history[0]
  const comparison = previous ? compareCompass(previous, live) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap print:hidden">
        <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"><ArrowRight className="w-4 h-4" /> السابق</button>
        <div className="flex items-center gap-2">
          <button onClick={onSave} disabled={saving || !childId || !score.complete}
            title={!childId ? 'اربط الطفل في خطوة التعريف لحفظ النتيجة' : !score.complete ? 'أكمل الاستمارة' : 'احفظ في سجلّ الطفل'}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 disabled:opacity-50 shadow-brand-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ النتيجة
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black"><Printer className="w-4 h-4" /> طباعة / PDF</button>
        </div>
      </div>

      {!childId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 print:hidden">
          لم تربط هذه النتيجة بطفل — اربطه في خطوة «التعريف» حتى تُحفظ وتُقارَن بالقياسات القادمة.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:shadow-none print:border-0">
        {/* ترويسة */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-[11px] font-black tracking-widest text-brand-500">AMINE ACADEMY</p>
            <h2 className="text-lg font-black text-slate-900">نتيجة البوصلة السلوكية–التعلّمية</h2>
          </div>
          <div className="text-left text-xs text-slate-500 leading-relaxed">
            {name && <p><b className="text-slate-700">الطفل:</b> {name}{age ? ` · ${age} سنة` : ''}</p>}
            <p><b className="text-slate-700">التطبيق:</b> {appNo} · {today}</p>
            {specialist && <p><b className="text-slate-700">الأخصائي:</b> {specialist}</p>}
          </div>
        </div>

        {/* درجات المحاور */}
        <div>
          <p className="font-black text-slate-800 text-sm mb-3 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-brand-500" /> درجات المحاور (من 24)</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {AXES.map(axis => {
              const sc = score.axes[axis.key]
              const meta = CATEGORY_META[sc.category]
              const tone = TONE[meta.tone]
              const pct = Math.round(((sc.sum - 6) / 18) * 100)
              return (
                <div key={axis.key} className={`rounded-xl border p-3 ${tone.bg} ${tone.border}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-black text-slate-800 text-sm">{axis.code} — {axis.title}</p>
                    <span className={`text-xs font-black ${tone.text}`}>{sc.sum}/24</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/70 overflow-hidden mb-1.5"><div className={`h-full ${tone.bar}`} style={{ width: `${Math.max(4, pct)}%` }} /></div>
                  <span className={`text-[11px] font-black ${tone.text}`}>{meta.label}</span>
                </div>
              )
            })}
          </div>
          {!score.complete && <p className="text-[11px] text-amber-600 mt-2">⚠ الاستمارة غير مكتملة ({score.answeredCount}/{SELF_REPORT.length}) — الدرجات أعلاه جزئيّة.</p>}
        </div>

        {/* المقارنة بآخر قياس محفوظ */}
        {comparison && previous && (
          <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-4">
            <p className="font-black text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-500" /> المقارنة بالقياس السابق
              <span className="text-[11px] font-normal text-slate-400">({previous.appNo} · {formatDateTime(previous.createdAt, ARABIC_LOCALE, { month: 'short', day: 'numeric' })} · منذ {comparison.daysBetween} يوماً)</span>
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              {comparison.axes.map(d => {
                const meta = AXES.find(a => a.key === d.axis)!
                const up = d.delta > 0, down = d.delta < 0
                return (
                  <div key={d.axis} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">{meta.code} — {meta.title}</span>
                    <span className={`text-xs font-black flex items-center gap-1.5 ${up ? 'text-emerald-600' : down ? 'text-red-600' : 'text-slate-400'}`}>
                      <span className="text-slate-400 font-normal">السابق {d.prev} · الحالي</span> {d.curr}
                      {up ? <TrendingUp className="w-3.5 h-3.5" /> : down ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      {d.delta !== 0 && <span>({d.delta > 0 ? '+' : ''}{d.delta})</span>}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-1.5">المؤشّرات السلوكيّة (تتحرّك قبل الدرجات):</p>
            <div className="flex flex-wrap gap-2">
              {comparison.indicators.map((ind, i) => {
                const improved = ind.trend !== 'na' && ind.trend !== 'flat' && ((ind.trend === 'up') === ind.betterWhenUp)
                const worse = ind.trend !== 'na' && ind.trend !== 'flat' && !improved
                return (
                  <span key={i} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${improved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : worse ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {ind.label}: <span className="font-normal">السابق</span> {ind.prev || '—'} · <span className="font-normal">الحالي</span> {ind.curr || '—'}
                    {improved ? ' ↑' : worse ? ' ↓' : ''}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* سجلّ القياسات */}
        {history.length > 0 && (
          <div>
            <p className="font-black text-slate-800 text-sm mb-2 flex items-center gap-1.5"><HistoryIcon className="w-4 h-4 text-brand-500" /> سجلّ القياسات ({history.length})</p>
            <div className="space-y-1.5">
              {history.slice(0, 6).map(rec => (
                <div key={rec.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-100">
                  <span className="font-bold text-slate-600">{rec.appNo} · {formatDateTime(rec.createdAt, ARABIC_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span className="text-slate-500" dir="ltr">أ{rec.axes.A} · ب{rec.axes.B} · ج{rec.axes.C} · د{rec.axes.D}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* المهام */}
        <div>
          <p className="font-black text-slate-800 text-sm mb-2">كرّاسة المهام — عدد الإجابات الصحيحة <span className="text-slate-400 font-normal">(مؤشّر ثانوي)</span></p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold text-slate-700">المجموع: {grade.correct}/{grade.total}</span>
            {([1, 2, 3] as const).map(l => <span key={l} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">م{l}: {grade.byLevel[l].correct}/{grade.byLevel[l].total}</span>)}
          </div>
        </div>

        {/* الملاحظة السلوكية */}
        {(obs.firstClosureSign || obs.hintsUsed.length > 0 || obs.persistenceSec || obs.timeToClosureSec) && (
          <div>
            <p className="font-black text-slate-800 text-sm mb-2">مؤشّرات الملاحظة (الأهمّ)</p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {obs.persistenceSec && <Chip>الاستمرار قبل التوقّف: {obs.persistenceSec} ث</Chip>}
              {obs.timeToClosureSec && <Chip>من الصعوبة إلى الانغلاق: {obs.timeToClosureSec} ث</Chip>}
              {obs.helpRequests && <Chip>طلب المساعدة: {obs.helpRequests} مرّة</Chip>}
              {obs.helpSpecific && <Chip>بصيغة محدّدة: {obs.helpSpecific === 'yes' ? 'نعم' : 'لا'}</Chip>}
              {obs.hintsUsed.length > 0 && <Chip>التلميحات: {obs.hintsUsed.join('، ')}</Chip>}
              {obs.firstClosureSign && <Chip>أول علامة انغلاق: {obs.firstClosureSign}</Chip>}
              {obs.finished && <Chip>أنهى المهمة: {obs.finished === 'yes' ? 'نعم' : obs.finished === 'partly' ? 'جزئياً' : 'لا'}</Chip>}
            </div>
            {obs.selfPhrases && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2 border-r-2 border-brand-300">«{obs.selfPhrases}»</p>}
          </div>
        )}

        {/* القراءة */}
        {reading.priorities.length > 0 && (
          <div>
            <p className="font-black text-slate-800 text-sm mb-2">أولويّات التدخّل</p>
            <div className="space-y-2">
              {reading.priorities.map(p => (
                <div key={p.axis} className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="font-black text-red-700 text-sm">{p.label}</p>
                  <p className="text-xs text-red-800/80 mt-0.5 leading-relaxed">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="font-black text-slate-800 text-sm mb-2">الفرضيّات التفسيريّة</p>
          <ul className="space-y-1.5">
            {reading.hypotheses.map((h, i) => <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2"><span className="text-brand-500 font-black">•</span>{h}</li>)}
          </ul>
        </div>

        <div>
          <p className="font-black text-slate-800 text-sm mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-brand-500" /> بروتوكول التعامل مع لحظة الانغلاق</p>
          <div className="space-y-1.5">
            {reading.protocol.map(s => (
              <div key={s.step} className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
                <p className="text-xs text-slate-600 leading-relaxed"><b className="text-slate-800">{s.title}:</b> {s.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="font-black text-slate-800 text-sm mb-1.5 flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-brand-500" /> إعادة القياس</p>
          <ul className="space-y-1">{reading.remeasure.map((r, i) => <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2"><span className="text-brand-400">•</span>{r}</li>)}</ul>
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed"><b className="text-slate-700">حدود الأداة:</b> {reading.limits}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed"><b className="text-slate-700">متى تُحال الحالة:</b> {reading.referral}</p>
          <p className="text-[10px] text-slate-400 text-center pt-2">AMINE ACADEMY — أداة فحص وملاحظة غير معياريّة · لا تُستعمل للتشخيص</p>
        </div>
      </div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-600">{children}</span>
}
