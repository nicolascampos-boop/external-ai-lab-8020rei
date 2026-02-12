import Link from 'next/link'
import type { MaterialWithScores } from '@/lib/supabase/types'

export default function MaterialCard({ material }: { material: MaterialWithScores }) {
  const fileIcon = material.file_type.includes('csv') || material.file_name?.endsWith('.csv') ? 'CSV' : 'XLSX'
  const overallScore = material.vote_count > 0
    ? ((material.avg_quality + material.avg_relevance) / 2).toFixed(1)
    : '—'

  const categories = material.categories || []

  return (
    <Link
      href={`/materials/${material.id}`}
      className="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              fileIcon === 'CSV' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {fileIcon}
            </span>
            {categories.slice(0, 3).map(cat => (
              <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {cat}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="text-xs text-muted">+{categories.length - 3}</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{material.title}</h3>
          {material.description && (
            <p className="text-muted text-sm mt-1 line-clamp-2">{material.description}</p>
          )}
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0 text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
            material.vote_count === 0
              ? 'bg-gray-100 text-gray-400'
              : Number(overallScore) >= 4
                ? 'bg-green-100 text-green-700'
                : Number(overallScore) >= 3
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
          }`}>
            {overallScore}
          </div>
          <p className="text-xs text-muted mt-1">
            {material.vote_count} {material.vote_count === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      </div>

      {/* Tags */}
      {material.tags && material.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {material.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded-full">
              {tag}
            </span>
          ))}
          {material.tags.length > 4 && (
            <span className="text-xs px-2 py-0.5 text-muted">
              +{material.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>Quality: {material.vote_count > 0 ? material.avg_quality.toFixed(1) : '—'}</span>
          <span>Relevance: {material.vote_count > 0 ? material.avg_relevance.toFixed(1) : '—'}</span>
        </div>
        <span className="text-xs text-muted">
          {new Date(material.created_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  )
}
