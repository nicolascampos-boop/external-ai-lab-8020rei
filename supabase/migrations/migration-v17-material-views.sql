-- Track every time an authenticated user opens a material detail page.
-- Admins can read all rows for engagement analytics; users can only insert/read their own.

CREATE TABLE IF NOT EXISTS material_views (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  material_id   uuid        NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  material_week text,                              -- snapshot of materials.week at view time
  source        text        NOT NULL DEFAULT 'other'
                            CHECK (source IN ('weekly', 'library', 'dashboard', 'other')),
  viewed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON material_views (user_id);
CREATE INDEX ON material_views (material_id);
CREATE INDEX ON material_views (material_week);
CREATE INDEX ON material_views (viewed_at);

ALTER TABLE material_views ENABLE ROW LEVEL SECURITY;

-- Users can record their own page views
CREATE POLICY "Users can insert own views"
  ON material_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own views
CREATE POLICY "Users can read own views"
  ON material_views FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all views (for the Engagement analytics tab)
CREATE POLICY "Admins can read all views"
  ON material_views FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
