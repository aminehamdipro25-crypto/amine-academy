interface ABadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  className?: string
}

export default function ABadge({
  children, color = 'text-brand-700', bg = 'bg-brand-50',
  size = 'sm', dot = false, className = '',
}: ABadgeProps) {
  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  }
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${bg} ${color} ${sizes[size]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
