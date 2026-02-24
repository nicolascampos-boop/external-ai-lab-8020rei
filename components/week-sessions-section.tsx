'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addWeekSession, deleteWeekSession } from '@/lib/actions/week-sessions'
import type { WeekSession } from '@/lib/supabase/types'
import { SESSION_TYPE_META } from '@/lib/supabase/types'

interface Props {
  week: string
  sessions: WeekSession[]
  isAdmin: boolean
}

const SESSION_TYPES = [
  { value: 'weekly',  label: 'Weekly Session'  },
  { value: 'team',    label: 'Team Session'    },
  { value: 'speaker', label: 'Speaker Session' },
] as const

export default function WeekSessionsSection({ week, sessions, isAdmin }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [sessionType, setSessionType] = useState<string>('weekly')
  const [description, setDescription] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setTitle('')
    setLink('')
    setSessionType('weekly')
    setDescription('')
    setSessionDate('')
    setError('')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await addWeekSession(week, title, link, sessionType, description, sessionDate)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        resetForm()
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this session recording?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteWeekSession(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  // Group sessions by type in display order
  const grouped: Record<string, WeekSession[]> = { weekly: [], team: [], speaker: [] }
  for (const s of sessions) {
    const key = s.session_type in grouped ? s.session_type : 'weekly'
    grouped[key].push(s)
  }
  const hasAnySessions = sessions.length > 0

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">🎬 Session Recordings</h3>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary font-medium hover:underline"
          >
            + Add recording
          </button>
        )}
      </div>

      {/* Admin add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 bg-gray-50 border border-border rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-800">Add a session recording</p>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {SESSION_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSessionType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  sessionType === t.value
                    ? `${SESSION_TYPE_META[t.value].bgColor} ${SESSION_TYPE_META[t.value].textColor} ${SESSION_TYPE_META[t.value].borderColor}`
                    : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                }`}
              >
                {SESSION_TYPE_META[t.value].icon} {t.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Session title *  (e.g. Week 3 Kickoff, Guest Speaker: Jane Doe)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="url"
            placeholder="Recording link (https://…) *"
            value={link}
            onChange={e => setLink(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              title="Session date (optional)"
            />
            <textarea
              placeholder="Brief description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sessions list grouped by type */}
      {hasAnySessions ? (
        <div className="space-y-4">
          {SESSION_TYPES.map(t => {
            const items = grouped[t.value]
            if (items.length === 0) return null
            const meta = SESSION_TYPE_META[t.value]
            return (
              <div key={t.value}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${meta.textColor}`}>
                  {meta.icon} {meta.label}{items.length > 1 ? `s` : ''}
                </p>
                <div className="space-y-2">
                  {items.map(session => (
                    <div
                      key={session.id}
                      className={`flex items-start gap-3 rounded-lg border ${meta.borderColor} ${meta.bgColor} px-4 py-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={session.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm font-semibold hover:underline ${meta.textColor}`}
                          >
                            {session.title}
                          </a>
                          {session.session_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {session.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{session.description}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id || isPending}
                          className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors mt-0.5"
                          title="Remove recording"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {isAdmin
            ? 'No recordings yet. Use "Add recording" to link this week\'s session videos.'
            : 'No session recordings yet.'}
        </p>
      )}
    </div>
  )
}
