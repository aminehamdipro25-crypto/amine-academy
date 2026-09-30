'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import SpeakButton from '../SpeakButton'
import { ArrowLeft, ArrowRight, Send, Loader2, MessageCircle, Sparkles } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Msg { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Bonjour ! Comment ça va ?',
  'Parlons de mes loisirs.',
  'Aide-moi à me présenter.',
  'Pose-moi une question simple.',
]

export default function TutorPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, loading])

  async function send(text: string) {
    const t = text.trim()
    if (!t || loading) return
    const next = [...msgs, { role: 'user' as const, content: t }]
    setMsgs(next); setInput(''); setLoading(true)
    try {
      const r = await fetch('/api/learner/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) })
      const d = await r.json()
      setMsgs(m => [...m, { role: 'assistant', content: d.reply || '…' }])
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Réessaie, s’il te plaît.' }])
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] flex flex-col" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">{rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}</Link>
          <p className="font-black text-slate-800 text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4" style={{ color: PURPLE }} /> {pickLang(lang, 'شريك المحادثة', 'Conversation partner', 'Partenaire de conversation')}</p>
        </div>
      </header>
      <div className="h-1 flex"><div className="flex-1" style={{ background: '#0055A4' }} /><div className="flex-1 bg-white" /><div className="flex-1" style={{ background: '#EF4135' }} /></div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-3">
        {msgs.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white mb-3" style={{ background: `linear-gradient(135deg, ${PURPLE}, #9A7BFD)` }}><Sparkles className="w-7 h-7" /></div>
            <p className="font-black text-slate-800">{pickLang(lang, 'تدرّب على المحادثة بالفرنسيّة 🇫🇷', 'Practise French conversation 🇫🇷', 'Pratiquez le français 🇫🇷')}</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">{pickLang(lang, 'اكتب بالفرنسيّة وسيردّ عليك شريكك ويصحّح لك بلطف.', 'Write in French — your partner replies and gently corrects.', 'Écrivez en français ; votre partenaire répond et corrige.')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map(s => <button key={s} onClick={() => send(s)} dir="ltr" lang="fr" className="text-xs font-bold px-3 py-2 rounded-xl border transition hover:bg-violet-50" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => {
          const mine = m.role === 'user'
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${mine ? 'text-white' : 'bg-white border border-slate-100 text-slate-700'}`} style={mine ? { background: PURPLE } : {}} dir="ltr" lang="fr">
                <div className="flex items-start gap-1.5">
                  <span className="flex-1">{m.content}</span>
                  {!mine && <SpeakButton text={m.content} size={15} />}
                </div>
              </div>
            </div>
          )
        })}
        {loading && <div className="flex justify-start"><div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin" style={{ color: PURPLE }} /></div></div>}
      </div>

      <div className="border-t border-black/5 bg-[#FFF8F0]">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="max-w-2xl mx-auto p-3 flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} dir="ltr" lang="fr" placeholder={pickLang(lang, 'اكتب بالفرنسيّة…', 'Write in French…', 'Écrivez en français…')} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400" />
          <button type="submit" disabled={loading || !input.trim()} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0" style={{ background: PURPLE }}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
        </form>
      </div>
    </main>
  )
}
