-- ============================================================
--  JALEMOS — Migration v4 → v5
--  Trip Lifecycle: boarding phase, QR tokens, full ratings
--
--  Apply against an existing v4 database.
--  All changes are additive — no data is destroyed.
-- ============================================================

-- 1. QR tokens: stable UUID per user, used as QR code payload for boarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- 2. Trip state: add 'boarding' phase between scheduled and in_progress
ALTER TYPE trip_state ADD VALUE IF NOT EXISTS 'boarding' AFTER 'scheduled';

-- 3. Trip lifecycle timestamps and cancellation metadata
ALTER TABLE trips ADD COLUMN IF NOT EXISTS boarding_started_at  TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS journey_started_at   TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed_at         TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancel_reason        VARCHAR(60);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cancel_details       TEXT;

-- 4. Booking states: add 'boarded' (QR scanned) and 'no_show' (grace period elapsed)
ALTER TYPE booking_state ADD VALUE IF NOT EXISTS 'boarded'  AFTER 'confirmed';
ALTER TYPE booking_state ADD VALUE IF NOT EXISTS 'no_show'  AFTER 'boarded';

-- 5. Booking lifecycle tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS boarded_at     TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason  VARCHAR(60);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_details TEXT;

-- 6. Notification types for lifecycle events
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'trip_boarding';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'qr_scanned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'trip_started';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'driver_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'passenger_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'no_show_marked';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rating_reminder';

-- 7. Notification body for richer push messages
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;

-- 8. Update available_seats trigger:
--    Only release seats when transitioning pending/confirmed → cancelled.
--    boarded → cancelled does NOT free seats (passenger was in the vehicle).
CREATE OR REPLACE FUNCTION fn_update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.state IN ('pending', 'confirmed') THEN
        UPDATE trips
        SET available_seats = available_seats - NEW.seats_reserved
        WHERE trip_id = NEW.trip_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.state IN ('pending', 'confirmed') AND NEW.state = 'cancelled' THEN
            UPDATE trips
            SET available_seats = LEAST(total_seats, available_seats + OLD.seats_reserved)
            WHERE trip_id = NEW.trip_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Index on qr_token for fast lookup during QR scan
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_qr_token ON users(qr_token);
