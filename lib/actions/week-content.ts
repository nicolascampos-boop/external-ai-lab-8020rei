'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Update week objectives, homework, and deliverable prompt (admin only)
export async function updateWeekContent(
  week: string,
  fields: {
    title?: string
    description?: string
    objectives?: string
    homework?: string
    deliverable_prompt?: string
  }
) {
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

  const { error } = await supabase
    .from('week_content')
    .upsert(
      {
        week,
        ...fields,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: 'week' }
    )

  if (error) return { error: error.message }

  revalidatePath('/weekly')
  return { success: true }
}

// Toggle a week's visibility (admin only) — Reference is always enabled and cannot be locked
export async function toggleWeekEnabled(week: string, enabled: boolean) {
  if (week === 'Reference') return { error: 'Reference cannot be locked' }

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

  const { error } = await supabase
    .from('week_content')
    .upsert(
      { week, is_enabled: enabled, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'week' }
    )

  if (error) return { error: error.message }

  revalidatePath('/weekly')
  return { success: true }
}

// Submit or update a user's deliverable for a week (any authenticated user)
// Accepts a link, notes, or both — at least one must be provided
export async function submitDeliverable(week: string, link: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const trimmedLink = link.trim()
  const trimmedNotes = notes?.trim() ?? ''

  if (!trimmedLink && !trimmedNotes) {
    return { error: 'Please provide a link or a description' }
  }

  // Only validate URL format when a link is provided
  if (trimmedLink) {
    try {
      new URL(trimmedLink)
    } catch {
      return { error: 'Please enter a valid URL (including https://)' }
    }
  }

  const { error } = await supabase
    .from('week_deliverables')
    .upsert(
      {
        user_id: user.id,
        week,
        link: trimmedLink || null,
        notes: trimmedNotes || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week' }
    )

  if (error) return { error: error.message }

  revalidatePath('/weekly')
  return { success: true }
}
