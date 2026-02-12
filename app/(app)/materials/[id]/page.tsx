import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VoteWidget from '@/components/vote-widget'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaterialDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get material with scores
  const { data: material } = await supabase
    .from('material_scores')
    .select('*')
    .eq('id', id)
    .single()

  if (!material) notFound()

  // Get uploader info
  const { data: uploader } = material.uploaded_by
    ? await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', material.uploaded_by)
        .single()
    : { data: null }

  // Get current user's vote
  const { data: existingVote } = await supabase
    .from('votes')
    .select('quality_score, relevance_score')
    .eq('material_id', id)
    .eq('user_id', user!.id)
    .single()

  // Get all votes for this material
  const { data: votes } = await supabase
    .from('votes')
    .select('quality_score, relevance_score, user_id, profiles(full_name, email)')
    .eq('material_id', id)
    .order('created_at', { ascending: false })

  const fileIcon = material.file_type.includes('pdf') ? 'PDF' : 'DOCX'
  const overallScore = material.vote_count > 0
    ? ((material.avg_quality + material.avg_relevance) / 2).toFixed(1)
    : null

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Material info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                fileIcon === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {fileIcon}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {material.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>

            {material.description && (
              <p className="text-muted mt-3">{material.description}</p>
            )}

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {material.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-3 py-1 bg-primary/5 text-primary rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-border text-sm text-muted">
              <span>Uploaded by {uploader?.full_name || uploader?.email || 'Unknown'}</span>
              <span>{new Date(material.created_at).toLocaleDateString()}</span>
              <span>{(material.file_size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>

            {/* Download button */}
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {fileIcon}
            </a>
          </div>

          {/* Reviews list */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Reviews ({material.vote_count})
            </h3>
            {votes && votes.length > 0 ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {votes.map((vote: any) => {
                  const profile = Array.isArray(vote.profiles) ? vote.profiles[0] : vote.profiles
                  return (
                  <div key={vote.user_id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {profile?.full_name || profile?.email || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>Quality: {vote.quality_score}/5</span>
                      <span>Relevance: {vote.relevance_score}/5</span>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted text-sm">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score summary */}
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl font-bold ${
              !overallScore
                ? 'bg-gray-100 text-gray-400'
                : Number(overallScore) >= 4
                  ? 'bg-green-100 text-green-700'
                  : Number(overallScore) >= 3
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
            }`}>
              {overallScore || '—'}
            </div>
            <p className="text-sm text-muted mt-3">Overall Score</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900">
                  {material.vote_count > 0 ? material.avg_quality.toFixed(1) : '—'}
                </p>
                <p className="text-muted text-xs">Quality</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {material.vote_count > 0 ? material.avg_relevance.toFixed(1) : '—'}
                </p>
                <p className="text-muted text-xs">Relevance</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{material.vote_count}</p>
                <p className="text-muted text-xs">Votes</p>
              </div>
            </div>
          </div>

          {/* Vote widget */}
          <VoteWidget materialId={id} existingVote={existingVote} />
        </div>
      </div>
    </div>
  )
}
