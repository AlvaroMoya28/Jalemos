// Search screen state + logic (E0-4): origin/destination/date/seats inputs, trip
// fetching, the passenger-visible ride list, and client-side filtering. Kept out of
// the screen component so the filtering rules are unit-testable in isolation.

import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useTripsData } from '@/hooks/use-trips-data';
import { useUserMode } from '@/contexts/user-mode';
import { bookingsApi } from '@/services/api';
import { filterRides, tripsToVisibleRides } from '@/utils/trip-filtering';

// Shortcut routes shown as chips below the search card.
export const QUICK_ROUTES = [
  { from: 'San Jose', to: 'Heredia' },
  { from: 'Cartago', to: 'San Jose' },
  { from: 'Alajuela', to: 'SJO' },
];

export function useTripSearch() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();
  const { trips, refreshTrips } = useTripsData();
  const { user, token } = useAuth();
  const { mode } = useUserMode();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seats, setSeats] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookings, setBookings] = useState<any[] | null>(null);

  // Refresh trips + the passenger's bookings each time the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      refreshTrips();
      let mounted = true;
      (async () => {
        if (!token) { setBookings([]); return; }
        try {
          const list = await bookingsApi.getAll(token);
          if (mounted) setBookings(Array.isArray(list) ? list : []);
        } catch {
          if (mounted) setBookings([]);
        }
      })();
      return () => { mounted = false; };
    }, [refreshTrips, token]),
  );

  const rides = useMemo(
    () => tripsToVisibleRides(trips, { mode, userId: user?.id, bookings }),
    [trips, mode, user?.id, bookings],
  );

  const filteredRides = useMemo(
    () => filterRides(rides, from, to, hasSearched),
    [rides, from, to, hasSearched],
  );

  const noTripsExist = !trips || trips.length === 0;

  const handleSearch = useCallback(async () => {
    showLoader('Buscando viajes...');
    try {
      await refreshTrips();
      setHasSearched(true);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader, refreshTrips]);

  const handleRidePress = useCallback(async (id: string) => {
    showLoader('Cargando viaje...');
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
    hideLoader();
    router.push({ pathname: '/ride-detail', params: { id } });
  }, [showLoader, hideLoader, router]);

  const clearSearch = useCallback(() => {
    setFrom('');
    setTo('');
    setSelectedDate(null);
    setSeats(1);
    setHasSearched(false);
  }, []);

  const applyQuickRoute = useCallback((routeFrom: string, routeTo: string) => {
    setFrom(routeFrom);
    setTo(routeTo);
    setHasSearched(true);
  }, []);

  return {
    from, setFrom, to, setTo, seats, setSeats,
    selectedDate, setSelectedDate, hasSearched,
    rides, filteredRides, noTripsExist,
    refreshTrips, handleSearch, handleRidePress, clearSearch, applyQuickRoute,
  };
}
