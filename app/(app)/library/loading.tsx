export default function LibraryLoading() {
  return (
    <div className="max-w-6xl animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2 items-center mb-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="hidden md:block h-10 w-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="hidden md:grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Material Cards */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 mb-2">
                  <div className="h-5 bg-gray-200 rounded w-16" />
                  <div className="h-5 bg-gray-200 rounded w-24" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex gap-3 mt-3">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
