'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateWeekContent } from '@/lib/actions/week-content'

interface Props {
  week: string
  initialTitle: string
  initialDescription: string
  initialObjectives: string
  initialHomework: string
  initialDeliverablePrompt: string
}

export default function WeekEditForm({
  week,
  initialTitle,
  initialDescription,
  initialObjectives,
  initialHomework,
  initialDeliverablePrompt,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [objectives, setObjectives] = useState(initialObjectives)
  const [homework, setHomework] = useState(initialHomework)
  const [deliverablePrompt, setDeliverablePrompt] = useState(initialDeliverablePrompt)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateWeekContent(week, {
        title: title.trim() || null,
        description: description.trim() || null,
        objectives,
        homework,
        deliverable_prompt: deliverablePrompt,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setEditing(false)
        setError(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-blue-900">Admin: Edit Week Content</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Week
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">📌 Week Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={week}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">📝 Description / Subtitle</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. AI Foundations & Strategic Thinking"
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">🎯 Learning Objectives</label>
            <textarea
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              rows={4}
              placeholder="What participants will learn this week..."
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">📝 Homework &amp; To-Do</label>
            <textarea
              value={homework}
              onChange={e => setHomework(e.target.value)}
              rows={3}
              placeholder="What participants should do / practice this week..."
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">📬 Deliverable Prompt</label>
            <textarea
              value={deliverablePrompt}
              onChange={e => setDeliverablePrompt(e.target.value)}
              rows={3}
              placeholder="Describe what participants should submit (e.g. 'Share a link to your project or write-up...')"
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              className="px-4 py-2 border border-blue-200 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-blue-700">
          Click &quot;Edit Week&quot; to set title, description, objectives, homework, and deliverable prompt for this week.
        </p>
      )}
    </div>
  )
}
