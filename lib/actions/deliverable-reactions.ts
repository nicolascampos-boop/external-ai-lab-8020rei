'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleDeliverableReaction(
  deliverableId: string,
  reaction: 'like' | 'dislike'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if the user already has a reaction for this deliverable
  const { data: existing } = await supabase
    .from('deliverable_reactions')
    .select('id, reaction')
    .eq('user_id', user.id)
    .eq('deliverable_id', deliverableId)
    .single()

  if (existing) {
    if (existing.reaction === reaction) {
      // Same reaction clicked again → remove it (toggle off)
      const { error } = await supabase
        .from('deliverable_reactions')
        .delete()
        .eq('id', existing.id)
      if (error) return { error: error.message }
    } else {
      // Different reaction → switch it
      const { error } = await supabase
        .from('deliverable_reactions')
        .update({ reaction })
        .eq('id', existing.id)
      if (error) return { error: error.message }
    }
  } else {
    // No reaction yet → insert
    const { error } = await supabase
      .from('deliverable_reactions')
      .insert({ user_id: user.id, deliverable_id: deliverableId, reaction })
    if (error) return { error: error.message }
  }

  revalidatePath('/weekly')
  return { success: true }
}
