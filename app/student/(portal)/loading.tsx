export default function StudentPortalLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 animate-pulse" dir="rtl">
      <div className="h-7 w-40 bg-purple-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl mb-3" />
            <div className="h-5 w-16 bg-gray-200 rounded mb-1.5" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 bg-gray-200 rounded" />
                <div className="h-2.5 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
