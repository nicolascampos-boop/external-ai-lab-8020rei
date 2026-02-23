'use client'

import { useState, useTransition } from 'react'
import { submitDeliverable } from '@/lib/actions/week-content'

interface Props {
  week: string
  existingLink: string | null
  existingNotes: string | null
  existingSubmittedAt: string | null
}

export default function DeliverableForm({ week, existingLink, existingNotes, existingSubmittedAt }: Props) {
  const [link, setLink] = useState(existingLink ?? '')
  const [notes, setNotes] = useState(existingNotes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await submitDeliverable(week, link, notes)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  const hasExisting = !!(existingLink || existingNotes)
  const canSubmit = !!(link.trim() || notes.trim())

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-gray-900 mb-1">
        {hasExisting ? 'Your Submission' : 'Submit your deliverable'}
      </h3>
      {hasExisting && existingSubmittedAt && (
        <p className="text-xs text-muted mb-3">
          Submitted {new Date(existingSubmittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Your deliverable can be any of the following:
        <span className="block mt-1.5 space-y-0.5 pl-1">
          <span className="block">· A repository (GitHub, GitLab, etc.)</span>
          <span className="block">· A video showcasing your deliverable</span>
          <span className="block">· A link to access your work</span>
          <span className="block">· A short description answering that week&apos;s objectives</span>
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
            ✓ Deliverable {hasExisting ? 'updated' : 'submitted'} successfully!
          </p>
        )}

        <input
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://... (optional if adding a description below)"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add a description or reflection on this week's objectives... (optional if adding a link above)"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="px-5 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isPending ? 'Submitting...' : hasExisting ? 'Update Submission' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
