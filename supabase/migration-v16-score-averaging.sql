-- ============================================
-- AI Training Platform - V16 Migration
-- 1. Score Averaging: treat initial_quality/relevance as a baseline data point
--    so community votes are averaged together with the initial score.
-- 2. Comment Replies: allow threaded sub-comments on reviews.
-- ============================================

-- ── Part 2: vote_replies table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vote_replies (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id    uuid REFERENCES public.votes(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vote_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vote_replies_select"
  ON public.vote_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "vote_replies_insert"
  ON public.vote_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vote_replies_delete"
  ON public.vote_replies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── Part 1: Updated material_scores view ───────────────────────────────────

-- Recreate material_scores view with blended initial + community scores.
-- When a material has initial_quality/initial_relevance, those values are
-- included as one extra "vote" in the running average.
DROP VIEW IF EXISTS public.material_scores;

CREATE OR REPLACE VIEW public.material_scores AS
WITH vote_agg AS (
  SELECT
    material_id,
    SUM(quality_score)::numeric   AS sum_quality,
    SUM(relevance_score)::numeric AS sum_relevance,
    COUNT(id)::integer            AS vote_count
  FROM public.votes
  GROUP BY material_id
)
SELECT
  m.*,

  -- avg_quality: blend initial_quality as baseline when present
  CASE
    WHEN m.initial_quality IS NOT NULL THEN
      ((COALESCE(va.sum_quality, 0) + m.initial_quality) / (COALESCE(va.vote_count, 0) + 1))
    WHEN COALESCE(va.vote_count, 0) > 0 THEN
      va.sum_quality / va.vote_count
    ELSE 0
  END::numeric(3,1) AS avg_quality,

  -- avg_relevance: blend initial_relevance as baseline when present
  CASE
    WHEN m.initial_relevance IS NOT NULL THEN
      ((COALESCE(va.sum_relevance, 0) + m.initial_relevance) / (COALESCE(va.vote_count, 0) + 1))
    WHEN COALESCE(va.vote_count, 0) > 0 THEN
      va.sum_relevance / va.vote_count
    ELSE 0
  END::numeric(3,1) AS avg_relevance,

  -- avg_overall: average of the two blended scores
  CASE
    WHEN m.initial_quality IS NOT NULL AND m.initial_relevance IS NOT NULL THEN
      (
        (COALESCE(va.sum_quality, 0) + m.initial_quality) / (COALESCE(va.vote_count, 0) + 1) +
        (COALESCE(va.sum_relevance, 0) + m.initial_relevance) / (COALESCE(va.vote_count, 0) + 1)
      ) / 2
    WHEN m.initial_quality IS NOT NULL THEN
      (COALESCE(va.sum_quality, 0) + m.initial_quality) / (COALESCE(va.vote_count, 0) + 1)
    WHEN m.initial_relevance IS NOT NULL THEN
      (COALESCE(va.sum_relevance, 0) + m.initial_relevance) / (COALESCE(va.vote_count, 0) + 1)
    WHEN COALESCE(va.vote_count, 0) > 0 THEN
      (va.sum_quality + va.sum_relevance) / (2 * va.vote_count)
    ELSE 0
  END::numeric(3,1) AS avg_overall,

  COALESCE(va.vote_count, 0)::integer AS vote_count

FROM public.materials m
LEFT JOIN vote_agg va ON va.material_id = m.id;
