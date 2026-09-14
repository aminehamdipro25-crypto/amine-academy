'use client'
// Files the outcome of an APA session against a child.
//
// The plan lists indicators to track per age band, but before this nothing
// recorded them — a 60-minute physical session produced no data, so the parent's
// report could say nothing about it. This form closes that loop: what was
// actually run, how the child did on each of the plan's own indicators, and how
// long it took, filed under the child and rolled into their progress report.
//
// The ratings are the specialist's judgement, not an instrumented measurement,
// and the form says so — the same discipline the rest of the platform applies.
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save, ClipboardCheck, CheckCircle2 } from 'lucide-react'
import type { ApaCondition, ApaGroup } from '@/lib/apa-plan-data'

interface StudentOption { id: string; name: string }

const SCORE_LABELS: Record<number, string> = {
  1: 'ضعيف جداً',
  2: 'ضعيف',
  3: 'متوسط',
  4: 'جيد',
  5: 'ممتاز',
}
const SCORE_COLORS: Record<number, string> = {
  1: '#DC2626', 2: '#EA580C', 3: '#D97706', 4: '#059669', 5: '#047857',
}

interface Props {
  cond: ApaCondition
  group: ApaGroup
  accent: string
  navy: string
  /** Minutes elapsed on the session timer, prefilled into the form. */
  elapsedMinutes: number
  /** Child name from the toolkit hand-off, used to preselect the student. */
  childNameHint?: string
}

