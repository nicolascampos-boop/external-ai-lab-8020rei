'use client'

import { useResources } from '@/hooks/useResources'
import { useUser } from '@/hooks/useUser'
import ResourceList from '@/components/resources/ResourceList'

export default function WeeklyPage() {
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    editingId,
    editForm,
    setEditForm,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    saving,
    loading,
  } = useResources()

  const { isAdmin } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-700">Loading resources...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Session Plans</h1>
        <p className="text-gray-600">Browse and filter all resources</p>
      </div>

      <ResourceList
        filteredData={filteredData}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        editingId={editingId}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onDelete={deleteItem}
        saving={saving}
        isAdmin={isAdmin}
      />
    </div>
  )
}
