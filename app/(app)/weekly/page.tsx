import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MaterialCard from '@/components/material-card'
import WeekEditForm from '@/components/week-edit-form'
import WeekLockToggle from '@/components/week-lock-toggle'
import DeliverableForm from '@/components/deliverable-form'
import Link from 'next/link'
import { WEEKS, WEEK_DESCRIPTIONS } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{
    week?: string
    tab?: string
  }>
}

export default async function WeeklyTrainingPage({ searchParams }: Props) {
  const params = await searchParams
  const currentWeek = params.week || 'Week 1'
  const currentTab = params.tab || 'resources'
  const supabase = await createClient()

  // Round 1: auth
  const { data: { user } } = await supabase.auth.getUser()

  // Round 2: profile + user vote IDs (parallel)
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

  // Round 3: all independent data (parallel)
  const [
    { data: materials },
    { data: weekContent },
    userDeliverableResult,
    { data: allMaterialWeeks },
    { data: allWeeksStatus },
  ] = await Promise.all([
    supabase
      .from('material_scores')
      .select('*')
      .eq('week', currentWeek)
      .order('material_tier', { ascending: true })
      .order('avg_relevance', { ascending: false, nullsFirst: false })
      .order('avg_overall', { ascending: false, nullsFirst: false }),
    supabase
      .from('week_content')
      .select('*')
      .eq('week', currentWeek)
      .single(),
    user
      ? supabase
          .from('week_deliverables')
          .select('*')
          .eq('user_id', user.id)
          .eq('week', currentWeek)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from('materials').select('week').not('week', 'is', null),
    // Fetch enabled status for all weeks (for tab visibility)
    supabase.from('week_content').select('week, is_enabled'),
  ])

  const userDeliverable = userDeliverableResult.data ?? null

  // Build enabled-week set — Reference is always enabled as a fallback
  const enabledWeeks = new Set<string>(
    (allWeeksStatus ?? [])
      .filter(w => w.is_enabled)
      .map(w => w.week)
  )
  // Ensure Reference is always accessible
  enabledWeeks.add('Reference')
  // Ensure Week 1 is always accessible (safety fallback)
  enabledWeeks.add('Week 1')

  // Non-admin trying to access a locked week → redirect to Week 1
  if (!isAdmin && !enabledWeeks.has(currentWeek)) {
    redirect('/weekly')
  }

  // Count materials per week in JS (1 query instead of N)
  const weekCounts: Record<string, number> = {}
  WEEKS.forEach(w => { weekCounts[w] = 0 })
  allMaterialWeeks?.forEach(m => {
    if (m.week && weekCounts[m.week] !== undefined) weekCounts[m.week]++
  })

  // Round 4: admin-only data
  const { data: allDeliverables } = isAdmin
    ? await supabase
        .from('week_deliverables')
        .select('*, profiles(full_name, email)')
        .eq('week', currentWeek)
        .order('submitted_at', { ascending: false })
    : { data: null }

  // Tier grouping — 4 tiers: must_read (top priority) → core → optional → reference
  const mustReadMats = (materials ?? []).filter(m =>
    m.material_tier === 'must_read' || m.material_tier === 'must-read'
  )
  const coreMats = (materials ?? []).filter(m => m.material_tier === 'core')
  const optionalMats = (materials ?? []).filter(m => m.material_tier === 'optional')
  const referenceMats = (materials ?? []).filter(m => m.material_tier === 'reference')

  // Progress: must_read + core materials (each = 1 pt) + deliverable (= 1 pt)
  const requiredMats = [...mustReadMats, ...coreMats]
  const requiredTotal = requiredMats.length
  const requiredReviewed = requiredMats.filter(m => userReviewedIds.includes(m.id)).length
  const hasDeliverable = !!userDeliverable
  const totalPoints = requiredTotal + 1  // +1 for deliverable
  const earnedPoints = requiredReviewed + (hasDeliverable ? 1 : 0)
  const progressPct = totalPoints > 1 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const weekComplete = requiredTotal > 0 && earnedPoints === totalPoints

  // Week header — prefer DB values, fall back to constants
  const weekTitle = weekContent?.title || currentWeek
  const weekDescription = weekContent?.description || WEEK_DESCRIPTIONS[currentWeek] || ''
  const isCurrentWeekEnabled = weekContent?.is_enabled ?? enabledWeeks.has(currentWeek)

  // Visible tabs for non-admins: only enabled weeks (admins see all with lock indicators)
  const visibleWeeks = isAdmin
    ? WEEKS
    : WEEKS.filter(w => enabledWeeks.has(w))

  const TABS = [
    { id: 'resources', label: '📚 Resources' },
    { id: 'objectives', label: '🎯 Objectives' },
    { id: 'deliverable', label: '📬 Deliverable' },
  ] as const

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Training</h1>
        <p className="text-muted mt-1">Materials organized by training week</p>
      </div>

      {/* Week Tabs */}
      <div className="bg-card rounded-xl border border-border p-2 mb-6">
        <div className="overflow-x-auto">
          <div className="flex gap-2 flex-nowrap min-w-max">
            {visibleWeeks.map(week => {
              const isActive = week === currentWeek
              const count = weekCounts[week] || 0
              const isLocked = !enabledWeeks.has(week)
              return (
                <Link
                  key={week}
                  href={`/weekly?week=${encodeURIComponent(week)}`}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : isLocked
                        ? 'text-gray-400 hover:bg-gray-50 border border-dashed border-gray-300'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isLocked && <span className="mr-1 text-xs">🔒</span>}
                  {week}
                  <span className={`ml-2 text-xs ${isActive ? 'text-white/80' : 'text-muted'}`}>
                    ({count})
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Week Header with progress */}
      <div className={`rounded-xl border p-5 md:p-6 mb-4 ${
        weekComplete
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{weekTitle}</h2>
            {weekDescription && (
              <p className="text-sm text-blue-700 font-medium mt-0.5">{weekDescription}</p>
            )}
            <p className="text-xs text-muted mt-1">
              {materials && materials.length > 0
                ? `${materials.length} ${materials.length === 1 ? 'material' : 'materials'}${requiredTotal > 0 ? ` • ${requiredTotal} required` : ''}`
                : 'No materials for this week yet'}
            </p>

            {/* Progress bar: must read + core reviews + deliverable */}
            {requiredTotal > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Week progress</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {earnedPoints}/{totalPoints} complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      weekComplete ? 'bg-green-500' : progressPct === 100 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-gray-500">
                    {requiredReviewed}/{requiredTotal} required reviewed
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className={`text-xs font-medium ${hasDeliverable ? 'text-green-600' : 'text-gray-400'}`}>
                    {hasDeliverable ? '✓ deliverable submitted' : 'deliverable pending'}
                  </span>
                </div>
                {weekComplete && (
                  <p className="text-xs text-green-600 font-medium mt-1">✓ Week complete!</p>
                )}
                {!weekComplete && requiredReviewed === requiredTotal && requiredTotal > 0 && !hasDeliverable && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    All required materials reviewed — submit your deliverable to complete this week →
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Admin controls: lock toggle + add materials */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
              {currentWeek !== 'Reference' && (
                <WeekLockToggle week={currentWeek} isEnabled={isCurrentWeekEnabled} />
              )}
              <Link
                href="/upload"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
              >
                Add Materials
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Admin: inline week editor — accessible from any tab */}
      {isAdmin && (
        <div className="mb-4">
          <WeekEditForm
            week={currentWeek}
            initialTitle={weekContent?.title ?? ''}
            initialDescription={weekContent?.description ?? ''}
            initialObjectives={weekContent?.objectives ?? ''}
            initialHomework={weekContent?.homework ?? ''}
            initialDeliverablePrompt={weekContent?.deliverable_prompt ?? ''}
          />
        </div>
      )}

      {/* Sub-tabs: Resources / Objectives / Deliverable */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => (
          <Link
            key={tab.id}
            href={`/weekly?week=${encodeURIComponent(currentWeek)}&tab=${tab.id}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              currentTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Resources Tab */}
      {currentTab === 'resources' && (
        <div>
          {materials && materials.length > 0 ? (
            <div>
              {/* Must Read — highest priority */}
              {mustReadMats.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      💎 Must Read — {mustReadMats.length} {mustReadMats.length === 1 ? 'material' : 'materials'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {mustReadMats.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        from="weekly"
                        week={currentWeek}
                        isReviewed={userReviewedIds.includes(material.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Core — assigned materials for the week */}
              {coreMats.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      ⭐ Core — {coreMats.length} {coreMats.length === 1 ? 'material' : 'materials'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {coreMats.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        from="weekly"
                        week={currentWeek}
                        isReviewed={userReviewedIds.includes(material.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Optional — supplementary materials */}
              {optionalMats.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                      Optional — {optionalMats.length} {optionalMats.length === 1 ? 'material' : 'materials'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {optionalMats.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        from="weekly"
                        week={currentWeek}
                        isReviewed={userReviewedIds.includes(material.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reference materials */}
              {referenceMats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                      📌 Reference — {referenceMats.length} {referenceMats.length === 1 ? 'material' : 'materials'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {referenceMats.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        from="weekly"
                        week={currentWeek}
                        isReviewed={userReviewedIds.includes(material.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-muted mb-4">No materials for {currentWeek} yet.</p>
              {isAdmin && (
                <Link
                  href="/upload"
                  className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Upload Materials
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Objectives Tab */}
      {currentTab === 'objectives' && (
        <div className="space-y-4">
          {weekContent?.objectives ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🎯 Learning Objectives</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{weekContent.objectives}</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted text-sm">
              {isAdmin ? 'Use the Edit Week panel above to add objectives.' : 'Objectives coming soon...'}
            </div>
          )}

          {weekContent?.homework && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📝 Homework &amp; To-Do</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{weekContent.homework}</p>
            </div>
          )}
        </div>
      )}

      {/* Deliverable Tab */}
      {currentTab === 'deliverable' && (
        <div className="space-y-4">
          {weekContent?.deliverable_prompt ? (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-900 mb-2">📬 Deliverable</h3>
              <p className="text-sm text-amber-800 leading-relaxed">{weekContent.deliverable_prompt}</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted">
                {isAdmin ? 'Use the Edit Week panel above to add a deliverable prompt.' : 'No deliverable assigned for this week yet.'}
              </p>
            </div>
          )}

          <DeliverableForm
            week={currentWeek}
            existingLink={userDeliverable?.link ?? null}
            existingSubmittedAt={userDeliverable?.submitted_at ?? null}
          />

          {/* Admin: all submissions */}
          {isAdmin && allDeliverables && allDeliverables.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                All Submissions ({allDeliverables.length})
              </h3>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(allDeliverables as any[]).map(d => {
                  const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
                  return (
                    <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          {profile?.full_name || profile?.email || 'Unknown'}
                        </p>
                        <a
                          href={d.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block"
                        >
                          {d.link}
                        </a>
                      </div>
                      <span className="text-xs text-muted flex-shrink-0">
                        {new Date(d.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
