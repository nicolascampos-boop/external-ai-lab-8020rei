'use client'

import { useState } from 'react'
import { submitReaction } from '@/lib/actions/reactions'

interface ReviewReactionsProps {
  voteId: string
  initialLikes: number
  initialDislikes: number
  userReaction: 'like' | 'dislike' | null
}

export default function ReviewReactions({
  voteId,
  initialLikes,
  initialDislikes,
  userReaction: initialUserReaction,
}: ReviewReactionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(initialUserReaction)
  const [loading, setLoading] = useState(false)

  async function handleReaction(reaction: 'like' | 'dislike') {
    if (loading) return

    setLoading(true)

    // Optimistic update
    const prevUserReaction = userReaction
    const prevLikes = likes
    const prevDislikes = dislikes

    if (userReaction === reaction) {
      // Remove reaction
      setUserReaction(null)
      if (reaction === 'like') {
        setLikes(likes - 1)
      } else {
        setDislikes(dislikes - 1)
      }
    } else {
      // Add or change reaction
      if (prevUserReaction === 'like') {
        setLikes(likes - 1)
      } else if (prevUserReaction === 'dislike') {
        setDislikes(dislikes - 1)
      }

      setUserReaction(reaction)
      if (reaction === 'like') {
        setLikes(prevLikes + (prevUserReaction === 'like' ? 0 : 1))
      } else {
        setDislikes(prevDislikes + (prevUserReaction === 'dislike' ? 0 : 1))
      }
    }

    const result = await submitReaction(voteId, userReaction === reaction ? null : reaction)

    if (result.error) {
      // Revert on error
      setUserReaction(prevUserReaction)
      setLikes(prevLikes)
      setDislikes(prevDislikes)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleReaction('like')}
        disabled={loading}
        className={`flex items-center gap-1 text-xs transition-colors ${
          userReaction === 'like'
            ? 'text-green-600 font-medium'
            : 'text-muted hover:text-green-600'
        }`}
      >
        <svg className="w-4 h-4" fill={userReaction === 'like' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span>{likes}</span>
      </button>
      <button
        onClick={() => handleReaction('dislike')}
        disabled={loading}
        className={`flex items-center gap-1 text-xs transition-colors ${
          userReaction === 'dislike'
            ? 'text-red-600 font-medium'
            : 'text-muted hover:text-red-600'
        }`}
      >
        <svg className="w-4 h-4" fill={userReaction === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
        <span>{dislikes}</span>
      </button>
    </div>
  )
}
