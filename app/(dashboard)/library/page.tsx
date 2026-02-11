'use client'

import { useResources } from '@/hooks/useResources'
import WeeklyView from '@/components/resources/WeeklyView'

export default function LibraryPage() {
  const { weeklyData, loading } = useResources()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-700">Loading library...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Library</h1>
        <p className="text-gray-600">All resources organized by week</p>
      </div>
      <WeeklyView weeklyData={weeklyData} />
    </div>
  )
}
