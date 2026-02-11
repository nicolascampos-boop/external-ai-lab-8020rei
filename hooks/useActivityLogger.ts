'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './useUser'

export function useActivityLogger() {
  const { user } = useUser()

  const logActivity = useCallback(async (
    actionType: 'view' | 'add' | 'edit' | 'delete',
    resourceId?: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return

    const supabase = createClient()
    await supabase.from('user_activity').insert({
      user_id: user.id,
      action_type: actionType,
      resource_id: resourceId ?? null,
      metadata: metadata ?? {},
    })
  }, [user])

  return { logActivity }
}
