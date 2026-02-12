'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function uploadMaterial(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const categoriesRaw = formData.get('categories') as string
  const guidelinesRaw = formData.get('guidelines') as string
  const columnsRaw = formData.get('columns') as string
  const headlinesRaw = formData.get('headlines') as string
  const tagsRaw = formData.get('tags') as string
  const file = formData.get('file') as File

  let categories: string[] = []
  try {
    categories = JSON.parse(categoriesRaw || '[]')
  } catch {
    return { error: 'Invalid categories format.' }
  }

  if (!title || categories.length === 0 || !file) {
    return { error: 'Title, at least one category, and file are required.' }
  }

  if (!guidelinesRaw?.trim()) {
    return { error: 'Guidelines are required.' }
  }

  if (!columnsRaw?.trim()) {
    return { error: 'Column names are required.' }
  }

  if (!headlinesRaw?.trim()) {
    return { error: 'Headlines are required.' }
  }

  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (!allowedTypes.includes(file.type) && !['csv', 'xls', 'xlsx'].includes(ext || '')) {
    return { error: 'Only CSV and Excel (.xls, .xlsx) files are allowed.' }
  }

  if (file.size > 50 * 1024 * 1024) {
    return { error: 'File size must be under 50MB.' }
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `materials/${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file)

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const { data: urlData } = supabase.storage
    .from('materials')
    .getPublicUrl(filePath)

  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : []

  const columnsList = columnsRaw
    .split(',').map(c => c.trim()).filter(Boolean)

  const headlinesList = headlinesRaw
    .split(',').map(h => h.trim()).filter(Boolean)

  const { data, error: insertError } = await supabase
    .from('materials')
    .insert({
      title,
      description: description || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type || `application/${ext}`,
      file_size: file.size,
      categories,
      guidelines: guidelinesRaw.trim(),
      columns: columnsList,
      headlines: headlinesList,
      tags,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return { error: `Failed to save material: ${insertError.message}` }
  }

  redirect(`/materials/${data.id}`)
}

export async function deleteMaterial(materialId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if admin
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
