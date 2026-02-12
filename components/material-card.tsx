import Link from 'next/link'
import type { MaterialWithScores } from '@/lib/supabase/types'

const CONTENT_TYPE_COLORS: Record<string, string> = {
  'Video': 'bg-rose-100 text-rose-700',
  'Documentation': 'bg-blue-100 text-blue-700',
  'Course': 'bg-purple-100 text-purple-700',
  'Platform': 'bg-indigo-100 text-indigo-700',
  'Community': 'bg-green-100 text-green-700',
  'Social Media Post': 'bg-pink-100 text-pink-700',
  'Article': 'bg-amber-100 text-amber-700',
  'Case Study': 'bg-teal-100 text-teal-700',
}

export default function MaterialCard({ material }: { material: MaterialWithScores }) {
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
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {material.content_type && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                CONTENT_TYPE_COLORS[material.content_type] || 'bg-gray-100 text-gray-600'
              }`}>
                {material.content_type}
              </span>
            )}
            {categories.slice(0, 2).map(cat => (
              <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {cat}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="text-xs text-muted">+{categories.length - 2}</span>
            )}
            {material.week && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
                {material.week}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 truncate">{material.title}</h3>

          {/* Description */}
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

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted">
          {material.estimated_time && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {material.estimated_time}
            </span>
          )}
          {material.link && (
            <span className="inline-flex items-center gap-1 text-primary">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Link
            </span>
          )}
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
