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

interface MaterialCardProps {
  material: MaterialWithScores
  selectable?: boolean
  selected?: boolean
  onToggle?: (id: string) => void
}

export default function MaterialCard({ material, selectable, selected, onToggle }: MaterialCardProps) {
  // Use voting score if votes exist, otherwise fall back to initial_score
  const displayScore = material.vote_count > 0
    ? ((material.avg_quality + material.avg_relevance) / 2).toFixed(1)
    : material.initial_score
      ? material.initial_score.toFixed(1)
      : null

  // Better label for score source
  const scoreSource = material.vote_count > 0
    ? 'community'
    : material.initial_score
      ? 'initial'
      : null

  const categories = material.categories || []

  return (
    <div className="flex items-start gap-3 mb-4">
      {selectable && (
        <label
          className="flex-shrink-0 mt-6 cursor-pointer"
          onClick={e => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle?.(material.id)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
        </label>
      )}
      <Link
        href={`/materials/${material.id}`}
        className={`flex-1 block rounded-xl border p-6 hover:shadow-lg transition-all ${
          material.is_essential
            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400'
            : 'bg-card border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row with better spacing */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {material.is_essential && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                  💎 Essential
                </span>
              )}
              {material.content_type && (
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                  CONTENT_TYPE_COLORS[material.content_type] || 'bg-gray-100 text-gray-600'
                }`}>
                  {material.content_type}
                </span>
              )}
              {categories.slice(0, 2).map(cat => (
                <span key={cat} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {cat}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="text-xs text-muted font-medium">+{categories.length - 2} more</span>
              )}
              {material.week && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                  📅 {material.week}
                </span>
              )}
            </div>

            {/* Title with better spacing */}
            <h3 className="font-semibold text-gray-900 text-lg mb-2">{material.title}</h3>

            {/* Description with better line height */}
            {material.description && (
              <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-3">{material.description}</p>
            )}

            {/* Link preview with icon */}
            {material.link && (
              <div className="flex items-center gap-2 text-xs text-primary bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate font-medium">{material.link}</span>
              </div>
            )}
          </div>

          {/* Score badge - clearer design */}
          <div className="flex-shrink-0 text-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${
              !displayScore
                ? 'bg-gray-100 text-gray-400 border border-gray-200'
                : Number(displayScore) >= 4
                  ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 border border-green-300'
                  : Number(displayScore) >= 3
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-300'
                    : 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 border border-red-300'
            }`}>
              {displayScore || '—'}
            </div>
            <p className="text-xs text-muted mt-1.5 font-medium">
              {scoreSource === 'community'
                ? `${material.vote_count} ${material.vote_count === 1 ? 'review' : 'reviews'}`
                : scoreSource === 'initial'
                  ? 'initial rating'
                  : 'not rated'}
            </p>
          </div>
        </div>

        {/* Footer with better spacing and clearer information */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {material.estimated_time && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {material.estimated_time}
              </span>
            )}
            {material.vote_count > 0 && (
              <>
                <span className="font-medium">Quality: <span className="text-gray-900">{material.avg_quality.toFixed(1)}</span></span>
                <span className="font-medium">Relevance: <span className="text-gray-900">{material.avg_relevance.toFixed(1)}</span></span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {new Date(material.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </Link>
    </div>
  )
}
