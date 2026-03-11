'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteUser, updateUserRole, createMissingProfile } from '@/lib/actions/profiles'
import type { OrphanedUser } from '@/lib/actions/profiles'
import type { Profile, MaterialWithScores } from '@/lib/supabase/types'
import { WEEKS } from '@/lib/supabase/types'

interface ProgressRawData {
  materials: { id: string; week: string | null; material_tier: string | null; title?: string | null }[]
  votes: { user_id: string; material_id: string; comment: string | null; quality_score: number; relevance_score: number }[]
  deliverables: { user_id: string; week: string; link: string | null; notes: string | null; submitted_at: string }[]
  sessions: { week: string; title: string; link: string; session_type: string }[]
}

interface ViewRecord {
  user_id: string
  material_id: string
  material_week: string | null
  source: string
  viewed_at: string
}

interface AdminPanelProps {
  users: Profile[]
  materials: MaterialWithScores[]
  orphanedUsers: OrphanedUser[]
  progressData: ProgressRawData
  engagementData: { views: ViewRecord[] }
}

export default function AdminPanel({ users, materials, orphanedUsers, progressData, engagementData }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'materials' | 'progress'>('users')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-white shadow text-gray-900' : 'text-muted hover:text-gray-700'
          }`}
        >
          Users ({users.length})
          {orphanedUsers.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {orphanedUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('materials')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'materials' ? 'bg-white shadow text-gray-900' : 'text-muted hover:text-gray-700'
          }`}
        >
          Materials ({materials.length})
        </button>
        <button
          onClick={() => setTab('progress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'progress' ? 'bg-white shadow text-gray-900' : 'text-muted hover:text-gray-700'
          }`}
        >
          Progress
        </button>
      </div>

      {tab === 'users' ? (
        <UsersTable users={users} orphanedUsers={orphanedUsers} />
      ) : tab === 'materials' ? (
        <MaterialsTable materials={materials} />
      ) : (
        <UnifiedProgressView users={users} progressData={progressData} views={engagementData.views} />
      )}
    </div>
  )
}

function UsersTable({ users, orphanedUsers }: { users: Profile[]; orphanedUsers: OrphanedUser[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setLoadingId(userId + '-role')
    setError(null)
    const result = await updateUserRole(userId, newRole)
    setLoadingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setLoadingId(deleteTarget.id + '-delete')
    setError(null)
    const result = await deleteUser(deleteTarget.id)
    setLoadingId(null)
    setDeleteTarget(null)
    setDeleteInput('')
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  async function handleCreateProfile(u: OrphanedUser) {
    setLoadingId(u.id + '-fix')
    setError(null)
    const result = await createMissingProfile(u.id, u.email, u.full_name)
    setLoadingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-border w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete user</h3>
                <p className="text-sm text-muted mt-0.5">
                  This will permanently remove <span className="font-medium text-gray-800">{deleteTarget.email}</span> and all their data. This cannot be undone.
                </p>
              </div>
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">{deleteTarget.email}</span> to confirm
            </label>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && deleteInput === deleteTarget.email) confirmDelete() }}
              placeholder={deleteTarget.email}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteInput('') }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteInput !== deleteTarget.email || !!loadingId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loadingId ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orphaned users — registered in auth but missing a profile */}
      {orphanedUsers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="text-sm font-semibold text-amber-800">
              {orphanedUsers.length} registered {orphanedUsers.length === 1 ? 'user' : 'users'} without a profile
            </span>
            <span className="text-xs text-amber-600">— these users signed up but don&apos;t appear in the dashboard</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-amber-200">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-amber-700 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-amber-700 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-amber-700 uppercase tracking-wider">Registered</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-amber-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {orphanedUsers.map(u => (
                <tr key={u.id} className="hover:bg-amber-100/40">
                  <td className="px-5 py-3 text-sm text-gray-800">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-muted">{u.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCreateProfile(u)}
                        disabled={!!loadingId}
                        className="text-xs text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50 border border-amber-300 hover:border-amber-500 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {loadingId === u.id + '-fix' ? 'Creating...' : 'Create profile'}
                      </button>
                      <button
                        onClick={() => { setDeleteTarget({ id: u.id, email: u.email }); setDeleteInput('') }}
                        disabled={!!loadingId}
                        className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Last Login</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {user.full_name || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-muted">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-sm text-muted">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString() + ' ' + new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={loadingId === user.id + '-role'}
                      className="text-xs text-primary hover:text-primary-dark font-medium disabled:opacity-50"
                    >
                      {loadingId === user.id + '-role' ? 'Saving...' : `Make ${user.role === 'admin' ? 'User' : 'Admin'}`}
                    </button>
                    <button
                      onClick={() => { setDeleteTarget({ id: user.id, email: user.email }); setDeleteInput('') }}
                      disabled={!!loadingId}
                      className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {loadingId === user.id + '-delete' ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MaterialsTable({ materials }: { materials: MaterialWithScores[] }) {
  const router = useRouter()

  async function handleDelete(materialId: string) {
    if (!confirm('Are you sure you want to delete this material?')) return
    const supabase = createClient()
    await supabase.from('materials').delete().eq('id', materialId)
    router.refresh()
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Title</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Categories</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Score</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Votes</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Uploaded</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {materials.map(mat => (
            <tr key={mat.id} className="hover:bg-gray-50/50">
              <td className="px-5 py-3">
                <span className="text-sm font-medium text-gray-900">{mat.title}</span>
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {(mat.categories || []).slice(0, 2).map(cat => (
                    <span key={cat} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {cat}
                    </span>
                  ))}
                  {(mat.categories || []).length > 2 && (
                    <span className="text-xs text-muted">+{mat.categories.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3 text-sm text-muted">
                {mat.vote_count > 0 ? mat.avg_overall.toFixed(1) : '—'}
              </td>
              <td className="px-5 py-3 text-sm text-muted">{mat.vote_count}</td>
              <td className="px-5 py-3 text-sm text-muted">
                {new Date(mat.created_at).toLocaleDateString()}
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => handleDelete(mat.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {materials.length === 0 && (
        <div className="p-8 text-center text-muted text-sm">No materials yet.</div>
      )}
    </div>
  )
}

// ─── Unified Progress View ────────────────────────────────────────────────────

function normalizeTier(tier: string | null | undefined): string {
  if (!tier) return ''
  return tier.toLowerCase().replace(/[\s_-]+/g, '')
}

function tierLabel(tier: string | null | undefined): string {
  const t = normalizeTier(tier)
  if (t === 'mustread') return 'Must Read'
  if (t === 'core') return 'Core'
  return tier || ''
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  weekly: 'Weekly Session',
  team: 'Team Session',
  speaker: 'Speaker Session',
}

function UnifiedProgressView({
  users,
  progressData,
  views,
}: {
  users: Profile[]
  progressData: ProgressRawData
  views: ViewRecord[]
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Required materials per week (Must Read / Core only)
  const weekRequiredMaterials: Record<string, typeof progressData.materials> = {}
  for (const week of WEEKS) {
    const mats = progressData.materials.filter(m => {
      if (m.week !== week) return false
      const t = normalizeTier(m.material_tier)
      return t === 'mustread' || t === 'core'
    })
    if (mats.length > 0) weekRequiredMaterials[week] = mats
  }
  const activeWeeks = Object.keys(weekRequiredMaterials)

  // Sessions grouped by week
  const weekSessions: Record<string, typeof progressData.sessions> = {}
  progressData.sessions.forEach(s => {
    if (!weekSessions[s.week]) weekSessions[s.week] = []
    weekSessions[s.week].push(s)
  })

  // Members only
  const members = users.filter(u => u.role !== 'admin')

  // Build per-user lookup maps
  const userViewsMap: Record<string, ViewRecord[]> = {}
  views.forEach(v => {
    if (!userViewsMap[v.user_id]) userViewsMap[v.user_id] = []
    userViewsMap[v.user_id].push(v)
  })

  const userVotesMap: Record<string, typeof progressData.votes> = {}
  progressData.votes.forEach(v => {
    if (!userVotesMap[v.user_id]) userVotesMap[v.user_id] = []
    userVotesMap[v.user_id].push(v)
  })

  const userDeliverablesMap: Record<string, Record<string, typeof progressData.deliverables[0]>> = {}
  progressData.deliverables.forEach(d => {
    if (!userDeliverablesMap[d.user_id]) userDeliverablesMap[d.user_id] = {}
    userDeliverablesMap[d.user_id][d.week] = d
  })

  // Per-user, per-week: how many required materials opened, scored, commented
  type UserWeekStats = {
    opened: number
    scored: number
    commented: number
    total: number
    delivered: boolean
    deliverableLink: string | null
    deliverableDate: string | null
  }

  function getUserWeekStats(userId: string, week: string): UserWeekStats {
    const required = weekRequiredMaterials[week] || []
    const requiredIds = new Set(required.map(m => m.id))
    const uViews = userViewsMap[userId] || []
    const uVotes = userVotesMap[userId] || []
    const deliverable = userDeliverablesMap[userId]?.[week]

    const openedIds = new Set(uViews.filter(v => requiredIds.has(v.material_id)).map(v => v.material_id))
    const scoredIds = new Set(uVotes.filter(v => requiredIds.has(v.material_id)).map(v => v.material_id))
    const commentedIds = new Set(
      uVotes.filter(v => requiredIds.has(v.material_id) && v.comment && v.comment.trim() !== '').map(v => v.material_id)
    )

    return {
      opened: openedIds.size,
      scored: scoredIds.size,
      commented: commentedIds.size,
      total: required.length,
      delivered: !!deliverable,
      deliverableLink: deliverable?.link || null,
      deliverableDate: deliverable?.submitted_at || null,
    }
  }

  // Per-material detail for a user in a week
  function getMaterialDetail(userId: string, materialId: string) {
    const uViews = (userViewsMap[userId] || []).filter(v => v.material_id === materialId)
    const uVote = (userVotesMap[userId] || []).find(v => v.material_id === materialId)
    const viewCount = uViews.length
    const firstView = uViews.length > 0
      ? uViews.reduce((min, v) => new Date(v.viewed_at) < new Date(min.viewed_at) ? v : min)
      : null
    const lastView = uViews.length > 1
      ? uViews.reduce((max, v) => new Date(v.viewed_at) > new Date(max.viewed_at) ? v : max)
      : null
    const reopened = viewCount > 1

    return { viewCount, firstView, lastView, reopened, vote: uVote || null }
  }

  // ─── Aggregate metrics ──────────────────────────────────────────────────────

  // Overall progress based on materials opened (the most meaningful metric)
  let totalRequired = 0
  let totalOpened = 0
  let totalScored = 0
  let totalCommented = 0
  let totalDelivered = 0

  const weekStats: Record<string, { avgOpened: number; scoredMembers: number; commentedMembers: number; deliveredMembers: number }> = {}

  activeWeeks.forEach(week => {
    const requiredCount = weekRequiredMaterials[week].length
    let weekOpened = 0
    let weekScored = 0
    let weekCommented = 0
    let weekDelivered = 0

    members.forEach(user => {
      const stats = getUserWeekStats(user.id, week)
      totalRequired += stats.total
      totalOpened += stats.opened
      totalScored += stats.scored
      totalCommented += stats.commented
      if (stats.delivered) totalDelivered++

      weekOpened += stats.opened
      if (stats.scored > 0) weekScored++
      if (stats.commented > 0) weekCommented++
      if (stats.delivered) weekDelivered++
    })

    weekStats[week] = {
      avgOpened: members.length > 0 ? weekOpened / members.length : 0,
      scoredMembers: weekScored,
      commentedMembers: weekCommented,
      deliveredMembers: weekDelivered,
    }
  })

  const overallPct = totalRequired > 0 ? Math.round((totalOpened / totalRequired) * 100) : 0
  const avgReadsPerWeek = (members.length > 0 && activeWeeks.length > 0)
    ? (totalOpened / members.length / activeWeeks.length).toFixed(1)
    : '0'

  // Most engaged user = highest total (opened + scored + commented + deliverables)
  let mostEngagedName = '—'
  let mostEngagedScore = 0
  members.forEach(user => {
    let score = 0
    activeWeeks.forEach(week => {
      const s = getUserWeekStats(user.id, week)
      score += s.opened + s.scored + s.commented + (s.delivered ? 1 : 0)
    })
    if (score > mostEngagedScore) {
      mostEngagedScore = score
      mostEngagedName = user.full_name || user.email
    }
  })

  // Fully complete = all required materials opened + scored + deliverable submitted per week
  let fullyComplete = 0
  members.forEach(user => {
    const allDone = activeWeeks.every(week => {
      const s = getUserWeekStats(user.id, week)
      return s.opened === s.total && s.scored === s.total && s.delivered
    })
    if (allDone) fullyComplete++
  })

  // Per-user overall progress (materials opened / total required)
  function getUserOverallPct(userId: string) {
    let opened = 0
    let total = 0
    activeWeeks.forEach(week => {
      const s = getUserWeekStats(userId, week)
      opened += s.opened
      total += s.total
    })
    return total > 0 ? Math.round((opened / total) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Overall Progress</p>
          <p className="text-2xl font-bold text-gray-900">{overallPct}%</p>
          <p className="text-xs text-muted mt-0.5">materials opened</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Avg. Reads / Week</p>
          <p className="text-2xl font-bold text-gray-900">{avgReadsPerWeek}</p>
          <p className="text-xs text-muted mt-0.5">per member per week</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Most Engaged</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{mostEngagedName}</p>
          {mostEngagedScore > 0 && <p className="text-xs text-muted mt-0.5">{mostEngagedScore} total actions</p>}
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Fully Complete</p>
          <p className="text-2xl font-bold text-gray-900">{fullyComplete} <span className="text-sm font-normal text-muted">of {members.length}</span></p>
        </div>
      </div>

      {/* Week Engagement — material-level detail per week */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Week Engagement</h3>
        <p className="text-xs text-muted mb-4">How members are engaging with required materials each week</p>
        {activeWeeks.length === 0 ? (
          <p className="text-sm text-muted">No weeks with required materials yet.</p>
        ) : (
          <div className="space-y-3">
            {activeWeeks.map(week => {
              const required = weekRequiredMaterials[week]
              const ws = weekStats[week]
              const sessions = weekSessions[week] || []
              const openedPct = members.length > 0 && required.length > 0
                ? Math.round((ws.avgOpened / required.length) * 100)
                : 0

              return (
                <div key={week} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{week}</span>
                      <span className="text-xs text-muted ml-2">{required.length} required materials</span>
                      {sessions.length > 0 && (
                        <span className="text-xs text-muted ml-2">· {sessions.length} session{sessions.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      openedPct >= 75 ? 'bg-green-100 text-green-700'
                        : openedPct >= 40 ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>{openedPct}% avg opened</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        openedPct >= 75 ? 'bg-green-500' : openedPct >= 40 ? 'bg-amber-400' : 'bg-gray-300'
                      }`}
                      style={{ width: `${openedPct}%` }}
                    />
                  </div>
                  {/* Detail chips */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{ws.avgOpened.toFixed(1)}/{required.length} avg materials opened</span>
                    <span>{ws.scoredMembers}/{members.length} members scored</span>
                    <span>{ws.commentedMembers}/{members.length} commented</span>
                    <span>{ws.deliveredMembers}/{members.length} delivered</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Individual Progress — material-level detail */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Individual Progress</h3>
          <p className="text-xs text-muted">Click a member to see which materials they opened, scored, commented on, and delivered</p>
        </div>

        {members.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">No members yet.</div>
        )}

        <div className="divide-y divide-border">
          {members.map(user => {
            const overallPctUser = getUserOverallPct(user.id)
            const isExpanded = expandedUser === user.id

            return (
              <div key={user.id}>
                {/* Collapsed row */}
                <div
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || '—'}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>

                  {/* Mini week dots — show materials opened count */}
                  <div className="hidden sm:flex items-center gap-1">
                    {activeWeeks.map(week => {
                      const s = getUserWeekStats(user.id, week)
                      const bg = s.opened === s.total && s.total > 0
                        ? 'bg-green-500'
                        : s.opened > 0
                          ? 'bg-amber-400'
                          : 'bg-gray-200'
                      return (
                        <div
                          key={week}
                          className={`w-5 h-5 rounded ${bg} flex items-center justify-center`}
                          title={`${week}: ${s.opened}/${s.total} opened`}
                        >
                          <span className="text-[9px] font-bold text-white">{s.opened}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 w-28">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overallPctUser === 100 ? 'bg-green-500' : overallPctUser > 0 ? 'bg-primary' : 'bg-gray-200'
                        }`}
                        style={{ width: `${overallPctUser}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8 text-right">{overallPctUser}%</span>
                  </div>

                  <svg
                    className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded: per-week material-level detail */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-border px-5 py-4 space-y-4">
                    {activeWeeks.map(week => {
                      const required = weekRequiredMaterials[week]
                      const stats = getUserWeekStats(user.id, week)
                      const sessions = weekSessions[week] || []
                      const deliverable = userDeliverablesMap[user.id]?.[week]

                      return (
                        <div key={week} className="rounded-lg border border-gray-200 bg-white">
                          {/* Week header */}
                          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-900">{week}</span>
                              <span className="text-xs text-muted">{stats.opened}/{stats.total} opened · {stats.scored}/{stats.total} scored · {stats.commented}/{stats.total} commented</span>
                            </div>
                            {stats.opened === stats.total && stats.total > 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">All Read</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{Math.round((stats.opened / stats.total) * 100)}%</span>
                            )}
                          </div>

                          {/* Material list */}
                          <div className="divide-y divide-gray-50">
                            {required.map(mat => {
                              const detail = getMaterialDetail(user.id, mat.id)
                              return (
                                <div key={mat.id} className="px-4 py-2.5 flex items-start gap-3">
                                  {/* Status dot */}
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                    detail.viewCount > 0 ? 'bg-green-500' : 'bg-gray-300'
                                  }`} />
                                  {/* Material info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${detail.viewCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                      {mat.title || mat.id}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                      {/* Tier */}
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        normalizeTier(mat.material_tier) === 'mustread'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>{tierLabel(mat.material_tier)}</span>

                                      {/* View info */}
                                      {detail.viewCount > 0 ? (
                                        <span className="text-[10px] text-muted">
                                          {detail.viewCount} view{detail.viewCount > 1 ? 's' : ''}
                                          {detail.firstView && (
                                            <> · first {new Date(detail.firstView.viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                          )}
                                          {detail.reopened && detail.lastView && (
                                            <> · reopened {new Date(detail.lastView.viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">Not opened</span>
                                      )}

                                      {/* Score */}
                                      {detail.vote ? (
                                        <span className="text-[10px] text-purple-600">
                                          Score: {((detail.vote.quality_score + detail.vote.relevance_score) / 2).toFixed(1)}/5
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">No score</span>
                                      )}

                                      {/* Comment */}
                                      {detail.vote?.comment && detail.vote.comment.trim() !== '' ? (
                                        <span className="text-[10px] text-amber-600">Commented</span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">No comment</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Deliverable + Sessions footer */}
                          <div className="px-4 py-2.5 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
                            {deliverable ? (
                              <span className="text-xs text-green-700">
                                Delivered {new Date(deliverable.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {deliverable.link && (
                                  <a href={deliverable.link} target="_blank" rel="noopener noreferrer" className="ml-1 underline hover:text-green-900">Link</a>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Deliverable pending</span>
                            )}
                            {sessions.length > 0 ? (
                              <span className="text-xs text-muted">
                                Sessions: {sessions.map(s => SESSION_TYPE_LABEL[s.session_type] || s.title).join(', ')}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">No sessions</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
