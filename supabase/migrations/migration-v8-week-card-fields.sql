-- ============================================
-- AI Training Platform — Migration V8
-- 1. Create week_content table (if not exists)
-- 2. Add title + description columns
-- 3. Seed from hardcoded values
-- 4. Create deliverables table (if not exists)
-- 5. Fix Reference/REFERENCE case mismatch in materials
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── week_content table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.week_content (
  week               text PRIMARY KEY,
  objectives         text[],
  homework           text,
  deliverable_prompt text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Add title and description columns (idempotent)
ALTER TABLE public.week_content
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS description text;

-- Seed / update title + description for all weeks
INSERT INTO public.week_content (week, title, description) VALUES
  ('Week 1',    'Week 1',    'AI Foundations & Strategic Thinking'),
  ('Week 2',    'Week 2',    'Prompt Engineering & Practical Skills'),
  ('Week 3',    'Week 3',    'Workflow Automation & Productivity'),
  ('Week 4',    'Week 4',    'Advanced Applications & Product Use Cases'),
  ('Week 5',    'Week 5',    'AI-Assisted Development & Coding'),
  ('Week 6',    'Week 6',    'Organizational Impact & Change Management'),
  ('Week 7',    'Week 7',    'Advanced AI Systems & Architecture'),
  ('Week 8',    'Week 8',    'Scaling AI Across Teams & Processes'),
  ('Week 9',    'Week 9',    'Capstone — Synthesis & Future Directions'),
  ('Reference', 'Reference', 'Tools, Platforms & Ongoing Resources')
ON CONFLICT (week) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at  = now();

-- RLS: enable and allow authenticated reads, admin writes
ALTER TABLE public.week_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "week_content_select" ON public.week_content;
CREATE POLICY "week_content_select"
  ON public.week_content FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "week_content_insert_update" ON public.week_content;
CREATE POLICY "week_content_insert_update"
  ON public.week_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ─── deliverables table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deliverables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week       text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week)
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliverables_select_own" ON public.deliverables;
CREATE POLICY "deliverables_select_own"
  ON public.deliverables FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "deliverables_insert_own" ON public.deliverables;
CREATE POLICY "deliverables_insert_own"
  ON public.deliverables FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deliverables_update_own" ON public.deliverables;
CREATE POLICY "deliverables_update_own"
  ON public.deliverables FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── Change 4: fix Reference case mismatch in materials ──────────────────────

-- Normalize 'REFERENCE', 'reference', etc. → 'Reference'
UPDATE public.materials
SET week = 'Reference'
WHERE LOWER(week) = 'reference' AND week != 'Reference';

-- Remap legacy 'Optional' values → 'Reference'
UPDATE public.materials
SET week = 'Reference'
WHERE week = 'Optional';

-- ─── Verify ──────────────────────────────────────────────────────────────────

SELECT week, title, description
FROM public.week_content
ORDER BY week;

SELECT week, COUNT(*) as material_count
FROM public.materials
WHERE week IS NOT NULL
GROUP BY week
ORDER BY week;
