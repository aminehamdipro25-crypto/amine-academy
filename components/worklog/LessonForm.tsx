'use client'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Car, Copy, MapPin, Repeat, Trash2 } from 'lucide-react'
import {
  CURRENCY_LABEL, STATUS_META, addDays, travelWarnings, endTime, findConflicts, formatMoney, priceFor,
  type LessonStatus, type WorkLesson,
} from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog, clientLabel } from './useWorkLog'
import { Field, Sheet, Segmented, ghostBtn, inputCls, localToday, primaryBtn, shortDate } from './ui'

const DURATIONS = [45, 60, 90, 120]
const REMINDERS: { value: string; label: string }[] = [
  { value: 'none', label: 'بلا تذكير' },
  { value: '15', label: 'قبل 15 د' },
  { value: '30', label: 'قبل 30 د' },
  { value: '60', label: 'قبل ساعة' },
  { value: '120', label: 'قبل ساعتين' },
  { value: '1440', label: 'قبل يوم' },
]

/** Prefill for a new lesson. A copied lesson carries everything but its date. */
export interface LessonDraft {
  date?: string; start?: string; clientId?: string
  durationMin?: number; price?: number; reminderMin?: number | null; note?: string
}

export default function LessonForm({ open, onClose, lesson, draft, onNewClient, onEditClient, onCopy }: {
  open: boolean
  onClose: () => void
  lesson?: WorkLesson | null
  draft?: LessonDraft
  onNewClient: () => void
  /** Open the family's details (to pin their home on the map). */
  onEditClient: (clientId: string) => void
  onCopy: (l: WorkLesson) => void
}) {
  const { clients, lessons, payments, settings, clientsById, create, update, remove } = useWorkLog()
  const { toast } = useToast()
  const active = useMemo(() => clients.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'ar')), [clients])

  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(localToday())
  const [start, setStart] = useState('16:00')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [status, setStatus] = useState<LessonStatus>('scheduled')
  const [cancelledBy, setCancelledBy] = useState<'family' | 'me'>('family')
  const [charged, setCharged] = useState(false)
  const [reminder, setReminder] = useState('60')
  const [repeat, setRepeat] = useState(1)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [paidNow, setPaidNow] = useState(false)
  const [paidAmount, setPaidAmount] = useState('')
  const alreadyPaid = !!lesson && payments.some(p => p.lessonId === lesson.id)

  // Fill the form whenever it opens.
  useEffect(() => {
    if (!open) return
    setError(''); setConfirmDelete(false); setSaving(false); setPaidNow(false); setPaidAmount('')
    if (lesson) {
      setClientId(lesson.clientId); setDate(lesson.date); setStart(lesson.start); setDuration(lesson.durationMin)
      setPrice(String(lesson.price)); setPriceTouched(true); setStatus(lesson.status)
      setCancelledBy(lesson.cancelledBy ?? 'family'); setCharged(!!lesson.charged)
      setReminder(lesson.reminderMin === null ? 'none' : String(lesson.reminderMin)); setRepeat(1); setNote(lesson.note ?? '')
    } else {
      const cid = draft?.clientId ?? (active.length === 1 ? active[0].id : '')
      // A family's usual time: the start of their most recent lesson.
      const last = lessons.filter(l => l.clientId === cid).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      setClientId(cid); setDate(draft?.date ?? localToday()); setStart(draft?.start ?? last?.start ?? '16:00')
      const d = draft?.durationMin ?? last?.durationMin ?? settings.defaultDurationMin
      setDuration(d)
      const c = clientsById.get(cid)
      if (draft?.price !== undefined) { setPrice(String(draft.price)); setPriceTouched(true) }
      else { setPrice(c ? String(priceFor(c.hourlyRate, d)) : ''); setPriceTouched(false) }
      setStatus('scheduled'); setCancelledBy('family'); setCharged(false)
      const rem = draft && 'reminderMin' in draft ? draft.reminderMin : settings.defaultReminderMin
      setReminder(rem === null || rem === undefined ? 'none' : String(rem))
      setRepeat(1); setNote(draft?.note ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lesson?.id, draft])

  // Price follows family × duration until the user types their own.
  useEffect(() => {
    if (priceTouched) return
    const c = clientsById.get(clientId)
    if (c) setPrice(String(priceFor(c.hourlyRate, duration)))
  }, [clientId, duration, priceTouched, clientsById])

  const conflicts = useMemo(() => {
    if (!date || !/^\d\d:\d\d$/.test(start) || status === 'cancelled') return []
    return findConflicts({ id: lesson?.id, date, start, durationMin: duration }, lessons)
  }, [date, start, duration, lessons, lesson?.id, status])

  const drives = useMemo(() => {
    if (!clientId || !date || !/^\d\d:\d\d$/.test(start) || status === 'cancelled') return []
    return travelWarnings({ id: lesson?.id, clientId, date, start, durationMin: duration }, lessons, id => clientsById.get(id)?.location)
  }, [clientId, date, start, duration, lessons, lesson?.id, status, clientsById])

  const isPast = date < localToday()

  async function save() {
    setError('')
    if (!clientId) { setError('اختر العائلة أولاً'); return }
    setSaving(true)
    const body = {
      clientId, date, start, durationMin: duration, price: Number(price || 0), status,
      cancelledBy: status === 'cancelled' ? cancelledBy : undefined,
      charged: status === 'cancelled' ? charged : false,
      reminderMin: reminder === 'none' ? null : Number(reminder),
      note,
    }
    try {
      let saved: WorkLesson
      if (lesson) {
        saved = await update<WorkLesson>('lessons', lesson.id, body)
        toast('حُفظت التعديلات')
      } else {
        const rows = await create<WorkLesson[]>('lessons', { ...body, repeatWeeks: repeat })
        saved = rows[0] // the series starts with the lesson as entered; later repeats are scheduled
        toast(rows.length > 1 ? `أُضيفت ${rows.length} حصة أسبوعية` : 'أُضيفت الحصة')
      }
      if (status === 'done' && paidNow && !alreadyPaid) {
        const amount = Number(paidAmount || price || 0)
        if (amount > 0) {
          try {
            await create('payments', { clientId, lessonId: saved.id, date: localToday(), amount, method: 'cash', note: `عن حصة ${date} ${start}` })
          } catch (e) {
            // The lesson is saved; say plainly that the payment is not.
            toast(`حُفظت الحصة، لكن لم تُسجَّل الدفعة: ${(e as Error).message}`, 'error')
          }
        }
      }
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function del(scope?: 'future') {
    if (!lesson) return
    setSaving(true)
    try {
      const n = await remove('lessons', lesson.id, scope)
      toast(n > 1 ? `حُذفت ${n} حصص` : 'حُذفت الحصة')
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const cur = CURRENCY_LABEL[settings.currency]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={lesson ? 'تعديل الحصة' : 'حصة جديدة'}
      footer={
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn('flex-1')}>
            {saving ? 'جارٍ الحفظ…' : lesson ? 'حفظ التعديلات' : repeat > 1 ? `إضافة ${repeat} حصص` : 'إضافة الحصة'}
          </button>
          {lesson && !confirmDelete && (
            <button onClick={() => onCopy(lesson)} className={ghostBtn()} title="نسخ إلى تاريخ آخر">
              <Copy className="w-4 h-4" /><span className="hidden sm:inline">نسخ</span>
            </button>
          )}
          {lesson && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className={ghostBtn('text-rose-600')} aria-label="حذف الحصة">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {confirmDelete && lesson && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 space-y-2">
            <p className="text-sm font-bold text-rose-800">حذف الحصة نهائياً؟</p>
            <p className="text-[11px] text-rose-700">إن أُلغيت الحصة فالأفضل تعليمها «ملغاة» بدل حذفها — فتبقى في إحصائيات الإلغاء.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => del()} disabled={saving} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">حذف هذه الحصة</button>
              {lesson.seriesId && (
                <button onClick={() => del('future')} disabled={saving} className="rounded-lg bg-white border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700">
                  هذه وكل الحصص المجدولة بعدها
                </button>
              )}
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500">تراجع</button>
            </div>
          </div>
        )}

        <Field label="العائلة">
          {id => active.length ? (
            <div className="flex gap-2">
              <select id={id} className={inputCls} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">— اختر —</option>
                {active.map(c => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}
                {lesson && clientsById.get(lesson.clientId)?.archived && (
                  <option value={lesson.clientId}>{clientLabel(clientsById.get(lesson.clientId))} (مؤرشفة)</option>
                )}
              </select>
              <button type="button" onClick={onNewClient} className={ghostBtn('whitespace-nowrap')}>+ عائلة</button>
            </div>
          ) : (
            <button id={id} type="button" onClick={onNewClient} className={ghostBtn('w-full border-dashed')}>+ أضف أول عائلة</button>
          )}
        </Field>
        {clientId && clientsById.get(clientId) && !clientsById.get(clientId)!.location && (
          <button type="button" onClick={() => onEditClient(clientId)}
            className="-mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
            <MapPin className="w-3.5 h-3.5" /> لم يُحدَّد موقع منزل هذه العائلة — حدّده الآن
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ">{id => <input id={id} type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />}</Field>
          <Field label="البداية">{id => <input id={id} type="time" step={300} className={inputCls} value={start} onChange={e => setStart(e.target.value)} />}</Field>
        </div>
        <div className="flex flex-wrap gap-1.5 -mt-2" aria-label="تاريخ سريع">
          {[
            { label: 'اليوم', value: localToday() },
            { label: 'غداً', value: addDays(localToday(), 1) },
            { label: '+ أسبوع', value: /^\d{4}-\d{2}-\d{2}$/.test(date) ? addDays(date, 7) : addDays(localToday(), 7) },
          ].map(c => (
            <button key={c.label} type="button" onClick={() => setDate(c.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${date === c.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}>
              {c.label}
            </button>
          ))}
        </div>

        <Field label={`المدة · تنتهي ${/^\d\d:\d\d$/.test(start) ? endTime(start, duration) : '—'}`}>
          {id => (
            <div className="flex flex-wrap items-center gap-2">
              {DURATIONS.map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${duration === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                  {d < 60 ? `${d} د` : d % 60 ? `${Math.floor(d / 60)}:${d % 60} س` : `${d / 60} س`}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input id={id} type="number" min={5} max={720} step={5} inputMode="numeric" className={`${inputCls} w-20 text-center`}
                  value={duration} onChange={e => setDuration(Math.max(0, Number(e.target.value) || 0))} aria-label="المدة بالدقائق" />
                <span className="text-xs text-gray-400">د</span>
              </div>
            </div>
          )}
        </Field>

        {conflicts.length > 0 && (
          <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-[12px] text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>تتداخل مع: {conflicts.map(c => `${clientLabel(clientsById.get(c.clientId))} (${c.start}–${endTime(c.start, c.durationMin)})`).join('، ')}</span>
          </div>
        )}

        {drives.length > 0 && (
          <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-[12px] text-amber-800">
            <Car className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {drives.map(d => {
                const other = lessons.find(l => l.id === d.otherId)
                const who = clientLabel(clientsById.get(other?.clientId ?? ''))
                return (
                  <p key={d.otherId}>
                    {d.direction === 'from' ? `بعد حصة ${who} (تنتهي ${other ? endTime(other.start, other.durationMin) : ''})` : `قبل حصة ${who} (${other?.start ?? ''})`}:
                    {' '}التنقّل ≈ {d.km} كم · ~{d.needMin} د، والفاصل {Math.max(0, d.gapMin)} د فقط
                  </p>
                )
              })}
              <p className="text-[10px] text-amber-700">تقدير بالمسافة وزحمة المدينة، لا مسار فعلي — للتنبيه فقط</p>
            </div>
          </div>
        )}

        <Field label={`سعر الحصة (${cur})`} hint={clientsById.get(clientId) ? `سعر الساعة لهذه العائلة: ${formatMoney(clientsById.get(clientId)!.hourlyRate, settings.currency)} — يمكنك تعديل سعر هذه الحصة وحدها` : undefined}>
          {id => (
            <input id={id} type="number" min={0} step="any" inputMode="decimal" className={inputCls} value={price}
              onChange={e => { setPrice(e.target.value); setPriceTouched(true) }} />
          )}
        </Field>

        <Field label="الحالة">
          {() => (
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_META) as LessonStatus[]).map(s => {
                const m = STATUS_META[s]
                const on = status === s
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={on}
                    className={`rounded-xl border-2 px-2 py-2.5 text-xs font-black transition ${on ? `${m.soft} ${m.text}` : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    style={on ? { borderColor: m.color } : undefined}>
                    <span aria-hidden className="ml-1">{m.icon}</span>{m.label}
                  </button>
                )
              })}
            </div>
          )}
        </Field>
        {status === 'scheduled' && isPast && (
          <p className="text-[11px] text-amber-700 -mt-2">هذا التاريخ مضى — هل تمّت الحصة أم أُلغيت؟ الحصة «المجدولة» لا تُحتسب في المستحقات.</p>
        )}

        {status === 'done' && (alreadyPaid ? (
          <p className="text-xs font-bold text-emerald-700 -mt-2">✓ أجر هذه الحصة مسجّل في الدفعات</p>
        ) : (
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
              <input type="checkbox" className="accent-emerald-600 w-4 h-4" checked={paidNow} onChange={e => setPaidNow(e.target.checked)} />
              استلمتُ أجر هذه الحصة
            </label>
            {paidNow && (
              <div className="flex items-center gap-2">
                <input type="number" min={0} step="any" inputMode="decimal" className={`${inputCls} w-32`} aria-label="المبلغ المستلم"
                  value={paidAmount || price} onChange={e => setPaidAmount(e.target.value)} />
                <span className="text-xs text-gray-500">{cur} نقداً — تُسجَّل في الدفعات</span>
              </div>
            )}
            {!paidNow && <p className="text-[11px] text-gray-500">إن لم تستلمه، تُضاف قيمتها إلى مستحقات العائلة</p>}
          </div>
        ))}

        {status === 'cancelled' && (
          <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">من ألغى؟</span>
              <Segmented size="sm" value={cancelledBy} onChange={setCancelledBy}
                options={[{ value: 'family', label: 'العائلة' }, { value: 'me', label: 'أنا' }]} />
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-brand-600" checked={charged} onChange={e => setCharged(e.target.checked)} />
              <span><b>إلغاء متأخر يُدفع ثمنه</b> — تُضاف قيمتها إلى مستحقات العائلة</span>
            </label>
          </div>
        )}

        {status === 'scheduled' && (
          <Field label="التذكير">
            {id => (
              <select id={id} className={inputCls} value={reminder} onChange={e => setReminder(e.target.value)}>
                {REMINDERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            )}
          </Field>
        )}

        {!lesson && (
          <Field label="تكرار أسبوعي" hint={repeat > 1 ? `نفس اليوم والوقت كل أسبوع حتى ${shortDate(addDays(date, (repeat - 1) * 7))}` : 'حصة واحدة فقط'}>
            {id => (
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-gray-400" />
                <select id={id} className={inputCls} value={repeat} onChange={e => setRepeat(Number(e.target.value))}>
                  {[1, 2, 4, 6, 8, 10, 12, 16, 20, 26, 36, 52].map(n => (
                    <option key={n} value={n}>{n === 1 ? 'لا تكرار' : `${n} أسابيع`}</option>
                  ))}
                </select>
              </div>
            )}
          </Field>
        )}

        <Field label="ملاحظة (اختياري)">
          {id => <textarea id={id} rows={2} className={inputCls} value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="ما تمّ في الحصة، واجب، تذكير…" />}
        </Field>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </Sheet>
  )
}

