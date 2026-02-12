import { createClient } from '@/lib/supabase/server'
import MaterialCard from '@/components/material-card'
import FilterBar from '@/components/filter-bar'
import { CATEGORIES } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{
    search?: string
    category?: string
    sort?: string
    file_type?: string
  }>
}

export default async function LibraryPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('material_scores').select('*')

  // Search filter
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // Category filter
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  // File type filter
  if (params.file_type && params.file_type !== 'all') {
    if (params.file_type === 'pdf') {
      query = query.eq('file_type', 'application/pdf')
    } else if (params.file_type === 'docx') {
      query = query.like('file_type', '%wordprocessingml%')
    }
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
        currentSearch={params.search || ''}
        currentCategory={params.category || 'all'}
        currentSort={params.sort || 'newest'}
        currentFileType={params.file_type || 'all'}
      />

      {materials && materials.length > 0 ? (
        <div className="space-y-3 mt-6">
          {materials.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center mt-6">
          <p className="text-muted">
            {params.search || params.category !== 'all'
              ? 'No materials match your filters.'
              : 'No materials uploaded yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
