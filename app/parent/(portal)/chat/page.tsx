'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Phone, Mail } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; text: string; time: string }

const QUICK = [
  'كيف يمكنني متابعة تقدم طفلي؟',
  'ما هي مدة الجلسة الواحدة؟',
  'هل يمكن تأجيل موعد؟',
  'ما الفرق بين APA و ABA و CBT؟',
]

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: 'أهلاً! أنا المساعد الذكي لأكاديمية أمين. كيف يمكنني مساعدتك اليوم؟', time: now() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  function now() {
    return new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', text: text.trim(), time: now() }
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
      setMsgs(prev => [...prev, { role: 'assistant', text: data.reply || 'حدث خطأ، حاول مجدداً.', time: now() }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', text: 'تعذّر الاتصال. للتواصل المباشر استخدم واتساب.', time: now() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] max-h-[700px]">
      {/* Header */}
      <div className="bg-white rounded-t-2xl border border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-base">المساعد الذكي</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-500">متاح الآن</span>
            </div>
          </div>
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
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4 border-x border-gray-100">
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
      <div className="bg-white border-x border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
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
      <div className="bg-white rounded-b-2xl border border-gray-100 border-t-0 p-3 flex-shrink-0">
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
          للتواصل الفوري مع الأستاذ أمين: <a href={`https://wa.me/97430653759`} className="text-green-600 font-bold">واتساب</a>
        </p>
      </div>
    </div>
  )
}
