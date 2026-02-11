'use client'

import { useResources } from '@/hooks/useResources'
import StatsCards from '@/components/dashboard/StatsCards'
import WeeklyView from '@/components/resources/WeeklyView'
import { Download } from 'lucide-react'

export default function DashboardPage() {
  const { stats, weeklyData, loading, exportToCSV } = useResources()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Fetching resources</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your AI training library</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <StatsCards stats={stats} />
      <WeeklyView weeklyData={weeklyData} />
    </div>
  )
}
