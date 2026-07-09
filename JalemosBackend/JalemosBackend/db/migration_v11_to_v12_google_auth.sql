-- ============================================================================
-- Migration v11 -> v12 : Google Sign-In support
-- ============================================================================
-- Adds a `google_id` column to store Google's stable user id (the "sub" claim)
-- and relaxes `password_hash` to allow NULL, since Google accounts authenticate
-- through Google and never set a password.
--
-- Run against the Railway Postgres database, e.g.:
--   psql "postgresql://postgres:PASSWORD@thomas.proxy.rlwy.net:44398/railway" -f migration_v11_to_v12_google_auth.sql
-- ============================================================================

BEGIN;

-- 1) Google users have no password.
ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;

-- 2) Store the Google account id. Nullable for local (email/password) accounts.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- 3) A Google id must be unique, but only when present (locals leave it NULL).
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_google_id
    ON users (google_id)
    WHERE google_id IS NOT NULL;

COMMIT;
