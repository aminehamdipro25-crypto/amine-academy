'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: string; message: string; type: ToastType; leaving?: boolean }
interface ToastCtx  { toast: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

function ToastEl({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon =
    item.type === 'success' ? CheckCircle2 :
    item.type === 'error'   ? XCircle :
                              AlertCircle
  const bg =
    item.type === 'success' ? 'bg-emerald-600' :
    item.type === 'error'   ? 'bg-red-600' :
                              'bg-gray-900'

  return (
    <div className={`${bg} ${item.leaving ? 'toast-leave' : 'toast-enter'} flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white min-w-[220px] max-w-xs`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.message}</span>
      <button onClick={() => onDismiss(item.id)} className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 items-center pointer-events-none" dir="rtl">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastEl item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
