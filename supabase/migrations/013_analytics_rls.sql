-- Secure analytics data per authenticated user.

ALTER TABLE public.monthly_metrics
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.quarter_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.monthly_metrics
  DROP CONSTRAINT IF EXISTS monthly_metrics_month_year_key;

ALTER TABLE public.quarter_reviews
  DROP CONSTRAINT IF EXISTS quarter_reviews_quarter_year_key;

CREATE UNIQUE INDEX IF NOT EXISTS monthly_metrics_user_month_year_key
  ON public.monthly_metrics(user_id, month, year);

CREATE UNIQUE INDEX IF NOT EXISTS quarter_reviews_user_quarter_year_key
  ON public.quarter_reviews(user_id, quarter, year);

ALTER TABLE public.monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarter_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_metrics_select_own" ON public.monthly_metrics;
DROP POLICY IF EXISTS "monthly_metrics_insert_own" ON public.monthly_metrics;
DROP POLICY IF EXISTS "monthly_metrics_update_own" ON public.monthly_metrics;
DROP POLICY IF EXISTS "monthly_metrics_delete_own" ON public.monthly_metrics;

CREATE POLICY "monthly_metrics_select_own"
  ON public.monthly_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "monthly_metrics_insert_own"
  ON public.monthly_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_metrics_update_own"
  ON public.monthly_metrics
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_metrics_delete_own"
  ON public.monthly_metrics
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quarter_reviews_select_own" ON public.quarter_reviews;
DROP POLICY IF EXISTS "quarter_reviews_insert_own" ON public.quarter_reviews;
DROP POLICY IF EXISTS "quarter_reviews_update_own" ON public.quarter_reviews;
DROP POLICY IF EXISTS "quarter_reviews_delete_own" ON public.quarter_reviews;

CREATE POLICY "quarter_reviews_select_own"
  ON public.quarter_reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "quarter_reviews_insert_own"
  ON public.quarter_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quarter_reviews_update_own"
  ON public.quarter_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quarter_reviews_delete_own"
  ON public.quarter_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER monthly_metrics_updated_at
  BEFORE UPDATE ON public.monthly_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER quarter_reviews_updated_at
  BEFORE UPDATE ON public.quarter_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
