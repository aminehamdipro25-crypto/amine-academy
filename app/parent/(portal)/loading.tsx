export default function ParentPortalLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse" dir="rtl">
      <div className="h-7 w-48 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
            <div className="h-6 w-12 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 bg-gray-200 rounded" />
                <div className="h-2.5 w-24 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded mb-1.5" />
            <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
