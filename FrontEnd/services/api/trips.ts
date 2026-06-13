// Trips + trip-lifecycle API and their shared types.
import { get, post } from "./client";

export interface PassengerSummary {
  bookingId: string;
  passengerId: string;
  firstName: string;
  lastName: string;
  seatsReserved: number;
  bookingState: 'pending' | 'confirmed' | 'boarded' | 'no_show' | 'cancelled' | 'completed';
  boardedAt: string | null;
}

export interface TripStatusResponse {
  tripId: string;
  state: 'scheduled' | 'boarding' | 'in_progress' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureAt: string;
  rate: number;
  driverFirstName: string;
  driverLastName: string;
  driverId: string;
  boardingStartedAt: string | null;
  journeyStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelDetails: string | null;
  passengers: PassengerSummary[];
}

export interface ActivePassengerTrip {
  tripId: string;
  tripState: 'boarding' | 'in_progress' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureAt: string;
  rate: number;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  driverRating: number;
  boardingStartedAt: string | null;
  journeyStartedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelDetails: string | null;
  isLateCancellation: boolean;
  bookingId: string;
  bookingState: 'pending' | 'confirmed' | 'boarded' | 'no_show' | 'cancelled' | 'completed';
  boardedAt: string | null;
}

export interface QrScanResult {
  bookingId: string;
  passengerId: string;
  firstName: string;
  lastName: string;
  seatsReserved: number;
  alreadyBoarded: boolean;
}

// My driver trips (all states) for the My Rides history screen
export const tripsApi = {
  getMine: (token: string) => get<any[]>('/api/trips/mine', token),
};

export const tripLifecycleApi = {
  getActiveDriver: (token: string) =>
    get<TripStatusResponse | null>('/api/trips/active-driver', token),

  getActivePassenger: (token: string) =>
    get<ActivePassengerTrip | null>('/api/trips/active-passenger', token),

  getStatus: (tripId: string, token: string) =>
    get<TripStatusResponse>(`/api/trips/${tripId}/status`, token),

  startBoarding: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/start-boarding`, {}, token),

  scanQr: (tripId: string, qrToken: string, token: string) =>
    post<QrScanResult>(`/api/trips/${tripId}/scan-qr`, { qrToken }, token),

  startJourney: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/start-journey`, {}, token),

  completeTrip: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/complete`, {}, token),

  cancelTrip: (tripId: string, reason: string, details: string | null, token: string) =>
    post<void>(`/api/trips/${tripId}/cancel`, { reason, details }, token),

  markNoShow: (bookingId: string, token: string) =>
    post<void>(`/api/trips/bookings/${bookingId}/no-show`, {}, token),
};
