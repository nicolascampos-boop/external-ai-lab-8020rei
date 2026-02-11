import { createClient } from '@/lib/supabase/server'
import ActivityFeed from '@/components/admin/ActivityFeed'

export default async function ActivityPage() {
  const supabase = await createClient()

  const { data: rawActivities } = await supabase
    .from('user_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch related profiles and resources
  const userIds = [...new Set(rawActivities?.map(a => a.user_id) ?? [])]
  const resourceIds = [...new Set(rawActivities?.filter(a => a.resource_id).map(a => a.resource_id!) ?? [])]

  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
    : { data: [] }

  const { data: resources } = resourceIds.length > 0
    ? await supabase.from('resources').select('id, title').in('id', resourceIds)
    : { data: [] }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])
  const resourceMap = new Map(resources?.map(r => [r.id, r]) ?? [])

  const activities = (rawActivities ?? []).map(a => {
    const profile = profileMap.get(a.user_id)
    const resource = a.resource_id ? resourceMap.get(a.resource_id) : null
    return {
      id: a.id,
      action_type: a.action_type,
      created_at: a.created_at,
      metadata: a.metadata as Record<string, unknown>,
      user_name: profile?.full_name ?? '',
      user_email: profile?.email ?? '',
      user_avatar: profile?.avatar_url ?? null,
      resource_title: resource?.title ?? null,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600">Recent user activity across the platform</p>
      </div>

      <ActivityFeed activities={activities} />
    </div>
  )
}
