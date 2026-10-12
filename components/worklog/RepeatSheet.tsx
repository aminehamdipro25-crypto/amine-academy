'use client'
import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import {
  MAX_COPY_DAYS, addDays, endTime, familyHasLessonAt, findConflicts, formatDuration, formatMoney, lessonWho, lessonsCount,
  startOfWeek, type WorkLesson,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog } from './useWorkLog'
import { Sheet, inputCls, localToday, primaryBtn, shortDate } from './ui'

const WEEKDAYS = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']
/** Last week (to fill in a lesson already given) and the four ahead. */
const WEEKS_SHOWN = 5

/**
 * «كرّر»: the same lesson — family, child, time, length, price, reminder — on
 * several days picked from a calendar, in one save. A day where this family
 * already has that hour cannot be picked, so nothing is ever booked twice.
 */
export default function RepeatSheet({ lesson, onClose, onOpenForm }: {
  lesson: WorkLesson | null
  onClose: () => void
  /** The full form, for a copy that changes more than the day. */
  onOpenForm: (l: WorkLesson) => void
}) {
  const { lessons, clientsById, settings, copyToDays } = useWorkLog()
  const { toast } = useToast()
  const today = localToday()
  const [start, setStart] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [weekFrom, setWeekFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset whenever another lesson is opened.
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  if ((lesson?.id ?? null) !== openedFor) {
    setOpenedFor(lesson?.id ?? null)
    setStart(lesson?.start ?? ''); setPicked([]); setError(''); setSaving(false)
    // From the week before today or the lesson, whichever comes first, so a lesson already given can be filled in too.
    setWeekFrom(addDays(startOfWeek(lesson && lesson.date < today ? lesson.date : today), -7))
  }

  const timeOk = /^\d\d:\d\d$/.test(start)
  const cand = lesson && timeOk ? { clientId: lesson.clientId, start, durationMin: lesson.durationMin } : null
  const days = useMemo(() => Array.from({ length: WEEKS_SHOWN * 7 }, (_, i) => addDays(weekFrom || today, i)), [weekFrom, today])

  const cellState = (date: string): 'taken' | 'busy' | 'free' => {
    if (!cand) return 'free'
    if (familyHasLessonAt(lessons, cand, date)) return 'taken'
    return findConflicts({ date, start, durationMin: cand.durationMin }, lessons).length ? 'busy' : 'free'
  }
  // A day that became taken after the time changed drops out of the selection.
  const valid = picked.filter(d => cellState(d) !== 'taken').sort()
  const clashes = valid.flatMap(d => findConflicts({ date: d, start, durationMin: lesson?.durationMin ?? 60 }, lessons)
    .map(o => ({ date: d, other: o })))

  if (!lesson) return null
  const c = clientsById.get(lesson.clientId)
  const who = lessonWho(lesson, c)

  const toggle = (d: string) => setPicked(p => (p.includes(d) ? p.filter(x => x !== d) : p.length >= MAX_COPY_DAYS ? p : [...p, d]))
  /** The same weekday for the next four weeks after the lesson. */
  const weekly = () => {
    if (!cand) return
    const next = Array.from({ length: 4 }, (_, i) => addDays(lesson.date, (i + 1) * 7)).filter(d => !familyHasLessonAt(lessons, cand, d))
    setPicked(p => [...new Set([...p, ...next])])
    const last = next.at(-1)
    if (last && last >= addDays(weekFrom, WEEKS_SHOWN * 7)) setWeekFrom(startOfWeek(next[0]))
  }

  async function save() {
    if (!lesson || !valid.length || !timeOk) return
    setSaving(true); setError('')
    try {
      const { rows, skipped } = await copyToDays({
        clientId: lesson.clientId, start, durationMin: lesson.durationMin, price: lesson.price,
        reminderMin: lesson.reminderMin, child: lesson.child ?? null, note: '',
      }, valid)
      const done = rows.filter(r => r.status === 'done').length
      toast(`أُضيفت ${lessonsCount(rows.length)}${done ? ` (منها ${done} في أيام مضت سُجّلت «تمّت»)` : ''}${skipped.length ? ` — وتُرك ${skipped.map(shortDate).join('، ')}` : ''}`)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const pastPicked = valid.filter(d => d < today).length

  return (
    <Sheet open={!!lesson} onClose={onClose} title="كرّر هذه الحصة في أيام أخرى"
      footer={
        <button onClick={save} disabled={saving || !valid.length || !timeOk} className={primaryBtn('w-full')}>
          {saving ? 'جارٍ الحفظ…' : valid.length ? `أضف ${lessonsCount(valid.length)}` : 'اختر يوماً أو أكثر'}
        </button>
      }>
      <div className="space-y-4 text-sm">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
          <p className="font-black text-gray-900">{who}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDuration(lesson.durationMin)} · {formatMoney(lesson.price, settings.currency)} · {lesson.reminderMin === null ? 'بلا تذكير' : 'بنفس التذكير'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="repeat-start" className="text-xs font-bold text-gray-600">الوقت</label>
            <input id="repeat-start" type="time" className={`${inputCls} max-w-[8rem] py-1.5`} value={start} onChange={e => setStart(e.target.value)} />
            {timeOk && <span className="text-xs text-gray-500"><span dir="ltr">{start} – {endTime(start, lesson.durationMin)}</span></span>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <button onClick={() => setWeekFrom(w => addDays(w, -7))} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center" aria-label="أسبوع سابق"><ChevronRight className="w-4 h-4" /></button>
            <p className="text-xs font-black text-gray-700">اضغط على الأيام التي تريدها</p>
            <button onClick={() => setWeekFrom(w => addDays(w, 7))} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center" aria-label="أسبوع تالٍ"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map(w => <span key={w} className="text-center text-[10px] font-bold text-gray-400">{w}</span>)}
            {days.map(d => {
              const st = cellState(d)
              const sel = valid.includes(d)
              const isOrig = d === lesson.date
              const day = Number(d.slice(8))
              return (
                <button key={d} type="button" disabled={st === 'taken'} onClick={() => toggle(d)} aria-pressed={sel}
                  aria-label={`${shortDate(d)}${st === 'taken' ? ' — فيه حصة لهذه العائلة' : st === 'busy' ? ' — يتداخل مع حصة أخرى' : ''}`}
                  className={`relative h-12 rounded-xl border text-sm font-black transition flex flex-col items-center justify-center
                    ${sel ? 'bg-brand-600 border-brand-600 text-white'
                      : st === 'taken' ? 'bg-gray-100 border-gray-100 text-gray-300'
                        : d < today ? 'bg-white border-gray-100 text-gray-400' : 'bg-white border-gray-200 text-gray-800 hover:border-brand-300'}`}>
                  <span>{day}</span>
                  {day === 1 && <span className="text-[8px] font-bold leading-none">{shortDate(d).replace(/^\d+\s*/, '')}</span>}
                  {st === 'taken' && <span className="text-[8px] font-bold leading-none">{isOrig ? 'الأصل' : 'موجودة'}</span>}
                  {st === 'busy' && !sel && <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {d === today && !sel && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
            رمادي = فيه حصة لهذه العائلة في هذا الوقت (لا يُكرَّر) · <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" /> = فيه حصة لعائلة أخرى في الوقت نفسه
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={weekly} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-brand-300">
              نفس اليوم للأسابيع الأربعة القادمة
            </button>
            {picked.length > 0 && (
              <button type="button" onClick={() => setPicked([])} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500">مسح الاختيار</button>
            )}
          </div>
        </div>

        {valid.length > 0 && (
          <p className="text-xs text-gray-700"><b>سيُضاف:</b> {valid.map(shortDate).join('، ')}</p>
        )}
        {pastPicked > 0 && (
          <p className="text-[11px] text-gray-500">الأيام التي مضت تُسجَّل «تمّت» مباشرة فتدخل الحساب.</p>
        )}
        {clashes.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
            <p className="font-black inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> تداخل مع حصص أخرى — ستُضاف رغم ذلك:</p>
            {clashes.map(({ date, other }) => (
              <p key={date + other.id}>{shortDate(date)}: {lessonWho(other, clientsById.get(other.clientId))} <span dir="ltr">{other.start}–{endTime(other.start, other.durationMin)}</span></p>
            ))}
          </div>
        )}
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</p>}

        <button type="button" onClick={() => { onClose(); onOpenForm(lesson) }} className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand-700 py-1">
          <Pencil className="w-3.5 h-3.5" /> أريد تغيير شيء آخر (المدة، السعر، الطفل…) — افتح النموذج
        </button>
      </div>
    </Sheet>
  )
}
