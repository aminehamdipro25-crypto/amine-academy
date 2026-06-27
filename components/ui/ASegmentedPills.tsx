'use client'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PillOption {
  value: string
  label: ReactNode
  icon?: ReactNode
  count?: number
}

interface ASegmentedPillsProps {
  groupId: string
  options: PillOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

// Filter-pill row with a sliding active background (framer-motion layoutId) instead of
// an instant color swap — every admin page that filters by category/status should use this
// instead of hand-rolling its own pill buttons, so the interaction feels identical everywhere.
export default function ASegmentedPills({ groupId, options, value, onChange, className = '' }: ASegmentedPillsProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200 ${
              active ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${groupId}-active-pill`}
                className="absolute inset-0 bg-brand-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
              {opt.count !== undefined && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                }`}>
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
