'use client'

import { useState } from 'react'
import { submitVote } from '@/lib/actions/votes'

interface VoteWidgetProps {
  materialId: string
  existingVote: {
    quality_score: number
    relevance_score: number
    comment?: string | null
  } | null
}

export default function VoteWidget({ materialId, existingVote }: VoteWidgetProps) {
  const [quality, setQuality] = useState(existingVote?.quality_score || 0)
  const [relevance, setRelevance] = useState(existingVote?.relevance_score || 0)
  const [comment, setComment] = useState(existingVote?.comment || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (quality === 0 || relevance === 0) {
      setError('Please rate both quality and relevance.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await submitVote(materialId, quality, relevance, comment || undefined)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        {existingVote ? 'Update Your Review' : 'Rate This Material'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Your review has been saved!
        </div>
      )}

      {/* Quality rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quality <span className="text-muted font-normal">— How well-made is this material?</span>
        </label>
        <StarRating value={quality} onChange={setQuality} />
      </div>

      {/* Relevance rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Relevance <span className="text-muted font-normal">— How useful for AI training?</span>
        </label>
        <StarRating value={relevance} onChange={setRelevance} />
      </div>

      {/* Comment (optional) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your thoughts about this material..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || quality === 0 || relevance === 0}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? 'Submitting...' : existingVote ? 'Update Review' : 'Submit Review'}
      </button>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <svg
            className={`w-8 h-8 ${
              star <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-muted self-center">
        {value > 0 ? `${value}/5` : 'Select'}
      </span>
    </div>
  )
}
