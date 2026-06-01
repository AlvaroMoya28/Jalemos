-- Migration: driver_trips column + rating starts at 5.00
-- Run once on existing databases. Safe to re-run (IF NOT EXISTS / no-op UPDATE).

-- 1. Rating default now 5.00 (unchanged for users who already have real ratings)
ALTER TABLE users ALTER COLUMN mean_rating SET DEFAULT 5.00;
UPDATE users SET mean_rating = 5.00 WHERE mean_rating = 0.00;

-- 2. Separate trip counter for trips as a driver
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS driver_trips INTEGER NOT NULL DEFAULT 0
        CHECK (driver_trips >= 0);

-- 3. Trigger: COALESCE to 5.00 so rating never drops to NULL
CREATE OR REPLACE FUNCTION fn_update_mean_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET mean_rating = COALESCE(
        (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM ratings WHERE rated_id = NEW.rated_id),
        5.00
    )
    WHERE user_id = NEW.rated_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
