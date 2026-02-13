'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MaterialCard from '@/components/material-card'
import { bulkDeleteMaterials } from '@/lib/actions/materials'
import type { MaterialWithScores } from '@/lib/supabase/types'

interface MaterialListProps {
  materials: MaterialWithScores[]
  isAdmin: boolean
}

export default function MaterialList({ materials, isAdmin }: MaterialListProps) {
  const router = useRouter()
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === materials.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(materials.map(m => m.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
    setError(null)
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selected.size} material${selected.size === 1 ? '' : 's'}? This cannot be undone.`
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)

    const result = await bulkDeleteMaterials(Array.from(selected))

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSelected(new Set())
      setSelectMode(false)
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div>
      {/* Action bar */}
      {isAdmin && (
        <div className="flex items-center justify-between mb-4">
          {selectMode ? (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                {selected.size === materials.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-muted">
                {selected.size} selected
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {selectMode && selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {loading ? 'Deleting...' : `Delete ${selected.size}`}
              </button>
            )}
            <button
              onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectMode
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {selectMode ? (
                'Cancel'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Manage
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Material cards */}
      <div className="space-y-3">
        {materials.map(material => (
          <MaterialCard
            key={material.id}
            material={material}
            selectable={selectMode}
            selected={selected.has(material.id)}
            onToggle={toggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
