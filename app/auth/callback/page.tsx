'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const code = new URLSearchParams(window.location.search).get('code')

    if (!code) {
      router.replace('/login?error=no_code_received')
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error || !data.user) {
        router.replace('/login?error=' + encodeURIComponent(error?.message ?? 'auth_failed'))
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        })
      }

      router.replace('/dashboard')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-muted">Completing sign in...</p>
    </div>
  )
}
