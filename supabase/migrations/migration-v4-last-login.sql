-- ============================================
-- AI Training Platform - V4 Migration
-- Add Last Login Tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add last_login column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- 2. Create index for faster queries on last_login
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login DESC);

-- 3. Update last_login for existing users to their created_at (initial value)
UPDATE public.profiles SET last_login = created_at WHERE last_login IS NULL;

-- ============================================
-- DONE! Last login tracking enabled.
-- - last_login column added to profiles
-- - Indexed for performance
-- - Existing users initialized with their join date
-- ============================================
