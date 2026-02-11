'use client'

import {
  contentTypeOptions,
  topicOptions,
  skillLevelOptions,
  weekOptions,
} from '@/lib/constants'
import type { NewItemForm } from '@/hooks/useResources'

interface AddResourceFormProps {
  newItem: NewItemForm
  onNewItemChange: (item: NewItemForm) => void
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
}

export default function AddResourceForm({
  newItem,
  onNewItemChange,
  onSubmit,
  onCancel,
  saving,
}: AddResourceFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Content</h2>
      <div className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={newItem.title}
            onChange={(e) => onNewItemChange({ ...newItem, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Resource title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link *</label>
          <input
            type="url"
            value={newItem.link}
            onChange={(e) => onNewItemChange({ ...newItem, link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type *</label>
            <select
              value={newItem.content_type}
              onChange={(e) => onNewItemChange({ ...newItem, content_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              {contentTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Topic *</label>
            <select
              value={newItem.primary_topic}
              onChange={(e) => onNewItemChange({ ...newItem, primary_topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              {topicOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level *</label>
            <select
              value={newItem.skill_level}
              onChange={(e) => onNewItemChange({ ...newItem, skill_level: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              {skillLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Suggested *</label>
            <select
              value={newItem.week_suggested}
              onChange={(e) => onNewItemChange({ ...newItem, week_suggested: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              {weekOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Investment</label>
            <input
              type="text"
              value={newItem.time_investment}
              onChange={(e) => onNewItemChange({ ...newItem, time_investment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              placeholder="30min, 1hr, 2hrs (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tools Covered</label>
            <input
              type="text"
              value={newItem.tools_covered}
              onChange={(e) => onNewItemChange({ ...newItem, tools_covered: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              placeholder="Claude, Make, Cursor"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Notes</label>
          <textarea
            value={newItem.your_notes}
            onChange={(e) => onNewItemChange({ ...newItem, your_notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            rows={3}
            placeholder="Add your personal notes and comments..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onSubmit}
            disabled={!newItem.title || !newItem.link || saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add Content'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
