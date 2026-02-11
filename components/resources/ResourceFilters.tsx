'use client'

import { Search } from 'lucide-react'
import {
  contentTypeOptions,
  topicOptions,
  skillLevelOptions,
  weekOptions,
  statusOptions,
} from '@/lib/constants'

interface Filters {
  contentType: string
  primaryTopic: string
  skillLevel: string
  weekSuggested: string
  statusPriority: string
}

interface ResourceFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export default function ResourceFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
}: ResourceFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, notes, or use cases..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <select
          value={filters.contentType}
          onChange={(e) => onFiltersChange({ ...filters, contentType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          <option value="">All Types</option>
          {contentTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select
          value={filters.primaryTopic}
          onChange={(e) => onFiltersChange({ ...filters, primaryTopic: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          <option value="">All Topics</option>
          {topicOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select
          value={filters.skillLevel}
          onChange={(e) => onFiltersChange({ ...filters, skillLevel: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          <option value="">All Levels</option>
          {skillLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select
          value={filters.weekSuggested}
          onChange={(e) => onFiltersChange({ ...filters, weekSuggested: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          <option value="">All Weeks</option>
          {weekOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select
          value={filters.statusPriority}
          onChange={(e) => onFiltersChange({ ...filters, statusPriority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          <option value="">All Status</option>
          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    </div>
  )
}
