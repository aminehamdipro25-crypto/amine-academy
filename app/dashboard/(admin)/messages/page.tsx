'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageSquare, ArrowRight, RefreshCw, User } from 'lucide-react'
import type { Message } from '@/lib/types'

interface ThreadSummary {
  parentId: string
  parentName: string
  parentEmail: string
  lastMessage: Message
  unreadForAdmin: number
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'أمس'
    } else {
      return d.toLocaleDateString('ar', { month: 'short', day: 'numeric' })
    }
  } catch { return '' }
}

function formatMsgDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

function formatMsgTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [replyInput, setReplyInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/messages')
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads ?? [])
        setTotalUnread(data.totalUnread ?? 0)
      }
    } catch (e) {
      console.error('[AdminMessages] fetchThreads error', e)
    } finally {
      setLoadingThreads(false)
    }
  }, [])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const fetchThread = useCallback(async (parentId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/messages?threadId=${parentId}`)
      if (res.ok) {
        const data = await res.json()
        setThreadMessages(data.messages ?? [])
        // Update unread in thread list
        setThreads(prev => prev.map(t =>
          t.parentId === parentId ? { ...t, unreadForAdmin: 0 } : t
        ))
        setTotalUnread(prev => Math.max(0, prev))
      }
    } catch (e) {
      console.error('[AdminMessages] fetchThread error', e)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedThreadId) {
      fetchThread(selectedThreadId)
    }
  }, [selectedThreadId, fetchThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages])

  async function sendReply() {
    if (!selectedThreadId || !replyInput.trim() || sending) return
    const content = replyInput.trim()
    setSending(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThreadId, content }),
      })
      if (res.ok) {
        const data = await res.json()
        setThreadMessages(prev => [...prev, data.message])
        setReplyInput('')
        // Update thread list with new last message
        setThreads(prev => prev.map(t =>
          t.parentId === selectedThreadId
            ? { ...t, lastMessage: data.message }
            : t
        ))
      }
    } catch (e) {
      console.error('[AdminMessages] sendReply error', e)
    } finally {
      setSending(false)
    }
  }

  const selectedThread = threads.find(t => t.parentId === selectedThreadId)

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of threadMessages) {
    const d = formatMsgDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date: d, msgs: [msg] })
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-gray-50" dir="rtl">
      {/* Thread list (left panel in RTL = right side visually) */}
      <div className={`${selectedThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white border-l border-gray-200 flex-shrink-0`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-black text-gray-900">الرسائل</h1>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
              <button
                onClick={fetchThreads}
                disabled={loadingThreads}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingThreads ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">محادثات أولياء الأمور</p>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">لا توجد رسائل بعد</p>
              <p className="text-gray-400 text-xs mt-1">ستظهر هنا محادثات أولياء الأمور</p>
            </div>
          ) : (
            threads.map(thread => (
              <button
                key={thread.parentId}
                onClick={() => setSelectedThreadId(thread.parentId)}
                className={`w-full text-right px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedThreadId === thread.parentId ? 'bg-brand-50 border-r-2 border-r-brand-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-base">
                    {thread.parentName?.[0] ?? '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-sm truncate">{thread.parentName}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 mr-2">
                        {formatTime(thread.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {thread.lastMessage.from === 'admin' && (
                          <span className="text-brand-600 font-medium ml-1">أنت:</span>
                        )}
                        {thread.lastMessage.content}
                      </p>
                      {thread.unreadForAdmin > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                          {thread.unreadForAdmin > 9 ? '9+' : thread.unreadForAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread view (right panel in RTL = left side visually) */}
      <div className={`${selectedThreadId ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
        {selectedThreadId && selectedThread ? (
          <>
            {/* Thread header */}
            <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedThreadId(null)}
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0">
                {selectedThread.parentName?.[0] ?? '؟'}
              </div>
              <div>
                <div className="font-bold text-gray-900">{selectedThread.parentName}</div>
                <div className="text-xs text-gray-400 ltr-num" dir="ltr">{selectedThread.parentEmail}</div>
              </div>
              <div className="mr-auto">
                <button
                  onClick={() => fetchThread(selectedThreadId)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-1">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">لا توجد رسائل في هذه المحادثة</p>
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 whitespace-nowrap px-2">{group.date}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    {group.msgs.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex mb-3 ${msg.from === 'admin' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="max-w-[75%]">
                          {/* Sender label */}
                          <div className={`text-xs text-gray-400 mb-1 ${msg.from === 'admin' ? 'text-right' : 'text-left'}`}>
                            {msg.from === 'admin' ? 'أنت (الأستاذ)' : selectedThread.parentName}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.from === 'admin'
                              ? 'bg-brand-600 text-white rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`text-xs text-gray-400 mt-1 ltr-num ${msg.from === 'admin' ? 'text-right' : 'text-left'}`}>
                            {formatMsgTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              <form
                onSubmit={e => { e.preventDefault(); sendReply() }}
                className="flex items-center gap-2"
              >
                <input
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value.slice(0, 1000))}
                  placeholder={`رد على ${selectedThread.parentName}...`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-right"
                  dir="rtl"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim() || sending}
                  className="w-10 h-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">الرسائل</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              اختر محادثة من القائمة لعرضها والرد عليها
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
