-- Stripe-sourced analytics fields.
-- These columns keep Stripe data traceable without rewriting imported history.

ALTER TABLE public.monthly_metrics
  ADD COLUMN IF NOT EXISTS stripe_gross_revenue numeric,
  ADD COLUMN IF NOT EXISTS stripe_net_revenue numeric,
  ADD COLUMN IF NOT EXISTS stripe_fees numeric,
  ADD COLUMN IF NOT EXISTS stripe_refunds numeric,
  ADD COLUMN IF NOT EXISTS stripe_charge_count integer,
  ADD COLUMN IF NOT EXISTS stripe_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_period_start date,
  ADD COLUMN IF NOT EXISTS stripe_period_end date;

CREATE TABLE IF NOT EXISTS public.stripe_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric NOT NULL DEFAULT 0,
  net_revenue numeric NOT NULL DEFAULT 0,
  fees numeric NOT NULL DEFAULT 0,
  refunds numeric NOT NULL DEFAULT 0,
  charge_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_sync_runs_select_own" ON public.stripe_sync_runs;
DROP POLICY IF EXISTS "stripe_sync_runs_insert_own" ON public.stripe_sync_runs;

CREATE POLICY "stripe_sync_runs_select_own"
  ON public.stripe_sync_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "stripe_sync_runs_insert_own"
  ON public.stripe_sync_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
