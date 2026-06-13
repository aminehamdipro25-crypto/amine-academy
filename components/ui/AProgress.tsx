interface AProgressProps {
  value: number          // 0–100
  max?: number
  color?: string
  label?: string
  showValue?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export default function AProgress({
  value, max = 100, color = 'bg-brand-500',
  label, showValue = false, size = 'sm', className = '',
}: AProgressProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const heights = { xs: 'h-1.5', sm: 'h-2.5', md: 'h-4' }
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-gray-600 font-medium">{label}</span>}
          {showValue && <span className="text-sm font-black text-gray-900 ltr-num">{pct}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#F3EEFF] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
