'use client'
import { useEffect, useMemo, useState } from 'react'
import { Copy, FileDown, Loader2, MessageCircle, Settings2, Share2 } from 'lucide-react'
import { AVAILABILITY_DEFAULT, durationText, minutesOf, phoneDigits, type Availability } from '@/lib/worklog'
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
    locate: id => clientsById.get(id)?.location, today, nowMin: minutesOf(localNowTime()), includeFull: true,
  }), [lessons, today, span, duration, av, clientId, clientsById])

  const chosen = days.filter(d => d.windows.length && !left.has(d.date))
  const anyFree = days.some(d => d.windows.length)

  // The PDF is rebuilt on the server from these choices — the same times as on screen.
  const [pdfBusy, setPdfBusy] = useState<'' | 'download' | 'share'>('')
  const [canShareFiles, setCanShareFiles] = useState(false)
  useEffect(() => { setCanShareFiles(typeof navigator.canShare === 'function') }, [])
  async function fetchPdf(): Promise<File> {
    const res = await fetch('/api/admin/worklog/availability/pdf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ clientId: clientId || undefined, durationMin: duration, days: Number(span), availability: av, exclude: [...left] }),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `تعذّر إنشاء الملف (${res.status})`)
    const name = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'available-times.pdf'
    return new File([await res.blob()], name, { type: 'application/pdf' })
  }
  function saveFile(file: File) {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url; a.download = file.name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  async function pdf(mode: 'download' | 'share') {
    setPdfBusy(mode)
    try {
      const file = await fetchPdf()
      if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'المواعيد المتاحة' }) } catch (e) { if ((e as Error).name !== 'AbortError') throw e }
      } else { saveFile(file); toast('نُزّل ملف المواعيد PDF') }
    } catch (e) { toast((e as Error).message, 'error') } finally { setPdfBusy('') }
  }
  const text = availabilityText(chosen, { client, durationMin: duration, formatDay: msgDay, sender: settings.senderName })
  const tel = phoneDigits(client?.phone, settings.currency)
  const gapOf = (a: Availability) => a.gapMin ?? AVAILABILITY_DEFAULT.gapMin!
  const hoursChanged = av.start !== saved.start || av.end !== saved.end || av.days.join() !== saved.days.join() || gapOf(av) !== gapOf(saved)
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
        <div className="space-y-2">
        <div className="flex gap-2">
          <button onClick={() => pdf('download')} disabled={!!pdfBusy || !anyFree} className={primaryBtn('flex-1')}>
            {pdfBusy === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} تنزيل PDF
          </button>
          {canShareFiles && (
            <button onClick={() => pdf('share')} disabled={!!pdfBusy || !anyFree} className={ghostBtn('flex-1')}>
              {pdfBusy === 'share' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} مشاركة PDF
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <a href={`https://wa.me/${tel ?? ''}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
            className={primaryBtn('flex-1 bg-emerald-600 hover:bg-emerald-700')}>
            <MessageCircle className="w-4 h-4" /> {tel ? `إرسال لـ${clientLabel(client)}` : 'إرسال عبر واتساب'}
          </a>
          <button onClick={copy} className={ghostBtn()}><Copy className="w-4 h-4" /> نسخ</button>
        </div>
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
            <Settings2 className="w-3.5 h-3.5" /> أوقات عملي: <span dir="ltr">{av.start}–{av.end}</span> · فاصل {gapOf(av)} د
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
            <Field label="أقل فاصل بعد كل حصة قبل حصة في منزل آخر" hint="للطريق والوصول — يُستعمل الأطول بينه وبين تقدير المسافة">
              {id => (
                <select id={id} className={`${inputCls} max-w-xs`} value={gapOf(av)} onChange={e => setAv(a => ({ ...a, gapMin: Number(e.target.value) }))}>
                  {[0, 15, 30, 45, 60, 75, 90, 120].map(m => <option key={m} value={m}>{m === 0 ? 'بلا فاصل' : `${m} دقيقة`}</option>)}
                </select>
              )}
            </Field>
            {!hoursValid && <p className="text-xs text-rose-600">اختر يوماً واحداً على الأقل، وساعة بداية قبل ساعة النهاية.</p>}
            {hoursChanged && hoursValid && <button onClick={saveHours} className={primaryBtn('text-xs')}>احفظها كأوقات عملي الدائمة</button>}
          </div>
        )}

        {hoursValid && !anyFree && (
          <p className="rounded-2xl bg-amber-50 px-4 py-4 text-center text-sm text-amber-800">لا وقت متاح لحصة مدتها {durationText(duration)} في هذه الفترة — جرّب توسيع «أوقات عملي» أو تقليل الفاصل.</p>
        )}
        {!hoursValid || days.length === 0 ? null : (
          <ul className="space-y-2">
            {days.map(d => {
              if (!d.windows.length) {
                // A working day with no room is shown with its reason, not dropped silently.
                return (
                  <li key={d.date} className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-3">
                    <p className="font-black text-sm text-gray-500">{msgDay(d.date)}{d.date === today ? ' (اليوم)' : ''} <span className="text-[11px] font-bold text-rose-500">— لا متّسع</span></p>
                    <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                      {d.booked.length ? <>الحصص {d.booked.map((b, i) => <span key={i}>{i ? '، ' : ''}<span dir="ltr">{b.start}–{b.end}</span></span>)} مع فاصل {gapOf(av)} د بعد كل حصة لا تترك {durationText(duration)} كاملة </> : 'لا وقت متبقٍّ '}
                      بين <span dir="ltr">{av.start}</span> و<span dir="ltr">{av.end}</span>.
                    </p>
                  </li>
                )
              }
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
                        title="افتح حصة جديدة في أول هذه الفترة"
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
          كل فترة وقتٌ فارغ يتّسع لحصة مدتها {durationText(duration)}. قبل كل حصة مسجّلة في منزل آخر وبعدها يُترك {gapOf(av)} دقيقة على الأقل، أو أكثر إن كانت المسافة أبعد{client?.location ? '' : ' (لا موقع مسجّل لهذه العائلة، فالمسافة غير معروفة)'}. اضغط فترة لفتح حصة في أولها.
        </p>

        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">الرسالة كما ستُرسَل</p>
          <pre dir="rtl" className="whitespace-pre-wrap rounded-xl bg-[#e7fbe6] border border-emerald-100 p-3 text-[12px] leading-relaxed text-gray-800 font-sans max-h-60 overflow-y-auto">{text}</pre>
        </div>
      </div>
    </Sheet>
  )
}
