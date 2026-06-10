'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, MessageCircle, Phone, Mail, Bot, User } from 'lucide-react'
import type { Message } from '@/lib/types'

interface AIMsg { role: 'user' | 'assistant'; text: string; time: string }

const QUICK = [
  'كيف يمكنني متابعة تقدم طفلي؟',
  'ما هي مدة الجلسة الواحدة؟',
  'هل يمكن تأجيل موعد؟',
  'ما الفرق بين APA و ABA و CBT؟',
]

function nowTime() {
  return new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
}

function formatMsgTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

function formatMsgDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return '' }
}

// ── AI Chat Tab ──────────────────────────────────────────────────
function AIChatTab() {
  const [msgs, setMsgs] = useState<AIMsg[]>([
    { role: 'assistant', text: 'أهلاً! أنا المساعد الذكي لأكاديمية أمين. كيف يمكنني مساعدتك اليوم؟', time: nowTime() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: AIMsg = { role: 'user', text: text.trim(), time: nowTime() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...msgs, userMsg].slice(-6).map(m => ({ role: m.role, content: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', text: data.reply || 'حدث خطأ، حاول مجدداً.', time: nowTime() }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', text: 'تعذّر الاتصال. للتواصل المباشر استخدم واتساب.', time: nowTime() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Contact links bar */}
      <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ background: '#FFFFFF', borderBottom: '1.5px solid #F0E8FF' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
          <span className="text-xs text-gray-500">المساعد الذكي متاح الآن</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-2xl transition-all"
            style={{ background: '#ECFDF5', color: '#15803D' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#D1FAE5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#ECFDF5' }}
          >
            <Phone className="w-3.5 h-3.5" /> واتساب
          </a>
          <a
            href="mailto:amine.hamdi.pro25@gmail.com"
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-2xl transition-all"
            style={{ background: '#F3EEFF', color: '#5A32D9' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DBFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F3EEFF' }}
          >
            <Mail className="w-3.5 h-3.5" /> بريد
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: '#FFF8F0' }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className="px-4 py-3 text-sm leading-relaxed"
                style={
                  m.role === 'user'
                    ? { background: '#7C5CFC', color: '#FFFFFF', borderRadius: '24px 24px 8px 24px' }
                    : { background: '#FFFFFF', color: '#374151', border: '1.5px solid #F0E8FF', borderRadius: '24px 24px 24px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                }
              >
                {m.text}
              </div>
              <div className={`text-xs text-gray-400 mt-1 ltr-num ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div
              className="px-4 py-3"
              style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', borderRadius: '24px 24px 24px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div className="flex gap-1">
                {[0, 0.15, 0.3].map((d, i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#9CA3AF', animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ background: '#FFFFFF', borderTop: '1.5px solid #F0E8FF' }}>
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all"
            style={{ background: '#FFF8F0', color: '#6B7280', border: '1px solid #F0E8FF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3EEFF'; (e.currentTarget as HTMLButtonElement).style.color = '#5A32D9'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFF8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#F0E8FF' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ background: '#FFFFFF', borderTop: '1.5px solid #F0E8FF' }}>
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 200))}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none text-right"
            style={{ background: '#FFF8F0', border: '1.5px solid #E8DBFF', color: '#1F2937' }}
            onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
            onBlur={e => { e.target.style.border = '1.5px solid #E8DBFF'; e.target.style.boxShadow = 'none' }}
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 text-white rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: '#7C5CFC' }}
            onMouseEnter={e => { if (!(!input.trim() || loading)) (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7C5CFC' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          للتواصل الفوري مع الأستاذ أمين:{' '}
          <a href="https://wa.me/97430653759" className="font-bold" style={{ color: '#16A34A' }}>واتساب</a>
        </p>
      </div>
    </div>
  )
}

// ── Direct Messages Tab ──────────────────────────────────────────
function DirectMessagesTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    } catch (e) {
      console.error('[DirectMessages] fetch error', e)
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMsg() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setInput('')
      }
    } catch (e) {
      console.error('[DirectMessages] send error', e)
    } finally {
      setSending(false)
    }
  }

  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = formatMsgDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) { last.msgs.push(msg) }
    else { grouped.push({ date: d, msgs: [msg] }) }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-5 py-3 flex-shrink-0" style={{ background: '#FFFFFF', borderBottom: '1.5px solid #F0E8FF' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F3EEFF' }}
          >
            <User className="w-4 h-4" style={{ color: '#6B46F0' }} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">الأستاذ أمين</div>
            <div className="text-xs text-gray-400">راسل مباشرة — يرد في أقرب وقت</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: '#FFF8F0' }}>
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid #7C5CFC', borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#F3EEFF' }}>
              <MessageCircle className="w-7 h-7" style={{ color: '#9A7BFD' }} />
            </div>
            <p className="text-gray-500 text-sm font-medium">لا توجد رسائل بعد</p>
            <p className="text-gray-400 text-xs mt-1">أرسل رسالتك الأولى للأستاذ أمين</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: '#F0E8FF' }} />
                <span className="text-xs text-gray-400 whitespace-nowrap px-2">{group.date}</span>
                <div className="flex-1 h-px" style={{ background: '#F0E8FF' }} />
              </div>
              {group.msgs.map(msg => (
                <div key={msg.id} className={`flex mb-3 ${msg.from === 'parent' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[80%]">
                    <div
                      className="px-4 py-3 text-sm leading-relaxed"
                      style={
                        msg.from === 'parent'
                          ? { background: '#7C5CFC', color: '#FFFFFF', borderRadius: '24px 24px 8px 24px' }
                          : { background: '#FFFFFF', color: '#374151', border: '1.5px solid #F0E8FF', borderRadius: '24px 24px 24px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                      }
                    >
                      {msg.content}
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ltr-num ${msg.from === 'parent' ? 'text-right' : 'text-left'}`}>
                      {formatMsgTime(msg.createdAt)}
                      {msg.from === 'admin' && (
                        <span className="mr-1 font-medium" style={{ color: '#7C5CFC' }}> · الأستاذ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ background: '#FFFFFF', borderTop: '1.5px solid #F0E8FF' }}>
        <form onSubmit={e => { e.preventDefault(); sendMsg() }} className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 1000))}
            placeholder="اكتب رسالتك للأستاذ..."
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none text-right"
            style={{ background: '#FFF8F0', border: '1.5px solid #E8DBFF', color: '#1F2937' }}
            onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
            onBlur={e => { e.target.style.border = '1.5px solid #E8DBFF'; e.target.style.boxShadow = 'none' }}
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 text-white rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: '#7C5CFC' }}
            onMouseEnter={e => { if (!(!input.trim() || sending)) (e.currentTarget as HTMLButtonElement).style.background = '#6B46F0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7C5CFC' }}
          >
            {sending ? (
              <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid #FFFFFF', borderTopColor: 'transparent' }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">يتم تحديث المحادثة تلقائياً كل 30 ثانية</p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'direct'>('ai')
  const [unreadFromAdmin, setUnreadFromAdmin] = useState(0)

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUnreadFromAdmin(d.unreadFromAdmin ?? 0) })
      .catch(() => {})
  }, [])

  return (
    <div
      className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] max-h-[750px] rounded-3xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
      dir="rtl"
    >
      {/* Page header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ background: '#FFFFFF', borderBottom: '1.5px solid #F0E8FF' }}>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: '#F3EEFF', boxShadow: '0 2px 8px -2px rgba(124,92,252,0.15)' }}
        >
          💬
        </div>
        <div>
          <h1 className="font-black text-gray-900 text-xl">التواصل</h1>
          <p className="text-gray-400 text-sm">المساعد الذكي والرسائل المباشرة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0" style={{ background: '#FFF8F0', borderBottom: '1.5px solid #F0E8FF' }}>
        <button
          onClick={() => setActiveTab('ai')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all"
          style={
            activeTab === 'ai'
              ? { background: '#FFFFFF', color: '#5A32D9', borderBottom: '2px solid #6B46F0' }
              : { color: '#9CA3AF' }
          }
          onMouseEnter={e => { if (activeTab !== 'ai') (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}
          onMouseLeave={e => { if (activeTab !== 'ai') (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
        >
          <Bot className="w-4 h-4" /> المساعد الذكي
        </button>
        <button
          onClick={() => { setActiveTab('direct'); setUnreadFromAdmin(0) }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all relative"
          style={
            activeTab === 'direct'
              ? { background: '#FFFFFF', color: '#5A32D9', borderBottom: '2px solid #6B46F0' }
              : { color: '#9CA3AF' }
          }
          onMouseEnter={e => { if (activeTab !== 'direct') (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}
          onMouseLeave={e => { if (activeTab !== 'direct') (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
        >
          <MessageCircle className="w-4 h-4" /> رسائل الأستاذ
          {unreadFromAdmin > 0 && (
            <span
              className="absolute top-2 left-4 w-4 h-4 text-white text-[10px] font-black rounded-full flex items-center justify-center"
              style={{ background: '#EF4444' }}
            >
              {unreadFromAdmin > 9 ? '9+' : unreadFromAdmin}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'ai' ? <AIChatTab /> : <DirectMessagesTab />}
      </div>
    </div>
  )
}
