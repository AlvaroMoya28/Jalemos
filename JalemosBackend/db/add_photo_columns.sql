-- Migration: add photo URL columns for user profile photos and driver application face photo
-- Run once against the jalemos database.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

ALTER TABLE driver_applications
  ADD COLUMN IF NOT EXISTS face_photo TEXT;
