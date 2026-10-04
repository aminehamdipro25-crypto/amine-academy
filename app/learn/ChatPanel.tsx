'use client'
import { ARABIC_LOCALE, formatTime } from '@/lib/format'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang, pickLang } from '@/lib/i18n'
import { Send, Loader2, MessageCircle } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Msg { id: string; sender: 'learner' | 'teacher'; text: string; createdAt: string }

// Learner ↔ teacher chat, embedded in the learner portal. Polls every 5s for a
// smooth near-real-time feel without a socket.
export default function ChatPanel() {
  const { lang } = useLang()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [teacherName, setTeacherName] = useState<string | null>(null)
  const [hasTeacher, setHasTeacher] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch('/api/learner/messages')
      if (!res.ok) return
      const d = await res.json()
      setMsgs(d.messages || []); setTeacherName(d.teacherName); setHasTeacher(d.hasTeacher)
    } catch { /* ignore */ } finally { setLoaded(true) }
  }, [])

  useEffect(() => {
    fetchThread()
    const id = setInterval(fetchThread, 5000)
    return () => clearInterval(id)
  }, [fetchThread])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    // optimistic
    const optimistic: Msg = { id: `tmp_${Date.now()}`, sender: 'learner', text: t, createdAt: new Date().toISOString() }
    setMsgs(m => [...m, optimistic]); setText('')
    try {
      const res = await fetch('/api/learner/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t }) })
      if (res.ok) fetchThread()
    } catch { /* ignore */ } finally { setSending(false) }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ height: 420 }}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" style={{ color: PURPLE }} />
        <h2 className="font-black text-slate-800 text-sm">
          {pickLang(lang, 'محادثة أستاذك', 'Chat with your teacher', 'Discuter avec votre professeur')}
          {teacherName ? <span className="text-slate-400 font-medium"> — {teacherName}</span> : null}
        </h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FBFAFF]">
        {!loaded ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: PURPLE }} /></div>
        ) : !hasTeacher ? (
          <div className="h-full flex items-center justify-center text-center text-slate-400 text-sm px-6">
            {pickLang(lang, 'سيُفتح التواصل بمجرّد تعيين أستاذك.', 'Chat opens once your teacher is assigned.', 'La discussion s’ouvre dès l’attribution de votre professeur.')}
          </div>
        ) : msgs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-400 text-sm px-6">
            {pickLang(lang, 'ابدأ المحادثة مع أستاذك 👋', 'Start the conversation with your teacher 👋', 'Démarrez la conversation 👋')}
          </div>
        ) : msgs.map(m => {
          const mine = m.sender === 'learner'
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${mine ? 'text-white' : 'bg-white border border-slate-100 text-slate-700'}`}
                style={mine ? { background: PURPLE } : undefined}>
                {m.text}
                <span className={`block text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-slate-300'}`} dir="ltr">
                  {formatTime(m.createdAt, ARABIC_LOCALE)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {hasTeacher && (
        <form onSubmit={send} className="p-3 border-t border-slate-100 flex items-center gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder={pickLang(lang, 'اكتب رسالة…', 'Type a message…', 'Écrire un message…')}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition" />
          <button type="submit" disabled={sending || !text.trim()} className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0" style={{ background: PURPLE }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      )}
    </div>
  )
}
