// Notifications API: in-app feed, unread badge, mark-read, push-token registration,
// per-user preferences, and the admin broadcast.
import {
  BroadcastPayload,
  NotificationDTO,
  NotificationPrefs,
} from "@/types/notifications";
import { del, get, patch, post, put } from "./client";

export const notificationsApi = {
  /** The current user's notifications (newest first). Pass mode to scope by role-mode. */
  list: (token: string, opts?: { unreadOnly?: boolean; take?: number; mode?: 'passenger' | 'driver' }) => {
    const qs = new URLSearchParams();
    if (opts?.unreadOnly) qs.set("unreadOnly", "true");
    if (opts?.take) qs.set("take", String(opts.take));
    if (opts?.mode) qs.set("mode", opts.mode);
    const q = qs.toString();
    return get<NotificationDTO[]>(`/api/notifications${q ? `?${q}` : ""}`, token);
  },

  /** Unread count for the bell badge, optionally scoped to a role-mode. */
  unreadCount: (token: string, mode?: 'passenger' | 'driver') =>
    get<{ count: number }>(`/api/notifications/unread-count${mode ? `?mode=${mode}` : ""}`, token),

  markRead: (id: string, token: string) =>
    patch<void>(`/api/notifications/${id}/read`, {}, token),

  markAllRead: (token: string) =>
    patch<{ updated: number }>("/api/notifications/read-all", {}, token),

  /** Delete all of the user's notifications. */
  clearAll: (token: string) =>
    del<{ deleted: number }>("/api/notifications", token),

  /** Register/refresh this device's Expo push token (pass null to clear). */
  registerPushToken: (expoToken: string | null, token: string) =>
    post<void>("/api/notifications/push-token", { token: expoToken }, token),

  getPreferences: (token: string) =>
    get<NotificationPrefs>("/api/notifications/preferences", token),

  updatePreferences: (prefs: NotificationPrefs, token: string) =>
    put<void>("/api/notifications/preferences", prefs, token),

  /** Admin only — send an announcement to a user segment. */
  broadcast: (payload: BroadcastPayload, token: string) =>
    post<{ recipients: number }>("/api/notifications/broadcast", payload, token),
};
