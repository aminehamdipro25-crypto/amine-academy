export default function AppointmentsLoading() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-10 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
                <div className="h-2.5 w-40 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-14 bg-gray-100 rounded-2xl mb-4" />
            <div className="h-10 bg-gray-50 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
