import { ReactNode } from 'react'

interface ACardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'colored' | 'ghost' | 'game'
  accentColor?: string
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'button' | 'article'
}

export default function ACard({
  children, className = '', variant = 'default',
  accentColor, hover = false, onClick, as: Tag = 'div',
}: ACardProps) {
  const base = 'rounded-3xl overflow-hidden transition-all duration-250'
  const variants = {
    default: 'bg-white border border-[#F0E8FF] shadow-card',
    colored: 'bg-gradient-to-br shadow-brand-sm',
    ghost:   'bg-surface-page border border-[#F0E8FF]/60',
    game:    'bg-white border-2 border-[#F0E8FF] shadow-card',
  }
  const hoverClass = hover
    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-card-hover active:translate-y-0 active:scale-[0.98]'
    : ''
  const accentStyle = accentColor
    ? { borderRightColor: accentColor, borderRightWidth: '4px' } as React.CSSProperties
    : {}

  return (
    <Tag
      className={`${base} ${variants[variant]} ${hoverClass} ${className}`}
      style={accentStyle}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}
