-- Separate YouTube view count from watch hours.

ALTER TABLE public.monthly_metrics
  ADD COLUMN IF NOT EXISTS youtube_views integer,
  ADD COLUMN IF NOT EXISTS youtube_video_count integer;
