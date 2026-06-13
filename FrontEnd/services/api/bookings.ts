// Bookings API + "my bookings" history DTO.
import { get, post, request } from "./client";

export interface MyBookingDTO {
  bookingId: string;
  tripId: string;
  bookingState: string;
  seatsReserved: number;
  estimatedAmount: number;
  cancelReason: string | null;
  createdAt: string;
  origin: string;
  destination: string;
  departureAt: string | null;
  tripState: string | null;
  rate: number | null;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  driverRating: number;
  driverTrips: number;
  driverCreatedAt: string | null;
}

export const bookingsApi = {
  create: (tripId: string, seatsReserved: number, estimatedAmount: number | null, token?: string) =>
    post<any>(`/api/bookings`, { tripId, seatsReserved, estimatedAmount }, token),
  getAll: (token?: string) => get<any[]>(`/api/bookings`, token),
  getMine: (token: string) => get<MyBookingDTO[]>('/api/bookings/mine', token),
  getById: (id: string, token?: string) => get<any>(`/api/bookings/${id}`, token),
  delete: (id: string, token?: string) =>
    request<void>(`/api/bookings/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  cancel: (id: string, reason: string, details: string | null, token?: string) =>
    post<void>(`/api/bookings/${id}/cancel`, { reason, details }, token),
};
