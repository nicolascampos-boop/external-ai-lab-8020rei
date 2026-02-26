-- ============================================
-- V18 — Security fixes flagged by Supabase Advisor
-- 1. material_scores view: add security_invoker = true
-- 2. handle_new_user function: pin search_path
-- ============================================

-- ── Fix 1: Recreate material_scores with security_invoker ────────────────────
-- By default, views use the *owner's* permissions (SECURITY DEFINER behaviour).
-- With security_invoker = true the view instead checks RLS policies of the
-- querying user, which is what we want.

DROP VIEW IF EXISTS public.material_scores;

CREATE VIEW public.material_scores
WITH (security_invoker = true)
AS
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


-- ── Fix 2: Pin search_path on handle_new_user ────────────────────────────────
-- The function is SECURITY DEFINER (necessary: it inserts into public.profiles
-- from a trigger on auth.users). Without a fixed search_path, it is vulnerable
-- to search-path injection.  Setting it to '' forces all references to be
-- schema-qualified (they already are).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
