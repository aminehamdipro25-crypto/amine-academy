'use client'
import { useEffect, useMemo, useState } from 'react'
import { Copy, MessageCircle, Settings2 } from 'lucide-react'
import { AVAILABILITY_DEFAULT, minutesOf, phoneDigits, type Availability } from '@/lib/worklog'
import { availabilityText, freeSlots, windowText } from '@/lib/worklog-planning'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import { clientLabel, useWorkLog } from './useWorkLog'
import { Field, Segmented, Sheet, ghostBtn, inputCls, localNowTime, localToday, primaryBtn } from './ui'
import type { LessonDraft } from './LessonForm'

const DAY_CHIPS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
const DURATIONS = [30, 45, 60, 90, 120]
/** «الأحد 12 أكتوبر» — month spelled out, so the parent cannot read 12/10 as 10/12. */
const msgDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * «متى أنا متاح؟» — the free start times of the coming days for one family (or a
 * new one), with the drive from the previous home and to the next reserved.
 * Tapping a time opens a lesson there; the list goes to the family as a message.
 */
export default function AvailabilitySheet({ open, onClose, onPick }: {
  open: boolean; onClose: () => void; onPick: (d: LessonDraft) => void
}) {
  const { clients, lessons, clientsById, settings, saveSettings } = useWorkLog()
  const { toast } = useToast()
  const saved = settings.availability ?? AVAILABILITY_DEFAULT
  const [clientId, setClientId] = useState('')
  const [duration, setDuration] = useState(settings.defaultDurationMin || 60)
  const [span, setSpan] = useState<'7' | '14'>('7')
  const [av, setAv] = useState<Availability>(saved)
  const [editHours, setEditHours] = useState(false)
  const [left, setLeft] = useState<Set<string>>(new Set())

  useEffect(() => { if (open) { setAv(settings.availability ?? AVAILABILITY_DEFAULT); setLeft(new Set()) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const client = clientId ? clientsById.get(clientId) : undefined
  const today = localToday()
  const days = useMemo(() => freeSlots(lessons, {
    from: today, days: Number(span), durationMin: duration, availability: av, clientId: clientId || undefined,
    locate: id => clientsById.get(id)?.location, today, nowMin: minutesOf(localNowTime()),
  }), [lessons, today, span, duration, av, clientId, clientsById])

  const chosen = days.filter(d => !left.has(d.date))
  const text = availabilityText(chosen, { client, durationMin: duration, formatDay: msgDay, sender: settings.senderName })
  const tel = phoneDigits(client?.phone, settings.currency)
  const hoursChanged = av.start !== saved.start || av.end !== saved.end || av.days.join() !== saved.days.join()
  const hoursValid = av.days.length > 0 && av.start < av.end

  async function saveHours() {
    try { await saveSettings({ availability: av }); toast('حُفظت أوقات عملك'); setEditHours(false) }
    catch (e) { toast((e as Error).message, 'error') }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); toast('نُسخت الرسالة') } catch { toast('تعذّر النسخ — حدّد النص وانسخه يدوياً', 'error') }
  }

  return (
    <Sheet open={open} onClose={onClose} wide title="متى أنا متاح؟"
      footer={
        <div className="flex gap-2">
          <a href={`https://wa.me/${tel ?? ''}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
            className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')}>
            <MessageCircle className="w-4 h-4" /> {tel ? `إرسال لـ${clientLabel(client)}` : 'إرسال عبر واتساب'}
          </a>
          <button onClick={copy} className={ghostBtn()}><Copy className="w-4 h-4" /> نسخ</button>
        </div>
      }>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="الحصة لـ">
            {id => (
              <select id={id} className={inputCls} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">عائلة جديدة (بلا موقع بعد)</option>
                {clients.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}
              </select>
            )}
          </Field>
          <Field label="مدة الحصة">
            {id => (
              <select id={id} className={inputCls} value={duration} onChange={e => setDuration(Number(e.target.value))}>
                {[...new Set([...DURATIONS, duration])].sort((a, b) => a - b).map(d => <option key={d} value={d}>{d} دقيقة</option>)}
              </select>
            )}
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented size="sm" value={span} onChange={setSpan} options={[{ value: '7', label: 'الأسبوع القادم' }, { value: '14', label: 'أسبوعان' }]} />
          <button onClick={() => setEditHours(v => !v)} className={ghostBtn('text-xs')} aria-expanded={editHours}>
            <Settings2 className="w-3.5 h-3.5" /> أوقات عملي: <span dir="ltr">{av.start}–{av.end}</span>
          </button>
        </div>

        {editHours && (
          <div className="rounded-2xl bg-gray-50 p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {DAY_CHIPS.map((label, i) => {
                const on = av.days.includes(i)
                return (
                  <button key={i} aria-pressed={on}
                    onClick={() => setAv(a => ({ ...a, days: on ? a.days.filter(d => d !== i) : [...a.days, i].sort() }))}
                    className={`rounded-full px-3 py-1 text-xs font-bold border ${on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <Field label="من الساعة">{id => <input id={id} type="time" className={inputCls} value={av.start} onChange={e => setAv(a => ({ ...a, start: e.target.value }))} />}</Field>
              <Field label="إلى الساعة">{id => <input id={id} type="time" className={inputCls} value={av.end} onChange={e => setAv(a => ({ ...a, end: e.target.value }))} />}</Field>
            </div>
            {!hoursValid && <p className="text-xs text-rose-600">اختر يوماً واحداً على الأقل، وساعة بداية قبل ساعة النهاية.</p>}
            {hoursChanged && hoursValid && <button onClick={saveHours} className={primaryBtn('text-xs')}>احفظها كأوقات عملي الدائمة</button>}
          </div>
        )}

        {!hoursValid ? null : days.length === 0 ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">لا وقت متاح لحصة مدتها {duration} دقيقة في هذه الفترة.</p>
        ) : (
          <ul className="space-y-2">
            {days.map(d => {
              const inMsg = !left.has(d.date)
              return (
                <li key={d.date} className={`rounded-2xl border p-3 ${inMsg ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-black text-sm text-gray-900">{msgDay(d.date)}{d.date === today ? ' (اليوم)' : ''}</p>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                      <input type="checkbox" checked={inMsg} onChange={() => setLeft(s => { const n = new Set(s); if (n.has(d.date)) n.delete(d.date); else n.add(d.date); return n })} />
                      في الرسالة
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.windows.map((w, i) => (
                      <button key={i} onClick={() => { onPick({ clientId: clientId || undefined, date: d.date, start: w.earliest, durationMin: duration }); onClose() }}
                        title="افتح حصة جديدة في هذا الوقت"
                        className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                        {windowText(w)}
                      </button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-[11px] text-gray-400 leading-relaxed">
          الأوقات هي أوقات <b>بدء</b> الحصة. حُجز وقت الطريق من المنزل السابق وإلى التالي{client?.location ? '' : ' (15 دقيقة تقديراً — لا موقع مسجّل لهذه العائلة)'}. اضغط وقتاً لفتح حصة فيه.
        </p>

        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">الرسالة كما ستُرسَل</p>
          <pre dir="rtl" className="whitespace-pre-wrap rounded-xl bg-[#e7fbe6] border border-emerald-100 p-3 text-[12px] leading-relaxed text-gray-800 font-sans max-h-60 overflow-y-auto">{text}</pre>
        </div>
      </div>
    </Sheet>
  )
}
