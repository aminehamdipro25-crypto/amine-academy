interface AEmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function AEmptyState({ icon, title, description, action, className = '' }: AEmptyStateProps) {
  return (
    <div className={`bg-white rounded-3xl border-2 border-dashed border-[#E8DBFF] p-12 text-center ${className}`}>
      <div className="text-6xl mb-4 animate-float">{icon}</div>
      <h3 className="font-black text-gray-700 text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}
