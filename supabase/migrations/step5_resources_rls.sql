-- STEP 5: Add added_by column and RLS to resources
-- Paste ONLY this block into Supabase SQL Editor and click "Run"
-- ================================================================

ALTER TABLE public.resources
  ADD COLUMN added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resources"
  ON public.resources FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update resources"
  ON public.resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete resources"
  ON public.resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
