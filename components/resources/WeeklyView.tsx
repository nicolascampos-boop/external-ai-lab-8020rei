'use client'

import { Calendar, Video, Code, Book, FileText } from 'lucide-react'
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

interface WeeklyViewProps {
  weeklyData: Record<string, Resource[]>
}

export default function WeeklyView({ weeklyData }: WeeklyViewProps) {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">6-Week Course Structure</h2>
        <div className="space-y-6">
          {weeks.map(week => (
            <div key={week} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">{week}</h3>
                <span className="text-sm text-gray-500">
                  ({weeklyData[week]?.length || 0} resources)
                </span>
              </div>

              <div className="space-y-2">
                {weeklyData[week]?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getContentIcon(item.content_type)}
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-500">
                          {item.primary_topic} {item.skill_level && `\u2022 ${item.skill_level}`} {item.time_investment && `\u2022 ${item.time_investment}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.quality_rating && (
                        <div className={`w-6 h-6 rounded ${getRatingColor(item.quality_rating)} text-white text-xs flex items-center justify-center font-bold`}>
                          {item.quality_rating}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!weeklyData[week] || weeklyData[week].length === 0) && (
                  <p className="text-sm text-gray-400 p-3">No resources assigned to this week yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
