CREATE TABLE IF NOT EXISTS insights (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL,
  title        text        NOT NULL,
  description  text        NOT NULL,
  severity     text        NOT NULL DEFAULT 'info',
  is_read      boolean     NOT NULL DEFAULT false,
  is_dismissed boolean     NOT NULL DEFAULT false,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insights_select_own" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insights_insert_own" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insights_update_own" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "insights_delete_own" ON insights
  FOR DELETE USING (auth.uid() = user_id);
