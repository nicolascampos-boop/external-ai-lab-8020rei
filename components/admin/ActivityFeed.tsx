'use client'

import { Eye, Plus, Edit2, Trash2 } from 'lucide-react'

interface ActivityItem {
  id: number
  action_type: string
  created_at: string
  metadata: Record<string, unknown>
  user_name: string
  user_email: string
  user_avatar: string | null
  resource_title: string | null
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

function getActionIcon(type: string) {
  switch (type) {
    case 'view': return <Eye className="w-4 h-4 text-blue-500" />
    case 'add': return <Plus className="w-4 h-4 text-green-500" />
    case 'edit': return <Edit2 className="w-4 h-4 text-yellow-500" />
    case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />
    default: return <Eye className="w-4 h-4 text-gray-500" />
  }
}

function getActionLabel(type: string) {
  switch (type) {
    case 'view': return 'viewed'
    case 'add': return 'added'
    case 'edit': return 'edited'
    case 'delete': return 'deleted'
    default: return type
  }
}

function formatRelativeTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {activities.map(activity => (
          <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
            <div className="flex-shrink-0">
              {activity.user_avatar ? (
                <img src={activity.user_avatar} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {(activity.user_name || activity.user_email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {getActionIcon(activity.action_type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user_name || activity.user_email}</span>
                {' '}{getActionLabel(activity.action_type)}{' '}
                {activity.resource_title ? (
                  <span className="font-medium">{activity.resource_title}</span>
                ) : (
                  <span className="text-gray-500">a resource</span>
                )}
              </p>
            </div>

            <div className="flex-shrink-0 text-xs text-gray-500">
              {formatRelativeTime(activity.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
