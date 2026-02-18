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
  currentEssentialFilter: string
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
  currentEssentialFilter,
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(
    currentContentType !== 'all' || currentDateFilter !== 'all' ||
    currentScoreFilter !== 'all' || currentEssentialFilter !== 'all'
  )

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
    setShowFilters(false)
    setShowAdvanced(false)
    router.push('/library')
  }

  const hasActiveFilters = currentSearch || currentCategory !== 'all' || currentContentType !== 'all' ||
    currentWeek !== 'all' || currentSort !== 'newest' || currentDateFilter !== 'all' ||
    currentScoreFilter !== 'all' || currentEssentialFilter !== 'all'

  // Count for mobile toggle (all non-default filters)
  const activeFilterCount = [
    currentSearch,
    currentCategory !== 'all' && currentCategory,
    currentContentType !== 'all' && currentContentType,
    currentWeek !== 'all' && currentWeek,
    currentDateFilter !== 'all' && currentDateFilter,
    currentScoreFilter !== 'all' && currentScoreFilter,
    currentEssentialFilter !== 'all' && currentEssentialFilter,
    currentSort !== 'newest' && currentSort,
  ].filter(Boolean).length

  // Count for desktop advanced toggle (only advanced filters)
  const advancedFilterCount = [
    currentContentType !== 'all' && currentContentType,
    currentDateFilter !== 'all' && currentDateFilter,
    currentScoreFilter !== 'all' && currentScoreFilter,
    currentEssentialFilter !== 'all' && currentEssentialFilter,
  ].filter(Boolean).length

  const selectClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + mobile toggle + desktop clear */}
        <div className="flex gap-2 items-center">
          <form onSubmit={handleSearch} className="flex-1">
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

          {/* Mobile-only filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="hidden md:block px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors whitespace-nowrap border border-red-200 flex-shrink-0"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Desktop: Primary filters — always visible (hidden on mobile, part of mobile toggle) */}
        <div className="hidden md:grid grid-cols-3 gap-2">
          <select value={currentCategory} onChange={e => updateParams('category', e.target.value)} className={selectClass}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select value={currentWeek} onChange={e => updateParams('week', e.target.value)} className={selectClass}>
            <option value="all">All Weeks</option>
            <option value="Week 1">Week 1</option>
            <option value="Week 2">Week 2</option>
            <option value="Week 3">Week 3</option>
            <option value="Week 4">Week 4</option>
            <option value="Week 5">Week 5</option>
            <option value="Week 6">Week 6</option>
            <option value="Optional">Optional</option>
            <option value="none">No Week Assigned</option>
          </select>

          <select value={currentSort} onChange={e => updateParams('sort', e.target.value)} className={selectClass}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="essential_first">Essential First</option>
            <option value="top_rated">Top Rated</option>
            <option value="most_reviewed">Most Reviewed</option>
          </select>
        </div>

        {/* Desktop: Advanced filters toggle */}
        <div className="hidden md:block">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Filters
            {advancedFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full">
                {advancedFilterCount}
              </span>
            )}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              <select value={currentContentType} onChange={e => updateParams('content_type', e.target.value)} className={selectClass}>
                <option value="all">All Types</option>
                {contentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>

              <select value={currentDateFilter} onChange={e => updateParams('date_filter', e.target.value)} className={selectClass}>
                <option value="all">All Time</option>
                <option value="today">Added Today</option>
                <option value="this_week">Added This Week</option>
                <option value="last_week">Added Last Week</option>
                <option value="this_month">Added This Month</option>
                <option value="last_month">Added Last Month</option>
              </select>

              <select value={currentScoreFilter} onChange={e => updateParams('score_filter', e.target.value)} className={selectClass}>
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
                <option value="none">No Rating</option>
              </select>

              <select value={currentEssentialFilter} onChange={e => updateParams('essential_filter', e.target.value)} className={selectClass}>
                <option value="all">All Materials</option>
                <option value="essential">Essential Only</option>
                <option value="non_essential">Regular Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Mobile: All filters behind toggle */}
        <div className={showFilters ? 'flex flex-col gap-3 md:hidden' : 'hidden'}>
          {/* Primary */}
          <div className="grid grid-cols-2 gap-2">
            <select value={currentCategory} onChange={e => updateParams('category', e.target.value)} className={selectClass}>
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select value={currentWeek} onChange={e => updateParams('week', e.target.value)} className={selectClass}>
              <option value="all">All Weeks</option>
              <option value="Week 1">Week 1</option>
              <option value="Week 2">Week 2</option>
              <option value="Week 3">Week 3</option>
              <option value="Week 4">Week 4</option>
              <option value="Week 5">Week 5</option>
              <option value="Week 6">Week 6</option>
              <option value="Optional">Optional</option>
              <option value="none">No Week Assigned</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={currentContentType} onChange={e => updateParams('content_type', e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              {contentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>

            <select value={currentSort} onChange={e => updateParams('sort', e.target.value)} className={selectClass}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="essential_first">Essential First</option>
              <option value="top_rated">Top Rated</option>
              <option value="most_reviewed">Most Reviewed</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select value={currentDateFilter} onChange={e => updateParams('date_filter', e.target.value)} className={selectClass}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            <select value={currentScoreFilter} onChange={e => updateParams('score_filter', e.target.value)} className={selectClass}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
              <option value="none">No Rating</option>
            </select>

            <select value={currentEssentialFilter} onChange={e => updateParams('essential_filter', e.target.value)} className={selectClass}>
              <option value="all">All Materials</option>
              <option value="essential">Essential</option>
              <option value="non_essential">Regular</option>
            </select>
          </div>

          {/* Mobile clear all */}
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
