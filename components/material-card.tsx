import Link from 'next/link'
import { memo } from 'react'
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
  from?: 'library' | 'weekly' | 'dashboard'
  week?: string
  isReviewed?: boolean
}

function MaterialCard({ material, selectable, selected, onToggle, from, week, isReviewed }: MaterialCardProps) {
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

  // Construct the link with query parameters for proper back navigation
  const materialLink = `/materials/${material.id}${
    from ? `?from=${from}${week ? `&week=${encodeURIComponent(week)}` : ''}` : ''
  }`

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
        href={materialLink}
        className={`flex-1 min-w-0 block rounded-xl border p-3 md:p-6 hover:shadow-lg transition-all ${
          material.material_tier === 'must_read' || material.material_tier === 'must-read' || material.material_tier === 'MUST READ'
            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400'
            : material.material_tier === 'core' || material.material_tier === 'CORE' || material.material_tier === 'Core'
              ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400'
              : material.material_tier === 'reference'
                ? 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
                : 'bg-card border-border hover:border-primary/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row with better spacing */}
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
              {(material.material_tier === 'must_read' || material.material_tier === 'must-read' || material.material_tier === 'MUST READ') && (
                <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm flex-shrink-0">
                  💎 Must Read
                </span>
              )}
              {(material.material_tier === 'core' || material.material_tier === 'CORE' || material.material_tier === 'Core') && (
                <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm flex-shrink-0">
                  ⭐ Core
                </span>
              )}
              {material.material_tier === 'reference' && (
                <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300 flex-shrink-0">
                  📌 Reference
                </span>
              )}
              {material.content_type && (
                <span className={`inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                  CONTENT_TYPE_COLORS[material.content_type] || 'bg-gray-100 text-gray-600'
                }`}>
                  {material.content_type}
                </span>
              )}
              {categories.slice(0, 1).map(cat => (
                <span key={cat} className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 flex-shrink-0 truncate max-w-[120px] md:max-w-none">
                  {cat}
                </span>
              ))}
              {categories.length > 1 && (
                <span className="text-xs text-muted font-medium flex-shrink-0">+{categories.length - 1} more</span>
              )}
              {material.week && (
                <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 flex-shrink-0">
                  📅 {material.week}
                </span>
              )}
            </div>

            {/* Title with truncation for mobile */}
            <h3 className="font-semibold text-gray-900 text-base md:text-lg mb-2 line-clamp-2">{material.title}</h3>

            {/* Description with better line height */}
            {material.description && (
              <p className="text-muted text-xs md:text-sm leading-relaxed line-clamp-2 mb-2 md:mb-3">{material.description}</p>
            )}

            {/* Justification for assignment — shown as a highlighted quote */}
            {material.justification_for_assignment && (
              <blockquote className="mb-2 md:mb-3 pl-3 border-l-2 border-amber-400 text-xs text-amber-800 italic leading-relaxed line-clamp-2">
                {material.justification_for_assignment}
              </blockquote>
            )}

            {/* Link preview with icon - more compact on mobile */}
            {material.link && (
              <div className="flex items-center gap-1.5 md:gap-2 text-xs text-primary bg-blue-50 px-2 md:px-3 py-1.5 md:py-2 rounded-md border border-blue-100 min-w-0">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate font-medium min-w-0">{material.link}</span>
              </div>
            )}
          </div>

          {/* Score badge - more compact on mobile */}
          <div className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-shrink-0 sm:text-center">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-xl font-bold shadow-sm ${
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
            <p className="text-xs text-muted sm:mt-1.5 font-medium">
              {scoreSource === 'community'
                ? `${material.vote_count} ${material.vote_count === 1 ? 'review' : 'reviews'}`
                : scoreSource === 'initial'
                  ? 'initial rating'
                  : 'not rated'}
            </p>
          </div>
        </div>

        {/* Footer with responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-200 gap-1.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs text-gray-600">
            {isReviewed && (
              <span className="inline-flex items-center gap-1 font-medium text-green-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Reviewed
              </span>
            )}
            {material.estimated_time && (
              <span className="inline-flex items-center gap-1 font-medium">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {material.estimated_time}
              </span>
            )}
            {material.vote_count > 0 && (
              <>
                <span className="font-medium text-[11px] md:text-xs">Q: <span className="text-gray-900">{material.avg_quality.toFixed(1)}</span></span>
                <span className="font-medium text-[11px] md:text-xs">R: <span className="text-gray-900">{material.avg_relevance.toFixed(1)}</span></span>
              </>
            )}
          </div>
          <span className="text-[11px] md:text-xs text-gray-500 font-medium whitespace-nowrap">
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

export default memo(MaterialCard)
