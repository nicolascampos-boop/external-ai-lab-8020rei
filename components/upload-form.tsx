'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { uploadMaterial } from '@/lib/actions/materials'
import { CATEGORIES } from '@/lib/supabase/types'

const UPLOAD_CRITERIA = [
  { label: 'CSV or Excel format', key: 'format' },
  { label: 'File size under 50MB', key: 'size' },
  { label: 'Title provided', key: 'title' },
  { label: 'At least one category selected', key: 'category' },
  { label: 'Guidelines provided', key: 'guidelines' },
  { label: 'Columns detected from file', key: 'columns' },
  { label: 'Key topics provided', key: 'headlines' },
  { label: 'Description provided', key: 'description' },
]

export default function UploadForm() {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [guidelines, setGuidelines] = useState('')
  const [columns, setColumns] = useState('')
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [parsingFile, setParsingFile] = useState(false)
  const [headlines, setHeadlines] = useState('')
  const [rowCount, setRowCount] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSetFile(dropped)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) validateAndSetFile(selected)
  }

  async function validateAndSetFile(f: File) {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(f.type) && !['csv', 'xls', 'xlsx'].includes(ext || '')) {
      setError('Only CSV and Excel (.xls, .xlsx) files are allowed.')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB.')
      return
    }
    setError(null)
    setFile(f)

    // Auto-detect columns from the file
    setParsingFile(true)
    try {
      const reader = new FileReader()
      const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(f)
      })
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
      if (rows.length > 0) {
        const headers = (rows[0] as string[])
          .filter(h => h != null && String(h).trim() !== '')
          .map(h => String(h).trim())
        setDetectedColumns(headers)
        setColumns(headers.join(', '))
        setRowCount(rows.length - 1) // subtract header row
      }
    } catch {
      // If parsing fails, user can still type columns manually
      setDetectedColumns([])
    }
    setParsingFile(false)
  }

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  // Criteria check
  const isValidFormat = file !== null
  const isValidSize = file ? file.size <= 50 * 1024 * 1024 : false
  const hasTitle = title.trim().length > 0
  const hasCategory = selectedCategories.length > 0
  const hasDescription = description.trim().length > 0
  const hasGuidelines = guidelines.trim().length > 0
  const hasColumns = columns.trim().length > 0
  const hasHeadlines = headlines.trim().length > 0

  const criteriaStatus: Record<string, boolean> = {
    format: isValidFormat,
    size: isValidSize,
    title: hasTitle,
    category: hasCategory,
    description: hasDescription,
    guidelines: hasGuidelines,
    columns: hasColumns,
    headlines: hasHeadlines,
  }

  const allRequiredMet = isValidFormat && isValidSize && hasTitle && hasCategory && hasGuidelines && hasColumns && hasHeadlines

  async function handleSubmit(formData: FormData) {
    if (!file) {
      setError('Please select a file.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.')
      return
    }
    if (!title.trim()) {
      setError('Please enter a title.')
      return
    }
    if (!guidelines.trim()) {
      setError('Please provide guidelines.')
      return
    }
    if (!columns.trim()) {
      setError('Please list the column names.')
      return
    }
    if (!headlines.trim()) {
      setError('Please provide headlines.')
      return
    }
    setLoading(true)
    setError(null)
    formData.set('file', file)
    formData.set('title', title)
    formData.set('description', description)
    formData.set('categories', JSON.stringify(selectedCategories))
    formData.set('guidelines', guidelines)
    formData.set('columns', columns)
    formData.set('headlines', headlines)
    const result = await uploadMaterial(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const fileSize = file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : ''

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Upload Criteria Checklist */}
      <div className="bg-gray-50 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload Criteria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {UPLOAD_CRITERIA.map(criteria => {
            const met = criteriaStatus[criteria.key]
            return (
              <div key={criteria.key} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  met ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  {met ? (
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
                <span className={`text-sm ${met ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                  {criteria.label}
                  {criteria.key === 'description' && (
                    <span className="text-gray-400 font-normal"> (recommended)</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* File drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : file
              ? 'border-green-300 bg-green-50'
              : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <div>
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-muted mt-1">
              {fileSize}
              {rowCount !== null && ` · ${rowCount} rows`}
              {' · Click to change'}
            </p>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">Drop your file here or click to browse</p>
            <p className="text-sm text-muted mt-1">CSV or Excel (.xls, .xlsx), up to 50MB</p>
          </div>
        )}
      </div>

      {/* Detected columns preview */}
      {parsingFile && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Reading file columns...</p>
        </div>
      )}
      {detectedColumns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-sm font-semibold text-blue-800">
              {detectedColumns.length} columns detected from your file
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {detectedColumns.map((col, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-white text-blue-700 border border-blue-200 rounded-lg font-mono">
                {col}
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            These column headers were read directly from your file&apos;s first row.
          </p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. AI Courses Resources, Prompt Engineering Dataset"
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="e.g. Curated list of AI training resources with ratings, categories, and course stage mappings..."
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      {/* Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Guidelines *</label>
        <textarea
          value={guidelines}
          onChange={e => setGuidelines(e.target.value)}
          rows={4}
          placeholder={"Explain what each column in your file means. For example:\n- Name: The resource title\n- Link: URL to the resource\n- Category: Topic area (e.g. AI Fundamentals, Prompt Engineering)\n- Average: Quality rating from 1-5\n- Stage: Which course week/stage this belongs to"}
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        <p className="text-xs text-muted mt-1">
          Describe what each column means, how the data should be used, and any quality standards reviewers should know about.
        </p>
      </div>

      {/* Columns (auto-filled, editable) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns *
          {detectedColumns.length > 0 && (
            <span className="text-green-600 font-normal ml-2">(auto-detected from file)</span>
          )}
        </label>
        <input
          value={columns}
          onChange={e => setColumns(e.target.value)}
          placeholder={file ? 'No column headers detected - type them manually' : 'Upload a file first to auto-detect columns, or type manually'}
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted mt-1">
          {detectedColumns.length > 0
            ? 'Auto-filled from your file. You can edit if needed.'
            : 'Comma-separated list of column headers in your file (e.g. Name, Link, Category, Rating)'}
        </p>
      </div>

      {/* Key Topics */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Key Topics *</label>
        <input
          value={headlines}
          onChange={e => setHeadlines(e.target.value)}
          placeholder="e.g. AI Fundamentals, Prompt Engineering, Workflow Automation, Agent Development"
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted mt-1">Main topics or subject areas covered in this dataset (comma-separated)</p>
      </div>

      {/* Categories - Multi-select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categories * <span className="text-gray-400 font-normal">(select one or more)</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map(cat => {
            const selected = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                {selected && (
                  <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {cat}
              </button>
            )
          })}
        </div>
        {selectedCategories.length > 0 && (
          <p className="text-xs text-muted mt-2">
            {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          name="tags"
          placeholder="Comma-separated, e.g. GPT, prompting, best-practices"
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !allRequiredMet}
        className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Uploading...' : 'Upload Material'}
      </button>

      {!allRequiredMet && (
        <p className="text-xs text-center text-muted">
          Please complete all required criteria above to enable upload
        </p>
      )}
    </form>
  )
}
