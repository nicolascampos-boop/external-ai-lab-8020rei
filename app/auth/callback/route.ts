import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code_received`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`
    )
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

  return NextResponse.redirect(`${origin}/dashboard`)
}
