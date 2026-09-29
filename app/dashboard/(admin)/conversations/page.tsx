'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { fadeUp } from '@/lib/motion'

interface Conv { id: string; name: string; level: string; language: string; unread: number; lastText: string; lastAt: string }
interface Msg { id: string; sender: 'learner' | 'teacher'; text: string; createdAt: string }
const LANG: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }

export default function ConversationsPage() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [sel, setSel] = useState<Conv | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async () => {
    try { const r = await fetch('/api/teacher/messages'); if (r.ok) setConvs((await r.json()).conversations || []) }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  const loadThread = useCallback(async (learnerId: string) => {
    try { const r = await fetch(`/api/teacher/messages?learnerId=${learnerId}`); if (r.ok) setMsgs((await r.json()).messages || []) }
    catch { /* ignore */ }
  }, [])

  useEffect(() => { loadList(); const id = setInterval(loadList, 10000); return () => clearInterval(id) }, [loadList])
  useEffect(() => {
    if (!sel) return
    loadThread(sel.id)
    const id = setInterval(() => loadThread(sel.id), 5000)
    return () => clearInterval(id)
  }, [sel, loadThread])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim(); if (!t || !sel || sending) return
    setSending(true)
    setMsgs(m => [...m, { id: `tmp_${Date.now()}`, sender: 'teacher', text: t, createdAt: new Date().toISOString() }]); setText('')
    try { const r = await fetch('/api/teacher/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ learnerId: sel.id, text: t }) }); if (r.ok) { loadThread(sel.id); loadList() } }
    catch { /* ignore */ } finally { setSending(false) }
  }

  return (
    <motion.div dir="rtl" variants={fadeUp} initial="hidden" animate="show">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-brand-500" /> محادثات المتعلّمين</h1>
        <p className="text-gray-500 text-sm mt-1">تواصل مباشر مع تلاميذك — سلس وفوري.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden grid md:grid-cols-3" style={{ height: 560 }}>
        {/* Conversation list */}
        <div className={`border-e border-gray-100 overflow-y-auto ${sel ? 'hidden md:block' : ''}`}>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">لا محادثات بعد</div>
          ) : convs.map(c => (
            <button key={c.id} onClick={() => setSel(c)} className={`w-full text-right px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex items-center gap-3 ${sel?.id === c.id ? 'bg-brand-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black flex items-center justify-center flex-shrink-0">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-gray-900 text-sm truncate">{c.name}</p>
                  {c.unread > 0 && <span className="bg-brand-600 text-white text-[10px] font-black rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">{c.unread}</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{c.lastText || `${LANG[c.language] || c.language} · ${c.level}`}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className={`md:col-span-2 flex flex-col ${sel ? '' : 'hidden md:flex'}`}>
          {!sel ? (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">اختر محادثة للبدء</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <button onClick={() => setSel(null)} className="md:hidden text-gray-400"><ArrowRight className="w-4 h-4" /></button>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black text-xs flex items-center justify-center">{sel.name.charAt(0)}</div>
                <div><p className="font-black text-gray-900 text-sm">{sel.name}</p><p className="text-[11px] text-gray-400">{LANG[sel.language] || sel.language} · {sel.level === 'unknown' ? 'غير محدّد' : sel.level}</p></div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FBFAFF]">
                {msgs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-300 text-sm">لا رسائل بعد — ابدأ المحادثة</div>
                ) : msgs.map(m => {
                  const mine = m.sender === 'teacher'
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${mine ? 'bg-brand-600 text-white' : 'bg-white border border-gray-100 text-gray-700'}`}>
                        {m.text}
                        <span className={`block text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-gray-300'}`} dir="ltr">{new Date(m.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={send} className="p-3 border-t border-gray-100 flex items-center gap-2">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="اكتب رسالة…" className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
                <button type="submit" disabled={sending || !text.trim()} className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">{sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
