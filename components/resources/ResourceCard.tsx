'use client'

import { Edit2, Trash2, Save, X, Clock, Video, Code, Book, FileText } from 'lucide-react'
import { getRatingColor } from '@/lib/utils'
import type { Database } from '@/lib/supabase/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

function getContentIcon(type: string) {
  switch (type) {
    case 'Video': return <Video className="w-4 h-4" />
    case 'Tutorial': return <Code className="w-4 h-4" />
    case 'Documentation': return <Book className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

interface ResourceCardProps {
  item: Resource
  isEditing: boolean
  editForm: Resource | null
  onEditFormChange: (form: Resource) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  saving: boolean
  isAdmin: boolean
}

export default function ResourceCard({
  item,
  isEditing,
  editForm,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  saving,
  isAdmin,
}: ResourceCardProps) {
  if (isEditing && editForm) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => onEditFormChange({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <input
                type="url"
                value={editForm.link}
                onChange={(e) => onEditFormChange({ ...editForm, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editForm.quality_rating || ''}
                onChange={(e) => onEditFormChange({ ...editForm, quality_rating: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relevance Score (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editForm.relevance_score || ''}
                onChange={(e) => onEditFormChange({ ...editForm, relevance_score: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Notes</label>
            <textarea
              value={editForm.your_notes || ''}
              onChange={(e) => onEditFormChange({ ...editForm, your_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSaveEdit}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            {getContentIcon(item.content_type)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 break-all"
              >
                {item.link}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{item.content_type}</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{item.primary_topic}</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              item.skill_level === 'Beginner' ? 'bg-green-100 text-green-700' :
              item.skill_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>{item.skill_level}</span>
            {item.time_investment && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.time_investment}
              </span>
            )}
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">{item.week_suggested}</span>
          </div>

          {item.your_notes && (
            <p className="text-sm text-gray-600 mb-3">{item.your_notes}</p>
          )}

          <div className="flex items-center gap-4">
            {item.quality_rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Quality:</span>
                <div className={`w-8 h-8 rounded ${getRatingColor(item.quality_rating)} text-white text-sm flex items-center justify-center font-bold`}>
                  {item.quality_rating}
                </div>
              </div>
            )}
            {item.relevance_score && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Relevance:</span>
                <div className={`w-8 h-8 rounded ${getRatingColor(item.relevance_score)} text-white text-sm flex items-center justify-center font-bold`}>
                  {item.relevance_score}
                </div>
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={onStartEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
