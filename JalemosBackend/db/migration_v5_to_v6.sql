-- ============================================================
-- Migration v5 → v6 — Notifications system (final sprint, Dev A / Epic 1)
-- ------------------------------------------------------------
-- Adds:
--   · notification_type 'admin_broadcast'   (E1-5 admin announcements)
--   · users.expo_push_token                 (E1-3 Expo push delivery)
--   · users.notification_prefs (jsonb)      (E1-6 per-user opt-in/out)
--
-- Safe to run multiple times (guards with IF NOT EXISTS).
-- Run against a database already migrated to v5.
-- ============================================================

-- E1-5: new enum value. ALTER TYPE ... ADD VALUE must run outside a transaction
-- block, so it is kept separate from the column changes below.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_broadcast';

BEGIN;

-- E1-3: Expo push token for this user's current device (null until registered).
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- E1-6: notification preferences as { "<snake_case_type>": <bool> }.
-- Missing keys default to enabled; critical safety notifications ignore this.
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

-- E1-5: audience for role-mode filtering ('all' | 'passenger' | 'driver'). Lets a
-- profile that is both passenger and driver see only the notifications for the mode
-- it is currently in (plus 'all'). Event notifications default to 'all'.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all';

-- Partial index to keep the unread-count / unread-list queries fast.
CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications (user_id)
    WHERE read = FALSE;

COMMIT;
