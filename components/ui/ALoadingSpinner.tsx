export default function ALoadingSpinner({ emoji = '🌟', text }: { emoji?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl animate-bounce-soft">{emoji}</div>
      {text && <p className="text-gray-400 text-sm font-medium">{text}</p>}
    </div>
  )
}
