-- Week session recordings
-- Admins can add links to recordings for weekly sessions, team sessions, and speaker conversations.

CREATE TABLE IF NOT EXISTS week_sessions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week         text NOT NULL,
  title        text NOT NULL,
  link         text NOT NULL,
  session_type text NOT NULL DEFAULT 'weekly',  -- 'weekly' | 'team' | 'speaker'
  description  text,
  session_date date,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE week_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can view recordings
CREATE POLICY "week_sessions_select"
  ON week_sessions FOR SELECT
  USING (true);

-- Only admins can add recordings
CREATE POLICY "week_sessions_insert"
  ON week_sessions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete recordings
CREATE POLICY "week_sessions_delete"
  ON week_sessions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
