'use client'
// Interactive APA (Adapted Physical Activity) session planner.
//
// Shows the 60-minute session structure for a condition and age band, with a
// live timer that highlights the phase the specialist should be running right
// now. Content comes from lib/apa-plan-data.ts; this file is only the view.
//
// Condition and age band can be preselected (see the toolkit hand-off), so
// entering a child's data lands the specialist on the right plan rather than
// making them pick it again.
import { useState, useEffect, useRef, useMemo } from 'react'
import { apaPlanData, type ApaCondition } from '@/lib/apa-plan-data'

const ACCENTS: Record<ApaCondition, { accent: string; tint: string; tint2: string }> = {
  adhd: { accent: '#C0521B', tint: '#FBE9DC', tint2: '#F3D3B8' },
  asd:  { accent: '#1F7A6C', tint: '#E2F1EC', tint2: '#C7E4DA' },
}
const NAVY = '#1B3A5C'
const LABELS: Record<ApaCondition, string> = {
  adhd: apaPlanData.adhd.label,
  asd: apaPlanData.asd.label,
}
const SESSION_SECONDS = 60 * 60

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

interface Props {
  /** Preselected from the child's declared concerns. */
  initialCondition?: ApaCondition
  /** Preselected from the child's age. */
  initialGroupIndex?: number
  /** Shown as context when arriving from a specific child's assessment. */
  childLabel?: string
}

