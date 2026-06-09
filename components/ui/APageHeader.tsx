interface APageHeaderProps {
  icon?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function APageHeader({ icon, title, subtitle, action }: APageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-11 h-11 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-brand-sm">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-black text-xl text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
