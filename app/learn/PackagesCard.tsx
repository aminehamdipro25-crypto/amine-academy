'use client'
import { useState, useEffect, useCallback } from 'react'
import { useLang, pickLang } from '@/lib/i18n'
import { Wallet, Check, Loader2, X } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Pkg { id: string; sessions: number; ar: string; en: string; fr: string; qar: number; tnd: number }
interface Req { id: string; packageName: string; amount: number; currency: string; status: string; method: string }

export default function PackagesCard() {
  const { lang } = useLang()
  const [packages, setPackages] = useState<Pkg[]>([])
  const [credits, setCredits] = useState(0)
  const [requests, setRequests] = useState<Req[]>([])
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState<'QAR' | 'TND'>('QAR')
  const [method, setMethod] = useState('whatsapp')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try { const r = await fetch('/api/learner/purchase'); if (r.ok) { const d = await r.json(); setPackages(d.packages || []); setCredits(d.credits || 0); setRequests(d.requests || []) } } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  async function buy(pkgId: string) {
    setBusy(pkgId)
    try { const r = await fetch('/api/learner/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: pkgId, method, currency }) }); if (r.ok) { setOpen(false); load() } }
    finally { setBusy('') }
  }

  const pending = requests.filter(r => r.status === 'pending')

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black text-slate-800 text-sm flex items-center gap-2"><Wallet className="w-4 h-4" style={{ color: PURPLE }} /> {pickLang(lang, 'الباقات والرصيد', 'Packages & credits', 'Forfaits & crédits')}</h2>
        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}>{credits} {pickLang(lang, 'حصّة متبقّية', 'lessons left', 'cours restants')}</span>
      </div>

      {pending.length > 0 && (
        <div className="mb-3 space-y-1">
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs bg-amber-50 rounded-xl px-3 py-2">
              <span className="font-bold text-amber-800">{r.packageName} — {r.amount} {r.currency === 'TND' ? 'د.ت' : 'ر.ق'}</span>
              <span className="text-amber-600 font-bold">{pickLang(lang, 'بانتظار التأكيد', 'Pending', 'En attente')}</span>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full py-3 rounded-2xl font-extrabold text-white text-sm" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>{pickLang(lang, 'اشترِ باقة', 'Buy a package', 'Acheter un forfait')}</button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {(['QAR', 'TND'] as const).map(c => (
                <button key={c} onClick={() => setCurrency(c)} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currency === c ? 'text-white' : 'text-slate-400 bg-slate-50'}`} style={currency === c ? { background: PURPLE } : {}}>{c === 'TND' ? 'د.ت' : 'ر.ق'}</button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
          </div>
          <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400">
            <option value="whatsapp">{pickLang(lang, 'تنسيق عبر واتساب', 'Arrange via WhatsApp', 'Via WhatsApp')}</option>
            <option value="fawran">{pickLang(lang, 'فورّان (Fawran)', 'Fawran', 'Fawran')}</option>
            <option value="bank">{pickLang(lang, 'تحويل بنكي', 'Bank transfer', 'Virement bancaire')}</option>
          </select>
          <div className="space-y-2">
            {packages.map(p => (
              <div key={p.id} className="flex items-center justify-between border border-slate-100 rounded-2xl px-4 py-3">
                <div>
                  <p className="font-black text-slate-800 text-sm">{pickLang(lang, p.ar, p.en, p.fr)}</p>
                  <p className="text-xs text-slate-400">{p.sessions} {pickLang(lang, 'حصص', 'lessons', 'cours')} · {currency === 'TND' ? p.tnd : p.qar} {currency === 'TND' ? 'د.ت' : 'ر.ق'}</p>
                </div>
                <button onClick={() => buy(p.id)} disabled={busy === p.id} className="text-xs font-extrabold px-3 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: PURPLE }}>{busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pickLang(lang, 'اطلب', 'Request', 'Demander')}</button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1"><Check className="w-3 h-3" /> {pickLang(lang, 'الدفع يدوي — يؤكّده المدير ثم يُضاف الرصيد.', 'Manual payment — the director confirms, then credit is added.', 'Paiement manuel — confirmé par le directeur.')}</p>
        </div>
      )}
    </div>
  )
}
