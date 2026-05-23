CREATE TABLE IF NOT EXISTS business_context (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name         text,
  niche                 text,
  offer_type            text,
  sales_model           text,
  target_audience       text,
  acquisition_channel   text,
  average_offer_value   numeric(12, 2),
  sales_cycle           text,
  primary_goal          text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE business_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "context_select_own" ON business_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "context_insert_own" ON business_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "context_update_own" ON business_context
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_business_context_updated_at
  BEFORE UPDATE ON business_context
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
