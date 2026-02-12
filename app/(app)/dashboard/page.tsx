import { createClient } from '@/lib/supabase/server'
import MaterialCard from '@/components/material-card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile for greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Get top-rated materials (most reviewed + highest scores)
  const { data: topRated } = await supabase
    .from('material_scores')
    .select('*')
    .gt('vote_count', 0)
    .order('avg_overall', { ascending: false })
    .limit(5)

  // Get most reviewed materials
  const { data: mostReviewed } = await supabase
    .from('material_scores')
    .select('*')
    .order('vote_count', { ascending: false })
    .limit(5)

  // Get recently uploaded
  const { data: recent } = await supabase
    .from('material_scores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Stats
  const { count: totalMaterials } = await supabase
    .from('materials')
    .select('*', { count: 'exact', head: true })

  const { count: totalVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with the training materials.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted text-sm">Total Materials</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalMaterials || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted text-sm">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalVotes || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted text-sm">Reviewers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers || 0}</p>
        </div>
      </div>

      {/* Top Rated */}
      {topRated && topRated.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Rated</h2>
            <Link href="/library" className="text-sm text-primary hover:text-primary-dark">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {topRated.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        </section>
      )}

      {/* Most Reviewed */}
      {mostReviewed && mostReviewed.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Most Reviewed</h2>
            <Link href="/library" className="text-sm text-primary hover:text-primary-dark">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {mostReviewed.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        </section>
      )}

      {/* Recent uploads */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recently Uploaded</h2>
          <Link href="/upload" className="text-sm text-primary hover:text-primary-dark">
            Upload new
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted">No materials uploaded yet.</p>
            <Link
              href="/upload"
              className="inline-block mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              Upload the first one
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
