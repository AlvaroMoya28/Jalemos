-- ============================================================
-- Migration v8 → v9 — Allow re-booking after passenger cancellation
-- ------------------------------------------------------------
-- The original UNIQUE constraint on (trip_id, passenger_id) blocked
-- a passenger from booking the same trip twice, even after cancelling.
-- Replace it with a partial unique index that only enforces uniqueness
-- for active (non-cancelled) bookings.
-- ============================================================

BEGIN;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS uq_booking_passenger_trip;

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_passenger_trip_active
    ON bookings (trip_id, passenger_id)
    WHERE state != 'cancelled';

COMMIT;
