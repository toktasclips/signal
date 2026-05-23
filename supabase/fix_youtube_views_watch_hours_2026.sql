-- Correction for March, April, May 2026 YouTube metrics.
-- Separates total view count from watch hours.

WITH owner AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'mtoktas252@gmail.com'
  LIMIT 1
),
rows AS (
  SELECT *
  FROM (VALUES
    (3, 2026, 3100::integer, 3000::integer, 181::numeric, NULL::integer, NULL::integer),
    (4, 2026, 3200::integer, 26000::integer, 1500::numeric, 2::integer, 2020::integer),
    (5, 2026, 4000::integer, 11600::integer, 659::numeric, 3::integer, 2217::integer)
  ) AS t(
    month, year, youtube_subscribers, youtube_views, youtube_watch_hours,
    youtube_video_count, email_list
  )
)
UPDATE public.monthly_metrics
SET
  youtube_subscribers = rows.youtube_subscribers,
  youtube_views = rows.youtube_views,
  youtube_watch_hours = rows.youtube_watch_hours,
  youtube_video_count = rows.youtube_video_count,
  email_list = rows.email_list,
  updated_at = now()
FROM rows
CROSS JOIN owner
WHERE monthly_metrics.user_id = owner.user_id
  AND monthly_metrics.month = rows.month
  AND monthly_metrics.year = rows.year;
