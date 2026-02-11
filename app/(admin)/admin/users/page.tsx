import { createClient } from '@/lib/supabase/server'
import UserTable from '@/components/admin/UserTable'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Count resources per user
  const { data: resources } = await supabase
    .from('resources')
    .select('added_by')

  const resourceCounts: Record<string, number> = {}
  resources?.forEach(r => {
    if (r.added_by) {
      resourceCounts[r.added_by] = (resourceCounts[r.added_by] || 0) + 1
    }
  })

  // Count activity per user
  const { data: activities } = await supabase
    .from('user_activity')
    .select('user_id')

  const activityCounts: Record<string, number> = {}
  activities?.forEach(a => {
    activityCounts[a.user_id] = (activityCounts[a.user_id] || 0) + 1
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">View and manage platform users</p>
      </div>

      <UserTable
        users={users ?? []}
        resourceCounts={resourceCounts}
        activityCounts={activityCounts}
      />
    </div>
  )
}
