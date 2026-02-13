-- ============================================
-- AI Training Platform - V3 Migration
-- Enhanced Review System with Comments and Reactions
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add comment field to votes table
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS comment text;

-- 2. Add initial quality and relevance scores to materials table
-- (for materials imported with separate quality/relevance columns)
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS initial_quality numeric(3,1);
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS initial_relevance numeric(3,1);

-- 3. Create vote_reactions table for like/dislike on reviews
CREATE TABLE IF NOT EXISTS public.vote_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id uuid REFERENCES public.votes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vote_id, user_id)
);

-- 4. Enable RLS for vote_reactions
ALTER TABLE public.vote_reactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for vote_reactions
CREATE POLICY "Vote reactions are viewable by authenticated users"
  ON public.vote_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.vote_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
  ON public.vote_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON public.vote_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Recreate material_scores view to include new fields
DROP VIEW IF EXISTS public.material_scores;

CREATE OR REPLACE VIEW public.material_scores AS
SELECT
  m.*,
  COALESCE(AVG(v.quality_score), 0)::numeric(3,1) AS avg_quality,
  COALESCE(AVG(v.relevance_score), 0)::numeric(3,1) AS avg_relevance,
  COALESCE((AVG(v.quality_score) + AVG(v.relevance_score)) / 2, 0)::numeric(3,1) AS avg_overall,
  COUNT(v.id)::integer AS vote_count
FROM public.materials m
LEFT JOIN public.votes v ON v.material_id = m.id
GROUP BY m.id;

-- ============================================
-- DONE! New features added:
-- - Review comments (optional text with each vote)
-- - Initial quality/relevance scores (for imported materials)
-- - Vote reactions (like/dislike on reviews)
-- ============================================
