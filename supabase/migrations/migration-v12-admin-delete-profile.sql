-- ============================================
-- AI Training Platform - V12 Migration
-- Add DELETE policy for admins on profiles table
-- Run this in Supabase SQL Editor
-- ============================================

-- The profiles table was missing a DELETE policy for admins,
-- causing profile deletion to be silently blocked by RLS.

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- DONE! Admins can now delete user profiles.
-- ============================================
