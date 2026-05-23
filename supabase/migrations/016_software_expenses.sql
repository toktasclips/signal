-- Software subscriptions tracked separately from monthly KPI totals.

CREATE TABLE IF NOT EXISTS public.software_expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  monthly_cost numeric NOT NULL CHECK (monthly_cost >= 0),
  currency text NOT NULL DEFAULT 'USD',
  category text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.software_expense_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "software_expense_items_select_own" ON public.software_expense_items;
DROP POLICY IF EXISTS "software_expense_items_insert_own" ON public.software_expense_items;
DROP POLICY IF EXISTS "software_expense_items_update_own" ON public.software_expense_items;
DROP POLICY IF EXISTS "software_expense_items_delete_own" ON public.software_expense_items;

CREATE POLICY "software_expense_items_select_own"
  ON public.software_expense_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "software_expense_items_insert_own"
  ON public.software_expense_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "software_expense_items_update_own"
  ON public.software_expense_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "software_expense_items_delete_own"
  ON public.software_expense_items
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_software_expense_items_updated_at
  ON public.software_expense_items;

CREATE TRIGGER set_software_expense_items_updated_at
  BEFORE UPDATE ON public.software_expense_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
