'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { uploadMaterials, type ParsedMaterial } from '@/lib/actions/materials'
import { CONTENT_TYPES } from '@/lib/supabase/types'

// Normalize week/stage values to "Week 1", "Week 2", etc.
function normalizeWeek(raw: string): string {
  const s = raw.toLowerCase().trim()
  if (!s) return ''
  if (s.includes('optional') || s.includes('extra') || s.includes('bonus')) return 'Optional'
  if (s.includes('1') || s.includes('first') || s.includes('one')) return 'Week 1'
  if (s.includes('2') || s.includes('second') || s.includes('two')) return 'Week 2'
  if (s.includes('3') || s.includes('third') || s.includes('three')) return 'Week 3'
  if (s.includes('4') || s.includes('fourth') || s.includes('four')) return 'Week 4'
  // If it already says "Week X", return as-is
  if (s.startsWith('week')) return raw.trim()
  return raw.trim()
}

// Fix encoding artifacts from files saved with mixed encodings
function cleanText(val: unknown): string {
  if (val == null) return ''
  let str = String(val).trim()
  // Fix common UTF-8 mojibake from Windows-1252 encoded files
  str = str.replace(/â€"/g, '—')
  str = str.replace(/â€"/g, '–')
  str = str.replace(/â€™/g, '\u2019')
  str = str.replace(/â€˜/g, '\u2018')
  str = str.replace(/â€œ/g, '\u201C')
  // Fix standalone â between numbers (usually an en-dash)
  str = str.replace(/(\d)\s*â\s*(\d)/g, '$1–$2')
  return str
}

// Material fields that can be mapped from file columns
const MATERIAL_FIELDS = [
  { key: 'title', label: 'Name', required: true, keywords: ['name', 'title', 'resource', 'material'] },
  { key: 'link', label: 'Link', required: true, keywords: ['link', 'url', 'href', 'website'] },
  { key: 'description', label: 'Description', required: true, keywords: ['description', 'desc', 'small description', 'summary', 'about'] },
  { key: 'content_type', label: 'Content Type', required: false, keywords: ['content type', 'type', 'format', 'content_type', 'contenttype'] },
  { key: 'categories', label: 'Category', required: true, keywords: ['category', 'categories', 'topic', 'topics'] },
  { key: 'quality', label: 'Quality Score', required: false, keywords: ['quality', 'quality score'] },
  { key: 'relevance', label: 'Relevance Score', required: false, keywords: ['relevance', 'relevance score'] },
  { key: 'score', label: 'Average Score', required: false, keywords: ['score', 'rating', 'average', 'avg', 'average score', 'imported score', 'total score'] },
  { key: 'week', label: 'Week', required: false, keywords: ['week', 'stage', 'course creation', 'module', 'phase'] },
  { key: 'estimated_time', label: 'Estimated Time', required: false, keywords: ['estimated time', 'time', 'duration', 'estimated_time', 'time investment'] },
] as const

type FieldKey = (typeof MATERIAL_FIELDS)[number]['key']

function autoMapColumns(headers: string[]): Record<FieldKey, number | null> {
  const mapping: Record<string, number | null> = {}
  const used = new Set<number>()

  for (const field of MATERIAL_FIELDS) {
    mapping[field.key] = null
    const headerLower = headers.map(h => h.toLowerCase())

    for (const keyword of field.keywords) {
      const idx = headerLower.findIndex((h, i) => !used.has(i) && h.includes(keyword))
      if (idx !== -1) {
        mapping[field.key] = idx
        used.add(idx)
        break
      }
    }
  }

  return mapping as Record<FieldKey, number | null>
}

function parseRowsToMaterials(
  rows: unknown[][],
  mapping: Record<FieldKey, number | null>
): { valid: ParsedMaterial[]; skipped: number } {
  let skipped = 0
  const valid = rows
    .map(row => {
      const get = (key: FieldKey): string => {
        const idx = mapping[key]
        if (idx === null || idx === undefined) return ''
        const val = row[idx]
        return val != null ? cleanText(val) : ''
      }

      const title = get('title')
      if (!title) { skipped++; return null }

      const link = get('link')
      const description = get('description')
      const categoryRaw = get('categories')
      const categories = categoryRaw
        ? categoryRaw.split(',').map(c => c.trim()).filter(Boolean)
        : []

      // Parse scores - prioritize quality + relevance, fallback to average score
      let initial_score: number | undefined
      let initial_quality: number | undefined
      let initial_relevance: number | undefined

      const qualityRaw = get('quality')
      const relevanceRaw = get('relevance')
      const scoreRaw = get('score')

      // If both quality and relevance are provided, store them separately
      if (qualityRaw && relevanceRaw) {
        const quality = parseFloat(qualityRaw)
        const relevance = parseFloat(relevanceRaw)
        if (!isNaN(quality) && !isNaN(relevance) && quality >= 0 && quality <= 5 && relevance >= 0 && relevance <= 5) {
          initial_quality = Math.round(quality * 10) / 10
          initial_relevance = Math.round(relevance * 10) / 10
          initial_score = Math.round(((quality + relevance) / 2) * 10) / 10
        }
      }
      // Otherwise, use the average score column if provided
      else if (scoreRaw) {
        const parsed = parseFloat(scoreRaw)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
          initial_score = Math.round(parsed * 10) / 10
        }
      }

      return {
        title,
        link: link || undefined,
        description: description || undefined,
        content_type: get('content_type') || undefined,
        categories,
        initial_score,
        initial_quality,
        initial_relevance,
        week: normalizeWeek(get('week')) || undefined,
        estimated_time: get('estimated_time') || undefined,
      } as ParsedMaterial
    })
    .filter((m): m is ParsedMaterial => m !== null)

  return { valid, skipped }
}

export default function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ count: number; duplicates?: number; message?: string } | null>(null)

  // Parsed file data
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<unknown[][]>([])
  const [mapping, setMapping] = useState<Record<FieldKey, number | null> | null>(null)

  // Preview
  const [materials, setMaterials] = useState<ParsedMaterial[]>([])
  const [skippedRows, setSkippedRows] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  async function handleFile(f: File) {
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
    setSuccess(null)

    try {
      const data = await f.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array', codepage: 65001 })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][]

      if (rows.length < 2) {
        setError('File must have at least a header row and one data row.')
        return
      }

      const fileHeaders = (rows[0] as string[])
        .map(h => (h != null ? cleanText(h) : ''))

      // Filter out completely empty columns
      const nonEmptyIndices = fileHeaders
        .map((h, i) => (h !== '' ? i : -1))
        .filter(i => i !== -1)

      const cleanHeaders = nonEmptyIndices.map(i => fileHeaders[i])
      const cleanRows = rows.slice(1)
        .map(row => nonEmptyIndices.map(i => (row as unknown[])[i]))
        .filter(row => row.some(cell => cell != null && String(cell).trim() !== ''))

      setHeaders(cleanHeaders)
      setDataRows(cleanRows)

      // Auto-map columns
      const autoMapping = autoMapColumns(cleanHeaders)
      setMapping(autoMapping)

      // Generate preview
      const { valid, skipped } = parseRowsToMaterials(cleanRows, autoMapping)
      setMaterials(valid)
      setSkippedRows(skipped)
    } catch {
      setError('Failed to parse file. Make sure it is a valid CSV or Excel file.')
    }
  }

  function updateMapping(field: FieldKey, columnIndex: number | null) {
    if (!mapping) return
    const newMapping = { ...mapping, [field]: columnIndex }
    setMapping(newMapping)
    const { valid, skipped } = parseRowsToMaterials(dataRows, newMapping)
    setMaterials(valid)
    setSkippedRows(skipped)
  }

  async function handleSubmit() {
    if (materials.length === 0) {
      setError('No valid materials to upload.')
      return
    }

    setLoading(true)
    setError(null)

    const result = await uploadMaterials(materials)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess({
        count: result.count,
        duplicates: result.duplicates,
        message: result.message
      })
      setLoading(false)
      setFile(null)
      setHeaders([])
      setDataRows([])
      setMapping(null)
      setMaterials([])
      setSkippedRows(0)
      setTimeout(() => router.push('/library'), 2000)
    }
  }

  const fileSize = file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : ''

  // Check which required fields are unmapped
  const unmappedRequired = mapping
    ? MATERIAL_FIELDS.filter(f => f.required && mapping[f.key] === null).map(f => f.label)
    : []

  const canSubmit = materials.length > 0 && unmappedRequired.length === 0

  const contentTypeColor: Record<string, string> = {
    'Video': 'bg-rose-100 text-rose-700',
    'Documentation': 'bg-blue-100 text-blue-700',
    'Course': 'bg-purple-100 text-purple-700',
    'Platform': 'bg-indigo-100 text-indigo-700',
    'Community': 'bg-green-100 text-green-700',
    'Social Media Post': 'bg-pink-100 text-pink-700',
    'Article': 'bg-amber-100 text-amber-700',
    'Case Study': 'bg-teal-100 text-teal-700',
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <p className="font-medium">Successfully uploaded {success.count} material{success.count === 1 ? '' : 's'}!</p>
          {success.duplicates && success.duplicates > 0 && (
            <p className="text-sm mt-1 text-amber-600">
              ⚠️ {success.duplicates} duplicate{success.duplicates === 1 ? '' : 's'} skipped (URL already exists)
            </p>
          )}
          <p className="text-sm mt-1">Redirecting to library...</p>
        </div>
      )}

      {/* Step 1: File Upload */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Step 1: Upload your file</h3>
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
                {fileSize} · {dataRows.length} rows · {headers.length} columns · Click to change
              </p>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Drop your CSV/Excel file here or click to browse</p>
              <p className="text-sm text-muted mt-1">Each row in your file will become an individual material</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Column Mapping */}
      {headers.length > 0 && mapping && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Step 2: Map your columns</h3>
          <p className="text-xs text-muted mb-3">
            Fields marked with <span className="text-red-500">*</span> are required. Rows missing required data will be skipped.
          </p>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {MATERIAL_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-4 px-4 py-3">
                <div className="w-36 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <select
                  value={mapping[field.key] ?? ''}
                  onChange={e => updateMapping(field.key, e.target.value === '' ? null : Number(e.target.value))}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    mapping[field.key] !== null
                      ? 'border-green-300 bg-green-50'
                      : field.required
                        ? 'border-red-300 bg-red-50'
                        : 'border-border'
                  }`}
                >
                  <option value="">-- Skip --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {unmappedRequired.length > 0 && (
            <p className="text-xs text-red-500 mt-2">
              Please map required fields: {unmappedRequired.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {materials.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Step 3: Preview ({materials.length} materials ready)
            {skippedRows > 0 && (
              <span className="text-amber-600 font-normal ml-2">
                ({skippedRows} rows skipped — missing name)
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {materials.slice(0, 5).map((m, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {m.content_type && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          contentTypeColor[m.content_type] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {m.content_type}
                        </span>
                      )}
                      {m.categories.slice(0, 2).map(cat => (
                        <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {cat}
                        </span>
                      ))}
                      {m.week && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
                          {m.week}
                        </span>
                      )}
                      {m.initial_score !== undefined && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          m.initial_score >= 4 ? 'bg-green-100 text-green-700' :
                          m.initial_score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {m.initial_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm truncate">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-muted mt-0.5 truncate">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted flex-shrink-0">
                    {m.estimated_time && <span>{m.estimated_time}</span>}
                    {m.link && (
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {materials.length > 5 && (
              <p className="text-sm text-muted text-center py-2">
                ...and {materials.length - 5} more materials
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      {headers.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Uploading...'
            : materials.length > 0
              ? `Upload ${materials.length} Material${materials.length === 1 ? '' : 's'}`
              : 'No valid materials found'}
        </button>
      )}

      {!canSubmit && headers.length > 0 && unmappedRequired.length > 0 && (
        <p className="text-xs text-center text-red-500">
          Map all required fields ({unmappedRequired.join(', ')}) to enable upload.
        </p>
      )}

      {/* Help section */}
      {!file && (
        <div className="bg-gray-50 rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">How it works</h4>
          <ol className="text-sm text-muted space-y-1.5 list-decimal list-inside">
            <li>Upload a CSV or Excel file with your training materials</li>
            <li>Map your file columns to material fields (Name, Link, Category, etc.)</li>
            <li>Preview the materials that will be created</li>
            <li>Upload — each row becomes its own material card in the library</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted">
              <span className="font-medium text-gray-600">Required:</span> Name, Link, Description, Category
            </p>
            <p className="text-xs text-muted mt-1">
              <span className="font-medium text-gray-600">Optional:</span> Content Type ({CONTENT_TYPES.join(', ')}), Quality Score + Relevance Score (or Average Score), Week, Estimated Time
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
