CREATE TABLE IF NOT EXISTS events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id      uuid        REFERENCES leads(id) ON DELETE SET NULL,
  task_id      uuid        REFERENCES tasks(id) ON DELETE SET NULL,
  campaign_id  uuid        REFERENCES campaigns(id) ON DELETE SET NULL,
  type         text        NOT NULL,
  title        text        NOT NULL,
  description  text,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert_own" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_delete_own" ON events
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX events_user_created_idx ON events (user_id, created_at DESC);
