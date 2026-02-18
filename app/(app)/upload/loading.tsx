export default function UploadLoading() {
  return (
    <div className="max-w-2xl animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-44 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-20 mb-1.5" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        ))}

        {/* Two-column row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1.5" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-1.5" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Submit button */}
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
