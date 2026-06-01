-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Hot List fields on leads table
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_hot        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority      TEXT    NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS quick_note    TEXT;
