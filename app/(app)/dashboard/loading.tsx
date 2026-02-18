export default function DashboardLoading() {
  return (
    <div className="max-w-6xl animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-80" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-12" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Your Progress */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-1.5 bg-gray-200 rounded-full mb-1" />
              <div className="h-3 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
