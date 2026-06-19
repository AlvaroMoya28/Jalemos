-- ============================================================
-- Migration v10 → v11 — Trip Reports module (E3-1)
-- ------------------------------------------------------------
-- Adds:
--   · trip_report_type enum  — emergency | driver_report
--   · trip_report_status enum — open | verified | dismissed | action_taken
--   · notification_type value — emergency_report
--   · trip_reports table     — in-trip emergency & driver reports
-- ============================================================

-- ALTER TYPE is not transactional in PostgreSQL < 12; run outside BEGIN.
CREATE TYPE trip_report_type AS ENUM ('emergency', 'driver_report');
CREATE TYPE trip_report_status AS ENUM ('open', 'verified', 'dismissed', 'action_taken');

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'emergency_report';

BEGIN;

CREATE TABLE IF NOT EXISTS trip_reports (
    report_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID          NOT NULL REFERENCES trips(trip_id)  ON DELETE RESTRICT,
    driver_id       UUID          NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    reporter_id     UUID          NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    type            trip_report_type NOT NULL,
    status          trip_report_status NOT NULL DEFAULT 'open',
    description     TEXT          NOT NULL,
    admin_notes     TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_reports_trip     ON trip_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_reports_driver   ON trip_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_reports_reporter ON trip_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_trip_reports_status   ON trip_reports(status);

COMMIT;
