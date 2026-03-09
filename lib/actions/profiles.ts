'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  if (userId === user.id) {
    return { error: 'You cannot change your own role' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if current user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  // Prevent deleting yourself
  if (userId === user.id) {
    return { error: 'You cannot delete your own account' }
  }

  // First, delete all user's data (cascading should handle this, but let's be explicit)
  // Delete votes
  await supabase.from('votes').delete().eq('user_id', userId)

  // Delete vote reactions
  await supabase.from('vote_reactions').delete().eq('user_id', userId)

  // Delete materials uploaded by user
  await supabase.from('materials').delete().eq('uploaded_by', userId)

  // Delete the user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    console.error('Profile deletion error:', profileError)
    return { error: `Failed to delete profile: ${profileError.message}` }
  }

  // Also delete the user from auth.users via admin client (best-effort)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      await admin.auth.admin.deleteUser(userId)
    } catch {
      console.error('Failed to delete user from auth.users — profile already removed')
    }
  }

  revalidatePath('/admin')

  return { success: true }
}

export async function getOrphanedAuthUsers() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Service role key not configured', orphaned: [] as OrphanedUser[] }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', orphaned: [] as OrphanedUser[] }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required', orphaned: [] as OrphanedUser[] }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return { error: error.message, orphaned: [] as OrphanedUser[] }

    const { data: profiles } = await supabase.from('profiles').select('id')
    const profileIds = new Set((profiles ?? []).map((p: { id: string }) => p.id))

    const orphaned: OrphanedUser[] = data.users
      .filter(u => !profileIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email ?? '',
        full_name: (u.user_metadata?.full_name || u.user_metadata?.name || null) as string | null,
        created_at: u.created_at,
      }))

    return { orphaned }
  } catch {
    return { error: 'Failed to connect to admin API', orphaned: [] as OrphanedUser[] }
  }
}

export interface OrphanedUser {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export async function createMissingProfile(userId: string, email: string, fullName: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