export default function ApaSessionPlanner({
  initialCondition = 'adhd',
  initialGroupIndex = 0,
  childLabel,
}: Props) {
  const [cond, setCond] = useState<ApaCondition>(initialCondition)
  const [ageIndex, setAgeIndex] = useState(initialGroupIndex)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const group = apaPlanData[cond].groups[ageIndex]
  const accent = ACCENTS[cond]

  const cumulative = useMemo(() => {
    let cum = 0
    return group.session.map(s => {
      const mins = parseInt(s.duration, 10) || 0
      const entry = { start: cum, end: cum + mins, mins }
      cum += mins
      return entry
    })
  }, [group])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= SESSION_SECONDS) {
          setRunning(false)
          return SESSION_SECONDS
        }
        return e + 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function resetTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setElapsed(0)
  }
  function switchCond(next: ApaCondition) { resetTimer(); setCond(next); setAgeIndex(0) }
  function switchAge(i: number) { resetTimer(); setAgeIndex(i) }

  const elapsedMin = elapsed / 60
  const activeIdx = cumulative.findIndex(c => elapsedMin >= c.start && elapsedMin < c.end)
  const activePhase = activeIdx >= 0
    ? group.session[activeIdx].phase
    : elapsed >= SESSION_SECONDS ? 'انتهت الحصة' : '—'
  const remaining = Math.max(0, SESSION_SECONDS - elapsed)

  return (
    <div dir="rtl"
      style={{ ['--accent' as string]: accent.accent, ['--tint' as string]: accent.tint, ['--tint2' as string]: accent.tint2 }}
      className="text-[#232A31] max-w-5xl">

      {/* Header */}
      <div className="rounded-xl p-5 mb-5 text-white print:rounded-none" style={{ background: NAVY, borderBottom: `5px solid var(--accent)` }}>
        <div className="text-xs tracking-wide text-[#B9C7D6] font-semibold mb-1">AMINE ACADEMY</div>
        <h1 className="text-xl font-black mb-1">دليل حصص النشاط البدني المعدّل</h1>
        <p className="text-sm text-[#C9D3DC]">
          {childLabel
            ? `الخطة مضبوطة تلقائياً على بيانات: ${childLabel} — يمكنك تعديل الاختيار أدناه.`
            : 'اختر الحالة والفئة العمرية، ثم شغّل عداد الحصة لمتابعة كل مرحلة لحظة بلحظة.'}
        </p>
      </div>

      {/* Condition + age controls */}
      <div className="mb-5 print:hidden">
        <p className="text-xs font-bold text-gray-500 mb-2">الحالة المستهدفة</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {(['adhd', 'asd'] as ApaCondition[]).map(c => (
            <button key={c} onClick={() => switchCond(c)}
              className="px-4 py-2 rounded-full text-sm font-bold border transition"
              style={cond === c
                ? { background: NAVY, borderColor: NAVY, color: '#fff' }
                : { background: '#fff', borderColor: '#E4E0D7', color: '#232A31' }}>
              {LABELS[c]}
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-gray-500 mb-2">الفئة العمرية</p>
        <div className="flex gap-2 flex-wrap">
          {apaPlanData[cond].groups.map((g, i) => (
            <button key={g.range} onClick={() => switchAge(i)}
              className="px-4 py-2 rounded-full text-sm font-bold border transition"
              style={ageIndex === i
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                : { background: '#fff', borderColor: '#E4E0D7', color: '#232A31' }}>
              {g.range}
            </button>
          ))}
        </div>
      </div>

      {/* Principles */}
      <div className="rounded-xl p-5 mb-5 text-white print:rounded-none" style={{ background: NAVY }}>
        <h2 className="text-sm font-black mb-2">المبادئ العامة الموجّهة لتصميم حصص {LABELS[cond]}</h2>
        <ul className="grid md:grid-cols-2 gap-x-7 gap-y-1 text-sm text-[#D7E0E8] list-disc pr-5">
          {apaPlanData[cond].principles.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-5">
        {/* Timeline / runner */}
        <div className="bg-white border border-[#E4E0D7] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-black" style={{ color: NAVY }}>هيكل الحصة (60 دقيقة)</h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--tint)', color: 'var(--accent)' }}>
              {LABELS[cond]} · {group.range}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap print:hidden">
            <button onClick={() => setRunning(r => !r)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--accent)' }}>
              {running ? 'إيقاف مؤقت' : elapsed > 0 ? 'استئناف' : 'ابدأ الحصة'}
            </button>
            <button onClick={resetTimer} className="px-4 py-2 rounded-lg text-sm font-bold border border-[#E4E0D7] text-gray-500">
              إعادة ضبط
            </button>
            <span className="text-sm text-gray-500 mr-auto">
              {elapsed > 0 || running
                ? <>المرحلة الحالية: <b className="text-[#232A31]">{activePhase}</b> — المتبقي: <b className="text-[#232A31] ltr-num">{fmt(remaining)}</b></>
                : 'جاهز للبدء'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {group.session.map((s, i) => {
              const isActive = i === activeIdx
              const isDone = cumulative[i] && elapsedMin >= cumulative[i].end
              return (
                <div key={i}
                  className="flex gap-3 border rounded-lg p-3 transition-colors break-inside-avoid"
                  style={{
                    borderColor: '#E4E0D7',
                    borderInlineStart: `6px solid ${isActive ? 'var(--accent)' : 'var(--tint2)'}`,
                    background: isActive ? 'var(--tint)' : '#fff',
                    opacity: isDone ? 0.55 : 1,
                  }}>
                  <div className="min-w-[62px] flex items-center justify-center font-black text-xs" style={{ color: 'var(--accent)' }}>
                    {s.duration}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1">{s.phase}</div>
                    <ul className="text-xs text-gray-600 list-disc pr-4 space-y-0.5">
                      {s.details.map((d, j) => <li key={j}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Characteristics + goals */}
        <div className="bg-white border border-[#E4E0D7] rounded-xl p-5">
          <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>الخصائص النمائية ذات الصلة</h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1.5 mb-5">
            {group.characteristics.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>أهداف الحصص لهذه الفئة</h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1.5">
            {group.goals.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </div>

      {/* Behavior modification */}
      <div className="bg-white border border-[#E4E0D7] rounded-xl p-5 mt-5">
        <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>بروتوكول تعديل السلوك</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {group.behaviorMod.map((b, i) => (
            <div key={i} className="rounded-lg border border-[#E4E0D7] p-4 break-inside-avoid" style={{ background: '#FAF8F4' }}>
              <div className="font-bold text-sm mb-1" style={{ color: 'var(--accent)' }}>{b.title}</div>
              <div className="text-sm text-gray-700">{b.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Materials + indicators */}
      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <div className="bg-white border border-[#E4E0D7] rounded-xl p-5">
          <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>الأدوات والمواد اللازمة</h2>
          <ul className="text-sm divide-y divide-dashed divide-[#E4E0D7]">
            {group.materials.map((m, i) => (
              <li key={i} className="flex items-center gap-2 py-1.5">
                <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent.accent }} aria-label={m} />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-[#E4E0D7] rounded-xl p-5">
          <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>مؤشرات المتابعة والتقدم</h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1.5">
            {group.indicators.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </div>

      {/* Glossary */}
      <div className="bg-white border border-[#E4E0D7] rounded-xl p-5 mt-5">
        <h2 className="text-base font-black mb-3" style={{ color: NAVY }}>مسرد المصطلحات السلوكية</h2>
        <dl className="grid md:grid-cols-2 gap-x-6 gap-y-2.5">
          {apaPlanData.glossary.map((g, i) => (
            <div key={i} className="break-inside-avoid">
              <dt className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{g.term}</dt>
              <dd className="text-xs text-gray-600 leading-relaxed">{g.def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
