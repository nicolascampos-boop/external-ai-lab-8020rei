import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const CONTENT_TYPE_COLORS: Record<string, string> = {
  'Video': 'bg-rose-100 text-rose-700',
  'Documentation': 'bg-blue-100 text-blue-700',
  'Course': 'bg-purple-100 text-purple-700',
  'Platform': 'bg-indigo-100 text-indigo-700',
  'Community': 'bg-green-100 text-green-700',
  'Social Media Post': 'bg-pink-100 text-pink-700',
  'Article': 'bg-amber-100 text-amber-700',
  'Case Study': 'bg-teal-100 text-teal-700',
}

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; week?: string }>
}

export default async function MaterialDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const search = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Determine back link based on referrer
  const backHref = search.from === 'weekly' && search.week
    ? `/weekly?week=${encodeURIComponent(search.week)}`
    : search.from === 'dashboard'
      ? '/dashboard'
      : '/library'
  const backLabel = search.from === 'weekly'
    ? 'Back to Weekly Training'
    : search.from === 'dashboard'
      ? 'Back to Dashboard'
      : 'Back to Library'

  // Get material with scores
  const { data: material } = await supabase
    .from('material_scores')
    .select('*')
    .eq('id', id)
    .single()

  if (!material) notFound()

  // Record that this user opened the material (fire-and-forget, never blocks render)
  const viewSource = ['weekly', 'library', 'dashboard'].includes(search.from ?? '')
    ? (search.from as string)
    : 'other'
  supabase.from('material_views').insert({
    user_id: user!.id,
    material_id: id,
    material_week: material.week ?? null,
    source: viewSource,
  }).then(() => {})


  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </Link>

      <div className="grid grid-cols-1 gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Material info */}
          <div className="bg-card rounded-xl border border-border p-6">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {material.material_tier === 'core' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                  💎 Core
                </span>
              )}
              {material.material_tier === 'reference' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                  📌 Reference
                </span>
              )}
              {material.content_type && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                  CONTENT_TYPE_COLORS[material.content_type] || 'bg-gray-100 text-gray-600'
                }`}>
                  {material.content_type}
                </span>
              )}
              {(material.categories || []).map((cat: string) => (
                <span key={cat} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {cat}
                </span>
              ))}
              {material.week && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-violet-100 text-violet-700">
                  {material.week}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>

            {material.description && (
              <p className="text-muted mt-3">{material.description}</p>
            )}

            {material.justification_for_assignment && (
              <blockquote className="mt-3 pl-4 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg py-2 pr-3">
                <p className="text-sm text-amber-800 italic leading-relaxed">{material.justification_for_assignment}</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Why this was assigned</p>
              </blockquote>
            )}

            {/* Resource link - prominent */}
            {material.link && (
              <a
                href={material.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:underline">Open Resource</p>
                  <p className="text-xs text-muted truncate">{material.link}</p>
                </div>
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}

            {/* Material details grid */}
            <div className="flex flex-wrap gap-4 mt-4">
              {material.estimated_time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{material.estimated_time}</span>
                </div>
              )}
              {material.week && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{material.week}</span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-border text-sm text-muted">
              <span>Added {new Date(material.created_at).toLocaleDateString()}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
