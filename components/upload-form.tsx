'use client'

import { useState, useRef } from 'react'
import { uploadMaterial } from '@/lib/actions/materials'
import { CATEGORIES } from '@/lib/supabase/types'

const UPLOAD_CRITERIA = [
  { label: 'CSV or Excel format', key: 'format' },
  { label: 'File size under 50MB', key: 'size' },
  { label: 'Title provided', key: 'title' },
  { label: 'At least one category selected', key: 'category' },
  { label: 'Guidelines provided', key: 'guidelines' },
  { label: 'Column names listed', key: 'columns' },
  { label: 'Headlines provided', key: 'headlines' },
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
  const [headlines, setHeadlines] = useState('')
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

  function validateAndSetFile(f: File) {
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
            <p className="text-sm text-muted mt-1">{fileSize} &middot; Click to change</p>
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

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. Customer Support Agent Training Data"
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
          placeholder="Brief description of the material content..."
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      {/* Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Guidelines *</label>
        <textarea
          value={guidelines}
          onChange={e => setGuidelines(e.target.value)}
          rows={3}
          placeholder="Describe the purpose, rules, and quality standards for this training data..."
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        <p className="text-xs text-muted mt-1">What should reviewers know about how this data should be used?</p>
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Columns *</label>
        <input
          value={columns}
          onChange={e => setColumns(e.target.value)}
          placeholder="Comma-separated, e.g. prompt, response, context, rating"
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted mt-1">List the column names/headers in your file</p>
      </div>

      {/* Headlines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Headlines *</label>
        <input
          value={headlines}
          onChange={e => setHeadlines(e.target.value)}
          placeholder="Comma-separated, e.g. Main topic, Key findings, Methodology"
          className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted mt-1">Key headlines or topics covered in this dataset</p>
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
