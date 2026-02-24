'use client'

import { useState, useRef } from 'react'
import { submitReply, deleteReply } from '@/lib/actions/replies'

interface Reply {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { full_name: string | null; email: string | null } | null
}

interface CommentRepliesProps {
  voteId: string
  materialId: string
  initialReplies: Reply[]
  currentUserId: string
}

export default function CommentReplies({
  voteId,
  materialId,
  initialReplies,
  currentUserId,
}: CommentRepliesProps) {
  const [expanded, setExpanded] = useState(initialReplies.length > 0)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    setError(null)
    const result = await submitReply(voteId, content)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setContent('')
      setShowForm(false)
    }
  }

  async function handleDelete(replyId: string) {
    await deleteReply(replyId, materialId)
  }

  function openReplyForm() {
    setShowForm(true)
    setExpanded(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div className="mt-2">
      {/* Actions row */}
      <div className="flex items-center gap-3 ml-11">
        <button
          onClick={openReplyForm}
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          Reply
        </button>
        {initialReplies.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-muted hover:text-primary transition-colors"
          >
            {expanded
              ? 'Hide replies'
              : `${initialReplies.length} ${initialReplies.length === 1 ? 'reply' : 'replies'}`}
          </button>
        )}
      </div>

      {/* Replies list */}
      {expanded && initialReplies.length > 0 && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
          {initialReplies.map(reply => {
            const name = reply.profiles?.full_name || reply.profiles?.email || 'Anonymous'
            const date = new Date(reply.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
            const isOwn = reply.user_id === currentUserId
            return (
              <div key={reply.id} className="group flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-700">{name}</span>
                    <span className="text-xs text-muted">{date}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(reply.id)}
                        className="text-xs text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="ml-11 mt-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={1000}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting…' : 'Post reply'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setContent(''); setError(null) }}
              className="text-xs text-muted hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
