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
    query = query.eq('week', params.week)
  }

  // Sort
  switch (params.sort) {
    case 'top_rated':
      query = query.order('avg_overall', { ascending: false })
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

  const { data: materials } = await query

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
