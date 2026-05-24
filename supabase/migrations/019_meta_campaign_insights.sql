-- Campaign-level Meta/Facebook Ads source data.
-- External ad-platform data is kept separate from manual KPI dashboards.

CREATE TABLE IF NOT EXISTS public.meta_ads_campaign_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start, period_end, campaign_id)
);

ALTER TABLE public.meta_ads_campaign_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meta_ads_campaign_insights_select_own"
  ON public.meta_ads_campaign_insights;
DROP POLICY IF EXISTS "meta_ads_campaign_insights_insert_own"
  ON public.meta_ads_campaign_insights;
DROP POLICY IF EXISTS "meta_ads_campaign_insights_delete_own"
  ON public.meta_ads_campaign_insights;

CREATE POLICY "meta_ads_campaign_insights_select_own"
  ON public.meta_ads_campaign_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meta_ads_campaign_insights_insert_own"
  ON public.meta_ads_campaign_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meta_ads_campaign_insights_delete_own"
  ON public.meta_ads_campaign_insights
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meta_ads_campaign_insights_user_period_idx
  ON public.meta_ads_campaign_insights (user_id, period_start DESC, period_end DESC);
