'use client'
// Small building blocks shared by the work-log screens.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { STATUS_META, type LessonStatus } from '@/lib/worklog'
import { ARABIC_LOCALE, formatDateOnly } from '@/lib/format'

export const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition ' +
  'focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-gray-50 placeholder:text-gray-300'

export function Field({ label, hint, children, id }: { label: string; hint?: string; children: (id: string) => ReactNode; id?: string }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className="space-y-1.5">
      <label htmlFor={fid} className="block text-xs font-bold text-gray-600">{label}</label>
      {children(fid)}
      {hint && <p className="text-[11px] text-gray-400 leading-relaxed">{hint}</p>}
    </div>
  )
}

/**
 * Bottom sheet on phones, centred dialog on larger screens. Esc and backdrop close it.
 *
 * Rendered into <body> through a portal: a sheet opened from inside an
 * animated (transformed) container is otherwise positioned and stacked inside
 * that container, and the very card that opened it draws on top of it.
 */
export function Sheet({ open, title, onClose, children, footer, wide }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    // With two sheets stacked, Esc closes only the one on top.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const dialogs = document.querySelectorAll('[role=dialog]')
      if (dialogs[dialogs.length - 1] === panel.current) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  if (!mounted) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-[2px] sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            dir="rtl"
            onClick={e => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl outline-none`}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-1.5 h-1 w-10 rounded-full bg-gray-200" />
              <h2 className="font-black text-gray-900">{title}</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400" aria-label="إغلاق">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="px-5 py-3 border-t border-gray-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function StatusPill({ status, charged, small }: { status: LessonStatus; charged?: boolean; small?: boolean }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${m.soft} ${m.text} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'}`}>
      <span aria-hidden>{m.icon}</span>
      {m.label}{status === 'cancelled' && charged ? ' · مدفوعة' : ''}
    </span>
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex rounded-xl bg-gray-100 p-1 gap-1" role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-lg font-bold transition ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
            value === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'gray', icon }: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: 'gray' | 'green' | 'rose' | 'blue' | 'violet' | 'amber'; icon?: ReactNode
}) {
  const tones = {
    gray: 'bg-gray-50 text-gray-500', green: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600', violet: 'bg-brand-50 text-brand-600', amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</span>}
        <span className="text-[11px] font-bold text-gray-500">{label}</span>
      </div>
      <div className="text-xl font-black text-gray-900 leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">{icon}</div>
      <p className="font-black text-gray-800">{title}</p>
      {text && <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function primaryBtn(extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 ${extra}`
}
export function ghostBtn(extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 ${extra}`
}

/** "الأحد 4 أكتوبر" */
export function dayLabel(date: string, withYear = false) {
  return formatDateOnly(date, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) })
}
export function shortDate(date: string) {
  return formatDateOnly(date, ARABIC_LOCALE, { day: 'numeric', month: 'short' })
}
export function monthLabel(date: string) {
  return formatDateOnly(date.slice(0, 7) + '-01', ARABIC_LOCALE, { month: 'long', year: 'numeric' })
}

/** Today's calendar date in the viewer's own zone. */
export function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function localNowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
