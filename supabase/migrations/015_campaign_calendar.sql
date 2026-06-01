-- Revenue campaign calendar.
-- Planned commercial moves such as upsells, launches, offers, and nurture pushes.

CREATE TABLE IF NOT EXISTS public.campaign_calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_segment text NOT NULL,
  offer text NOT NULL,
  channel text NOT NULL,
  planned_date date NOT NULL,
  end_date date,
  expected_revenue numeric,
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_calendar_status_check CHECK (
    status IN ('planned', 'in_progress', 'sent', 'won', 'lost', 'paused')
  )
);

ALTER TABLE public.campaign_calendar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign_calendar_select_own" ON public.campaign_calendar_items;
DROP POLICY IF EXISTS "campaign_calendar_insert_own" ON public.campaign_calendar_items;
DROP POLICY IF EXISTS "campaign_calendar_update_own" ON public.campaign_calendar_items;
DROP POLICY IF EXISTS "campaign_calendar_delete_own" ON public.campaign_calendar_items;

CREATE POLICY "campaign_calendar_select_own"
  ON public.campaign_calendar_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campaign_calendar_insert_own"
  ON public.campaign_calendar_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaign_calendar_update_own"
  ON public.campaign_calendar_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaign_calendar_delete_own"
  ON public.campaign_calendar_items
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_campaign_calendar_items_updated_at
  ON public.campaign_calendar_items;

CREATE TRIGGER set_campaign_calendar_items_updated_at
  BEFORE UPDATE ON public.campaign_calendar_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS campaign_calendar_user_date_idx
  ON public.campaign_calendar_items (user_id, planned_date);
