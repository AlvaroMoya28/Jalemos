// Updated by Claude Sonnet 4.6
// Global notifications state (E1-4): the user's feed, the unread badge count, and
// mark-read actions. Polls the unread count every 30s and registers this device's
// Expo push token once per session so the backend can deliver push (E1-3).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { notificationsApi } from '@/services/api';
import { NotificationDTO } from '@/types/notifications';
import { registerForPushNotificationsAsync } from '@/utils/push-notifications';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

interface NotificationsContextType {
  items: NotificationDTO[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  items: [],
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  clearAll: async () => {},
});

const POLL_INTERVAL_MS = 30_000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const { mode } = useUserMode();

  // Which audience filter to send: admins see everything; a passenger+driver in driver
  // mode sees driver+all; everyone else sees passenger+all.
  const apiMode: 'passenger' | 'driver' | undefined =
    user?.role === 'admin'
      ? undefined
      : mode === 'driver' && user?.role === 'passenger+driver'
        ? 'driver'
        : 'passenger';

  const [items, setItems]           = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading]   = useState(false);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef   = useRef(AppState.currentState);
  const registeredRef = useRef(false);

  // Clear everything on logout.
  useEffect(() => {
    if (!token || !user) {
      setItems([]);
      setUnreadCount(0);
      registeredRef.current = false;
    }
  }, [token, user]);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const { count } = await notificationsApi.unreadCount(token, apiMode);
      setUnreadCount(count);
    } catch {
      // ignore polling errors
    }
  }, [token, apiMode]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const list = await notificationsApi.list(token, { take: 50, mode: apiMode });
      setItems(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore — keep last good state
    } finally {
      setIsLoading(false);
    }
  }, [token, apiMode]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic: flip locally, then persist.
    setItems((prev) => prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    if (!token) return;
    try {
      await notificationsApi.markRead(id, token);
    } catch {
      // best-effort
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    setUnreadCount(0);
    if (!token) return;
    try {
      await notificationsApi.markAllRead(token);
    } catch {
      // best-effort
    }
  }, [token]);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnreadCount(0);
    if (!token) return;
    try {
      await notificationsApi.clearAll(token);
    } catch {
      // best-effort
    }
  }, [token]);

  // Register this device's Expo push token once per authenticated session.
  useEffect(() => {
    if (!token || registeredRef.current) return;
    registeredRef.current = true;
    (async () => {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) {
        try {
          await notificationsApi.registerPushToken(expoToken, token);
        } catch {
          // ignore — token will retry next session
        }
      }
    })();
  }, [token]);

  // Poll the unread count; refresh on foreground; bump when a push arrives.
  useEffect(() => {
    if (!token || !user) return;

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);

    const appSub = AppState.addEventListener('change', (state) => {
      if (appStateRef.current.match(/inactive|background/) && state === 'active') {
        fetchUnread();
      }
      appStateRef.current = state;
    });

    let received: { remove: () => void } | null = null;
    if (!IS_EXPO_GO) {
      const Notifications = require('expo-notifications');
      received = Notifications.addNotificationReceivedListener(() => fetchUnread());
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      appSub.remove();
      received?.remove();
    };
  }, [token, user, fetchUnread]);

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, isLoading, refresh, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
