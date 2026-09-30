'use client'
import { useState, useEffect, useCallback } from 'react'
import { useLang, pickLang } from '@/lib/i18n'
import { CalendarClock, Plus, Loader2, Video, X } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Booking { id: string; at: string; note?: string; status: string; price: number; currency: string; link?: string; durationHours: number }

const STATUS: Record<string, { ar: string; en: string; fr: string; cls: string }> = {
  requested: { ar: 'بانتظار تأكيد الأستاذ', en: 'Awaiting confirmation', fr: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { ar: 'مؤكّدة', en: 'Confirmed', fr: 'Confirmé', cls: 'bg-blue-50 text-blue-700' },
  completed: { ar: 'تمّت', en: 'Completed', fr: 'Terminé', cls: 'bg-emerald-50 text-emerald-700' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled', fr: 'Annulé', cls: 'bg-slate-100 text-slate-400' },
}

export default function BookingCard({ hasTeacher }: { hasTeacher: boolean }) {
  const { lang } = useLang()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState('')
  const [note, setNote] = useState('')
  const [isTrial, setIsTrial] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try { const r = await fetch('/api/learner/bookings'); if (r.ok) setBookings((await r.json()).bookings || []) } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  async function request(e: React.FormEvent) {
    e.preventDefault()
    if (!at.trim()) return
    setSaving(true); setErr('')
    try {
      const r = await fetch('/api/learner/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ at, note, isTrial }) })
      const d = await r.json()
      if (r.ok) { setAt(''); setNote(''); setIsTrial(false); setOpen(false); load() } else setErr(d.error || 'تعذّر الطلب')
    } catch { setErr(pickLang(lang, 'تعذّر الاتصال', 'Connection failed', 'Échec')) } finally { setSaving(false) }
  }

  const active = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed')

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black text-slate-800 text-sm flex items-center gap-2"><CalendarClock className="w-4 h-4" style={{ color: PURPLE }} /> {pickLang(lang, 'حجز الحصص', 'Book a lesson', 'Réserver un cours')}</h2>
        {hasTeacher && (
          <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: PURPLE }}>
            {open ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {pickLang(lang, 'اطلب حصّة', 'Request', 'Demander')}
          </button>
        )}
      </div>

      {!hasTeacher ? (
        <p className="text-slate-400 text-sm">{pickLang(lang, 'سيتاح الحجز بعد تعيين أستاذك.', 'Booking opens once your teacher is assigned.', 'La réservation s’ouvre après l’attribution.')}</p>
      ) : (
        <>
          {open && (
            <form onSubmit={request} className="mb-3 bg-slate-50/70 rounded-2xl p-3 space-y-2">
              <input value={at} onChange={e => setAt(e.target.value)} placeholder={pickLang(lang, 'الموعد المفضّل (مثال: الأحد 18:00)', 'Preferred time (e.g. Sun 18:00)', 'Créneau souhaité')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400" />
              <input value={note} onChange={e => setNote(e.target.value)} placeholder={pickLang(lang, 'ملاحظة (اختياري)', 'Note (optional)', 'Note (optionnel)')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400" />
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isTrial} onChange={e => setIsTrial(e.target.checked)} className="w-4 h-4 accent-violet-600" />
                {pickLang(lang, '🎓 هذه حصّة تقييم (تعارف قبل الالتزام)', '🎓 This is a trial lesson', '🎓 Cours d’essai (avant de s’engager)')}
              </label>
              {err && <p className="text-red-500 text-xs font-bold">⚠️ {err}</p>}
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-extrabold text-white text-sm disabled:opacity-50" style={{ background: PURPLE }}>{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : pickLang(lang, 'أرسل الطلب', 'Send request', 'Envoyer')}</button>
            </form>
          )}
          {active.length === 0 ? (
            <p className="text-slate-400 text-sm">{pickLang(lang, 'لا حجوزات قادمة — اطلب حصّتك القادمة.', 'No upcoming bookings — request your next lesson.', 'Aucune réservation à venir.')}</p>
          ) : (
            <div className="space-y-2">
              {active.map(b => {
                const s = STATUS[b.status] || STATUS.requested
                return (
                  <div key={b.id} className="flex items-center justify-between gap-2 border border-slate-100 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.at}</p>
                      {b.status === 'confirmed' && <p className="text-[11px] text-slate-400">{b.price} {b.currency === 'TND' ? 'د.ت' : 'ر.ق'} · {b.durationHours} {pickLang(lang, 'ساعة', 'h', 'h')}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {b.status === 'confirmed' && b.link && (
                        <a href={b.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg text-white" style={{ background: PURPLE }}><Video className="w-3.5 h-3.5" /> {pickLang(lang, 'انضم', 'Join', 'Rejoindre')}</a>
                      )}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.cls}`}>{pickLang(lang, s.ar, s.en, s.fr)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
