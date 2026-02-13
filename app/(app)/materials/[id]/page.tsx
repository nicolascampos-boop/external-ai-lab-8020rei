import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VoteWidget from '@/components/vote-widget'
import ReviewReactions from '@/components/review-reactions'

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
    .select('quality_score, relevance_score, comment')
    .eq('material_id', id)
    .eq('user_id', user!.id)
    .single()

  // Get all votes for this material
  const { data: votes } = await supabase
    .from('votes')
    .select('id, quality_score, relevance_score, comment, created_at, user_id, profiles(full_name, email)')
    .eq('material_id', id)
    .order('created_at', { ascending: false })

  // Get reaction counts and user reactions for each vote
  const voteIds = votes?.map(v => v.id) || []
  const { data: reactions } = voteIds.length > 0
    ? await supabase
        .from('vote_reactions')
        .select('vote_id, user_id, reaction')
        .in('vote_id', voteIds)
    : { data: [] }

  // Calculate reaction counts and user reactions per vote
  const reactionsByVote = (reactions || []).reduce((acc, r) => {
    if (!acc[r.vote_id]) {
      acc[r.vote_id] = { likes: 0, dislikes: 0, userReaction: null }
    }
    if (r.reaction === 'like') acc[r.vote_id].likes++
    if (r.reaction === 'dislike') acc[r.vote_id].dislikes++
    if (r.user_id === user!.id) acc[r.vote_id].userReaction = r.reaction
    return acc
  }, {} as Record<string, { likes: number; dislikes: number; userReaction: 'like' | 'dislike' | null }>)

  const overallScore = material.vote_count > 0
    ? ((material.avg_quality + material.avg_relevance) / 2).toFixed(1)
    : material.initial_score
      ? material.initial_score.toFixed(1)
      : null

  const scoreLabel = material.vote_count > 0 ? 'Overall Score' : material.initial_score ? 'Total Score' : 'No Score Yet'

  // Get quality and relevance for imported materials
  const displayQuality = material.vote_count > 0
    ? material.avg_quality.toFixed(1)
    : material.initial_quality?.toFixed(1) ?? '—'
  const displayRelevance = material.vote_count > 0
    ? material.avg_relevance.toFixed(1)
    : material.initial_relevance?.toFixed(1) ?? '—'

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
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
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
              {material.initial_score && material.vote_count === 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>
                    Total score: {material.initial_score.toFixed(1)}/5
                    {material.initial_quality && material.initial_relevance && (
                      <span className="text-muted ml-1">
                        (Q: {material.initial_quality.toFixed(1)}, R: {material.initial_relevance.toFixed(1)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-border text-sm text-muted">
              <span>Uploaded by {uploader?.full_name || uploader?.email || 'Unknown'}</span>
              <span>{new Date(material.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Reviews list */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Reviews ({material.vote_count})
            </h3>
            {votes && votes.length > 0 ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {votes.map((vote: any) => {
                  const profile = Array.isArray(vote.profiles) ? vote.profiles[0] : vote.profiles
                  const reviewDate = new Date(vote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                  const voteReactions = reactionsByVote[vote.id] || { likes: 0, dislikes: 0, userReaction: null }
                  return (
                  <div key={vote.id} className="pb-4 border-b border-border last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {profile?.full_name || profile?.email || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted">•</span>
                            <span className="text-xs text-muted">{reviewDate}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted">Quality: {vote.quality_score}/5</span>
                            <span className="text-xs text-muted">Relevance: {vote.relevance_score}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {vote.comment && (
                      <p className="text-sm text-gray-700 mt-2 ml-11">{vote.comment}</p>
                    )}
                    <div className="mt-3 ml-11">
                      <ReviewReactions
                        voteId={vote.id}
                        initialLikes={voteReactions.likes}
                        initialDislikes={voteReactions.dislikes}
                        userReaction={voteReactions.userReaction}
                      />
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
            <p className="text-sm text-muted mt-3">{scoreLabel}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900">{displayQuality}</p>
                <p className="text-muted text-xs">Quality</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{displayRelevance}</p>
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
