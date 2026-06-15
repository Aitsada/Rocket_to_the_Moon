CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'user',
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  points INTEGER NOT NULL DEFAULT 500 CHECK (points >= 0),
  points_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bet_points INTEGER NOT NULL CHECK (bet_points > 0),
  crash_time NUMERIC(5, 2) NOT NULL CHECK (crash_time > 0 AND crash_time <= 10),
  stopped_at NUMERIC(5, 2),
  multiplier NUMERIC(6, 2),
  payout_points INTEGER NOT NULL DEFAULT 0 CHECK (payout_points >= 0),
  result VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_user_created_at
  ON game_rounds (user_id, created_at DESC);
