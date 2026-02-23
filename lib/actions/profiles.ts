'use server'

import { createClient } from '@/lib/supabase/server'
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

  // Note: Deleting from auth.users requires admin privileges
  // This needs to be done via Supabase Admin API or SQL
  // For now, we'll just delete the profile

  revalidatePath('/admin')

  return { success: true }
}
