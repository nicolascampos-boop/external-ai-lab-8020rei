import { createClient } from '@/lib/supabase/server'
import MaterialList from '@/components/material-list'
import FilterBar from '@/components/filter-bar'
import { CATEGORIES, CONTENT_TYPES } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{
    search?: string
    category?: string
    content_type?: string
    week?: string
    sort?: string
    date_filter?: string
    score_filter?: string
  }>
}

export default async function LibraryPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user role
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  let query = supabase.from('material_scores').select('*')

  // Search filter
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // Category filter
  if (params.category && params.category !== 'all') {
    query = query.contains('categories', [params.category])
  }

  // Content type filter
  if (params.content_type && params.content_type !== 'all') {
    query = query.eq('content_type', params.content_type)
  }

  // Week filter
  if (params.week && params.week !== 'all') {
    if (params.week === 'none') {
      query = query.is('week', null)
    } else {
      query = query.eq('week', params.week)
    }
  }

  // Date range filter
  if (params.date_filter && params.date_filter !== 'all') {
    const now = new Date()
    let startDate: Date

    switch (params.date_filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        query = query.gte('created_at', startDate.toISOString())
        break
      case 'this_week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        query = query.gte('created_at', startDate.toISOString())
        break
      case 'last_week':
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
        lastWeekStart.setHours(0, 0, 0, 0)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 7)
        query = query.gte('created_at', lastWeekStart.toISOString()).lt('created_at', lastWeekEnd.toISOString())
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        query = query.gte('created_at', startDate.toISOString())
        break
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
        query = query.gte('created_at', lastMonthStart.toISOString()).lt('created_at', lastMonthEnd.toISOString())
        break
    }
  }

  // Score filter
  if (params.score_filter && params.score_filter !== 'all') {
    if (params.score_filter === 'none') {
      // Materials with no votes and no initial_score
      query = query.eq('vote_count', 0).is('initial_score', null)
    } else {
      const minScore = parseFloat(params.score_filter)
      // Filter by avg_overall for voted materials, or initial_score for imported materials
      // This is a bit complex - we'll need to handle this in a custom way
      // For now, we'll use a simple approach: filter by avg_overall >= minScore OR (vote_count = 0 AND initial_score >= minScore)
      // Unfortunately Supabase doesn't support complex OR conditions easily, so we'll fetch and filter in memory
      // For simplicity, let's just filter by avg_overall for now and handle the rest client-side
    }
  }

  // Sort
  switch (params.sort) {
    case 'top_rated':
      query = query.order('avg_overall', { ascending: false, nullsFirst: false })
      break
    case 'most_reviewed':
      query = query.order('vote_count', { ascending: false })
      break
    case 'quality':
      query = query.order('avg_quality', { ascending: false, nullsFirst: false })
      break
    case 'relevance':
      query = query.order('avg_relevance', { ascending: false, nullsFirst: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: allMaterials } = await query

  // Client-side filtering for score (complex OR logic not supported well in Supabase)
  let materials = allMaterials
  if (params.score_filter && params.score_filter !== 'all' && materials) {
    if (params.score_filter === 'none') {
      // No rating at all
      materials = materials.filter(m => m.vote_count === 0 && !m.initial_score)
    } else {
      const minScore = parseFloat(params.score_filter)
      materials = materials.filter(m => {
        // Use voted score if available, otherwise fall back to initial_score
        const score = m.vote_count > 0
          ? m.avg_overall
          : m.initial_score || 0
        return score >= minScore
      })
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-muted mt-1">Browse and filter all training materials</p>
        </div>
      </div>

      <FilterBar
        categories={[...CATEGORIES]}
        contentTypes={[...CONTENT_TYPES]}
        currentSearch={params.search || ''}
        currentCategory={params.category || 'all'}
        currentContentType={params.content_type || 'all'}
        currentWeek={params.week || 'all'}
        currentSort={params.sort || 'newest'}
        currentDateFilter={params.date_filter || 'all'}
        currentScoreFilter={params.score_filter || 'all'}
      />

      {materials && materials.length > 0 ? (
        <div className="mt-6">
          <MaterialList materials={materials} isAdmin={isAdmin} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center mt-6">
          <p className="text-muted">
            {params.search || params.category || params.content_type || params.week
              ? 'No materials match your filters.'
              : 'No materials uploaded yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
