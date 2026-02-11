'use client'

import ResourceCard from './ResourceCard'
import ResourceFilters from './ResourceFilters'
import type { Database } from '@/lib/supabase/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

interface Filters {
  contentType: string
  primaryTopic: string
  skillLevel: string
  weekSuggested: string
  statusPriority: string
}

interface ResourceListProps {
  filteredData: Resource[]
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  editingId: number | null
  editForm: Resource | null
  onEditFormChange: (form: Resource) => void
  onStartEdit: (item: Resource) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (id: number) => void
  saving: boolean
  isAdmin: boolean
}

export default function ResourceList({
  filteredData,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  editingId,
  editForm,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  saving,
  isAdmin,
}: ResourceListProps) {
  return (
    <div className="space-y-6">
      <ResourceFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <div className="grid gap-4">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No resources found matching your criteria.</p>
          </div>
        ) : (
          filteredData.map(item => (
            <ResourceCard
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editForm={editingId === item.id ? editForm : null}
              onEditFormChange={onEditFormChange}
              onStartEdit={() => onStartEdit(item)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this item?')) {
                  onDelete(item.id)
                }
              }}
              saving={saving}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>
    </div>
  )
}
