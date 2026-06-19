-- ============================================================
-- Migration v6 → v7 — Payments system (final sprint, Dev B / Epic 4)
-- ------------------------------------------------------------
-- Adds:
--   · payment_status enum            (pending, confirmed, failed)
--   · payment_methods columns        (card metadata + Stripe PM id)
--   · users.stripe_customer_id       (Stripe Customer reference)
--   · users.last_used_payment_method_id
--   · payments table                 (per-booking payment record)
--
-- Safe to run multiple times (IF NOT EXISTS guards).
-- Run against a database already migrated to v6.
-- ============================================================

-- New enum must be created outside a transaction block.
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

BEGIN;

-- Extend payment_methods with card metadata and Stripe reference.
-- last_four_digits / brand / expiry are NULL for cash and sinpe rows.
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS last_four_digits CHAR(4);
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS brand             VARCHAR(20);
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS expiry_month      SMALLINT;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS expiry_year       SMALLINT;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_favorite       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Stripe Customer ID on the user (null until first card is added).
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id            TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_used_payment_method_id   UUID
    REFERENCES payment_methods(payment_id) ON DELETE SET NULL;

-- Payments: one record per booking payment attempt.
CREATE TABLE IF NOT EXISTS payments (
    payment_id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id                UUID            NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    payer_id                  UUID            NOT NULL REFERENCES users(user_id)    ON DELETE RESTRICT,
    amount                    NUMERIC(10,2)   NOT NULL,
    method                    payment_type    NOT NULL,
    status                    payment_status  NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id  TEXT,
    payment_method_id         UUID            REFERENCES payment_methods(payment_id) ON DELETE SET NULL,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer   ON payments(payer_id);

COMMIT;
