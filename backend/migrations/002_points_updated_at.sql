ALTER TABLE users
  ADD COLUMN IF NOT EXISTS points_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE users
SET points_updated_at = COALESCE(points_updated_at, updated_at, created_at, NOW());
