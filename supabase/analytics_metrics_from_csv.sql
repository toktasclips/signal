-- Import from: KPIs, Outreaach + Hot List - KPI Tracking.csv
-- Replace the email below if you want to import the data for another account.

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
),
deleted_misdated_rows AS (
  DELETE FROM public.monthly_metrics
  USING owner
  WHERE monthly_metrics.user_id = owner.user_id
    AND monthly_metrics.year = 2025
    AND monthly_metrics.month BETWEEN 1 AND 5
  RETURNING 1
),
rows AS (
  SELECT
    month::integer,
    year::integer,
    total_goal::numeric,
    new_deal_value::numeric,
    monthly_recurring_revenue::numeric,
    cash_collected::numeric,
    ad_spend::numeric,
    instagram_reach::integer,
    instagram_impressions::integer,
    cpm::numeric,
    roas::numeric,
    new_customers::integer,
    instagram_followers::integer,
    engagement::numeric,
    shares::integer,
    youtube_subscribers::integer,
    youtube_views::integer,
    youtube_watch_hours::numeric,
    youtube_video_count::integer,
    email_list::integer,
    software_expenses::numeric,
    other_expenses::numeric,
    profit::numeric,
    notes::text
  FROM (VALUES
    (9, 2025, 285365, 285365, NULL, 280365, 52000, 203482, 528712, 98.35, 5.49, NULL, NULL, NULL, NULL, NULL, 5300, 361.8, NULL, NULL, 0, 0, 233365, NULL),
    (10, 2025, 615400, 400000, NULL, 615400, 48000, 176934, 461921, 103.91, 8.33, NULL, NULL, NULL, NULL, NULL, 3100, 184.1, NULL, NULL, 0, 0, 352000, NULL),
    (11, 2025, 481500, 481500, NULL, 481500, 71410, 367, 838944, 85.12, 6.74, NULL, NULL, NULL, NULL, NULL, 5100, 238, NULL, NULL, 0, 0, 410090, NULL),
    (12, 2025, 765000, 510370, NULL, 510370, 67056, 413445, 920765, 72.83, 7.61, NULL, 22000, NULL, NULL, NULL, 7000, 396.2, NULL, NULL, 0, 0, 443314, NULL),
    (1, 2026, 680000, NULL, NULL, 543500, 35142, 374907, 754815, 46.56, 15.47, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 508358, NULL),
    (2, 2026, 763456, NULL, NULL, 381575, 28859, 318022, 611330, 47.21, 13.22, 25, 31800, 1000000, 53, 2850, 3700, 200, 4, 2200, 4000, NULL, 348716, NULL),
    (3, 2026, 400000, 287000, 287000, 400000, 22000, 245000, 465000, 48, 18.18, NULL, 32100, NULL, NULL, 3100, 3000, 181, NULL, NULL, 5000, NULL, 373000, NULL),
    (4, 2026, 500000, 397000, 397000, 500000, 33000, 450000, 710000, 46.48, 12.03, 2, 33000, NULL, NULL, 3200, 26000, 1500, 2, 2020, 5000, NULL, 359000, NULL),
    (5, 2026, 726000, 548000, 548000, 726000, 29000, 300000, 486000, 59.67, 18.90, 3, 33500, NULL, NULL, 4000, 11600, 659, 3, 2217, 5000, NULL, 514000, NULL)
  ) AS t(
    month, year, total_goal, new_deal_value, monthly_recurring_revenue,
    cash_collected, ad_spend, instagram_reach, instagram_impressions,
    cpm, roas, new_customers, instagram_followers, engagement, shares,
    youtube_subscribers, youtube_views, youtube_watch_hours, youtube_video_count,
    email_list, software_expenses,
    other_expenses, profit, notes
  )
)
INSERT INTO public.monthly_metrics (
  user_id, month, year, total_goal, new_deal_value, monthly_recurring_revenue,
  cash_collected, ad_spend, instagram_reach, instagram_impressions,
  cpm, roas, new_customers, instagram_followers, engagement, shares,
  youtube_subscribers, youtube_views, youtube_watch_hours, youtube_video_count,
  email_list, software_expenses,
  other_expenses, profit, notes
)
SELECT
  owner.user_id, rows.month, rows.year, rows.total_goal, rows.new_deal_value,
  rows.monthly_recurring_revenue, rows.cash_collected, rows.ad_spend,
  rows.instagram_reach, rows.instagram_impressions, rows.cpm, rows.roas,
  rows.new_customers, rows.instagram_followers, rows.engagement, rows.shares,
  rows.youtube_subscribers, rows.youtube_views, rows.youtube_watch_hours,
  rows.youtube_video_count, rows.email_list,
  rows.software_expenses, rows.other_expenses, rows.profit, rows.notes
FROM rows
CROSS JOIN owner
ON CONFLICT (user_id, month, year)
DO UPDATE SET
  total_goal = EXCLUDED.total_goal,
  new_deal_value = EXCLUDED.new_deal_value,
  monthly_recurring_revenue = EXCLUDED.monthly_recurring_revenue,
  cash_collected = EXCLUDED.cash_collected,
  ad_spend = EXCLUDED.ad_spend,
  instagram_reach = EXCLUDED.instagram_reach,
  instagram_impressions = EXCLUDED.instagram_impressions,
  cpm = EXCLUDED.cpm,
  roas = EXCLUDED.roas,
  new_customers = EXCLUDED.new_customers,
  instagram_followers = EXCLUDED.instagram_followers,
  engagement = EXCLUDED.engagement,
  shares = EXCLUDED.shares,
  youtube_subscribers = EXCLUDED.youtube_subscribers,
  youtube_views = EXCLUDED.youtube_views,
  youtube_watch_hours = EXCLUDED.youtube_watch_hours,
  youtube_video_count = EXCLUDED.youtube_video_count,
  email_list = EXCLUDED.email_list,
  software_expenses = EXCLUDED.software_expenses,
  other_expenses = EXCLUDED.other_expenses,
  profit = EXCLUDED.profit,
  notes = EXCLUDED.notes,
  updated_at = now();
