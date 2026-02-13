'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface ParsedMaterial {
  title: string
  link?: string
  description?: string
  content_type?: string
  categories: string[]
  initial_score?: number
  initial_quality?: number
  initial_relevance?: number
  week?: string
  estimated_time?: string
}

export async function uploadMaterials(materials: ParsedMaterial[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!materials || materials.length === 0) {
    return { error: 'No materials to upload.' }
  }

  // Validate each material has at least a title
  for (let i = 0; i < materials.length; i++) {
    if (!materials[i].title?.trim()) {
      return { error: `Row ${i + 1} is missing a name/title.` }
    }
  }

  const rows = materials.map(m => ({
    title: m.title.trim(),
    link: m.link?.trim() || null,
    description: m.description?.trim() || null,
    content_type: m.content_type?.trim() || null,
    categories: m.categories.length > 0 ? m.categories : [],
    initial_score: m.initial_score ?? null,
    initial_quality: m.initial_quality ?? null,
    initial_relevance: m.initial_relevance ?? null,
    week: m.week?.trim() || null,
    estimated_time: m.estimated_time?.trim() || null,
    uploaded_by: user.id,
  }))

  // Batch insert in groups of 50
  const batchSize = 50
  let totalInserted = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error: insertError } = await supabase
      .from('materials')
      .insert(batch)

    if (insertError) {
      return { error: `Failed to insert batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}` }
    }
    totalInserted += batch.length
  }

  revalidatePath('/library')
  revalidatePath('/dashboard')

  return { success: true, count: totalInserted }
}

export async function deleteMaterial(materialId: string) {
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
    .from('materials')
    .delete()
    .eq('id', materialId)

  if (error) return { error: error.message }

  redirect('/library')
}

export async function bulkDeleteMaterials(materialIds: string[]) {
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

  if (!materialIds || materialIds.length === 0) {
    return { error: 'No materials selected.' }
  }

  const { error } = await supabase
    .from('materials')
    .delete()
    .in('id', materialIds)

  if (error) return { error: error.message }

  revalidatePath('/library')
  revalidatePath('/dashboard')

  return { success: true, count: materialIds.length }
}
