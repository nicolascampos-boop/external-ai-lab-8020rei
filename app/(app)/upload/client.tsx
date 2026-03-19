'use client'

import { useState } from 'react'
import UploadForm from '@/components/upload-form'
import SingleMaterialForm from '@/components/single-material-form'

type Tab = 'single' | 'bulk'

export default function UploadPageClient() {
  const [tab, setTab] = useState<Tab>('single')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Material</h1>
        <p className="text-muted mt-1">Add training resources for the community</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab('single')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'single'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Single Material
        </button>
        <button
          onClick={() => setTab('bulk')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'bulk'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bulk Import (CSV / Excel)
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        {tab === 'single' ? <SingleMaterialForm /> : <UploadForm />}
      </div>
    </div>
  )
}
