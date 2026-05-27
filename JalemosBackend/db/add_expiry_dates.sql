-- Migration: document expiry dates + profile photo lock
-- Run AFTER the base schema is already created.

-- driver_applications: expiry dates for license and Dekra, plus renewal flag
ALTER TABLE driver_applications
  ADD COLUMN IF NOT EXISTS license_expiry_month SMALLINT CHECK (license_expiry_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS license_expiry_year  SMALLINT CHECK (license_expiry_year >= 2020),
  ADD COLUMN IF NOT EXISTS dekra_expiry_month   SMALLINT CHECK (dekra_expiry_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS dekra_expiry_year    SMALLINT CHECK (dekra_expiry_year >= 2020),
  ADD COLUMN IF NOT EXISTS is_renewal           BOOLEAN  NOT NULL DEFAULT FALSE;

-- users: copy expiry dates from approved application + lock profile photo after approval
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS license_expiry_month SMALLINT CHECK (license_expiry_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS license_expiry_year  SMALLINT CHECK (license_expiry_year >= 2020),
  ADD COLUMN IF NOT EXISTS dekra_expiry_month   SMALLINT CHECK (dekra_expiry_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS dekra_expiry_year    SMALLINT CHECK (dekra_expiry_year >= 2020),
  ADD COLUMN IF NOT EXISTS profile_photo_locked BOOLEAN  NOT NULL DEFAULT FALSE;
