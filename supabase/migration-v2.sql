-- ============================================
-- AI Training Platform - V2 Migration
-- Individual materials from CSV/Excel rows
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add new columns for individual material fields
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS week text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS estimated_time text;

-- 2. Make file-related columns nullable (materials are now parsed from rows, not stored as files)
ALTER TABLE public.materials ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE public.materials ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE public.materials ALTER COLUMN file_type DROP NOT NULL;
ALTER TABLE public.materials ALTER COLUMN file_size DROP NOT NULL;

-- 3. Set defaults for existing file columns
ALTER TABLE public.materials ALTER COLUMN file_url SET DEFAULT null;
ALTER TABLE public.materials ALTER COLUMN file_name SET DEFAULT null;
ALTER TABLE public.materials ALTER COLUMN file_type SET DEFAULT null;
ALTER TABLE public.materials ALTER COLUMN file_size SET DEFAULT null;

-- 4. Recreate the material_scores view to include new columns
DROP VIEW IF EXISTS public.material_scores;

CREATE OR REPLACE VIEW public.material_scores AS
SELECT
  m.*,
  coalesce(avg(v.quality_score), 0)::numeric(3,1) as avg_quality,
  coalesce(avg(v.relevance_score), 0)::numeric(3,1) as avg_relevance,
  coalesce((avg(v.quality_score) + avg(v.relevance_score)) / 2, 0)::numeric(3,1) as avg_overall,
  count(v.id)::integer as vote_count
FROM public.materials m
LEFT JOIN public.votes v ON v.material_id = m.id
GROUP BY m.id;

-- ============================================
-- DONE! The view now includes link, content_type, week, estimated_time
-- ============================================
