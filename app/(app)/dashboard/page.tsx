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

  // Get trending this week (materials with votes in the last 7 days, sorted by vote count)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: trendingThisWeek } = await supabase
    .from('votes')
    .select('material_id, created_at')
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false })

  // Count votes per material this week
  const weeklyVoteCounts = (trendingThisWeek || []).reduce((acc, vote) => {
    acc[vote.material_id] = (acc[vote.material_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topMaterialIdsThisWeek = Object.entries(weeklyVoteCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id)

  const { data: trending } = topMaterialIdsThisWeek.length > 0
    ? await supabase
        .from('material_scores')
        .select('*')
        .in('id', topMaterialIdsThisWeek)
    : { data: null }

  // Sort trending by the weekly vote count
  const trendingSorted = trending?.sort((a, b) => {
    return (weeklyVoteCounts[b.id] || 0) - (weeklyVoteCounts[a.id] || 0)
  })

  // Get recently active (materials with recent votes/comments in last 3 days)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { data: recentVotes } = await supabase
    .from('votes')
    .select('material_id, created_at')
    .gte('created_at', threeDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  const recentMaterialIds = [...new Set(recentVotes?.map(v => v.material_id) || [])].slice(0, 5)

  const { data: recentlyActive } = recentMaterialIds.length > 0
    ? await supabase
        .from('material_scores')
        .select('*')
        .in('id', recentMaterialIds)
    : { data: null }

  // Get needs reviews (materials with 0-2 votes, recently uploaded)
  const { data: needsReviews } = await supabase
    .from('material_scores')
    .select('*')
    .lte('vote_count', 2)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get top rated all time
  const { data: topRated } = await supabase
    .from('material_scores')
    .select('*')
    .gt('vote_count', 0)
    .order('avg_overall', { ascending: false })
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

  // Get materials added this week
  const { count: materialsThisWeek } = await supabase
    .from('materials')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  // Get votes this week
  const { count: votesThisWeek } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with the training materials.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-xs font-medium uppercase">Total Materials</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalMaterials || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-xs font-medium uppercase">Total Reviews</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{totalVotes || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-xs font-medium uppercase">Reviewers</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{totalUsers || 0}</p>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-xs font-medium uppercase">This Week</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{materialsThisWeek || 0}</p>
              <p className="text-xs text-orange-600 mt-0.5">materials added</p>
            </div>
            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-xs font-medium uppercase">This Week</p>
              <p className="text-3xl font-bold text-pink-900 mt-1">{votesThisWeek || 0}</p>
              <p className="text-xs text-pink-600 mt-0.5">reviews added</p>
            </div>
            <div className="w-10 h-10 bg-pink-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Trending This Week */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">🔥 Trending This Week</h2>
                <p className="text-xs text-muted">Most voted materials in the last 7 days</p>
              </div>
              <Link href="/library?sort=most_reviewed&date_filter=this_week" className="text-xs text-primary hover:text-primary-dark font-medium">
                View all →
              </Link>
            </div>
            {trendingSorted && trendingSorted.length > 0 ? (
              <div className="space-y-2">
                {trendingSorted.slice(0, 3).map((material, idx) => (
                  <div key={material.id} className="relative">
                    <div className="absolute -left-3 top-5 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
                      {idx + 1}
                    </div>
                    <MaterialCard material={material} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-muted">No activity this week yet. Start reviewing!</p>
              </div>
            )}
          </section>

          {/* Needs Reviews */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">📝 Needs Your Review</h2>
                <p className="text-xs text-muted">New materials waiting for feedback</p>
              </div>
              <Link href="/library?score_filter=none" className="text-xs text-primary hover:text-primary-dark font-medium">
                View all →
              </Link>
            </div>
            {needsReviews && needsReviews.length > 0 ? (
              <div className="space-y-2">
                {needsReviews.slice(0, 3).map(material => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg border-2 border-dashed border-green-200 p-6 text-center">
                <p className="text-sm text-green-700">All materials have been reviewed! 🎉</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recently Active */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">💬 Recently Active</h2>
                <p className="text-xs text-muted">Materials with recent reviews (last 3 days)</p>
              </div>
              <Link href="/library?sort=newest" className="text-xs text-primary hover:text-primary-dark font-medium">
                View all →
              </Link>
            </div>
            {recentlyActive && recentlyActive.length > 0 ? (
              <div className="space-y-2">
                {recentlyActive.slice(0, 3).map(material => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-muted">No recent activity.</p>
              </div>
            )}
          </section>

          {/* Top Rated All Time */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">⭐ Top Rated All Time</h2>
                <p className="text-xs text-muted">The highest quality materials overall</p>
              </div>
              <Link href="/library?sort=top_rated" className="text-xs text-primary hover:text-primary-dark font-medium">
                View all →
              </Link>
            </div>
            {topRated && topRated.length > 0 ? (
              <div className="space-y-2">
                {topRated.slice(0, 3).map(material => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-muted">No rated materials yet.</p>
                <Link
                  href="/library"
                  className="inline-block mt-2 text-xs text-primary hover:text-primary-dark font-medium"
                >
                  Start reviewing →
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/library"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Browse Library</p>
            <p className="text-xs text-blue-100">Explore all materials</p>
          </div>
        </Link>

        <Link
          href="/upload"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Upload Materials</p>
            <p className="text-xs text-green-100">Add new resources</p>
          </div>
        </Link>

        <Link
          href="/library?score_filter=none"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Review Materials</p>
            <p className="text-xs text-purple-100">Help rate content</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
