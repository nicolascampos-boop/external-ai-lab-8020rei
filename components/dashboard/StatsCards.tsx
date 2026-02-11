'use client'

interface StatsCardsProps {
  stats: {
    total: number
    core: number
    toReview: number
    avgQuality: string | number
    avgRelevance: string | number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Resources</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-900">{stats.core}</div>
        <div className="text-sm text-green-600">Core Content</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-900">{stats.toReview}</div>
        <div className="text-sm text-yellow-600">To Review</div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-900">{stats.avgQuality}</div>
        <div className="text-sm text-blue-600">Avg Quality</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-purple-900">{stats.avgRelevance}</div>
        <div className="text-sm text-purple-600">Avg Relevance</div>
      </div>
    </div>
  )
}
