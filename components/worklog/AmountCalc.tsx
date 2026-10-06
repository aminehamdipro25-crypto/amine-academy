'use client'
import { useRef } from 'react'
import { Delete } from 'lucide-react'
import { evalAmount, formatMoney, isCalculation, type WorkCurrency } from '@/lib/worklog'
import { inputCls } from './ui'

const KEYS = ['+', '−', '×', '÷', '(', ')'] as const

/**
 * An amount field that is also a calculator: «12+15+8.5» for two Ubers and a
 * coffee, summed as it is typed. The keys add the operators a phone's number
 * keyboard does not have; the result shows under the field.
 */
export default function AmountCalc({ id, value, onChange, currency, autoFocus }: {
  id: string; value: string; onChange: (v: string) => void; currency: WorkCurrency; autoFocus?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const calc = isCalculation(value)
  const result = value.trim() ? evalAmount(value) : null

  // Insert at the caret, keep the keyboard open.
  function insert(text: string) {
    const el = ref.current
    const start = el?.selectionStart ?? value.length, end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + text.length, start + text.length) })
  }

  return (
    <div className="space-y-1.5">
      <input ref={ref} id={id} dir="ltr" inputMode="decimal" autoComplete="off" autoFocus={autoFocus}
        className={`${inputCls} text-lg font-black text-right`} value={value} onChange={e => onChange(e.target.value)}
        placeholder="مثال: 12+15+8" aria-describedby={`${id}-result`} />
      <div className="flex flex-wrap gap-1">
        {KEYS.map(k => (
          <button key={k} type="button" onMouseDown={e => e.preventDefault()} onClick={() => insert(k === '−' ? '-' : k)}
            className="w-9 h-8 rounded-lg bg-gray-100 text-sm font-black text-gray-700 hover:bg-gray-200" aria-label={`إدخال ${k}`}>{k}</button>
        ))}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => onChange(value.slice(0, -1))}
          className="w-9 h-8 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center" aria-label="حذف آخر حرف"><Delete className="w-4 h-4" /></button>
        {value && <button type="button" onClick={() => onChange('')} className="h-8 px-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">مسح</button>}
      </div>
      <p id={`${id}-result`} className="text-xs min-h-4" aria-live="polite">
        {calc && result !== null && <span className="font-black text-emerald-700">المجموع: {formatMoney(result, currency)}</span>}
        {value.trim() && result === null && <span className="font-bold text-rose-600">العملية غير مكتملة</span>}
      </p>
    </div>
  )
}
