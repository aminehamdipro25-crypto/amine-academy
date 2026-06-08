'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, MessageCircle, Phone, Mail, Bot, User } from 'lucide-react'
import type { Message } from '@/lib/types'

// ── AI Chatbot types ─────────────────────────────────────────
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
  try {
    return new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function formatMsgDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ── AI Chat Tab ───────────────────────────────────────────────
function AIChatTab() {
  const [msgs, setMsgs] = useState<AIMsg[]>([
    { role: 'assistant', text: 'أهلاً! أنا المساعد الذكي لأكاديمية أمين. كيف يمكنني مساعدتك اليوم؟', time: nowTime() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: AIMsg = { role: 'user', text: text.trim(), time: nowTime() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...msgs, userMsg].slice(-6).map(m => ({
        role: m.role,
        content: m.text,
      }))
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
      {/* Contact links */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs text-gray-500">المساعد الذكي متاح الآن</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            واتساب
          </a>
          <a
            href="mailto:amine.hamdi.pro25@gmail.com"
            className="flex items-center gap-1.5 bg-brand-50 text-brand-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            بريد
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
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
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 0.15, 0.3].map((d, i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            className="text-xs bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-3 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 200))}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-right"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          للتواصل الفوري مع الأستاذ أمين: <a href="https://wa.me/97430653759" className="text-green-600 font-bold">واتساب</a>
        </p>
      </div>
    </div>
  )
}

// ── Direct Messages Tab ───────────────────────────────────────
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
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = formatMsgDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date: d, msgs: [msg] })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header info */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">الأستاذ أمين</div>
            <div className="text-xs text-gray-400">راسل مباشرة — يرد في أقرب وقت</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-1">
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-brand-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">لا توجد رسائل بعد</p>
            <p className="text-gray-400 text-xs mt-1">أرسل رسالتك الأولى للأستاذ أمين</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 whitespace-nowrap px-2">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {group.msgs.map(msg => (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${msg.from === 'parent' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%]`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.from === 'parent'
                        ? 'bg-brand-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ltr-num ${msg.from === 'parent' ? 'text-right' : 'text-left'}`}>
                      {formatMsgTime(msg.createdAt)}
                      {msg.from === 'admin' && (
                        <span className="mr-1 text-brand-500 font-medium"> · الأستاذ</span>
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
      <div className="bg-white border-t border-gray-100 p-3 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); sendMsg() }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 1000))}
            placeholder="اكتب رسالتك للأستاذ..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-right"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          يتم تحديث المحادثة تلقائياً كل 30 ثانية
        </p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'direct'>('ai')
  const [unreadFromAdmin, setUnreadFromAdmin] = useState(0)

  // Check unread count for badge on tab
  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json()
          setUnreadFromAdmin(data.unreadFromAdmin ?? 0)
        }
      } catch { /* silent */ }
    }
    checkUnread()
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] max-h-[750px] bg-white rounded-2xl border border-gray-100 overflow-hidden" dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-brand-600" />
        </div>
        <h1 className="font-black text-gray-900 text-base">التواصل</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === 'ai'
              ? 'bg-white text-brand-700 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bot className="w-4 h-4" />
          المساعد الذكي
        </button>
        <button
          onClick={() => { setActiveTab('direct'); setUnreadFromAdmin(0) }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors relative ${
            activeTab === 'direct'
              ? 'bg-white text-brand-700 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          رسائل الأستاذ
          {unreadFromAdmin > 0 && (
            <span className="absolute top-2 left-4 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
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
