-- Deliverable reactions: users can like or dislike a week deliverable submission.
-- One reaction per user per deliverable (can switch between like/dislike).

CREATE TABLE IF NOT EXISTS deliverable_reactions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  deliverable_id uuid REFERENCES week_deliverables(id) ON DELETE CASCADE NOT NULL,
  reaction       text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, deliverable_id)
);

ALTER TABLE deliverable_reactions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read reactions
CREATE POLICY "deliverable_reactions_select"
  ON deliverable_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own reactions
CREATE POLICY "deliverable_reactions_insert"
  ON deliverable_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions (switch like ↔ dislike)
CREATE POLICY "deliverable_reactions_update"
  ON deliverable_reactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "deliverable_reactions_delete"
  ON deliverable_reactions FOR DELETE
  USING (auth.uid() = user_id);
