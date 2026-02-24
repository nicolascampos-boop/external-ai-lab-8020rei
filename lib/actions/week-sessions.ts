'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWeekSession(
  week: string,
  title: string,
  link: string,
  sessionType: string,
  description?: string,
  sessionDate?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const trimmedTitle = title.trim()
  const trimmedLink = link.trim()
  if (!trimmedTitle) return { error: 'Title is required' }
  if (!trimmedLink) return { error: 'Link is required' }
  try { new URL(trimmedLink) } catch { return { error: 'Please enter a valid URL' } }

  const { error } = await supabase.from('week_sessions').insert({
    week,
    title: trimmedTitle,
    link: trimmedLink,
    session_type: sessionType,
    description: description?.trim() || null,
    session_date: sessionDate?.trim() || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/weekly')
  return { success: true }
}

export async function deleteWeekSession(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await supabase
    .from('week_sessions')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/weekly')
  return { success: true }
}
