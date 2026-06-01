CREATE TABLE IF NOT EXISTS public.user_monthly_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  body text NOT NULL,
  evidence text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_monthly_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_monthly_insights_select_own"
  ON public.user_monthly_insights;
DROP POLICY IF EXISTS "user_monthly_insights_insert_own"
  ON public.user_monthly_insights;
DROP POLICY IF EXISTS "user_monthly_insights_update_own"
  ON public.user_monthly_insights;
DROP POLICY IF EXISTS "user_monthly_insights_delete_own"
  ON public.user_monthly_insights;

CREATE POLICY "user_monthly_insights_select_own"
  ON public.user_monthly_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_monthly_insights_insert_own"
  ON public.user_monthly_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_monthly_insights_update_own"
  ON public.user_monthly_insights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_monthly_insights_delete_own"
  ON public.user_monthly_insights
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_user_monthly_insights_updated_at
  ON public.user_monthly_insights;

CREATE TRIGGER set_user_monthly_insights_updated_at
  BEFORE UPDATE ON public.user_monthly_insights
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS user_monthly_insights_user_period_idx
  ON public.user_monthly_insights (user_id, year DESC, month DESC, created_at DESC);
