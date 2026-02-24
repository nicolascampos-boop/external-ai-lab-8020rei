'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReply(voteId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 1000) return { error: 'Reply must be between 1 and 1000 characters' }

  // Get material_id so we can revalidate the page
  const { data: vote } = await supabase
    .from('votes')
    .select('material_id')
    .eq('id', voteId)
    .single()

  if (!vote) return { error: 'Review not found' }

  const { error } = await supabase.from('vote_replies').insert({
    vote_id: voteId,
    user_id: user.id,
    content: trimmed,
  })

  if (error) return { error: error.message }

  revalidatePath(`/materials/${vote.material_id}`)
  return { success: true }
}

export async function deleteReply(replyId: string, materialId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vote_replies')
    .delete()
    .eq('id', replyId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/materials/${materialId}`)
  return { success: true }
}
