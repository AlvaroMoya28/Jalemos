-- ============================================================
-- Migration v7 → v8 — Email verification on registration
-- ------------------------------------------------------------
-- Adds:
--   · users.email_verification_code        (6-digit code, NULL once verified)
--   · users.email_verification_expires_at  (code expiry timestamp)
--   · users.is_email_verified              (gate for login)
--   · users.qr_email_last_sent_at          (cooldown for "email me my QR")
--
-- Safe to run multiple times (IF NOT EXISTS guards).
-- Run against a database already migrated to v7.
-- ============================================================

BEGIN;

-- Verification code + expiry are NULL while no code is pending.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- New accounts must verify their email before logging in.
-- Default FALSE so every newly-registered account starts unverified; EF Core omits
-- the bool when it equals the CLR default (false), so the DB default must be FALSE.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: users that already existed when this migration runs predate the email
-- verification feature, so they must keep their access (mark them verified).
-- Adding the column above stamped every existing row with FALSE, which would
-- otherwise lock them all out of login.
--
-- This is idempotent and safe to re-run: a genuinely-unverified NEW account always
-- has a pending email_verification_code (set at registration, cleared on verify),
-- so the "code IS NULL" guard touches only legacy rows — never real pending users.
UPDATE users
   SET is_email_verified = TRUE
 WHERE is_email_verified = FALSE
   AND email_verification_code IS NULL;

-- Last time the user emailed themselves their boarding QR (NULL = never).
-- Used to enforce a 5-minute cooldown server-side.
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_email_last_sent_at TIMESTAMPTZ;

COMMIT;



