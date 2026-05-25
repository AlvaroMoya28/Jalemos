import { User } from '@/contexts/auth';
import { ApiError, get } from '@/services/api';
import { useCallback, useState } from 'react';

interface TripResponse {
  id: string;
  driverId: string;
  vehicleId: string;
  rate: number;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  departureAt: string;
  totalSeats: number;
  availableSeats: number;
  state: number;
  createdAt: string;
  notes: string;
}

interface DriverResponse {
  id: string;
  firstName: string;
  lastName: string;
  meanRating: number;
  totalTrips: number;
  createdAt: string;
}

export interface Trip {
  id: string;
  driverName: string;
  driverId: string;
  vehicleId: string;
  rate: number;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureAt: string;
  totalSeats: number;
  availableSeats: number;
  state: number;
  createdAt: string;
  notes: string;
  driverRating: number;
  driverTripsCount?: number;
  driverMemberSince?: string;
}

function mapTripResponseToTrip(tr: TripResponse, user: User | null): Trip {
  const originLat = tr.originLat ?? tr.originLatitude ?? 0;
  const originLng = tr.originLng ?? tr.originLongitude ?? 0;
  const destinationLat = tr.destinationLat ?? tr.destinationLatitude ?? 0;
  const destinationLng = tr.destinationLng ?? tr.destinationLongitude ?? 0;

  return {
    id: tr.id,
    driverId: tr.driverId,
    driverName: user ? `${user.firstName} ${user.lastName}` : 'Conductor desconocido',
    vehicleId: tr.vehicleId,
    rate: tr.rate,
    origin: tr.origin,
    destination: tr.destination,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    departureAt: tr.departureAt,
    totalSeats: tr.totalSeats,
    availableSeats: tr.availableSeats,
    state: tr.state,
    createdAt: tr.createdAt,
    notes: tr.notes,
    driverRating: user ? user.rating : 0,
    driverTripsCount: user ? (user.tripsCount ?? 0) : 0,
    driverMemberSince: user?.memberSince,
  };
}

function formatMemberSince(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-CR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function mapDriverResponseToUser(driver: DriverResponse): User {
  return {
    id: driver.id,
    username: '',
    email: '',
    firstName: driver.firstName,
    lastName: driver.lastName,
    role: 'passenger+driver',
    avatar: `${driver.firstName[0] ?? ''}${driver.lastName[0] ?? ''}`.toUpperCase(),
    rating: driver.meanRating,
    tripsCount: driver.totalTrips,
    memberSince: formatMemberSince(driver.createdAt),
  };
}

export function useTripsData() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tripsResponse = await get<TripResponse[]>('/api/trips');
      const mappedTrips: Trip[] = [];
      for (const t of tripsResponse) {
        try {
          const driverResponse = await get<DriverResponse>(`/api/users/${t.driverId}`);
          const driver = mapDriverResponseToUser(driverResponse);
          const trip = mapTripResponseToTrip(t, driver);
          trip.driverName = `${driver.firstName} ${driver.lastName}`.trim();
          mappedTrips.push(trip);
        } catch (err) {
          console.error(`Error fetching driver for trip ${t.id}:`, err);
        }
      }
      setTrips(mappedTrips);
    } catch (err) {
      console.error('Error fetching trips:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar los viajes');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { trips, isLoading, error, refreshTrips } as const;
}
