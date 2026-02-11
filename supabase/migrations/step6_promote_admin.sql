-- STEP 6: Promote yourself to admin
-- Replace 'your-email@gmail.com' with YOUR actual email
-- Paste ONLY this block into Supabase SQL Editor and click "Run"
-- ================================================================

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@gmail.com';
