'use client'

import SignOutButton from '@/components/auth/SignOutButton'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface HeaderProps {
  profile: Profile | null
}

export default function Header({ profile }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">AI Training Platform</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">
                  {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {profile?.full_name || profile?.email}
              </div>
              <div className="text-gray-500 text-xs capitalize">{profile?.role}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
