import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const redirectBase = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (!authError && data.user) {
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

      return NextResponse.redirect(`${redirectBase}${next}`)
    }

    const errorMsg = authError ? authError.message : 'user_not_found'
    return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  return NextResponse.redirect(`${redirectBase}/login?error=no_code_received`)
}
