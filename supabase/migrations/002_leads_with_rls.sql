-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: leads table + RLS
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  company           TEXT,
  email             TEXT,
  phone             TEXT,
  source            TEXT,
  status            TEXT        NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','qualified','offer_sent','won','lost')),
  temperature       TEXT        NOT NULL DEFAULT 'cold'
                    CHECK (temperature IN ('cold','warm','hot','ready')),
  value             NUMERIC(12,2),
  notes             TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_own" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "leads_insert_own" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_update_own" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_delete_own" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- Reuse handle_updated_at() created in migration 001
CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
