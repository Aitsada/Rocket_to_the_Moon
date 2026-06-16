ALTER TABLE game_rounds
  DROP CONSTRAINT IF EXISTS game_rounds_crash_time_check;

ALTER TABLE game_rounds
  ADD CONSTRAINT game_rounds_crash_time_check
  CHECK (crash_time > 0 AND crash_time <= 20);