export default function ApaSessionRecordForm({
  cond, group, accent, navy, elapsedMinutes, childNameHint,
}: Props) {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [minutes, setMinutes] = useState(0)
  const [phases, setPhases] = useState<Set<string>>(new Set())
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then((d: { clients?: Array<{ students?: Array<{ id: string; firstName: string; lastName?: string }> }> }) => {
        if (cancelled) return
        const opts: StudentOption[] = []
        for (const c of d.clients ?? []) {
          for (const s of c.students ?? []) {
            opts.push({ id: s.id, name: `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`.trim() })
          }
        }
        setStudents(opts)
        // Preselect the child the planner was opened for, when the hand-off
        // named one and exactly one child matches — never guess between two.
        const hint = (childNameHint ?? '').trim()
        if (hint) {
          const matches = opts.filter(o => o.name === hint || o.name.startsWith(hint + ' '))
          if (matches.length === 1) setStudentId(matches[0].id)
        }
      })
      .catch(() => { if (!cancelled) setMsg({ text: 'تعذّر تحميل قائمة الأطفال', ok: false }) })
      .finally(() => { if (!cancelled) setLoadingStudents(false) })
    return () => { cancelled = true }
  }, [childNameHint])

  // Switching band or condition invalidates every phase and indicator, which
  // belong to the band that was on screen when they were ticked.
  useEffect(() => {
    setPhases(new Set())
    setScores({})
    setMsg(null)
  }, [cond, group.range])

  // Keep the minutes field in step with the live timer until the specialist
  // types their own figure — after that their value wins.
  const [minutesTouched, setMinutesTouched] = useState(false)
  useEffect(() => {
    if (!minutesTouched) setMinutes(elapsedMinutes)
  }, [elapsedMinutes, minutesTouched])

  const ratedCount = useMemo(() => Object.keys(scores).length, [scores])
  const canSave = Boolean(studentId) && (phases.size > 0 || ratedCount > 0) && !saving

  function togglePhase(p: string) {
    setPhases(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p); else next.add(p)
      return next
    })
  }

  async function save() {
    if (!canSave) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/apa-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          condition: cond,
          band: group.range,
          date,
          phasesCompleted: [...phases],
          indicators: Object.entries(scores).map(([label, score]) => ({ label, score })),
          minutes,
          notes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ text: data.error || 'تعذّر الحفظ', ok: false })
        return
      }
      setMsg({ text: 'تم حفظ الحصة ✓ ستظهر في تقرير الولي عند إنشائه لهذه الفترة', ok: true })
      setSavedCount(c => (c ?? 0) + 1)
      setPhases(new Set())
      setScores({})
      setNotes('')
    } catch {
      setMsg({ text: 'تعذّر الاتصال بالخادم', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = 'w-full border rounded-lg px-3 py-2 text-sm bg-white'
  const fieldStyle = { borderColor: '#E4E0D7' as const }

  return (
    <div className="bg-white border rounded-xl p-5 mt-5 print:hidden" style={{ borderColor: '#E4E0D7' }}>
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="w-5 h-5" style={{ color: accent }} />
        <h2 className="text-base font-black" style={{ color: navy }}>تسجيل نتائج الحصة</h2>
        {savedCount !== null && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedCount} حصة محفوظة في هذه الجلسة
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        المؤشرات أدناه هي مؤشرات هذه الفئة العمرية كما وردت في الخطة. التقييم <b>تقدير الأخصائي</b> وليس
        قياساً آلياً — يُعرض في تقرير الولي موصوفاً بذلك.
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="apa-student">الطفل</label>
          <select
            id="apa-student"
            className={fieldCls}
            style={fieldStyle}
            value={studentId}
            disabled={loadingStudents}
            onChange={e => setStudentId(e.target.value)}
          >
            <option value="">{loadingStudents ? 'جارٍ التحميل…' : '— اختر الطفل —'}</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="apa-date">تاريخ الحصة</label>
          <input id="apa-date" type="date" className={fieldCls} style={fieldStyle}
            value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="apa-minutes">المدة الفعلية (دقيقة)</label>
          <input id="apa-minutes" type="number" min={0} max={300} className={`${fieldCls} ltr-num`} style={fieldStyle}
            value={minutes}
            onChange={e => { setMinutesTouched(true); setMinutes(Math.max(0, Math.min(300, Number(e.target.value) || 0))) }} />
        </div>
      </div>

      <p className="text-xs font-bold text-gray-500 mb-2">
        المراحل المنفّذة ({phases.size} من {group.session.length})
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {group.session.map(s => {
          const on = phases.has(s.phase)
          return (
            <button key={s.phase} onClick={() => togglePhase(s.phase)} type="button"
              aria-pressed={on}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
              style={on
                ? { background: accent, borderColor: accent, color: '#fff' }
                : { background: '#fff', borderColor: '#E4E0D7', color: '#6B7280' }}>
              {on ? '✓ ' : ''}{s.phase}
            </button>
          )
        })}
      </div>

      <p className="text-xs font-bold text-gray-500 mb-2">مؤشرات المتابعة</p>
      <div className="space-y-3 mb-5">
        {group.indicators.map(ind => {
          const val = scores[ind]
          return (
            <div key={ind} className="rounded-lg border p-3" style={{ borderColor: '#E4E0D7', background: '#FAF8F4' }}>
              <div className="text-sm text-gray-700 mb-2 leading-relaxed">{ind}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button"
                    onClick={() => setScores(prev => {
                      const next = { ...prev }
                      if (next[ind] === n) delete next[ind]; else next[ind] = n
                      return next
                    })}
                    aria-pressed={val === n}
                    aria-label={`${ind}: ${SCORE_LABELS[n]}`}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border transition"
                    style={val === n
                      ? { background: SCORE_COLORS[n], borderColor: SCORE_COLORS[n], color: '#fff' }
                      : { background: '#fff', borderColor: '#E4E0D7', color: '#9CA3AF' }}>
                    {n} · {SCORE_LABELS[n]}
                  </button>
                ))}
                {val !== undefined && (
                  <button type="button" className="text-xs text-gray-400 underline mr-1"
                    onClick={() => setScores(prev => { const n = { ...prev }; delete n[ind]; return n })}>
                    مسح
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="apa-notes">ملاحظات الأخصائي</label>
      <textarea id="apa-notes" rows={3} className={`${fieldCls} mb-4`} style={fieldStyle}
        placeholder="ما لوحظ أثناء الحصة، وما يُبنى عليه في الحصة القادمة…"
        value={notes} onChange={e => setNotes(e.target.value.slice(0, 2000))} />

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={save} disabled={!canSave} type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: accent }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الحصة
        </button>
        {!studentId && !loadingStudents && (
          <span className="text-xs text-gray-400">اختر الطفل أولاً</span>
        )}
        {msg && (
          <span className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</span>
        )}
      </div>
    </div>
  )
}
