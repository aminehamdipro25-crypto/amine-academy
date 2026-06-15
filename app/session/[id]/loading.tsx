export default function SessionLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl mx-auto" />
        <div className="h-4 w-32 bg-gray-200 rounded-xl mx-auto" />
        <div className="h-3 w-24 bg-gray-100 rounded-xl mx-auto" />
      </div>
    </div>
  )
}
