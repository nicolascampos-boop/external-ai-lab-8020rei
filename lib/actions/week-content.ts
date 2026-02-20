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

// Submit or update a user's deliverable link for a week (any authenticated user)
export async function submitDeliverable(week: string, link: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (!link.trim()) return { error: 'Link is required' }

  // Basic URL validation
  try {
    new URL(link.trim())
  } catch {
    return { error: 'Please enter a valid URL (including https://)' }
  }

  const { error } = await supabase
    .from('week_deliverables')
    .upsert(
      {
        user_id: user.id,
        week,
        link: link.trim(),
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week' }
    )

  if (error) return { error: error.message }

  revalidatePath('/weekly')
  return { success: true }
}
