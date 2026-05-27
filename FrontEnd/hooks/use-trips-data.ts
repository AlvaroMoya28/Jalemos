import { useAuth } from '@/contexts/auth';
import { ApiError, get } from '@/services/api';
import { useCallback, useState } from 'react';

// Shape returned by GET /api/trips (TripDto with embedded driver info)
interface TripResponse {
  id: string;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  driverMeanRating: number;
  driverTotalTrips: number;
  driverCreatedAt: string;
  vehicleId: string;
  rate: number;
  origin: string;
  destination: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureAt: string;
  totalSeats: number;
  availableSeats: number;
  state: string;
  createdAt: string;
  notes: string;
}

interface VehicleResponse {
  vehicleId: string;
  model: string;
  year: number;
  numPlate: string;
  color: string;
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
  vehicleModel?: string;
  vehiclePlate?: string;
}

function formatMemberSince(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(date);
}

function mapTripResponse(tr: TripResponse, vehicle: VehicleResponse | null): Trip {
  return {
    id: tr.id,
    driverId: tr.driverId,
    driverName: `${tr.driverFirstName} ${tr.driverLastName}`.trim() || 'Conductor desconocido',
    vehicleId: tr.vehicleId,
    rate: tr.rate,
    origin: tr.origin,
    destination: tr.destination,
    originLat: tr.originLatitude,
    originLng: tr.originLongitude,
    destinationLat: tr.destinationLatitude,
    destinationLng: tr.destinationLongitude,
    departureAt: tr.departureAt,
    totalSeats: tr.totalSeats,
    availableSeats: tr.availableSeats,
    state: 0,
    createdAt: tr.createdAt,
    notes: tr.notes,
    driverRating: tr.driverMeanRating,
    driverTripsCount: tr.driverTotalTrips,
    driverMemberSince: formatMemberSince(tr.driverCreatedAt),
    vehicleModel: vehicle?.model,
    vehiclePlate: vehicle?.numPlate,
  };
}

export function useTripsData() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTrips = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const tripsResponse = await get<TripResponse[]>('/api/trips', token);
      const mappedTrips: Trip[] = [];
      for (const t of tripsResponse) {
        let vehicle: VehicleResponse | null = null;
        try {
          vehicle = await get<VehicleResponse>(`/api/vehicles/${t.vehicleId}`, token);
        } catch {
          // vehicle info is non-critical — proceed without it
        }
        mappedTrips.push(mapTripResponse(t, vehicle));
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
  }, [token]);

  return { trips, isLoading, error, refreshTrips } as const;
}
