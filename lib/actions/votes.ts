'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitVote(
  materialId: string,
  qualityScore: number,
  relevanceScore: number,
  comment?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (qualityScore < 1 || qualityScore > 5 || relevanceScore < 1 || relevanceScore > 5) {
    return { error: 'Scores must be between 1 and 5' }
  }

  const { error } = await supabase
    .from('votes')
    .upsert(
      {
        material_id: materialId,
        user_id: user.id,
        quality_score: qualityScore,
        relevance_score: relevanceScore,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'material_id,user_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/materials/${materialId}`)
  revalidatePath('/dashboard')
  revalidatePath('/library')

  return { success: true }
}
