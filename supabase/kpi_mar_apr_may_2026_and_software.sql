-- KPI backfill for March, April, May 2026 plus software expense subscriptions.
-- Source: user-provided spreadsheet screenshots, 2026-05-23.

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
),
metric_rows AS (
  SELECT *
  FROM (VALUES
    (
      3, 2026,
      400000::numeric, 287000::numeric, 287000::numeric, 400000::numeric,
      22000::numeric, 245000::integer, 465000::integer, 48::numeric, 18.18::numeric,
      NULL::integer, 32100::integer, NULL::numeric, NULL::integer,
      NULL::integer, NULL::numeric, NULL::integer, 5000::numeric,
      NULL::numeric, 373000::numeric,
      '25 Mart screenshot import. Software subscriptions tracked separately.'
    ),
    (
      4, 2026,
      500000::numeric, 397000::numeric, 397000::numeric, 500000::numeric,
      33000::numeric, 450000::integer, 710000::integer, 46.48::numeric, 12.03::numeric,
      2::integer, 33000::integer, NULL::numeric, NULL::integer,
      3200::integer, 26000::numeric, 1500::integer, 5000::numeric,
      NULL::numeric, 359000::numeric,
      '25 Nisan screenshot import. Software subscriptions tracked separately.'
    ),
    (
      5, 2026,
      726000::numeric, 548000::numeric, 548000::numeric, 726000::numeric,
      29000::numeric, 300000::integer, 486000::integer, 59.67::numeric, 18.90::numeric,
      3::integer, 33500::integer, NULL::numeric, NULL::integer,
      4000::integer, 11600::numeric, 659::integer, 5000::numeric,
      NULL::numeric, 514000::numeric,
      '25 Mayıs screenshot import. Software subscriptions tracked separately.'
    )
  ) AS t(
    month, year, total_goal, new_deal_value, monthly_recurring_revenue,
    cash_collected, ad_spend, instagram_reach, instagram_impressions,
    cpm, roas, new_customers, instagram_followers, engagement, shares,
    youtube_subscribers, youtube_watch_hours, email_list, software_expenses,
    other_expenses, profit, notes
  )
),
software_rows AS (
  SELECT *
  FROM (VALUES
    ('Manychat', 25::numeric, 'USD', 'Marketing Automation'),
    ('Kit', 35::numeric, 'USD', 'Email Marketing'),
    ('ChatGPT', 20::numeric, 'USD', 'AI'),
    ('Claude', 20::numeric, 'USD', 'AI'),
    ('Skool', 10::numeric, 'USD', 'Community')
  ) AS t(name, monthly_cost, currency, category)
),
upsert_metrics AS (
  INSERT INTO public.monthly_metrics (
    user_id, month, year, total_goal, new_deal_value, monthly_recurring_revenue,
    cash_collected, ad_spend, instagram_reach, instagram_impressions,
    cpm, roas, new_customers, instagram_followers, engagement, shares,
    youtube_subscribers, youtube_watch_hours, email_list, software_expenses,
    other_expenses, profit, notes
  )
  SELECT
    owner.user_id, rows.month, rows.year, rows.total_goal, rows.new_deal_value,
    rows.monthly_recurring_revenue, rows.cash_collected, rows.ad_spend,
    rows.instagram_reach, rows.instagram_impressions, rows.cpm, rows.roas,
    rows.new_customers, rows.instagram_followers, rows.engagement, rows.shares,
    rows.youtube_subscribers, rows.youtube_watch_hours, rows.email_list,
    rows.software_expenses, rows.other_expenses, rows.profit, rows.notes
  FROM metric_rows rows
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
    youtube_watch_hours = EXCLUDED.youtube_watch_hours,
    email_list = EXCLUDED.email_list,
    software_expenses = EXCLUDED.software_expenses,
    other_expenses = EXCLUDED.other_expenses,
    profit = EXCLUDED.profit,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING 1
)
INSERT INTO public.software_expense_items (
  user_id, name, monthly_cost, currency, category, is_active
)
SELECT
  owner.user_id, rows.name, rows.monthly_cost, rows.currency, rows.category, true
FROM software_rows rows
CROSS JOIN owner
ON CONFLICT (user_id, name)
DO UPDATE SET
  monthly_cost = EXCLUDED.monthly_cost,
  currency = EXCLUDED.currency,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now();
