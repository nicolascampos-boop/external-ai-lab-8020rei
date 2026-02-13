-- ============================================
-- AI Training Platform - V6 Migration
-- Prevent Duplicate Materials by Link
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. First, let's find and mark duplicates (keep the oldest one)
-- This will help you identify which duplicates to delete manually

CREATE TEMP TABLE duplicate_links AS
SELECT link, MIN(created_at) as first_created
FROM public.materials
WHERE link IS NOT NULL AND link != ''
GROUP BY link
HAVING COUNT(*) > 1;

-- 2. Show duplicates (for manual review before deletion)
-- You can run this to see what will be affected:
-- SELECT m.id, m.title, m.link, m.created_at,
--        CASE WHEN m.created_at = d.first_created THEN 'KEEP' ELSE 'DELETE' END as action
-- FROM public.materials m
-- JOIN duplicate_links d ON m.link = d.link
-- ORDER BY m.link, m.created_at;

-- 3. Delete duplicates (keeping only the oldest entry for each link)
-- UNCOMMENT THE LINES BELOW TO DELETE DUPLICATES:
-- DELETE FROM public.materials m
-- USING duplicate_links d
-- WHERE m.link = d.link
-- AND m.created_at > d.first_created;

-- 4. Add unique constraint on link column (prevents future duplicates)
-- Note: This will fail if duplicates still exist, so run step 3 first
ALTER TABLE public.materials ADD CONSTRAINT materials_link_unique UNIQUE (link);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_materials_link ON public.materials(link) WHERE link IS NOT NULL;

-- ============================================
-- DONE! Duplicate prevention enabled.
--
-- IMPORTANT: Before running this migration:
-- 1. Review duplicates by running the SELECT query in step 2
-- 2. Uncomment and run the DELETE statement in step 3
-- 3. Then run the ALTER TABLE in step 4
--
-- If you get an error on step 4, it means duplicates still exist.
-- ============================================
