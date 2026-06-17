-- ============================================================
-- Migration v7 → v8 — Email verification on registration
-- ------------------------------------------------------------
-- Adds:
--   · users.email_verification_code        (6-digit code, NULL once verified)
--   · users.email_verification_expires_at  (code expiry timestamp)
--   · users.is_email_verified              (gate for login)
--
-- Safe to run multiple times (IF NOT EXISTS guards).
-- Run against a database already migrated to v7.
-- ============================================================

BEGIN;

-- Verification code + expiry are NULL while no code is pending.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- New accounts must verify their email before logging in.
-- Default TRUE so existing rows keep access; the application sets it to
-- FALSE explicitly for every newly-registered account.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FAlSE;

COMMIT;



