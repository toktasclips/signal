-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  type       text        NOT NULL,
  source     text,
  budget     numeric,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_update_own" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "campaigns_delete_own" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add campaign_id to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
