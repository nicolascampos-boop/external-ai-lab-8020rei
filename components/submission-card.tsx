'use client'

import { useState, useTransition } from 'react'
import { toggleDeliverableReaction } from '@/lib/actions/deliverable-reactions'

interface SubmissionCardProps {
  deliverable: {
    id: string
    link: string | null
    notes: string | null
    submitted_at: string
    profiles: { full_name: string | null; email: string | null } | null
  }
  likeCount: number
  dislikeCount: number
  userReaction: 'like' | 'dislike' | null
  isAuthenticated: boolean
}

const NOTES_COLLAPSE_THRESHOLD = 300

export default function SubmissionCard({
  deliverable,
  likeCount,
  dislikeCount,
  userReaction,
  isAuthenticated,
}: SubmissionCardProps) {
  const profile = deliverable.profiles
  const displayName = profile?.full_name || profile?.email || 'Unknown'
  const notes = deliverable.notes ?? ''
  const isLong = notes.length > NOTES_COLLAPSE_THRESHOLD

  const [expanded, setExpanded] = useState(false)
  const [optimisticReaction, setOptimisticReaction] = useState(userReaction)
  const [optimisticLikes, setOptimisticLikes] = useState(likeCount)
  const [optimisticDislikes, setOptimisticDislikes] = useState(dislikeCount)
  const [isPending, startTransition] = useTransition()

  function handleReaction(reaction: 'like' | 'dislike') {
    if (!isAuthenticated || isPending) return

    // Optimistic update
    const prev = optimisticReaction
    if (prev === reaction) {
      // Toggle off
      setOptimisticReaction(null)
      if (reaction === 'like') setOptimisticLikes(c => c - 1)
      else setOptimisticDislikes(c => c - 1)
    } else {
      // Switch or new
      setOptimisticReaction(reaction)
      if (reaction === 'like') {
        setOptimisticLikes(c => c + 1)
        if (prev === 'dislike') setOptimisticDislikes(c => c - 1)
      } else {
        setOptimisticDislikes(c => c + 1)
        if (prev === 'like') setOptimisticLikes(c => c - 1)
      }
    }

    startTransition(async () => {
      const result = await toggleDeliverableReaction(deliverable.id, reaction)
      if (result?.error) {
        // Rollback on error
        setOptimisticReaction(prev)
        setOptimisticLikes(likeCount)
        setOptimisticDislikes(dislikeCount)
      }
    })
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-medium text-gray-700">{displayName}</p>
          <span className="text-xs text-muted">
            {new Date(deliverable.submitted_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Link */}
        {deliverable.link && (
          <a
            href={deliverable.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate block mb-1"
          >
            {deliverable.link}
          </a>
        )}

        {/* Notes — expandable */}
        {notes && (
          <div>
            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
              {isLong && !expanded ? notes.slice(0, NOTES_COLLAPSE_THRESHOLD) + '…' : notes}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Like / Dislike */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => handleReaction('like')}
            disabled={!isAuthenticated || isPending}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
              optimisticReaction === 'like'
                ? 'bg-green-100 text-green-700 font-medium'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            } disabled:cursor-not-allowed`}
            title={isAuthenticated ? 'Like' : 'Sign in to react'}
          >
            <svg className="w-3.5 h-3.5" fill={optimisticReaction === 'like' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{optimisticLikes > 0 ? optimisticLikes : ''}</span>
          </button>

          <button
            onClick={() => handleReaction('dislike')}
            disabled={!isAuthenticated || isPending}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
              optimisticReaction === 'dislike'
                ? 'bg-red-100 text-red-700 font-medium'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            } disabled:cursor-not-allowed`}
            title={isAuthenticated ? 'Dislike' : 'Sign in to react'}
          >
            <svg className="w-3.5 h-3.5" fill={optimisticReaction === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span>{optimisticDislikes > 0 ? optimisticDislikes : ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
