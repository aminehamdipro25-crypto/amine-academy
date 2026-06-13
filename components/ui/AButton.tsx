import { ReactNode, ButtonHTMLAttributes } from 'react'

interface AButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
}

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-sm hover:shadow-brand active:scale-[0.97]',
  secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 hover:border-brand-300',
  ghost:     'bg-transparent hover:bg-brand-50 text-brand-600 hover:text-brand-700',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-[0.97]',
  success:   'bg-calm-green hover:bg-green-500 text-white shadow-sm active:scale-[0.97]',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-2xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2',
  xl: 'px-9 py-4 text-lg rounded-3xl gap-2.5',
}

export default function AButton({
  children, variant = 'primary', size = 'md',
  fullWidth = false, loading = false, icon, className = '', disabled, ...props
}: AButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-black
        transition-all duration-200 ease-out select-none
        focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
}
