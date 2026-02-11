'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Plus,
  Download,
  Shield,
  Users,
  Activity,
} from 'lucide-react'

interface SidebarProps {
  role: 'admin' | 'member'
}

const memberLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/library', label: 'Master Library', icon: BookOpen },
  { href: '/weekly', label: 'Weekly Plans', icon: Calendar },
]

const adminLinks = [
  { href: '/add', label: 'Add Content', icon: Plus },
  { href: '/import', label: 'Bulk Import', icon: Download },
]

const adminPanelLinks = [
  { href: '/admin', label: 'Admin Overview', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity },
]

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-3">
        <h2 className="text-lg font-bold text-gray-900">AI Training</h2>
        <p className="text-xs text-gray-500">Learning Platform</p>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Browse
          </p>
          {memberLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        {role === 'admin' && (
          <>
            <div className="mb-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Manage Content
              </p>
              {adminLinks.map(link => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="mb-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin Panel
              </p>
              {adminPanelLinks.map(link => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="px-3 py-2 text-xs text-gray-400">
          {role === 'admin' ? 'Admin' : 'Member'} access
        </div>
      </div>
    </aside>
  )
}
