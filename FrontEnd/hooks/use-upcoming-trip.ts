// Polls the driver's scheduled trips and surfaces the next one departing within
// 60 minutes, counting down to its boarding window (opens 5 min before
// departure). "Iniciar abordaje" starts boarding and hands off to the live
// driver trip. Idle while a trip is already active.

import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth';
import { get, tripLifecycleApi } from '@/services/api';

export interface UpcomingTrip {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
}

export function useUpcomingTrip(hasActiveTrip: boolean, refreshActiveTrip: () => void | Promise<void>, onError: (title: string, body: string) => void) {
  const { user, token } = useAuth();

  const [upcomingTrip, setUpcomingTrip]             = useState<UpcomingTrip | null>(null);
  const [minsUntilBoarding, setMinsUntilBoarding]   = useState<number | null>(null);
  const [upcomingExpanded, setUpcomingExpanded]     = useState(false);
  const [startBoardingLoading, setStartBoardingLoading] = useState(false);

  useEffect(() => {
    if (!token || !user?.id || hasActiveTrip) return;
    const check = async () => {
      try {
        const trips = await get<any[]>('/api/trips', token);
        // Sort ascending so the soonest trip is first
        const mine = trips
          .filter((t: any) => t.driverId === user.id && (t.state === 'Scheduled' || t.state === 'scheduled'))
          .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
        // Only surface the strip when departure is within the next 60 minutes
        const withinHour = mine.filter((t: any) => new Date(t.departureAt).getTime() - Date.now() <= 60 * 60_000);
        if (withinHour.length > 0) {
          const next = withinHour[0];
          setUpcomingTrip({ id: next.id, origin: next.origin, destination: next.destination, departureAt: next.departureAt });
          // minsUntilBoarding counts down to the 5-min-before-departure boarding window
          const msUntil = new Date(next.departureAt).getTime() - Date.now() - 5 * 60_000;
          setMinsUntilBoarding(msUntil > 0 ? Math.ceil(msUntil / 60_000) : 0);
        } else {
          setUpcomingTrip(null);
        }
      } catch { setUpcomingTrip(null); }
    };
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [token, user?.id, hasActiveTrip]);

  const handleStartBoarding = async () => {
    if (!upcomingTrip || !token) return;
    setStartBoardingLoading(true);
    try {
      await tripLifecycleApi.startBoarding(upcomingTrip.id, token);
      setUpcomingTrip(null);       // Hide the card immediately
      await refreshActiveTrip();   // Fetch driver's active boarding trip → triggers BoardingScreen
    } catch (e: any) {
      onError('No se puede iniciar', e.message ?? 'Inténtalo de nuevo.');
    } finally {
      setStartBoardingLoading(false);
    }
  };

  return {
    upcomingTrip, minsUntilBoarding,
    upcomingExpanded, setUpcomingExpanded,
    startBoardingLoading, handleStartBoarding,
  };
}
