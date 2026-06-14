'use client'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmClass?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message,
  confirmLabel = 'تأكيد',
  confirmClass = 'bg-red-600 hover:bg-red-700',
  onConfirm, onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl palette-enter"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="font-black text-gray-900 text-base">{title}</h3>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors -mt-1 -ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className={`flex-1 py-2.5 rounded-2xl text-white text-sm font-black transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
