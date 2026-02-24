import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MaterialList from '@/components/material-list'
import FilterBar from '@/components/filter-bar'
import { CONTENT_TYPES } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{
    search?: string
    category?: string
    content_type?: string
    week?: string
    sort?: string
    date_filter?: string
    score_filter?: string
    essential_filter?: string
  }>
}

export default async function LibraryPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user role + reviewed material IDs
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  let userReviewedIds: string[] = []
  if (user) {
    const [{ data: profile }, { data: userVotes }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('votes').select('material_id').eq('user_id', user.id),
    ])
    isAdmin = profile?.role === 'admin'
    userReviewedIds = (userVotes ?? []).map(v => v.material_id)
  }

  // Fetch all distinct categories from the DB so the filter dropdown always matches stored values
  const { data: categoryRows } = await supabase.from('materials').select('categories')
  const dbCategories = [...new Set(
    (categoryRows ?? []).flatMap(m => (m.categories as string[] | null) ?? []).filter(Boolean)
  )].sort()

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

  // Tier/Core filter
  if (params.essential_filter && params.essential_filter !== 'all') {
    if (params.essential_filter === 'essential') {
      query = query.eq('material_tier', 'core')
    } else if (params.essential_filter === 'non_essential') {
      query = query.neq('material_tier', 'core')
    }
  }

  // Sort
  switch (params.sort) {
    case 'essential_first':
      // Sort core first, then reference, then optional, within each group sort by rating
      query = query.order('material_tier', { ascending: true }).order('avg_overall', { ascending: false, nullsFirst: false })
      break
    case 'top_rated':
      query = query.order('avg_overall', { ascending: false, nullsFirst: false })
      break
    case 'most_reviewed':
      query = query.order('vote_count', { ascending: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Add limit for better performance
  query = query.limit(200)

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
        categories={dbCategories}
        contentTypes={[...CONTENT_TYPES]}
        currentSearch={params.search || ''}
        currentCategory={params.category || 'all'}
        currentContentType={params.content_type || 'all'}
        currentWeek={params.week || 'all'}
        currentSort={params.sort || 'newest'}
        currentDateFilter={params.date_filter || 'all'}
        currentScoreFilter={params.score_filter || 'all'}
        currentEssentialFilter={params.essential_filter || 'all'}
      />

      {materials && materials.length > 0 ? (
        <div className="mt-6">
          <MaterialList materials={materials} isAdmin={isAdmin} userReviewedIds={userReviewedIds} />
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
