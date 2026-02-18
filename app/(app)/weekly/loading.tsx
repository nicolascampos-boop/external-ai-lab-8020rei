export default function WeeklyLoading() {
  return (
    <div className="max-w-6xl animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-80" />
      </div>

      {/* Info Box */}
      <div className="mb-6 h-20 bg-blue-50 rounded-xl border border-blue-100" />

      {/* Week Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 mb-6">
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-10 rounded-lg flex-shrink-0 ${
                i === 0 ? 'w-24 bg-gray-300' : 'w-20 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Week Header + Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-5 md:p-6 mb-6">
        <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-56 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-40 mb-3" />
        <div className="h-2 bg-gray-200 rounded-full w-full mb-1" />
        <div className="h-3 bg-gray-200 rounded w-28" />
      </div>

      {/* Material Cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 ml-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 mb-2">
                  <div className="h-5 bg-gray-200 rounded w-16" />
                  <div className="h-5 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
