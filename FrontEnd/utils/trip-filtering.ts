// Pure passenger-search filtering logic (extracted so it can be unit-tested without
// React/React Native). Used by useTripSearch.

import type { Ride } from '@/components/shared/RideCard';
import { dateLabel, timeLabel } from '@/utils/datetime';

/**
 * Decides which trips a passenger should see and maps them to the `Ride` UI shape.
 * Rules: hide past trips, own trips (as passenger), full trips, and already-booked trips.
 */
export function tripsToVisibleRides(
  trips: any[] | null | undefined,
  opts: { mode: string; userId?: string; bookings: any[] | null; now?: Date },
): Ride[] {
  if (!trips) return [];
  const now = opts.now ?? new Date();
  const visible = trips.filter((t) => {
    if (t.departureAt && new Date(t.departureAt) <= now) return false;
    if (opts.mode === 'passenger' && opts.userId && t.driverId === opts.userId) return false;
    if (opts.mode === 'passenger' && (typeof t.availableSeats !== 'number' || t.availableSeats <= 0)) return false;
    if (
      opts.mode === 'passenger' && opts.bookings &&
      opts.bookings.some((b: any) => b.tripId === t.id && b.passengerId === opts.userId && b.state !== 'Cancelled')
    ) return false;
    return true;
  });

  return visible.map((t) => {
    const nameParts = (t.driverName ?? '').split(' ');
    const firstName = nameParts[0] ?? '';
    const lastInitial = nameParts[1]?.[0] ?? '';
    const dep = new Date(t.departureAt);
    return {
      id: t.id,
      from: t.origin,
      to: t.destination,
      date: dateLabel(dep),
      time: timeLabel(dep.getHours(), dep.getMinutes()),
      price: t.rate,
      seats: t.availableSeats,
      driver: `${firstName} ${lastInitial}.`,
      rating: t.driverRating,
      avatar: `${firstName[0] ?? ''}${lastInitial}`.toUpperCase(),
    } as Ride;
  });
}

/** Filters rides by the typed origin/destination once a search has been run. */
export function filterRides(rides: Ride[], from: string, to: string, hasSearched: boolean): Ride[] {
  if (!hasSearched) return rides;
  return rides.filter((ride) => {
    const matchFrom = !from.trim() || ride.from.toLowerCase().includes(from.trim().toLowerCase());
    const matchTo = !to.trim() || ride.to.toLowerCase().includes(to.trim().toLowerCase());
    return matchFrom && matchTo;
  });
}
