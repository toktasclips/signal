-- Restore May 2026 manual KPI values after an accidental Stripe sync overwrite.
-- Keeps Stripe-specific audit fields intact, but returns the business KPI fields
-- to the user-provided spreadsheet values.

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
)
UPDATE public.monthly_metrics
SET
  total_goal = 726000,
  new_deal_value = 548000,
  monthly_recurring_revenue = 548000,
  cash_collected = 726000,
  ad_spend = 29000,
  instagram_reach = 300000,
  instagram_impressions = 486000,
  cpm = 59.67,
  roas = 18.90,
  new_customers = 3,
  instagram_followers = 33500,
  engagement = NULL,
  shares = NULL,
  youtube_subscribers = 4000,
  youtube_views = 11600,
  youtube_watch_hours = 659,
  youtube_video_count = 3,
  email_list = 2217,
  software_expenses = 5000,
  other_expenses = NULL,
  profit = 514000,
  notes = '25 Mayıs screenshot import. Software subscriptions tracked separately.',
  updated_at = now()
FROM owner
WHERE monthly_metrics.user_id = owner.user_id
  AND monthly_metrics.month = 5
  AND monthly_metrics.year = 2026;
