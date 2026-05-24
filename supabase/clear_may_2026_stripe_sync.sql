-- Remove accidental Stripe sync metadata from the May 2026 KPI period.
-- Manual May KPI values should be restored with
-- restore_may_2026_manual_kpi_after_stripe.sql first or alongside this.

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
)
UPDATE public.monthly_metrics
SET
  stripe_gross_revenue = NULL,
  stripe_net_revenue = NULL,
  stripe_fees = NULL,
  stripe_refunds = NULL,
  stripe_charge_count = NULL,
  stripe_period_start = NULL,
  stripe_period_end = NULL,
  stripe_synced_at = NULL,
  updated_at = now()
FROM owner
WHERE monthly_metrics.user_id = owner.user_id
  AND monthly_metrics.month = 5
  AND monthly_metrics.year = 2026;

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
)
DELETE FROM public.stripe_sync_runs
USING owner
WHERE stripe_sync_runs.user_id = owner.user_id
  AND stripe_sync_runs.period_start = DATE '2026-04-25'
  AND stripe_sync_runs.period_end = DATE '2026-05-25';
