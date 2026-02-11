'use client'

import { useRouter } from 'next/navigation'
import { useResources } from '@/hooks/useResources'
import { useUser } from '@/hooks/useUser'
import { useActivityLogger } from '@/hooks/useActivityLogger'
import AddResourceForm from '@/components/resources/AddResourceForm'
import { useEffect } from 'react'

export default function AddContentPage() {
  const router = useRouter()
  const { newItem, setNewItem, addNewItem, saving } = useResources()
  const { user, isAdmin, loading: userLoading } = useUser()
  const { logActivity } = useActivityLogger()

  useEffect(() => {
    if (!userLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [userLoading, isAdmin, router])

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-700">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const handleSubmit = async () => {
    const result = await addNewItem(user?.id)
    if (result.success && result.data) {
      await logActivity('add', result.data.id)
      router.push('/dashboard')
    } else {
      alert('Failed to add resource. Check console for details.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Content</h1>
        <p className="text-gray-600">Add a new resource to the library</p>
      </div>

      <AddResourceForm
        newItem={newItem}
        onNewItemChange={setNewItem}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/dashboard')}
        saving={saving}
      />
    </div>
  )
}
