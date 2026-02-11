'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface BulkImportProps {
  onImport: (items: Record<string, unknown>[]) => Promise<{ success: boolean; count?: number; error?: unknown }>
  saving: boolean
}

export default function BulkImport({ onImport, saving }: BulkImportProps) {
  const [importData, setImportData] = useState('')
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const downloadTemplate = () => {
    const headers = ['title', 'link', 'content_type', 'primary_topic', 'skill_level', 'tools_covered', 'learning_modality', 'time_investment', 'quality_rating', 'relevance_score', 'status_priority', 'use_case_tags', 'your_notes', 'week_suggested']
    const exampleRow = [
      'Example: AI Fundamentals Guide',
      'https://example.com',
      'Article',
      'AI Fundamentals',
      'Beginner',
      'Claude, GPT-4',
      'Read/Watch',
      '30min',
      '5',
      '5',
      'Core',
      'Learning, Understanding',
      'Great introduction to AI concepts',
      'Week 1',
    ]
    const csv = [
      headers.join(','),
      exampleRow.map(val => `"${val}"`).join(','),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-template.csv'
    a.click()
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const rows: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      if (row.quality_rating) row.quality_rating = parseInt(row.quality_rating as string) || null
      if (row.relevance_score) row.relevance_score = parseInt(row.relevance_score as string) || null

      if (row.title && row.link) {
        rows.push(row)
      }
    }

    return rows
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csvText = event.target?.result as string
      const parsed = parseCSV(csvText)
      if (parsed.length > 0) {
        setImportPreview(parsed)
        setShowPreview(true)
      } else {
        alert('No valid rows found in CSV')
      }
    }
    reader.readAsText(file)
  }

  const handlePasteImport = () => {
    if (!importData.trim()) {
      alert('Please paste CSV data first')
      return
    }

    const parsed = parseCSV(importData)
    if (parsed.length > 0) {
      setImportPreview(parsed)
      setShowPreview(true)
    } else {
      alert('No valid rows found in pasted data')
    }
  }

  const confirmImport = async () => {
    const result = await onImport(importPreview)
    if (result.success) {
      setImportPreview([])
      setShowPreview(false)
      setImportData('')
      alert(`Successfully imported ${result.count} resources!`)
    } else {
      alert('Failed to import resources. Check console for details.')
    }
  }

  const cancelImport = () => {
    setImportPreview([])
    setShowPreview(false)
  }

  if (showPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Preview Import ({importPreview.length} resources)
        </h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>Review carefully:</strong> These {importPreview.length} resources will be added to your library.
          </p>
        </div>

        <div className="max-h-96 overflow-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Week</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {importPreview.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title as string}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.content_type as string}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.primary_topic as string}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.week_suggested as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4">
          <button
            onClick={confirmImport}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {saving ? 'Importing...' : `Confirm Import (${importPreview.length} resources)`}
          </button>
          <button
            onClick={cancelImport}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Import Resources</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-blue-900 mb-3">How to Import Resources</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Step 1:</strong> Download the CSV template to see the exact format required</p>
          <p><strong>Step 2:</strong> Fill in your resources following the column headers</p>
          <p><strong>Step 3:</strong> Upload the CSV file or paste the data below</p>
          <p><strong>Step 4:</strong> Review the preview and confirm import</p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          <Download className="w-5 h-5" />
          Download CSV Template
        </button>
        <p className="text-sm text-gray-600 mt-2">Get a template with correct headers and an example row</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Required Column Headers:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">1. <code className="bg-gray-200 px-2 py-1 rounded">title</code></p>
            <p className="text-gray-600 ml-4">Resource name (required)</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">2. <code className="bg-gray-200 px-2 py-1 rounded">link</code></p>
            <p className="text-gray-600 ml-4">Full URL (required)</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">3. <code className="bg-gray-200 px-2 py-1 rounded">content_type</code></p>
            <p className="text-gray-600 ml-4">Article, Video, Tutorial, etc.</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">4. <code className="bg-gray-200 px-2 py-1 rounded">primary_topic</code></p>
            <p className="text-gray-600 ml-4">AI Fundamentals, Prompt Engineering, etc.</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">5. <code className="bg-gray-200 px-2 py-1 rounded">skill_level</code></p>
            <p className="text-gray-600 ml-4">Beginner, Intermediate, Advanced</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">6. <code className="bg-gray-200 px-2 py-1 rounded">week_suggested</code></p>
            <p className="text-gray-600 ml-4">Week 1-6, Ongoing, Optional</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Option 1: Upload CSV File</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-3">Option 2: Paste CSV Data</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="w-full h-48 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 bg-white"
            placeholder="Paste your CSV data here (including headers)..."
          />
          <button
            onClick={handlePasteImport}
            disabled={!importData.trim()}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Preview Import
          </button>
        </div>
      </div>
    </div>
  )
}
