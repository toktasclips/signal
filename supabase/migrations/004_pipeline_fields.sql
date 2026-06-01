ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS closed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS win_note    text;
