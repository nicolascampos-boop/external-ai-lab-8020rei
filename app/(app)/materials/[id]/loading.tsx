export default function MaterialDetailLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-gray-200 rounded w-32 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Material info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Badges */}
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-28" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
            {/* Title */}
            <div className="h-7 bg-gray-200 rounded w-4/5 mb-3" />
            {/* Description */}
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            {/* Resource link */}
            <div className="mt-4 h-16 bg-gray-100 rounded-lg" />
            {/* Meta info */}
            <div className="flex gap-4 mt-5 pt-5 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          </div>

          {/* Reviews section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 bg-gray-200 rounded w-28 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-36" />
                    </div>
                  </div>
                  <div className="ml-11 h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-4" />
            <div className="flex justify-center gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-5 bg-gray-200 rounded w-8 mx-auto mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-14 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Vote widget placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
            <div className="space-y-3">
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
