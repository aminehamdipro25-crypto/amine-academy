'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { CLIENT_COLORS, CURRENCY_LABEL, formatMoney, lessonsCount, type GeoPoint, type WorkClient } from '@/lib/worklog'
import { useToast } from '@/components/ui/Toast'
import { useWorkLog } from './useWorkLog'
import { Field, Sheet, ghostBtn, inputCls, primaryBtn } from './ui'

// Leaflet touches `window` on import — client only.
const LocationPicker = dynamic(() => import('./WorkMap').then(m => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />,
})

const paymentsCount = (n: number) => (n === 1 ? 'دفعة واحدة' : n === 2 ? 'دفعتان' : n <= 10 ? `${n} دفعات` : `${n} دفعة`)

export default function ClientForm({ open, onClose, client, onCreated }: {
  open: boolean
  onClose: () => void
  client?: WorkClient | null
  onCreated?: (c: WorkClient) => void
}) {
  const { settings, lessons, payments, create, update, remove, removeFamily } = useWorkLog()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [childName, setChildName] = useState('')
  const [phone, setPhone] = useState('')
  const [rate, setRate] = useState('')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState<GeoPoint | undefined>()
  const [color, setColor] = useState<string>(CLIENT_COLORS[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError(''); setSaving(false)
    setName(client?.name ?? ''); setChildName(client?.childName ?? ''); setPhone(client?.phone ?? '')
    setRate(client ? String(client.hourlyRate) : ''); setAddress(client?.address ?? '')
    setLocation(client?.location); setColor(client?.color ?? ''); setNotes(client?.notes ?? '')
  }, [open, client])

  const hasHistory = !!client && (lessons.some(l => l.clientId === client.id) || payments.some(p => p.clientId === client.id))

  async function save() {
    setError('')
    if (!name.trim()) { setError('اسم العائلة / الولي مطلوب'); return }
    setSaving(true)
    const body = {
      name, childName, phone, address, notes,
      hourlyRate: Number(rate || 0),
      location: location ?? null,
      ...(color ? { color } : {}),
    }
    try {
      if (client) {
        await update('clients', client.id, body)
        toast('حُفظت بيانات العائلة')
      } else {
        const c = await create<WorkClient>('clients', body)
        toast('أُضيفت العائلة')
        onCreated?.(c)
      }
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleArchive() {
    if (!client) return
    setSaving(true)
    try {
      await update('clients', client.id, { archived: !client.archived })
      toast(client.archived ? 'أُعيدت العائلة إلى القائمة' : 'أُرشفت العائلة — تبقى حصصها ودفعاتها في الإحصائيات')
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  // Permanent delete of a family with history: shows exactly what goes, and
  // only unlocks once the family's name is typed (a slip cannot erase a ledger).
  const [purge, setPurge] = useState(false)
  const [purgeName, setPurgeName] = useState('')
  useEffect(() => { setPurge(false); setPurgeName('') }, [client?.id, open])
  // The button is in the footer, the panel at the top of a long form: bring it into view.
  const purgeRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (purge) purgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [purge])
  const ownLessons = client ? lessons.filter(l => l.clientId === client.id) : []
  const ownPaid = client ? payments.filter(p => p.clientId === client.id) : []
  async function purgeFamily() {
    if (!client) return
    setSaving(true)
    try {
      const r = await removeFamily(client.id, purgeName.trim())
      toast(`حُذفت العائلة مع ${lessonsCount(r.lessons.length)}${r.payments.length ? ` و${paymentsCount(r.payments.length)}` : ''}`)
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  async function del() {
    if (!client) return
    setSaving(true)
    try {
      await remove('clients', client.id)
      toast('حُذفت العائلة')
      onClose()
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      title={client ? 'بيانات العائلة' : 'عائلة جديدة'}
      footer={
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn('flex-1')}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          {client && (hasHistory ? (<>
            <button onClick={toggleArchive} disabled={saving} className={ghostBtn()} title={client.archived ? 'إلغاء الأرشفة' : 'أرشفة'}>
              {client.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              <span className="hidden sm:inline">{client.archived ? 'إعادة' : 'أرشفة'}</span>
            </button>
            <button onClick={() => setPurge(v => !v)} disabled={saving} className={ghostBtn('text-rose-600')} aria-label="حذف العائلة نهائياً مع سجلاتها" aria-expanded={purge}><Trash2 className="w-4 h-4" /></button>
          </>) : (
            <button onClick={del} disabled={saving} className={ghostBtn('text-rose-600')} aria-label="حذف العائلة"><Trash2 className="w-4 h-4" /></button>
          ))}
        </div>
      }
    >
      <div className="space-y-4">
        {client && hasHistory && purge && (
          <div ref={purgeRef} className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 space-y-2 text-sm">
            <p className="font-bold text-rose-800">حذف «{client.name}» نهائياً</p>
            <p className="text-rose-700 text-xs leading-relaxed">
              سيُحذف معها {lessonsCount(ownLessons.length)}{ownPaid.length ? ` و${paymentsCount(ownPaid.length)} (${formatMoney(ownPaid.reduce((n, p) => n + p.amount, 0), settings.currency)})` : ''}،
              وتتغيّر الإحصائيات والمبالغ السابقة. لا يمكن التراجع. إن كانت عائلة حقيقية انتهى التعامل معها فالأرشفة أفضل — تُخفيها وتُبقي أرقامك صحيحة.
            </p>
            <Field label={`اكتب اسم العائلة «${client.name}» للتأكيد`}>
              {id => <input id={id} className={inputCls} value={purgeName} onChange={e => setPurgeName(e.target.value)} autoComplete="off" />}
            </Field>
            <div className="flex gap-2">
              <button onClick={purgeFamily} disabled={saving || purgeName.trim() !== client.name.trim()}
                className={primaryBtn('flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40')}>
                <Trash2 className="w-4 h-4" /> حذف العائلة وكل سجلاتها
              </button>
              <button onClick={() => setPurge(false)} className={ghostBtn()}>تراجع</button>
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="اسم الولي / العائلة">{id => <input id={id} className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="مثال: عائلة الكعبي" autoFocus={!client} />}</Field>
          <Field label="اسم الطفل (اختياري)">{id => <input id={id} className={inputCls} value={childName} onChange={e => setChildName(e.target.value)} maxLength={60} />}</Field>
          <Field label="الهاتف">{id => <input id={id} type="tel" dir="ltr" className={`${inputCls} text-right`} value={phone} onChange={e => setPhone(e.target.value)} placeholder={settings.currency === 'QAR' ? '+974 …' : '+216 …'} />}</Field>
          <Field label={`سعر الساعة (${CURRENCY_LABEL[settings.currency]})`} hint="يُقترح تلقائياً لكل حصة جديدة؛ تغييره لا يمسّ الحصص السابقة">
            {id => <input id={id} type="number" min={0} step="any" inputMode="decimal" className={inputCls} value={rate} onChange={e => setRate(e.target.value)} />}
          </Field>
        </div>

        <Field label="العنوان (وصف مكتوب)">{id => <input id={id} className={inputCls} value={address} onChange={e => setAddress(e.target.value)} maxLength={200} placeholder="الحي، الشارع، رقم المبنى، الطابق…" />}</Field>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-600">الموقع على الخريطة</p>
          {open && <LocationPicker value={location} onChange={setLocation} color={color || CLIENT_COLORS[0]} currency={settings.currency} addressHint={address} />}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-600">لون العائلة في اليومية</p>
          <div className="flex flex-wrap gap-2">
            {CLIENT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`اللون ${c}`} aria-pressed={color === c}
                className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <Field label="ملاحظات">{id => <textarea id={id} rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} placeholder="رمز البوابة، موقف السيارة، أيام الدفع المعتادة…" />}</Field>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </Sheet>
  )
}
