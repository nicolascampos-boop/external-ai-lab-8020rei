'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, MaterialWithScores } from '@/lib/supabase/types'

interface AdminPanelProps {
  users: Profile[]
  materials: MaterialWithScores[]
}

export default function AdminPanel({ users, materials }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'materials'>('users')

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
      </div>

      {tab === 'users' ? (
        <UsersTable users={users} />
      ) : (
        <MaterialsTable materials={materials} />
      )}
    </div>
  )
}

function UsersTable({ users }: { users: Profile[] }) {
  const router = useRouter()

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    router.refresh()
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">User</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Email</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Role</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Joined</th>
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
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => toggleRole(user.id, user.role)}
                  className="text-xs text-primary hover:text-primary-dark font-medium"
                >
                  Make {user.role === 'admin' ? 'User' : 'Admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
