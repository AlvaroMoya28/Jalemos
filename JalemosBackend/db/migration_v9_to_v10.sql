-- ============================================================
-- Migration v9 → v10 — Late-cancellation rating window (E2-2)
-- ------------------------------------------------------------
-- Adds:
--   · bookings.is_late_cancel      — true when passenger cancelled <30 min before departure
--   · notification_type enum value — passenger_cancelled_late
--   · notifications.passenger_id   — UUID of the passenger to rate (late-cancel only)
-- ============================================================

-- ALTER TYPE is not transactional in PostgreSQL < 12; run it outside a BEGIN block.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'passenger_cancelled_late';

BEGIN;

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS is_late_cancel BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS passenger_id UUID REFERENCES users(user_id) ON DELETE SET NULL;

COMMIT;
