-- ============================================
-- AI Training Platform - V11 Migration
-- Add notes column to week_deliverables and make link optional
-- Run this in Supabase SQL Editor
-- ============================================

-- Add optional notes column for text-based deliverable descriptions
ALTER TABLE public.week_deliverables
  ADD COLUMN IF NOT EXISTS notes text;

-- Make link nullable so users can submit a text description without a URL
ALTER TABLE public.week_deliverables
  ALTER COLUMN link DROP NOT NULL;

-- ============================================
-- DONE! Summary of changes:
-- - week_deliverables.notes: text (nullable) — free-text description / reflection
-- - week_deliverables.link: now nullable — a link OR notes must be provided (enforced in app)
-- ============================================
