'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

interface FilterBarProps {
  categories: string[]
  contentTypes: string[]
  currentSearch: string
  currentCategory: string
  currentContentType: string
  currentWeek: string
  currentSort: string
  currentDateFilter: string
  currentScoreFilter: string
}

export default function FilterBar({
  categories,
  contentTypes,
  currentSearch,
  currentCategory,
  currentContentType,
  currentWeek,
  currentSort,
  currentDateFilter,
  currentScoreFilter,
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== 'newest') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/library?${params.toString()}`)
  }, [router, searchParams])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams('search', search)
  }

  function clearAll() {
    setSearch('')
    router.push('/library')
  }

  const hasActiveFilters = currentSearch || currentCategory !== 'all' || currentContentType !== 'all' || currentWeek !== 'all' || currentSort !== 'newest' || currentDateFilter !== 'all' || currentScoreFilter !== 'all'

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Filter & Sort Materials</h3>
        <p className="text-xs text-muted mt-0.5">Use filters to find specific materials or sort to organize the library</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Row 1: Search */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </form>

        {/* Row 2: Primary Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Category filter */}
          <select
            value={currentCategory}
            onChange={e => updateParams('category', e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Content type filter */}
          <select
            value={currentContentType}
            onChange={e => updateParams('content_type', e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Types</option>
            {contentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Week filter */}
          <select
            value={currentWeek}
            onChange={e => updateParams('week', e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Weeks</option>
            <option value="Week 1">Week 1</option>
            <option value="Week 2">Week 2</option>
            <option value="Week 3">Week 3</option>
            <option value="Week 4">Week 4</option>
            <option value="Optional">Optional</option>
            <option value="none">No Week Assigned</option>
          </select>

          {/* Date range filter */}
          <select
            value={currentDateFilter}
            onChange={e => updateParams('date_filter', e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Time</option>
            <option value="today">Added Today</option>
            <option value="this_week">Added This Week</option>
            <option value="last_week">Added Last Week</option>
            <option value="this_month">Added This Month</option>
            <option value="last_month">Added Last Month</option>
          </select>
        </div>

        {/* Row 3: Score Filter & Sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Score filter */}
          <select
            value={currentScoreFilter}
            onChange={e => updateParams('score_filter', e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4+ Stars)</option>
            <option value="3">⭐⭐⭐ (3+ Stars)</option>
            <option value="2">⭐⭐ (2+ Stars)</option>
            <option value="1">⭐ (1+ Stars)</option>
            <option value="none">No Rating</option>
          </select>

          {/* Sort */}
          <select
            value={currentSort}
            onChange={e => updateParams('sort', e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="newest">📅 Newest First</option>
            <option value="oldest">📅 Oldest First</option>
            <option value="top_rated">⭐ Top Rated</option>
            <option value="most_reviewed">💬 Most Reviewed</option>
            <option value="quality">✨ Best Quality</option>
            <option value="relevance">🎯 Most Relevant</option>
          </select>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors whitespace-nowrap border border-red-200"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
