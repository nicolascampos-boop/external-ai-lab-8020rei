'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteUser, updateUserRole } from '@/lib/actions/profiles'
import type { Profile, MaterialWithScores } from '@/lib/supabase/types'
import { WEEKS } from '@/lib/supabase/types'

interface ProgressRawData {
  materials: { id: string; week: string | null; material_tier: string | null }[]
  votes: { user_id: string; material_id: string; comment: string | null }[]
  deliverables: { user_id: string; week: string }[]
}

interface AdminPanelProps {
  users: Profile[]
  materials: MaterialWithScores[]
  progressData: ProgressRawData
}

export default function AdminPanel({ users, materials, progressData }: AdminPanelProps) {
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
        <UsersTable users={users} />
      ) : tab === 'materials' ? (
        <MaterialsTable materials={materials} />
      ) : (
        <UserProgressView users={users} progressData={progressData} />
      )}
    </div>
  )
}

function UsersTable({ users }: { users: Profile[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) return
    setLoadingId(userId + '-delete')
    setError(null)
    const result = await deleteUser(userId)
    setLoadingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
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
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={loadingId === user.id + '-delete'}
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

// ─── User Progress View ────────────────────────────────────────────────────────

interface WeekStat {
  week: string
  total: number
  reviewed: number
  hasDeliverable: boolean
  pct: number
  complete: boolean
}

function normalizeTier(tier: string | null | undefined): string {
  if (!tier) return ''
  return tier.toLowerCase().replace(/[\s_-]+/g, '')
}

function UserProgressView({ users, progressData }: { users: Profile[]; progressData: ProgressRawData }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Pre-compute required materials per week (shared across all users)
  const weekRequiredMaterials: Record<string, string[]> = {}
  for (const week of WEEKS) {
    weekRequiredMaterials[week] = progressData.materials
      .filter(m => {
        if (m.week !== week) return false
        const t = normalizeTier(m.material_tier)
        return t === 'mustread' || t === 'core'
      })
      .map(m => m.id)
  }

  // Compute progress for each user
  const userProgress = users.map(user => {
    const reviewedIds = new Set(
      progressData.votes
        .filter(v => v.user_id === user.id)
        .map(v => v.material_id)
    )
    const deliverableWeeks = new Set(
      progressData.deliverables
        .filter(d => d.user_id === user.id)
        .map(d => d.week)
    )

    const weekStats = WEEKS
      .map(week => {
        const required = weekRequiredMaterials[week]
        const total = required.length
        if (total === 0) return null
        const reviewed = required.filter(id => reviewedIds.has(id)).length
        const hasDeliverable = deliverableWeeks.has(week)
        const pct = Math.round((reviewed / total) * 60 + (hasDeliverable ? 40 : 0))
        const complete = reviewed === total && hasDeliverable
        return { week, total, reviewed, hasDeliverable, pct, complete }
      })
      .filter((s) => s !== null) as WeekStat[]

    const overallPct = weekStats.length > 0
      ? Math.round(weekStats.reduce((sum, w) => sum + w.pct, 0) / weekStats.length)
      : 0
    const weeksComplete = weekStats.filter(w => w.complete).length

    return { user, weekStats, overallPct, weeksComplete }
  })

  return (
    <div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Member</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Weeks Done</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Overall Progress</th>
              <th className="px-5 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {userProgress.map(({ user, weekStats, overallPct, weeksComplete }) => (
              <tr key={user.id} className="cursor-pointer" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                <td className="px-5 py-3" colSpan={expandedUser === user.id ? undefined : undefined}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name || '—'}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  {/* Per-week progress — shown inline when expanded */}
                  {expandedUser === user.id && weekStats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4 mb-1">
                      {weekStats.map(stat => (
                        <div
                          key={stat.week}
                          className={`rounded-lg border p-3 ${stat.complete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-800">{stat.week}</span>
                            {stat.complete
                              ? <span className="text-xs text-green-600 font-medium">✓ Done</span>
                              : <span className="text-xs text-gray-500">{stat.pct}%</span>
                            }
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${stat.complete ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${stat.pct}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{stat.reviewed}/{stat.total} reviewed</span>
                            <span className="text-gray-300">·</span>
                            <span className={stat.hasDeliverable ? 'text-green-600' : 'text-gray-400'}>
                              {stat.hasDeliverable ? '✓ deliverable' : 'deliverable pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 align-top">
                  <span className="text-sm text-gray-900">{weeksComplete}/{weekStats.length}</span>
                </td>
                <td className="px-5 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[6rem]">
                      <div
                        className={`h-2 rounded-full transition-all ${overallPct === 100 ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8 text-right">{overallPct}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 align-top text-right">
                  <svg
                    className={`w-4 h-4 text-muted transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">No users yet.</div>
        )}
      </div>
    </div>
  )
}
