CREATE TABLE IF NOT EXISTS relationship_insights (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                text        NOT NULL,
  title               text        NOT NULL,
  description         text        NOT NULL,
  recommendation      text,
  severity            text        NOT NULL DEFAULT 'info',
  is_read             boolean     NOT NULL DEFAULT false,
  is_dismissed        boolean     NOT NULL DEFAULT false,
  related_lead_id     uuid        REFERENCES leads(id) ON DELETE SET NULL,
  related_campaign_id uuid        REFERENCES campaigns(id) ON DELETE SET NULL,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

ALTER TABLE relationship_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_insights_select_own" ON relationship_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rel_insights_insert_own" ON relationship_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rel_insights_update_own" ON relationship_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rel_insights_delete_own" ON relationship_insights
  FOR DELETE USING (auth.uid() = user_id);
