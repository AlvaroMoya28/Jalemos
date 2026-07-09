-- ============================================================================
-- Migration v12 -> v13 : Drop the (now unused) license_photo_back column
-- ============================================================================
-- The driver's licence is only captured on its front side now — the back is
-- identical across licences and added no value, so the app no longer collects
-- or displays it. This column is dead weight after that change.
--
-- OPTIONAL / DESTRUCTIVE: this permanently deletes any stored back-photo URLs.
-- The app works fine without running it (the column is simply left unmapped and
-- untouched), so only run it if you want to tidy up the schema.
--
--   psql "postgresql://postgres:PASSWORD@thomas.proxy.rlwy.net:44398/railway" -f migration_v12_to_v13_drop_license_back.sql
-- ============================================================================

ALTER TABLE driver_applications
    DROP COLUMN IF EXISTS license_photo_back;
