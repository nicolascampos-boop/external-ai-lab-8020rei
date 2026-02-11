'use client'

import { useRouter } from 'next/navigation'
import { useResources } from '@/hooks/useResources'
import { useUser } from '@/hooks/useUser'
import BulkImport from '@/components/resources/BulkImport'
import { useEffect } from 'react'

export default function ImportPage() {
  const router = useRouter()
  const { bulkImport, saving } = useResources()
  const { isAdmin, loading: userLoading } = useUser()

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-600">Import multiple resources from CSV</p>
      </div>

      <BulkImport onImport={bulkImport} saving={saving} />
    </div>
  )
}
