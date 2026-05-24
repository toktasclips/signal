-- Meta/Facebook Ads sourced analytics fields.
-- These fields keep ad-platform data traceable without overwriting manual KPI history.

ALTER TABLE public.monthly_metrics
  ADD COLUMN IF NOT EXISTS meta_ad_spend numeric,
  ADD COLUMN IF NOT EXISTS meta_reach integer,
  ADD COLUMN IF NOT EXISTS meta_impressions integer,
  ADD COLUMN IF NOT EXISTS meta_cpm numeric,
  ADD COLUMN IF NOT EXISTS meta_clicks integer,
  ADD COLUMN IF NOT EXISTS meta_ctr numeric,
  ADD COLUMN IF NOT EXISTS meta_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_period_start date,
  ADD COLUMN IF NOT EXISTS meta_period_end date;

CREATE TABLE IF NOT EXISTS public.meta_ads_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_ads_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meta_ads_sync_runs_select_own" ON public.meta_ads_sync_runs;
DROP POLICY IF EXISTS "meta_ads_sync_runs_insert_own" ON public.meta_ads_sync_runs;

CREATE POLICY "meta_ads_sync_runs_select_own"
  ON public.meta_ads_sync_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meta_ads_sync_runs_insert_own"
  ON public.meta_ads_sync_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
