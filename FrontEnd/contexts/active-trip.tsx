// Polls for active trip state every 5 seconds.
// Provides driver (TripStatusResponse) and passenger (ActivePassengerTrip) views globally.
// Only polls when the user is authenticated. Clears state on logout.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { ActivePassengerTrip, TripStatusResponse, tripLifecycleApi } from '@/services/api';

interface ActiveTripContextType {
  driverTrip: TripStatusResponse | null;
  passengerTrip: ActivePassengerTrip | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

const ActiveTripContext = createContext<ActiveTripContextType>({
  driverTrip: null,
  passengerTrip: null,
  isLoading: false,
  refresh: async () => {},
  clearCache: () => {},
});

const POLL_INTERVAL_MS = 5_000;

export function ActiveTripProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const { mode } = useUserMode();

  // mode === 'driver' AND role allows driving
  const isDriverMode = mode === 'driver' && user?.role === 'passenger+driver';

  const [driverTrip, setDriverTrip]       = useState<TripStatusResponse | null>(null);
  const [passengerTrip, setPassengerTrip] = useState<ActivePassengerTrip | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef  = useRef(AppState.currentState);

  // Clear everything on logout
  useEffect(() => {
    if (!token || !user) {
      setDriverTrip(null);
      setPassengerTrip(null);
    }
  }, [token, user]);

  const poll = useCallback(async () => {
    if (!token || !user) return;
    try {
      if (isDriverMode) {
        const trip = await tripLifecycleApi.getActiveDriver(token);
        setDriverTrip(trip ?? null);
        setPassengerTrip(null);
      } else {
        const trip = await tripLifecycleApi.getActivePassenger(token);
        setPassengerTrip(trip ?? null);
        setDriverTrip(null);
      }
    } catch {
      // Silently ignore polling errors to avoid noise
    }
  }, [token, user, isDriverMode]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await poll();
    setIsLoading(false);
  }, [poll]);

  const clearCache = useCallback(() => {
    setDriverTrip(null);
    setPassengerTrip(null);
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    // Immediate poll on mount or when mode/auth changes
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', state => {
      if (appStateRef.current.match(/inactive|background/) && state === 'active') {
        poll();
      }
      appStateRef.current = state;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [poll, token, user]);

  return (
    <ActiveTripContext.Provider value={{ driverTrip, passengerTrip, isLoading, refresh, clearCache }}>
      {children}
    </ActiveTripContext.Provider>
  );
}

export const useActiveTrip = () => useContext(ActiveTripContext);
