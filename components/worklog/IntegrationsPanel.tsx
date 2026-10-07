'use client'
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Link2, RefreshCw, Unlink } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ARABIC_LOCALE, formatDateTime } from '@/lib/format'
import { NOTION_FIELDS, NOTION_FIELD_LABEL, NOTION_FIELD_TYPES, type NotionMap, type NotionProp } from '@/lib/worklog-notion'
import { ghostBtn, inputCls, primaryBtn } from './ui'

interface Status {
  notion: {
    tokenConfigured: boolean
    databaseId?: string; title?: string; props?: NotionProp[]; map?: NotionMap; error?: string
    last?: { at: string; ok: boolean; error?: string } | null
  }
  gcal: {
    clientConfigured: boolean; connected: boolean; email?: string; connectedAt?: string
    last?: { at: string; ok: boolean; error?: string } | null
  }
  reminders: { telegramConfigured: boolean; cronConfigured: boolean; lastRun: { at: string; sent: number; failed: number } | null }
}

async function call<T>(init?: RequestInit): Promise<T> {
  const res = await fetch('/api/admin/worklog/integrations', { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json' } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `خطأ ${res.status}`)
  return body as T
}

export function useIntegrations() {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    try { setStatus(await call<Status>()); setError('') } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { status, error, reload }
}

const when = (iso: string) => formatDateTime(iso, ARABIC_LOCALE, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** «Is the 1-hour reminder actually running?» — answered from the last run, not from a switch. */
export function TelegramReminderStatus({ status }: { status: Status | null }) {
  if (!status) return <p className="text-xs text-gray-400">جارٍ التحقق…</p>
  const r = status.reminders
  const last = r.lastRun
  const fresh = !!last && Date.now() - new Date(last.at).getTime() < 20 * 60_000
  // Running is not enough: the last messages must also have been accepted by Telegram.
  if (fresh && last!.failed > 0) {
    return (
      <p className="flex items-start gap-1.5 text-xs font-bold text-rose-700">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        الفحص يعمل ({when(last!.at)}) لكن تيليغرام رفض آخر رسالة — تحقّق من TELEGRAM_BOT_TOKEN وTELEGRAM_CHAT_ID في Vercel، وأنك أرسلت «/start» للبوت.
      </p>
    )
  }
  return (
    <div className="space-y-2 text-xs">
      {fresh ? (
        <p className="flex items-center gap-1.5 font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> يعمل — آخر فحص {when(last!.at)}</p>
      ) : (
        <p className="flex items-start gap-1.5 font-bold text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {last ? `متوقف — آخر فحص ${when(last.at)}` : 'لم يعمل بعد'}
        </p>
      )}
      {!fresh && (
        <ol className="list-decimal pr-4 space-y-1 text-gray-600 leading-relaxed">
          {!r.telegramConfigured && <li>تيليغرام غير مضبوط: أضف <code dir="ltr">TELEGRAM_BOT_TOKEN</code> و<code dir="ltr">TELEGRAM_CHAT_ID</code> في Vercel.</li>}
          {!r.cronConfigured && <li>أضف <code dir="ltr">CRON_SECRET</code> في Vercel (أي كلمة سرّ طويلة).</li>}
          <li>في GitHub: المستودع ← Settings ← Secrets and variables ← Actions، أضف سرّين:
            <code dir="ltr"> APP_URL</code> = رابط موقعك، و<code dir="ltr">CRON_SECRET</code> = نفس القيمة التي في Vercel.</li>
          <li>ثم من تبويب Actions ← «Work-log lesson reminders» ← Run workflow للتجربة. بعدها يعمل وحده كل 5 دقائق.</li>
        </ol>
      )}
    </div>
  )
}

/** Connect a Notion database, choose which column receives what, and copy every lesson. */
export function NotionSection({ status, reload }: { status: Status | null; reload: () => Promise<void> }) {
  const { toast } = useToast()
  const [link, setLink] = useState('')
  const [map, setMap] = useState<NotionMap>({})
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const n = status?.notion

  useEffect(() => { if (n?.map) setMap(n.map) }, [n?.map])

  async function connect() {
    setBusy(true)
    try { await call({ method: 'POST', body: JSON.stringify({ action: 'connect', database: link }) }); setLink(''); toast('رُبطت قاعدة البيانات — راجع الأعمدة ثم احفظ'); await reload() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  async function saveMap() {
    setBusy(true)
    try { await call({ method: 'POST', body: JSON.stringify({ action: 'map', map }) }); toast('حُفظ الربط'); await reload() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  async function syncAll() {
    setBusy(true)
    let cursor: number | null = 0
    try {
      while (cursor !== null) {
        const r: { total: number; done: number; next: number | null } = await call({ method: 'POST', body: JSON.stringify({ action: 'sync', cursor }) })
        setProgress(`${r.done} من ${r.total}`)
        cursor = r.next
      }
      toast('نُسخت كل الحصص إلى نوشن')
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false); await reload() }
  }
  async function disconnect() {
    setBusy(true)
    try { await call({ method: 'POST', body: JSON.stringify({ action: 'disconnect' }) }); toast('أُوقف الربط — لم يُحذف شيء من نوشن'); await reload() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  if (!n) return <p className="text-xs text-gray-400">جارٍ التحقق…</p>

  if (!n.tokenConfigured) {
    return (
      <ol className="list-decimal pr-4 space-y-1.5 text-xs text-gray-600 leading-relaxed">
        <li>افتح <b dir="ltr">notion.so/profile/integrations</b> ← New integration ← اختر مساحة عملك، وانسخ «Internal Integration Secret».</li>
        <li>في Vercel ← Settings ← Environment Variables أضف <code dir="ltr">NOTION_TOKEN</code> بهذه القيمة، ثم أعد النشر (Redeploy).</li>
        <li>في نوشن افتح قاعدة بيانات الحصص ← <b>⋯</b> ← Connections ← أضف التكامل الذي أنشأته.</li>
        <li>عُد هنا والصق رابط قاعدة البيانات.</li>
      </ol>
    )
  }

  if (!n.databaseId) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-600">الصق رابط قاعدة بيانات الحصص في نوشن (بعد إضافة التكامل إليها من ⋯ ← Connections).</p>
        <div className="flex gap-2">
          <input dir="ltr" className={`${inputCls} text-xs`} placeholder="https://www.notion.so/…" value={link} onChange={e => setLink(e.target.value)} aria-label="رابط قاعدة بيانات نوشن" />
          <button disabled={busy || !link.trim()} onClick={connect} className={primaryBtn('text-xs whitespace-nowrap')}><Link2 className="w-4 h-4" /> ربط</button>
        </div>
      </div>
    )
  }

  if (n.error) {
    return (
      <div className="space-y-2 text-xs">
        <p className="flex gap-1.5 text-rose-700 font-bold"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {n.error}</p>
        <button disabled={busy} onClick={disconnect} className={ghostBtn('text-xs')}><Unlink className="w-3.5 h-3.5" /> إلغاء الربط والبدء من جديد</button>
      </div>
    )
  }

  const props = n.props ?? []
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">مربوط بقاعدة «<b>{n.title}</b>». كل حصة تُضاف أو تُعدَّل هنا تُكتب هناك تلقائياً، والحصة المحذوفة تُنقل إلى سلّة نوشن.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {NOTION_FIELDS.map(f => {
          const options = props.filter(p => NOTION_FIELD_TYPES[f].includes(p.type))
          return (
            <label key={f} className="text-[11px] font-bold text-gray-600 space-y-1">
              <span>{NOTION_FIELD_LABEL[f]}</span>
              <select className={`${inputCls} text-xs`} value={map[f] ?? ''} onChange={e => setMap(m => ({ ...m, [f]: e.target.value || undefined }))}>
                <option value="">{f === 'title' ? '— اختر —' : 'لا تكتبه'}</option>
                {options.map(p => <option key={p.name} value={p.name}>{p.name} ({p.type})</option>)}
              </select>
            </label>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={saveMap} className={primaryBtn('text-xs')}>حفظ الربط</button>
        <button disabled={busy} onClick={syncAll} className={ghostBtn('text-xs')}><RefreshCw className={`w-3.5 h-3.5 ${busy && progress ? 'animate-spin' : ''}`} /> نسخ كل الحصص الآن{progress ? ` (${progress})` : ''}</button>
        <button disabled={busy} onClick={disconnect} className={ghostBtn('text-xs text-rose-600')}><Unlink className="w-3.5 h-3.5" /> إلغاء الربط</button>
      </div>
      {n.last && (
        n.last.ok
          ? <p className="text-[11px] text-emerald-700">✓ آخر نسخ ناجح {when(n.last.at)}</p>
          : <p className="text-[11px] text-rose-700">✕ آخر محاولة فشلت {when(n.last.at)}: {n.last.error} — «نسخ كل الحصص الآن» يُكمل ما فات.</p>
      )}
      <p className="text-[11px] text-gray-400">الاتجاه واحد: من الدفتر إلى نوشن. تعديل صف في نوشن لا يعود إلى الدفتر، والتعديل التالي للحصة هنا يكتب فوقه.</p>
    </div>
  )
}

/**
 * Every lesson written straight into the owner's Google Calendar — and from
 * there into Notion Calendar, which shows that Google account.
 */
export function GoogleCalendarSection({ status, reload }: { status: Status | null; reload: () => Promise<void> }) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const g = status?.gcal

  // The consent screen sends the owner back with ?gcal=…; say what happened, once.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('gcal')
    if (!q) return
    const msg: Record<string, [string, 'success' | 'error']> = {
      connected: ['رُبط تقويم Google — الحصص القادمة تُكتب فيه الآن', 'success'],
      cancelled: ['أُلغي الربط من شاشة Google', 'error'],
      'bad-state': ['انتهت مهلة الربط — أعد المحاولة', 'error'],
      failed: ['رفض Google الربط — راجع الخطوات تحت الزر', 'error'],
      'not-configured': ['مفاتيح Google غير مضبوطة في Vercel', 'error'],
    }
    if (msg[q]) toast(msg[q][0], msg[q][1])
    const u = new URL(window.location.href); u.searchParams.delete('gcal'); window.history.replaceState(null, '', u.toString())
  }, [toast])

  async function syncAll() {
    setBusy(true)
    let cursor: number | null = 0
    try {
      while (cursor !== null) {
        const r: { total: number; done: number; next: number | null } = await call({ method: 'POST', body: JSON.stringify({ action: 'gcal-sync', cursor }) })
        setProgress(`${r.done} من ${r.total}`)
        cursor = r.next
      }
      toast('نُسخت كل الحصص إلى تقويم Google')
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false); await reload() }
  }
  async function disconnect() {
    if (!window.confirm('إيقاف الكتابة في تقويم Google؟ الأحداث المكتوبة سابقاً تبقى في التقويم.')) return
    setBusy(true)
    try { await call({ method: 'POST', body: JSON.stringify({ action: 'gcal-disconnect' }) }); toast('أُوقف الربط'); await reload() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  if (!g) return <p className="text-xs text-gray-400">جارٍ التحقق…</p>

  const setup = (
    <ol className="list-decimal pr-4 space-y-1 text-[11px] text-gray-500 leading-relaxed">
      <li>في <b dir="ltr">console.cloud.google.com</b> (مشروع الدخول بحساب Google نفسه): APIs &amp; Services ← Library ← <b dir="ltr">Google Calendar API</b> ← Enable.</li>
      <li>Credentials ← عميل OAuth ← Authorized redirect URIs ← أضف: <code dir="ltr" className="break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/admin/worklog/gcal/callback` : ''}</code></li>
      <li>OAuth consent screen ← Publish app (Production). في وضع Testing يُلغي Google الإذن كل 7 أيام.</li>
      <li>عند الربط قد تظهر «Google hasn&apos;t verified this app» — هذا تطبيقك أنت: Advanced ← المتابعة.</li>
    </ol>
  )

  if (!g.clientConfigured) {
    return (
      <div className="space-y-2 text-xs text-gray-600">
        <p>يحتاج مفتاحي الدخول بحساب Google في Vercel: <code dir="ltr">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> و<code dir="ltr">GOOGLE_CLIENT_SECRET</code>، ثم إعادة النشر.</p>
        {setup}
      </div>
    )
  }

  if (!g.connected) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-600 leading-relaxed">كل حصة تُضاف أو تُعدَّل أو تُحذف تُكتب فوراً في تقويمك الأساسي في Google — فتظهر في Google Calendar وفي <b>Notion Calendar</b> المربوط به، بلون كل عائلة كما اخترته هنا، مع تذكير يرنّ في وقته. الإذن للأحداث فقط، لا البريد ولا الملفات.</p>
        <a href="/api/admin/worklog/gcal/connect" className={primaryBtn('text-xs')}><Link2 className="w-4 h-4" /> ربط تقويم Google</a>
        <p className="text-[11px] text-gray-500">اختر في Google الحساب المربوط بـNotion Calendar.</p>
        {setup}
      </div>
    )
  }

  return (
    <div className="space-y-3 text-xs">
      <p className="flex items-center gap-1.5 font-bold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" /> مربوط{g.email ? <span dir="ltr" className="font-mono">{g.email}</span> : null}
      </p>
      {g.last && (g.last.ok
        ? <p className="text-gray-500">آخر نسخ ناجح: {when(g.last.at)}</p>
        : <p className="flex items-start gap-1.5 font-bold text-rose-700"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> آخر محاولة ({when(g.last.at)}): {g.last.error}</p>)}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={syncAll} className={primaryBtn('text-xs')}><RefreshCw className="w-4 h-4" /> {busy && progress ? progress : 'نسخ كل الحصص الآن'}</button>
        <a href="/api/admin/worklog/gcal/connect" className={ghostBtn('text-xs')}><Link2 className="w-3.5 h-3.5" /> إعادة الربط</a>
        <button disabled={busy} onClick={disconnect} className={ghostBtn('text-xs text-rose-600')}><Unlink className="w-3.5 h-3.5" /> إيقاف</button>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">عدّل الحصص من الدفتر لا من التقويم: الحفظ التالي يكتب فوق أي تعديل في التقويم. الحصص القديمة (قبل اليوم) لا تُنسخ إلا بـ«نسخ كل الحصص الآن».</p>
    </div>
  )
}
