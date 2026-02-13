'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReaction(
  voteId: string,
  reaction: 'like' | 'dislike' | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get the material_id from the vote to revalidate the page
  const { data: vote } = await supabase
    .from('votes')
    .select('material_id')
    .eq('id', voteId)
    .single()

  if (!vote) return { error: 'Vote not found' }

  if (reaction === null) {
    // Remove reaction
    const { error } = await supabase
      .from('vote_reactions')
      .delete()
      .eq('vote_id', voteId)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
  } else {
    // Add or update reaction
    const { error } = await supabase
      .from('vote_reactions')
      .upsert(
        {
          vote_id: voteId,
          user_id: user.id,
          reaction,
        },
        { onConflict: 'vote_id,user_id' }
      )

    if (error) return { error: error.message }
  }

  revalidatePath(`/materials/${vote.material_id}`)

  return { success: true }
}
