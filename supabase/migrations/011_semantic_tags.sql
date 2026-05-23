CREATE TABLE IF NOT EXISTS semantic_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  source_type text NOT NULL, -- 'lead_note' | 'quick_note' | 'lost_reason' | 'task_description'
  source_id uuid,             -- lead.id or task.id
  tag text NOT NULL,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS semantic_tags_user_id_idx ON semantic_tags(user_id);
CREATE INDEX IF NOT EXISTS semantic_tags_lead_id_idx ON semantic_tags(lead_id);
CREATE INDEX IF NOT EXISTS semantic_tags_tag_idx ON semantic_tags(tag);

ALTER TABLE semantic_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON semantic_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON semantic_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON semantic_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON semantic_tags FOR DELETE USING (auth.uid() = user_id);
